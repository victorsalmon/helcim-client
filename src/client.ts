/**
 * Helcim API client, response models, and payload decoders.
 *
 * This module is product-neutral: it posts to the Helcim REST API, decodes
 * the inconsistent response shapes into predictable TypeScript objects, and
 * returns them without product-specific orchestration.
 */

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

// ─── Bank account + PAD + ACH types ─────────────────────────────────────────

export interface HelcimBankAccount {
  id: number;
  customerId: number | null;
  dateCreated: string | null;
  dateUpdated: string | null;
  dateLastUsed: string | null;
  dateVerified: string | null;
  bankToken: string | null;
  accountType: 'CHECKING' | 'SAVINGS' | string | null;
  accountCorporate: 'PERSONAL' | 'CORPORATE' | string | null;
  verified: boolean | null;
  ready: boolean | null;
  bankIdNumber: string | null;
  transitNumber: string | null;
  routingNumber: string | null;
  bankAccountNumberL4: string | null;
  address: HelcimAddress | null;
  raw: Record<string, unknown>;
}

export interface HelcimPADAgreement {
  id: number;
  accepted: boolean;
  bankAccountId: number | null;
  customerId: number | null;
  dateAccepted: string | null;
  dateCreated: string | null;
  dateEarliestDebit: string | null;
  dateRevoked: string | null;
  dateUpdated: string | null;
  ipAddress: string | null;
  merchantAuthorized: boolean;
  type: number | null;
  status: number | null;
  raw: Record<string, unknown>;
}

/**
 * ACH transaction `statusAuth` values.
 *
 * These map to Helcim's integer auth state on ACH withdrawals.
 */
export const ACH_STATUS_AUTH = {
  APPROVED: 1,
  DECLINED: 2,
  CANCELLED: 4,
  PENDING: 5,
} as const;

/**
 * ACH transaction `statusClearing` values.
 *
 * These map to Helcim's integer clearing/settlement state.
 */
export const ACH_STATUS_CLEARING = {
  IN_SETTLEMENT: 0,
  SETTLED_APPROVED: 1,
  SETTLED_DECLINED: 4,
} as const;

/**
 * Bank account ownership values.
 *
 * Helcim stores these as integers in the bank-account endpoint.
 */
export const HELCIM_BANK_ACCOUNT_OWNERSHIP = {
  PERSONAL: 1,
  CORPORATE: 2,
} as const;

export type HelcimBankAccountOwnership =
  (typeof HELCIM_BANK_ACCOUNT_OWNERSHIP)[keyof typeof HELCIM_BANK_ACCOUNT_OWNERSHIP];

/**
 * Bank account type values.
 *
 * Helcim stores these as integers in the bank-account endpoint.
 */
export const HELCIM_BANK_ACCOUNT_TYPE = {
  CHECKING: 1,
  SAVINGS: 2,
} as const;

export type HelcimBankAccountType =
  (typeof HELCIM_BANK_ACCOUNT_TYPE)[keyof typeof HELCIM_BANK_ACCOUNT_TYPE];

/**
 * ACH withdrawal currency values.
 *
 * `currencyId` on ACH withdrawals is an integer, unlike card transactions
 * which use an ISO currency string.
 */
export const HELCIM_ACH_CURRENCY = {
  CAD: 1,
  USD: 2,
} as const;

export type HelcimACHCurrency =
  (typeof HELCIM_ACH_CURRENCY)[keyof typeof HELCIM_ACH_CURRENCY];

/**
 * Helcim's numeric boolean convention.
 *
 * Several endpoints use `1` for true and `0` for false. These constants make
 * that convention explicit in decoders and request bodies.
 */
export const HELCIM_BOOLEAN_TRUE = 1 as const;
export const HELCIM_BOOLEAN_FALSE = 0 as const;

export type HelcimNumericBoolean =
  typeof HELCIM_BOOLEAN_TRUE | typeof HELCIM_BOOLEAN_FALSE;

/** Convert a boolean into Helcim's numeric convention (true = 1, false = 0). */
function numericBoolean(value: boolean): HelcimNumericBoolean {
  return value ? HELCIM_BOOLEAN_TRUE : HELCIM_BOOLEAN_FALSE;
}

export interface HelcimACHTransaction {
  id: number;
  merchantId: number | null;
  dateCreated: string | null;
  statusAuth: number | null;
  statusClearing: number | null;
  batchId: number | null;
  bankAccountId: number | null;
  bankAccountL4: string | null;
  transactionType: number | null;
  amount: number | null;
  currency: number | null;
  approvalCode: string | null;
  test: boolean | null;
  acquirerTransactionId: string | null;
  responseMessage: string | null;
  statusBatch: number | null;
  dateClosed: string | null;
  customerCode: string | null;
  invoiceNumber: string | null;
  orderId: number | null;
  raw: Record<string, unknown>;
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
  /** Payment method shown in the modal: cc (cards), ach (bank), cc-ach (both). */
  paymentMethod?: 'cc' | 'ach' | 'cc-ach';
  /** Digital wallet overrides — google-pay. */
  digitalWallet?: { 'google-pay'?: HelcimNumericBoolean };
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

export interface CreateBankAccountInput {
  /** Account ownership. */
  accountCorporate: HelcimBankAccountOwnership;
  /** Account type. */
  accountType: HelcimBankAccountType;
  bankAccountNumber: string;
  /** 3-digit financial number (Canadian bank accounts). */
  bankFinancialNumber?: string;
  /** 5-digit transit number (Canadian bank accounts). */
  bankTransitNumber?: string;
  /** 9-digit routing number (US bank accounts). */
  bankRoutingNumber?: string;
  city: string;
  countryAlpha2: string;
  provinceAlpha2: string;
  postalCode: string;
  streetAddress: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
}

export interface ProcessACHWithdrawInput {
  bankAccountId: number;
  customerId: number;
  amount: number;
  /** Currency for the ACH withdrawal. */
  currencyId: HelcimACHCurrency;
  orderId?: number;
}

export interface ProcessPurchaseInput {
  amount: number;
  currency: string;
  ipAddress: string;
  /** Either cardToken OR full card details. Full card details require PCI approval. */
  cardData:
    | { cardToken: string }
    | { cardNumber: string; cardExpiry: string; cardCVV: string; cardHolderName: string };
  customerCode?: string;
  invoiceNumber?: string;
  orderId?: number;
  ecommerce?: boolean;
  terminalId?: number;
  billingAddress?: HelcimAddress;
  /** Invoice details — when provided, an invoice is created with the purchase. */
  invoiceRequest?: {
    invoiceNumber?: string;
    notes?: string;
    lineItems: Array<{
      description: string;
      quantity: number;
      price: number;
      total: number;
      sku?: string;
      taxAmount?: number;
      discountAmount?: number;
    }>;
  };
}

export interface ProcessPreauthInput {
  amount: number;
  currency: string;
  ipAddress: string;
  cardData:
    | { cardToken: string }
    | { cardNumber: string; cardExpiry: string; cardCVV: string; cardHolderName: string };
  customerCode?: string;
  invoiceNumber?: string;
  ecommerce?: boolean;
  terminalId?: number;
  billingAddress?: HelcimAddress;
}

export interface CapturePreauthInput {
  cardTransactionId: number;
  amount: number;
  currency: string;
  ipAddress: string;
  orderId?: number;
}

export interface RefundPurchaseInput {
  cardTransactionId: number;
  amount: number;
  ipAddress: string;
  customerCode?: string;
  invoiceNumber?: string;
}

export interface ReversePurchaseInput {
  cardTransactionId: number;
  ipAddress: string;
}

export interface CreateInvoiceInput {
  customerCode: string;
  invoiceNumber?: string;
  notes?: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    price: number;
    total: number;
    sku?: string;
    taxAmount?: number;
    discountAmount?: number;
  }>;
  tipAmount?: number;
  depositAmount?: number;
}

export interface HelcimInvoice {
  id: number;
  invoiceNumber: string | null;
  customerId: number | null;
  customerCode: string | null;
  dateCreated: string | null;
  dateUpdated: string | null;
  status: string | null;
  amount: number | null;
  currency: string | null;
  notes: string | null;
  lineItems: Array<{
    sku: string | null;
    description: string | null;
    quantity: number | null;
    price: number | null;
    total: number | null;
    taxAmount: number | null;
    discountAmount: number | null;
  }>;
  raw: Record<string, unknown>;
}

// ─── Response decoders ──────────────────────────────────────────────────────

/**
 * Decode a Helcim address object from an API payload.
 *
 * Helcim returns addresses under several casing conventions (camelCase,
 * PascalCase, and snake_case). This decoder normalizes the first matching
 * fields into a single predictable shape. `name`, `street1`, and `postalCode`
 * are required; if any is missing the address is treated as absent.
 */
function decodeAddress(raw: unknown): HelcimAddress | null {
  if (!raw || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const name = firstString(record, ['name', 'Name']);
  const street1 = firstString(record, ['street1', 'Street1', 'street_1']);
  const postalCode = firstString(record, ['postalCode', 'PostalCode', 'postal_code']);
  if (!name || !street1 || !postalCode) return null;
  return {
    name,
    street1,
    street2: optionalString(firstString(record, ['street2', 'Street2', 'street_2']) ?? undefined) ?? undefined,
    city: optionalString(firstString(record, ['city', 'City']) ?? undefined) ?? undefined,
    province: optionalString(firstString(record, ['province', 'Province']) ?? undefined) ?? undefined,
    country: optionalString(firstString(record, ['country', 'Country']) ?? undefined) ?? undefined,
    postalCode,
    phone: optionalString(firstString(record, ['phone', 'Phone']) ?? undefined) ?? undefined,
    email: optionalString(firstString(record, ['email', 'Email']) ?? undefined) ?? undefined,
  };
}

/**
 * Decode a card token object from a Helcim customer or transaction payload.
 */
function decodeCard(raw: unknown): HelcimCard {
  const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    id: firstNumber(record, ['id', 'Id']) ?? 0,
    cardHolderName: firstString(record, ['cardHolderName', 'cardHolder', 'card_holder_name']),
    cardF6L4: firstString(record, ['cardF6L4', 'cardF4L6', 'card_f6l4']),
    cardToken: firstString(record, ['cardToken', 'card_token']),
    cardExpiry: firstString(record, ['cardExpiry', 'card_expiry']),
    dateCreated: firstString(record, ['dateCreated', 'date_created']),
    dateUpdated: firstString(record, ['dateUpdated', 'date_updated']),
    raw: record,
  };
}

/**
 * Decode a customer record, including any nested cards and addresses.
 */
function decodeCustomer(raw: unknown): HelcimCustomer {
  const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const cardsRaw = firstArray(record, ['cards', 'Cards']) ?? [];
  return {
    id: firstNumber(record, ['id', 'Id']) ?? 0,
    customerCode: firstString(record, ['customerCode', 'customer_code']) ?? '',
    businessName: firstString(record, ['businessName', 'business_name']),
    contactName: firstString(record, ['contactName', 'contact_name']),
    cellPhone: firstString(record, ['cellPhone', 'cellphone', 'cell_phone']),
    billingAddress: decodeAddress(record.billingAddress ?? record.billing_address),
    shippingAddress: decodeAddress(record.shippingAddress ?? record.shipping_address),
    cards: cardsRaw.map(decodeCard),
    raw: record,
  };
}

/**
 * Decode a card transaction (purchase, preauth, refund, or reverse).
 */
function decodeCardTransaction(raw: unknown): HelcimCardTransaction {
  const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    transactionId: firstNumber(record, ['transactionId', 'transaction_id']) ?? 0,
    cardBatchId: firstNumber(record, ['cardBatchId', 'card_batch_id']),
    dateCreated: firstString(record, ['dateCreated', 'date_created']),
    status: firstString(record, ['status', 'Status']),
    type: firstString(record, ['type', 'Type']),
    amount: firstNumber(record, ['amount', 'Amount']),
    currency: firstString(record, ['currency', 'Currency']),
    avsResponse: firstString(record, ['avsResponse', 'avs_response']),
    cvvResponse: firstString(record, ['cvvResponse', 'cvv_response']),
    cardType: firstString(record, ['cardType', 'card_type']),
    approvalCode: firstString(record, ['approvalCode', 'approval_code']),
    cardToken: firstString(record, ['cardToken', 'card_token']),
    cardNumber: firstString(record, ['cardNumber', 'card_number']),
    cardHolderName: firstString(record, ['cardHolderName', 'card_holder_name']),
    customerCode: firstString(record, ['customerCode', 'customer_code']),
    invoiceNumber: firstString(record, ['invoiceNumber', 'invoice_number']),
    warning: firstString(record, ['warning', 'Warning']),
    raw: record,
  };
}

/**
 * Decode a recurring payment plan (subscription or cycle schedule).
 */
function decodePaymentPlan(raw: unknown): HelcimPaymentPlan {
  const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const type = firstString(record, ['type', 'Type']) as HelcimPaymentPlan['type'];
  const status = firstString(record, ['status', 'Status']) as HelcimPaymentPlan['status'];
  const billingPeriod = firstString(record, ['billingPeriod', 'billing_period']) as HelcimPaymentPlan['billingPeriod'];
  const termType = firstString(record, ['termType', 'term_type']) as HelcimPaymentPlan['termType'];
  const taxType = firstString(record, ['taxType', 'tax_type']) as HelcimPaymentPlan['taxType'];
  const paymentMethod = firstString(record, ['paymentMethod', 'payment_method']) as HelcimPaymentPlan['paymentMethod'];
  return {
    id: firstNumber(record, ['id', 'Id']) ?? 0,
    dateCreated: firstString(record, ['dateCreated', 'date_created']),
    dateUpdated: firstString(record, ['dateUpdated', 'date_updated']),
    name: firstString(record, ['name', 'Name']),
    description: firstString(record, ['description', 'Description']),
    type: type ?? null,
    status: status ?? null,
    currency: firstString(record, ['currency', 'Currency']),
    cardTerminalId: firstNumber(record, ['cardTerminalId', 'card_terminal_id']),
    setupAmount: firstNumber(record, ['setupAmount', 'setup_amount']),
    recurringAmount: firstNumber(record, ['recurringAmount', 'recurring_amount']),
    billSetupImmediately: firstString(record, ['billSetupImmediately', 'bill_setup_immediately']),
    billingPeriod: billingPeriod ?? null,
    billingPeriodIncrements: firstNumber(record, ['billingPeriodIncrements', 'billing_period_increments']),
    dateBilling: firstString(record, ['dateBilling', 'date_billing']),
    termType: termType ?? null,
    freeTrialPeriod: firstNumber(record, ['freeTrialPeriod', 'free_trial_period']),
    taxType: taxType ?? null,
    taxCalculation: firstString(record, ['taxCalculation', 'tax_calculation']),
    termLength: firstNumber(record, ['termLength', 'term_length']),
    paymentMethod: paymentMethod ?? null,
    businessEmail: firstString(record, ['businessEmail', 'business_email']),
    addOnIds: (firstArray(record, ['addOnIds', 'add_on_ids']) ?? []).map((addOnId) =>
      typeof addOnId === 'number' ? addOnId : Number(addOnId) || 0
    ),
    isProrated: firstString(record, ['isProrated', 'is_prorated']),
    raw: record,
  };
}

/**
 * Decode a single scheduled payment inside a subscription.
 */
function decodeSubscriptionPayment(raw: unknown): HelcimSubscriptionPayment {
  const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    id: firstNumber(record, ['id', 'Id']) ?? 0,
    setupAmount: firstNumber(record, ['setupAmount', 'setup_amount']),
    recurringAmount: firstNumber(record, ['recurringAmount', 'recurring_amount']),
    addOnAmount: firstNumber(record, ['addOnAmount', 'add_on_amount']),
    amount: firstNumber(record, ['amount', 'Amount']),
    taxAmount: firstNumber(record, ['taxAmount', 'tax_amount']),
    status: firstString(record, ['status', 'Status']),
    dateDue: firstString(record, ['dateDue', 'date_due']),
    dateProcessed: firstString(record, ['dateProcessed', 'date_processed']),
    paymentNumber: firstNumber(record, ['paymentNumber', 'payment_number']),
    numberOfRetries: firstNumber(record, ['numberOfRetries', 'number_of_retries']),
    raw: record,
  };
}

/**
 * Decode a subscription, including its scheduled payments.
 */
function decodeSubscription(raw: unknown): HelcimSubscription {
  const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const paymentsRaw = firstArray(record, ['payments', 'Payments']) ?? [];
  return {
    id: firstNumber(record, ['id', 'Id']) ?? 0,
    dateCreated: firstString(record, ['dateCreated', 'date_created']),
    dateUpdated: firstString(record, ['dateUpdated', 'date_updated']),
    dateActivated: firstString(record, ['dateActivated', 'date_activated']),
    dateBilling: firstString(record, ['dateBilling', 'date_billing']),
    status: firstString(record, ['status', 'Status']),
    paymentPlanId: firstNumber(record, ['paymentPlanId', 'payment_plan_id']),
    customerCode: firstString(record, ['customerCode', 'customer_code']),
    timesBilled: firstNumber(record, ['timesBilled', 'times_billed']),
    setupAmount: firstNumber(record, ['setupAmount', 'setup_amount']),
    recurringAmount: firstNumber(record, ['recurringAmount', 'recurring_amount']),
    freeTrialPeriod: firstNumber(record, ['freeTrialPeriod', 'free_trial_period']),
    hasFailedPayments: firstString(record, ['hasFailedPayments', 'has_failed_payments']),
    isProrated: firstString(record, ['isProrated', 'is_prorated']),
    addOnIds: (firstArray(record, ['addOnIds', 'add_on_ids']) ?? []).map((addOnId) =>
      typeof addOnId === 'number' ? addOnId : Number(addOnId) || 0
    ),
    payments: paymentsRaw.map(decodeSubscriptionPayment),
    raw: record,
  };
}

/**
 * Decode a bank account (Canadian or US) for ACH/PAD processing.
 */
function decodeBankAccount(raw: unknown): HelcimBankAccount {
  const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const accountType = firstString(record, ['accountType', 'account_type']);
  const accountCorporate = firstString(record, ['accountCorporate', 'account_corporate']);
  const verifiedNum = firstNumber(record, ['verified', 'Verified']);
  const readyNum = firstNumber(record, ['ready', 'Ready']);
  return {
    id: firstNumber(record, ['id', 'Id']) ?? 0,
    customerId: firstNumber(record, ['customerId', 'customer_id']),
    dateCreated: firstString(record, ['dateCreated', 'date_created']),
    dateUpdated: firstString(record, ['dateUpdated', 'date_updated']),
    dateLastUsed: firstString(record, ['dateLastUsed', 'date_last_used']),
    dateVerified: firstString(record, ['dateVerified', 'date_verified']),
    bankToken: firstString(record, ['bankToken', 'bank_token']),
    accountType: accountType ?? null,
    accountCorporate: accountCorporate ?? null,
    verified: verifiedNum !== null ? verifiedNum === HELCIM_BOOLEAN_TRUE : null,
    ready: readyNum !== null ? readyNum === HELCIM_BOOLEAN_TRUE : null,
    bankIdNumber: firstString(record, ['bankIdNumber', 'bank_id_number']),
    transitNumber: firstString(record, ['transitNumber', 'transit_number']),
    routingNumber: firstString(record, ['routingNumber', 'routing_number']),
    bankAccountNumberL4: firstString(record, ['bankAccountNumberL4', 'bankAccountNumberL4l4', 'bank_account_number_l4']),
    address: decodeAddress(record.address ?? record.Address),
    raw: record,
  };
}

/**
 * Decode a pre-authorized debit (PAD) agreement.
 */
function decodePADAgreement(raw: unknown): HelcimPADAgreement {
  const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const acceptedNum = firstNumber(record, ['accepted', 'Accepted']);
  const merchantAuthorizedNum = firstNumber(record, ['merchantAuthorized', 'merchant_authorized']);
  return {
    id: firstNumber(record, ['id', 'Id']) ?? 0,
    accepted: acceptedNum === HELCIM_BOOLEAN_TRUE,
    bankAccountId: firstNumber(record, ['bankAccountId', 'bank_account_id']),
    customerId: firstNumber(record, ['customerId', 'customer_id']),
    dateAccepted: firstString(record, ['dateAccepted', 'date_accepted']),
    dateCreated: firstString(record, ['dateCreated', 'date_created']),
    dateEarliestDebit: firstString(record, ['dateEarliestDebit', 'date_earliest_debit']),
    dateRevoked: firstString(record, ['dateRevoked', 'date_revoked']),
    dateUpdated: firstString(record, ['dateUpdated', 'date_updated']),
    ipAddress: firstString(record, ['ipAddress', 'ip_address']),
    merchantAuthorized: merchantAuthorizedNum === HELCIM_BOOLEAN_TRUE,
    type: firstNumber(record, ['type', 'Type']),
    status: firstNumber(record, ['status', 'Status']),
    raw: record,
  };
}

/**
 * Decode an ACH withdrawal, refund, void, or cancel transaction.
 */
function decodeACHTransaction(raw: unknown): HelcimACHTransaction {
  const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const testNum = firstNumber(record, ['test', 'Test']);
  return {
    id: firstNumber(record, ['id', 'Id']) ?? 0,
    merchantId: firstNumber(record, ['merchantId', 'merchant_id']),
    dateCreated: firstString(record, ['dateCreated', 'date_created']),
    statusAuth: firstNumber(record, ['statusAuth', 'status_auth']),
    statusClearing: firstNumber(record, ['statusClearing', 'status_clearing']),
    batchId: firstNumber(record, ['batchId', 'batch_id']),
    bankAccountId: firstNumber(record, ['bankAccountId', 'bank_account_id']),
    bankAccountL4: firstString(record, ['bankAccountL4l4', 'bankAccountL4', 'bank_account_l4']),
    transactionType: firstNumber(record, ['transactionType', 'transaction_type']),
    amount: firstNumber(record, ['amount', 'Amount']),
    currency: firstNumber(record, ['currency', 'Currency']),
    approvalCode: firstString(record, ['approvalCode', 'approval_code']),
    test: testNum !== null ? testNum === HELCIM_BOOLEAN_TRUE : null,
    acquirerTransactionId: firstString(record, ['acquirerTransactionId', 'acquirer_transaction_id']),
    responseMessage: firstString(record, ['responseMessage', 'response_message']),
    statusBatch: firstNumber(record, ['statusBatch', 'status_batch']),
    dateClosed: firstString(record, ['dateClosed', 'date_closed']),
    customerCode: firstString(record, ['customerCode', 'customer_code']),
    invoiceNumber: firstString(record, ['invoiceNumber', 'invoice_number']),
    orderId: firstNumber(record, ['orderId', 'order_id']),
    raw: record,
  };
}

/**
 * Decode an invoice, including its line items.
 */
function decodeInvoice(raw: unknown): HelcimInvoice {
  const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const lineItemsRaw = firstArray(record, ['lineItems', 'line_items', 'items']) ?? [];
  return {
    id: firstNumber(record, ['id', 'Id']) ?? 0,
    invoiceNumber: firstString(record, ['invoiceNumber', 'invoice_number']),
    customerId: firstNumber(record, ['customerId', 'customer_id']),
    customerCode: firstString(record, ['customerCode', 'customer_code']),
    dateCreated: firstString(record, ['dateCreated', 'date_created']),
    dateUpdated: firstString(record, ['dateUpdated', 'date_updated']),
    status: firstString(record, ['status', 'Status']),
    amount: firstNumber(record, ['amount', 'Amount', 'totalAmount', 'total_amount']),
    currency: firstString(record, ['currency', 'Currency']),
    notes: firstString(record, ['notes', 'Notes']),
    lineItems: lineItemsRaw.map((item) => {
      const itemRecord = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
      return {
        sku: firstString(itemRecord, ['sku', 'SKU']),
        description: firstString(itemRecord, ['description', 'Description']),
        quantity: firstNumber(itemRecord, ['quantity', 'Quantity']),
        price: firstNumber(itemRecord, ['price', 'Price']),
        total: firstNumber(itemRecord, ['total', 'Total']),
        taxAmount: firstNumber(itemRecord, ['taxAmount', 'tax_amount']),
        discountAmount: firstNumber(itemRecord, ['discountAmount', 'discount_amount']),
      };
    }),
    raw: record,
  };
}

// ─── Client factory ─────────────────────────────────────────────────────────

/** Throw if a monetary amount is not a positive finite number. */
function assertPositiveAmount(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Helcim ${name} requires a positive finite amount`);
  }
}

/** Throw if a required string field is missing or whitespace-only. */
function assertNonEmptyString(value: unknown, name: string): void {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Helcim ${name} is required`);
  }
}

/** Throw if a required id is not a positive integer. */
function assertPositiveInteger(value: number, operation: string, field: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Helcim ${operation} requires a positive integer ${field}`);
  }
}

/**
 * Unwrap a record by looking for the first nested object among a list of keys.
 *
 * Helcim wraps some transaction responses in `transaction` or `data`; other
 * endpoints return the object directly. This helper picks the first object
 * found in the precedence order, falling back to the raw record itself.
 */
function unwrapRecord(raw: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  for (const key of keys) {
    const value = raw[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  }
  return raw;
}

/** Unwrap a record that may be nested under a `data` key. */
function unwrapDataObject(raw: Record<string, unknown>): Record<string, unknown> {
  return unwrapRecord(raw, ['data']);
}

/**
 * Decode the first item in `raw.data` (when it is an array), or the `data`
 * object itself, or the raw record if neither is present.
 */
function decodeFirstInData<T>(
  raw: Record<string, unknown>,
  decoder: (raw: unknown) => T
): T {
  const arr = firstArray(raw, ['data']);
  return decoder(arr?.[0] ?? raw.data ?? raw);
}

/** Convert a decoded address back into a request payload, omitting empty optional fields. */
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

  /**
   * Make an HTTP request to the Helcim API and normalize the response.
   *
   * Query parameters are only appended when they are non-empty. Bare array
   * responses are wrapped in `{ data: [...] }` so the rest of the client can
   * always work with an object. Errors are surfaced as `Error` with the first
   * available provider message.
   */
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
      body: JSON.stringify(opts.body),
    });
    const text = await response.text();
    let raw: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(text) as unknown;
      if (Array.isArray(parsed)) {
        // Some list endpoints return a bare array; wrap it for uniform handling.
        raw = { data: parsed };
      } else if (parsed) {
        raw = parsed as Record<string, unknown>;
      }
    } catch {
      // Non-JSON or empty body — leave raw as {}. Do not echo into logs.
    }
    if (!response.ok) {
      const providerErrors = raw.errors ?? raw.Errors;
      const message =
        typeof providerErrors === 'string' && providerErrors.trim()
          ? providerErrors
          : Array.isArray(providerErrors) && typeof providerErrors[0] === 'string'
            ? providerErrors[0]
            : `Helcim ${method} ${path} failed with HTTP ${response.status}`;
      throw new Error(message);
    }
    // Recurring API wraps responses in { data: [...] } or { data: {...} }.
    // Payment API returns the object directly. Unwrap for callers.
    return raw;
  }

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

  // ─── Customers ─────────────────────────────────────────────────────────
  /** Create a customer in the Helcim vault. */
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

  /** Retrieve a single customer by id. */
  async function getCustomer(customerId: number): Promise<HelcimCustomer> {
    assertPositiveInteger(customerId, 'getCustomer', 'customerId');
    const raw = await request('GET', `/customers/${customerId}`);
    return decodeCustomer(raw);
  }

  /** List customers, optionally filtered by customer code or paginated. */
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
  /** List the cards stored for a customer, optionally filtered by token. */
  async function getCustomerCards(customerId: number, cardToken?: string): Promise<HelcimCard[]> {
    assertPositiveInteger(customerId, 'getCustomerCards', 'customerId');
    const raw = await request('GET', `/customers/${customerId}/cards`, {
      query: { cardToken },
    });
    const arr = Array.isArray(raw) ? raw : (firstArray(raw, ['data', 'cards', 'Cards']) ?? []);
    return arr.map(decodeCard);
  }

  /** Set the default card for a customer. */
  async function setCustomerCardDefault(customerId: number, cardId: number): Promise<HelcimCustomer[]> {
    assertPositiveInteger(customerId, 'setCustomerCardDefault', 'customerId');
    assertPositiveInteger(cardId, 'setCustomerCardDefault', 'cardId');
    const raw = await request('PATCH', `/customers/${customerId}/cards/${cardId}/default`);
    const arr = Array.isArray(raw) ? raw : (firstArray(raw, ['data']) ?? [raw]);
    return arr.map(decodeCustomer);
  }

  // ─── HelcimPay.js checkout session ─────────────────────────────────────
  /** Initialize a HelcimPay.js iFrame checkout session. */
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
      body.setAsDefaultPaymentMethod = numericBoolean(input.setAsDefaultPaymentMethod);
    }
    if (input.customerRequest) {
      assertNonEmptyString(input.customerRequest.contactName, 'customerRequest contactName');
      const customerRequestBody: Record<string, unknown> = { contactName: input.customerRequest.contactName };
      if (input.customerRequest.businessName) customerRequestBody.businessName = input.customerRequest.businessName;
      if (input.customerRequest.customerCode) customerRequestBody.customerCode = input.customerRequest.customerCode;
      if (input.customerRequest.cellPhone) customerRequestBody.cellPhone = input.customerRequest.cellPhone;
      if (input.customerRequest.billingAddress) customerRequestBody.billingAddress = addressToPayload(input.customerRequest.billingAddress);
      if (input.customerRequest.shippingAddress) customerRequestBody.shippingAddress = addressToPayload(input.customerRequest.shippingAddress);
      body.customerRequest = customerRequestBody;
    }
    if (input.invoiceRequest) {
      body.invoiceRequest = input.invoiceRequest;
    }
    if (input.customStyling) {
      body.customStyling = input.customStyling;
    }
    if (input.paymentMethod) body.paymentMethod = input.paymentMethod;
    if (input.digitalWallet) body.digitalWallet = input.digitalWallet;
    body.confirmationScreen = input.confirmationScreen;
    body.allowExit = input.allowExit;

    const raw = await request('POST', '/helcim-pay/initialize', { body });
    const checkoutToken = firstString(raw, ['checkoutToken', 'checkout_token']);
    const secretToken = firstString(raw, ['secretToken', 'secret_token']);
    if (!checkoutToken || !secretToken) {
      throw new Error('Helcim initializeHelcimPay did not return checkoutToken and secretToken');
    }
    return { checkoutToken, secretToken };
  }

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
    assertPositiveInteger(planId, 'getPaymentPlan', 'planId');
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
    assertPositiveInteger(planId, 'deletePaymentPlan', 'planId');
    await request('DELETE', `/payment-plans/${planId}`);
    return true;
  }

  // ─── Subscriptions ─────────────────────────────────────────────────────
  /** Create a subscription for a customer on a payment plan. */
  async function createSubscription(
    input: CreateSubscriptionInput,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimSubscription> {
    assertPositiveInteger(input.paymentPlanId, 'createSubscription', 'paymentPlanId');
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
    assertPositiveInteger(subscriptionId, 'getSubscription', 'subscriptionId');
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
    assertPositiveInteger(subscriptionId, 'deleteSubscription', 'subscriptionId');
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
    assertPositiveInteger(subscriptionId, 'processSubscriptionPayment', 'subscriptionId');
    assertPositiveInteger(paymentNumber, 'processSubscriptionPayment', 'paymentNumber');
    const raw = await request('POST', '/procedures/process-payment', {
      body: { subscriptionId, paymentNumber },
      idempotencyKey,
    });
    const arr = firstArray(raw, ['data']) ?? [];
    return decodeSubscription(arr[0] ?? raw);
  }

  // ─── Card transactions ─────────────────────────────────────────────────
  /** Retrieve a single card transaction by id. */
  async function getCardTransaction(transactionId: number): Promise<HelcimCardTransaction> {
    assertPositiveInteger(transactionId, 'getCardTransaction', 'transactionId');
    const raw = await request('GET', `/card-transactions/${transactionId}`);
    return decodeCardTransaction(raw);
  }

  /** List card transactions, optionally filtered by customer or date range. */
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

  // ─── Bank accounts ─────────────────────────────────────────────────────
  /** Add a bank account to a customer for ACH/PAD. */
  async function createBankAccount(
    customerId: number,
    input: CreateBankAccountInput
  ): Promise<{ id: number; message: string }> {
    assertPositiveInteger(customerId, 'createBankAccount', 'customerId');
    assertNonEmptyString(input.bankAccountNumber, 'createBankAccount bankAccountNumber');
    assertNonEmptyString(input.countryAlpha2, 'createBankAccount countryAlpha2');
    assertNonEmptyString(input.provinceAlpha2, 'createBankAccount provinceAlpha2');
    assertNonEmptyString(input.city, 'createBankAccount city');
    assertNonEmptyString(input.postalCode, 'createBankAccount postalCode');
    assertNonEmptyString(input.streetAddress, 'createBankAccount streetAddress');
    const body: Record<string, unknown> = {
      accountCorporate: input.accountCorporate,
      accountType: input.accountType,
      bankAccountNumber: input.bankAccountNumber,
      city: input.city,
      countryAlpha2: input.countryAlpha2,
      provinceAlpha2: input.provinceAlpha2,
      postalCode: input.postalCode,
      streetAddress: input.streetAddress,
    };
    if (input.bankFinancialNumber) body.bankFinancialNumber = input.bankFinancialNumber;
    if (input.bankTransitNumber) body.bankTransitNumber = input.bankTransitNumber;
    if (input.bankRoutingNumber) body.bankRoutingNumber = input.bankRoutingNumber;
    if (input.firstName) body.firstName = input.firstName;
    if (input.lastName) body.lastName = input.lastName;
    if (input.companyName) body.companyName = input.companyName;
    const raw = await request('POST', `/customers/${customerId}/bank-accounts`, { body });
    const data = unwrapDataObject(raw);
    const id = firstNumber(data, ['id', 'Id']) ?? 0;
    const message = firstString(data, ['message', 'Message']) ?? '';
    return { id, message };
  }

  /** List a customer's bank accounts. */
  async function getCustomerBankAccounts(customerId: number): Promise<HelcimBankAccount[]> {
    assertPositiveInteger(customerId, 'getCustomerBankAccounts', 'customerId');
    const raw = await request('GET', `/customers/${customerId}/bank-accounts`);
    const arr = Array.isArray(raw) ? raw : (firstArray(raw, ['data', 'bankAccounts', 'bank_accounts']) ?? []);
    return arr.map(decodeBankAccount);
  }

  /** Retrieve a single bank account for a customer. */
  async function getBankAccount(customerId: number, bankAccountId: number): Promise<HelcimBankAccount> {
    assertPositiveInteger(customerId, 'getBankAccount', 'customerId');
    assertPositiveInteger(bankAccountId, 'getBankAccount', 'bankAccountId');
    const raw = await request('GET', `/customers/${customerId}/bank-accounts/${bankAccountId}`);
    return decodeBankAccount(unwrapDataObject(raw));
  }

  /** Set a customer's default bank account. */
  async function setBankAccountDefault(customerId: number, bankAccountId: number): Promise<boolean> {
    assertPositiveInteger(customerId, 'setBankAccountDefault', 'customerId');
    assertPositiveInteger(bankAccountId, 'setBankAccountDefault', 'bankAccountId');
    await request('PATCH', `/customers/${customerId}/bank-accounts/${bankAccountId}/default`);
    return true;
  }

  /** Request that a customer add a new bank account via Helcim's hosted flow. */
  async function requestNewBankAccount(customerId: number): Promise<{ message: string }> {
    assertPositiveInteger(customerId, 'requestNewBankAccount', 'customerId');
    const raw = await request('POST', `/customers/${customerId}/bank-accounts/request`);
    const message = firstString(raw, ['message', 'Message']) ?? '';
    return { message };
  }

  // ─── PAD agreements ────────────────────────────────────────────────────
  /** List pre-authorized debit (PAD) agreements for a customer. */
  async function getPADs(customerId: number): Promise<HelcimPADAgreement[]> {
    assertPositiveInteger(customerId, 'getPADs', 'customerId');
    const raw = await request('GET', `/customers/${customerId}/pads`);
    const arr = Array.isArray(raw) ? raw : (firstArray(raw, ['data', 'pads', 'Pads']) ?? []);
    return arr.map(decodePADAgreement);
  }

  /** Retrieve a single PAD agreement for a customer. */
  async function getPAD(customerId: number, padId: number): Promise<HelcimPADAgreement> {
    assertPositiveInteger(customerId, 'getPAD', 'customerId');
    assertPositiveInteger(padId, 'getPAD', 'padId');
    const raw = await request('GET', `/customers/${customerId}/pads/${padId}`);
    return decodePADAgreement(unwrapDataObject(raw));
  }

  /** Update a PAD agreement (acceptance or status). */
  async function updatePAD(
    customerId: number,
    padId: number,
    updates: { accepted?: boolean; status?: number }
  ): Promise<HelcimPADAgreement> {
    assertPositiveInteger(customerId, 'updatePAD', 'customerId');
    assertPositiveInteger(padId, 'updatePAD', 'padId');
    const body: Record<string, unknown> = {};
    if (updates.accepted !== undefined) body.accepted = numericBoolean(updates.accepted);
    body.status = updates.status;
    const raw = await request('PUT', `/customers/${customerId}/pads/${padId}`, { body });
    return decodePADAgreement(unwrapDataObject(raw));
  }

  // ─── ACH transactions ──────────────────────────────────────────────────
  /** Withdraw funds from a customer's bank account via ACH/PAD. */
  async function processACHWithdraw(
    input: ProcessACHWithdrawInput,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimACHTransaction> {
    assertPositiveInteger(input.bankAccountId, 'processACHWithdraw', 'bankAccountId');
    assertPositiveInteger(input.customerId, 'processACHWithdraw', 'customerId');
    assertPositiveAmount(input.amount, 'processACHWithdraw amount');
    if (
      input.currencyId !== HELCIM_ACH_CURRENCY.CAD &&
      input.currencyId !== HELCIM_ACH_CURRENCY.USD
    ) {
      throw new Error('Helcim processACHWithdraw currencyId must be 1 (CAD) or 2 (USD)');
    }
    const body: Record<string, unknown> = {
      bankAccountId: input.bankAccountId,
      customerId: input.customerId,
      amount: input.amount,
      currencyId: input.currencyId,
    };
    body.orderId = input.orderId;
    const raw = await request('PUT', '/ach/withdraw', { body, idempotencyKey });
    return decodeACHTransaction(unwrapRecord(raw, ['transaction']));
  }

  /** Retrieve a single ACH transaction by id. */
  async function getACHTransaction(transactionId: number): Promise<HelcimACHTransaction> {
    assertPositiveInteger(transactionId, 'getACHTransaction', 'transactionId');
    const raw = await request('GET', `/ach/transactions/${transactionId}`);
    return decodeACHTransaction(unwrapRecord(raw, ['transaction', 'data']));
  }

  /** List ACH transactions, optionally filtered by customer. */
  async function getACHTransactions(params: {
    customerId?: number;
    page?: number;
    limit?: number;
  } = {}): Promise<HelcimACHTransaction[]> {
    const raw = await request('GET', '/ach/transactions', {
      query: {
        customerId: params.customerId,
        page: params.page,
        limit: params.limit,
      },
    });
    const arr = Array.isArray(raw) ? raw : (firstArray(raw, ['data', 'transactions']) ?? []);
    return arr.map(decodeACHTransaction);
  }

  /** Refund a settled ACH transaction. */
  async function refundACH(
    transactionId: number,
    amount: number,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimACHTransaction> {
    assertPositiveInteger(transactionId, 'refundACH', 'transactionId');
    assertPositiveAmount(amount, 'refundACH amount');
    const raw = await request('POST', `/ach/refund/${transactionId}`, {
      body: { amount },
      idempotencyKey,
    });
    return decodeACHTransaction(unwrapRecord(raw, ['transaction']));
  }

  /** Void an ACH transaction before it is settled. */
  async function voidACH(
    transactionId: number,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimACHTransaction> {
    assertPositiveInteger(transactionId, 'voidACH', 'transactionId');
    const raw = await request('POST', `/ach/void/${transactionId}`, { idempotencyKey });
    return decodeACHTransaction(unwrapRecord(raw, ['transaction']));
  }

  /** Cancel a pending ACH transaction. */
  async function cancelACH(
    transactionId: number,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimACHTransaction> {
    assertPositiveInteger(transactionId, 'cancelACH', 'transactionId');
    const raw = await request('POST', `/ach/cancel/${transactionId}`, { idempotencyKey });
    return decodeACHTransaction(unwrapRecord(raw, ['transaction']));
  }

  // ─── Payment API (one-time card transactions) ──────────────────────────
  /** Process a one-time card purchase. */
  async function processPurchase(
    input: ProcessPurchaseInput,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimCardTransaction> {
    assertPositiveAmount(input.amount, 'processPurchase amount');
    assertNonEmptyString(input.currency, 'processPurchase currency');
    assertNonEmptyString(input.ipAddress, 'processPurchase ipAddress');
    if (!input.cardData || typeof input.cardData !== 'object') {
      throw new Error('Helcim processPurchase requires cardData');
    }
    const body: Record<string, unknown> = {
      amount: input.amount,
      currency: input.currency,
      ipAddress: input.ipAddress,
      cardData: input.cardData,
    };
    if (input.customerCode) body.customerCode = input.customerCode;
    if (input.invoiceNumber) body.invoiceNumber = input.invoiceNumber;
    body.orderId = input.orderId;
    body.ecommerce = input.ecommerce;
    body.terminalId = input.terminalId;
    if (input.billingAddress) body.billingAddress = addressToPayload(input.billingAddress);
    if (input.invoiceRequest) body.invoiceRequest = input.invoiceRequest;
    const raw = await request('POST', '/payment/purchase', { body, idempotencyKey });
    return decodeCardTransaction(unwrapRecord(raw, ['transaction', 'data']));
  }

  /** Place a hold (preauthorization) on a card. */
  async function processPreauth(
    input: ProcessPreauthInput,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimCardTransaction> {
    assertPositiveAmount(input.amount, 'processPreauth amount');
    assertNonEmptyString(input.currency, 'processPreauth currency');
    assertNonEmptyString(input.ipAddress, 'processPreauth ipAddress');
    if (!input.cardData || typeof input.cardData !== 'object') {
      throw new Error('Helcim processPreauth requires cardData');
    }
    const body: Record<string, unknown> = {
      amount: input.amount,
      currency: input.currency,
      ipAddress: input.ipAddress,
      cardData: input.cardData,
    };
    if (input.customerCode) body.customerCode = input.customerCode;
    if (input.invoiceNumber) body.invoiceNumber = input.invoiceNumber;
    body.ecommerce = input.ecommerce;
    body.terminalId = input.terminalId;
    if (input.billingAddress) body.billingAddress = addressToPayload(input.billingAddress);
    const raw = await request('POST', '/payment/preauth', { body, idempotencyKey });
    return decodeCardTransaction(unwrapRecord(raw, ['transaction', 'data']));
  }

  /** Capture a previously placed preauthorization. */
  async function capturePreauth(
    input: CapturePreauthInput,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimCardTransaction> {
    assertPositiveInteger(input.cardTransactionId, 'capturePreauth', 'cardTransactionId');
    assertPositiveAmount(input.amount, 'capturePreauth amount');
    assertNonEmptyString(input.currency, 'capturePreauth currency');
    assertNonEmptyString(input.ipAddress, 'capturePreauth ipAddress');
    const body: Record<string, unknown> = {
      cardTransactionId: input.cardTransactionId,
      amount: input.amount,
      currency: input.currency,
      ipAddress: input.ipAddress,
    };
    body.orderId = input.orderId;
    const raw = await request('POST', '/payment/capture', { body, idempotencyKey });
    return decodeCardTransaction(unwrapRecord(raw, ['transaction', 'data']));
  }

  /** Refund a settled card purchase. */
  async function refundPurchase(
    input: RefundPurchaseInput,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimCardTransaction> {
    assertPositiveInteger(input.cardTransactionId, 'refundPurchase', 'cardTransactionId');
    assertPositiveAmount(input.amount, 'refundPurchase amount');
    assertNonEmptyString(input.ipAddress, 'refundPurchase ipAddress');
    const body: Record<string, unknown> = {
      cardTransactionId: input.cardTransactionId,
      amount: input.amount,
      ipAddress: input.ipAddress,
    };
    if (input.customerCode) body.customerCode = input.customerCode;
    if (input.invoiceNumber) body.invoiceNumber = input.invoiceNumber;
    const raw = await request('POST', '/payment/refund', { body, idempotencyKey });
    return decodeCardTransaction(unwrapRecord(raw, ['transaction', 'data']));
  }

  /** Reverse a same-day card purchase before it is settled. */
  async function reversePurchase(
    input: ReversePurchaseInput,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimCardTransaction> {
    assertPositiveInteger(input.cardTransactionId, 'reversePurchase', 'cardTransactionId');
    assertNonEmptyString(input.ipAddress, 'reversePurchase ipAddress');
    const body: Record<string, unknown> = {
      cardTransactionId: input.cardTransactionId,
      ipAddress: input.ipAddress,
    };
    const raw = await request('POST', '/payment/reverse', { body, idempotencyKey });
    return decodeCardTransaction(unwrapRecord(raw, ['transaction', 'data']));
  }

  // ─── Invoices ──────────────────────────────────────────────────────────
  /** Create an invoice with line items. */
  async function createInvoice(
    input: CreateInvoiceInput,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimInvoice> {
    assertNonEmptyString(input.customerCode, 'createInvoice customerCode');
    if (!input.lineItems || input.lineItems.length === 0) {
      throw new Error('Helcim createInvoice requires at least one line item');
    }
    const body: Record<string, unknown> = {
      customerCode: input.customerCode,
      lineItems: input.lineItems,
    };
    if (input.invoiceNumber) body.invoiceNumber = input.invoiceNumber;
    if (input.notes) body.notes = input.notes;
    body.tipAmount = input.tipAmount;
    body.depositAmount = input.depositAmount;
    const raw = await request('POST', '/invoices', { body, idempotencyKey });
    const arr = firstArray(raw, ['data']);
    if (!arr?.[0]) throw new Error('Helcim createInvoice returned no invoices');
    return decodeInvoice(arr[0]);
  }

  /** List invoices, optionally filtered by customer or status. */
  async function getInvoices(params: {
    customerCode?: string;
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<HelcimInvoice[]> {
    const raw = await request('GET', '/invoices', {
      query: {
        customerCode: params.customerCode,
        page: params.page,
        limit: params.limit,
        status: params.status,
      },
    });
    const arr = firstArray(raw, ['data', 'invoices', 'Invoices']) ?? [];
    return arr.map(decodeInvoice);
  }

  /** Retrieve a single invoice by id. */
  async function getInvoice(invoiceId: number): Promise<HelcimInvoice> {
    assertPositiveInteger(invoiceId, 'getInvoice', 'invoiceId');
    const raw = await request('GET', `/invoices/${invoiceId}`);
    return decodeFirstInData(raw, decodeInvoice);
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
    // Bank accounts
    createBankAccount,
    getCustomerBankAccounts,
    getBankAccount,
    setBankAccountDefault,
    requestNewBankAccount,
    // PAD agreements
    getPADs,
    getPAD,
    updatePAD,
    // ACH transactions
    processACHWithdraw,
    getACHTransaction,
    getACHTransactions,
    refundACH,
    voidACH,
    cancelACH,
    // Payment API (one-time card)
    processPurchase,
    processPreauth,
    capturePreauth,
    refundPurchase,
    reversePurchase,
    // Invoices
    createInvoice,
    getInvoices,
    getInvoice,
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
  decodeBankAccount,
  decodePADAgreement,
  decodeACHTransaction,
  decodeInvoice,
  isProviderErrorStatus,
};
