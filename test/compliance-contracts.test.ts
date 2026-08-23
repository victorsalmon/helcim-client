import { describe, expect, it } from 'vitest';
import { createHelcimConfigFromEnv, HELCIM_TEST_BASE_URL } from '../src/config.js';
import { verifyHelcimWebhook } from '../src/webhook.js';

describe('Helcim compliance contracts', () => {
  it('defaults to the non-production Helcim endpoint when stage is unset', () => {
    const config = createHelcimConfigFromEnv({ HELCIM_API_TOKEN: 'test-only-token' });
    expect(config?.baseUrl).toBe(HELCIM_TEST_BASE_URL);
  });

  it('fails closed for missing webhook authentication material', () => {
    expect(verifyHelcimWebhook('id', 'ts', '{}', 'sig', '')).toBe(false);
    expect(verifyHelcimWebhook('', 'ts', '{}', 'sig', 'dGVzdA==')).toBe(false);
  });

  it('does not accept a forged webhook signature', () => {
    expect(verifyHelcimWebhook('id', 'ts', '{}', 'v1,not-a-real-signature', 'dGVzdA==')).toBe(false);
  });
});

