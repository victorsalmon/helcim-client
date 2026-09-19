import { HELCIM_BOOLEAN_TRUE } from './types.js';
import type {
  HelcimAddress,
  HelcimCustomer,
  HelcimCard,
  HelcimCardTransaction,
  HelcimPaymentPlan,
  HelcimSubscriptionPayment,
  HelcimSubscription,
  HelcimBankAccount,
  HelcimPADAgreement,
  HelcimACHTransaction,
  HelcimInvoice,
} from './types.js';
import { firstString, firstNumber, firstArray, optionalString } from './util.js';

// ─── Response decoders ──────────────────────────────────────────────────────

/**
 * Decode a Helcim address object from an API payload.
 *
 * Helcim returns addresses under several casing conventions (camelCase,
 * PascalCase, and snake_case). This decoder normalizes the first matching
 * fields into a single predictable shape. `name`, `street1`, and `postalCode`
 * are required; if any is missing the address is treated as absent.
 */
export function decodeAddress(raw: unknown): HelcimAddress | null {
  if (!raw || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const name = firstString(record, ['name', 'Name']);
  const street1 = firstString(record, ['street1', 'Street1', 'street_1']);
  const postalCode = firstString(record, ['postalCode', 'PostalCode', 'postal_code']);
  if (!name || !street1 || !postalCode) return null;
  return {
    name,
    street1,
    street2:
      optionalString(firstString(record, ['street2', 'Street2', 'street_2']) ?? undefined) ??
      undefined,
    city: optionalString(firstString(record, ['city', 'City']) ?? undefined) ?? undefined,
    province:
      optionalString(firstString(record, ['province', 'Province']) ?? undefined) ?? undefined,
    country: optionalString(firstString(record, ['country', 'Country']) ?? undefined) ?? undefined,
    postalCode,
    phone: optionalString(firstString(record, ['phone', 'Phone']) ?? undefined) ?? undefined,
    email: optionalString(firstString(record, ['email', 'Email']) ?? undefined) ?? undefined,
  };
}

/**
 * Decode a card token object from a Helcim customer or transaction payload.
 */
export function decodeCard(raw: unknown): HelcimCard {
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
export function decodeCustomer(raw: unknown): HelcimCustomer {
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
export function decodeCardTransaction(raw: unknown): HelcimCardTransaction {
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
export function decodePaymentPlan(raw: unknown): HelcimPaymentPlan {
  const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const type = firstString(record, ['type', 'Type']) as HelcimPaymentPlan['type'];
  const status = firstString(record, ['status', 'Status']) as HelcimPaymentPlan['status'];
  const billingPeriod = firstString(record, [
    'billingPeriod',
    'billing_period',
  ]) as HelcimPaymentPlan['billingPeriod'];
  const termType = firstString(record, ['termType', 'term_type']) as HelcimPaymentPlan['termType'];
  const taxType = firstString(record, ['taxType', 'tax_type']) as HelcimPaymentPlan['taxType'];
  const paymentMethod = firstString(record, [
    'paymentMethod',
    'payment_method',
  ]) as HelcimPaymentPlan['paymentMethod'];
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
    billingPeriodIncrements: firstNumber(record, [
      'billingPeriodIncrements',
      'billing_period_increments',
    ]),
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
export function decodeSubscriptionPayment(raw: unknown): HelcimSubscriptionPayment {
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
export function decodeSubscription(raw: unknown): HelcimSubscription {
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
export function decodeBankAccount(raw: unknown): HelcimBankAccount {
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
    bankAccountNumberL4: firstString(record, [
      'bankAccountNumberL4',
      'bankAccountNumberL4l4',
      'bank_account_number_l4',
    ]),
    address: decodeAddress(record.address ?? record.Address),
    raw: record,
  };
}

/**
 * Decode a pre-authorized debit (PAD) agreement.
 */
export function decodePADAgreement(raw: unknown): HelcimPADAgreement {
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
export function decodeACHTransaction(raw: unknown): HelcimACHTransaction {
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
    acquirerTransactionId: firstString(record, [
      'acquirerTransactionId',
      'acquirer_transaction_id',
    ]),
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
export function decodeInvoice(raw: unknown): HelcimInvoice {
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

/** Throw if a monetary amount is not a positive finite number. */
export function assertPositiveAmount(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Helcim ${name} requires a positive finite amount`);
  }
}

/** Throw if a required string field is missing or whitespace-only. */
export function assertNonEmptyString(value: unknown, name: string): void {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Helcim ${name} is required`);
  }
}

/** Throw if a required id is not a positive integer. */
export function assertPositiveInteger(value: number, message: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(message);
  }
}

/**
 * Unwrap a record by looking for the first nested object among a list of keys.
 *
 * Helcim wraps some transaction responses in `transaction` or `data`; other
 * endpoints return the object directly. This helper picks the first object
 * found in the precedence order, falling back to the raw record itself.
 */
export function unwrapRecord(
  raw: Record<string, unknown>,
  keys: string[]
): Record<string, unknown> {
  for (const key of keys) {
    const value = raw[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  }
  return raw;
}

/** Unwrap a record that may be nested under a `data` key. */
export function unwrapDataObject(raw: Record<string, unknown>): Record<string, unknown> {
  return unwrapRecord(raw, ['data']);
}

/**
 * Decode the first item in `raw.data` (when it is an array), or the `data`
 * object itself, or the raw record if neither is present.
 */
export function decodeFirstInData<T>(
  raw: Record<string, unknown>,
  decoder: (raw: unknown) => T
): T {
  const arr = firstArray(raw, ['data']);
  return decoder(arr?.[0] ?? raw.data ?? raw);
}

/** Convert a decoded address back into a request payload, omitting empty optional fields. */
export function addressToPayload(addr: HelcimAddress): Record<string, string | undefined> {
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
