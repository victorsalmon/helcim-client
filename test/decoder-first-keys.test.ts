import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  decodeAddress,
  decodeCard,
  decodeCustomer,
  decodeCardTransaction,
  decodePaymentPlan,
  decodeSubscription,
  decodeSubscriptionPayment,
  decodeBankAccount,
  decodePADAgreement,
  decodeACHTransaction,
  decodeInvoice,
  createHelcimClient,
} from '../src/index.js';
import { TEST_CONFIG, mockFetch, bodyOf } from './helpers.js';

beforeEach(() => vi.restoreAllMocks());

// ─── First-key isolation tests for decoders ──────────────────────────────────
// These kill StringLiteral mutants that change the FIRST key in firstString/
// firstNumber/firstArray call to "". The existing tests provide alternate keys
// (PascalCase, snake_case) which are still found when the first key is mutated.
// These tests provide ONLY the first (camelCase) key for each field.

describe('decodeAddress — first-key isolation', () => {
  const base = { name: 'N', street1: 'S1', postalCode: 'P' };

  it('decodes street2 from "street2" (first key only)', () => {
    expect(decodeAddress({ ...base, street2: 'A' })?.street2).toBe('A');
  });
  it('decodes city from "city" (first key only)', () => {
    expect(decodeAddress({ ...base, city: 'Toronto' })?.city).toBe('Toronto');
  });
  it('decodes province from "province" (first key only)', () => {
    expect(decodeAddress({ ...base, province: 'ON' })?.province).toBe('ON');
  });
  it('decodes country from "country" (first key only)', () => {
    expect(decodeAddress({ ...base, country: 'CA' })?.country).toBe('CA');
  });
  it('decodes phone from "phone" (first key only)', () => {
    expect(decodeAddress({ ...base, phone: '555' })?.phone).toBe('555');
  });
  it('decodes email from "email" (first key only)', () => {
    expect(decodeAddress({ ...base, email: 'a@b.com' })?.email).toBe('a@b.com');
  });
});

describe('decodeCard — first-key isolation', () => {
  it('decodes id from "id" (first key only)', () => {
    expect(decodeCard({ id: 42 }).id).toBe(42);
  });
  it('decodes cardHolderName from "cardHolderName" (first key only)', () => {
    expect(decodeCard({ cardHolderName: 'Example' }).cardHolderName).toBe('Example');
  });
  it('decodes cardF6L4 from "cardF6L4" (first key only)', () => {
    expect(decodeCard({ cardF6L4: '5454' }).cardF6L4).toBe('5454');
  });
  it('decodes cardToken from "cardToken" (first key only)', () => {
    expect(decodeCard({ cardToken: 'tok' }).cardToken).toBe('tok');
  });
  it('decodes cardExpiry from "cardExpiry" (first key only)', () => {
    expect(decodeCard({ cardExpiry: '1257' }).cardExpiry).toBe('1257');
  });
  it('decodes dateCreated from "dateCreated" (first key only)', () => {
    expect(decodeCard({ dateCreated: '2024-01-01' }).dateCreated).toBe('2024-01-01');
  });
  it('decodes dateUpdated from "dateUpdated" (first key only)', () => {
    expect(decodeCard({ dateUpdated: '2024-01-02' }).dateUpdated).toBe('2024-01-02');
  });
});

describe('decodeCustomer — first-key isolation', () => {
  it('decodes id from "id" (first key only)', () => {
    expect(decodeCustomer({ id: 42 }).id).toBe(42);
  });
  it('decodes customerCode from "customerCode" (first key only)', () => {
    expect(decodeCustomer({ customerCode: 'CST1' }).customerCode).toBe('CST1');
  });
  it('decodes businessName from "businessName" (first key only)', () => {
    expect(decodeCustomer({ businessName: 'Example Inc.' }).businessName).toBe('Example Inc.');
  });
  it('decodes contactName from "contactName" (first key only)', () => {
    expect(decodeCustomer({ contactName: 'Example' }).contactName).toBe('Example');
  });
  it('decodes cellPhone from "cellPhone" (first key only)', () => {
    expect(decodeCustomer({ cellPhone: '555' }).cellPhone).toBe('555');
  });
  it('decodes cards from "cards" (first key only)', () => {
    expect(decodeCustomer({ cards: [{ id: 1 }] }).cards).toHaveLength(1);
    expect(decodeCustomer({ cards: [{ id: 1 }] }).cards[0].id).toBe(1);
  });
  it('decodes billingAddress from "billingAddress" (first key only)', () => {
    expect(decodeCustomer({ billingAddress: { name: 'J', street1: '1 St', postalCode: 'H0H' } }).billingAddress?.name).toBe('J');
  });
  it('decodes shippingAddress from "shippingAddress" (first key only)', () => {
    expect(decodeCustomer({ shippingAddress: { name: 'J', street1: '2 St', postalCode: 'H0H' } }).shippingAddress?.name).toBe('J');
  });
});

describe('decodeCardTransaction — first-key isolation', () => {
  it('decodes transactionId from "transactionId" (first key only)', () => {
    expect(decodeCardTransaction({ transactionId: 42 }).transactionId).toBe(42);
  });
  it('decodes cardBatchId from "cardBatchId" (first key only)', () => {
    expect(decodeCardTransaction({ cardBatchId: 5 }).cardBatchId).toBe(5);
  });
  it('decodes dateCreated from "dateCreated" (first key only)', () => {
    expect(decodeCardTransaction({ dateCreated: '2024-01-01' }).dateCreated).toBe('2024-01-01');
  });
  it('decodes status from "status" (first key only)', () => {
    expect(decodeCardTransaction({ status: 'APPROVED' }).status).toBe('APPROVED');
  });
  it('decodes type from "type" (first key only)', () => {
    expect(decodeCardTransaction({ type: 'purchase' }).type).toBe('purchase');
  });
  it('decodes amount from "amount" (first key only)', () => {
    expect(decodeCardTransaction({ amount: 100 }).amount).toBe(100);
  });
  it('decodes currency from "currency" (first key only)', () => {
    expect(decodeCardTransaction({ currency: 'CAD' }).currency).toBe('CAD');
  });
  it('decodes avsResponse from "avsResponse" (first key only)', () => {
    expect(decodeCardTransaction({ avsResponse: 'X' }).avsResponse).toBe('X');
  });
  it('decodes cvvResponse from "cvvResponse" (first key only)', () => {
    expect(decodeCardTransaction({ cvvResponse: 'M' }).cvvResponse).toBe('M');
  });
  it('decodes cardType from "cardType" (first key only)', () => {
    expect(decodeCardTransaction({ cardType: 'Visa' }).cardType).toBe('Visa');
  });
  it('decodes approvalCode from "approvalCode" (first key only)', () => {
    expect(decodeCardTransaction({ approvalCode: '1234' }).approvalCode).toBe('1234');
  });
  it('decodes cardToken from "cardToken" (first key only)', () => {
    expect(decodeCardTransaction({ cardToken: 'tok' }).cardToken).toBe('tok');
  });
  it('decodes cardNumber from "cardNumber" (first key only)', () => {
    expect(decodeCardTransaction({ cardNumber: '5454' }).cardNumber).toBe('5454');
  });
  it('decodes cardHolderName from "cardHolderName" (first key only)', () => {
    expect(decodeCardTransaction({ cardHolderName: 'Example' }).cardHolderName).toBe('Example');
  });
  it('decodes customerCode from "customerCode" (first key only)', () => {
    expect(decodeCardTransaction({ customerCode: 'CST1' }).customerCode).toBe('CST1');
  });
  it('decodes invoiceNumber from "invoiceNumber" (first key only)', () => {
    expect(decodeCardTransaction({ invoiceNumber: 'INV1' }).invoiceNumber).toBe('INV1');
  });
  it('decodes warning from "warning" (first key only)', () => {
    expect(decodeCardTransaction({ warning: 'test' }).warning).toBe('test');
  });
});

describe('decodePaymentPlan — first-key isolation', () => {
  it('decodes id from "id" (first key only)', () => {
    expect(decodePaymentPlan({ id: 42 }).id).toBe(42);
  });
  it('decodes dateCreated from "dateCreated" (first key only)', () => {
    expect(decodePaymentPlan({ dateCreated: '2024-01-01' }).dateCreated).toBe('2024-01-01');
  });
  it('decodes dateUpdated from "dateUpdated" (first key only)', () => {
    expect(decodePaymentPlan({ dateUpdated: '2024-01-02' }).dateUpdated).toBe('2024-01-02');
  });
  it('decodes name from "name" (first key only)', () => {
    expect(decodePaymentPlan({ name: 'Pro' }).name).toBe('Pro');
  });
  it('decodes description from "description" (first key only)', () => {
    expect(decodePaymentPlan({ description: 'desc' }).description).toBe('desc');
  });
  it('decodes type from "type" (first key only)', () => {
    expect(decodePaymentPlan({ type: 'subscription' }).type).toBe('subscription');
  });
  it('decodes status from "status" (first key only)', () => {
    expect(decodePaymentPlan({ status: 'active' }).status).toBe('active');
  });
  it('decodes currency from "currency" (first key only)', () => {
    expect(decodePaymentPlan({ currency: 'CAD' }).currency).toBe('CAD');
  });
  it('decodes cardTerminalId from "cardTerminalId" (first key only)', () => {
    expect(decodePaymentPlan({ cardTerminalId: 5 }).cardTerminalId).toBe(5);
  });
  it('decodes setupAmount from "setupAmount" (first key only)', () => {
    expect(decodePaymentPlan({ setupAmount: 20 }).setupAmount).toBe(20);
  });
  it('decodes recurringAmount from "recurringAmount" (first key only)', () => {
    expect(decodePaymentPlan({ recurringAmount: 10 }).recurringAmount).toBe(10);
  });
  it('decodes billSetupImmediately from "billSetupImmediately" (first key only)', () => {
    expect(decodePaymentPlan({ billSetupImmediately: 'immediate' }).billSetupImmediately).toBe('immediate');
  });
  it('decodes billingPeriod from "billingPeriod" (first key only)', () => {
    expect(decodePaymentPlan({ billingPeriod: 'monthly' }).billingPeriod).toBe('monthly');
  });
  it('decodes billingPeriodIncrements from "billingPeriodIncrements" (first key only)', () => {
    expect(decodePaymentPlan({ billingPeriodIncrements: 12 }).billingPeriodIncrements).toBe(12);
  });
  it('decodes dateBilling from "dateBilling" (first key only)', () => {
    expect(decodePaymentPlan({ dateBilling: '2024-01-01' }).dateBilling).toBe('2024-01-01');
  });
  it('decodes termType from "termType" (first key only)', () => {
    expect(decodePaymentPlan({ termType: 'forever' }).termType).toBe('forever');
  });
  it('decodes freeTrialPeriod from "freeTrialPeriod" (first key only)', () => {
    expect(decodePaymentPlan({ freeTrialPeriod: 30 }).freeTrialPeriod).toBe(30);
  });
  it('decodes taxType from "taxType" (first key only)', () => {
    expect(decodePaymentPlan({ taxType: 'customer' }).taxType).toBe('customer');
  });
  it('decodes taxCalculation from "taxCalculation" (first key only)', () => {
    expect(decodePaymentPlan({ taxCalculation: 'country_only' }).taxCalculation).toBe('country_only');
  });
  it('decodes termLength from "termLength" (first key only)', () => {
    expect(decodePaymentPlan({ termLength: 365 }).termLength).toBe(365);
  });
  it('decodes paymentMethod from "paymentMethod" (first key only)', () => {
    expect(decodePaymentPlan({ paymentMethod: 'card' }).paymentMethod).toBe('card');
  });
  it('decodes businessEmail from "businessEmail" (first key only)', () => {
    expect(decodePaymentPlan({ businessEmail: 'biz@test.com' }).businessEmail).toBe('biz@test.com');
  });
  it('decodes addOnIds from "addOnIds" (first key only)', () => {
    expect(decodePaymentPlan({ addOnIds: [1, 2] }).addOnIds).toEqual([1, 2]);
  });

  it('coerces string addOnIds to numbers', () => {
    expect(decodePaymentPlan({ addOnIds: ['1', '2'] }).addOnIds).toEqual([1, 2]);
    expect(decodePaymentPlan({ addOnIds: ['not-a-number', '5'] }).addOnIds).toEqual([0, 5]);
    expect(decodePaymentPlan({ addOnIds: ['abc'] }).addOnIds).toEqual([0]);
  });
  it('decodes isProrated from "isProrated" (first key only)', () => {
    expect(decodePaymentPlan({ isProrated: 'yes' }).isProrated).toBe('yes');
  });
});

describe('decodeSubscriptionPayment — first-key isolation', () => {
  it('decodes id from "id" (first key only)', () => {
    expect(decodeSubscriptionPayment({ id: 42 }).id).toBe(42);
  });
  it('decodes setupAmount from "setupAmount" (first key only)', () => {
    expect(decodeSubscriptionPayment({ setupAmount: 20 }).setupAmount).toBe(20);
  });
  it('decodes recurringAmount from "recurringAmount" (first key only)', () => {
    expect(decodeSubscriptionPayment({ recurringAmount: 10 }).recurringAmount).toBe(10);
  });
  it('decodes addOnAmount from "addOnAmount" (first key only)', () => {
    expect(decodeSubscriptionPayment({ addOnAmount: 5 }).addOnAmount).toBe(5);
  });
  it('decodes amount from "amount" (first key only)', () => {
    expect(decodeSubscriptionPayment({ amount: 100 }).amount).toBe(100);
  });
  it('decodes taxAmount from "taxAmount" (first key only)', () => {
    expect(decodeSubscriptionPayment({ taxAmount: 5 }).taxAmount).toBe(5);
  });
  it('decodes status from "status" (first key only)', () => {
    expect(decodeSubscriptionPayment({ status: 'approved' }).status).toBe('approved');
  });
  it('decodes dateDue from "dateDue" (first key only)', () => {
    expect(decodeSubscriptionPayment({ dateDue: '2024-01-01' }).dateDue).toBe('2024-01-01');
  });
  it('decodes dateProcessed from "dateProcessed" (first key only)', () => {
    expect(decodeSubscriptionPayment({ dateProcessed: '2024-01-02' }).dateProcessed).toBe('2024-01-02');
  });
  it('decodes paymentNumber from "paymentNumber" (first key only)', () => {
    expect(decodeSubscriptionPayment({ paymentNumber: 3 }).paymentNumber).toBe(3);
  });
  it('decodes numberOfRetries from "numberOfRetries" (first key only)', () => {
    expect(decodeSubscriptionPayment({ numberOfRetries: 2 }).numberOfRetries).toBe(2);
  });
});

describe('decodeSubscription — first-key isolation', () => {
  it('decodes id from "id" (first key only)', () => {
    expect(decodeSubscription({ id: 42 }).id).toBe(42);
  });
  it('decodes dateCreated from "dateCreated" (first key only)', () => {
    expect(decodeSubscription({ dateCreated: '2024-01-01' }).dateCreated).toBe('2024-01-01');
  });
  it('decodes dateUpdated from "dateUpdated" (first key only)', () => {
    expect(decodeSubscription({ dateUpdated: '2024-01-02' }).dateUpdated).toBe('2024-01-02');
  });
  it('decodes dateActivated from "dateActivated" (first key only)', () => {
    expect(decodeSubscription({ dateActivated: '2024-01-01' }).dateActivated).toBe('2024-01-01');
  });
  it('decodes dateBilling from "dateBilling" (first key only)', () => {
    expect(decodeSubscription({ dateBilling: '2024-01-01' }).dateBilling).toBe('2024-01-01');
  });
  it('decodes status from "status" (first key only)', () => {
    expect(decodeSubscription({ status: 'active' }).status).toBe('active');
  });
  it('decodes paymentPlanId from "paymentPlanId" (first key only)', () => {
    expect(decodeSubscription({ paymentPlanId: 5 }).paymentPlanId).toBe(5);
  });
  it('decodes customerCode from "customerCode" (first key only)', () => {
    expect(decodeSubscription({ customerCode: 'CST1' }).customerCode).toBe('CST1');
  });
  it('decodes timesBilled from "timesBilled" (first key only)', () => {
    expect(decodeSubscription({ timesBilled: 3 }).timesBilled).toBe(3);
  });
  it('decodes setupAmount from "setupAmount" (first key only)', () => {
    expect(decodeSubscription({ setupAmount: 20 }).setupAmount).toBe(20);
  });
  it('decodes recurringAmount from "recurringAmount" (first key only)', () => {
    expect(decodeSubscription({ recurringAmount: 10 }).recurringAmount).toBe(10);
  });
  it('decodes freeTrialPeriod from "freeTrialPeriod" (first key only)', () => {
    expect(decodeSubscription({ freeTrialPeriod: 30 }).freeTrialPeriod).toBe(30);
  });
  it('decodes hasFailedPayments from "hasFailedPayments" (first key only)', () => {
    expect(decodeSubscription({ hasFailedPayments: 'yes' }).hasFailedPayments).toBe('yes');
  });
  it('decodes isProrated from "isProrated" (first key only)', () => {
    expect(decodeSubscription({ isProrated: 'yes' }).isProrated).toBe('yes');
  });
  it('decodes addOnIds from "addOnIds" (first key only)', () => {
    expect(decodeSubscription({ addOnIds: [1, 2] }).addOnIds).toEqual([1, 2]);
  });

  it('coerces string addOnIds to numbers', () => {
    expect(decodeSubscription({ addOnIds: ['1', '2'] }).addOnIds).toEqual([1, 2]);
    expect(decodeSubscription({ addOnIds: ['not-a-number', '5'] }).addOnIds).toEqual([0, 5]);
  });
  it('decodes payments from "payments" (first key only)', () => {
    expect(decodeSubscription({ payments: [{ id: 1 }] }).payments).toHaveLength(1);
    expect(decodeSubscription({ payments: [{ id: 1 }] }).payments[0].id).toBe(1);
  });
});

describe('decodeBankAccount — first-key isolation', () => {
  it('decodes id from "id" (first key only)', () => {
    expect(decodeBankAccount({ id: 42 }).id).toBe(42);
  });
  it('decodes customerId from "customerId" (first key only)', () => {
    expect(decodeBankAccount({ customerId: 5 }).customerId).toBe(5);
  });
  it('decodes dateCreated from "dateCreated" (first key only)', () => {
    expect(decodeBankAccount({ dateCreated: '2024-01-01' }).dateCreated).toBe('2024-01-01');
  });
  it('decodes dateUpdated from "dateUpdated" (first key only)', () => {
    expect(decodeBankAccount({ dateUpdated: '2024-01-02' }).dateUpdated).toBe('2024-01-02');
  });
  it('decodes dateLastUsed from "dateLastUsed" (first key only)', () => {
    expect(decodeBankAccount({ dateLastUsed: '2024-01-03' }).dateLastUsed).toBe('2024-01-03');
  });
  it('decodes dateVerified from "dateVerified" (first key only)', () => {
    expect(decodeBankAccount({ dateVerified: '2024-01-04' }).dateVerified).toBe('2024-01-04');
  });
  it('decodes bankToken from "bankToken" (first key only)', () => {
    expect(decodeBankAccount({ bankToken: 'tok' }).bankToken).toBe('tok');
  });
  it('decodes accountType from "accountType" (first key only)', () => {
    expect(decodeBankAccount({ accountType: 'CHECKING' }).accountType).toBe('CHECKING');
  });
  it('decodes accountCorporate from "accountCorporate" (first key only)', () => {
    expect(decodeBankAccount({ accountCorporate: 'PERSONAL' }).accountCorporate).toBe('PERSONAL');
  });
  it('decodes verified from "verified" (first key only)', () => {
    expect(decodeBankAccount({ verified: 1 }).verified).toBe(true);
    expect(decodeBankAccount({ verified: 0 }).verified).toBe(false);
  });
  it('decodes ready from "ready" (first key only)', () => {
    expect(decodeBankAccount({ ready: 1 }).ready).toBe(true);
    expect(decodeBankAccount({ ready: 0 }).ready).toBe(false);
  });
  it('decodes bankIdNumber from "bankIdNumber" (first key only)', () => {
    expect(decodeBankAccount({ bankIdNumber: '003' }).bankIdNumber).toBe('003');
  });
  it('decodes transitNumber from "transitNumber" (first key only)', () => {
    expect(decodeBankAccount({ transitNumber: '23456' }).transitNumber).toBe('23456');
  });
  it('decodes routingNumber from "routingNumber" (first key only)', () => {
    expect(decodeBankAccount({ routingNumber: '123456789' }).routingNumber).toBe('123456789');
  });
  it('decodes bankAccountNumberL4 from "bankAccountNumberL4l4" (first key only)', () => {
    expect(decodeBankAccount({ bankAccountNumberL4l4: '1234' }).bankAccountNumberL4).toBe('1234');
  });
  it('decodes address from "address" (first key only)', () => {
    expect(decodeBankAccount({ address: { name: 'J', street1: '1 St', postalCode: 'H0H' } }).address?.name).toBe('J');
  });
});

describe('decodePADAgreement — first-key isolation', () => {
  it('decodes id from "id" (first key only)', () => {
    expect(decodePADAgreement({ id: 42 }).id).toBe(42);
  });
  it('decodes accepted from "accepted" (first key only)', () => {
    expect(decodePADAgreement({ accepted: 1 }).accepted).toBe(true);
    expect(decodePADAgreement({ accepted: 0 }).accepted).toBe(false);
  });
  it('decodes bankAccountId from "bankAccountId" (first key only)', () => {
    expect(decodePADAgreement({ bankAccountId: 5 }).bankAccountId).toBe(5);
  });
  it('decodes customerId from "customerId" (first key only)', () => {
    expect(decodePADAgreement({ customerId: 10 }).customerId).toBe(10);
  });
  it('decodes dateAccepted from "dateAccepted" (first key only)', () => {
    expect(decodePADAgreement({ dateAccepted: '2024-01-01' }).dateAccepted).toBe('2024-01-01');
  });
  it('decodes dateCreated from "dateCreated" (first key only)', () => {
    expect(decodePADAgreement({ dateCreated: '2024-01-01' }).dateCreated).toBe('2024-01-01');
  });
  it('decodes dateEarliestDebit from "dateEarliestDebit" (first key only)', () => {
    expect(decodePADAgreement({ dateEarliestDebit: '2024-01-02' }).dateEarliestDebit).toBe('2024-01-02');
  });
  it('decodes dateRevoked from "dateRevoked" (first key only)', () => {
    expect(decodePADAgreement({ dateRevoked: '2024-01-03' }).dateRevoked).toBe('2024-01-03');
  });
  it('decodes dateUpdated from "dateUpdated" (first key only)', () => {
    expect(decodePADAgreement({ dateUpdated: '2024-01-04' }).dateUpdated).toBe('2024-01-04');
  });
  it('decodes ipAddress from "ipAddress" (first key only)', () => {
    expect(decodePADAgreement({ ipAddress: '1.1.1.1' }).ipAddress).toBe('1.1.1.1');
  });
  it('decodes merchantAuthorized from "merchantAuthorized" (first key only)', () => {
    expect(decodePADAgreement({ merchantAuthorized: 1 }).merchantAuthorized).toBe(true);
    expect(decodePADAgreement({ merchantAuthorized: 0 }).merchantAuthorized).toBe(false);
  });
  it('decodes type from "type" (first key only)', () => {
    expect(decodePADAgreement({ type: 1 }).type).toBe(1);
  });
  it('decodes status from "status" (first key only)', () => {
    expect(decodePADAgreement({ status: 2 }).status).toBe(2);
  });
});

describe('decodeACHTransaction — first-key isolation', () => {
  it('decodes id from "id" (first key only)', () => {
    expect(decodeACHTransaction({ id: 42 }).id).toBe(42);
  });
  it('decodes merchantId from "merchantId" (first key only)', () => {
    expect(decodeACHTransaction({ merchantId: 5 }).merchantId).toBe(5);
  });
  it('decodes dateCreated from "dateCreated" (first key only)', () => {
    expect(decodeACHTransaction({ dateCreated: '2024-01-01' }).dateCreated).toBe('2024-01-01');
  });
  it('decodes statusAuth from "statusAuth" (first key only)', () => {
    expect(decodeACHTransaction({ statusAuth: 1 }).statusAuth).toBe(1);
  });
  it('decodes statusClearing from "statusClearing" (first key only)', () => {
    expect(decodeACHTransaction({ statusClearing: 0 }).statusClearing).toBe(0);
  });
  it('decodes batchId from "batchId" (first key only)', () => {
    expect(decodeACHTransaction({ batchId: 10 }).batchId).toBe(10);
  });
  it('decodes bankAccountId from "bankAccountId" (first key only)', () => {
    expect(decodeACHTransaction({ bankAccountId: 20 }).bankAccountId).toBe(20);
  });
  it('decodes bankAccountL4 from "bankAccountL4l4" (first key only)', () => {
    expect(decodeACHTransaction({ bankAccountL4l4: '1234' }).bankAccountL4).toBe('1234');
  });
  it('decodes transactionType from "transactionType" (first key only)', () => {
    expect(decodeACHTransaction({ transactionType: 1 }).transactionType).toBe(1);
  });
  it('decodes amount from "amount" (first key only)', () => {
    expect(decodeACHTransaction({ amount: 100 }).amount).toBe(100);
  });
  it('decodes currency from "currency" (first key only)', () => {
    expect(decodeACHTransaction({ currency: 1 }).currency).toBe(1);
  });
  it('decodes approvalCode from "approvalCode" (first key only)', () => {
    expect(decodeACHTransaction({ approvalCode: '1234' }).approvalCode).toBe('1234');
  });
  it('decodes test from "test" (first key only)', () => {
    expect(decodeACHTransaction({ test: 1 }).test).toBe(true);
    expect(decodeACHTransaction({ test: 0 }).test).toBe(false);
  });
  it('decodes acquirerTransactionId from "acquirerTransactionId" (first key only)', () => {
    expect(decodeACHTransaction({ acquirerTransactionId: 'abc' }).acquirerTransactionId).toBe('abc');
  });
  it('decodes responseMessage from "responseMessage" (first key only)', () => {
    expect(decodeACHTransaction({ responseMessage: 'ok' }).responseMessage).toBe('ok');
  });
  it('decodes statusBatch from "statusBatch" (first key only)', () => {
    expect(decodeACHTransaction({ statusBatch: 1 }).statusBatch).toBe(1);
  });
  it('decodes dateClosed from "dateClosed" (first key only)', () => {
    expect(decodeACHTransaction({ dateClosed: '2024-01-01' }).dateClosed).toBe('2024-01-01');
  });
  it('decodes customerCode from "customerCode" (first key only)', () => {
    expect(decodeACHTransaction({ customerCode: 'CST1' }).customerCode).toBe('CST1');
  });
  it('decodes invoiceNumber from "invoiceNumber" (first key only)', () => {
    expect(decodeACHTransaction({ invoiceNumber: 'INV1' }).invoiceNumber).toBe('INV1');
  });
  it('decodes orderId from "orderId" (first key only)', () => {
    expect(decodeACHTransaction({ orderId: 99 }).orderId).toBe(99);
  });
});

describe('decodeInvoice — first-key isolation', () => {
  it('decodes id from "id" (first key only)', () => {
    expect(decodeInvoice({ id: 42 }).id).toBe(42);
  });
  it('decodes invoiceNumber from "invoiceNumber" (first key only)', () => {
    expect(decodeInvoice({ invoiceNumber: 'INV1' }).invoiceNumber).toBe('INV1');
  });
  it('decodes customerId from "customerId" (first key only)', () => {
    expect(decodeInvoice({ customerId: 5 }).customerId).toBe(5);
  });
  it('decodes customerCode from "customerCode" (first key only)', () => {
    expect(decodeInvoice({ customerCode: 'CST1' }).customerCode).toBe('CST1');
  });
  it('decodes dateCreated from "dateCreated" (first key only)', () => {
    expect(decodeInvoice({ dateCreated: '2024-01-01' }).dateCreated).toBe('2024-01-01');
  });
  it('decodes dateUpdated from "dateUpdated" (first key only)', () => {
    expect(decodeInvoice({ dateUpdated: '2024-01-02' }).dateUpdated).toBe('2024-01-02');
  });
  it('decodes status from "status" (first key only)', () => {
    expect(decodeInvoice({ status: 'paid' }).status).toBe('paid');
  });
  it('decodes amount from "amount" (first key only)', () => {
    expect(decodeInvoice({ amount: 100 }).amount).toBe(100);
  });
  it('decodes currency from "currency" (first key only)', () => {
    expect(decodeInvoice({ currency: 'CAD' }).currency).toBe('CAD');
  });
  it('decodes notes from "notes" (first key only)', () => {
    expect(decodeInvoice({ notes: 'note' }).notes).toBe('note');
  });
  it('decodes lineItems from "lineItems" (first key only)', () => {
    expect(decodeInvoice({ lineItems: [{ description: 'x' }] }).lineItems).toHaveLength(1);
  });
  it('decodes line item first keys', () => {
    const inv = decodeInvoice({ lineItems: [{
      sku: 'abc', description: 'desc', quantity: 2, price: 5, total: 10,
      taxAmount: 1, discountAmount: 2,
    }] });
    expect(inv.lineItems[0].sku).toBe('abc');
    expect(inv.lineItems[0].description).toBe('desc');
    expect(inv.lineItems[0].quantity).toBe(2);
    expect(inv.lineItems[0].price).toBe(5);
    expect(inv.lineItems[0].total).toBe(10);
    expect(inv.lineItems[0].taxAmount).toBe(1);
    expect(inv.lineItems[0].discountAmount).toBe(2);
  });
});

// ─── Error message exact-match tests ─────────────────────────────────────────
// These kill StringLiteral mutants that change the `name` parameter of
// assertPositiveAmount to "". The existing tests only check /positive finite/
// which matches both the original and mutated messages.

describe('assertPositiveAmount error messages', () => {
  it('initializeHelcimPay amount=0 throws with field name', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.initializeHelcimPay({ paymentType: 'purchase', amount: 0 }))
      .rejects.toThrow(/initializeHelcimPay amount/);
  });

  it('processACHWithdraw amount=0 throws with field name', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processACHWithdraw({ bankAccountId: 1, customerId: 1, amount: 0, currencyId: 1 }))
      .rejects.toThrow(/processACHWithdraw amount/);
  });

  it('refundACH amount=0 throws with field name', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.refundACH(1, 0)).rejects.toThrow(/refundACH amount/);
  });

  it('processPurchase amount=0 throws with field name', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processPurchase({ amount: 0, currency: 'CAD', ipAddress: '1.1.1.1', cardData: { cardToken: 't' } }))
      .rejects.toThrow(/processPurchase amount/);
  });

  it('processPreauth amount=0 throws with field name', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.processPreauth({ amount: 0, currency: 'CAD', ipAddress: '1.1.1.1', cardData: { cardToken: 't' } }))
      .rejects.toThrow(/processPreauth amount/);
  });

  it('capturePreauth amount=0 throws with field name', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.capturePreauth({ cardTransactionId: 1, amount: 0, currency: 'CAD', ipAddress: '1.1.1.1' }))
      .rejects.toThrow(/capturePreauth amount/);
  });

  it('refundPurchase amount=0 throws with field name', async () => {
    const { fetchImpl } = mockFetch({ body: {} });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    await expect(c.refundPurchase({ cardTransactionId: 1, amount: 0, ipAddress: '1.1.1.1' }))
      .rejects.toThrow(/refundPurchase amount/);
  });
});

// ─── createBankAccount response first-key tests ──────────────────────────────

describe('createBankAccount response first-key isolation', () => {
  const baseInput = {
    accountCorporate: 1 as const,
    accountType: 1 as const,
    bankAccountNumber: '123456789',
    city: 'Example City',
    countryAlpha2: 'CA',
    provinceAlpha2: 'AB',
    postalCode: 'A1A 1A1',
    streetAddress: '123 Example St',
  };

  it('reads id from "id" (first key) in response', async () => {
    const { fetchImpl } = mockFetch({ body: { data: { id: 456, message: 'ok' } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.createBankAccount(1, baseInput);
    expect(r.id).toBe(456);
  });

  it('reads message from "message" (first key) in response', async () => {
    const { fetchImpl } = mockFetch({ body: { data: { id: 1, message: 'created' } } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.createBankAccount(1, baseInput);
    expect(r.message).toBe('created');
  });

  it('reads id and message from raw object (no data wrapper)', async () => {
    const { fetchImpl } = mockFetch({ body: { id: 789, message: 'raw' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.createBankAccount(1, baseInput);
    expect(r.id).toBe(789);
    expect(r.message).toBe('raw');
  });
});

// ─── requestNewBankAccount response first-key test ───────────────────────────

describe('requestNewBankAccount response first-key isolation', () => {
  it('reads message from "message" (first key) in response', async () => {
    const { fetchImpl } = mockFetch({ body: { message: 'email sent' } });
    const c = createHelcimClient(TEST_CONFIG, fetchImpl);
    const r = await c.requestNewBankAccount(10);
    expect(r.message).toBe('email sent');
  });
});
