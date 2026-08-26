import type { TransportRequest } from '../transport.js';
import { numericBoolean } from '../types.js';
import type { HelcimCheckoutSession, InitializeHelcimPayInput } from '../types.js';
import { firstString } from '../util.js';
import { assertPositiveAmount, assertNonEmptyString, addressToPayload } from '../decode.js';

export interface CheckoutContext {
  request: TransportRequest;
}

/** Endpoint group factory — composed by client.ts. */
export function createCheckoutApi({ request }: CheckoutContext) {
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

  return {
    initializeHelcimPay,
  };
}

