import { describe, it, expect } from 'vitest';
import {
  createHelcimConfigFromEnv,
  HELCIM_PRODUCTION_BASE_URL,
  HELCIM_TEST_BASE_URL,
} from '../src/index.js';

describe('Helcim configuration', () => {
  it('is disabled when HELCIM_API_TOKEN is missing', () => {
    expect(createHelcimConfigFromEnv({})).toBeNull();
    expect(createHelcimConfigFromEnv({ HELCIM_API_TOKEN: '' })).toBeNull();
    expect(createHelcimConfigFromEnv({ HELCIM_API_TOKEN: '   ' })).toBeNull();
  });

  it('defaults to the test base URL when HELCIM_ENV is unset', () => {
    const cfg = createHelcimConfigFromEnv({ HELCIM_API_TOKEN: 'tok-1' });
    expect(cfg).not.toBeNull();
    expect(cfg!.baseUrl).toBe(HELCIM_TEST_BASE_URL);
    expect(cfg!.apiToken).toBe('tok-1');
  });

  it('uses the production base URL when HELCIM_ENV=production', () => {
    const cfg = createHelcimConfigFromEnv({
      HELCIM_API_TOKEN: 'tok-1',
      HELCIM_ENV: 'production',
    });
    expect(cfg!.baseUrl).toBe(HELCIM_PRODUCTION_BASE_URL);
  });

  it('uses the production base URL when HELCIM_ENV=prod', () => {
    const cfg = createHelcimConfigFromEnv({
      HELCIM_API_TOKEN: 'tok-1',
      HELCIM_ENV: 'prod',
    });
    expect(cfg!.baseUrl).toBe(HELCIM_PRODUCTION_BASE_URL);
  });

  it('uses HELCIM_BASE_URL when explicitly set, stripping trailing slashes', () => {
    const cfg = createHelcimConfigFromEnv({
      HELCIM_API_TOKEN: 'tok-1',
      HELCIM_BASE_URL: 'https://custom.helcim.example/v2/',
    });
    expect(cfg!.baseUrl).toBe('https://custom.helcim.example/v2');
  });

  it('HELCIM_BASE_URL wins over HELCIM_ENV', () => {
    const cfg = createHelcimConfigFromEnv({
      HELCIM_API_TOKEN: 'tok-1',
      HELCIM_ENV: 'production',
      HELCIM_BASE_URL: 'https://api.helcim.test/v2',
    });
    expect(cfg!.baseUrl).toBe('https://api.helcim.test/v2');
  });

  it('includes the webhook verifier token when set', () => {
    const cfg = createHelcimConfigFromEnv({
      HELCIM_API_TOKEN: 'tok-1',
      HELCIM_WEBHOOK_VERIFIER_TOKEN: 'verifier-abc',
    });
    expect(cfg!.webhookVerifierToken).toBe('verifier-abc');
  });

  it('omits the webhook verifier token when unset', () => {
    const cfg = createHelcimConfigFromEnv({ HELCIM_API_TOKEN: 'tok-1' });
    expect(cfg!.webhookVerifierToken).toBeUndefined();
  });

  it('trims whitespace from the api token', () => {
    const cfg = createHelcimConfigFromEnv({ HELCIM_API_TOKEN: '  tok-1  ' });
    expect(cfg!.apiToken).toBe('tok-1');
  });

  it('trims whitespace from HELCIM_BASE_URL before use', () => {
    const cfg = createHelcimConfigFromEnv({
      HELCIM_API_TOKEN: 'tok-1',
      HELCIM_BASE_URL: '  https://custom.helcim.example/v2  ',
    });
    expect(cfg!.baseUrl).toBe('https://custom.helcim.example/v2');
  });

  it('strips multiple trailing slashes from HELCIM_BASE_URL', () => {
    const cfg = createHelcimConfigFromEnv({
      HELCIM_API_TOKEN: 'tok-1',
      HELCIM_BASE_URL: 'https://custom.helcim.example/v2///',
    });
    expect(cfg!.baseUrl).toBe('https://custom.helcim.example/v2');
  });

  it('treats a whitespace-only HELCIM_BASE_URL as unset', () => {
    const cfg = createHelcimConfigFromEnv({
      HELCIM_API_TOKEN: 'tok-1',
      HELCIM_BASE_URL: '   ',
    });
    expect(cfg!.baseUrl).toBe(HELCIM_TEST_BASE_URL);
  });

  it('trims and lowercases HELCIM_ENV', () => {
    const cfg = createHelcimConfigFromEnv({
      HELCIM_API_TOKEN: 'tok-1',
      HELCIM_ENV: '  PRODUCTION  ',
    });
    expect(cfg!.baseUrl).toBe(HELCIM_PRODUCTION_BASE_URL);
  });

  it('treats unset HELCIM_ENV as empty string (test URL)', () => {
    const cfg = createHelcimConfigFromEnv({ HELCIM_API_TOKEN: 'tok-1' });
    expect(cfg!.baseUrl).toBe(HELCIM_TEST_BASE_URL);
  });

  it('trims whitespace from the webhook verifier token', () => {
    const cfg = createHelcimConfigFromEnv({
      HELCIM_API_TOKEN: 'tok-1',
      HELCIM_WEBHOOK_VERIFIER_TOKEN: '  verifier-abc  ',
    });
    expect(cfg!.webhookVerifierToken).toBe('verifier-abc');
  });

  it('omits webhook verifier token when whitespace-only', () => {
    const cfg = createHelcimConfigFromEnv({
      HELCIM_API_TOKEN: 'tok-1',
      HELCIM_WEBHOOK_VERIFIER_TOKEN: '   ',
    });
    expect(cfg!.webhookVerifierToken).toBeUndefined();
  });

  it('rejects a plaintext remote base URL so the api token is never sent in the clear', () => {
    expect(() =>
      createHelcimConfigFromEnv({
        HELCIM_API_TOKEN: 'tok-1',
        HELCIM_BASE_URL: 'http://api.helcim.com/v2',
      })
    ).toThrow(/https/);
  });

  it('allows a loopback http base URL for local test servers', () => {
    const cfg = createHelcimConfigFromEnv({
      HELCIM_API_TOKEN: 'tok-1',
      HELCIM_BASE_URL: 'http://localhost:8080/v2',
    });
    expect(cfg!.baseUrl).toBe('http://localhost:8080/v2');
  });

  it('rejects a base URL that is not an absolute URL', () => {
    expect(() =>
      createHelcimConfigFromEnv({ HELCIM_API_TOKEN: 'tok-1', HELCIM_BASE_URL: 'not-a-url' })
    ).toThrow(/valid absolute URL/);
  });

  it('rejects a non-HTTP(S) scheme even for a loopback host', () => {
    expect(() =>
      createHelcimConfigFromEnv({
        HELCIM_API_TOKEN: 'tok-1',
        HELCIM_BASE_URL: 'ftp://localhost/v2',
      })
    ).toThrow(/ftp:\/\/localhost/);
  });
});
