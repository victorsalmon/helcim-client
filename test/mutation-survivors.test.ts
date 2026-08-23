import { describe, it, expect } from 'vitest';
import {
  decodeCustomer,
  decodePaymentPlan,
  decodeSubscription,
  decodeInvoice,
  decodeBankAccount,
  decodeACHTransaction,
  verifyHelcimWebhook,
  parseHelcimWebhookBody,
  parseHelcimPayEventMessage,
  firstNumber,
  firstString,
} from '../src/index.js';

// ─── Surviving-mutant hunters ────────────────────────────────────────────────
//
// These tests target boundary cases that the original suite left uncovered,
// especially default array values, missing optional booleans, addOnId coercion
// edge cases, and webhook/HelcimPay parsing branches.

function sign(verifierBase64: string, id: string, ts: string, body: string): string {
  const { createHmac } = require('node:crypto');
  const key = Buffer.from(verifierBase64, 'base64');
  const signedContent = `${id}.${ts}.${body}`;
  return createHmac('sha256', key).update(signedContent).digest().toString('base64');
}

const VERIFIER = Buffer.from('test-verifier-secret').toString('base64');

describe('decoder default arrays and missing fields', () => {
  it('decodeCustomer returns empty cards when field is absent', () => {
    expect(decodeCustomer({}).cards).toEqual([]);
  });

  it('decodePaymentPlan returns empty addOnIds when field is absent', () => {
    expect(decodePaymentPlan({}).addOnIds).toEqual([]);
  });

  it('decodeSubscription returns empty payments and addOnIds when absent', () => {
    const r = decodeSubscription({});
    expect(r.payments).toEqual([]);
    expect(r.addOnIds).toEqual([]);
  });

  it('decodeInvoice returns empty lineItems when field is absent', () => {
    expect(decodeInvoice({}).lineItems).toEqual([]);
  });

  it('decodePaymentPlan coerces addOnIds and preserves NaN', () => {
    const r = decodePaymentPlan({ addOnIds: [NaN, '5', 'x'] });
    expect(r.addOnIds[0]).toBeNaN();
    expect(r.addOnIds[1]).toBe(5);
    expect(r.addOnIds[2]).toBe(0);
  });

  it('decodeSubscription coerces addOnIds and preserves NaN', () => {
    const r = decodeSubscription({ addOnIds: [NaN, '5', 'x'] });
    expect(r.addOnIds[0]).toBeNaN();
    expect(r.addOnIds[1]).toBe(5);
    expect(r.addOnIds[2]).toBe(0);
  });

  it('decodeBankAccount returns null verified/ready when absent', () => {
    const r = decodeBankAccount({});
    expect(r.verified).toBeNull();
    expect(r.ready).toBeNull();
  });

  it('decodeACHTransaction returns null test when absent', () => {
    expect(decodeACHTransaction({}).test).toBeNull();
  });
});

describe('decoder first-key coverage for StringLiteral survivors', () => {
  it('decodes bankAccountNumberL4 from the first key bankAccountNumberL4', () => {
    expect(decodeBankAccount({ bankAccountNumberL4: '1234' }).bankAccountNumberL4).toBe('1234');
  });

  it('decodes bankAccountL4 from the second key bankAccountL4', () => {
    expect(decodeACHTransaction({ bankAccountL4: '5678' }).bankAccountL4).toBe('5678');
  });
});

describe('util edge cases for survived conditionals', () => {
  it('firstNumber skips raw NaN values', () => {
    expect(firstNumber({ a: NaN }, ['a'])).toBeNull();
  });

  it('firstNumber skips boolean values', () => {
    expect(firstNumber({ a: true }, ['a'])).toBeNull();
  });

  it('firstString skips raw NaN values', () => {
    expect(firstString({ a: NaN, b: 'x' }, ['a', 'b'])).toBe('x');
  });
});

describe('webhook edge cases for surviving mutants', () => {
  it('rejects a whitespace verifier token that decodes to zero bytes', () => {
    const id = 'evt_123';
    const ts = '1700000000';
    const body = '{"type":"cardTransaction","id":42}';
    const sig = sign(VERIFIER, id, ts, body);
    expect(verifyHelcimWebhook(id, ts, body, `v1,${sig}`, '   ')).toBe(false);
  });

  it('rejects an empty sig entry even when a later entry is valid', () => {
    const id = 'evt_123';
    const ts = '1700000000';
    const body = '{"type":"cardTransaction","id":42}';
    const sig = sign(VERIFIER, id, ts, body);
    // Only the empty v1, entry is present; it must not be treated as a match
    expect(verifyHelcimWebhook(id, ts, body, 'v1,', VERIFIER)).toBe(false);
  });

  it('returns null transactionId when record.data is a primitive', () => {
    const r = parseHelcimWebhookBody('{"type":"terminalCancel","data":"not-an-object"}');
    expect(r.transactionId).toBeNull();
  });

  it('returns null subscriptionId when nested subscriptionId is a boolean', () => {
    const r = parseHelcimWebhookBody('{"type":"subscriptionPayment","data":{"subscriptionId":true}}');
    expect(r.subscriptionId).toBeNull();
  });

  it('returns an empty raw object for primitive JSON payloads', () => {
    expect(parseHelcimWebhookBody('42').raw).toEqual({});
    expect(parseHelcimWebhookBody('"hello"').raw).toEqual({});
    expect(parseHelcimWebhookBody('true').raw).toEqual({});
    expect(parseHelcimWebhookBody('null').raw).toEqual({});
  });

  it('returns null type and transactionId for direct non-string/non-number id', () => {
    const r = parseHelcimWebhookBody('{"type":"cardTransaction","id":true}');
    expect(r.type).toBe('cardTransaction');
    expect(r.transactionId).toBeNull();
  });

  it('stringifies a direct string transactionId', () => {
    const r = parseHelcimWebhookBody('{"type":"cardTransaction","id":"txn-abc"}');
    expect(r.transactionId).toBe('txn-abc');
  });

  it('returns null type when type is a number', () => {
    const r = parseHelcimWebhookBody('{"type":42,"id":1}');
    expect(r.type).toBeNull();
    expect(r.transactionId).toBe('1');
  });

  it('returns null nested transactionId when it is a boolean', () => {
    const r = parseHelcimWebhookBody('{"type":"terminalCancel","data":{"transactionId":true}}');
    expect(r.transactionId).toBeNull();
  });

  it('rejects a webhook when the webhookId guard is bypassed and sig matches empty id', () => {
    const ts = '1700000000';
    const body = '{"type":"cardTransaction","id":42}';
    const sig = sign(VERIFIER, '', ts, body);
    expect(verifyHelcimWebhook('', ts, body, `v1,${sig}`, VERIFIER)).toBe(false);
  });

  it('rejects a webhook when the timestamp guard is bypassed and sig matches empty ts', () => {
    const id = 'evt_123';
    const body = '{"type":"cardTransaction","id":42}';
    const sig = sign(VERIFIER, id, '', body);
    expect(verifyHelcimWebhook(id, '', body, `v1,${sig}`, VERIFIER)).toBe(false);
  });

  it('rejects a webhook when the rawBody guard is bypassed and sig matches empty body', () => {
    const id = 'evt_123';
    const ts = '1700000000';
    const sig = sign(VERIFIER, id, ts, '');
    expect(verifyHelcimWebhook(id, ts, '', `v1,${sig}`, VERIFIER)).toBe(false);
  });
});

describe('helcimPay parsing edge cases', () => {
  it('returns null data when outer.data is a boolean', () => {
    const r = parseHelcimPayEventMessage(JSON.stringify({ status: 1, data: true }));
    expect(r.data).toBeNull();
    expect(r.hash).toBeNull();
  });

  it('returns null data when outer.data is an array of objects', () => {
    const r = parseHelcimPayEventMessage(JSON.stringify({ status: 1, data: [{ data: {}, hash: 'h' }] }));
    expect(r.data).toBeNull();
    expect(r.hash).toBeNull();
  });
});
