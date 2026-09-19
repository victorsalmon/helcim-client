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

export type HelcimACHCurrency = (typeof HELCIM_ACH_CURRENCY)[keyof typeof HELCIM_ACH_CURRENCY];

/**
 * Helcim's numeric boolean convention.
 *
 * Several endpoints use `1` for true and `0` for false. These constants make
 * that convention explicit in decoders and request bodies.
 */
export const HELCIM_BOOLEAN_TRUE = 1 as const;
export const HELCIM_BOOLEAN_FALSE = 0 as const;

export type HelcimNumericBoolean = typeof HELCIM_BOOLEAN_TRUE | typeof HELCIM_BOOLEAN_FALSE;

/** Convert a boolean into Helcim's numeric convention (true = 1, false = 0). */
export function numericBoolean(value: boolean): HelcimNumericBoolean {
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
