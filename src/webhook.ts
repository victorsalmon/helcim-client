import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verify a Helcim webhook signature.
 *
 * Helcim signs every webhook with HMAC-SHA256. The header `webhook-signature`
 * is a space-delimited list of `version,base64-signature` pairs (usually one).
 * The signed content is `${webhook-id}.${webhook-timestamp}.${rawBody}`.
 * The key is the base64-decoded `verifierToken` from your Helcim webhook
 * settings.
 *
 * On mismatch, return false — the caller must ignore the request to keep the
 * system safe. Never log the verifier token or the expected signature.
 *
 * @param webhookId - the `webhook-id` header value
 * @param webhookTimestamp - the `webhook-timestamp` header value
 * @param rawBody - the raw request body bytes (as received, before parsing)
 * @param signatureHeader - the `webhook-signature` header value
 * @param verifierToken - the base64 verifier token from Helcim webhook settings
 * @returns true if any signature in the header matches, false otherwise
 */
export function verifyHelcimWebhook(
  webhookId: string,
  webhookTimestamp: string,
  rawBody: string,
  signatureHeader: string,
  verifierToken: string
): boolean {
  if (!webhookId || !webhookTimestamp || !rawBody || !signatureHeader || !verifierToken) {
    return false;
  }

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const verifierKeyBytes = Buffer.from(verifierToken, 'base64');
  if (verifierKeyBytes.length === 0) return false;

  // The signature header is a space-delimited list of "version,signature".
  // We accept the webhook if ANY signature in the list matches.
  const signatures = signatureHeader.split(' ');
  for (const entry of signatures) {
    const commaIdx = entry.indexOf(',');
    const sig = entry.slice(commaIdx + 1);

    const expected = createHmac('sha256', verifierKeyBytes)
      .update(signedContent)
      .digest()
      .toString('base64');

    // Constant-time comparison to prevent timing attacks.
    const actualBytes = Buffer.from(sig);
    const expectedBytes = Buffer.from(expected);
    try {
      if (timingSafeEqual(actualBytes, expectedBytes)) return true;
    } catch {
    }
  }
  return false;
}

/**
 * Parse the Helcim webhook body to extract the event type and transaction id.
 * Helcim webhook bodies are `{ id, type }` for card transactions, or
 * `{ data: { ... }, type }` for terminal cancels. This helper normalizes both
 * shapes into a common structure.
 */
export interface HelcimWebhookEvent {
  type: string | null;
  /** Transaction id for cardTransaction/achTransaction events; null otherwise. */
  transactionId: string | null;
  /** Subscription id for subscriptionPayment events; null otherwise. */
  subscriptionId: string | null;
  /** Raw parsed body for the caller to inspect. */
  raw: Record<string, unknown>;
}

export function parseHelcimWebhookBody(
  rawBody: string
): HelcimWebhookEvent {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    // Fall through to the guard below; it returns the same empty shape.
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { type: null, transactionId: null, subscriptionId: null, raw: {} };
  }
  const record = parsed as Record<string, unknown>;
  const type =
    typeof record.type === 'string' ? record.type : null;
  // cardTransaction: { id, type }  → id is the transaction id
  // terminalCancel:  { data: { ... }, type }
  // subscriptionPayment: { subscriptionId, type } or { data: { subscriptionId }, type }
  const directId =
    typeof record.id === 'string' || typeof record.id === 'number'
      ? String(record.id)
      : null;
  const data = record.data as Record<string, unknown> | undefined;
  const nestedId =
    typeof data?.transactionId === 'string' || typeof data?.transactionId === 'number'
      ? String(data.transactionId)
      : null;
  const directSubId =
    typeof record.subscriptionId === 'string' || typeof record.subscriptionId === 'number'
      ? String(record.subscriptionId)
      : null;
  const nestedSubId =
    typeof data?.subscriptionId === 'string' || typeof data?.subscriptionId === 'number'
      ? String(data.subscriptionId)
      : null;
  return {
    type,
    transactionId: directId ?? nestedId,
    subscriptionId: directSubId ?? nestedSubId,
    raw: record,
  };
}
