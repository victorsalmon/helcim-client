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
