import { describe, it, expect } from 'vitest';
import { fc, test as fcTest } from '@fast-check/vitest';
import { createHash } from 'node:crypto';
import { validateHelcimPayHash, parseHelcimPayEventMessage } from '../src/index.js';

function computeHash(data: Record<string, unknown>, secret: string): string {
  return createHash('sha256')
    .update(JSON.stringify(data) + secret, 'utf8')
    .digest('hex');
}

describe('validateHelcimPayHash', () => {
  it('accepts a valid hash', () => {
    const data = { transactionId: 42, status: 'APPROVED', amount: 1.0 };
    const secret = 'secret-token-abc';
    const hash = computeHash(data, secret);
    expect(validateHelcimPayHash(data, hash, secret)).toBe(true);
  });

  it('rejects a tampered data object', () => {
    const data = { transactionId: 42, status: 'APPROVED' };
    const secret = 'secret-token-abc';
    const hash = computeHash(data, secret);
    const tampered = { ...data, status: 'DECLINED' };
    expect(validateHelcimPayHash(tampered, hash, secret)).toBe(false);
  });

  it('rejects a wrong secret token', () => {
    const data = { transactionId: 42 };
    const hash = computeHash(data, 'right-secret');
    expect(validateHelcimPayHash(data, hash, 'wrong-secret')).toBe(false);
  });

  it('rejects a wrong hash', () => {
    expect(validateHelcimPayHash({ a: 1 }, 'wronghash', 'secret')).toBe(false);
  });

  it('is case-insensitive on the hash (hex digest)', () => {
    const data = { x: 1 };
    const secret = 's';
    const hash = computeHash(data, secret);
    expect(validateHelcimPayHash(data, hash.toUpperCase(), secret)).toBe(true);
  });

  it('rejects when any required field is empty', () => {
    expect(validateHelcimPayHash({}, 'hash', 'secret')).toBe(false);
    expect(validateHelcimPayHash({ a: 1 }, '', 'secret')).toBe(false);
    expect(validateHelcimPayHash({ a: 1 }, 'hash', '')).toBe(false);
  });

  it('handles unicode characters in data (matches Helcim escaped-unicode hashing)', () => {
    const data = { name: 'José — café' };
    const secret = 's';
    const hash = computeHash(data, secret);
    expect(validateHelcimPayHash(data, hash, secret)).toBe(true);
  });
});

describe('parseHelcimPayEventMessage', () => {
  it('extracts status, data, and hash from a SUCCESS event', () => {
    const innerData = { transactionId: 42, status: 'APPROVED' };
    const msg = JSON.stringify({
      status: 1,
      data: { data: innerData, hash: computeHash(innerData, 'secret') },
    });
    const result = parseHelcimPayEventMessage(msg);
    expect(result.status).toBe(1);
    expect(result.data).toEqual(innerData);
    expect(result.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns nulls for invalid JSON', () => {
    const result = parseHelcimPayEventMessage('not json');
    expect(result.status).toBeNull();
    expect(result.data).toBeNull();
    expect(result.hash).toBeNull();
  });

  it('returns nulls for non-object JSON', () => {
    const result = parseHelcimPayEventMessage('[1,2]');
    expect(result.status).toBeNull();
  });

  it('handles string status coerced to number', () => {
    const msg = JSON.stringify({ status: '1', data: { data: {}, hash: 'h' } });
    const result = parseHelcimPayEventMessage(msg);
    expect(result.status).toBe(1);
  });

  it('returns null data when inner data is missing', () => {
    const msg = JSON.stringify({ status: 1, data: { hash: 'h' } });
    const result = parseHelcimPayEventMessage(msg);
    expect(result.data).toBeNull();
    expect(result.hash).toBe('h');
  });
});

// ─── Property-based tests ───────────────────────────────────────────────────

fcTest.prop([
  fc.record({
    transactionId: fc.integer({ min: 1, max: 999999 }),
    amount: fc.double({ min: 0.01, max: 1000, noNaN: true }),
    status: fc.constantFrom('APPROVED', 'DECLINED'),
  }),
  fc.string({ minLength: 8, maxLength: 40 }),
])('a valid hash always verifies; a tampered amount never does', (data, secret) => {
  const hash = computeHash(data, secret);
  expect(validateHelcimPayHash(data, hash, secret)).toBe(true);
  const tampered = { ...data, amount: data.amount + 100 };
  expect(validateHelcimPayHash(tampered, hash, secret)).toBe(false);
});

fcTest.prop([fc.string()])(
  'parseHelcimPayEventMessage never throws for any string input',
  (msg) => {
    expect(() => parseHelcimPayEventMessage(msg)).not.toThrow();
  }
);
