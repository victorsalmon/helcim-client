import type { TransportRequest } from '../transport.js';
import { numericBoolean } from '../types.js';
import type { HelcimPaymentPlan, HelcimSubscription, CreatePaymentPlanInput, CreateSubscriptionInput } from '../types.js';
import { generateIdempotencyKey, firstArray } from '../util.js';
import { decodePaymentPlan, decodeSubscription, assertPositiveAmount, assertNonEmptyString, assertPositiveInteger, decodeFirstInData } from '../decode.js';

export interface RecurringContext {
  request: TransportRequest;
}

/** Endpoint group factory — composed by client.ts. */
export function createRecurringApi({ request }: RecurringContext) {
  // ─── Payment plans ─────────────────────────────────────────────────────
  /** Create a payment plan (subscription or cycle schedule). */
  async function createPaymentPlan(
    input: CreatePaymentPlanInput
  ): Promise<HelcimPaymentPlan> {
    assertNonEmptyString(input.name, 'createPaymentPlan name');
    assertNonEmptyString(input.currency, 'createPaymentPlan currency');
    assertNonEmptyString(input.type, 'createPaymentPlan type');
    assertNonEmptyString(input.billingPeriod, 'createPaymentPlan billingPeriod');
    assertNonEmptyString(input.dateBilling, 'createPaymentPlan dateBilling');
    assertNonEmptyString(input.termType, 'createPaymentPlan termType');
    assertPositiveAmount(input.recurringAmount, 'createPaymentPlan recurringAmount');
    const plan: Record<string, unknown> = {
      name: input.name,
      type: input.type,
      currency: input.currency,
      recurringAmount: input.recurringAmount,
      billingPeriod: input.billingPeriod,
      dateBilling: input.dateBilling,
      termType: input.termType,
    };
    if (input.status) plan.status = input.status;
    plan.cardTerminalId = input.cardTerminalId;
    plan.setupAmount = input.setupAmount;
    if (input.billSetupImmediately) plan.billSetupImmediately = input.billSetupImmediately;
    plan.billingPeriodIncrements = input.billingPeriodIncrements;
    plan.freeTrialPeriod = input.freeTrialPeriod;
    if (input.taxType) plan.taxType = input.taxType;
    if (input.taxCalculation) plan.taxCalculation = input.taxCalculation;
    plan.termLength = input.termLength;
    if (input.paymentMethod) plan.paymentMethod = input.paymentMethod;
    if (input.businessEmail) plan.businessEmail = input.businessEmail;
    if (input.addOnIds) plan.addOnIds = input.addOnIds;
    if (input.isProrated) plan.isProrated = input.isProrated;
    const raw = await request('POST', '/payment-plans', { body: { paymentPlans: [plan] } });
    const arr = firstArray(raw, ['data']);
    if (!arr?.[0]) throw new Error('Helcim createPaymentPlan returned no plans');
    return decodePaymentPlan(arr[0]);
  }

  /** Retrieve a single payment plan by id. */
  async function getPaymentPlan(planId: number): Promise<HelcimPaymentPlan> {
    assertPositiveInteger(planId, 'Helcim getPaymentPlan requires a positive integer planId');
    const raw = await request('GET', `/payment-plans/${planId}`);
    return decodeFirstInData(raw, decodePaymentPlan);
  }

  /** List payment plans, optionally filtered by status or paginated. */
  async function getPaymentPlans(params: {
    page?: number;
    limit?: number;
    status?: 'active' | 'inactive';
  } = {}): Promise<HelcimPaymentPlan[]> {
    const raw = await request('GET', '/payment-plans', {
      query: { page: params.page, limit: params.limit, status: params.status },
    });
    const arr = firstArray(raw, ['data']) ?? [];
    return arr.map(decodePaymentPlan);
  }

  /** Delete a payment plan by id. */
  async function deletePaymentPlan(planId: number): Promise<boolean> {
    assertPositiveInteger(planId, 'Helcim deletePaymentPlan requires a positive integer planId');
    await request('DELETE', `/payment-plans/${planId}`);
    return true;
  }

  // ─── Subscriptions ─────────────────────────────────────────────────────
  /** Create a subscription for a customer on a payment plan. */
  async function createSubscription(
    input: CreateSubscriptionInput,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimSubscription> {
    assertPositiveInteger(input.paymentPlanId, 'Helcim createSubscription requires a positive integer paymentPlanId');
    assertNonEmptyString(input.customerCode, 'createSubscription customerCode');
    const sub: Record<string, unknown> = {
      paymentPlanId: input.paymentPlanId,
      customerCode: input.customerCode,
    };
    if (input.dateActivated) sub.dateActivated = input.dateActivated;
    sub.useCustomSetupAmount = input.useCustomSetupAmount;
    sub.setupAmount = input.setupAmount;
    if (input.recurringAmount !== undefined) {
      assertPositiveAmount(input.recurringAmount, 'createSubscription recurringAmount');
      sub.recurringAmount = input.recurringAmount;
    }
    sub.withFreeTrialPeriod = input.withFreeTrialPeriod;
    sub.freeTrialPeriod = input.freeTrialPeriod;
    if (input.paymentMethod) sub.paymentMethod = input.paymentMethod;
    sub.maxCycles = input.maxCycles;
    if (input.addOns) sub.addOns = input.addOns;
    const raw = await request('POST', '/subscriptions', {
      body: { subscriptions: [sub] },
      idempotencyKey,
    });
    const arr = firstArray(raw, ['data']);
    if (!arr?.[0]) throw new Error('Helcim createSubscription returned no subscriptions');
    return decodeSubscription(arr[0]);
  }

  /** Retrieve a single subscription by id. */
  async function getSubscription(
    subscriptionId: number,
    includeSubObjects = false
  ): Promise<HelcimSubscription> {
    assertPositiveInteger(subscriptionId, 'Helcim getSubscription requires a positive integer subscriptionId');
    const raw = await request('GET', `/subscriptions/${subscriptionId}`, {
      query: includeSubObjects ? { includeSubObjects: true } : {},
    });
    return decodeFirstInData(raw, decodeSubscription);
  }

  /** List subscriptions, optionally filtered by customer or payment plan. */
  async function getSubscriptions(params: {
    customerCode?: string;
    paymentPlanId?: number;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<HelcimSubscription[]> {
    const raw = await request('GET', '/subscriptions', {
      query: {
        customerCode: params.customerCode,
        paymentPlanId: params.paymentPlanId,
        status: params.status,
        page: params.page,
        limit: params.limit,
      },
    });
    const arr = firstArray(raw, ['data']) ?? [];
    return arr.map(decodeSubscription);
  }

  /** Delete a subscription by id. */
  async function deleteSubscription(subscriptionId: number): Promise<boolean> {
    assertPositiveInteger(subscriptionId, 'Helcim deleteSubscription requires a positive integer subscriptionId');
    await request('DELETE', `/subscriptions/${subscriptionId}`);
    return true;
  }

  // ─── Procedures ────────────────────────────────────────────────────────
  /** Manually process a single subscription payment by payment number. */
  async function processSubscriptionPayment(
    subscriptionId: number,
    paymentNumber: number,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimSubscription> {
    assertPositiveInteger(subscriptionId, 'Helcim processSubscriptionPayment requires a positive integer subscriptionId');
    assertPositiveInteger(paymentNumber, 'Helcim processSubscriptionPayment requires a positive integer paymentNumber');
    const raw = await request('POST', '/procedures/process-payment', {
      body: { subscriptionId, paymentNumber },
      idempotencyKey,
    });
    const arr = firstArray(raw, ['data']) ?? [];
    return decodeSubscription(arr[0] ?? raw);
  }

  return {
    createPaymentPlan,
    getPaymentPlan,
    getPaymentPlans,
    deletePaymentPlan,
    createSubscription,
    getSubscription,
    getSubscriptions,
    deleteSubscription,
    processSubscriptionPayment,
  };
}

