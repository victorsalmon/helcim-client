import { describe, expect, it } from 'vitest';
import { isWebhookTimestampFresh } from '../src/webhook.js';

describe('isWebhookTimestampFresh', () => {
  it('accepts a timestamp within the default tolerance', () => {
    const now = Date.now();
    expect(isWebhookTimestampFresh(String(Math.floor(now / 1000) - 60), 300, now)).toBe(true);
  });

  it('accepts slightly-future timestamps within the tolerance window', () => {
    const now = Date.now();
    // Helcim clock skew of a couple of minutes must not reject deliveries.
    expect(isWebhookTimestampFresh(String(Math.floor(now / 1000) + 120), 300, now)).toBe(true);
  });

  it('rejects timestamps older than the tolerance', () => {
    const now = Date.now();
    expect(isWebhookTimestampFresh(String(Math.floor(now / 1000) - 3600), 300, now)).toBe(false);
  });

  it('honours a custom tolerance', () => {
    const now = Date.now();
    const ts = String(Math.floor(now / 1000) - 600);
    expect(isWebhookTimestampFresh(ts, 300, now)).toBe(false);
    expect(isWebhookTimestampFresh(ts, 700, now)).toBe(true);
  });

  it('fails closed on empty or non-numeric header values', () => {
    expect(isWebhookTimestampFresh('', 300)).toBe(false);
    expect(isWebhookTimestampFresh('not-a-number', 300)).toBe(false);
  });
});
