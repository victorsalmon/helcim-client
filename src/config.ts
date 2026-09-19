/**
 * Helcim client configuration.
 *
 * The Helcim API has two base URLs:
 *   - Production: https://api.helcim.com/v2  (real cards, real charges)
 *   - Developer test: https://api.helcim.test/v2  (test cards only, no charges)
 *
 * The webhook verifier token is a separate secret from the api-token — it is
 * base64-encoded and used to HMAC-verify webhook signatures. Find it in the
 * Helcim dashboard under All Tools → Integrations → Webhooks.
 */

export interface HelcimConfig {
  /** Base URL without trailing slash, e.g. https://api.helcim.com/v2 */
  baseUrl: string;
  /** API Access Token from your API Access Configuration. */
  apiToken: string;
  /** Webhook verifier token (base64) for signature verification. Optional. */
  webhookVerifierToken?: string;
  /**
   * Per-request timeout in milliseconds, enforced with `AbortSignal.timeout`.
   * Default: 20_000. Version-independent knob — products tune this without
   * touching client internals.
   */
  timeoutMs?: number;
  /**
   * Bounded retry count for repeat-safe calls (GETs and idempotency-keyed
   * writes) on network errors, HTTP 429, and 5xx. Default: 0 (disabled).
   */
  maxRetries?: number;
}

/** Production Helcim Payment / Recurring API base URL. */
export const HELCIM_PRODUCTION_BASE_URL = 'https://api.helcim.com/v2';

/** Developer test Helcim API base URL (test cards, no real charges). */
export const HELCIM_TEST_BASE_URL = 'https://api.helcim.test/v2';

/** Hosts for which plain HTTP is tolerated (local test servers only). */
const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Assert that a base URL cannot leak the `api-token` in plaintext.
 *
 * Every request carries the API token in a header, so the transport must only
 * ever talk to an HTTPS endpoint. Plain HTTP is tolerated solely for loopback
 * hosts so local test doubles can be exercised; any other scheme or host
 * fails closed.
 */
export function assertSecureBaseUrl(baseUrl: string): void {
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error(`Helcim baseUrl must be a valid absolute URL (got '${baseUrl}')`);
  }
  if (parsed.protocol === 'https:') return;
  if (parsed.protocol === 'http:' && LOOPBACK_HOSTNAMES.has(parsed.hostname)) return;
  throw new Error(
    `Helcim baseUrl must use https so the api-token is never sent in plaintext ` +
      `(got '${parsed.protocol}//${parsed.hostname}')`
  );
}

/**
 * Resolve the Helcim base URL from environment variables.
 *
 * `HELCIM_BASE_URL` takes precedence, then `HELCIM_ENV` (`production`/`prod`
 * or `test`/unset), defaulting to the test URL so production is opt-in.
 */
function resolveBaseUrl(env: NodeJS.ProcessEnv): string {
  const explicit = env.HELCIM_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  // HELCIM_ENV=production → prod URL; HELCIM_ENV=test (or unset) → test URL.
  // This lets a product opt into prod by setting HELCIM_ENV=production without
  // hardcoding the full URL.
  const envStage = env.HELCIM_ENV?.trim().toLowerCase();
  if (envStage === 'production' || envStage === 'prod') return HELCIM_PRODUCTION_BASE_URL;
  return HELCIM_TEST_BASE_URL;
}

/**
 * Build a Helcim config from the environment. Returns `null` when
 * `HELCIM_API_TOKEN` is absent (the integration is disabled). Throws if the
 * token is present but the base URL cannot be resolved or is insecure
 * (non-HTTPS and not loopback), so a misconfiguration is fail-fast.
 */
export function createHelcimConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env
): HelcimConfig | null {
  const apiToken = env.HELCIM_API_TOKEN?.trim();
  if (!apiToken) return null;

  const baseUrl = resolveBaseUrl(env);
  assertSecureBaseUrl(baseUrl);
  const webhookVerifierToken = env.HELCIM_WEBHOOK_VERIFIER_TOKEN?.trim() || undefined;

  const timeoutRaw = env.HELCIM_TIMEOUT_MS?.trim();
  const retriesRaw = env.HELCIM_MAX_RETRIES?.trim();
  const timeoutMs = timeoutRaw ? Number(timeoutRaw) : undefined;
  const maxRetries = retriesRaw ? Number(retriesRaw) : undefined;

  return {
    baseUrl,
    apiToken,
    webhookVerifierToken,
    ...(timeoutMs !== undefined && Number.isFinite(timeoutMs) && timeoutMs > 0
      ? { timeoutMs }
      : {}),
    ...(maxRetries !== undefined && Number.isInteger(maxRetries) && maxRetries >= 0
      ? { maxRetries }
      : {}),
  };
}
