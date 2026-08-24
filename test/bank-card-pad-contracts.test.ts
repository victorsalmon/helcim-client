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
  assertBodyPathAbsent,
  bodyOf,
  BASE,
} from './helpers.js';

beforeEach(() => vi.restoreAllMocks());

// ─── getCardTransaction ──────────────────────────────────────────────────────

describe('getCardTransaction contract', () => {
  it('GETs /card-transactions/{id}', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transactionId: 42 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getCardTransaction(42);
    assertMethod(calls[0], 'GET');
    assertPath(calls[0], '/card-transactions/42');
  });

  it('rejects id=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getCardTransaction(0)).rejects.toThrow(/positive integer/);
  });

  it('rejects negative id', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getCardTransaction(-1)).rejects.toThrow(/positive integer/);
  });

  it('rejects non-integer id', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getCardTransaction(1.5)).rejects.toThrow(/positive integer/);
  });

  it('rejects NaN id', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getCardTransaction(NaN)).rejects.toThrow(/positive integer/);
  });

  it('rejects Infinity id', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getCardTransaction(Infinity)).rejects.toThrow(/positive integer/);
  });

  it('decodes response fields', async () => {
    const { fetchImpl } = mockFetch({
      body: { transactionId: 42, status: 'APPROVED', amount: 100.5, currency: 'CAD', type: 'purchase' },
    });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getCardTransaction(42);
    expect(r.transactionId).toBe(42);
    expect(r.status).toBe('APPROVED');
    expect(r.amount).toBe(100.5);
    expect(r.currency).toBe('CAD');
    expect(r.type).toBe('purchase');
  });
});

// ─── getCardTransactions ─────────────────────────────────────────────────────

describe('getCardTransactions contract', () => {
  it('GETs /card-transactions with all query params', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getCardTransactions({ customerCode: 'C1', dateFrom: '2024-01-01', dateTo: '2024-12-31', page: 1, limit: 10 });
    assertMethod(calls[0], 'GET');
    assertPath(calls[0], '/card-transactions');
    assertQuery(calls[0], 'customerCode', 'C1');
    assertQuery(calls[0], 'dateFrom', '2024-01-01');
    assertQuery(calls[0], 'dateTo', '2024-12-31');
    assertQuery(calls[0], 'page', '1');
    assertQuery(calls[0], 'limit', '10');
  });

  it('omits undefined/empty query params', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getCardTransactions({ customerCode: '', dateFrom: undefined, dateTo: undefined });
    assertQueryAbsent(calls[0], 'customerCode');
    assertQueryAbsent(calls[0], 'dateFrom');
    assertQueryAbsent(calls[0], 'dateTo');
  });

  it('unwraps data array', async () => {
    const { fetchImpl } = mockFetch({ body: { data: [{ transactionId: 1 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getCardTransactions({});
    expect(r).toHaveLength(1);
    expect(r[0].transactionId).toBe(1);
  });

  it('unwraps cardTransactions (alternate key)', async () => {
    const { fetchImpl } = mockFetch({ body: { cardTransactions: [{ transactionId: 2 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getCardTransactions({});
    expect(r).toHaveLength(1);
    expect(r[0].transactionId).toBe(2);
  });

  it('unwraps transactions (alternate key)', async () => {
    const { fetchImpl } = mockFetch({ body: { transactions: [{ transactionId: 3 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getCardTransactions({});
    expect(r).toHaveLength(1);
    expect(r[0].transactionId).toBe(3);
  });

  it('handles bare array response', async () => {
    const { fetchImpl } = mockFetch({ body: [{ transactionId: 4 }] });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getCardTransactions({});
    expect(r).toHaveLength(1);
    expect(r[0].transactionId).toBe(4);
  });

  it('returns empty array when no data', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getCardTransactions({});
    expect(r).toHaveLength(0);
  });
});

// ─── createBankAccount ───────────────────────────────────────────────────────

describe('createBankAccount contract', () => {
  const baseInput = {
    accountCorporate: 1 as const,
    accountType: 1 as const,
    bankAccountNumber: '123456789',
    city: 'Calgary',
    countryAlpha2: 'CA',
    provinceAlpha2: 'AB',
    postalCode: 'T2P5E9',
    streetAddress: '440 2 Ave SW',
  };

  it('POSTs to /customers/{id}/bank-accounts with required fields', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: { id: 1, message: 'ok' } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createBankAccount(123, baseInput);
    assertMethod(calls[0], 'POST');
    assertPath(calls[0], '/customers/123/bank-accounts');
    assertBodyField(calls[0], 'accountCorporate', 1);
    assertBodyField(calls[0], 'accountType', 1);
    assertBodyField(calls[0], 'bankAccountNumber', '123456789');
    assertBodyField(calls[0], 'city', 'Calgary');
    assertBodyField(calls[0], 'countryAlpha2', 'CA');
    assertBodyField(calls[0], 'provinceAlpha2', 'AB');
    assertBodyField(calls[0], 'postalCode', 'T2P5E9');
    assertBodyField(calls[0], 'streetAddress', '440 2 Ave SW');
  });

  it('includes all optional fields when provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: { id: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createBankAccount(123, {
      ...baseInput,
      bankFinancialNumber: '003',
      bankTransitNumber: '23456',
      bankRoutingNumber: '123456789',
      firstName: 'John',
      lastName: 'Doe',
      companyName: 'Acme',
    });
    assertBodyField(calls[0], 'bankFinancialNumber', '003');
    assertBodyField(calls[0], 'bankTransitNumber', '23456');
    assertBodyField(calls[0], 'bankRoutingNumber', '123456789');
    assertBodyField(calls[0], 'firstName', 'John');
    assertBodyField(calls[0], 'lastName', 'Doe');
    assertBodyField(calls[0], 'companyName', 'Acme');
  });

  it('omits all optional fields when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: { id: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createBankAccount(123, baseInput);
    assertBodyFieldAbsent(calls[0], 'bankFinancialNumber');
    assertBodyFieldAbsent(calls[0], 'bankTransitNumber');
    assertBodyFieldAbsent(calls[0], 'bankRoutingNumber');
    assertBodyFieldAbsent(calls[0], 'firstName');
    assertBodyFieldAbsent(calls[0], 'lastName');
    assertBodyFieldAbsent(calls[0], 'companyName');
  });

  it('rejects customerId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createBankAccount(0, baseInput)).rejects.toThrow(/positive integer/);
  });

  it('rejects negative customerId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createBankAccount(-1, baseInput)).rejects.toThrow(/positive integer/);
  });

  it('rejects non-integer customerId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createBankAccount(1.5, baseInput)).rejects.toThrow(/positive integer/);
  });

  it('rejects empty bankAccountNumber', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createBankAccount(1, { ...baseInput, bankAccountNumber: '' })).rejects.toThrow(/bankAccountNumber/);
  });

  it('rejects whitespace-only bankAccountNumber', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createBankAccount(1, { ...baseInput, bankAccountNumber: '  ' })).rejects.toThrow(/bankAccountNumber/);
  });

  it('rejects empty countryAlpha2', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createBankAccount(1, { ...baseInput, countryAlpha2: '' })).rejects.toThrow(/countryAlpha2/);
  });

  it('rejects empty provinceAlpha2', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createBankAccount(1, { ...baseInput, provinceAlpha2: '' })).rejects.toThrow(/provinceAlpha2/);
  });

  it('rejects empty city', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createBankAccount(1, { ...baseInput, city: '' })).rejects.toThrow(/city/);
  });

  it('rejects empty postalCode', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createBankAccount(1, { ...baseInput, postalCode: '' })).rejects.toThrow(/postalCode/);
  });

  it('rejects empty streetAddress', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createBankAccount(1, { ...baseInput, streetAddress: '' })).rejects.toThrow(/streetAddress/);
  });

  it('unwraps data object from response', async () => {
    const { fetchImpl } = mockFetch({ body: { data: { id: 456, message: 'ok' } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.createBankAccount(1, baseInput);
    expect(r.id).toBe(456);
    expect(r.message).toBe('ok');
  });

  it('falls back to raw object when no data wrapper', async () => {
    const { fetchImpl } = mockFetch({ body: { id: 789, message: 'created' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.createBankAccount(1, baseInput);
    expect(r.id).toBe(789);
    expect(r.message).toBe('created');
  });
});

// ─── getCustomerBankAccounts ─────────────────────────────────────────────────

describe('getCustomerBankAccounts contract', () => {
  it('GETs /customers/{id}/bank-accounts', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getCustomerBankAccounts(123);
    assertMethod(calls[0], 'GET');
    assertPath(calls[0], '/customers/123/bank-accounts');
  });

  it('rejects customerId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getCustomerBankAccounts(0)).rejects.toThrow(/positive integer/);
  });

  it('rejects negative customerId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getCustomerBankAccounts(-1)).rejects.toThrow(/positive integer/);
  });

  it('rejects non-integer customerId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getCustomerBankAccounts(1.5)).rejects.toThrow(/positive integer/);
  });

  it('unwraps data array', async () => {
    const { fetchImpl } = mockFetch({ body: { data: [{ id: 1, bankToken: 't' }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getCustomerBankAccounts(1);
    expect(r).toHaveLength(1);
    expect(r[0].bankToken).toBe('t');
  });

  it('unwraps bankAccounts (alternate key)', async () => {
    const { fetchImpl } = mockFetch({ body: { bankAccounts: [{ id: 2, bankToken: 't2' }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getCustomerBankAccounts(1);
    expect(r).toHaveLength(1);
    expect(r[0].bankToken).toBe('t2');
  });

  it('unwraps bank_accounts (snake_case key)', async () => {
    const { fetchImpl } = mockFetch({ body: { bank_accounts: [{ id: 3, bankToken: 't3' }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getCustomerBankAccounts(1);
    expect(r).toHaveLength(1);
    expect(r[0].bankToken).toBe('t3');
  });

  it('handles bare array response', async () => {
    const { fetchImpl } = mockFetch({ body: [{ id: 4, bankToken: 't4' }] });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getCustomerBankAccounts(1);
    expect(r).toHaveLength(1);
    expect(r[0].bankToken).toBe('t4');
  });

  it('returns empty array when response has no bank account fields', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getCustomerBankAccounts(1);
    expect(r).toHaveLength(0);
  });
});

// ─── getBankAccount ──────────────────────────────────────────────────────────

describe('getBankAccount contract', () => {
  it('GETs /customers/{cid}/bank-accounts/{bid}', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: { id: 5 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getBankAccount(10, 5);
    assertMethod(calls[0], 'GET');
    assertPath(calls[0], '/customers/10/bank-accounts/5');
  });

  it('rejects customerId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getBankAccount(0, 5)).rejects.toThrow(/positive integer/);
  });

  it('rejects bankAccountId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getBankAccount(10, 0)).rejects.toThrow(/positive integer/);
  });

  it('rejects negative bankAccountId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getBankAccount(10, -1)).rejects.toThrow(/positive integer/);
  });

  it('rejects non-integer bankAccountId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getBankAccount(10, 1.5)).rejects.toThrow(/positive integer/);
  });

  it('unwraps data object', async () => {
    const { fetchImpl } = mockFetch({ body: { data: { id: 5, bankToken: 't' } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getBankAccount(10, 5);
    expect(r.id).toBe(5);
    expect(r.bankToken).toBe('t');
  });

  it('falls back to raw object when no data wrapper', async () => {
    const { fetchImpl } = mockFetch({ body: { id: 7, bankToken: 't7' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getBankAccount(10, 7);
    expect(r.id).toBe(7);
    expect(r.bankToken).toBe('t7');
  });
});

// ─── setBankAccountDefault ───────────────────────────────────────────────────

describe('setBankAccountDefault contract', () => {
  it('PATCHes /customers/{cid}/bank-accounts/{bid}/default and returns true', async () => {
    const { fetchImpl, calls } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.setBankAccountDefault(10, 5);
    expect(r).toBe(true);
    assertMethod(calls[0], 'PATCH');
    assertPath(calls[0], '/customers/10/bank-accounts/5/default');
  });

  it('rejects customerId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.setBankAccountDefault(0, 5)).rejects.toThrow(/positive integer/);
  });

  it('rejects bankAccountId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.setBankAccountDefault(10, 0)).rejects.toThrow(/positive integer/);
  });

  it('rejects negative bankAccountId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.setBankAccountDefault(10, -1)).rejects.toThrow(/positive integer/);
  });

  it('rejects non-integer bankAccountId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.setBankAccountDefault(10, 1.5)).rejects.toThrow(/positive integer/);
  });
});

// ─── requestNewBankAccount ───────────────────────────────────────────────────

describe('requestNewBankAccount contract', () => {
  it('POSTs to /customers/{id}/bank-accounts/request', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { message: 'ok' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.requestNewBankAccount(10);
    assertMethod(calls[0], 'POST');
    assertPath(calls[0], '/customers/10/bank-accounts/request');
  });

  it('rejects customerId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.requestNewBankAccount(0)).rejects.toThrow(/positive integer/);
  });

  it('rejects negative customerId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.requestNewBankAccount(-1)).rejects.toThrow(/positive integer/);
  });

  it('rejects non-integer customerId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.requestNewBankAccount(1.5)).rejects.toThrow(/positive integer/);
  });

  it('returns message from response', async () => {
    const { fetchImpl } = mockFetch({ body: { message: 'email sent' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.requestNewBankAccount(10);
    expect(r.message).toBe('email sent');
  });

  it('returns empty message when not in response', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.requestNewBankAccount(10);
    expect(r.message).toBe('');
  });

  it('reads Message (PascalCase) from response', async () => {
    const { fetchImpl } = mockFetch({ body: { Message: 'pascal-msg' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.requestNewBankAccount(10);
    expect(r.message).toBe('pascal-msg');
  });
});

// ─── getPADs ─────────────────────────────────────────────────────────────────

describe('getPADs contract', () => {
  it('GETs /customers/{id}/pads', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getPADs(123);
    assertMethod(calls[0], 'GET');
    assertPath(calls[0], '/customers/123/pads');
  });

  it('rejects customerId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getPADs(0)).rejects.toThrow(/positive integer/);
  });

  it('rejects negative customerId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getPADs(-1)).rejects.toThrow(/positive integer/);
  });

  it('rejects non-integer customerId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getPADs(1.5)).rejects.toThrow(/positive integer/);
  });

  it('unwraps data array', async () => {
    const { fetchImpl } = mockFetch({ body: { data: [{ id: 1, accepted: 1 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getPADs(1);
    expect(r).toHaveLength(1);
    expect(r[0].accepted).toBe(true);
  });

  it('unwraps pads (alternate key)', async () => {
    const { fetchImpl } = mockFetch({ body: { pads: [{ id: 2, accepted: 0 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getPADs(1);
    expect(r).toHaveLength(1);
    expect(r[0].accepted).toBe(false);
  });

  it('unwraps Pads (PascalCase)', async () => {
    const { fetchImpl } = mockFetch({ body: { Pads: [{ id: 3, accepted: 1 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getPADs(1);
    expect(r).toHaveLength(1);
    expect(r[0].accepted).toBe(true);
  });

  it('handles bare array response', async () => {
    const { fetchImpl } = mockFetch({ body: [{ id: 4, accepted: 1 }] });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getPADs(1);
    expect(r).toHaveLength(1);
  });

  it('returns empty array when response has no PAD fields', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getPADs(1);
    expect(r).toHaveLength(0);
  });
});

// ─── getPAD ──────────────────────────────────────────────────────────────────

describe('getPAD contract', () => {
  it('GETs /customers/{cid}/pads/{pid}', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: { id: 5 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getPAD(123, 5);
    assertMethod(calls[0], 'GET');
    assertPath(calls[0], '/customers/123/pads/5');
  });

  it('rejects customerId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getPAD(0, 5)).rejects.toThrow(/positive integer/);
  });

  it('rejects padId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getPAD(123, 0)).rejects.toThrow(/positive integer/);
  });

  it('rejects negative padId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getPAD(123, -1)).rejects.toThrow(/positive integer/);
  });

  it('rejects non-integer padId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getPAD(123, 1.5)).rejects.toThrow(/positive integer/);
  });

  it('unwraps data object', async () => {
    const { fetchImpl } = mockFetch({ body: { data: { id: 5, accepted: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getPAD(123, 5);
    expect(r.id).toBe(5);
    expect(r.accepted).toBe(true);
  });

  it('falls back to raw object', async () => {
    const { fetchImpl } = mockFetch({ body: { id: 7, accepted: 0 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getPAD(123, 7);
    expect(r.id).toBe(7);
    expect(r.accepted).toBe(false);
  });
});

// ─── updatePAD ───────────────────────────────────────────────────────────────

describe('updatePAD contract', () => {
  it('PUTs /customers/{cid}/pads/{pid} with accepted flag', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: { id: 5, accepted: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.updatePAD(123, 5, { accepted: true });
    assertMethod(calls[0], 'PUT');
    assertPath(calls[0], '/customers/123/pads/5');
    assertBodyField(calls[0], 'accepted', 1);
  });

  it('serializes accepted=false to 0', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: { id: 5 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.updatePAD(123, 5, { accepted: false });
    assertBodyField(calls[0], 'accepted', 0);
  });

  it('includes status when provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: { id: 5 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.updatePAD(123, 5, { status: 2 });
    assertBodyField(calls[0], 'status', 2);
  });

  it('omits accepted when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: { id: 5 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.updatePAD(123, 5, { status: 1 });
    assertBodyFieldAbsent(calls[0], 'accepted');
  });

  it('omits status when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: { id: 5 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.updatePAD(123, 5, { accepted: true });
    assertBodyFieldAbsent(calls[0], 'status');
  });

  it('rejects customerId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.updatePAD(0, 5, {})).rejects.toThrow(/positive integer/);
  });

  it('rejects padId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.updatePAD(123, 0, {})).rejects.toThrow(/positive integer/);
  });

  it('rejects negative padId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.updatePAD(123, -1, {})).rejects.toThrow(/positive integer/);
  });

  it('rejects non-integer padId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.updatePAD(123, 1.5, {})).rejects.toThrow(/positive integer/);
  });

  it('unwraps data object', async () => {
    const { fetchImpl } = mockFetch({ body: { data: { id: 5, accepted: 1, status: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.updatePAD(123, 5, { accepted: true, status: 1 });
    expect(r.id).toBe(5);
    expect(r.accepted).toBe(true);
  });

  it('falls back to raw object', async () => {
    const { fetchImpl } = mockFetch({ body: { id: 7, accepted: 0 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.updatePAD(123, 7, { accepted: false });
    expect(r.id).toBe(7);
    expect(r.accepted).toBe(false);
  });
});
