/**
 * Hosted subscription plans (`subscriptions.helcim.com/subscribe/...`).
 *
 * Product-neutral by design: this module knows nothing about what a plan
 * sells. A product supplies its own plan rows — Helcim payment-plan id, price,
 * billing period and hosted signup URL — and receives a validated,
 * lookup-only registry. Pure data + total functions: no network, no charge
 * logic, no product vocabulary.
 *
 * Why this exists: Helcim exposes the same plan through two views. The
 * Recurring API view (`GET /payment-plans`: id, amount, period) drives
 * server-side subscription creation; the hosted view (a public
 * `subscribe/<token>` URL) drives self-serve signup. Keeping both facts on one
 * row stops the two from drifting apart.
 */

/** Billing cadence supported by the hosted plan pages. */
export type HelcimBillingPeriod = 'weekly' | 'monthly' | 'annual';

/** One hosted subscription plan, as a product declares it. */
export interface HelcimSubscribePlan {
  /** Helcim payment-plan id (matches `GET /payment-plans`). */
  readonly planId: number;
  /** Product-local stable key; what gates and meters reference. */
  readonly key: string;
  /** Display name. */
  readonly name: string;
  /** Price in integer minor units (cents for a CAD plan). */
  readonly amountCents: number;
  /** ISO-4217 code, e.g. `CAD`. */
  readonly currency: string;
  /** Billing cadence. */
  readonly billingPeriod: HelcimBillingPeriod;
  /** Public hosted signup URL. */
  readonly subscribeUrl: string;
}

/** Read-only view over a validated plan set. */
export interface HelcimSubscriptionPlanRegistry {
  /** Every plan, in declaration order. */
  all(): readonly HelcimSubscribePlan[];
  /** Lookup by product-local key; `undefined` when absent. */
  byKey(key: string): HelcimSubscribePlan | undefined;
  /** Lookup by Helcim plan id; `undefined` when absent. */
  byId(planId: number): HelcimSubscribePlan | undefined;
  /** Lookup by key, throwing when absent — for config paths that must resolve. */
  require(key: string): HelcimSubscribePlan;
}

/**
 * The only hosted-signup shape Helcim issues: `https://` host, `/subscribe/`
 * path, alphanumeric token. Anchored so a truncated or proxied URL fails loudly
 * at config time instead of 404-ing in front of a customer.
 */
const SUBSCRIBE_URL_PATTERN = /^https:\/\/subscriptions\.helcim\.com\/subscribe\/[A-Za-z0-9]+$/;

/** Whether a string is a well-formed Helcim hosted subscribe URL. */
export function isHelcimSubscribeUrl(value: string): boolean {
  return SUBSCRIBE_URL_PATTERN.test(value);
}

/**
 * Validate and index a product's plan declarations.
 *
 * Fails fast on anything that would misroute money or a signup: duplicate keys,
 * duplicate Helcim ids, non-positive ids, negative or fractional prices, empty
 * names, and malformed subscribe URLs.
 */
export function createHelcimSubscriptionPlanRegistry(
  plans: readonly HelcimSubscribePlan[],
): HelcimSubscriptionPlanRegistry {
  const byKey = new Map<string, HelcimSubscribePlan>();
  const byId = new Map<number, HelcimSubscribePlan>();

  for (const plan of plans) {
    if (!plan.key.trim()) throw new Error('helcim plan: key must be non-empty');
    if (!plan.name.trim()) throw new Error(`helcim plan "${plan.key}": name must be non-empty`);
    if (!Number.isInteger(plan.planId) || plan.planId <= 0) {
      throw new Error(`helcim plan "${plan.key}": planId must be a positive integer`);
    }
    if (!Number.isInteger(plan.amountCents) || plan.amountCents < 0) {
      throw new Error(`helcim plan "${plan.key}": amountCents must be a non-negative integer`);
    }
    if (!plan.currency.trim()) {
      throw new Error(`helcim plan "${plan.key}": currency must be non-empty`);
    }
    if (!isHelcimSubscribeUrl(plan.subscribeUrl)) {
      throw new Error(
        `helcim plan "${plan.key}": subscribeUrl must match https://subscriptions.helcim.com/subscribe/<token>`,
      );
    }
    if (byKey.has(plan.key)) throw new Error(`helcim plan: duplicate key "${plan.key}"`);
    if (byId.has(plan.planId)) {
      throw new Error(`helcim plan: duplicate planId ${plan.planId} ("${plan.key}")`);
    }
    byKey.set(plan.key, plan);
    byId.set(plan.planId, plan);
  }

  const snapshot: readonly HelcimSubscribePlan[] = Object.freeze([...plans]);

  return {
    all: () => snapshot,
    byKey: (key) => byKey.get(key),
    byId: (planId) => byId.get(planId),
    require: (key) => {
      const plan = byKey.get(key);
      if (!plan) throw new Error(`helcim plan: unknown key "${key}"`);
      return plan;
    },
  };
}
