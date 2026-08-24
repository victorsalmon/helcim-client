import { sha256 } from './util.js';

/**
 * Validate a HelcimPay.js transaction response hash.
 *
 * After a HelcimPay.js payment, the iFrame emits a response containing the
 * transaction data and a `hash`. To verify integrity, JSON-encode the
 * transaction data (with no whitespace), append the `secretToken`
 * from the initialize response, and SHA-256 hash the result. The hash must
 * match the one returned by Helcim.
 *
 * Helcim calculates the hash on the JSON-escaped unicode representation of
 * special characters. JavaScript's `JSON.stringify` leaves those characters
 * literal, so the serialized payload is converted to UTF-16 `\\uXXXX` escapes
 * before hashing.
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
  // Compact JSON encoding matching Helcim's server-side json_encode default.
  // JSON.stringify does not escape non-ASCII characters, so convert each
  // UTF-16 code unit to the `\\uXXXX` format Helcim hashes. Using code units
  // deliberately encodes astral characters as the same surrogate pairs PHP
  // json_encode produces.
  const jsonEncoded = JSON.stringify(data).replace(/[\u007f-\uffff]/g, (character) =>
    `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`
  );
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
    // Fall through to the guard below; it returns the same null shape.
  }
  if (!parsed || Array.isArray(parsed)) {
    return { status: null, data: null, hash: null };
  }
  const outer = parsed as Record<string, unknown>;
  const status =
    typeof outer.status === 'number'
      ? outer.status
      : typeof outer.status === 'string'
        ? Number(outer.status) || null
        : null;
  const dataWrapper = outer.data as Record<string, unknown> | undefined;
  const innerData =
    typeof dataWrapper?.data === 'object' && !Array.isArray(dataWrapper.data)
      ? (dataWrapper.data as Record<string, unknown>)
      : null;
  const hash =
    typeof dataWrapper?.hash === 'string' ? dataWrapper.hash : null;
  return { status, data: innerData, hash };
}
