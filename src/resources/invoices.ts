import type { TransportRequest } from '../transport.js';
import type { CreateInvoiceInput, HelcimInvoice } from '../types.js';
import { generateIdempotencyKey, firstArray } from '../util.js';
import {
  decodeInvoice,
  assertNonEmptyString,
  assertPositiveInteger,
  decodeFirstInData,
} from '../decode.js';

export interface InvoicesContext {
  request: TransportRequest;
}

/** Endpoint group factory — composed by client.ts. */
export function createInvoicesApi({ request }: InvoicesContext) {
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
  async function getInvoices(
    params: {
      customerCode?: string;
      page?: number;
      limit?: number;
      status?: string;
    } = {}
  ): Promise<HelcimInvoice[]> {
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
    assertPositiveInteger(invoiceId, 'Helcim getInvoice requires a positive integer invoiceId');
    const raw = await request('GET', `/invoices/${invoiceId}`);
    return decodeFirstInData(raw, decodeInvoice);
  }

  return {
    createInvoice,
    getInvoices,
    getInvoice,
  };
}
