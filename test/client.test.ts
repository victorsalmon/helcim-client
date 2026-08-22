import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fc, test as fcTest } from '@fast-check/vitest';
import {
  createHelcimClient,
  createHelcimConfigFromEnv,
  generateIdempotencyKey,
  type HelcimConfig,
} from '../src/index.js';

const TEST_CONFIG: HelcimConfig = {
  baseUrl: 'https://api.helcim.test/v2',
  apiToken: 'test-token-abc',
};

type FetchCall = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | undefined;
};

function mockFetch(response: {
  status?: number;
  body?: unknown;
  text?: string;
}): { fetchImpl: typeof fetch; calls: FetchCall[] } {
  const calls: FetchCall[] = [];
  const fetchImpl = vi.fn(async (url: string, init: any) => {
    calls.push({
      url,
      method: init?.method ?? 'GET',
      headers: init?.headers ?? {},
      body: init?.body,
    });
    const status = response.status ?? 200;
    const text =
      response.text ??
      (response.body !== undefined ? JSON.stringify(response.body) : '');
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => text,
    } as Response;
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('client — connection test', () => {
  it('returns true on a 200 response', async () => {
    const { fetchImpl, calls } = mockFetch({ status: 200, body: {} });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    expect(await client.connectionTest()).toBe(true);
    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toBe('https://api.helcim.test/v2/connection-test');
  });

  it('returns false on a non-200 response', async () => {
    const { fetchImpl } = mockFetch({ status: 401, body: { errors: ['Unauthorized'] } });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    expect(await client.connectionTest()).toBe(false);
  });
});

describe('client — auth headers', () => {
  it('sends the api-token header on every request', async () => {
    const { fetchImpl, calls } = mockFetch({ body: {} });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.connectionTest();
    expect(calls[0].headers['api-token']).toBe('test-token-abc');
    expect(calls[0].headers['accept']).toBe('application/json');
    expect(calls[0].headers['content-type']).toBe('application/json');
  });
});

describe('client — createCustomer', () => {
  it('posts to /customers with the customer body', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { id: 1, customerCode: 'CST100', contactName: 'Jane' },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const result = await client.createCustomer({
      contactName: 'Jane Doe',
      businessName: 'Acme',
      billingAddress: {
        name: 'Jane Doe',
        street1: '1 St',
        postalCode: 'H0H0H0',
        country: 'CAN',
        province: 'ON',
      },
    });
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('https://api.helcim.test/v2/customers');
    const body = JSON.parse(calls[0].body!);
    expect(body.contactName).toBe('Jane Doe');
    expect(body.businessName).toBe('Acme');
    expect(body.billingAddress.name).toBe('Jane Doe');
    expect(body.billingAddress.country).toBe('CAN');
    expect(result.customerCode).toBe('CST100');
    expect(result.contactName).toBe('Jane');
    expect(result.id).toBe(1);
  });

  it('throws if neither contactName nor businessName is provided', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(client.createCustomer({})).rejects.toThrow(/contactName or businessName/);
  });

  it('omits empty optional address fields from the body', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { id: 1, customerCode: 'C' } });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.createCustomer({
      contactName: 'Jane',
      billingAddress: { name: 'Jane', street1: '1 St', postalCode: 'H0H0H0' },
    });
    const body = JSON.parse(calls[0].body!);
    expect(body.billingAddress.street2).toBeUndefined();
    expect(body.billingAddress.city).toBeUndefined();
  });
});

describe('client — getCustomer / getCustomers', () => {
  it('builds the path with the customer id', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { id: 5, customerCode: 'CST5' } });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.getCustomer(5);
    expect(calls[0].url).toBe('https://api.helcim.test/v2/customers/5');
  });

  it('rejects a non-positive customer id', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(client.getCustomer(0)).rejects.toThrow(/positive integer/);
    await expect(client.getCustomer(-1)).rejects.toThrow(/positive integer/);
  });

  it('passes query params for list endpoint', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [] } });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.getCustomers({ page: 2, limit: 10 });
    expect(calls[0].url).toContain('page=2');
    expect(calls[0].url).toContain('limit=10');
  });
});

describe('client — getCustomerCards / setCustomerCardDefault', () => {
  it('fetches cards for a customer', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: [{ id: 1, cardF6L4: '5454545454', cardToken: 'tok' }],
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const cards = await client.getCustomerCards(7);
    expect(calls[0].url).toBe('https://api.helcim.test/v2/customers/7/cards');
    expect(cards[0].cardToken).toBe('tok');
    expect(cards[0].cardF6L4).toBe('5454545454');
  });

  it('passes cardToken query param when provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: [] });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.getCustomerCards(7, 'tok-abc');
    expect(calls[0].url).toContain('cardToken=tok-abc');
  });

  it('patches the default card endpoint', async () => {
    const { fetchImpl, calls } = mockFetch({ body: [] });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.setCustomerCardDefault(7, 99);
    expect(calls[0].method).toBe('PATCH');
    expect(calls[0].url).toBe('https://api.helcim.test/v2/customers/7/cards/99/default');
  });
});

describe('client — initializeHelcimPay', () => {
  it('posts to /helcim-pay/initialize and returns tokens', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { checkoutToken: 'co-abc', secretToken: 'sec-xyz' },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const result = await client.initializeHelcimPay({
      paymentType: 'verify',
      currency: 'CAD',
      customerCode: 'CST100',
    });
    expect(calls[0].url).toBe('https://api.helcim.test/v2/helcim-pay/initialize');
    const body = JSON.parse(calls[0].body!);
    expect(body.paymentType).toBe('verify');
    expect(body.currency).toBe('CAD');
    expect(body.customerCode).toBe('CST100');
    expect(result.checkoutToken).toBe('co-abc');
    expect(result.secretToken).toBe('sec-xyz');
  });

  it('throws if paymentType is missing', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(
      client.initializeHelcimPay({ paymentType: '' as any })
    ).rejects.toThrow(/paymentType/);
  });

  it('throws if the response is missing tokens', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(
      client.initializeHelcimPay({ paymentType: 'verify' })
    ).rejects.toThrow(/checkoutToken and secretToken/);
  });

  it('rejects a non-positive amount', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(
      client.initializeHelcimPay({ paymentType: 'purchase', amount: 0 })
    ).rejects.toThrow(/positive finite amount/);
    await expect(
      client.initializeHelcimPay({ paymentType: 'purchase', amount: -5 })
    ).rejects.toThrow(/positive finite amount/);
  });

  it('serializes customerRequest with contactName', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { checkoutToken: 'c', secretToken: 's' },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.initializeHelcimPay({
      paymentType: 'verify',
      customerRequest: { contactName: 'Jane', businessName: 'Acme' },
    });
    const body = JSON.parse(calls[0].body!);
    expect(body.customerRequest.contactName).toBe('Jane');
    expect(body.customerRequest.businessName).toBe('Acme');
  });

  it('throws if customerRequest is missing contactName', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(
      client.initializeHelcimPay({
        paymentType: 'verify',
        customerRequest: {} as any,
      })
    ).rejects.toThrow(/contactName/);
  });
});

describe('client — createPaymentPlan', () => {
  it('wraps the plan in a paymentPlans array', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { data: [{ id: 1, name: 'Pro', recurringAmount: 1 }] },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const result = await client.createPaymentPlan({
      name: 'Pro',
      type: 'subscription',
      currency: 'CAD',
      recurringAmount: 1,
      billingPeriod: 'monthly',
      dateBilling: 'Sign-up',
      termType: 'forever',
    });
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('https://api.helcim.test/v2/payment-plans');
    const body = JSON.parse(calls[0].body!);
    expect(body.paymentPlans).toHaveLength(1);
    expect(body.paymentPlans[0].name).toBe('Pro');
    expect(result.id).toBe(1);
    expect(result.name).toBe('Pro');
  });

  it('throws on missing required fields', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(
      client.createPaymentPlan({
        name: '',
        type: 'subscription',
        currency: 'CAD',
        recurringAmount: 1,
        billingPeriod: 'monthly',
        dateBilling: 'Sign-up',
        termType: 'forever',
      })
    ).rejects.toThrow(/name/);
  });

  it('throws on non-positive recurringAmount', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(
      client.createPaymentPlan({
        name: 'X',
        type: 'subscription',
        currency: 'CAD',
        recurringAmount: 0,
        billingPeriod: 'monthly',
        dateBilling: 'Sign-up',
        termType: 'forever',
      })
    ).rejects.toThrow(/recurringAmount/);
  });
});

describe('client — createSubscription', () => {
  it('sends an idempotency-key header and wraps in subscriptions array', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { data: [{ id: 10, paymentPlanId: 5, customerCode: 'CST100' }] },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const result = await client.createSubscription(
      { paymentPlanId: 5, customerCode: 'CST100' },
      'abc123def456ghi789jkl012mno' // 25 chars
    );
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('https://api.helcim.test/v2/subscriptions');
    expect(calls[0].headers['idempotency-key']).toBe('abc123def456ghi789jkl012mno');
    const body = JSON.parse(calls[0].body!);
    expect(body.subscriptions).toHaveLength(1);
    expect(body.subscriptions[0].paymentPlanId).toBe(5);
    expect(result.id).toBe(10);
  });

  it('auto-generates a 25-char idempotency key when none is provided', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { data: [{ id: 10 }] },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.createSubscription({ paymentPlanId: 5, customerCode: 'CST100' });
    expect(calls[0].headers['idempotency-key']).toHaveLength(25);
  });

  it('throws on non-positive paymentPlanId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(
      client.createSubscription({ paymentPlanId: 0, customerCode: 'C' })
    ).rejects.toThrow(/paymentPlanId/);
  });

  it('throws on empty customerCode', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(
      client.createSubscription({ paymentPlanId: 5, customerCode: '' })
    ).rejects.toThrow(/customerCode/);
  });
});

describe('client — getSubscription / deleteSubscription / processSubscriptionPayment', () => {
  it('builds the subscription path', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 9 }] } });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.getSubscription(9);
    expect(calls[0].url).toBe('https://api.helcim.test/v2/subscriptions/9');
  });

  it('passes includeSubObjects query param', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 9 }] } });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.getSubscription(9, true);
    expect(calls[0].url).toContain('includeSubObjects=true');
  });

  it('deletes a subscription', async () => {
    const { fetchImpl, calls } = mockFetch({ status: 200, body: {} });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.deleteSubscription(9);
    expect(calls[0].method).toBe('DELETE');
    expect(calls[0].url).toBe('https://api.helcim.test/v2/subscriptions/9');
  });

  it('processes a subscription payment with idempotency', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 9 }] } });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.processSubscriptionPayment(9, 3);
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('https://api.helcim.test/v2/procedures/process-payment');
    expect(calls[0].headers['idempotency-key']).toHaveLength(25);
    const body = JSON.parse(calls[0].body!);
    expect(body.subscriptionId).toBe(9);
    expect(body.paymentNumber).toBe(3);
  });
});

describe('client — getCardTransaction', () => {
  it('builds the path and decodes the response', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { transactionId: 42, status: 'APPROVED', amount: 1.0, currency: 'CAD' },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const result = await client.getCardTransaction(42);
    expect(calls[0].url).toBe('https://api.helcim.test/v2/card-transactions/42');
    expect(result.transactionId).toBe(42);
    expect(result.status).toBe('APPROVED');
    expect(result.amount).toBe(1.0);
  });
});

describe('client — error handling', () => {
  it('throws with the first error message on a non-2xx response', async () => {
    const { fetchImpl } = mockFetch({
      status: 400,
      body: { errors: ['Amount is required'] },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(
      client.createCustomer({ contactName: 'X' })
    ).rejects.toThrow(/Amount is required/);
  });

  it('falls back to a status-code message when errors array is empty', async () => {
    const { fetchImpl } = mockFetch({ status: 500, body: {} });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(
      client.createCustomer({ contactName: 'X' })
    ).rejects.toThrow(/HTTP 500/);
  });

  it('does not throw on a non-JSON error body', async () => {
    const { fetchImpl } = mockFetch({ status: 502, text: '<html>Bad Gateway</html>' });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(
      client.createCustomer({ contactName: 'X' })
    ).rejects.toThrow(/HTTP 502/);
  });

  it('falls back to a status-code message when errors[0] is not a string', async () => {
    const { fetchImpl } = mockFetch({ status: 400, body: { errors: [{ code: 'X' }] } });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(
      client.createCustomer({ contactName: 'X' })
    ).rejects.toThrow(/HTTP 400/);
  });
});

// ─── request() helper branch coverage ───────────────────────────────────────

describe('client — request helper branches', () => {
  it('omits the idempotency-key header on non-idempotent GET requests', async () => {
    const { fetchImpl, calls } = mockFetch({ body: {} });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.connectionTest();
    expect(calls[0].headers['idempotency-key']).toBeUndefined();
  });

  it('filters out null and empty-string query params from the URL', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [] } });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.getCustomers({ page: 1, limit: undefined, customerCode: '' });
    const url = new URL(calls[0].url);
    expect(url.searchParams.get('page')).toBe('1');
    expect(url.searchParams.has('limit')).toBe(false);
    expect(url.searchParams.has('customerCode')).toBe(false);
  });

  it('treats a bare-array JSON response as wrapped { data: [...] }', async () => {
    const { fetchImpl } = mockFetch({ body: [{ id: 1, customerCode: 'C1' }] });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const results = await client.getCustomers({});
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(1);
  });

  it('treats a non-object JSON response (bare primitive) as an empty body', async () => {
    const { fetchImpl } = mockFetch({ body: 12345 });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const result = await client.getCustomer(1);
    expect(result.id).toBe(0);
    expect(result.customerCode).toBe('');
  });
});

// ─── Bank accounts ──────────────────────────────────────────────────────────

describe('client — bank accounts', () => {
  it('createBankAccount sends POST with Canadian bank details', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { data: { id: 45367, message: 'Successfully created new bank account' } },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const result = await client.createBankAccount(123, {
      accountCorporate: 1,
      accountType: 1,
      bankAccountNumber: '123456789',
      bankFinancialNumber: '003',
      bankTransitNumber: '23456',
      city: 'Calgary',
      countryAlpha2: 'CA',
      provinceAlpha2: 'AB',
      postalCode: 'T2P5E9',
      streetAddress: '440 2 Ave SW',
      firstName: 'John',
      lastName: 'Doe',
    });
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('https://api.helcim.test/v2/customers/123/bank-accounts');
    const body = JSON.parse(calls[0].body!);
    expect(body.bankFinancialNumber).toBe('003');
    expect(body.bankTransitNumber).toBe('23456');
    expect(body.bankRoutingNumber).toBeUndefined();
    expect(result.id).toBe(45367);
  });

  it('createBankAccount sends POST with US bank details', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { data: { id: 99, message: 'ok' } },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.createBankAccount(50, {
      accountCorporate: 2,
      accountType: 2,
      bankAccountNumber: '987654321',
      bankRoutingNumber: '123456789',
      city: 'New York',
      countryAlpha2: 'US',
      provinceAlpha2: 'NY',
      postalCode: '10001',
      streetAddress: '123 Main St',
      companyName: 'Acme Inc',
    });
    const body = JSON.parse(calls[0].body!);
    expect(body.bankRoutingNumber).toBe('123456789');
    expect(body.bankFinancialNumber).toBeUndefined();
    expect(body.bankTransitNumber).toBeUndefined();
    expect(body.companyName).toBe('Acme Inc');
  });

  it('createBankAccount rejects invalid customerId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(client.createBankAccount(0, {
      accountCorporate: 1, accountType: 1, bankAccountNumber: '123',
      city: 'C', countryAlpha2: 'CA', provinceAlpha2: 'AB',
      postalCode: 'H0H0H0', streetAddress: '1 St',
    })).rejects.toThrow();
  });

  it('getCustomerBankAccounts returns decoded bank accounts', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { data: [{ id: 1, bankToken: 'tok', accountType: 'CHECKING', verified: 1, ready: 1 }] },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const accounts = await client.getCustomerBankAccounts(123);
    expect(calls[0].url).toBe('https://api.helcim.test/v2/customers/123/bank-accounts');
    expect(accounts.length).toBe(1);
    expect(accounts[0].bankToken).toBe('tok');
    expect(accounts[0].verified).toBe(true);
    expect(accounts[0].ready).toBe(true);
  });

  it('getBankAccount returns a single decoded bank account', async () => {
    const { fetchImpl } = mockFetch({
      body: { data: { id: 5, bankToken: 'tok5', accountType: 'SAVINGS', verified: 0 } },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const acct = await client.getBankAccount(10, 5);
    expect(acct.id).toBe(5);
    expect(acct.verified).toBe(false);
  });

  it('setBankAccountDefault sends PATCH', async () => {
    const { fetchImpl, calls } = mockFetch({ body: {} });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.setBankAccountDefault(10, 5);
    expect(calls[0].method).toBe('PATCH');
    expect(calls[0].url).toBe('https://api.helcim.test/v2/customers/10/bank-accounts/5/default');
  });

  it('requestNewBankAccount sends POST and returns message', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { message: 'A bank authorization email was emailed to test@test.com.' },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const result = await client.requestNewBankAccount(10);
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('https://api.helcim.test/v2/customers/10/bank-accounts/request');
    expect(result.message).toContain('bank authorization email');
  });
});

// ─── PAD agreements ─────────────────────────────────────────────────────────

describe('client — PAD agreements', () => {
  it('getPADs returns decoded PAD agreements', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { data: [{ id: 66051, accepted: 1, bankAccountId: 53443, status: 1 }] },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const pads = await client.getPADs(123);
    expect(calls[0].url).toBe('https://api.helcim.test/v2/customers/123/pads');
    expect(pads.length).toBe(1);
    expect(pads[0].accepted).toBe(true);
    expect(pads[0].status).toBe(1);
  });

  it('getPAD returns a single PAD agreement', async () => {
    const { fetchImpl } = mockFetch({
      body: { data: { id: 66051, accepted: 0, status: 2 } },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const pad = await client.getPAD(123, 66051);
    expect(pad.id).toBe(66051);
    expect(pad.accepted).toBe(false);
  });

  it('updatePAD sends PUT with accepted flag', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { data: { id: 66051, accepted: 1, status: 1 } },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.updatePAD(123, 66051, { accepted: true, status: 1 });
    expect(calls[0].method).toBe('PUT');
    const body = JSON.parse(calls[0].body!);
    expect(body.accepted).toBe(1);
    expect(body.status).toBe(1);
  });
});

// ─── ACH transactions ───────────────────────────────────────────────────────

describe('client — ACH transactions', () => {
  it('processACHWithdraw sends PUT with idempotency key', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { transaction: { id: 109361, statusAuth: 5, amount: 10, currency: 1 } },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const txn = await client.processACHWithdraw({
      bankAccountId: 1182342,
      customerId: 389829,
      amount: 79.99,
      currencyId: 1,
    });
    expect(calls[0].method).toBe('PUT');
    expect(calls[0].url).toBe('https://api.helcim.test/v2/ach/withdraw');
    expect(calls[0].headers['idempotency-key']).toBeDefined();
    const body = JSON.parse(calls[0].body!);
    expect(body.bankAccountId).toBe(1182342);
    expect(body.currencyId).toBe(1);
    expect(txn.id).toBe(109361);
    expect(txn.statusAuth).toBe(5);
  });

  it('processACHWithdraw rejects invalid currencyId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(client.processACHWithdraw({
      bankAccountId: 1, customerId: 1, amount: 10, currencyId: 3 as any,
    })).rejects.toThrow();
  });

  it('getACHTransaction returns decoded transaction', async () => {
    const { fetchImpl } = mockFetch({
      body: { transaction: { id: 109361, statusAuth: 1, statusClearing: 0 } },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const txn = await client.getACHTransaction(109361);
    expect(txn.id).toBe(109361);
    expect(txn.statusAuth).toBe(1);
  });

  it('getACHTransactions returns array', async () => {
    const { fetchImpl } = mockFetch({
      body: { data: [{ id: 1 }, { id: 2 }] },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const txns = await client.getACHTransactions({ customerId: 123 });
    expect(txns.length).toBe(2);
  });

  it('refundACH sends POST with idempotency key', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { transaction: { id: 109362, statusAuth: 1 } },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.refundACH(109361, 50);
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('https://api.helcim.test/v2/ach/refund/109361');
    expect(calls[0].headers['idempotency-key']).toBeDefined();
  });

  it('voidACH sends POST with idempotency key', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { transaction: { id: 109361, statusAuth: 4 } },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.voidACH(109361);
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('https://api.helcim.test/v2/ach/void/109361');
  });

  it('cancelACH sends POST with idempotency key', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { transaction: { id: 109361, statusAuth: 4 } },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.cancelACH(109361);
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('https://api.helcim.test/v2/ach/cancel/109361');
  });
});

// ─── Payment API (one-time card) ────────────────────────────────────────────

describe('client — Payment API', () => {
  it('processPurchase sends POST with card token', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { transaction: { transactionId: 30537777, status: 'APPROVED', amount: 100.99 } },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const txn = await client.processPurchase({
      amount: 100.99,
      currency: 'CAD',
      ipAddress: '192.168.1.1',
      cardData: { cardToken: 'tok_123' },
      customerCode: 'CST1000',
    });
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('https://api.helcim.test/v2/payment/purchase');
    expect(calls[0].headers['idempotency-key']).toBeDefined();
    const body = JSON.parse(calls[0].body!);
    expect(body.cardData.cardToken).toBe('tok_123');
    expect(body.customerCode).toBe('CST1000');
    expect(txn.transactionId).toBe(30537777);
    expect(txn.status).toBe('APPROVED');
  });

  it('processPurchase sends POST with full card details', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { transaction: { transactionId: 1, status: 'APPROVED' } },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.processPurchase({
      amount: 50,
      currency: 'CAD',
      ipAddress: '10.0.0.1',
      cardData: { cardNumber: '5454545454545454', cardExpiry: '1257', cardCVV: '100', cardHolderName: 'John' },
    });
    const body = JSON.parse(calls[0].body!);
    expect(body.cardData.cardNumber).toBe('5454545454545454');
  });

  it('processPurchase rejects non-positive amount', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(client.processPurchase({
      amount: 0, currency: 'CAD', ipAddress: '1.1.1.1', cardData: { cardToken: 't' },
    })).rejects.toThrow();
  });

  it('processPreauth sends POST', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { transaction: { transactionId: 1, status: 'APPROVED', type: 'preauth' } },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.processPreauth({
      amount: 100, currency: 'CAD', ipAddress: '1.1.1.1', cardData: { cardToken: 't' },
    });
    expect(calls[0].url).toBe('https://api.helcim.test/v2/payment/preauth');
  });

  it('capturePreauth sends POST with cardTransactionId', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { transaction: { transactionId: 2, status: 'APPROVED' } },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.capturePreauth({ cardTransactionId: 1, amount: 50, currency: 'CAD', ipAddress: '1.1.1.1' });
    expect(calls[0].url).toBe('https://api.helcim.test/v2/payment/capture');
    const body = JSON.parse(calls[0].body!);
    expect(body.cardTransactionId).toBe(1);
  });

  it('refundPurchase sends POST', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { transaction: { transactionId: 3, status: 'APPROVED' } },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.refundPurchase({ cardTransactionId: 1, amount: 25, ipAddress: '1.1.1.1' });
    expect(calls[0].url).toBe('https://api.helcim.test/v2/payment/refund');
  });

  it('reversePurchase sends POST', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { transaction: { transactionId: 4, status: 'APPROVED' } },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.reversePurchase({ cardTransactionId: 1, ipAddress: '1.1.1.1' });
    expect(calls[0].url).toBe('https://api.helcim.test/v2/payment/reverse');
  });
});

// ─── Invoices ───────────────────────────────────────────────────────────────

describe('client — invoices', () => {
  it('createInvoice sends POST with line items', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { data: [{ id: 100, invoiceNumber: 'INV100', amount: 50 }] },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const inv = await client.createInvoice({
      customerCode: 'CST1000',
      lineItems: [{ description: 'Bookkeeping', quantity: 1, price: 50, total: 50 }],
    });
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('https://api.helcim.test/v2/invoices');
    expect(calls[0].headers['idempotency-key']).toBeDefined();
    const body = JSON.parse(calls[0].body!);
    expect(body.customerCode).toBe('CST1000');
    expect(body.lineItems[0].description).toBe('Bookkeeping');
    expect(inv.id).toBe(100);
  });

  it('createInvoice rejects empty line items', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(client.createInvoice({ customerCode: 'C', lineItems: [] })).rejects.toThrow();
  });

  it('getInvoices returns array', async () => {
    const { fetchImpl } = mockFetch({
      body: { data: [{ id: 1 }, { id: 2 }] },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const invs = await client.getInvoices({ customerCode: 'CST1000' });
    expect(invs.length).toBe(2);
  });

  it('getInvoice returns a single invoice', async () => {
    const { fetchImpl } = mockFetch({
      body: { data: { id: 5, invoiceNumber: 'INV5', amount: 100 } },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    const inv = await client.getInvoice(5);
    expect(inv.id).toBe(5);
    expect(inv.invoiceNumber).toBe('INV5');
  });
});

// ─── HelcimPay.js paymentMethod ─────────────────────────────────────────────

describe('client — initializeHelcimPay paymentMethod', () => {
  it('sends paymentMethod cc-ach when specified', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { checkoutToken: 'co-1', secretToken: 'sec-1' },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.initializeHelcimPay({
      paymentType: 'verify',
      paymentMethod: 'cc-ach',
      currency: 'CAD',
    });
    const body = JSON.parse(calls[0].body!);
    expect(body.paymentMethod).toBe('cc-ach');
  });

  it('sends digitalWallet google-pay override', async () => {
    const { fetchImpl, calls } = mockFetch({
      body: { checkoutToken: 'co-1', secretToken: 'sec-1' },
    });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.initializeHelcimPay({
      paymentType: 'purchase',
      amount: 10,
      digitalWallet: { 'google-pay': 1 },
    });
    const body = JSON.parse(calls[0].body!);
    expect(body.digitalWallet['google-pay']).toBe(1);
  });
});

// ─── Property-based tests ───────────────────────────────────────────────────

fcTest.prop([
  fc.integer({ min: 1, max: 999999 }),
  fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !s.includes('.')),
])('getCustomer always builds the path with the id', async (id) => {
  const { fetchImpl, calls } = mockFetch({ body: { id, customerCode: 'C' } });
  const client = createHelcimClient(TEST_CONFIG, fetchImpl);
  await client.getCustomer(id);
  return calls[0].url === `https://api.helcim.test/v2/customers/${id}`;
});

fcTest.prop([fc.integer({ min: 1, max: 999999 })])(
  'getCardTransaction always builds the path with the id',
  async (id) => {
    const { fetchImpl, calls } = mockFetch({ body: { transactionId: id } });
    const client = createHelcimClient(TEST_CONFIG, fetchImpl);
    await client.getCardTransaction(id);
    return calls[0].url === `https://api.helcim.test/v2/card-transactions/${id}`;
  }
);

fcTest.prop([
  fc.integer({ min: 1, max: 999999 }),
  fc.integer({ min: 1, max: 999 }),
])('processSubscriptionPayment always sends idempotency key and body', async (subId, payNum) => {
  const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: subId }] } });
  const client = createHelcimClient(TEST_CONFIG, fetchImpl);
  await client.processSubscriptionPayment(subId, payNum);
  const body = JSON.parse(calls[0].body!);
  return (
    calls[0].headers['idempotency-key'].length === 25 &&
    body.subscriptionId === subId &&
    body.paymentNumber === payNum
  );
});

// Verify that the env-based config + client factory compose without throwing
// for any non-empty token.
fcTest.prop([fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes(' '))])(
  'createHelcimConfigFromEnv + createHelcimClient compose for any non-empty token',
  (token) => {
    const cfg = createHelcimConfigFromEnv({ HELCIM_API_TOKEN: token });
    expect(cfg).not.toBeNull();
    const client = createHelcimClient(cfg!);
    expect(typeof client.createCustomer).toBe('function');
  }
);

// Idempotency key generator: always 25 alphanumeric chars
fcTest.prop([fc.integer({ min: 1, max: 100 })])(
  'generateIdempotencyKey always returns 25 alphanumeric chars (repeated)',
  () => {
    const key = generateIdempotencyKey();
    return key.length === 25 && /^[a-f0-9]+$/.test(key);
  }
);
