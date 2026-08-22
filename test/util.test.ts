import { describe, it, expect } from 'vitest';
import { fc, test as fcTest } from '@fast-check/vitest';
import {
  sha256,
  generateIdempotencyKey,
  firstString,
  firstNumber,
  firstBoolean,
  firstArray,
  optionalString,
} from '../src/index.js';

describe('util — sha256', () => {
  it('produces a 64-char hex digest', () => {
    expect(sha256('hello')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('matches known SHA-256 vector', () => {
    // SHA-256("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    expect(sha256('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('is deterministic for the same input', () => {
    expect(sha256('abc')).toBe(sha256('abc'));
  });

  it('differs for different inputs', () => {
    expect(sha256('abc')).not.toBe(sha256('abd'));
  });

  it('produces correct hash for unicode input (UTF-8 encoding)', () => {
    // SHA-256("café") = 850f7dc43910ff890f8879c0ed26fe697c93a067ad93a7d50f466a7028a9bf4e
    expect(sha256('café')).toBe('850f7dc43910ff890f8879c0ed26fe697c93a067ad93a7d50f466a7028a9bf4e');
  });

  it('produces correct hash for ASCII input', () => {
    // SHA-256("hello") = 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
    expect(sha256('hello')).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });
});

describe('util — generateIdempotencyKey', () => {
  it('produces a 25-char alphanumeric string', () => {
    const key = generateIdempotencyKey();
    expect(key).toHaveLength(25);
    expect(key).toMatch(/^[a-f0-9]+$/);
  });

  it('produces unique keys across many calls', () => {
    const keys = new Set<string>();
    for (let i = 0; i < 1000; i++) keys.add(generateIdempotencyKey());
    expect(keys.size).toBe(1000);
  });
});

describe('util — firstString', () => {
  it('returns the first non-empty string value for the given keys', () => {
    expect(firstString({ a: '', b: 'x' }, ['a', 'b'])).toBe('x');
    expect(firstString({ a: 'y', b: 'x' }, ['a', 'b'])).toBe('y');
  });

  it('coerces finite numbers to strings', () => {
    expect(firstString({ a: 42 }, ['a'])).toBe('42');
  });

  it('skips non-finite numbers', () => {
    expect(firstString({ a: NaN, b: 'x' }, ['a', 'b'])).toBe('x');
  });

  it('trims whitespace', () => {
    expect(firstString({ a: '  hi  ' }, ['a'])).toBe('hi');
  });

  it('returns null when no key matches', () => {
    expect(firstString({ a: '' }, ['a', 'b'])).toBeNull();
  });

  it('skips non-string non-number values (boolean, object, null)', () => {
    expect(firstString({ a: true, b: 'x' }, ['a', 'b'])).toBe('x');
    expect(firstString({ a: null, b: 'y' }, ['a', 'b'])).toBe('y');
    expect(firstString({ a: { x: 1 }, b: 'z' }, ['a', 'b'])).toBe('z');
  });

  it('skips whitespace-only string values', () => {
    expect(firstString({ a: '   ', b: 'x' }, ['a', 'b'])).toBe('x');
  });

  it('coerces 0 to "0"', () => {
    expect(firstString({ a: 0 }, ['a'])).toBe('0');
  });

  it('coerces negative numbers', () => {
    expect(firstString({ a: -42 }, ['a'])).toBe('-42');
  });
});

describe('util — firstNumber', () => {
  it('returns a numeric value directly', () => {
    expect(firstNumber({ a: 5 }, ['a'])).toBe(5);
  });

  it('coerces numeric strings', () => {
    expect(firstNumber({ a: '5.5' }, ['a'])).toBe(5.5);
  });

  it('skips non-numeric strings', () => {
    expect(firstNumber({ a: 'abc', b: 3 }, ['a', 'b'])).toBe(3);
  });

  it('returns null when nothing matches', () => {
    expect(firstNumber({ a: 'abc' }, ['a'])).toBeNull();
  });

  it('skips non-finite number values (Infinity, -Infinity)', () => {
    expect(firstNumber({ a: Infinity, b: 5 }, ['a', 'b'])).toBe(5);
    expect(firstNumber({ a: -Infinity, b: 3 }, ['a', 'b'])).toBe(3);
  });

  it('skips non-number non-string values (boolean, object, null)', () => {
    expect(firstNumber({ a: true, b: 5 }, ['a', 'b'])).toBe(5);
    expect(firstNumber({ a: null, b: 3 }, ['a', 'b'])).toBe(3);
    expect(firstNumber({ a: { x: 1 }, b: 7 }, ['a', 'b'])).toBe(7);
  });

  it('skips whitespace-only string values', () => {
    expect(firstNumber({ a: '   ', b: 5 }, ['a', 'b'])).toBe(5);
  });

  it('skips non-numeric string values', () => {
    expect(firstNumber({ a: 'abc', b: 5 }, ['a', 'b'])).toBe(5);
  });

  it('returns 0 directly when value is 0', () => {
    expect(firstNumber({ a: 0 }, ['a'])).toBe(0);
  });

  it('returns negative numbers directly', () => {
    expect(firstNumber({ a: -42 }, ['a'])).toBe(-42);
  });

  it('parses numeric strings with whitespace', () => {
    expect(firstNumber({ a: '  42  ' }, ['a'])).toBe(42);
  });

  it('skips NaN results from Number()', () => {
    expect(firstNumber({ a: '123abc' }, ['a'])).toBeNull();
  });
});

describe('util — firstBoolean', () => {
  it('returns a boolean value directly', () => {
    expect(firstBoolean({ a: true }, ['a'])).toBe(true);
    expect(firstBoolean({ a: false }, ['a'])).toBe(false);
  });

  it('coerces "true"/"false" strings', () => {
    expect(firstBoolean({ a: 'true' }, ['a'])).toBe(true);
    expect(firstBoolean({ a: 'FALSE' }, ['a'])).toBe(false);
  });

  it('coerces "1"/"0" strings', () => {
    expect(firstBoolean({ a: '1' }, ['a'])).toBe(true);
    expect(firstBoolean({ a: '0' }, ['a'])).toBe(false);
  });

  it('returns null for unrecognized values', () => {
    expect(firstBoolean({ a: 'yes' }, ['a'])).toBeNull();
  });

  it('skips non-boolean non-string values (number, object, null)', () => {
    expect(firstBoolean({ a: 1, b: true }, ['a', 'b'])).toBe(true);
    expect(firstBoolean({ a: null, b: false }, ['a', 'b'])).toBe(false);
    expect(firstBoolean({ a: { x: 1 }, b: true }, ['a', 'b'])).toBe(true);
  });

  it('trims and lowercases string values before matching', () => {
    expect(firstBoolean({ a: '  TRUE  ' }, ['a'])).toBe(true);
    expect(firstBoolean({ a: '  False  ' }, ['a'])).toBe(false);
  });

  it('returns null for non-boolean-like strings', () => {
    expect(firstBoolean({ a: 'maybe' }, ['a'])).toBeNull();
    expect(firstBoolean({ a: '2' }, ['a'])).toBeNull();
  });
});

describe('util — firstArray', () => {
  it('returns the first array value', () => {
    expect(firstArray({ a: [1, 2] }, ['a'])).toEqual([1, 2]);
  });

  it('returns null for non-arrays', () => {
    expect(firstArray({ a: 'x' }, ['a'])).toBeNull();
  });
});

describe('util — optionalString', () => {
  it('returns trimmed string for non-empty input', () => {
    expect(optionalString('  hi  ')).toBe('hi');
  });

  it('returns undefined for empty/whitespace input', () => {
    expect(optionalString('')).toBeUndefined();
    expect(optionalString('   ')).toBeUndefined();
    expect(optionalString(undefined)).toBeUndefined();
    expect(optionalString(null)).toBeUndefined();
  });
});

// ─── Property-based tests ───────────────────────────────────────────────────

fcTest.prop([fc.string({ minLength: 1 })])(
  'sha256 is deterministic for any non-empty string',
  (s) => {
    expect(sha256(s)).toBe(sha256(s));
  }
);

fcTest.prop([fc.string({ minLength: 1 })])(
  'sha256 always returns a 64-char hex string',
  (s) => {
    return /^[0-9a-f]{64}$/.test(sha256(s));
  }
);

fcTest.prop([fc.string({ minLength: 1 }), fc.string({ minLength: 1 })])(
  'sha256 differs for different inputs (high probability)',
  (a, b) => {
    fc.pre(a !== b);
    return sha256(a) !== sha256(b);
  }
);

fcTest.prop(
  [fc.array(fc.string({ minLength: 1 }), { minLength: 1 })]
)('generateIdempotencyKey always returns 25 alphanumeric chars', () => {
  const key = generateIdempotencyKey();
  return key.length === 25 && /^[a-f0-9]+$/.test(key);
});

fcTest.prop([fc.record({ a: fc.string() })])(
  'firstString never throws for any string record',
  (rec) => {
    const result = firstString(rec, ['a', 'b']);
    return result === null || typeof result === 'string';
  }
);

fcTest.prop([fc.record({ a: fc.anything() })])(
  'firstNumber never throws for any value type',
  (rec) => {
    const result = firstNumber(rec, ['a']);
    return result === null || (typeof result === 'number' && Number.isFinite(result));
  }
);
