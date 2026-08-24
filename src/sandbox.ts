import { createHelcimConfigFromEnv } from './config.js';
import type { HelcimConfig } from './config.js';
import { isProviderErrorStatus } from './util.js';
export { isProviderErrorStatus };

/**
 * Sandbox helpers.
 *
 * These are used by integration tests and one-off scripts to safely exercise
 * the Helcim test environment without affecting production data.
 */

/**
 * Whether sandbox integration tests should run.
 *
 * Tests and scripts gate on this flag so a normal `npm test` never reaches
 * the live Helcim API. Set `HELCIM_SANDBOX_INTEGRATION=1` and supply
 * `HELCIM_API_TOKEN` (and optionally `HELCIM_BASE_URL` / `HELCIM_ENV`) to
 * enable real calls.
 */
export function isSandboxEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return !!env.HELCIM_SANDBOX_INTEGRATION;
}

/**
 * Load sandbox credentials from the environment and fail fast if anything is
 * missing. This is the single place both product tests and first-call scripts
 * should read Helcim sandbox configuration.
 */
export function requireSandboxCredentials(
  env: NodeJS.ProcessEnv = process.env
): HelcimConfig {
  if (!isSandboxEnabled(env)) {
    throw new Error('HELCIM_SANDBOX_INTEGRATION is not set');
  }
  const cfg = createHelcimConfigFromEnv(env);
  if (!cfg) {
    throw new Error('Missing Helcim sandbox credentials: HELCIM_API_TOKEN');
  }
  return cfg;
}

/**
 * Generate a unique client reference number for sandbox calls. Uniqueness
 * avoids collisions and duplicate-key rejections on retries.
 */
export function uniqueClientReference(prefix = 'helcim-sandbox'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Heuristic for the failures that indicate the caller has not finished
 * sandbox onboarding (credentials wrong, token missing a permission, or
 * the API Access Configuration not whitelisted for the operation).
 * A business validation error is NOT an auth failure.
 */
export function isAuthOrPermissionRejection(
  response: Response,
  bodyText: string
): boolean {
  if (response.status === 401 || response.status === 403) return true;
  if (response.status >= 500) return false;
  return /auth|token|permission|unauthorized|forbidden|api access/i.test(bodyText);
}
