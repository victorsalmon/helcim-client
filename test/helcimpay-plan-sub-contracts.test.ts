import { describe, it, expect, beforeEach, vi } from 'vitest';
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
} from './helpers.js';

beforeEach(() => vi.restoreAllMocks());

// ─── initializeHelcimPay ─────────────────────────────────────────────────────

describe('initializeHelcimPay contract', () => {
  it('POSTs to /helcim-pay/initialize with paymentType', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify' });
    assertMethod(calls[0], 'POST');
    assertPath(calls[0], '/helcim-pay/initialize');
    assertBodyField(calls[0], 'paymentType', 'verify');
  });

  it('includes amount when provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'purchase', amount: 50 });
    assertBodyField(calls[0], 'amount', 50);
  });

  it('omits amount when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify' });
    assertBodyFieldAbsent(calls[0], 'amount');
  });

  it('includes currency when provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify', currency: 'CAD' });
    assertBodyField(calls[0], 'currency', 'CAD');
  });

  it('omits currency when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify' });
    assertBodyFieldAbsent(calls[0], 'currency');
  });

  it('includes customerCode when provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify', customerCode: 'CST1' });
    assertBodyField(calls[0], 'customerCode', 'CST1');
  });

  it('omits customerCode when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify' });
    assertBodyFieldAbsent(calls[0], 'customerCode');
  });

  it('includes invoiceNumber when provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify', invoiceNumber: 'INV1' });
    assertBodyField(calls[0], 'invoiceNumber', 'INV1');
  });

  it('omits invoiceNumber when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify' });
    assertBodyFieldAbsent(calls[0], 'invoiceNumber');
  });

  it('includes language when provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify', language: 'fr' });
    assertBodyField(calls[0], 'language', 'fr');
  });

  it('omits language when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify' });
    assertBodyFieldAbsent(calls[0], 'language');
  });

  it('serializes setAsDefaultPaymentMethod=true to 1', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify', setAsDefaultPaymentMethod: true });
    assertBodyField(calls[0], 'setAsDefaultPaymentMethod', 1);
  });

  it('serializes setAsDefaultPaymentMethod=false to 0', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify', setAsDefaultPaymentMethod: false });
    assertBodyField(calls[0], 'setAsDefaultPaymentMethod', 0);
  });

  it('omits setAsDefaultPaymentMethod when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify' });
    assertBodyFieldAbsent(calls[0], 'setAsDefaultPaymentMethod');
  });

  it('includes customerRequest with all optional fields', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({
      paymentType: 'verify',
      customerRequest: {
        contactName: 'Example Customer',
        businessName: 'Example Inc.',
        customerCode: 'CST1',
        cellPhone: '555',
        billingAddress: { name: 'Example Customer', street1: '1 St', postalCode: 'H0H0H0' },
        shippingAddress: { name: 'Example Customer', street1: '2 St', postalCode: 'H0H0H0' },
      },
    });
    assertBodyPath(calls[0], 'customerRequest.contactName', 'Example Customer');
    assertBodyPath(calls[0], 'customerRequest.businessName', 'Example Inc.');
    assertBodyPath(calls[0], 'customerRequest.customerCode', 'CST1');
    assertBodyPath(calls[0], 'customerRequest.cellPhone', '555');
    assertBodyPath(calls[0], 'customerRequest.billingAddress.name', 'Example Customer');
    assertBodyPath(calls[0], 'customerRequest.shippingAddress.name', 'Example Customer');
  });

  it('omits customerRequest optional fields when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({
      paymentType: 'verify',
      customerRequest: { contactName: 'Example Customer' },
    });
    assertBodyPathAbsent(calls[0], 'customerRequest.businessName');
    assertBodyPathAbsent(calls[0], 'customerRequest.customerCode');
    assertBodyPathAbsent(calls[0], 'customerRequest.cellPhone');
    assertBodyPathAbsent(calls[0], 'customerRequest.billingAddress');
    assertBodyPathAbsent(calls[0], 'customerRequest.shippingAddress');
  });

  it('includes invoiceRequest when provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({
      paymentType: 'verify',
      invoiceRequest: {
        contactName: 'Example Customer',
        lineItems: [{ description: 'x', quantity: 1, price: 5, total: 5 }],
      },
    });
    assertBodyPath(calls[0], 'invoiceRequest.contactName', 'Example Customer');
  });

  it('omits invoiceRequest when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify' });
    assertBodyFieldAbsent(calls[0], 'invoiceRequest');
  });

  it('includes customStyling when provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify', customStyling: { appearance: 'dark' } });
    assertBodyPath(calls[0], 'customStyling.appearance', 'dark');
  });

  it('omits customStyling when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify' });
    assertBodyFieldAbsent(calls[0], 'customStyling');
  });

  it('includes paymentMethod when provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify', paymentMethod: 'cc-ach' });
    assertBodyField(calls[0], 'paymentMethod', 'cc-ach');
  });

  it('omits paymentMethod when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify' });
    assertBodyFieldAbsent(calls[0], 'paymentMethod');
  });

  it('includes digitalWallet when provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify', digitalWallet: { 'google-pay': 1 } });
    assertBodyPath(calls[0], 'digitalWallet.google-pay', 1);
  });

  it('omits digitalWallet when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify' });
    assertBodyFieldAbsent(calls[0], 'digitalWallet');
  });

  it('includes confirmationScreen when provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify', confirmationScreen: true });
    assertBodyField(calls[0], 'confirmationScreen', true);
  });

  it('omits confirmationScreen when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify' });
    assertBodyFieldAbsent(calls[0], 'confirmationScreen');
  });

  it('includes allowExit when provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify', allowExit: false });
    assertBodyField(calls[0], 'allowExit', false);
  });

  it('omits allowExit when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify' });
    assertBodyFieldAbsent(calls[0], 'allowExit');
  });

  it('throws on empty paymentType', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.initializeHelcimPay({ paymentType: '' as any })).rejects.toThrow(/paymentType/);
  });

  it('throws on whitespace-only paymentType', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.initializeHelcimPay({ paymentType: '  ' as any })).rejects.toThrow(
      /paymentType/
    );
  });

  it('throws on non-string paymentType', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.initializeHelcimPay({ paymentType: 123 as any })).rejects.toThrow(/paymentType/);
  });

  it('throws on amount=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.initializeHelcimPay({ paymentType: 'purchase', amount: 0 })).rejects.toThrow(
      /positive finite/
    );
  });

  it('throws on negative amount', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.initializeHelcimPay({ paymentType: 'purchase', amount: -5 })).rejects.toThrow(
      /positive finite/
    );
  });

  it('throws on NaN amount', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.initializeHelcimPay({ paymentType: 'purchase', amount: NaN })).rejects.toThrow(
      /positive finite/
    );
  });

  it('throws on Infinity amount', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(
      c.initializeHelcimPay({ paymentType: 'purchase', amount: Infinity })
    ).rejects.toThrow(/positive finite/);
  });

  it('throws on missing checkoutToken in response', async () => {
    const { fetchImpl } = mockFetch({ body: { secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.initializeHelcimPay({ paymentType: 'verify' })).rejects.toThrow(
      /checkoutToken and secretToken/
    );
  });

  it('throws on missing secretToken in response', async () => {
    const { fetchImpl } = mockFetch({ body: { checkoutToken: 'c' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.initializeHelcimPay({ paymentType: 'verify' })).rejects.toThrow(
      /checkoutToken and secretToken/
    );
  });

  it('reads checkout_token (snake_case) from response', async () => {
    const { fetchImpl } = mockFetch({ body: { checkout_token: 'c', secret_token: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.initializeHelcimPay({ paymentType: 'verify' });
    expect(r.checkoutToken).toBe('c');
    expect(r.secretToken).toBe('s');
  });

  it('throws on customerRequest missing contactName', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(
      c.initializeHelcimPay({ paymentType: 'verify', customerRequest: {} as any })
    ).rejects.toThrow(/contactName/);
  });

  it('throws on whitespace-only customerRequest contactName', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(
      c.initializeHelcimPay({ paymentType: 'verify', customerRequest: { contactName: '  ' } })
    ).rejects.toThrow(/contactName/);
  });
});

// ─── createPaymentPlan ───────────────────────────────────────────────────────

describe('createPaymentPlan contract', () => {
  const baseInput = {
    name: 'Pro',
    type: 'subscription' as const,
    currency: 'CAD',
    recurringAmount: 10,
    billingPeriod: 'monthly' as const,
    dateBilling: 'Sign-up',
    termType: 'forever' as const,
  };

  it('POSTs to /payment-plans with required fields', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 1, name: 'Pro' }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createPaymentPlan(baseInput);
    assertMethod(calls[0], 'POST');
    assertPath(calls[0], '/payment-plans');
    assertBodyPath(calls[0], 'paymentPlans.0.name', 'Pro');
    assertBodyPath(calls[0], 'paymentPlans.0.type', 'subscription');
    assertBodyPath(calls[0], 'paymentPlans.0.currency', 'CAD');
    assertBodyPath(calls[0], 'paymentPlans.0.recurringAmount', 10);
    assertBodyPath(calls[0], 'paymentPlans.0.billingPeriod', 'monthly');
    assertBodyPath(calls[0], 'paymentPlans.0.dateBilling', 'Sign-up');
    assertBodyPath(calls[0], 'paymentPlans.0.termType', 'forever');
  });

  it('wraps plan in paymentPlans array', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 1 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createPaymentPlan(baseInput);
    const b = bodyOf(calls[0]);
    expect(b.paymentPlans).toHaveLength(1);
  });

  it('includes all optional fields when provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 1 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createPaymentPlan({
      ...baseInput,
      status: 'active',
      cardTerminalId: 5,
      setupAmount: 20,
      billSetupImmediately: 'immediate',
      billingPeriodIncrements: 12,
      freeTrialPeriod: 30,
      taxType: 'customer',
      taxCalculation: 'country_only',
      termLength: 365,
      paymentMethod: 'card',
      businessEmail: 'biz@test.com',
      addOnIds: [1, 2],
      isProrated: 'yes',
    });
    assertBodyPath(calls[0], 'paymentPlans.0.status', 'active');
    assertBodyPath(calls[0], 'paymentPlans.0.cardTerminalId', 5);
    assertBodyPath(calls[0], 'paymentPlans.0.setupAmount', 20);
    assertBodyPath(calls[0], 'paymentPlans.0.billSetupImmediately', 'immediate');
    assertBodyPath(calls[0], 'paymentPlans.0.billingPeriodIncrements', 12);
    assertBodyPath(calls[0], 'paymentPlans.0.freeTrialPeriod', 30);
    assertBodyPath(calls[0], 'paymentPlans.0.taxType', 'customer');
    assertBodyPath(calls[0], 'paymentPlans.0.taxCalculation', 'country_only');
    assertBodyPath(calls[0], 'paymentPlans.0.termLength', 365);
    assertBodyPath(calls[0], 'paymentPlans.0.paymentMethod', 'card');
    assertBodyPath(calls[0], 'paymentPlans.0.businessEmail', 'biz@test.com');
    assertBodyPath(calls[0], 'paymentPlans.0.addOnIds', [1, 2]);
    assertBodyPath(calls[0], 'paymentPlans.0.isProrated', 'yes');
  });

  it('omits all optional fields when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 1 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createPaymentPlan(baseInput);
    assertBodyPathAbsent(calls[0], 'paymentPlans.0.status');
    assertBodyPathAbsent(calls[0], 'paymentPlans.0.cardTerminalId');
    assertBodyPathAbsent(calls[0], 'paymentPlans.0.setupAmount');
    assertBodyPathAbsent(calls[0], 'paymentPlans.0.billSetupImmediately');
    assertBodyPathAbsent(calls[0], 'paymentPlans.0.billingPeriodIncrements');
    assertBodyPathAbsent(calls[0], 'paymentPlans.0.freeTrialPeriod');
    assertBodyPathAbsent(calls[0], 'paymentPlans.0.taxType');
    assertBodyPathAbsent(calls[0], 'paymentPlans.0.taxCalculation');
    assertBodyPathAbsent(calls[0], 'paymentPlans.0.termLength');
    assertBodyPathAbsent(calls[0], 'paymentPlans.0.paymentMethod');
    assertBodyPathAbsent(calls[0], 'paymentPlans.0.businessEmail');
    assertBodyPathAbsent(calls[0], 'paymentPlans.0.addOnIds');
    assertBodyPathAbsent(calls[0], 'paymentPlans.0.isProrated');
  });

  it('throws on empty name', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createPaymentPlan({ ...baseInput, name: '' })).rejects.toThrow(/name/);
  });

  it('throws on empty currency', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createPaymentPlan({ ...baseInput, currency: '' })).rejects.toThrow(/currency/);
  });

  it('throws on empty type', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createPaymentPlan({ ...baseInput, type: '' as any })).rejects.toThrow(/type/);
  });

  it('throws on empty billingPeriod', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createPaymentPlan({ ...baseInput, billingPeriod: '' as any })).rejects.toThrow(
      /billingPeriod/
    );
  });

  it('throws on empty dateBilling', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createPaymentPlan({ ...baseInput, dateBilling: '' })).rejects.toThrow(
      /dateBilling/
    );
  });

  it('throws on empty termType', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createPaymentPlan({ ...baseInput, termType: '' as any })).rejects.toThrow(
      /termType/
    );
  });

  it('throws on recurringAmount=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createPaymentPlan({ ...baseInput, recurringAmount: 0 })).rejects.toThrow(
      /recurringAmount/
    );
  });

  it('throws on negative recurringAmount', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createPaymentPlan({ ...baseInput, recurringAmount: -1 })).rejects.toThrow(
      /recurringAmount/
    );
  });

  it('throws on NaN recurringAmount', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createPaymentPlan({ ...baseInput, recurringAmount: NaN })).rejects.toThrow(
      /recurringAmount/
    );
  });

  it('throws on Infinity recurringAmount', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createPaymentPlan({ ...baseInput, recurringAmount: Infinity })).rejects.toThrow(
      /recurringAmount/
    );
  });

  it('throws when response data array is empty', async () => {
    const { fetchImpl } = mockFetch({ body: { data: [] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createPaymentPlan(baseInput)).rejects.toThrow(/no plans/);
  });

  it('throws when response has no data array', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createPaymentPlan(baseInput)).rejects.toThrow(/no plans/);
  });
});

// ─── getPaymentPlan ──────────────────────────────────────────────────────────

describe('getPaymentPlan contract', () => {
  it('GETs /payment-plans/{id}', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 5 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getPaymentPlan(5);
    assertMethod(calls[0], 'GET');
    assertPath(calls[0], '/payment-plans/5');
  });

  it('rejects id=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getPaymentPlan(0)).rejects.toThrow(/positive integer/);
  });

  it('rejects negative id', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getPaymentPlan(-1)).rejects.toThrow(/positive integer/);
  });

  it('rejects non-integer id', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getPaymentPlan(1.5)).rejects.toThrow(/positive integer/);
  });

  it('unwraps data array', async () => {
    const { fetchImpl } = mockFetch({ body: { data: [{ id: 5, name: 'X' }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getPaymentPlan(5);
    expect(r.id).toBe(5);
    expect(r.name).toBe('X');
  });

  it('falls back to raw object when no data array', async () => {
    const { fetchImpl } = mockFetch({ body: { id: 7, name: 'Y' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getPaymentPlan(7);
    expect(r.id).toBe(7);
    expect(r.name).toBe('Y');
  });
});

// ─── getPaymentPlans ─────────────────────────────────────────────────────────

describe('getPaymentPlans contract', () => {
  it('GETs /payment-plans with query params', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getPaymentPlans({ page: 1, limit: 10, status: 'active' });
    assertMethod(calls[0], 'GET');
    assertPath(calls[0], '/payment-plans');
    assertQuery(calls[0], 'page', '1');
    assertQuery(calls[0], 'limit', '10');
    assertQuery(calls[0], 'status', 'active');
  });

  it('omits undefined query params', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getPaymentPlans({});
    assertQueryAbsent(calls[0], 'page');
    assertQueryAbsent(calls[0], 'limit');
    assertQueryAbsent(calls[0], 'status');
  });

  it('unwraps data array', async () => {
    const { fetchImpl } = mockFetch({ body: { data: [{ id: 1 }, { id: 2 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getPaymentPlans({});
    expect(r).toHaveLength(2);
  });

  it('returns empty array when no data', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getPaymentPlans({});
    expect(r).toHaveLength(0);
  });
});

// ─── deletePaymentPlan ───────────────────────────────────────────────────────

describe('deletePaymentPlan contract', () => {
  it('DELETEs /payment-plans/{id} and returns true', async () => {
    const { fetchImpl, calls } = mockFetch({ status: 200, body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.deletePaymentPlan(5);
    expect(r).toBe(true);
    assertMethod(calls[0], 'DELETE');
    assertPath(calls[0], '/payment-plans/5');
  });

  it('rejects id=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.deletePaymentPlan(0)).rejects.toThrow(/positive integer/);
  });

  it('rejects negative id', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.deletePaymentPlan(-1)).rejects.toThrow(/positive integer/);
  });

  it('rejects non-integer id', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.deletePaymentPlan(1.5)).rejects.toThrow(/positive integer/);
  });
});

// ─── createSubscription ──────────────────────────────────────────────────────

describe('createSubscription contract', () => {
  const baseInput = { paymentPlanId: 5, customerCode: 'CST100' };

  it('POSTs to /subscriptions with idempotency key', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 10 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createSubscription(baseInput, 'abc123def456ghi789jkl012mno');
    assertMethod(calls[0], 'POST');
    assertPath(calls[0], '/subscriptions');
    assertHeader(calls[0], 'idempotency-key', 'abc123def456ghi789jkl012mno');
  });

  it('wraps sub in subscriptions array', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 10 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createSubscription(baseInput);
    const b = bodyOf(calls[0]);
    expect(b.subscriptions).toHaveLength(1);
  });

  it('includes all optional fields when provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 10 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createSubscription({
      ...baseInput,
      dateActivated: '2024-01-01',
      useCustomSetupAmount: true,
      setupAmount: 50,
      recurringAmount: 10,
      withFreeTrialPeriod: true,
      freeTrialPeriod: 30,
      paymentMethod: 'card',
      maxCycles: 12,
      addOns: [{ addOnId: 1, quantity: 2 }],
    });
    assertBodyPath(calls[0], 'subscriptions.0.dateActivated', '2024-01-01');
    assertBodyPath(calls[0], 'subscriptions.0.useCustomSetupAmount', true);
    assertBodyPath(calls[0], 'subscriptions.0.setupAmount', 50);
    assertBodyPath(calls[0], 'subscriptions.0.recurringAmount', 10);
    assertBodyPath(calls[0], 'subscriptions.0.withFreeTrialPeriod', true);
    assertBodyPath(calls[0], 'subscriptions.0.freeTrialPeriod', 30);
    assertBodyPath(calls[0], 'subscriptions.0.paymentMethod', 'card');
    assertBodyPath(calls[0], 'subscriptions.0.maxCycles', 12);
    assertBodyPath(calls[0], 'subscriptions.0.addOns', [{ addOnId: 1, quantity: 2 }]);
  });

  it('omits all optional fields when not provided', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 10 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createSubscription(baseInput);
    assertBodyPathAbsent(calls[0], 'subscriptions.0.dateActivated');
    assertBodyPathAbsent(calls[0], 'subscriptions.0.useCustomSetupAmount');
    assertBodyPathAbsent(calls[0], 'subscriptions.0.setupAmount');
    assertBodyPathAbsent(calls[0], 'subscriptions.0.recurringAmount');
    assertBodyPathAbsent(calls[0], 'subscriptions.0.withFreeTrialPeriod');
    assertBodyPathAbsent(calls[0], 'subscriptions.0.freeTrialPeriod');
    assertBodyPathAbsent(calls[0], 'subscriptions.0.paymentMethod');
    assertBodyPathAbsent(calls[0], 'subscriptions.0.maxCycles');
    assertBodyPathAbsent(calls[0], 'subscriptions.0.addOns');
  });

  it('rejects paymentPlanId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createSubscription({ ...baseInput, paymentPlanId: 0 })).rejects.toThrow(
      /paymentPlanId/
    );
  });

  it('rejects negative paymentPlanId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createSubscription({ ...baseInput, paymentPlanId: -1 })).rejects.toThrow(
      /paymentPlanId/
    );
  });

  it('rejects non-integer paymentPlanId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createSubscription({ ...baseInput, paymentPlanId: 1.5 })).rejects.toThrow(
      /paymentPlanId/
    );
  });

  it('rejects empty customerCode', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createSubscription({ ...baseInput, customerCode: '' })).rejects.toThrow(
      /customerCode/
    );
  });

  it('rejects whitespace-only customerCode', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createSubscription({ ...baseInput, customerCode: '  ' })).rejects.toThrow(
      /customerCode/
    );
  });

  it('rejects recurringAmount=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createSubscription({ ...baseInput, recurringAmount: 0 })).rejects.toThrow(
      /recurringAmount/
    );
  });

  it('rejects negative recurringAmount', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createSubscription({ ...baseInput, recurringAmount: -5 })).rejects.toThrow(
      /recurringAmount/
    );
  });

  it('throws when response data array is empty', async () => {
    const { fetchImpl } = mockFetch({ body: { data: [] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createSubscription(baseInput)).rejects.toThrow(/no subscriptions/);
  });

  it('throws when response has no data field', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.createSubscription(baseInput)).rejects.toThrow(/no subscriptions/);
  });

  it('auto-generates 25-char idempotency key', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 10 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createSubscription(baseInput);
    expect(calls[0].headers['idempotency-key']).toHaveLength(25);
  });
});

// ─── getSubscription ─────────────────────────────────────────────────────────

describe('getSubscription contract', () => {
  it('GETs /subscriptions/{id}', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 9 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getSubscription(9);
    assertMethod(calls[0], 'GET');
    assertPath(calls[0], '/subscriptions/9');
  });

  it('passes includeSubObjects=true when requested', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 9 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getSubscription(9, true);
    assertQuery(calls[0], 'includeSubObjects', 'true');
  });

  it('omits includeSubObjects when false', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 9 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getSubscription(9, false);
    assertQueryAbsent(calls[0], 'includeSubObjects');
  });

  it('rejects id=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getSubscription(0)).rejects.toThrow(/positive integer/);
  });

  it('rejects negative id', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getSubscription(-1)).rejects.toThrow(/positive integer/);
  });

  it('rejects non-integer id', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.getSubscription(1.5)).rejects.toThrow(/positive integer/);
  });

  it('unwraps data array', async () => {
    const { fetchImpl } = mockFetch({ body: { data: [{ id: 9, customerCode: 'C' }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getSubscription(9);
    expect(r.id).toBe(9);
  });

  it('falls back to raw object when no data array', async () => {
    const { fetchImpl } = mockFetch({ body: { id: 9, customerCode: 'C' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getSubscription(9);
    expect(r.id).toBe(9);
  });
});

// ─── getSubscriptions ────────────────────────────────────────────────────────

describe('getSubscriptions contract', () => {
  it('GETs /subscriptions with all query params', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getSubscriptions({
      customerCode: 'C1',
      paymentPlanId: 5,
      status: 'active',
      page: 1,
      limit: 10,
    });
    assertMethod(calls[0], 'GET');
    assertPath(calls[0], '/subscriptions');
    assertQuery(calls[0], 'customerCode', 'C1');
    assertQuery(calls[0], 'paymentPlanId', '5');
    assertQuery(calls[0], 'status', 'active');
    assertQuery(calls[0], 'page', '1');
    assertQuery(calls[0], 'limit', '10');
  });

  it('omits undefined/empty query params', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.getSubscriptions({ customerCode: '', paymentPlanId: undefined, status: undefined });
    assertQueryAbsent(calls[0], 'customerCode');
    assertQueryAbsent(calls[0], 'paymentPlanId');
    assertQueryAbsent(calls[0], 'status');
  });

  it('unwraps data array', async () => {
    const { fetchImpl } = mockFetch({ body: { data: [{ id: 1 }, { id: 2 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getSubscriptions({});
    expect(r).toHaveLength(2);
  });

  it('returns empty array when response has no subscription fields', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.getSubscriptions({});
    expect(r).toHaveLength(0);
  });
});

// ─── deleteSubscription ──────────────────────────────────────────────────────

describe('deleteSubscription contract', () => {
  it('DELETEs /subscriptions/{id} and returns true', async () => {
    const { fetchImpl, calls } = mockFetch({ status: 200, body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.deleteSubscription(9);
    expect(r).toBe(true);
    assertMethod(calls[0], 'DELETE');
    assertPath(calls[0], '/subscriptions/9');
  });

  it('rejects id=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.deleteSubscription(0)).rejects.toThrow(/positive integer/);
  });

  it('rejects negative id', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.deleteSubscription(-1)).rejects.toThrow(/positive integer/);
  });

  it('rejects non-integer id', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.deleteSubscription(1.5)).rejects.toThrow(/positive integer/);
  });
});

// ─── processSubscriptionPayment ──────────────────────────────────────────────

describe('processSubscriptionPayment contract', () => {
  it('POSTs to /procedures/process-payment with idempotency key', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 9 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.processSubscriptionPayment(9, 3);
    assertMethod(calls[0], 'POST');
    assertPath(calls[0], '/procedures/process-payment');
    expect(calls[0].headers['idempotency-key']).toBeDefined();
    expect(calls[0].headers['idempotency-key']).toHaveLength(25);
  });

  it('sends subscriptionId and paymentNumber in body', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 9 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.processSubscriptionPayment(9, 3);
    assertBodyField(calls[0], 'subscriptionId', 9);
    assertBodyField(calls[0], 'paymentNumber', 3);
  });

  it('rejects subscriptionId=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processSubscriptionPayment(0, 3)).rejects.toThrow(/subscriptionId/);
  });

  it('rejects negative subscriptionId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processSubscriptionPayment(-1, 3)).rejects.toThrow(/subscriptionId/);
  });

  it('rejects non-integer subscriptionId', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processSubscriptionPayment(1.5, 3)).rejects.toThrow(/subscriptionId/);
  });

  it('rejects paymentNumber=0', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processSubscriptionPayment(9, 0)).rejects.toThrow(/paymentNumber/);
  });

  it('rejects negative paymentNumber', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processSubscriptionPayment(9, -1)).rejects.toThrow(/paymentNumber/);
  });

  it('rejects non-integer paymentNumber', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processSubscriptionPayment(9, 1.5)).rejects.toThrow(/paymentNumber/);
  });

  it('unwraps data array', async () => {
    const { fetchImpl } = mockFetch({ body: { data: [{ id: 9, customerCode: 'C' }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.processSubscriptionPayment(9, 3);
    expect(r.id).toBe(9);
  });

  it('falls back to raw object when no data array', async () => {
    const { fetchImpl } = mockFetch({ body: { id: 9, customerCode: 'C' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.processSubscriptionPayment(9, 3);
    expect(r.id).toBe(9);
  });
});
