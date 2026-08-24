import { createHash, randomUUID } from 'node:crypto';

/**
 * Shared primitives used by the rest of the Helcim client.
 *
 * These helpers isolate provider payload shape variations (camelCase,
 * PascalCase, snake_case) and provide small crypto/string utilities.
 */

/**
 * SHA-256 hex digest of a UTF-8 string. Used for HelcimPay.js response-hash
 * validation: hash = sha256(jsonEncodedData + secretToken).
 */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * Generate an idempotency key for Payment API and Recurring API endpoints.
 *
 * Helcim accepts 25-36 alphanumeric characters (including '-' and '_').
 * The Recurring API (subscriptions, process-payment) requires exactly 25
 * characters; the Payment API accepts 25-36. We generate a 25-char key
 * (stripped UUID without hyphens, truncated) so the same generator works
 * for both surfaces.
 */
export function generateIdempotencyKey(): string {
  return randomUUID().replace(/-/g, '').slice(0, 25);
}

/**
 * Pick the first non-empty string value from a record using a list of
 * possible keys. Numbers are coerced to strings; empty/whitespace values
 * are skipped. Mirrors the vopay-client helper for response-field extraction
 * across provider payload shape variations.
 */
export function firstString(
  record: Record<string, unknown>,
  keys: string[]
): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (Number.isFinite(value)) return String(value);
  }
  return null;
}

/**
 * Pick the first numeric value from a record. String-encoded numbers are
 * coerced; non-finite values are skipped.
 */
export function firstNumber(
  record: Record<string, unknown>,
  keys: string[]
): number | null {
  for (const key of keys) {
    const value = record[key];
    if (Number.isFinite(value)) return Number(value);
    if (typeof value === 'string' && value.trim()) {
      const parsedNumber = Number(value);
      if (Number.isFinite(parsedNumber)) return parsedNumber;
    }
  }
  return null;
}

/**
 * Pick the first boolean value from a record. String values "true"/"false"
 * (case-insensitive) and "1"/"0" are coerced.
 */
export function firstBoolean(
  record: Record<string, unknown>,
  keys: string[]
): boolean | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalizedValue = value.trim().toLowerCase();
      if (normalizedValue === 'true' || normalizedValue === '1') return true;
      if (normalizedValue === 'false' || normalizedValue === '0') return false;
    }
  }
  return null;
}

/**
 * Pick the first array value from a record. Returns null if the value is not
 * an array.
 */
export function firstArray(
  record: Record<string, unknown>,
  keys: string[]
): unknown[] | null {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }
  return null;
}

/**
 * Detect a provider-declared error/failure/declined status in a parsed JSON
 * response. Helcim uses `status` on transaction objects (APPROVED/DECLINED)
 * and `errors` arrays on failure responses.
 */
export function isProviderErrorStatus(raw: unknown): boolean {
  if (!raw) return false;
  const record = raw as Record<string, unknown>;
  const status = String(record.status ?? record.Status).trim().toLowerCase();
  return ['declined', 'failed', 'error'].includes(status);
}

/**
 * Trim a string, returning undefined for empty/whitespace-only values so
 * callers can omit the field from request bodies (Helcim treats omitted
 * fields differently from empty strings in some endpoints).
 */
export function optionalString(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}
