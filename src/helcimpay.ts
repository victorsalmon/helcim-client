import { sha256 } from './util.js';

/**
 * Validate a HelcimPay.js transaction response hash.
 *
 * After a HelcimPay.js payment, the iFrame emits a response containing the
 * transaction data and a `hash`. To verify integrity, JSON-encode the
 * transaction data (with sorted keys, no whitespace), append the `secretToken`
 * from the initialize response, and SHA-256 hash the result. The hash must
 * match the one returned by Helcim.
 *
 * Helcim calculates the hash on the JSON-escaped unicode representation of
 * special characters, so we use `JSON.stringify` with no replacer (which
 * produces escaped unicode for non-ASCII) and compact separators.
 *
 * @param data - the `data` object from the HelcimPay.js response
 * @param hash - the `hash` string from the HelcimPay.js response
 * @param secretToken - the `secretToken` from the initialize response
 * @returns true if the computed hash matches the provided hash
 */
export function validateHelcimPayHash(
  data: Record<string, unknown>,
  hash: string,
  secretToken: string
): boolean {
  if (!data || !hash || !secretToken) return false;
  // Compact JSON encoding (no whitespace), matching Helcim's server-side
  // json_encode with default flags. JSON.stringify already escapes non-ASCII
  // to \uXXXX, which matches Helcim's "JSON-escaped unicode representation."
  const jsonEncoded = JSON.stringify(data);
  const computed = sha256(jsonEncoded + secretToken);
  // Case-insensitive comparison — both are hex digests.
  return computed.toLowerCase() === hash.trim().toLowerCase();
}

/**
 * Extract the data and hash from a HelcimPay.js iFrame event message.
 *
 * The iFrame emits `event.data.eventMessage` as a JSON string. On SUCCESS,
 * the parsed object has the shape:
 *   { status, data: { data: { ...transactionFields }, hash } }
 * This helper extracts the inner `data` object and the `hash` for validation.
 */
export interface HelcimPayResponse {
  status: number | null;
  data: Record<string, unknown> | null;
  hash: string | null;
}

export function parseHelcimPayEventMessage(
  eventMessage: string
): HelcimPayResponse {
  let parsed: unknown;
  try {
    parsed = JSON.parse(eventMessage);
  } catch {
    return { status: null, data: null, hash: null };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { status: null, data: null, hash: null };
  }
  const outer = parsed as Record<string, unknown>;
  const status =
    typeof outer.status === 'number'
      ? outer.status
      : typeof outer.status === 'string'
        ? Number(outer.status) || null
        : null;
  const dataWrapper =
    outer.data && typeof outer.data === 'object' && !Array.isArray(outer.data)
      ? (outer.data as Record<string, unknown>)
      : null;
  if (!dataWrapper) return { status, data: null, hash: null };
  const innerData =
    dataWrapper.data && typeof dataWrapper.data === 'object' && !Array.isArray(dataWrapper.data)
      ? (dataWrapper.data as Record<string, unknown>)
      : null;
  const hash =
    typeof dataWrapper.hash === 'string' ? dataWrapper.hash : null;
  return { status, data: innerData, hash };
}
