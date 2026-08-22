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
