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

/** ACH transaction statusAuth values. */
export const ACH_STATUS_AUTH = {
  APPROVED: 1,
  DECLINED: 2,
  CANCELLED: 4,
  PENDING: 5,
} as const;

/** ACH transaction statusClearing values. */
export const ACH_STATUS_CLEARING = {
  IN_SETTLEMENT: 0,
  SETTLED_APPROVED: 1,
  SETTLED_DECLINED: 4,
} as const;

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
  digitalWallet?: { 'google-pay'?: 0 | 1 };
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
  /** 1 = Personal, 2 = Corporate */
  accountCorporate: 1 | 2;
  /** 1 = Checking, 2 = Savings */
  accountType: 1 | 2;
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
  /** 1 = CAD, 2 = USD */
  currencyId: 1 | 2;
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

function decodeAddress(raw: unknown): HelcimAddress | null {
  if (!raw || Array.isArray(raw)) return null;
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

function decodeBankAccount(raw: unknown): HelcimBankAccount {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const accountType = firstString(r, ['accountType', 'account_type']);
  const accountCorporate = firstString(r, ['accountCorporate', 'account_corporate']);
  const verifiedNum = firstNumber(r, ['verified', 'Verified']);
  const readyNum = firstNumber(r, ['ready', 'Ready']);
  return {
    id: firstNumber(r, ['id', 'Id']) ?? 0,
    customerId: firstNumber(r, ['customerId', 'customer_id']),
    dateCreated: firstString(r, ['dateCreated', 'date_created']),
    dateUpdated: firstString(r, ['dateUpdated', 'date_updated']),
    dateLastUsed: firstString(r, ['dateLastUsed', 'date_last_used']),
    dateVerified: firstString(r, ['dateVerified', 'date_verified']),
    bankToken: firstString(r, ['bankToken', 'bank_token']),
    accountType: accountType ?? null,
    accountCorporate: accountCorporate ?? null,
    verified: verifiedNum !== null ? verifiedNum === 1 : null,
    ready: readyNum !== null ? readyNum === 1 : null,
    bankIdNumber: firstString(r, ['bankIdNumber', 'bank_id_number']),
    transitNumber: firstString(r, ['transitNumber', 'transit_number']),
    routingNumber: firstString(r, ['routingNumber', 'routing_number']),
    bankAccountNumberL4: firstString(r, ['bankAccountNumberL4', 'bankAccountNumberL4l4', 'bank_account_number_l4']),
    address: decodeAddress(r.address ?? r.Address),
    raw: r,
  };
}

function decodePADAgreement(raw: unknown): HelcimPADAgreement {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const acceptedNum = firstNumber(r, ['accepted', 'Accepted']);
  const merchantAuthorizedNum = firstNumber(r, ['merchantAuthorized', 'merchant_authorized']);
  return {
    id: firstNumber(r, ['id', 'Id']) ?? 0,
    accepted: acceptedNum === 1,
    bankAccountId: firstNumber(r, ['bankAccountId', 'bank_account_id']),
    customerId: firstNumber(r, ['customerId', 'customer_id']),
    dateAccepted: firstString(r, ['dateAccepted', 'date_accepted']),
    dateCreated: firstString(r, ['dateCreated', 'date_created']),
    dateEarliestDebit: firstString(r, ['dateEarliestDebit', 'date_earliest_debit']),
    dateRevoked: firstString(r, ['dateRevoked', 'date_revoked']),
    dateUpdated: firstString(r, ['dateUpdated', 'date_updated']),
    ipAddress: firstString(r, ['ipAddress', 'ip_address']),
    merchantAuthorized: merchantAuthorizedNum === 1,
    type: firstNumber(r, ['type', 'Type']),
    status: firstNumber(r, ['status', 'Status']),
    raw: r,
  };
}

function decodeACHTransaction(raw: unknown): HelcimACHTransaction {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const testNum = firstNumber(r, ['test', 'Test']);
  return {
    id: firstNumber(r, ['id', 'Id']) ?? 0,
    merchantId: firstNumber(r, ['merchantId', 'merchant_id']),
    dateCreated: firstString(r, ['dateCreated', 'date_created']),
    statusAuth: firstNumber(r, ['statusAuth', 'status_auth']),
    statusClearing: firstNumber(r, ['statusClearing', 'status_clearing']),
    batchId: firstNumber(r, ['batchId', 'batch_id']),
    bankAccountId: firstNumber(r, ['bankAccountId', 'bank_account_id']),
    bankAccountL4: firstString(r, ['bankAccountL4l4', 'bankAccountL4', 'bank_account_l4']),
    transactionType: firstNumber(r, ['transactionType', 'transaction_type']),
    amount: firstNumber(r, ['amount', 'Amount']),
    currency: firstNumber(r, ['currency', 'Currency']),
    approvalCode: firstString(r, ['approvalCode', 'approval_code']),
    test: testNum !== null ? testNum === 1 : null,
    acquirerTransactionId: firstString(r, ['acquirerTransactionId', 'acquirer_transaction_id']),
    responseMessage: firstString(r, ['responseMessage', 'response_message']),
    statusBatch: firstNumber(r, ['statusBatch', 'status_batch']),
    dateClosed: firstString(r, ['dateClosed', 'date_closed']),
    customerCode: firstString(r, ['customerCode', 'customer_code']),
    invoiceNumber: firstString(r, ['invoiceNumber', 'invoice_number']),
    orderId: firstNumber(r, ['orderId', 'order_id']),
    raw: r,
  };
}

function decodeInvoice(raw: unknown): HelcimInvoice {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const lineItemsRaw = firstArray(r, ['lineItems', 'line_items', 'items']) ?? [];
  return {
    id: firstNumber(r, ['id', 'Id']) ?? 0,
    invoiceNumber: firstString(r, ['invoiceNumber', 'invoice_number']),
    customerId: firstNumber(r, ['customerId', 'customer_id']),
    customerCode: firstString(r, ['customerCode', 'customer_code']),
    dateCreated: firstString(r, ['dateCreated', 'date_created']),
    dateUpdated: firstString(r, ['dateUpdated', 'date_updated']),
    status: firstString(r, ['status', 'Status']),
    amount: firstNumber(r, ['amount', 'Amount', 'totalAmount', 'total_amount']),
    currency: firstString(r, ['currency', 'Currency']),
    notes: firstString(r, ['notes', 'Notes']),
    lineItems: lineItemsRaw.map((item) => {
      const li = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
      return {
        sku: firstString(li, ['sku', 'SKU']),
        description: firstString(li, ['description', 'Description']),
        quantity: firstNumber(li, ['quantity', 'Quantity']),
        price: firstNumber(li, ['price', 'Price']),
        total: firstNumber(li, ['total', 'Total']),
        taxAmount: firstNumber(li, ['taxAmount', 'tax_amount']),
        discountAmount: firstNumber(li, ['discountAmount', 'discount_amount']),
      };
    }),
    raw: r,
  };
}

// ─── Client factory ─────────────────────────────────────────────────────────

function assertPositiveAmount(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
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

  async function getPaymentPlan(planId: number): Promise<HelcimPaymentPlan> {
    if (!Number.isInteger(planId) || planId <= 0) {
      throw new Error('Helcim getPaymentPlan requires a positive integer planId');
    }
    const raw = await request('GET', `/payment-plans/${planId}`);
    const arr = firstArray(raw, ['data']);
    return decodePaymentPlan(arr?.[0] ?? raw.data ?? raw);
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
    const arr = firstArray(raw, ['data']);
    return decodeSubscription(arr?.[0] ?? raw.data ?? raw);
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
    const arr = firstArray(raw, ['data']) ?? [];
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

  // ─── Bank accounts ─────────────────────────────────────────────────────
  async function createBankAccount(
    customerId: number,
    input: CreateBankAccountInput
  ): Promise<{ id: number; message: string }> {
    if (!Number.isInteger(customerId) || customerId <= 0) {
      throw new Error('Helcim createBankAccount requires a positive integer customerId');
    }
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
    const data = (raw.data ?? raw) as Record<string, unknown>;
    const id = firstNumber(data, ['id', 'Id']) ?? 0;
    const message = firstString(data, ['message', 'Message']) ?? '';
    return { id, message };
  }

  async function getCustomerBankAccounts(customerId: number): Promise<HelcimBankAccount[]> {
    if (!Number.isInteger(customerId) || customerId <= 0) {
      throw new Error('Helcim getCustomerBankAccounts requires a positive integer customerId');
    }
    const raw = await request('GET', `/customers/${customerId}/bank-accounts`);
    const arr = Array.isArray(raw) ? raw : (firstArray(raw, ['data', 'bankAccounts', 'bank_accounts']) ?? []);
    return arr.map(decodeBankAccount);
  }

  async function getBankAccount(customerId: number, bankAccountId: number): Promise<HelcimBankAccount> {
    if (!Number.isInteger(customerId) || customerId <= 0) {
      throw new Error('Helcim getBankAccount requires a positive integer customerId');
    }
    if (!Number.isInteger(bankAccountId) || bankAccountId <= 0) {
      throw new Error('Helcim getBankAccount requires a positive integer bankAccountId');
    }
    const raw = await request('GET', `/customers/${customerId}/bank-accounts/${bankAccountId}`);
    const data = (raw.data ?? raw) as Record<string, unknown>;
    return decodeBankAccount(data);
  }

  async function setBankAccountDefault(customerId: number, bankAccountId: number): Promise<boolean> {
    if (!Number.isInteger(customerId) || customerId <= 0) {
      throw new Error('Helcim setBankAccountDefault requires a positive integer customerId');
    }
    if (!Number.isInteger(bankAccountId) || bankAccountId <= 0) {
      throw new Error('Helcim setBankAccountDefault requires a positive integer bankAccountId');
    }
    await request('PATCH', `/customers/${customerId}/bank-accounts/${bankAccountId}/default`);
    return true;
  }

  async function requestNewBankAccount(customerId: number): Promise<{ message: string }> {
    if (!Number.isInteger(customerId) || customerId <= 0) {
      throw new Error('Helcim requestNewBankAccount requires a positive integer customerId');
    }
    const raw = await request('POST', `/customers/${customerId}/bank-accounts/request`);
    const message = firstString(raw, ['message', 'Message']) ?? '';
    return { message };
  }

  // ─── PAD agreements ────────────────────────────────────────────────────
  async function getPADs(customerId: number): Promise<HelcimPADAgreement[]> {
    if (!Number.isInteger(customerId) || customerId <= 0) {
      throw new Error('Helcim getPADs requires a positive integer customerId');
    }
    const raw = await request('GET', `/customers/${customerId}/pads`);
    const arr = Array.isArray(raw) ? raw : (firstArray(raw, ['data', 'pads', 'Pads']) ?? []);
    return arr.map(decodePADAgreement);
  }

  async function getPAD(customerId: number, padId: number): Promise<HelcimPADAgreement> {
    if (!Number.isInteger(customerId) || customerId <= 0) {
      throw new Error('Helcim getPAD requires a positive integer customerId');
    }
    if (!Number.isInteger(padId) || padId <= 0) {
      throw new Error('Helcim getPAD requires a positive integer padId');
    }
    const raw = await request('GET', `/customers/${customerId}/pads/${padId}`);
    const data = (raw.data ?? raw) as Record<string, unknown>;
    return decodePADAgreement(data);
  }

  async function updatePAD(
    customerId: number,
    padId: number,
    updates: { accepted?: boolean; status?: number }
  ): Promise<HelcimPADAgreement> {
    if (!Number.isInteger(customerId) || customerId <= 0) {
      throw new Error('Helcim updatePAD requires a positive integer customerId');
    }
    if (!Number.isInteger(padId) || padId <= 0) {
      throw new Error('Helcim updatePAD requires a positive integer padId');
    }
    const body: Record<string, unknown> = {};
    if (updates.accepted !== undefined) body.accepted = updates.accepted ? 1 : 0;
    body.status = updates.status;
    const raw = await request('PUT', `/customers/${customerId}/pads/${padId}`, { body });
    const data = (raw.data ?? raw) as Record<string, unknown>;
    return decodePADAgreement(data);
  }

  // ─── ACH transactions ──────────────────────────────────────────────────
  async function processACHWithdraw(
    input: ProcessACHWithdrawInput,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimACHTransaction> {
    if (!Number.isInteger(input.bankAccountId) || input.bankAccountId <= 0) {
      throw new Error('Helcim processACHWithdraw requires a positive integer bankAccountId');
    }
    if (!Number.isInteger(input.customerId) || input.customerId <= 0) {
      throw new Error('Helcim processACHWithdraw requires a positive integer customerId');
    }
    assertPositiveAmount(input.amount, 'processACHWithdraw amount');
    if (input.currencyId !== 1 && input.currencyId !== 2) {
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
    const txn = (raw.transaction ?? raw) as Record<string, unknown>;
    return decodeACHTransaction(txn);
  }

  async function getACHTransaction(transactionId: number): Promise<HelcimACHTransaction> {
    if (!Number.isInteger(transactionId) || transactionId <= 0) {
      throw new Error('Helcim getACHTransaction requires a positive integer transactionId');
    }
    const raw = await request('GET', `/ach/transactions/${transactionId}`);
    const txn = (raw.transaction ?? raw.data ?? raw) as Record<string, unknown>;
    return decodeACHTransaction(txn);
  }

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

  async function refundACH(
    transactionId: number,
    amount: number,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimACHTransaction> {
    if (!Number.isInteger(transactionId) || transactionId <= 0) {
      throw new Error('Helcim refundACH requires a positive integer transactionId');
    }
    assertPositiveAmount(amount, 'refundACH amount');
    const raw = await request('POST', `/ach/refund/${transactionId}`, {
      body: { amount },
      idempotencyKey,
    });
    const txn = (raw.transaction ?? raw) as Record<string, unknown>;
    return decodeACHTransaction(txn);
  }

  async function voidACH(
    transactionId: number,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimACHTransaction> {
    if (!Number.isInteger(transactionId) || transactionId <= 0) {
      throw new Error('Helcim voidACH requires a positive integer transactionId');
    }
    const raw = await request('POST', `/ach/void/${transactionId}`, { idempotencyKey });
    const txn = (raw.transaction ?? raw) as Record<string, unknown>;
    return decodeACHTransaction(txn);
  }

  async function cancelACH(
    transactionId: number,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimACHTransaction> {
    if (!Number.isInteger(transactionId) || transactionId <= 0) {
      throw new Error('Helcim cancelACH requires a positive integer transactionId');
    }
    const raw = await request('POST', `/ach/cancel/${transactionId}`, { idempotencyKey });
    const txn = (raw.transaction ?? raw) as Record<string, unknown>;
    return decodeACHTransaction(txn);
  }

  // ─── Payment API (one-time card transactions) ──────────────────────────
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
    const txn = (raw.transaction ?? raw.data ?? raw) as Record<string, unknown>;
    return decodeCardTransaction(txn);
  }

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
    const txn = (raw.transaction ?? raw.data ?? raw) as Record<string, unknown>;
    return decodeCardTransaction(txn);
  }

  async function capturePreauth(
    input: CapturePreauthInput,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimCardTransaction> {
    if (!Number.isInteger(input.cardTransactionId) || input.cardTransactionId <= 0) {
      throw new Error('Helcim capturePreauth requires a positive integer cardTransactionId');
    }
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
    const txn = (raw.transaction ?? raw.data ?? raw) as Record<string, unknown>;
    return decodeCardTransaction(txn);
  }

  async function refundPurchase(
    input: RefundPurchaseInput,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimCardTransaction> {
    if (!Number.isInteger(input.cardTransactionId) || input.cardTransactionId <= 0) {
      throw new Error('Helcim refundPurchase requires a positive integer cardTransactionId');
    }
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
    const txn = (raw.transaction ?? raw.data ?? raw) as Record<string, unknown>;
    return decodeCardTransaction(txn);
  }

  async function reversePurchase(
    input: ReversePurchaseInput,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimCardTransaction> {
    if (!Number.isInteger(input.cardTransactionId) || input.cardTransactionId <= 0) {
      throw new Error('Helcim reversePurchase requires a positive integer cardTransactionId');
    }
    assertNonEmptyString(input.ipAddress, 'reversePurchase ipAddress');
    const body: Record<string, unknown> = {
      cardTransactionId: input.cardTransactionId,
      ipAddress: input.ipAddress,
    };
    const raw = await request('POST', '/payment/reverse', { body, idempotencyKey });
    const txn = (raw.transaction ?? raw.data ?? raw) as Record<string, unknown>;
    return decodeCardTransaction(txn);
  }

  // ─── Invoices ──────────────────────────────────────────────────────────
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

  async function getInvoice(invoiceId: number): Promise<HelcimInvoice> {
    if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
      throw new Error('Helcim getInvoice requires a positive integer invoiceId');
    }
    const raw = await request('GET', `/invoices/${invoiceId}`);
    const arr = firstArray(raw, ['data']);
    return decodeInvoice(arr?.[0] ?? raw.data ?? raw);
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
