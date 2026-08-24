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
  assertHeader,
  assertBodyField,
  assertBodyFieldAbsent,
  assertBodyPath,
  assertBodyPathAbsent,
  bodyOf,
  BASE,
} from './helpers.js';

beforeEach(() => vi.restoreAllMocks());

// ─── processACHWithdraw ──────────────────────────────────────────────────────

describe('processACHWithdraw contract', () => {
  const baseInput = {
    bankAccountId: 1182342,
    customerId: 389829,
    amount: 79.99,
    currencyId: 1 as const,
  };

  it('PUTs /ach/withdraw with idempotency key', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { id: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.processACHWithdraw(baseInput);
    assertMethod(calls[0], 'PUT');
    assertPath(calls[0], '/ach/withdraw');
    expect(calls[0].headers['idempotency-key']).toBeDefined();
  });

  it('includes required fields in body', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { id: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.processACHWithdraw(baseInput);
    assertBodyField(calls[0], 'bankAccountId', 1182342);
    assertBodyField(calls[0], 'customerId', 389829);
    assertBodyField(calls[0], 'amount', 79.99);
    assertBodyField(calls[0], 'currencyId', 1);
  });

  it('includes orderId when provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { id: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.processACHWithdraw({ ...baseInput, orderId: 99 });
    assertBodyField(calls[0], 'orderId', 99);
  });

  it('omits orderId when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { id: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.processACHWithdraw(baseInput);
    assertBodyFieldAbsent(calls[0], 'orderId');
  });

  it('rejects bankAccountId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processACHWithdraw({ ...baseInput, bankAccountId: 0 })).rejects.toThrow(/bankAccountId/);
  });

  it('rejects negative bankAccountId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processACHWithdraw({ ...baseInput, bankAccountId: -1 })).rejects.toThrow(/bankAccountId/);
  });

  it('rejects non-integer bankAccountId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processACHWithdraw({ ...baseInput, bankAccountId: 1.5 })).rejects.toThrow(/bankAccountId/);
  });

  it('rejects customerId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processACHWithdraw({ ...baseInput, customerId: 0 })).rejects.toThrow(/customerId/);
  });

  it('rejects negative customerId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processACHWithdraw({ ...baseInput, customerId: -1 })).rejects.toThrow(/customerId/);
  });

  it('rejects non-integer customerId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processACHWithdraw({ ...baseInput, customerId: 1.5 })).rejects.toThrow(/customerId/);
  });

  it('rejects amount=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processACHWithdraw({ ...baseInput, amount: 0 })).rejects.toThrow(/positive finite/);
  });

  it('rejects negative amount', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processACHWithdraw({ ...baseInput, amount: -5 })).rejects.toThrow(/positive finite/);
  });

  it('rejects NaN amount', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processACHWithdraw({ ...baseInput, amount: NaN })).rejects.toThrow(/positive finite/);
  });

  it('rejects Infinity amount', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processACHWithdraw({ ...baseInput, amount: Infinity })).rejects.toThrow(/positive finite/);
  });

  it('rejects currencyId=3', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processACHWithdraw({ ...baseInput, currencyId: 3 as any })).rejects.toThrow(/currencyId/);
  });

  it('rejects currencyId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processACHWithdraw({ ...baseInput, currencyId: 0 as any })).rejects.toThrow(/currencyId/);
  });

  it('accepts currencyId=2 (USD)', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { id: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.processACHWithdraw({ ...baseInput, currencyId: 2 });
    assertBodyField(calls[0], 'currencyId', 2);
  });

  it('unwraps transaction object', async () => {
    const { fetchImpl } = mockFetch({ body: { transaction: { id: 100, statusAuth: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.processACHWithdraw(baseInput);
    expect(r.id).toBe(100);
    expect(r.statusAuth).toBe(1);
  });

  it('falls back to raw object when no transaction wrapper', async () => {
    const { fetchImpl } = mockFetch({ body: { id: 200, statusAuth: 2 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.processACHWithdraw(baseInput);
    expect(r.id).toBe(200);
    expect(r.statusAuth).toBe(2);
  });
});

// ─── getACHTransaction ───────────────────────────────────────────────────────

describe('getACHTransaction contract', () => {
  it('GETs /ach/transactions/{id}', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { id: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getACHTransaction(1);
    assertMethod(calls[0], 'GET');
    assertPath(calls[0], '/ach/transactions/1');
  });

  it('rejects id=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getACHTransaction(0)).rejects.toThrow(/positive integer/);
  });

  it('rejects negative id', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getACHTransaction(-1)).rejects.toThrow(/positive integer/);
  });

  it('rejects non-integer id', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getACHTransaction(1.5)).rejects.toThrow(/positive integer/);
  });

  it('unwraps transaction object', async () => {
    const { fetchImpl } = mockFetch({ body: { transaction: { id: 1, statusAuth: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getACHTransaction(1);
    expect(r.id).toBe(1);
    expect(r.statusAuth).toBe(1);
  });

  it('unwraps data object (alternate key)', async () => {
    const { fetchImpl } = mockFetch({ body: { data: { id: 2, statusAuth: 2 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getACHTransaction(2);
    expect(r.id).toBe(2);
    expect(r.statusAuth).toBe(2);
  });

  it('falls back to raw object', async () => {
    const { fetchImpl } = mockFetch({ body: { id: 3, statusAuth: 3 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getACHTransaction(3);
    expect(r.id).toBe(3);
    expect(r.statusAuth).toBe(3);
  });
});

// ─── getACHTransactions ──────────────────────────────────────────────────────

describe('getACHTransactions contract', () => {
  it('GETs /ach/transactions with query params', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getACHTransactions({ customerId: 123, page: 1, limit: 10 });
    assertMethod(calls[0], 'GET');
    assertPath(calls[0], '/ach/transactions');
    assertQuery(calls[0], 'customerId', '123');
    assertQuery(calls[0], 'page', '1');
    assertQuery(calls[0], 'limit', '10');
  });

  it('omits undefined query params', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getACHTransactions({});
    assertQueryAbsent(calls[0], 'customerId');
    assertQueryAbsent(calls[0], 'page');
    assertQueryAbsent(calls[0], 'limit');
  });

  it('unwraps data array', async () => {
    const { fetchImpl } = mockFetch({ body: { data: [{ id: 1 }, { id: 2 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getACHTransactions({});
    expect(r).toHaveLength(2);
  });

  it('unwraps transactions (alternate key)', async () => {
    const { fetchImpl } = mockFetch({ body: { transactions: [{ id: 3 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getACHTransactions({});
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe(3);
  });

  it('handles bare array response', async () => {
    const { fetchImpl } = mockFetch({ body: [{ id: 4 }] });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getACHTransactions({});
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe(4);
  });

  it('returns empty array when response has no transaction fields', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getACHTransactions({});
    expect(r).toHaveLength(0);
  });
});

// ─── refundACH ───────────────────────────────────────────────────────────────

describe('refundACH contract', () => {
  it('POSTs to /ach/refund/{id} with idempotency key', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { id: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.refundACH(100, 50);
    assertMethod(calls[0], 'POST');
    assertPath(calls[0], '/ach/refund/100');
    expect(calls[0].headers['idempotency-key']).toBeDefined();
  });

  it('sends amount in body', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { id: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.refundACH(100, 50);
    assertBodyField(calls[0], 'amount', 50);
  });

  it('rejects transactionId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.refundACH(0, 50)).rejects.toThrow(/transactionId/);
  });

  it('rejects negative transactionId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.refundACH(-1, 50)).rejects.toThrow(/transactionId/);
  });

  it('rejects non-integer transactionId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.refundACH(1.5, 50)).rejects.toThrow(/transactionId/);
  });

  it('rejects amount=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.refundACH(100, 0)).rejects.toThrow(/positive finite/);
  });

  it('rejects negative amount', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.refundACH(100, -5)).rejects.toThrow(/positive finite/);
  });

  it('rejects NaN amount', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.refundACH(100, NaN)).rejects.toThrow(/positive finite/);
  });

  it('unwraps transaction object', async () => {
    const { fetchImpl } = mockFetch({ body: { transaction: { id: 200 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.refundACH(100, 50);
    expect(r.id).toBe(200);
  });

  it('falls back to raw object', async () => {
    const { fetchImpl } = mockFetch({ body: { id: 300 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.refundACH(100, 50);
    expect(r.id).toBe(300);
  });
});

// ─── voidACH ─────────────────────────────────────────────────────────────────

describe('voidACH contract', () => {
  it('POSTs to /ach/void/{id} with idempotency key', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { id: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.voidACH(100);
    assertMethod(calls[0], 'POST');
    assertPath(calls[0], '/ach/void/100');
    expect(calls[0].headers['idempotency-key']).toBeDefined();
  });

  it('rejects transactionId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.voidACH(0)).rejects.toThrow(/transactionId/);
  });

  it('rejects negative transactionId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.voidACH(-1)).rejects.toThrow(/transactionId/);
  });

  it('rejects non-integer transactionId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.voidACH(1.5)).rejects.toThrow(/transactionId/);
  });

  it('unwraps transaction object', async () => {
    const { fetchImpl } = mockFetch({ body: { transaction: { id: 200 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.voidACH(100);
    expect(r.id).toBe(200);
  });

  it('falls back to raw object', async () => {
    const { fetchImpl } = mockFetch({ body: { id: 300 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.voidACH(100);
    expect(r.id).toBe(300);
  });
});

// ─── cancelACH ───────────────────────────────────────────────────────────────

describe('cancelACH contract', () => {
  it('POSTs to /ach/cancel/{id} with idempotency key', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { id: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.cancelACH(100);
    assertMethod(calls[0], 'POST');
    assertPath(calls[0], '/ach/cancel/100');
    expect(calls[0].headers['idempotency-key']).toBeDefined();
  });

  it('rejects transactionId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.cancelACH(0)).rejects.toThrow(/transactionId/);
  });

  it('rejects negative transactionId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.cancelACH(-1)).rejects.toThrow(/transactionId/);
  });

  it('rejects non-integer transactionId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.cancelACH(1.5)).rejects.toThrow(/transactionId/);
  });

  it('unwraps transaction object', async () => {
    const { fetchImpl } = mockFetch({ body: { transaction: { id: 200 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.cancelACH(100);
    expect(r.id).toBe(200);
  });

  it('falls back to raw object', async () => {
    const { fetchImpl } = mockFetch({ body: { id: 300 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.cancelACH(100);
    expect(r.id).toBe(300);
  });
});

// ─── processPurchase ─────────────────────────────────────────────────────────

describe('processPurchase contract', () => {
  const baseInput = {
    amount: 100.99,
    currency: 'CAD',
    ipAddress: '192.168.1.1',
    cardData: { cardToken: 'tok_123' },
  };

  it('POSTs to /payment/purchase with idempotency key', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.processPurchase(baseInput);
    assertMethod(calls[0], 'POST');
    assertPath(calls[0], '/payment/purchase');
    expect(calls[0].headers['idempotency-key']).toBeDefined();
  });

  it('includes required fields in body', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.processPurchase(baseInput);
    assertBodyField(calls[0], 'amount', 100.99);
    assertBodyField(calls[0], 'currency', 'CAD');
    assertBodyField(calls[0], 'ipAddress', '192.168.1.1');
    assertBodyPath(calls[0], 'cardData.cardToken', 'tok_123');
  });

  it('includes all optional fields when provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.processPurchase({
      ...baseInput,
      customerCode: 'CST1',
      invoiceNumber: 'INV1',
      orderId: 99,
      ecommerce: true,
      terminalId: 5,
      billingAddress: { name: 'Jane', street1: '1 St', postalCode: 'H0H0H0' },
      invoiceRequest: { lineItems: [{ description: 'x', quantity: 1, price: 5, total: 5 }] },
    });
    assertBodyField(calls[0], 'customerCode', 'CST1');
    assertBodyField(calls[0], 'invoiceNumber', 'INV1');
    assertBodyField(calls[0], 'orderId', 99);
    assertBodyField(calls[0], 'ecommerce', true);
    assertBodyField(calls[0], 'terminalId', 5);
    assertBodyPath(calls[0], 'billingAddress.name', 'Jane');
    assertBodyPath(calls[0], 'invoiceRequest.lineItems.0.description', 'x');
  });

  it('omits all optional fields when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.processPurchase(baseInput);
    assertBodyFieldAbsent(calls[0], 'customerCode');
    assertBodyFieldAbsent(calls[0], 'invoiceNumber');
    assertBodyFieldAbsent(calls[0], 'orderId');
    assertBodyFieldAbsent(calls[0], 'ecommerce');
    assertBodyFieldAbsent(calls[0], 'terminalId');
    assertBodyFieldAbsent(calls[0], 'billingAddress');
    assertBodyFieldAbsent(calls[0], 'invoiceRequest');
  });

  it('rejects amount=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processPurchase({ ...baseInput, amount: 0 })).rejects.toThrow(/positive finite/);
  });

  it('rejects negative amount', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processPurchase({ ...baseInput, amount: -5 })).rejects.toThrow(/positive finite/);
  });

  it('rejects NaN amount', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processPurchase({ ...baseInput, amount: NaN })).rejects.toThrow(/positive finite/);
  });

  it('rejects empty currency', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processPurchase({ ...baseInput, currency: '' })).rejects.toThrow(/currency/);
  });

  it('rejects empty ipAddress', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processPurchase({ ...baseInput, ipAddress: '' })).rejects.toThrow(/ipAddress/);
  });

  it('rejects whitespace-only ipAddress', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processPurchase({ ...baseInput, ipAddress: '  ' })).rejects.toThrow(/ipAddress/);
  });

  it('rejects missing cardData', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processPurchase({ ...baseInput, cardData: null as any })).rejects.toThrow(/cardData/);
  });

  it('rejects non-object cardData', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processPurchase({ ...baseInput, cardData: 'string' as any })).rejects.toThrow(/cardData/);
  });

  it('unwraps transaction object', async () => {
    const { fetchImpl } = mockFetch({ body: { transaction: { transactionId: 1, status: 'APPROVED' } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.processPurchase(baseInput);
    expect(r.transactionId).toBe(1);
    expect(r.status).toBe('APPROVED');
  });

  it('unwraps data object (alternate key)', async () => {
    const { fetchImpl } = mockFetch({ body: { data: { transactionId: 2, status: 'APPROVED' } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.processPurchase(baseInput);
    expect(r.transactionId).toBe(2);
  });

  it('falls back to raw object', async () => {
    const { fetchImpl } = mockFetch({ body: { transactionId: 3, status: 'APPROVED' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.processPurchase(baseInput);
    expect(r.transactionId).toBe(3);
  });
});

// ─── processPreauth ──────────────────────────────────────────────────────────

describe('processPreauth contract', () => {
  const baseInput = {
    amount: 100,
    currency: 'CAD',
    ipAddress: '1.1.1.1',
    cardData: { cardToken: 't' },
  };

  it('POSTs to /payment/preauth with idempotency key', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.processPreauth(baseInput);
    assertMethod(calls[0], 'POST');
    assertPath(calls[0], '/payment/preauth');
    expect(calls[0].headers['idempotency-key']).toBeDefined();
  });

  it('includes all optional fields when provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.processPreauth({
      ...baseInput,
      customerCode: 'CST1',
      invoiceNumber: 'INV1',
      ecommerce: true,
      terminalId: 5,
      billingAddress: { name: 'Jane', street1: '1 St', postalCode: 'H0H0H0' },
    });
    assertBodyField(calls[0], 'customerCode', 'CST1');
    assertBodyField(calls[0], 'invoiceNumber', 'INV1');
    assertBodyField(calls[0], 'ecommerce', true);
    assertBodyField(calls[0], 'terminalId', 5);
    assertBodyPath(calls[0], 'billingAddress.name', 'Jane');
  });

  it('omits all optional fields when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.processPreauth(baseInput);
    assertBodyFieldAbsent(calls[0], 'customerCode');
    assertBodyFieldAbsent(calls[0], 'invoiceNumber');
    assertBodyFieldAbsent(calls[0], 'ecommerce');
    assertBodyFieldAbsent(calls[0], 'terminalId');
    assertBodyFieldAbsent(calls[0], 'billingAddress');
  });

  it('rejects amount=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processPreauth({ ...baseInput, amount: 0 })).rejects.toThrow(/positive finite/);
  });

  it('rejects empty currency', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processPreauth({ ...baseInput, currency: '' })).rejects.toThrow(/currency/);
  });

  it('rejects empty ipAddress', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processPreauth({ ...baseInput, ipAddress: '' })).rejects.toThrow(/ipAddress/);
  });

  it('rejects missing cardData', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processPreauth({ ...baseInput, cardData: null as any })).rejects.toThrow(/cardData/);
  });

  it('unwraps transaction object', async () => {
    const { fetchImpl } = mockFetch({ body: { transaction: { transactionId: 1, status: 'APPROVED' } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.processPreauth(baseInput);
    expect(r.transactionId).toBe(1);
  });

  it('unwraps data object (alternate key)', async () => {
    const { fetchImpl } = mockFetch({ body: { data: { transactionId: 2 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.processPreauth(baseInput);
    expect(r.transactionId).toBe(2);
  });

  it('falls back to raw object', async () => {
    const { fetchImpl } = mockFetch({ body: { transactionId: 3 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.processPreauth(baseInput);
    expect(r.transactionId).toBe(3);
  });
});

// ─── capturePreauth ──────────────────────────────────────────────────────────

describe('capturePreauth contract', () => {
  const baseInput = {
    cardTransactionId: 1,
    amount: 50,
    currency: 'CAD',
    ipAddress: '1.1.1.1',
  };

  it('POSTs to /payment/capture with idempotency key', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.capturePreauth(baseInput);
    assertMethod(calls[0], 'POST');
    assertPath(calls[0], '/payment/capture');
    expect(calls[0].headers['idempotency-key']).toBeDefined();
  });

  it('includes required fields in body', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.capturePreauth(baseInput);
    assertBodyField(calls[0], 'cardTransactionId', 1);
    assertBodyField(calls[0], 'amount', 50);
    assertBodyField(calls[0], 'currency', 'CAD');
    assertBodyField(calls[0], 'ipAddress', '1.1.1.1');
  });

  it('includes orderId when provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.capturePreauth({ ...baseInput, orderId: 99 });
    assertBodyField(calls[0], 'orderId', 99);
  });

  it('omits orderId when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.capturePreauth(baseInput);
    assertBodyFieldAbsent(calls[0], 'orderId');
  });

  it('rejects cardTransactionId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.capturePreauth({ ...baseInput, cardTransactionId: 0 })).rejects.toThrow(/cardTransactionId/);
  });

  it('rejects negative cardTransactionId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.capturePreauth({ ...baseInput, cardTransactionId: -1 })).rejects.toThrow(/cardTransactionId/);
  });

  it('rejects non-integer cardTransactionId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.capturePreauth({ ...baseInput, cardTransactionId: 1.5 })).rejects.toThrow(/cardTransactionId/);
  });

  it('rejects amount=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.capturePreauth({ ...baseInput, amount: 0 })).rejects.toThrow(/positive finite/);
  });

  it('rejects empty currency', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.capturePreauth({ ...baseInput, currency: '' })).rejects.toThrow(/currency/);
  });

  it('rejects empty ipAddress', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.capturePreauth({ ...baseInput, ipAddress: '' })).rejects.toThrow(/ipAddress/);
  });

  it('unwraps transaction object', async () => {
    const { fetchImpl } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.capturePreauth(baseInput);
    expect(r.transactionId).toBe(1);
  });

  it('unwraps data object (alternate key)', async () => {
    const { fetchImpl } = mockFetch({ body: { data: { transactionId: 2 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.capturePreauth(baseInput);
    expect(r.transactionId).toBe(2);
  });

  it('falls back to raw object', async () => {
    const { fetchImpl } = mockFetch({ body: { transactionId: 3 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.capturePreauth(baseInput);
    expect(r.transactionId).toBe(3);
  });
});

// ─── refundPurchase ──────────────────────────────────────────────────────────

describe('refundPurchase contract', () => {
  const baseInput = {
    cardTransactionId: 1,
    amount: 25,
    ipAddress: '1.1.1.1',
  };

  it('POSTs to /payment/refund with idempotency key', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.refundPurchase(baseInput);
    assertMethod(calls[0], 'POST');
    assertPath(calls[0], '/payment/refund');
    expect(calls[0].headers['idempotency-key']).toBeDefined();
  });

  it('includes required fields in body', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.refundPurchase(baseInput);
    assertBodyField(calls[0], 'cardTransactionId', 1);
    assertBodyField(calls[0], 'amount', 25);
    assertBodyField(calls[0], 'ipAddress', '1.1.1.1');
  });

  it('includes customerCode when provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.refundPurchase({ ...baseInput, customerCode: 'CST1' });
    assertBodyField(calls[0], 'customerCode', 'CST1');
  });

  it('includes invoiceNumber when provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.refundPurchase({ ...baseInput, invoiceNumber: 'INV1' });
    assertBodyField(calls[0], 'invoiceNumber', 'INV1');
  });

  it('omits customerCode when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.refundPurchase(baseInput);
    assertBodyFieldAbsent(calls[0], 'customerCode');
  });

  it('omits invoiceNumber when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.refundPurchase(baseInput);
    assertBodyFieldAbsent(calls[0], 'invoiceNumber');
  });

  it('rejects cardTransactionId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.refundPurchase({ ...baseInput, cardTransactionId: 0 })).rejects.toThrow(/cardTransactionId/);
  });

  it('rejects negative cardTransactionId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.refundPurchase({ ...baseInput, cardTransactionId: -1 })).rejects.toThrow(/cardTransactionId/);
  });

  it('rejects non-integer cardTransactionId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.refundPurchase({ ...baseInput, cardTransactionId: 1.5 })).rejects.toThrow(/cardTransactionId/);
  });

  it('rejects amount=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.refundPurchase({ ...baseInput, amount: 0 })).rejects.toThrow(/positive finite/);
  });

  it('rejects empty ipAddress', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.refundPurchase({ ...baseInput, ipAddress: '' })).rejects.toThrow(/ipAddress/);
  });

  it('unwraps transaction object', async () => {
    const { fetchImpl } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.refundPurchase(baseInput);
    expect(r.transactionId).toBe(1);
  });

  it('unwraps data object (alternate key)', async () => {
    const { fetchImpl } = mockFetch({ body: { data: { transactionId: 2 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.refundPurchase(baseInput);
    expect(r.transactionId).toBe(2);
  });

  it('falls back to raw object', async () => {
    const { fetchImpl } = mockFetch({ body: { transactionId: 3 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.refundPurchase(baseInput);
    expect(r.transactionId).toBe(3);
  });
});

// ─── reversePurchase ─────────────────────────────────────────────────────────

describe('reversePurchase contract', () => {
  const baseInput = {
    cardTransactionId: 1,
    ipAddress: '1.1.1.1',
  };

  it('POSTs to /payment/reverse with idempotency key', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.reversePurchase(baseInput);
    assertMethod(calls[0], 'POST');
    assertPath(calls[0], '/payment/reverse');
    expect(calls[0].headers['idempotency-key']).toBeDefined();
  });

  it('includes required fields in body', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.reversePurchase(baseInput);
    assertBodyField(calls[0], 'cardTransactionId', 1);
    assertBodyField(calls[0], 'ipAddress', '1.1.1.1');
  });

  it('rejects cardTransactionId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.reversePurchase({ ...baseInput, cardTransactionId: 0 })).rejects.toThrow(/cardTransactionId/);
  });

  it('rejects negative cardTransactionId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.reversePurchase({ ...baseInput, cardTransactionId: -1 })).rejects.toThrow(/cardTransactionId/);
  });

  it('rejects non-integer cardTransactionId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.reversePurchase({ ...baseInput, cardTransactionId: 1.5 })).rejects.toThrow(/cardTransactionId/);
  });

  it('rejects empty ipAddress', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.reversePurchase({ ...baseInput, ipAddress: '' })).rejects.toThrow(/ipAddress/);
  });

  it('rejects whitespace-only ipAddress', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.reversePurchase({ ...baseInput, ipAddress: '  ' })).rejects.toThrow(/ipAddress/);
  });

  it('unwraps transaction object', async () => {
    const { fetchImpl } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.reversePurchase(baseInput);
    expect(r.transactionId).toBe(1);
  });

  it('unwraps data object (alternate key)', async () => {
    const { fetchImpl } = mockFetch({ body: { data: { transactionId: 2 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.reversePurchase(baseInput);
    expect(r.transactionId).toBe(2);
  });

  it('falls back to raw object', async () => {
    const { fetchImpl } = mockFetch({ body: { transactionId: 3 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.reversePurchase(baseInput);
    expect(r.transactionId).toBe(3);
  });
});

// ─── createInvoice ───────────────────────────────────────────────────────────

describe('createInvoice contract', () => {
  const baseInput = {
    customerCode: 'CST1000',
    lineItems: [{ description: 'Bookkeeping', quantity: 1, price: 50, total: 50 }],
  };

  it('POSTs to /invoices with idempotency key', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 1 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createInvoice(baseInput);
    assertMethod(calls[0], 'POST');
    assertPath(calls[0], '/invoices');
    expect(calls[0].headers['idempotency-key']).toBeDefined();
  });

  it('includes required fields in body', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 1 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createInvoice(baseInput);
    assertBodyField(calls[0], 'customerCode', 'CST1000');
    assertBodyPath(calls[0], 'lineItems.0.description', 'Bookkeeping');
  });

  it('includes all optional fields when provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 1 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createInvoice({
      ...baseInput,
      invoiceNumber: 'INV1',
      notes: 'Test note',
      tipAmount: 5,
      depositAmount: 10,
    });
    assertBodyField(calls[0], 'invoiceNumber', 'INV1');
    assertBodyField(calls[0], 'notes', 'Test note');
    assertBodyField(calls[0], 'tipAmount', 5);
    assertBodyField(calls[0], 'depositAmount', 10);
  });

  it('omits all optional fields when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 1 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createInvoice(baseInput);
    assertBodyFieldAbsent(calls[0], 'invoiceNumber');
    assertBodyFieldAbsent(calls[0], 'notes');
    assertBodyFieldAbsent(calls[0], 'tipAmount');
    assertBodyFieldAbsent(calls[0], 'depositAmount');
  });

  it('rejects empty customerCode', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createInvoice({ ...baseInput, customerCode: '' })).rejects.toThrow(/customerCode/);
  });

  it('rejects whitespace-only customerCode', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createInvoice({ ...baseInput, customerCode: '  ' })).rejects.toThrow(/customerCode/);
  });

  it('rejects empty lineItems array', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createInvoice({ ...baseInput, lineItems: [] })).rejects.toThrow(/line item/);
  });

  it('unwraps data array', async () => {
    const { fetchImpl } = mockFetch({ body: { data: [{ id: 100, invoiceNumber: 'INV100' }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.createInvoice(baseInput);
    expect(r.id).toBe(100);
    expect(r.invoiceNumber).toBe('INV100');
  });

  it('throws when response data array is empty', async () => {
    const { fetchImpl } = mockFetch({ body: { data: [] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createInvoice(baseInput)).rejects.toThrow(/no invoices/);
  });

  it('throws when response has no data field', async () => {
    const { fetchImpl } = mockFetch({ body: { id: 200, invoiceNumber: 'INV200' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createInvoice(baseInput)).rejects.toThrow(/no invoices/);
  });
});

// ─── getInvoices ─────────────────────────────────────────────────────────────

describe('getInvoices contract', () => {
  it('GETs /invoices with all query params', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getInvoices({ customerCode: 'C1', page: 1, limit: 10, status: 'paid' });
    assertMethod(calls[0], 'GET');
    assertPath(calls[0], '/invoices');
    assertQuery(calls[0], 'customerCode', 'C1');
    assertQuery(calls[0], 'page', '1');
    assertQuery(calls[0], 'limit', '10');
    assertQuery(calls[0], 'status', 'paid');
  });

  it('omits undefined/empty query params', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getInvoices({ customerCode: '', page: undefined, limit: undefined, status: undefined });
    assertQueryAbsent(calls[0], 'customerCode');
    assertQueryAbsent(calls[0], 'page');
    assertQueryAbsent(calls[0], 'limit');
    assertQueryAbsent(calls[0], 'status');
  });

  it('unwraps data array', async () => {
    const { fetchImpl } = mockFetch({ body: { data: [{ id: 1 }, { id: 2 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getInvoices({});
    expect(r).toHaveLength(2);
  });

  it('unwraps invoices (alternate key)', async () => {
    const { fetchImpl } = mockFetch({ body: { invoices: [{ id: 3 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getInvoices({});
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe(3);
  });

  it('unwraps Invoices (PascalCase)', async () => {
    const { fetchImpl } = mockFetch({ body: { Invoices: [{ id: 4 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getInvoices({});
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe(4);
  });

  it('handles bare array response', async () => {
    const { fetchImpl } = mockFetch({ body: [{ id: 5 }] });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getInvoices({});
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe(5);
  });

  it('returns empty array when no data', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getInvoices({});
    expect(r).toHaveLength(0);
  });
});

// ─── getInvoice ──────────────────────────────────────────────────────────────

describe('getInvoice contract', () => {
  it('GETs /invoices/{id}', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 5 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getInvoice(5);
    assertMethod(calls[0], 'GET');
    assertPath(calls[0], '/invoices/5');
  });

  it('rejects id=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getInvoice(0)).rejects.toThrow(/positive integer/);
  });

  it('rejects negative id', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getInvoice(-1)).rejects.toThrow(/positive integer/);
  });

  it('rejects non-integer id', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getInvoice(1.5)).rejects.toThrow(/positive integer/);
  });

  it('unwraps data array (first element)', async () => {
    const { fetchImpl } = mockFetch({ body: { data: [{ id: 5, invoiceNumber: 'INV5' }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getInvoice(5);
    expect(r.id).toBe(5);
    expect(r.invoiceNumber).toBe('INV5');
  });

  it('falls back to raw.data when data array is empty (decodes the empty array)', async () => {
    const { fetchImpl } = mockFetch({ body: { data: [], id: 7, invoiceNumber: 'INV7' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getInvoice(7);
    // raw.data is [] (empty array), so decodeInvoice([]) gives id=0
    expect(r.id).toBe(0);
    expect(r.invoiceNumber).toBeNull();
  });

  it('falls back to raw object when no data array', async () => {
    const { fetchImpl } = mockFetch({ body: { id: 9, invoiceNumber: 'INV9' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getInvoice(9);
    expect(r.id).toBe(9);
    expect(r.invoiceNumber).toBe('INV9');
  });
});
