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
}

export const HELCIM_PRODUCTION_BASE_URL = 'https://api.helcim.com/v2';
export const HELCIM_TEST_BASE_URL = 'https://api.helcim.test/v2';

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Helcim is enabled but ${name} is missing`);
  return value;
}

function resolveBaseUrl(env: NodeJS.ProcessEnv): string {
  const explicit = env.HELCIM_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  // HELCIM_ENV=production → prod URL; HELCIM_ENV=test (or unset) → test URL.
  // This lets a product opt into prod by setting HELCIM_ENV=production without
  // hardcoding the full URL.
  const envStage = (env.HELCIM_ENV ?? '').trim().toLowerCase();
  if (envStage === 'production' || envStage === 'prod') return HELCIM_PRODUCTION_BASE_URL;
  return HELCIM_TEST_BASE_URL;
}

/**
 * Build a Helcim config from the environment. Returns `null` when
 * `HELCIM_API_TOKEN` is absent (the integration is disabled). Throws if the
 * token is present but the base URL cannot be resolved, so a misconfiguration
 * is fail-fast.
 */
export function createHelcimConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env
): HelcimConfig | null {
  const apiToken = env.HELCIM_API_TOKEN?.trim();
  if (!apiToken) return null;

  const baseUrl = resolveBaseUrl(env);
  const webhookVerifierToken = env.HELCIM_WEBHOOK_VERIFIER_TOKEN?.trim() || undefined;

  return { baseUrl, apiToken, webhookVerifierToken };
}
