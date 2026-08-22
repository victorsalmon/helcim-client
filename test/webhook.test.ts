import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { fc, test as fcTest } from '@fast-check/vitest';
import { verifyHelcimWebhook, parseHelcimWebhookBody } from '../src/index.js';

// Mirror of the Helcim signing algorithm — used to build valid signatures for tests.
function sign(
  verifierTokenBase64: string,
  webhookId: string,
  timestamp: string,
  rawBody: string
): string {
  const key = Buffer.from(verifierTokenBase64, 'base64');
  return createHmac('sha256', key)
    .update(`${webhookId}.${timestamp}.${rawBody}`, 'utf8')
    .digest('base64');
}

const VERIFIER = Buffer.from('test-verifier-secret').toString('base64');

describe('verifyHelcimWebhook', () => {
  it('accepts a valid signature', () => {
    const id = 'evt_123';
    const ts = '1700000000';
    const body = '{"type":"cardTransaction","id":42}';
    const sig = sign(VERIFIER, id, ts, body);
    expect(verifyHelcimWebhook(id, ts, body, `v1,${sig}`, VERIFIER)).toBe(true);
  });

  it('accepts a signature without the version prefix', () => {
    const id = 'evt_123';
    const ts = '1700000000';
    const body = '{"type":"cardTransaction","id":42}';
    const sig = sign(VERIFIER, id, ts, body);
    expect(verifyHelcimWebhook(id, ts, body, sig, VERIFIER)).toBe(true);
  });

  it('accepts when multiple signatures are present and one matches', () => {
    const id = 'evt_123';
    const ts = '1700000000';
    const body = '{"type":"cardTransaction","id":42}';
    const sig = sign(VERIFIER, id, ts, body);
    const wrongSig = sign(Buffer.from('wrong').toString('base64'), id, ts, body);
    expect(verifyHelcimWebhook(id, ts, body, `v1,${wrongSig} v1,${sig}`, VERIFIER)).toBe(true);
  });

  it('rejects a forged signature', () => {
    const id = 'evt_123';
    const ts = '1700000000';
    const body = '{"type":"cardTransaction","id":42}';
    expect(verifyHelcimWebhook(id, ts, body, 'v1,forged', VERIFIER)).toBe(false);
  });

  it('rejects when the webhook id differs', () => {
    const id = 'evt_123';
    const ts = '1700000000';
    const body = '{"type":"cardTransaction","id":42}';
    const sig = sign(VERIFIER, id, ts, body);
    expect(verifyHelcimWebhook('evt_other', ts, body, `v1,${sig}`, VERIFIER)).toBe(false);
  });

  it('rejects when the body differs (tampering)', () => {
    const id = 'evt_123';
    const ts = '1700000000';
    const body = '{"type":"cardTransaction","id":42}';
    const sig = sign(VERIFIER, id, ts, body);
    const tampered = '{"type":"cardTransaction","id":999}';
    expect(verifyHelcimWebhook(id, ts, tampered, `v1,${sig}`, VERIFIER)).toBe(false);
  });

  it('rejects when the timestamp differs (replay attack)', () => {
    const id = 'evt_123';
    const ts = '1700000000';
    const body = '{"type":"cardTransaction","id":42}';
    const sig = sign(VERIFIER, id, ts, body);
    expect(verifyHelcimWebhook(id, '1800000000', body, `v1,${sig}`, VERIFIER)).toBe(false);
  });

  it('rejects when the verifier token is wrong', () => {
    const id = 'evt_123';
    const ts = '1700000000';
    const body = '{"type":"cardTransaction","id":42}';
    const sig = sign(VERIFIER, id, ts, body);
    const wrongVerifier = Buffer.from('wrong-secret').toString('base64');
    expect(verifyHelcimWebhook(id, ts, body, `v1,${sig}`, wrongVerifier)).toBe(false);
  });

  it('rejects when any required field is empty', () => {
    expect(verifyHelcimWebhook('', 'ts', 'body', 'sig', VERIFIER)).toBe(false);
    expect(verifyHelcimWebhook('id', '', 'body', 'sig', VERIFIER)).toBe(false);
    expect(verifyHelcimWebhook('id', 'ts', '', 'sig', VERIFIER)).toBe(false);
    expect(verifyHelcimWebhook('id', 'ts', 'body', '', VERIFIER)).toBe(false);
    expect(verifyHelcimWebhook('id', 'ts', 'body', 'sig', '')).toBe(false);
  });

  it('rejects an invalid base64 verifier token', () => {
    const id = 'evt_123';
    const ts = '1700000000';
    const body = '{"type":"cardTransaction","id":42}';
    expect(verifyHelcimWebhook(id, ts, body, 'v1,sig', '!!!not-base64!!!')).toBe(false);
  });

  it('handles whitespace-padded signatures', () => {
    const id = 'evt_123';
    const ts = '1700000000';
    const body = '{"type":"cardTransaction","id":42}';
    const sig = sign(VERIFIER, id, ts, body);
    expect(verifyHelcimWebhook(id, ts, body, `  v1,${sig}  `, VERIFIER)).toBe(true);
  });
});

describe('parseHelcimWebhookBody', () => {
  it('extracts type and transaction id from a cardTransaction event', () => {
    const result = parseHelcimWebhookBody('{"type":"cardTransaction","id":42}');
    expect(result.type).toBe('cardTransaction');
    expect(result.transactionId).toBe('42');
  });

  it('extracts nested transaction id from a terminalCancel event', () => {
    const body = '{"type":"terminalCancel","data":{"transactionId":99}}';
    const result = parseHelcimWebhookBody(body);
    expect(result.type).toBe('terminalCancel');
    expect(result.transactionId).toBe('99');
  });

  it('returns nulls for invalid JSON', () => {
    const result = parseHelcimWebhookBody('not json');
    expect(result.type).toBeNull();
    expect(result.transactionId).toBeNull();
  });

  it('returns nulls for non-object JSON', () => {
    const result = parseHelcimWebhookBody('[1,2,3]');
    expect(result.type).toBeNull();
    expect(result.transactionId).toBeNull();
  });

  it('returns null transactionId when no id field is present', () => {
    const result = parseHelcimWebhookBody('{"type":"someEvent"}');
    expect(result.type).toBe('someEvent');
    expect(result.transactionId).toBeNull();
  });

  it('extracts a direct subscriptionId from a subscriptionPayment event', () => {
    const result = parseHelcimWebhookBody('{"type":"subscriptionPayment","subscriptionId":88}');
    expect(result.type).toBe('subscriptionPayment');
    expect(result.subscriptionId).toBe('88');
    expect(result.transactionId).toBeNull();
  });

  it('extracts a string direct subscriptionId', () => {
    const result = parseHelcimWebhookBody('{"type":"subscriptionPayment","subscriptionId":"sub-abc"}');
    expect(result.subscriptionId).toBe('sub-abc');
  });

  it('extracts a numeric direct subscriptionId as a string', () => {
    const result = parseHelcimWebhookBody('{"type":"subscriptionPayment","subscriptionId":123}');
    expect(result.subscriptionId).toBe('123');
  });

  it('extracts a nested string subscriptionId from record.data', () => {
    const body = '{"type":"subscriptionPayment","data":{"subscriptionId":"sub-xyz"}}';
    const result = parseHelcimWebhookBody(body);
    expect(result.subscriptionId).toBe('sub-xyz');
  });

  it('extracts a nested subscriptionId from record.data', () => {
    const body = '{"type":"subscriptionPayment","data":{"subscriptionId":77}}';
    const result = parseHelcimWebhookBody(body);
    expect(result.subscriptionId).toBe('77');
  });

  it('extracts a nested numeric subscriptionId from record.data as a string', () => {
    const body = '{"type":"subscriptionPayment","data":{"subscriptionId":456}}';
    const result = parseHelcimWebhookBody(body);
    expect(result.subscriptionId).toBe('456');
  });

  it('extracts a nested string transactionId from record.data', () => {
    const body = '{"type":"terminalCancel","data":{"transactionId":"txn-1"}}';
    const result = parseHelcimWebhookBody(body);
    expect(result.transactionId).toBe('txn-1');
  });

  it('prefers a direct subscriptionId over a nested one', () => {
    const body = '{"type":"subscriptionPayment","subscriptionId":1,"data":{"subscriptionId":2}}';
    const result = parseHelcimWebhookBody(body);
    expect(result.subscriptionId).toBe('1');
  });

  it('returns null subscriptionId when neither direct nor nested is present', () => {
    const result = parseHelcimWebhookBody('{"type":"cardTransaction","id":42}');
    expect(result.subscriptionId).toBeNull();
  });

  it('returns null subscriptionId when record.data is not an object', () => {
    const body = '{"type":"subscriptionPayment","data":"not-an-object"}';
    const result = parseHelcimWebhookBody(body);
    expect(result.subscriptionId).toBeNull();
  });

  it('returns null subscriptionId when record.data.subscriptionId is a non-string/number type', () => {
    const body = '{"type":"subscriptionPayment","data":{"subscriptionId":true}}';
    const result = parseHelcimWebhookBody(body);
    expect(result.subscriptionId).toBeNull();
  });

  it('extracts both a nested transactionId and a nested subscriptionId from record.data', () => {
    const body = '{"type":"subscriptionPayment","data":{"transactionId":10,"subscriptionId":20}}';
    const result = parseHelcimWebhookBody(body);
    expect(result.transactionId).toBe('10');
    expect(result.subscriptionId).toBe('20');
  });
});

// ─── Property-based tests ───────────────────────────────────────────────────

fcTest.prop([
  fc.string({ minLength: 1, maxLength: 50 }),
  fc.string({ minLength: 1, maxLength: 20 }),
  fc.string({ minLength: 1, maxLength: 200 }),
])('a valid signature always verifies, a tampered body never does', (id, ts, body) => {
  fc.pre(!id.includes('.') && !ts.includes('.'));
  const sig = sign(VERIFIER, id, ts, body);
  expect(verifyHelcimWebhook(id, ts, body, `v1,${sig}`, VERIFIER)).toBe(true);
  // Tamper with the body — should fail unless the body is unchanged.
  const tampered = body + 'x';
  expect(verifyHelcimWebhook(id, ts, tampered, `v1,${sig}`, VERIFIER)).toBe(false);
});

fcTest.prop([fc.string({ minLength: 1 })])(
  'verifyHelcimWebhook never throws for any signature input',
  (sig) => {
    expect(() =>
      verifyHelcimWebhook('id', 'ts', 'body', sig, VERIFIER)
    ).not.toThrow();
  }
);
