import type { TransportRequest } from '../transport.js';
import type { HelcimCustomer, HelcimCard, CreateCustomerInput } from '../types.js';
import { firstArray } from '../util.js';
import { decodeCard, decodeCustomer, assertPositiveInteger, addressToPayload } from '../decode.js';

export interface CustomersContext {
  request: TransportRequest;
}

/** Endpoint group factory — composed by client.ts. */
export function createCustomersApi({ request }: CustomersContext) {
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
    assertPositiveInteger(customerId, 'Helcim getCustomer requires a positive integer customerId');
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
    assertPositiveInteger(customerId, 'Helcim getCustomerCards requires a positive integer customerId');
    const raw = await request('GET', `/customers/${customerId}/cards`, {
      query: { cardToken },
    });
    const arr = Array.isArray(raw) ? raw : (firstArray(raw, ['data', 'cards', 'Cards']) ?? []);
    return arr.map(decodeCard);
  }

  /** Set the default card for a customer. */
  async function setCustomerCardDefault(customerId: number, cardId: number): Promise<HelcimCustomer[]> {
    assertPositiveInteger(customerId, 'Helcim setCustomerCardDefault requires a positive integer customerId');
    assertPositiveInteger(cardId, 'Helcim setCustomerCardDefault requires a positive integer cardId');
    const raw = await request('PATCH', `/customers/${customerId}/cards/${cardId}/default`);
    const arr = Array.isArray(raw) ? raw : (firstArray(raw, ['data']) ?? [raw]);
    return arr.map(decodeCustomer);
  }

  return {
    createCustomer,
    getCustomer,
    getCustomers,
    getCustomerCards,
    setCustomerCardDefault,
  };
}

