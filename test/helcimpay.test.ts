import { describe, it, expect } from 'vitest';
import { fc, test as fcTest } from '@fast-check/vitest';
import { createHash } from 'node:crypto';
import { validateHelcimPayHash, parseHelcimPayEventMessage } from '../src/index.js';

function computeHash(data: Record<string, unknown>, secret: string): string {
  return createHash('sha256')
    .update(JSON.stringify(data) + secret, 'utf8')
    .digest('hex');
}

function computeHelcimHash(data: Record<string, unknown>, secret: string): string {
  const json = JSON.stringify(data).replace(/[\u007f-\uffff]/g, (character) =>
    Array.from(character)
      .map((codePoint) => `\\u${codePoint.codePointAt(0)!.toString(16).padStart(4, '0')}`)
      .join('')
  );
  return createHash('sha256').update(json + secret, 'utf8').digest('hex');
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

  it('trims surrounding whitespace on the hash before comparing', () => {
    const data = { x: 1 };
    const secret = 's';
    const hash = computeHash(data, secret);
    expect(validateHelcimPayHash(data, `  ${hash}  `, secret)).toBe(true);
  });

  it('rejects when any required field is empty', () => {
    expect(validateHelcimPayHash({}, 'hash', 'secret')).toBe(false);
    expect(validateHelcimPayHash({ a: 1 }, '', 'secret')).toBe(false);
    expect(validateHelcimPayHash({ a: 1 }, 'hash', '')).toBe(false);
  });

  it('rejects null data even when the hash would match', () => {
    const data = null as any;
    const secret = 's';
    const hash = computeHash(data, secret); // sha256('null' + secret)
    expect(validateHelcimPayHash(data, hash, secret)).toBe(false);
  });

  it('rejects null hash without hashing', () => {
    const data = { a: 1 };
    const secret = 's';
    expect(validateHelcimPayHash(data, null as any, secret)).toBe(false);
  });

  it('rejects when only hash is empty', () => {
    const data = { a: 1 };
    const secret = 's';
    const hash = computeHash(data, secret);
    expect(validateHelcimPayHash(data, '', secret)).toBe(false);
  });

  it('rejects null secretToken even when the hash would match', () => {
    const data = { a: 1 };
    const hash = computeHash(data, 'null'); // matches sha256(jsonEncoded + 'null')
    expect(validateHelcimPayHash(data, hash, null as any)).toBe(false);
  });

  it('rejects when only secretToken is empty', () => {
    const data = { a: 1 };
    const secret = 's';
    const hash = computeHash(data, secret);
    expect(validateHelcimPayHash(data, hash, '')).toBe(false);
  });

  it('handles unicode characters using Helcim escaped-unicode hashing', () => {
    const data = { name: 'José — café' };
    const secret = 's';
    const hash = computeHelcimHash(data, secret);
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

  it('returns nulls when parsed JSON is a primitive (number)', () => {
    const result = parseHelcimPayEventMessage('42');
    expect(result.status).toBeNull();
    expect(result.data).toBeNull();
    expect(result.hash).toBeNull();
  });

  it('returns nulls when parsed JSON is a string', () => {
    const result = parseHelcimPayEventMessage('"hello"');
    expect(result.status).toBeNull();
    expect(result.data).toBeNull();
    expect(result.hash).toBeNull();
  });

  it('returns nulls when parsed JSON is null', () => {
    const result = parseHelcimPayEventMessage('null');
    expect(result.status).toBeNull();
    expect(result.data).toBeNull();
    expect(result.hash).toBeNull();
  });

  it('returns nulls when parsed JSON is a boolean', () => {
    const result = parseHelcimPayEventMessage('true');
    expect(result.status).toBeNull();
    expect(result.data).toBeNull();
    expect(result.hash).toBeNull();
  });

  it('returns null status when status is neither number nor string', () => {
    const msg = JSON.stringify({ status: true, data: { data: {}, hash: 'h' } });
    const result = parseHelcimPayEventMessage(msg);
    expect(result.status).toBeNull();
  });

  it('returns null status when status is a non-numeric string', () => {
    const msg = JSON.stringify({ status: 'abc', data: { data: {}, hash: 'h' } });
    const result = parseHelcimPayEventMessage(msg);
    expect(result.status).toBeNull();
  });

  it('coerces string status "0" to null (0 is falsy, so || null kicks in)', () => {
    const msg = JSON.stringify({ status: '0', data: { data: {}, hash: 'h' } });
    const result = parseHelcimPayEventMessage(msg);
    // Number('0') || null → 0 || null → null (0 is falsy)
    expect(result.status).toBeNull();
  });

  it('coerces non-zero numeric string status to number', () => {
    const msg = JSON.stringify({ status: '42', data: { data: {}, hash: 'h' } });
    const result = parseHelcimPayEventMessage(msg);
    expect(result.status).toBe(42);
  });

  it('returns null data when outer.data is not an object (is array)', () => {
    const msg = JSON.stringify({ status: 1, data: [1, 2, 3] });
    const result = parseHelcimPayEventMessage(msg);
    expect(result.data).toBeNull();
    expect(result.hash).toBeNull();
  });

  it('returns null data when outer.data is a primitive', () => {
    const msg = JSON.stringify({ status: 1, data: 'not-object' });
    const result = parseHelcimPayEventMessage(msg);
    expect(result.data).toBeNull();
    expect(result.hash).toBeNull();
  });

  it('returns null data when outer.data is null', () => {
    const msg = JSON.stringify({ status: 1, data: null });
    const result = parseHelcimPayEventMessage(msg);
    expect(result.data).toBeNull();
    expect(result.hash).toBeNull();
  });

  it('returns null data when inner data is an array', () => {
    const msg = JSON.stringify({ status: 1, data: { data: [1, 2], hash: 'h' } });
    const result = parseHelcimPayEventMessage(msg);
    expect(result.data).toBeNull();
    expect(result.hash).toBe('h');
  });

  it('returns null data when inner data is a primitive', () => {
    const msg = JSON.stringify({ status: 1, data: { data: 42, hash: 'h' } });
    const result = parseHelcimPayEventMessage(msg);
    expect(result.data).toBeNull();
    expect(result.hash).toBe('h');
  });

  it('returns null data when inner data is null', () => {
    const msg = JSON.stringify({ status: 1, data: { data: null, hash: 'h' } });
    const result = parseHelcimPayEventMessage(msg);
    expect(result.data).toBeNull();
    expect(result.hash).toBe('h');
  });

  it('returns null hash when dataWrapper.hash is not a string', () => {
    const msg = JSON.stringify({ status: 1, data: { data: {}, hash: 123 } });
    const result = parseHelcimPayEventMessage(msg);
    expect(result.hash).toBeNull();
  });

  it('returns null hash when dataWrapper.hash is missing', () => {
    const msg = JSON.stringify({ status: 1, data: { data: {} } });
    const result = parseHelcimPayEventMessage(msg);
    expect(result.hash).toBeNull();
  });

  it('returns status and null data/hash when outer.data is missing entirely', () => {
    const msg = JSON.stringify({ status: 1 });
    const result = parseHelcimPayEventMessage(msg);
    expect(result.status).toBe(1);
    expect(result.data).toBeNull();
    expect(result.hash).toBeNull();
  });

  it('returns status from outer object even when data is missing', () => {
    const msg = JSON.stringify({ status: 5 });
    const result = parseHelcimPayEventMessage(msg);
    expect(result.status).toBe(5);
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

fcTest.prop([
  fc.stringOf(fc.constantFrom('é', '—', '中', '😀', 'a', 'Z', ' '), { minLength: 1, maxLength: 40 })
    .filter((value) => /[^\x00-\x7f]/.test(value)),
  fc.string({ minLength: 1, maxLength: 40 }),
])('validates every Helcim escaped-Unicode string payload', (name, secret) => {
  const data = { name };
  const hash = computeHelcimHash(data, secret);
  expect(validateHelcimPayHash(data, hash, secret)).toBe(true);
});

fcTest.prop([fc.string()])(
  'parseHelcimPayEventMessage never throws for any string input',
  (msg) => {
    expect(() => parseHelcimPayEventMessage(msg)).not.toThrow();
  }
);
