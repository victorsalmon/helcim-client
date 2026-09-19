import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fc, test as fcTest } from '@fast-check/vitest';
import { createHelcimClient } from '../src/index.js';
import {
  TEST_CONFIG,
  mockFetch,
  assertMethod,
  assertPath,
  assertQuery,
  assertQueryAbsent,
  assertBodyField,
  assertBodyFieldAbsent,
  assertBodyPath,
  bodyOf,
  BASE,
} from './helpers.js';

beforeEach(() => vi.restoreAllMocks());

// ─── connectionTest ──────────────────────────────────────────────────────────

describe('connectionTest contract', () => {
  it('GETs /connection-test and returns true on 200', async () => {
    const { fetchImpl, calls } = mockFetch({ status: 200, body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    expect(await c.connectionTest()).toBe(true);
    assertMethod(calls[0], 'GET');
    assertPath(calls[0], '/connection-test');
  });

  it('returns false on non-200', async () => {
    const { fetchImpl } = mockFetch({ status: 401, body: { errors: ['x'] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    expect(await c.connectionTest()).toBe(false);
  });

  it('returns false on network error', async () => {
    const fetchImpl = vi.fn(async () => { throw new Error('network'); }) as unknown as typeof fetch;
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    expect(await c.connectionTest()).toBe(false);
  });
});

// ─── createCustomer ──────────────────────────────────────────────────────────

describe('createCustomer contract', () => {
  it('POSTs to /customers with all optional fields included', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { id: 1, customerCode: 'C1' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createCustomer({
      customerCode: 'CST100',
      contactName: 'Example Customer',
      businessName: 'Example Inc.',
      cellPhone: '555-1234',
      billingAddress: { name: 'Example Customer', street1: '1 St', postalCode: 'H0H0H0' },
      shippingAddress: { name: 'Example Customer', street1: '2 St', postalCode: 'H0H0H0' },
    });
    assertMethod(calls[0], 'POST');
    assertPath(calls[0], '/customers');
    assertBodyField(calls[0], 'customerCode', 'CST100');
    assertBodyField(calls[0], 'contactName', 'Example Customer');
    assertBodyField(calls[0], 'businessName', 'Example Inc.');
    assertBodyField(calls[0], 'cellPhone', '555-1234');
    assertBodyPath(calls[0], 'billingAddress.name', 'Example Customer');
    assertBodyPath(calls[0], 'shippingAddress.name', 'Example Customer');
  });

  it('omits all optional fields when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { id: 1 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createCustomer({ contactName: 'Example Customer' });
    assertBodyFieldAbsent(calls[0], 'customerCode');
    assertBodyFieldAbsent(calls[0], 'businessName');
    assertBodyFieldAbsent(calls[0], 'cellPhone');
    assertBodyFieldAbsent(calls[0], 'billingAddress');
    assertBodyFieldAbsent(calls[0], 'shippingAddress');
  });

  it('includes only contactName when only contactName is provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { id: 1 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createCustomer({ contactName: 'Example Customer' });
    assertBodyField(calls[0], 'contactName', 'Example Customer');
    assertBodyFieldAbsent(calls[0], 'businessName');
  });

  it('includes only businessName when only businessName is provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { id: 1 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createCustomer({ businessName: 'Example Inc.' });
    assertBodyField(calls[0], 'businessName', 'Example Inc.');
    assertBodyFieldAbsent(calls[0], 'contactName');
  });

  it('includes only cellPhone when only cellPhone is provided (with contactName)', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { id: 1 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createCustomer({ contactName: 'J', cellPhone: '555' });
    assertBodyField(calls[0], 'cellPhone', '555');
  });

  it('omits cellPhone when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { id: 1 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createCustomer({ contactName: 'J' });
    assertBodyFieldAbsent(calls[0], 'cellPhone');
  });

  it('omits customerCode when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { id: 1 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createCustomer({ contactName: 'J' });
    assertBodyFieldAbsent(calls[0], 'customerCode');
  });

  it('throws if neither contactName nor businessName', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createCustomer({})).rejects.toThrow(/contactName or businessName/);
  });

  it('accepts businessName-only (no contactName)', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { id: 1 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createCustomer({ businessName: 'Example Inc.' });
    assertMethod(calls[0], 'POST');
    assertPath(calls[0], '/customers');
  });
});

// ─── getCustomer ─────────────────────────────────────────────────────────────

describe('getCustomer contract', () => {
  it('GETs /customers/{id}', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { id: 5, customerCode: 'C5' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getCustomer(5);
    assertMethod(calls[0], 'GET');
    assertPath(calls[0], '/customers/5');
  });

  it('rejects id=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getCustomer(0)).rejects.toThrow(/positive integer/);
  });

  it('rejects negative id', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getCustomer(-1)).rejects.toThrow(/positive integer/);
  });

  it('rejects non-integer id (1.5)', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getCustomer(1.5)).rejects.toThrow(/positive integer/);
  });

  it('rejects NaN id', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getCustomer(NaN)).rejects.toThrow(/positive integer/);
  });

  it('rejects Infinity id', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getCustomer(Infinity)).rejects.toThrow(/positive integer/);
  });

  it('accepts id=1 (boundary)', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { id: 1 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getCustomer(1);
    assertPath(calls[0], '/customers/1');
  });
});

// ─── getCustomers ────────────────────────────────────────────────────────────

describe('getCustomers contract', () => {
  it('GETs /customers with all query params', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getCustomers({ customerCode: 'C1', page: 2, limit: 10 });
    assertMethod(calls[0], 'GET');
    assertPath(calls[0], '/customers');
    assertQuery(calls[0], 'customerCode', 'C1');
    assertQuery(calls[0], 'page', '2');
    assertQuery(calls[0], 'limit', '10');
  });

  it('omits empty/undefined query params', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getCustomers({ customerCode: '', page: undefined, limit: undefined });
    assertQueryAbsent(calls[0], 'customerCode');
    assertQueryAbsent(calls[0], 'page');
    assertQueryAbsent(calls[0], 'limit');
  });

  it('unwraps data array', async () => {
    const { fetchImpl } = mockFetch({ body: { data: [{ id: 1, customerCode: 'C1' }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getCustomers({});
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe(1);
  });

  it('unwraps customers array (alternate key)', async () => {
    const { fetchImpl } = mockFetch({ body: { customers: [{ id: 2, customerCode: 'C2' }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getCustomers({});
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe(2);
  });

  it('unwraps Customers (PascalCase) array', async () => {
    const { fetchImpl } = mockFetch({ body: { Customers: [{ id: 3, customerCode: 'C3' }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getCustomers({});
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe(3);
  });

  it('handles bare array response', async () => {
    const { fetchImpl } = mockFetch({ body: [{ id: 4, customerCode: 'C4' }] });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getCustomers({});
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe(4);
  });

  it('returns empty array when no data key', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getCustomers({});
    expect(r).toHaveLength(0);
  });
});

// ─── getCustomerCards ────────────────────────────────────────────────────────

describe('getCustomerCards contract', () => {
  it('GETs /customers/{id}/cards', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getCustomerCards(7);
    assertMethod(calls[0], 'GET');
    assertPath(calls[0], '/customers/7/cards');
  });

  it('passes cardToken query param when provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getCustomerCards(7, 'tok-abc');
    assertQuery(calls[0], 'cardToken', 'tok-abc');
  });

  it('omits cardToken query param when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getCustomerCards(7);
    assertQueryAbsent(calls[0], 'cardToken');
  });

  it('rejects id=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getCustomerCards(0)).rejects.toThrow(/positive integer/);
  });

  it('rejects negative id', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getCustomerCards(-1)).rejects.toThrow(/positive integer/);
  });

  it('rejects non-integer id', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getCustomerCards(1.5)).rejects.toThrow(/positive integer/);
  });

  it('unwraps data array', async () => {
    const { fetchImpl } = mockFetch({ body: { data: [{ id: 1, cardToken: 't' }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getCustomerCards(1);
    expect(r).toHaveLength(1);
    expect(r[0].cardToken).toBe('t');
  });

  it('unwraps cards array (alternate key)', async () => {
    const { fetchImpl } = mockFetch({ body: { cards: [{ id: 2, cardToken: 't2' }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getCustomerCards(1);
    expect(r).toHaveLength(1);
    expect(r[0].cardToken).toBe('t2');
  });

  it('unwraps Cards (PascalCase) array', async () => {
    const { fetchImpl } = mockFetch({ body: { Cards: [{ id: 3, cardToken: 't3' }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getCustomerCards(1);
    expect(r).toHaveLength(1);
    expect(r[0].cardToken).toBe('t3');
  });

  it('handles bare array response', async () => {
    const { fetchImpl } = mockFetch({ body: [{ id: 4, cardToken: 't4' }] });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getCustomerCards(1);
    expect(r).toHaveLength(1);
    expect(r[0].cardToken).toBe('t4');
  });

  it('returns empty array when response has no card fields', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getCustomerCards(1);
    expect(r).toHaveLength(0);
  });
});

// ─── setCustomerCardDefault ──────────────────────────────────────────────────

describe('setCustomerCardDefault contract', () => {
  it('PATCHes /customers/{id}/cards/{cardId}/default', async () => {
    const { fetchImpl, calls } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.setCustomerCardDefault(7, 99);
    assertMethod(calls[0], 'PATCH');
    assertPath(calls[0], '/customers/7/cards/99/default');
  });

  it('rejects customerId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.setCustomerCardDefault(0, 99)).rejects.toThrow(/positive integer/);
  });

  it('rejects cardId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.setCustomerCardDefault(7, 0)).rejects.toThrow(/positive integer/);
  });

  it('rejects negative cardId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.setCustomerCardDefault(7, -1)).rejects.toThrow(/positive integer/);
  });

  it('rejects non-integer cardId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.setCustomerCardDefault(7, 1.5)).rejects.toThrow(/positive integer/);
  });

  it('rejects non-integer customerId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.setCustomerCardDefault(1.5, 99)).rejects.toThrow(/positive integer/);
  });

  it('unwraps data array from response', async () => {
    const { fetchImpl } = mockFetch({ body: { data: [{ id: 1, customerCode: 'C1' }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.setCustomerCardDefault(1, 1);
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe(1);
  });

  it('wraps raw object response in array', async () => {
    const { fetchImpl } = mockFetch({ body: { id: 5, customerCode: 'C5' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.setCustomerCardDefault(1, 1);
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe(5);
  });
});

// ─── Property-based: customer endpoints ──────────────────────────────────────

fcTest.prop([fc.integer({ min: 1, max: 999999 })])(
  'getCustomer always builds /customers/{id} for valid ids',
  async (id) => {
    const { fetchImpl, calls } = mockFetch({ body: { id, customerCode: 'C' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getCustomer(id);
    return calls[0].method === 'GET' && calls[0].url.split('?')[0] === `${BASE}/customers/${id}`;
  }
);

fcTest.prop([fc.integer({ min: -999, max: 0 })])(
  'getCustomer always rejects non-positive ids',
  async (id) => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    try {
      await c.getCustomer(id);
      return false;
    } catch {
      return true;
    }
  }
);

fcTest.prop([fc.integer({ min: 1, max: 999999 }), fc.integer({ min: 1, max: 999999 })])(
  'setCustomerCardDefault always builds /customers/{cid}/cards/{cardId}/default',
  async (cid, cardId) => {
    const { fetchImpl, calls } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.setCustomerCardDefault(cid, cardId);
    return calls[0].method === 'PATCH' && calls[0].url === `${BASE}/customers/${cid}/cards/${cardId}/default`;
  }
);

fcTest.prop([
  fc.record({
    customerCode: fc.string({ minLength: 1, maxLength: 20 }),
    contactName: fc.string({ minLength: 1, maxLength: 50 }),
    businessName: fc.string({ minLength: 1, maxLength: 50 }),
    cellPhone: fc.string({ minLength: 1, maxLength: 20 }),
  }),
])(
  'createCustomer includes all provided optional fields in the body',
  async (input) => {
    const { fetchImpl, calls } = mockFetch({ body: { id: 1 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createCustomer(input);
    const b = bodyOf(calls[0]);
    return b.customerCode === input.customerCode && b.contactName === input.contactName &&
           b.businessName === input.businessName && b.cellPhone === input.cellPhone;
  }
);
