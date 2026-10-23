import { describe, expect, it } from 'vitest';
import {
  createHelcimSubscriptionPlanRegistry,
  isHelcimSubscribeUrl,
  type HelcimSubscribePlan,
} from '../src/subscription-plans.js';

const UH_LIKE: readonly HelcimSubscribePlan[] = [
  {
    planId: 116999,
    key: 'total-property',
    name: '1 Total Property Seat',
    amountCents: 100,
    currency: 'CAD',
    billingPeriod: 'monthly',
    subscribeUrl: 'https://subscriptions.helcim.com/subscribe/fzdottbmvblidlj1dl1oa1q2whokr',
  },
  {
    planId: 117000,
    key: 'rent-tracking',
    name: '1 Rent-Tracking Seat',
    amountCents: 100,
    currency: 'CAD',
    billingPeriod: 'monthly',
    subscribeUrl: 'https://subscriptions.helcim.com/subscribe/fpnc788b85in0gc74vow7ojkax4jw',
  },
];

const base = UH_LIKE[0]!;

describe('isHelcimSubscribeUrl', () => {
  it('accepts the hosted signup shape', () => {
    expect(isHelcimSubscribeUrl(base.subscribeUrl)).toBe(true);
    expect(isHelcimSubscribeUrl('https://subscriptions.helcim.com/subscribe/abc123XYZ')).toBe(true);
  });

  it.each([
    ['http scheme', 'http://subscriptions.helcim.com/subscribe/abc123'],
    ['wrong host', 'https://subscriptions.helcim.com.evil.test/subscribe/abc123'],
    ['missing subscribe path', 'https://subscriptions.helcim.com/app/plans/116999'],
    ['empty token', 'https://subscriptions.helcim.com/subscribe/'],
    ['non-alphanumeric token', 'https://subscriptions.helcim.com/subscribe/abc-123'],
    ['trailing path', 'https://subscriptions.helcim.com/subscribe/abc123/extra'],
  ])('rejects %s', (_label, url) => {
    expect(isHelcimSubscribeUrl(url)).toBe(false);
  });
});

describe('createHelcimSubscriptionPlanRegistry', () => {
  it('indexes by key and by Helcim plan id', () => {
    const registry = createHelcimSubscriptionPlanRegistry(UH_LIKE);

    expect(registry.all()).toHaveLength(2);
    expect(registry.byKey('rent-tracking')?.planId).toBe(117000);
    expect(registry.byId(116999)?.key).toBe('total-property');
    expect(registry.require('total-property').amountCents).toBe(100);
  });

  it('returns undefined for unknown keys and ids', () => {
    const registry = createHelcimSubscriptionPlanRegistry(UH_LIKE);

    expect(registry.byKey('nope')).toBeUndefined();
    expect(registry.byId(1)).toBeUndefined();
  });

  it('throws from require() on an unknown key', () => {
    const registry = createHelcimSubscriptionPlanRegistry(UH_LIKE);

    expect(() => registry.require('nope')).toThrow(/unknown key/);
  });

  it('exposes an immutable snapshot', () => {
    const registry = createHelcimSubscriptionPlanRegistry(UH_LIKE);

    expect(Object.isFrozen(registry.all())).toBe(true);
  });

  it('rejects duplicate keys', () => {
    expect(() =>
      createHelcimSubscriptionPlanRegistry([base, { ...UH_LIKE[1]!, key: base.key }]),
    ).toThrow(/duplicate key/);
  });

  it('rejects duplicate Helcim plan ids', () => {
    expect(() =>
      createHelcimSubscriptionPlanRegistry([base, { ...UH_LIKE[1]!, planId: base.planId }]),
    ).toThrow(/duplicate planId/);
  });

  it.each([
    ['empty key', { key: ' ' }],
    ['empty name', { name: '' }],
    ['non-positive planId', { planId: 0 }],
    ['fractional planId', { planId: 1.5 }],
    ['negative amount', { amountCents: -1 }],
    ['fractional amount', { amountCents: 1.5 }],
    ['empty currency', { currency: '' }],
    ['malformed subscribe URL', { subscribeUrl: 'https://example.test/subscribe/abc' }],
  ])('rejects %s', (_label, patch) => {
    expect(() => createHelcimSubscriptionPlanRegistry([{ ...base, ...patch }])).toThrow();
  });
});
