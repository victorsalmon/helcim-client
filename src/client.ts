import type { HelcimConfig } from './config.js';
import { firstString, firstNumber, firstBoolean, firstArray, generateIdempotencyKey, isProviderErrorStatus, optionalString } from './util.js';

// ─── Shared types ───────────────────────────────────────────────────────────

export interface HelcimAddress {
  name: string;
  street1: string;
  street2?: string;
  city?: string;
  province?: string;
  country?: string;
  postalCode: string;
  phone?: string;
  email?: string;
}

export interface HelcimCustomer {
  id: number;
  customerCode: string;
  businessName: string | null;
  contactName: string | null;
  cellPhone: string | null;
  billingAddress: HelcimAddress | null;
  shippingAddress: HelcimAddress | null;
  cards: HelcimCard[];
  raw: Record<string, unknown>;
}

export interface HelcimCard {
  id: number;
  cardHolderName: string | null;
  cardF6L4: string | null;
  cardToken: string | null;
  cardExpiry: string | null;
  dateCreated: string | null;
  dateUpdated: string | null;
  raw: Record<string, unknown>;
}

export interface HelcimCardTransaction {
  transactionId: number;
  cardBatchId: number | null;
  dateCreated: string | null;
  status: string | null;
  type: string | null;
  amount: number | null;
  currency: string | null;
  avsResponse: string | null;
  cvvResponse: string | null;
  cardType: string | null;
  approvalCode: string | null;
  cardToken: string | null;
  cardNumber: string | null;
  cardHolderName: string | null;
  customerCode: string | null;
  invoiceNumber: string | null;
  warning: string | null;
  raw: Record<string, unknown>;
}

export interface HelcimPaymentPlan {
  id: number;
  dateCreated: string | null;
  dateUpdated: string | null;
  name: string | null;
  description: string | null;
  type: 'subscription' | 'cycle' | null;
  status: 'active' | 'inactive' | null;
  currency: string | null;
  cardTerminalId: number | null;
  setupAmount: number | null;
  recurringAmount: number | null;
  billSetupImmediately: string | null;
  billingPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  billingPeriodIncrements: number | null;
  dateBilling: string | null;
  termType: 'forever' | 'expires' | null;
  freeTrialPeriod: number | null;
  taxType: 'no_tax' | 'customer' | 'merchant' | null;
  taxCalculation: string | null;
  termLength: number | null;
  paymentMethod: 'card' | 'bank' | 'card_bank' | null;
  businessEmail: string | null;
  addOnIds: number[];
  isProrated: string | null;
  raw: Record<string, unknown>;
}

export interface HelcimSubscriptionPayment {
  id: number;
  setupAmount: number | null;
  recurringAmount: number | null;
  addOnAmount: number | null;
  amount: number | null;
  taxAmount: number | null;
  status: 'approved' | 'declined' | 'failed' | 'waiting' | string | null;
  dateDue: string | null;
  dateProcessed: string | null;
  paymentNumber: number | null;
  numberOfRetries: number | null;
  raw: Record<string, unknown>;
}

export interface HelcimSubscription {
  id: number;
  dateCreated: string | null;
  dateUpdated: string | null;
  dateActivated: string | null;
  dateBilling: string | null;
  status: string | null;
  paymentPlanId: number | null;
  customerCode: string | null;
  timesBilled: number | null;
  setupAmount: number | null;
  recurringAmount: number | null;
  freeTrialPeriod: number | null;
  hasFailedPayments: string | null;
  isProrated: string | null;
  addOnIds: number[];
  payments: HelcimSubscriptionPayment[];
  raw: Record<string, unknown>;
}

export interface HelcimCheckoutSession {
  checkoutToken: string;
  secretToken: string;
}

// ─── Input types ────────────────────────────────────────────────────────────

export interface CreateCustomerInput {
  customerCode?: string;
  contactName?: string;
  businessName?: string;
  cellPhone?: string;
  billingAddress?: HelcimAddress;
  shippingAddress?: HelcimAddress;
}

export interface InitializeHelcimPayInput {
  paymentType: 'purchase' | 'preauth' | 'verify';
  amount?: number;
  currency?: string;
  customerCode?: string;
  invoiceNumber?: string;
  language?: 'en' | 'fr';
  setAsDefaultPaymentMethod?: boolean;
  customerRequest?: {
    contactName: string;
    businessName?: string;
    customerCode?: string;
    cellPhone?: string;
    billingAddress?: HelcimAddress;
    shippingAddress?: HelcimAddress;
  };
  invoiceRequest?: {
    contactName: string;
    lineItems: Array<{
      description: string;
      quantity: number;
      price: number;
      total: number;
      sku?: string;
      taxAmount?: number;
      discountAmount?: number;
    }>;
    invoiceNumber?: string;
    notes?: string;
  };
  customStyling?: {
    appearance?: 'light' | 'dark' | 'system';
    brandColor?: string;
    cornerRadius?: 'pill' | 'rectangular' | 'rounded';
    ctaButtonText?: 'book' | 'buy' | 'checkout' | 'donate' | 'order' | 'pay' | 'subscribe';
  };
  confirmationScreen?: boolean;
  allowExit?: boolean;
}

export interface CreatePaymentPlanInput {
  name: string;
  type: 'subscription' | 'cycle';
  status?: 'active' | 'inactive';
  currency: string;
  cardTerminalId?: number;
  setupAmount?: number;
  recurringAmount: number;
  billSetupImmediately?: 'immediate' | 'first_billing';
  billingPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly';
  billingPeriodIncrements?: number;
  dateBilling: string;
  termType: 'forever' | 'expires';
  freeTrialPeriod?: number;
  taxType?: 'no_tax' | 'customer' | 'merchant';
  taxCalculation?: 'country_only' | 'country_province' | 'province_only';
  termLength?: number;
  paymentMethod?: 'card' | 'bank' | 'card_bank';
  businessEmail?: string;
  addOnIds?: number[];
  isProrated?: 'yes' | 'no';
}

export interface CreateSubscriptionInput {
  paymentPlanId: number;
  customerCode: string;
  dateActivated?: string;
  useCustomSetupAmount?: boolean;
  setupAmount?: number;
  recurringAmount?: number;
  withFreeTrialPeriod?: boolean;
  freeTrialPeriod?: number;
  paymentMethod?: 'card' | 'bank';
  maxCycles?: number;
  addOns?: Array<{ addOnId: number; quantity?: number }>;
}

// ─── Response decoders ──────────────────────────────────────────────────────

function decodeAddress(raw: unknown): HelcimAddress | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const name = firstString(r, ['name', 'Name']);
  const street1 = firstString(r, ['street1', 'Street1', 'street_1']);
  const postalCode = firstString(r, ['postalCode', 'PostalCode', 'postal_code']);
  if (!name || !street1 || !postalCode) return null;
  return {
    name,
    street1,
    street2: optionalString(firstString(r, ['street2', 'Street2', 'street_2']) ?? undefined) ?? undefined,
    city: optionalString(firstString(r, ['city', 'City']) ?? undefined) ?? undefined,
    province: optionalString(firstString(r, ['province', 'Province']) ?? undefined) ?? undefined,
    country: optionalString(firstString(r, ['country', 'Country']) ?? undefined) ?? undefined,
    postalCode,
    phone: optionalString(firstString(r, ['phone', 'Phone']) ?? undefined) ?? undefined,
    email: optionalString(firstString(r, ['email', 'Email']) ?? undefined) ?? undefined,
  };
}

function decodeCard(raw: unknown): HelcimCard {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    id: firstNumber(r, ['id', 'Id']) ?? 0,
    cardHolderName: firstString(r, ['cardHolderName', 'cardHolder', 'card_holder_name']),
    cardF6L4: firstString(r, ['cardF6L4', 'cardF4L6', 'card_f6l4']),
    cardToken: firstString(r, ['cardToken', 'card_token']),
    cardExpiry: firstString(r, ['cardExpiry', 'card_expiry']),
    dateCreated: firstString(r, ['dateCreated', 'date_created']),
    dateUpdated: firstString(r, ['dateUpdated', 'date_updated']),
    raw: r,
  };
}

function decodeCustomer(raw: unknown): HelcimCustomer {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const cardsRaw = firstArray(r, ['cards', 'Cards']) ?? [];
  return {
    id: firstNumber(r, ['id', 'Id']) ?? 0,
    customerCode: firstString(r, ['customerCode', 'customer_code']) ?? '',
    businessName: firstString(r, ['businessName', 'business_name']),
    contactName: firstString(r, ['contactName', 'contact_name']),
    cellPhone: firstString(r, ['cellPhone', 'cellphone', 'cell_phone']),
    billingAddress: decodeAddress(r.billingAddress ?? r.billing_address),
    shippingAddress: decodeAddress(r.shippingAddress ?? r.shipping_address),
    cards: cardsRaw.map(decodeCard),
    raw: r,
  };
}

function decodeCardTransaction(raw: unknown): HelcimCardTransaction {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    transactionId: firstNumber(r, ['transactionId', 'transaction_id']) ?? 0,
    cardBatchId: firstNumber(r, ['cardBatchId', 'card_batch_id']),
    dateCreated: firstString(r, ['dateCreated', 'date_created']),
    status: firstString(r, ['status', 'Status']),
    type: firstString(r, ['type', 'Type']),
    amount: firstNumber(r, ['amount', 'Amount']),
    currency: firstString(r, ['currency', 'Currency']),
    avsResponse: firstString(r, ['avsResponse', 'avs_response']),
    cvvResponse: firstString(r, ['cvvResponse', 'cvv_response']),
    cardType: firstString(r, ['cardType', 'card_type']),
    approvalCode: firstString(r, ['approvalCode', 'approval_code']),
    cardToken: firstString(r, ['cardToken', 'card_token']),
    cardNumber: firstString(r, ['cardNumber', 'card_number']),
    cardHolderName: firstString(r, ['cardHolderName', 'card_holder_name']),
    customerCode: firstString(r, ['customerCode', 'customer_code']),
    invoiceNumber: firstString(r, ['invoiceNumber', 'invoice_number']),
    warning: firstString(r, ['warning', 'Warning']),
    raw: r,
  };
}

function decodePaymentPlan(raw: unknown): HelcimPaymentPlan {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const type = firstString(r, ['type', 'Type']) as HelcimPaymentPlan['type'];
  const status = firstString(r, ['status', 'Status']) as HelcimPaymentPlan['status'];
  const billingPeriod = firstString(r, ['billingPeriod', 'billing_period']) as HelcimPaymentPlan['billingPeriod'];
  const termType = firstString(r, ['termType', 'term_type']) as HelcimPaymentPlan['termType'];
  const taxType = firstString(r, ['taxType', 'tax_type']) as HelcimPaymentPlan['taxType'];
  const paymentMethod = firstString(r, ['paymentMethod', 'payment_method']) as HelcimPaymentPlan['paymentMethod'];
  return {
    id: firstNumber(r, ['id', 'Id']) ?? 0,
    dateCreated: firstString(r, ['dateCreated', 'date_created']),
    dateUpdated: firstString(r, ['dateUpdated', 'date_updated']),
    name: firstString(r, ['name', 'Name']),
    description: firstString(r, ['description', 'Description']),
    type: type ?? null,
    status: status ?? null,
    currency: firstString(r, ['currency', 'Currency']),
    cardTerminalId: firstNumber(r, ['cardTerminalId', 'card_terminal_id']),
    setupAmount: firstNumber(r, ['setupAmount', 'setup_amount']),
    recurringAmount: firstNumber(r, ['recurringAmount', 'recurring_amount']),
    billSetupImmediately: firstString(r, ['billSetupImmediately', 'bill_setup_immediately']),
    billingPeriod: billingPeriod ?? null,
    billingPeriodIncrements: firstNumber(r, ['billingPeriodIncrements', 'billing_period_increments']),
    dateBilling: firstString(r, ['dateBilling', 'date_billing']),
    termType: termType ?? null,
    freeTrialPeriod: firstNumber(r, ['freeTrialPeriod', 'free_trial_period']),
    taxType: taxType ?? null,
    taxCalculation: firstString(r, ['taxCalculation', 'tax_calculation']),
    termLength: firstNumber(r, ['termLength', 'term_length']),
    paymentMethod: paymentMethod ?? null,
    businessEmail: firstString(r, ['businessEmail', 'business_email']),
    addOnIds: (firstArray(r, ['addOnIds', 'add_on_ids']) ?? []).map((v) =>
      typeof v === 'number' ? v : Number(v) || 0
    ),
    isProrated: firstString(r, ['isProrated', 'is_prorated']),
    raw: r,
  };
}

function decodeSubscriptionPayment(raw: unknown): HelcimSubscriptionPayment {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    id: firstNumber(r, ['id', 'Id']) ?? 0,
    setupAmount: firstNumber(r, ['setupAmount', 'setup_amount']),
    recurringAmount: firstNumber(r, ['recurringAmount', 'recurring_amount']),
    addOnAmount: firstNumber(r, ['addOnAmount', 'add_on_amount']),
    amount: firstNumber(r, ['amount', 'Amount']),
    taxAmount: firstNumber(r, ['taxAmount', 'tax_amount']),
    status: firstString(r, ['status', 'Status']),
    dateDue: firstString(r, ['dateDue', 'date_due']),
    dateProcessed: firstString(r, ['dateProcessed', 'date_processed']),
    paymentNumber: firstNumber(r, ['paymentNumber', 'payment_number']),
    numberOfRetries: firstNumber(r, ['numberOfRetries', 'number_of_retries']),
    raw: r,
  };
}

function decodeSubscription(raw: unknown): HelcimSubscription {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const paymentsRaw = firstArray(r, ['payments', 'Payments']) ?? [];
  return {
    id: firstNumber(r, ['id', 'Id']) ?? 0,
    dateCreated: firstString(r, ['dateCreated', 'date_created']),
    dateUpdated: firstString(r, ['dateUpdated', 'date_updated']),
    dateActivated: firstString(r, ['dateActivated', 'date_activated']),
    dateBilling: firstString(r, ['dateBilling', 'date_billing']),
    status: firstString(r, ['status', 'Status']),
    paymentPlanId: firstNumber(r, ['paymentPlanId', 'payment_plan_id']),
    customerCode: firstString(r, ['customerCode', 'customer_code']),
    timesBilled: firstNumber(r, ['timesBilled', 'times_billed']),
    setupAmount: firstNumber(r, ['setupAmount', 'setup_amount']),
    recurringAmount: firstNumber(r, ['recurringAmount', 'recurring_amount']),
    freeTrialPeriod: firstNumber(r, ['freeTrialPeriod', 'free_trial_period']),
    hasFailedPayments: firstString(r, ['hasFailedPayments', 'has_failed_payments']),
    isProrated: firstString(r, ['isProrated', 'is_prorated']),
    addOnIds: (firstArray(r, ['addOnIds', 'add_on_ids']) ?? []).map((v) =>
      typeof v === 'number' ? v : Number(v) || 0
    ),
    payments: paymentsRaw.map(decodeSubscriptionPayment),
    raw: r,
  };
}

// ─── Client factory ─────────────────────────────────────────────────────────

function assertPositiveAmount(value: number, name: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`Helcim ${name} requires a positive finite amount`);
  }
}

function assertNonEmptyString(value: unknown, name: string): void {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Helcim ${name} is required`);
  }
}

function addressToPayload(addr: HelcimAddress): Record<string, string | undefined> {
  return {
    name: addr.name,
    street1: addr.street1,
    street2: optionalString(addr.street2),
    city: optionalString(addr.city),
    province: optionalString(addr.province),
    country: optionalString(addr.country),
    postalCode: addr.postalCode,
    phone: optionalString(addr.phone),
    email: optionalString(addr.email),
  };
}

/**
 * Create a Helcim API client.
 *
 * The client is intentionally narrow: it posts requests, validates responses,
 * and returns typed objects without touching product state (tenants, ledgers,
 * gating). Product-specific orchestration lives in the consuming application.
 *
 * All Payment API and Recurring API write endpoints automatically generate
 * and send an `idempotency-key` header unless the caller supplies one.
 */
export function createHelcimClient(config: HelcimConfig, fetchImpl: typeof fetch = fetch) {
  const baseHeaders: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
    'api-token': config.apiToken,
  };

  async function request(
    method: string,
    path: string,
    opts: {
      body?: unknown;
      idempotencyKey?: string;
      query?: Record<string, string | number | boolean | undefined>;
    } = {}
  ): Promise<Record<string, unknown>> {
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
    const response = await fetchImpl(url.toString(), {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
    const text = await response.text();
    let raw: Record<string, unknown> = {};
    if (text) {
      try {
        const parsed = JSON.parse(text) as unknown;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          raw = parsed as Record<string, unknown>;
        } else if (Array.isArray(parsed)) {
          // Some list endpoints return a bare array; wrap it for uniform handling.
          raw = { data: parsed };
        }
      } catch {
        // Non-JSON error body — do not echo into logs (may contain sensitive data).
      }
    }
    if (!response.ok) {
      const errors = firstArray(raw, ['errors', 'Errors']) ?? [];
      const message =
        errors.length > 0 && typeof errors[0] === 'string'
          ? errors[0]
          : `Helcim ${method} ${path} failed with HTTP ${response.status}`;
      throw new Error(message);
    }
    // Recurring API wraps responses in { data: [...] } or { data: {...} }.
    // Payment API returns the object directly. Unwrap for callers.
    return raw;
  }

  // ─── Connection test ───────────────────────────────────────────────────
  async function connectionTest(): Promise<boolean> {
    try {
      await request('GET', '/connection-test');
      return true;
    } catch {
      return false;
    }
  }

  // ─── Customers ─────────────────────────────────────────────────────────
  async function createCustomer(input: CreateCustomerInput): Promise<HelcimCustomer> {
    if (!input.contactName && !input.businessName) {
      throw new Error('Helcim createCustomer requires contactName or businessName');
    }
    const body: Record<string, unknown> = {};
    if (input.customerCode) body.customerCode = input.customerCode;
    if (input.contactName) body.contactName = input.contactName;
    if (input.businessName) body.businessName = input.businessName;
    if (input.cellPhone) body.cellPhone = input.cellPhone;
    if (input.billingAddress) body.billingAddress = addressToPayload(input.billingAddress);
    if (input.shippingAddress) body.shippingAddress = addressToPayload(input.shippingAddress);
    const raw = await request('POST', '/customers', { body });
    return decodeCustomer(raw);
  }

  async function getCustomer(customerId: number): Promise<HelcimCustomer> {
    if (!Number.isInteger(customerId) || customerId <= 0) {
      throw new Error('Helcim getCustomer requires a positive integer customerId');
    }
    const raw = await request('GET', `/customers/${customerId}`);
    return decodeCustomer(raw);
  }

  async function getCustomers(params: {
    customerCode?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<HelcimCustomer[]> {
    const raw = await request('GET', '/customers', {
      query: {
        customerCode: params.customerCode,
        page: params.page,
        limit: params.limit,
      },
    });
    const arr = firstArray(raw, ['data', 'customers', 'Customers']) ?? [];
    return arr.map(decodeCustomer);
  }

  // ─── Customer cards ────────────────────────────────────────────────────
  async function getCustomerCards(customerId: number, cardToken?: string): Promise<HelcimCard[]> {
    if (!Number.isInteger(customerId) || customerId <= 0) {
      throw new Error('Helcim getCustomerCards requires a positive integer customerId');
    }
    const raw = await request('GET', `/customers/${customerId}/cards`, {
      query: { cardToken },
    });
    const arr = Array.isArray(raw) ? raw : (firstArray(raw, ['data', 'cards', 'Cards']) ?? []);
    return arr.map(decodeCard);
  }

  async function setCustomerCardDefault(customerId: number, cardId: number): Promise<HelcimCustomer[]> {
    if (!Number.isInteger(customerId) || customerId <= 0) {
      throw new Error('Helcim setCustomerCardDefault requires a positive integer customerId');
    }
    if (!Number.isInteger(cardId) || cardId <= 0) {
      throw new Error('Helcim setCustomerCardDefault requires a positive integer cardId');
    }
    const raw = await request('PATCH', `/customers/${customerId}/cards/${cardId}/default`);
    const arr = Array.isArray(raw) ? raw : (firstArray(raw, ['data']) ?? [raw]);
    return arr.map(decodeCustomer);
  }

  // ─── HelcimPay.js checkout session ─────────────────────────────────────
  async function initializeHelcimPay(
    input: InitializeHelcimPayInput
  ): Promise<HelcimCheckoutSession> {
    assertNonEmptyString(input.paymentType, 'initializeHelcimPay paymentType');
    const body: Record<string, unknown> = {
      paymentType: input.paymentType,
    };
    if (input.amount !== undefined) {
      assertPositiveAmount(input.amount, 'initializeHelcimPay amount');
      body.amount = input.amount;
    }
    if (input.currency) body.currency = input.currency;
    if (input.customerCode) body.customerCode = input.customerCode;
    if (input.invoiceNumber) body.invoiceNumber = input.invoiceNumber;
    if (input.language) body.language = input.language;
    if (input.setAsDefaultPaymentMethod !== undefined) {
      body.setAsDefaultPaymentMethod = input.setAsDefaultPaymentMethod ? 1 : 0;
    }
    if (input.customerRequest) {
      assertNonEmptyString(input.customerRequest.contactName, 'customerRequest contactName');
      const cr: Record<string, unknown> = { contactName: input.customerRequest.contactName };
      if (input.customerRequest.businessName) cr.businessName = input.customerRequest.businessName;
      if (input.customerRequest.customerCode) cr.customerCode = input.customerRequest.customerCode;
      if (input.customerRequest.cellPhone) cr.cellPhone = input.customerRequest.cellPhone;
      if (input.customerRequest.billingAddress) cr.billingAddress = addressToPayload(input.customerRequest.billingAddress);
      if (input.customerRequest.shippingAddress) cr.shippingAddress = addressToPayload(input.customerRequest.shippingAddress);
      body.customerRequest = cr;
    }
    if (input.invoiceRequest) {
      body.invoiceRequest = input.invoiceRequest;
    }
    if (input.customStyling) {
      body.customStyling = input.customStyling;
    }
    if (input.confirmationScreen !== undefined) body.confirmationScreen = input.confirmationScreen;
    if (input.allowExit !== undefined) body.allowExit = input.allowExit;

    const raw = await request('POST', '/helcim-pay/initialize', { body });
    const checkoutToken = firstString(raw, ['checkoutToken', 'checkout_token']);
    const secretToken = firstString(raw, ['secretToken', 'secret_token']);
    if (!checkoutToken || !secretToken) {
      throw new Error('Helcim initializeHelcimPay did not return checkoutToken and secretToken');
    }
    return { checkoutToken, secretToken };
  }

  // ─── Payment plans ─────────────────────────────────────────────────────
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
    if (input.cardTerminalId !== undefined) plan.cardTerminalId = input.cardTerminalId;
    if (input.setupAmount !== undefined) plan.setupAmount = input.setupAmount;
    if (input.billSetupImmediately) plan.billSetupImmediately = input.billSetupImmediately;
    if (input.billingPeriodIncrements !== undefined) plan.billingPeriodIncrements = input.billingPeriodIncrements;
    if (input.freeTrialPeriod !== undefined) plan.freeTrialPeriod = input.freeTrialPeriod;
    if (input.taxType) plan.taxType = input.taxType;
    if (input.taxCalculation) plan.taxCalculation = input.taxCalculation;
    if (input.termLength !== undefined) plan.termLength = input.termLength;
    if (input.paymentMethod) plan.paymentMethod = input.paymentMethod;
    if (input.businessEmail) plan.businessEmail = input.businessEmail;
    if (input.addOnIds) plan.addOnIds = input.addOnIds;
    if (input.isProrated) plan.isProrated = input.isProrated;
    const raw = await request('POST', '/payment-plans', { body: { paymentPlans: [plan] } });
    const arr = firstArray(raw, ['data']) ?? [];
    if (arr.length === 0) throw new Error('Helcim createPaymentPlan returned no plans');
    return decodePaymentPlan(arr[0]);
  }

  async function getPaymentPlan(planId: number): Promise<HelcimPaymentPlan> {
    if (!Number.isInteger(planId) || planId <= 0) {
      throw new Error('Helcim getPaymentPlan requires a positive integer planId');
    }
    const raw = await request('GET', `/payment-plans/${planId}`);
    const arr = firstArray(raw, ['data']) ?? [raw];
    return decodePaymentPlan(arr[0] ?? raw);
  }

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

  async function deletePaymentPlan(planId: number): Promise<boolean> {
    if (!Number.isInteger(planId) || planId <= 0) {
      throw new Error('Helcim deletePaymentPlan requires a positive integer planId');
    }
    await request('DELETE', `/payment-plans/${planId}`);
    return true;
  }

  // ─── Subscriptions ─────────────────────────────────────────────────────
  async function createSubscription(
    input: CreateSubscriptionInput,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimSubscription> {
    if (!Number.isInteger(input.paymentPlanId) || input.paymentPlanId <= 0) {
      throw new Error('Helcim createSubscription requires a positive integer paymentPlanId');
    }
    assertNonEmptyString(input.customerCode, 'createSubscription customerCode');
    const sub: Record<string, unknown> = {
      paymentPlanId: input.paymentPlanId,
      customerCode: input.customerCode,
    };
    if (input.dateActivated) sub.dateActivated = input.dateActivated;
    if (input.useCustomSetupAmount !== undefined) sub.useCustomSetupAmount = input.useCustomSetupAmount;
    if (input.setupAmount !== undefined) sub.setupAmount = input.setupAmount;
    if (input.recurringAmount !== undefined) {
      assertPositiveAmount(input.recurringAmount, 'createSubscription recurringAmount');
      sub.recurringAmount = input.recurringAmount;
    }
    if (input.withFreeTrialPeriod !== undefined) sub.withFreeTrialPeriod = input.withFreeTrialPeriod;
    if (input.freeTrialPeriod !== undefined) sub.freeTrialPeriod = input.freeTrialPeriod;
    if (input.paymentMethod) sub.paymentMethod = input.paymentMethod;
    if (input.maxCycles !== undefined) sub.maxCycles = input.maxCycles;
    if (input.addOns) sub.addOns = input.addOns;
    const raw = await request('POST', '/subscriptions', {
      body: { subscriptions: [sub] },
      idempotencyKey,
    });
    const arr = firstArray(raw, ['data']) ?? [];
    if (arr.length === 0) throw new Error('Helcim createSubscription returned no subscriptions');
    return decodeSubscription(arr[0]);
  }

  async function getSubscription(
    subscriptionId: number,
    includeSubObjects = false
  ): Promise<HelcimSubscription> {
    if (!Number.isInteger(subscriptionId) || subscriptionId <= 0) {
      throw new Error('Helcim getSubscription requires a positive integer subscriptionId');
    }
    const raw = await request('GET', `/subscriptions/${subscriptionId}`, {
      query: includeSubObjects ? { includeSubObjects: true } : {},
    });
    const arr = firstArray(raw, ['data']) ?? [raw];
    return decodeSubscription(arr[0] ?? raw);
  }

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

  async function deleteSubscription(subscriptionId: number): Promise<boolean> {
    if (!Number.isInteger(subscriptionId) || subscriptionId <= 0) {
      throw new Error('Helcim deleteSubscription requires a positive integer subscriptionId');
    }
    await request('DELETE', `/subscriptions/${subscriptionId}`);
    return true;
  }

  // ─── Procedures ────────────────────────────────────────────────────────
  async function processSubscriptionPayment(
    subscriptionId: number,
    paymentNumber: number,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimSubscription> {
    if (!Number.isInteger(subscriptionId) || subscriptionId <= 0) {
      throw new Error('Helcim processSubscriptionPayment requires a positive integer subscriptionId');
    }
    if (!Number.isInteger(paymentNumber) || paymentNumber <= 0) {
      throw new Error('Helcim processSubscriptionPayment requires a positive integer paymentNumber');
    }
    const raw = await request('POST', '/procedures/process-payment', {
      body: { subscriptionId, paymentNumber },
      idempotencyKey,
    });
    const arr = firstArray(raw, ['data']) ?? [raw];
    return decodeSubscription(arr[0] ?? raw);
  }

  // ─── Card transactions ─────────────────────────────────────────────────
  async function getCardTransaction(transactionId: number): Promise<HelcimCardTransaction> {
    if (!Number.isInteger(transactionId) || transactionId <= 0) {
      throw new Error('Helcim getCardTransaction requires a positive integer transactionId');
    }
    const raw = await request('GET', `/card-transactions/${transactionId}`);
    return decodeCardTransaction(raw);
  }

  async function getCardTransactions(params: {
    customerCode?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<HelcimCardTransaction[]> {
    const raw = await request('GET', '/card-transactions', {
      query: {
        customerCode: params.customerCode,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        page: params.page,
        limit: params.limit,
      },
    });
    const arr = firstArray(raw, ['data', 'cardTransactions', 'transactions']) ?? [];
    return arr.map(decodeCardTransaction);
  }

  return {
    connectionTest,
    createCustomer,
    getCustomer,
    getCustomers,
    getCustomerCards,
    setCustomerCardDefault,
    initializeHelcimPay,
    createPaymentPlan,
    getPaymentPlan,
    getPaymentPlans,
    deletePaymentPlan,
    createSubscription,
    getSubscription,
    getSubscriptions,
    deleteSubscription,
    processSubscriptionPayment,
    getCardTransaction,
    getCardTransactions,
  };
}

export type HelcimClient = ReturnType<typeof createHelcimClient>;

// Re-export decoders for callers that need to parse raw payloads (e.g. webhook
// bodies that contain transaction objects).
export {
  decodeAddress,
  decodeCard,
  decodeCustomer,
  decodeCardTransaction,
  decodePaymentPlan,
  decodeSubscription,
  decodeSubscriptionPayment,
  isProviderErrorStatus,
};
