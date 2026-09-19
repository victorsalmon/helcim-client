/**
 * Composition root for the Helcim API client.
 *
 * The client is intentionally narrow: it posts requests, validates responses,
 * and returns typed objects without touching product state (tenants, ledgers,
 * gating). Product-specific orchestration lives in the consuming application.
 *
 * Module layout:
 *   config.ts    — HelcimConfig (plain data) + env factory
 *   transport.ts — HTTP request/timeout/retry policy
 *   decode.ts    — response decoders + validation/unwrapping helpers
 *   types.ts     — shared entity/input types
 *   resources/*  — endpoint groups, each a factory over `{ request }`
 *   webhook.ts   — webhook signature verification + body parsing
 *
 * All Payment API and Recurring API write endpoints automatically generate
 * and send an `idempotency-key` header unless the caller supplies one.
 */
import { createTransport } from './transport.js';
import { createCustomersApi } from './resources/customers.js';
import { createCheckoutApi } from './resources/checkout.js';
import { createRecurringApi } from './resources/recurring.js';
import { createCardTransactionQueriesApi } from './resources/cardqueries.js';
import { createPaymentApi } from './resources/paymentapi.js';
import { createBankAndAchApi } from './resources/bankach.js';
import { createInvoicesApi } from './resources/invoices.js';
import type { HelcimConfig } from './config.js';

export * from './types.js';
export {
  decodeAddress,
  decodeCard,
  decodeCustomer,
  decodeCardTransaction,
  decodePaymentPlan,
  decodeSubscription,
  decodeSubscriptionPayment,
  decodeBankAccount,
  decodePADAgreement,
  decodeACHTransaction,
  decodeInvoice,
} from './decode.js';
export { isProviderErrorStatus } from './util.js';

/**
 * Create a Helcim API client.
 */
export function createHelcimClient(config: HelcimConfig, fetchImpl: typeof fetch = fetch) {
  const { request } = createTransport(config, fetchImpl);

  // ─── Connection test ───────────────────────────────────────────────────
  /** Check whether the Helcim API is reachable with the current credentials. */
  async function connectionTest(): Promise<boolean> {
    try {
      await request('GET', '/connection-test');
      return true;
    } catch {
      return false;
    }
  }

  return {
    connectionTest,
    ...createCustomersApi({ request }),
    ...createCheckoutApi({ request }),
    ...createRecurringApi({ request }),
    ...createCardTransactionQueriesApi({ request }),
    ...createPaymentApi({ request }),
    ...createBankAndAchApi({ request }),
    ...createInvoicesApi({ request }),
  };
}

export type HelcimClient = ReturnType<typeof createHelcimClient>;
