import type { TransportRequest } from '../transport.js';
import type { HelcimCardTransaction, ProcessPurchaseInput, ProcessPreauthInput, CapturePreauthInput, RefundPurchaseInput, ReversePurchaseInput } from '../types.js';
import { generateIdempotencyKey } from '../util.js';
import { decodeCardTransaction, assertPositiveAmount, assertNonEmptyString, assertPositiveInteger, unwrapRecord, addressToPayload } from '../decode.js';

export interface paymentApiContext {
  request: TransportRequest;
}

/** Endpoint group factory — composed by client.ts. */
export function createPaymentApi({ request }: paymentApiContext) {
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
    assertPositiveInteger(input.cardTransactionId, 'Helcim capturePreauth requires a positive integer cardTransactionId');
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
    assertPositiveInteger(input.cardTransactionId, 'Helcim refundPurchase requires a positive integer cardTransactionId');
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
    assertPositiveInteger(input.cardTransactionId, 'Helcim reversePurchase requires a positive integer cardTransactionId');
    assertNonEmptyString(input.ipAddress, 'reversePurchase ipAddress');
    const body: Record<string, unknown> = {
      cardTransactionId: input.cardTransactionId,
      ipAddress: input.ipAddress,
    };
    const raw = await request('POST', '/payment/reverse', { body, idempotencyKey });
    return decodeCardTransaction(unwrapRecord(raw, ['transaction', 'data']));
  }

  return {
    processPurchase,
    processPreauth,
    capturePreauth,
    refundPurchase,
    reversePurchase,
  };
}

