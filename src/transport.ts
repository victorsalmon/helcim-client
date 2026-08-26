import type { HelcimConfig } from './config.js';

/** The single HTTP entry point every resource factory is given. */
export type TransportRequest = (
  method: string,
  path: string,
  opts?: {
    body?: unknown;
    idempotencyKey?: string;
    query?: Record<string, string | number | boolean | undefined>;
  }
) => Promise<Record<string, unknown>>;

export interface Transport {
  request: TransportRequest;
}

const DEFAULT_TIMEOUT_MS = 20_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create the HTTP transport for a Helcim client.
 *
 * Adds two production-hardening behaviours over a bare fetch:
 *  - Per-attempt timeout via `AbortSignal.timeout` (config.timeoutMs,
 *    default 20s) so a hung Helcim call cannot pin a Lambda until the
 *    platform timeout.
 *  - Bounded retry with exponential backoff (config.maxRetries, default 0 =
 *    disabled). Retries only fire when the call is safe to repeat — a GET,
 *    or a write that carries an explicit `idempotencyKey` — and only on
 *    network failures, HTTP 429, and 5xx responses.
 */
export function createTransport(config: HelcimConfig, fetchImpl: typeof fetch = fetch): Transport {
  const baseHeaders: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
    'api-token': config.apiToken,
  };
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = config.maxRetries ?? 0;

  async function attempt(
    method: string,
    url: string,
    init: RequestInit
  ): Promise<{ ok: boolean; status: number; text: string }> {
    try {
      const response = await fetchImpl(url, init);
      return { ok: response.ok, status: response.status, text: await response.text() };
    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        throw new Error(`Helcim ${method} ${url} timed out after ${timeoutMs}ms`);
      }
      throw err;
    }
  }

  const request: TransportRequest = async (method, path, opts = {}) => {
    const url = new URL(`${config.baseUrl}${path}`);
    if (opts.query) {
      for (const [key, value] of Object.entries(opts.query)) {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      }
    }
    const headers: Record<string, string> = { ...baseHeaders };
    if (opts.idempotencyKey) {
      headers['idempotency-key'] = opts.idempotencyKey;
    }
    const init: RequestInit = {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    };

    let lastError: unknown;
    for (let attemptNo = 0; attemptNo <= maxRetries; attemptNo++) {
      if (attemptNo > 0) {
        // Exponential backoff with jitter; only reachable when retryable.
        await sleep(250 * 2 ** (attemptNo - 1) + Math.floor(Math.random() * 100));
      }
      let result: { ok: boolean; status: number; text: string };
      try {
        result = await attempt(method, url.toString(), { ...init });
      } catch (err) {
        // Network-level failure. Retry only when the call is safe to repeat.
        lastError = err;
        const repeatable = method === 'GET' || Boolean(opts.idempotencyKey);
        if (repeatable && attemptNo < maxRetries) continue;
        throw err;
      }

      const retryableStatus = result.status === 429 || result.status >= 500;
      if (!result.ok && retryableStatus && attemptNo < maxRetries) {
        const repeatable = method === 'GET' || Boolean(opts.idempotencyKey);
        if (repeatable) {
          lastError = new Error(`Helcim ${method} ${path} failed with HTTP ${result.status}`);
          continue;
        }
      }

      let parsedBody: Record<string, unknown> = {};
      if (result.text) {
        try {
          const parsed = JSON.parse(result.text) as unknown;
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            parsedBody = parsed as Record<string, unknown>;
          } else if (Array.isArray(parsed)) {
            // Some list endpoints return a bare array; wrap it for uniform handling.
            parsedBody = { data: parsed };
          }
        } catch {
          // Non-JSON or empty body — leave raw as {}. Do not echo into logs.
        }
      }
      if (!result.ok) {
        const providerErrors = parsedBody.errors ?? parsedBody.Errors;
        const message =
          typeof providerErrors === 'string' && providerErrors.trim()
            ? providerErrors
            : Array.isArray(providerErrors) &&
                providerErrors.length > 0 &&
                typeof providerErrors[0] === 'string'
              ? providerErrors[0]
              : `Helcim ${method} ${path} failed with HTTP ${result.status}`;
        throw new Error(message);
      }
      // Recurring API wraps responses in { data: [...] } or { data: {...} }.
      // Payment API returns the object directly. Unwrap for callers.
      void lastError;
      return parsedBody;
    }
    // Unreachable: the loop always returns or throws.
    throw lastError instanceof Error ? lastError : new Error('Helcim request failed');
  };

  return { request };
}
