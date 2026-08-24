import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createHelcimClient,
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
  type HelcimConfig,
} from '../src/index.js';
import { mockFetch, assertHeaderAbsent, assertBodyField, assertBodyFieldAbsent, TEST_CONFIG } from './helpers.js';

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

beforeEach(() => vi.restoreAllMocks());

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

  it('decodeAddress returns null when the raw value is a primitive', () => {
    expect(decodeCustomer({ billingAddress: 'not-an-object' }).billingAddress).toBeNull();
    expect(decodeCustomer({ billingAddress: 42 }).billingAddress).toBeNull();
    expect(decodeCustomer({ shippingAddress: null }).shippingAddress).toBeNull();
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

  it('rejects an empty verifier token even if the signature matches the empty-key HMAC', () => {
    const id = 'evt_123';
    const ts = '1700000000';
    const body = '{"type":"cardTransaction","id":42}';
    const emptyKeySig = sign('', id, ts, body);
    expect(verifyHelcimWebhook(id, ts, body, `v1,${emptyKeySig}`, '')).toBe(false);
  });

  it('rejects a base64 token that decodes to zero bytes even with a valid empty-key HMAC', () => {
    const id = 'evt_123';
    const ts = '1700000000';
    const body = '{"type":"cardTransaction","id":42}';
    const emptyKeySig = sign('=', id, ts, body);
    expect(verifyHelcimWebhook(id, ts, body, `v1,${emptyKeySig}`, '=')).toBe(false);
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

  it('continues past a malformed signature entry to find a valid one', () => {
    const id = 'evt_123';
    const ts = '1700000000';
    const body = '{"type":"cardTransaction","id":42}';
    const sig = sign(VERIFIER, id, ts, body);
    // The first entry has a short signature whose Buffer length mismatches the
    // expected digest, causing timingSafeEqual to throw. The second entry is
    // valid and must still be accepted.
    expect(verifyHelcimWebhook(id, ts, body, `v1,short ${sig}`, VERIFIER)).toBe(true);
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

  it('returns null innerData when dataWrapper.data is null', () => {
    const r = parseHelcimPayEventMessage(JSON.stringify({ status: 1, data: { data: null, hash: 'h' } }));
    expect(r.data).toBeNull();
    expect(r.hash).toBe('h');
  });

  it('returns null data when parsed JSON is a primitive', () => {
    const r = parseHelcimPayEventMessage(JSON.stringify(42));
    expect(r.data).toBeNull();
  });
});

// ─── Client request helper edge cases ───────────────────────────────────────

describe('client request query and header guards', () => {
  it('filters out a query param whose value is null', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [] } });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.getCustomers({ page: 1, customerCode: null as any });
    const url = new URL(calls[0].url);
    expect(url.searchParams.get('page')).toBe('1');
    expect(url.searchParams.has('customerCode')).toBe(false);
  });

  it('omits the idempotency-key header on GET requests where idempotencyKey is undefined', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [] } });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.getCustomers({});
    assertHeaderAbsent(calls[0], 'idempotency-key');
  });

  it('parses a null JSON response as an empty body', async () => {
    const { fetchImpl } = mockFetch({ text: 'null' });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const result = await client.getCustomer(1);
    expect(result.id).toBe(0);
    expect(result.customerCode).toBe('');
  });

  it('falls back to the HTTP status message when a non-2xx response body is the JSON literal null', async () => {
    const { fetchImpl } = mockFetch({ status: 404, text: 'null' });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(client.getCustomer(1)).rejects.toThrow(/failed with HTTP 404/);
  });
});

// ─── Bank account response second-key coverage ───────────────────────────────

describe('bank account response second-key coverage', () => {
  it('createBankAccount reads id from "Id" and message from "Message" when camelCase keys are absent', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { data: { Id: 45367, Message: 'Successfully created new bank account' } },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const result = await client.createBankAccount(123, {
      accountCorporate: 1,
      accountType: 1,
      bankAccountNumber: '123456789',
      city: 'Calgary',
      countryAlpha2: 'CA',
      provinceAlpha2: 'AB',
      postalCode: 'T2P5E9',
      streetAddress: '440 2 Ave SW',
    });
    expect(result.id).toBe(45367);
    expect(result.message).toBe('Successfully created new bank account');
  });

  it('createBankAccount defaults message to "" when the response has no message field', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: { Id: 45367 } } });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const result = await client.createBankAccount(123, {
      accountCorporate: 1,
      accountType: 1,
      bankAccountNumber: '123456789',
      city: 'Calgary',
      countryAlpha2: 'CA',
      provinceAlpha2: 'AB',
      postalCode: 'T2P5E9',
      streetAddress: '440 2 Ave SW',
    });
    expect(result.id).toBe(45367);
    expect(result.message).toBe('');
  });

  it('getCustomerBankAccounts returns an empty array when the response has no bank account fields', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const result = await client.getCustomerBankAccounts(123);
    expect(result).toEqual([]);
  });
});

// ─── Payment API edge cases ──────────────────────────────────────────────────

describe('payment API mutation survivors', () => {
  it('processPreauth sends the required amount, currency, ipAddress, and cardData fields', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { transaction: { transactionId: 1, status: 'APPROVED' } },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.processPreauth({
      amount: 100,
      currency: 'CAD',
      ipAddress: '1.1.1.1',
      cardData: { cardToken: 'tok' },
    });
    const body = JSON.parse(calls[0].body!);
    expect(body.amount).toBe(100);
    expect(body.currency).toBe('CAD');
    expect(body.ipAddress).toBe('1.1.1.1');
    expect(body.cardData).toEqual({ cardToken: 'tok' });
  });

  it('processPreauth throws when cardData is a non-object truthy value', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(client.processPreauth({
      amount: 100,
      currency: 'CAD',
      ipAddress: '1.1.1.1',
      cardData: 'not-an-object' as any,
    })).rejects.toThrow(/cardData/);
  });
});
