import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHelcimClient } from '../src/index.js';
import { TEST_CONFIG, mockFetch, assertBodyFieldAbsent, bodyOf } from './helpers.js';

beforeEach(() => vi.restoreAllMocks());

// These tests kill ConditionalExpression mutants that change `if (input.X)` to `if (true)`.
// When the field is `undefined`, JSON.stringify strips it, making the mutant equivalent.
// But when the field is `''` (empty string) or `null`, the original guard skips it while
// the mutant includes it — so we can distinguish.

describe('optional field guards reject empty-string and null values', () => {
  // ─── createCustomer ────────────────────────────────────────────────────────

  it('createCustomer omits empty-string customerCode', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { id: 1 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createCustomer({ contactName: 'J', customerCode: '' });
    assertBodyFieldAbsent(calls[0], 'customerCode');
  });

  it('createCustomer omits empty-string contactName (when businessName is provided)', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { id: 1 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createCustomer({ businessName: 'A', contactName: '' });
    assertBodyFieldAbsent(calls[0], 'contactName');
  });

  it('createCustomer omits empty-string businessName', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { id: 1 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createCustomer({ contactName: 'J', businessName: '' });
    assertBodyFieldAbsent(calls[0], 'businessName');
  });

  it('createCustomer omits empty-string cellPhone', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { id: 1 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createCustomer({ contactName: 'J', cellPhone: '' });
    assertBodyFieldAbsent(calls[0], 'cellPhone');
  });

  it('createCustomer omits null billingAddress', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { id: 1 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createCustomer({ contactName: 'J', billingAddress: null as any });
    assertBodyFieldAbsent(calls[0], 'billingAddress');
  });

  it('createCustomer omits null shippingAddress', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { id: 1 } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createCustomer({ contactName: 'J', shippingAddress: null as any });
    assertBodyFieldAbsent(calls[0], 'shippingAddress');
  });

  // ─── initializeHelcimPay ───────────────────────────────────────────────────

  it('initializeHelcimPay omits empty-string currency', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify', currency: '' });
    assertBodyFieldAbsent(calls[0], 'currency');
  });

  it('initializeHelcimPay omits empty-string customerCode', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify', customerCode: '' });
    assertBodyFieldAbsent(calls[0], 'customerCode');
  });

  it('initializeHelcimPay omits empty-string invoiceNumber', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify', invoiceNumber: '' });
    assertBodyFieldAbsent(calls[0], 'invoiceNumber');
  });

  it('initializeHelcimPay omits empty-string language', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify', language: '' as any });
    assertBodyFieldAbsent(calls[0], 'language');
  });

  it('initializeHelcimPay omits empty-string paymentMethod', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify', paymentMethod: '' as any });
    assertBodyFieldAbsent(calls[0], 'paymentMethod');
  });

  it('initializeHelcimPay omits null customerRequest', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify', customerRequest: null as any });
    assertBodyFieldAbsent(calls[0], 'customerRequest');
  });

  it('initializeHelcimPay omits null invoiceRequest', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify', invoiceRequest: null as any });
    assertBodyFieldAbsent(calls[0], 'invoiceRequest');
  });

  it('initializeHelcimPay omits null customStyling', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify', customStyling: null as any });
    assertBodyFieldAbsent(calls[0], 'customStyling');
  });

  it('initializeHelcimPay omits null digitalWallet', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({ paymentType: 'verify', digitalWallet: null as any });
    assertBodyFieldAbsent(calls[0], 'digitalWallet');
  });

  it('initializeHelcimPay customerRequest omits empty-string businessName', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({
      paymentType: 'verify',
      customerRequest: { contactName: 'J', businessName: '' },
    });
    const b = bodyOf(calls[0]);
    expect('businessName' in b.customerRequest).toBe(false);
  });

  it('initializeHelcimPay customerRequest omits empty-string customerCode', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({
      paymentType: 'verify',
      customerRequest: { contactName: 'J', customerCode: '' },
    });
    const b = bodyOf(calls[0]);
    expect('customerCode' in b.customerRequest).toBe(false);
  });

  it('initializeHelcimPay customerRequest omits empty-string cellPhone', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({
      paymentType: 'verify',
      customerRequest: { contactName: 'J', cellPhone: '' },
    });
    const b = bodyOf(calls[0]);
    expect('cellPhone' in b.customerRequest).toBe(false);
  });

  it('initializeHelcimPay customerRequest omits null billingAddress', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({
      paymentType: 'verify',
      customerRequest: { contactName: 'J', billingAddress: null as any },
    });
    const b = bodyOf(calls[0]);
    expect('billingAddress' in b.customerRequest).toBe(false);
  });

  it('initializeHelcimPay customerRequest omits null shippingAddress', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { checkoutToken: 'c', secretToken: 's' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.initializeHelcimPay({
      paymentType: 'verify',
      customerRequest: { contactName: 'J', shippingAddress: null as any },
    });
    const b = bodyOf(calls[0]);
    expect('shippingAddress' in b.customerRequest).toBe(false);
  });

  // ─── createPaymentPlan ─────────────────────────────────────────────────────

  it('createPaymentPlan omits empty-string status', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 1 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createPaymentPlan({
      name: 'X',
      type: 'subscription',
      currency: 'CAD',
      recurringAmount: 1,
      billingPeriod: 'monthly',
      dateBilling: 'S',
      termType: 'forever',
      status: '' as any,
    });
    const b = bodyOf(calls[0]);
    expect('status' in b.paymentPlans[0]).toBe(false);
  });

  it('createPaymentPlan omits empty-string billSetupImmediately', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 1 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createPaymentPlan({
      name: 'X',
      type: 'subscription',
      currency: 'CAD',
      recurringAmount: 1,
      billingPeriod: 'monthly',
      dateBilling: 'S',
      termType: 'forever',
      billSetupImmediately: '' as any,
    });
    const b = bodyOf(calls[0]);
    expect('billSetupImmediately' in b.paymentPlans[0]).toBe(false);
  });

  it('createPaymentPlan omits empty-string taxType', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 1 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createPaymentPlan({
      name: 'X',
      type: 'subscription',
      currency: 'CAD',
      recurringAmount: 1,
      billingPeriod: 'monthly',
      dateBilling: 'S',
      termType: 'forever',
      taxType: '' as any,
    });
    const b = bodyOf(calls[0]);
    expect('taxType' in b.paymentPlans[0]).toBe(false);
  });

  it('createPaymentPlan omits empty-string taxCalculation', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 1 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createPaymentPlan({
      name: 'X',
      type: 'subscription',
      currency: 'CAD',
      recurringAmount: 1,
      billingPeriod: 'monthly',
      dateBilling: 'S',
      termType: 'forever',
      taxCalculation: '' as any,
    });
    const b = bodyOf(calls[0]);
    expect('taxCalculation' in b.paymentPlans[0]).toBe(false);
  });

  it('createPaymentPlan omits empty-string paymentMethod', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 1 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createPaymentPlan({
      name: 'X',
      type: 'subscription',
      currency: 'CAD',
      recurringAmount: 1,
      billingPeriod: 'monthly',
      dateBilling: 'S',
      termType: 'forever',
      paymentMethod: '' as any,
    });
    const b = bodyOf(calls[0]);
    expect('paymentMethod' in b.paymentPlans[0]).toBe(false);
  });

  it('createPaymentPlan omits empty-string businessEmail', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 1 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createPaymentPlan({
      name: 'X',
      type: 'subscription',
      currency: 'CAD',
      recurringAmount: 1,
      billingPeriod: 'monthly',
      dateBilling: 'S',
      termType: 'forever',
      businessEmail: '',
    });
    const b = bodyOf(calls[0]);
    expect('businessEmail' in b.paymentPlans[0]).toBe(false);
  });

  it('createPaymentPlan omits empty-string isProrated', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 1 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createPaymentPlan({
      name: 'X',
      type: 'subscription',
      currency: 'CAD',
      recurringAmount: 1,
      billingPeriod: 'monthly',
      dateBilling: 'S',
      termType: 'forever',
      isProrated: '' as any,
    });
    const b = bodyOf(calls[0]);
    expect('isProrated' in b.paymentPlans[0]).toBe(false);
  });

  it('createPaymentPlan includes empty-array addOnIds (arrays are truthy)', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 1 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createPaymentPlan({
      name: 'X',
      type: 'subscription',
      currency: 'CAD',
      recurringAmount: 1,
      billingPeriod: 'monthly',
      dateBilling: 'S',
      termType: 'forever',
      addOnIds: [],
    });
    const b = bodyOf(calls[0]);
    // Empty arrays are truthy, so the guard includes them
    expect('addOnIds' in b.paymentPlans[0]).toBe(true);
  });

  it('createPaymentPlan omits empty-string addOnIds', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 1 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createPaymentPlan({
      name: 'X',
      type: 'subscription',
      currency: 'CAD',
      recurringAmount: 1,
      billingPeriod: 'monthly',
      dateBilling: 'S',
      termType: 'forever',
      addOnIds: '' as any,
    });
    const b = bodyOf(calls[0]);
    expect('addOnIds' in b.paymentPlans[0]).toBe(false);
  });

  // ─── createSubscription ────────────────────────────────────────────────────

  it('createSubscription omits empty-string dateActivated', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 10 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createSubscription({ paymentPlanId: 5, customerCode: 'C', dateActivated: '' });
    const b = bodyOf(calls[0]);
    expect('dateActivated' in b.subscriptions[0]).toBe(false);
  });

  it('createSubscription omits empty-string paymentMethod', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 10 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createSubscription({ paymentPlanId: 5, customerCode: 'C', paymentMethod: '' as any });
    const b = bodyOf(calls[0]);
    expect('paymentMethod' in b.subscriptions[0]).toBe(false);
  });

  it('createSubscription includes empty-array addOns (arrays are truthy)', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 10 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createSubscription({ paymentPlanId: 5, customerCode: 'C', addOns: [] });
    const b = bodyOf(calls[0]);
    // Empty arrays are truthy, so the guard includes them
    expect('addOns' in b.subscriptions[0]).toBe(true);
  });

  it('createSubscription omits empty-string addOns', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 10 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createSubscription({ paymentPlanId: 5, customerCode: 'C', addOns: '' as any });
    const b = bodyOf(calls[0]);
    expect('addOns' in b.subscriptions[0]).toBe(false);
  });

  // ─── createBankAccount ─────────────────────────────────────────────────────

  it('createBankAccount omits empty-string bankFinancialNumber', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: { id: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createBankAccount(1, {
      accountCorporate: 1,
      accountType: 1,
      bankAccountNumber: '123',
      city: 'C',
      countryAlpha2: 'CA',
      provinceAlpha2: 'AB',
      postalCode: 'H0H0H0',
      streetAddress: '1 St',
      bankFinancialNumber: '',
    });
    assertBodyFieldAbsent(calls[0], 'bankFinancialNumber');
  });

  it('createBankAccount omits empty-string bankTransitNumber', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: { id: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createBankAccount(1, {
      accountCorporate: 1,
      accountType: 1,
      bankAccountNumber: '123',
      city: 'C',
      countryAlpha2: 'CA',
      provinceAlpha2: 'AB',
      postalCode: 'H0H0H0',
      streetAddress: '1 St',
      bankTransitNumber: '',
    });
    assertBodyFieldAbsent(calls[0], 'bankTransitNumber');
  });

  it('createBankAccount omits empty-string bankRoutingNumber', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: { id: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createBankAccount(1, {
      accountCorporate: 1,
      accountType: 1,
      bankAccountNumber: '123',
      city: 'C',
      countryAlpha2: 'CA',
      provinceAlpha2: 'AB',
      postalCode: 'H0H0H0',
      streetAddress: '1 St',
      bankRoutingNumber: '',
    });
    assertBodyFieldAbsent(calls[0], 'bankRoutingNumber');
  });

  it('createBankAccount omits empty-string firstName', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: { id: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createBankAccount(1, {
      accountCorporate: 1,
      accountType: 1,
      bankAccountNumber: '123',
      city: 'C',
      countryAlpha2: 'CA',
      provinceAlpha2: 'AB',
      postalCode: 'H0H0H0',
      streetAddress: '1 St',
      firstName: '',
    });
    assertBodyFieldAbsent(calls[0], 'firstName');
  });

  it('createBankAccount omits empty-string lastName', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: { id: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createBankAccount(1, {
      accountCorporate: 1,
      accountType: 1,
      bankAccountNumber: '123',
      city: 'C',
      countryAlpha2: 'CA',
      provinceAlpha2: 'AB',
      postalCode: 'H0H0H0',
      streetAddress: '1 St',
      lastName: '',
    });
    assertBodyFieldAbsent(calls[0], 'lastName');
  });

  it('createBankAccount omits empty-string companyName', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: { id: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createBankAccount(1, {
      accountCorporate: 1,
      accountType: 1,
      bankAccountNumber: '123',
      city: 'C',
      countryAlpha2: 'CA',
      provinceAlpha2: 'AB',
      postalCode: 'H0H0H0',
      streetAddress: '1 St',
      companyName: '',
    });
    assertBodyFieldAbsent(calls[0], 'companyName');
  });

  // ─── processPurchase ───────────────────────────────────────────────────────

  it('processPurchase omits empty-string customerCode', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.processPurchase({
      amount: 10,
      currency: 'CAD',
      ipAddress: '1.1.1.1',
      cardData: { cardToken: 't' },
      customerCode: '',
    });
    assertBodyFieldAbsent(calls[0], 'customerCode');
  });

  it('processPurchase omits empty-string invoiceNumber', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.processPurchase({
      amount: 10,
      currency: 'CAD',
      ipAddress: '1.1.1.1',
      cardData: { cardToken: 't' },
      invoiceNumber: '',
    });
    assertBodyFieldAbsent(calls[0], 'invoiceNumber');
  });

  it('processPurchase omits null billingAddress', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.processPurchase({
      amount: 10,
      currency: 'CAD',
      ipAddress: '1.1.1.1',
      cardData: { cardToken: 't' },
      billingAddress: null as any,
    });
    assertBodyFieldAbsent(calls[0], 'billingAddress');
  });

  it('processPurchase omits null invoiceRequest', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.processPurchase({
      amount: 10,
      currency: 'CAD',
      ipAddress: '1.1.1.1',
      cardData: { cardToken: 't' },
      invoiceRequest: null as any,
    });
    assertBodyFieldAbsent(calls[0], 'invoiceRequest');
  });

  // ─── processPreauth ────────────────────────────────────────────────────────

  it('processPreauth omits empty-string customerCode', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.processPreauth({
      amount: 10,
      currency: 'CAD',
      ipAddress: '1.1.1.1',
      cardData: { cardToken: 't' },
      customerCode: '',
    });
    assertBodyFieldAbsent(calls[0], 'customerCode');
  });

  it('processPreauth omits empty-string invoiceNumber', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.processPreauth({
      amount: 10,
      currency: 'CAD',
      ipAddress: '1.1.1.1',
      cardData: { cardToken: 't' },
      invoiceNumber: '',
    });
    assertBodyFieldAbsent(calls[0], 'invoiceNumber');
  });

  it('processPreauth omits null billingAddress', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.processPreauth({
      amount: 10,
      currency: 'CAD',
      ipAddress: '1.1.1.1',
      cardData: { cardToken: 't' },
      billingAddress: null as any,
    });
    assertBodyFieldAbsent(calls[0], 'billingAddress');
  });

  // ─── refundPurchase ────────────────────────────────────────────────────────

  it('refundPurchase omits empty-string customerCode', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.refundPurchase({
      cardTransactionId: 1,
      amount: 25,
      ipAddress: '1.1.1.1',
      customerCode: '',
    });
    assertBodyFieldAbsent(calls[0], 'customerCode');
  });

  it('refundPurchase omits empty-string invoiceNumber', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.refundPurchase({
      cardTransactionId: 1,
      amount: 25,
      ipAddress: '1.1.1.1',
      invoiceNumber: '',
    });
    assertBodyFieldAbsent(calls[0], 'invoiceNumber');
  });

  // ─── createInvoice ─────────────────────────────────────────────────────────

  it('createInvoice omits empty-string invoiceNumber', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 1 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createInvoice({
      customerCode: 'C',
      lineItems: [{ description: 'x', quantity: 1, price: 5, total: 5 }],
      invoiceNumber: '',
    });
    assertBodyFieldAbsent(calls[0], 'invoiceNumber');
  });

  it('createInvoice omits empty-string notes', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: [{ id: 1 }] } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.createInvoice({
      customerCode: 'C',
      lineItems: [{ description: 'x', quantity: 1, price: 5, total: 5 }],
      notes: '',
    });
    assertBodyFieldAbsent(calls[0], 'notes');
  });

  // ─── processACHWithdraw ────────────────────────────────────────────────────

  it('processACHWithdraw omits undefined orderId', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { id: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.processACHWithdraw({
      bankAccountId: 1,
      customerId: 1,
      amount: 10,
      currencyId: 1,
      orderId: undefined,
    });
    assertBodyFieldAbsent(calls[0], 'orderId');
  });

  // ─── capturePreauth ────────────────────────────────────────────────────────

  it('capturePreauth omits undefined orderId', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { transaction: { transactionId: 1 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.capturePreauth({
      cardTransactionId: 1,
      amount: 50,
      currency: 'CAD',
      ipAddress: '1.1.1.1',
      orderId: undefined,
    });
    assertBodyFieldAbsent(calls[0], 'orderId');
  });

  // ─── updatePAD ─────────────────────────────────────────────────────────────

  it('updatePAD omits undefined accepted', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: { id: 5 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.updatePAD(1, 5, { status: 1, accepted: undefined });
    assertBodyFieldAbsent(calls[0], 'accepted');
  });

  it('updatePAD omits undefined status', async () => {
    const { fetchImpl, calls } = mockFetch({ body: { data: { id: 5 } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await c.updatePAD(1, 5, { accepted: true, status: undefined });
    assertBodyFieldAbsent(calls[0], 'status');
  });
});
