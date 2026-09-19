import { describe, it, expect } from 'vitest';
import {
  decodeAddress,
  decodeCard,
  decodeCustomer,
  decodeCardTransaction,
  decodePaymentPlan,
  decodeSubscriptionPayment,
  decodeSubscription,
  decodeBankAccount,
  decodePADAgreement,
  decodeACHTransaction,
  decodeInvoice,
} from '../src/index.js';

// ─── Decoder alternate-key tests ────────────────────────────────────────────
//
// Helcim's API responses use inconsistent key casing (camelCase, PascalCase,
// snake_case). Each decoder accepts multiple spellings via firstString/
// firstNumber fallback arrays. These tests feed a payload containing ONLY an
// alternate spelling for each field, so mutating any fallback key to "" causes
// the field to decode as null/0 instead of the provided value — killing the
// StringLiteral and ConditionalExpression mutants that the endpoint-level
// client tests (which only feed primary keys) leave alive.

describe('decodeAddress — alternate key spellings', () => {
  // decodeAddress requires name + street1 + postalCode (primary keys) to return
  // non-null, so alternate-key tests for optional fields keep the required trio.
  const base = { name: 'N', street1: 'S1', postalCode: 'P' };

  it('decodes name from "Name"', () => {
    expect(decodeAddress({ Name: 'Example', street1: 'S1', postalCode: 'P' })?.name).toBe(
      'Example'
    );
  });
  it('decodes street1 from "Street1" and "street_1"', () => {
    expect(decodeAddress({ name: 'N', Street1: 'X', postalCode: 'P' })?.street1).toBe('X');
    expect(decodeAddress({ name: 'N', street_1: 'Y', postalCode: 'P' })?.street1).toBe('Y');
  });
  it('decodes postalCode from "PostalCode" and "postal_code"', () => {
    expect(decodeAddress({ name: 'N', street1: 'S1', PostalCode: 'H0H' })?.postalCode).toBe('H0H');
    expect(decodeAddress({ name: 'N', street1: 'S1', postal_code: 'H1H' })?.postalCode).toBe('H1H');
  });
  it('decodes street2 from "Street2" and "street_2"', () => {
    expect(decodeAddress({ ...base, Street2: 'A' })?.street2).toBe('A');
    expect(decodeAddress({ ...base, street_2: 'B' })?.street2).toBe('B');
  });
  it('decodes city from "City"', () => {
    expect(decodeAddress({ ...base, City: 'Toronto' })?.city).toBe('Toronto');
  });
  it('decodes province from "Province"', () => {
    expect(decodeAddress({ ...base, Province: 'ON' })?.province).toBe('ON');
  });
  it('decodes country from "Country"', () => {
    expect(decodeAddress({ ...base, Country: 'CAN' })?.country).toBe('CAN');
  });
  it('decodes phone from "Phone"', () => {
    expect(decodeAddress({ ...base, Phone: '555' })?.phone).toBe('555');
  });
  it('decodes email from "Email"', () => {
    expect(decodeAddress({ ...base, Email: 'a@b.c' })?.email).toBe('a@b.c');
  });
  it('returns null when a required field is missing', () => {
    expect(decodeAddress({ street1: 'S1', postalCode: 'P' })).toBeNull();
    expect(decodeAddress({ name: 'N', postalCode: 'P' })).toBeNull();
    expect(decodeAddress({ name: 'N', street1: 'S1' })).toBeNull();
  });
  it('returns null for non-object input', () => {
    expect(decodeAddress(null)).toBeNull();
    expect(decodeAddress('x')).toBeNull();
    expect(decodeAddress([1, 2])).toBeNull();
  });
});

describe('decodeCard — alternate key spellings', () => {
  it('decodes id from "Id"', () => {
    expect(decodeCard({ Id: 7 }).id).toBe(7);
  });
  it('decodes cardHolderName from "cardHolder" and "card_holder_name"', () => {
    expect(decodeCard({ cardHolder: 'Example' }).cardHolderName).toBe('Example');
    expect(decodeCard({ card_holder_name: 'ExampleB' }).cardHolderName).toBe('ExampleB');
  });
  it('decodes cardF6L4 from "cardF4L6" and "card_f6l4"', () => {
    expect(decodeCard({ cardF4L6: '1234567890' }).cardF6L4).toBe('1234567890');
    expect(decodeCard({ card_f6l4: '0987654321' }).cardF6L4).toBe('0987654321');
  });
  it('decodes cardToken from "card_token"', () => {
    expect(decodeCard({ card_token: 'tok' }).cardToken).toBe('tok');
  });
  it('decodes cardExpiry from "card_expiry"', () => {
    expect(decodeCard({ card_expiry: '12/30' }).cardExpiry).toBe('12/30');
  });
  it('decodes dateCreated from "date_created"', () => {
    expect(decodeCard({ date_created: '2026-01-01' }).dateCreated).toBe('2026-01-01');
  });
  it('decodes dateUpdated from "date_updated"', () => {
    expect(decodeCard({ date_updated: '2026-01-02' }).dateUpdated).toBe('2026-01-02');
  });
});

describe('decodeCustomer — alternate key spellings', () => {
  it('decodes id from "Id"', () => {
    expect(decodeCustomer({ Id: 5 }).id).toBe(5);
  });
  it('decodes customerCode from "customer_code"', () => {
    expect(decodeCustomer({ customer_code: 'CST1' }).customerCode).toBe('CST1');
  });
  it('decodes businessName from "business_name"', () => {
    expect(decodeCustomer({ business_name: 'Example Inc.' }).businessName).toBe('Example Inc.');
  });
  it('decodes contactName from "contact_name"', () => {
    expect(decodeCustomer({ contact_name: 'Example' }).contactName).toBe('Example');
  });
  it('decodes cellPhone from "cellphone" and "cell_phone"', () => {
    expect(decodeCustomer({ cellphone: '555' }).cellPhone).toBe('555');
    expect(decodeCustomer({ cell_phone: '666' }).cellPhone).toBe('666');
  });
  it('decodes cards from "Cards"', () => {
    const c = decodeCustomer({ Cards: [{ id: 1, cardHolderName: 'A' }] });
    expect(c.cards).toHaveLength(1);
    expect(c.cards[0].id).toBe(1);
  });
  it('decodes billingAddress from "billing_address"', () => {
    const c = decodeCustomer({ billing_address: { name: 'N', street1: 'S', postalCode: 'P' } });
    expect(c.billingAddress?.name).toBe('N');
  });
  it('decodes shippingAddress from "shipping_address"', () => {
    const c = decodeCustomer({ shipping_address: { name: 'N', street1: 'S', postalCode: 'P' } });
    expect(c.shippingAddress?.name).toBe('N');
  });
});

describe('decodeCardTransaction — alternate key spellings', () => {
  it('decodes transactionId from "transaction_id"', () => {
    expect(decodeCardTransaction({ transaction_id: 99 }).transactionId).toBe(99);
  });
  it('decodes cardBatchId from "card_batch_id"', () => {
    expect(decodeCardTransaction({ card_batch_id: 3 }).cardBatchId).toBe(3);
  });
  it('decodes dateCreated from "date_created"', () => {
    expect(decodeCardTransaction({ date_created: '2026-01-01' }).dateCreated).toBe('2026-01-01');
  });
  it('decodes status from "Status"', () => {
    expect(decodeCardTransaction({ Status: 'APPROVED' }).status).toBe('APPROVED');
  });
  it('decodes type from "Type"', () => {
    expect(decodeCardTransaction({ Type: 'purchase' }).type).toBe('purchase');
  });
  it('decodes amount from "Amount"', () => {
    expect(decodeCardTransaction({ Amount: 12.5 }).amount).toBe(12.5);
  });
  it('decodes currency from "Currency"', () => {
    expect(decodeCardTransaction({ Currency: 'CAD' }).currency).toBe('CAD');
  });
  it('decodes avsResponse from "avs_response"', () => {
    expect(decodeCardTransaction({ avs_response: 'Y' }).avsResponse).toBe('Y');
  });
  it('decodes cvvResponse from "cvv_response"', () => {
    expect(decodeCardTransaction({ cvv_response: 'M' }).cvvResponse).toBe('M');
  });
  it('decodes cardType from "card_type"', () => {
    expect(decodeCardTransaction({ card_type: 'visa' }).cardType).toBe('visa');
  });
  it('decodes approvalCode from "approval_code"', () => {
    expect(decodeCardTransaction({ approval_code: '123' }).approvalCode).toBe('123');
  });
  it('decodes cardToken from "card_token"', () => {
    expect(decodeCardTransaction({ card_token: 'tok' }).cardToken).toBe('tok');
  });
  it('decodes cardNumber from "card_number"', () => {
    expect(decodeCardTransaction({ card_number: '****1234' }).cardNumber).toBe('****1234');
  });
  it('decodes cardHolderName from "card_holder_name"', () => {
    expect(decodeCardTransaction({ card_holder_name: 'Example' }).cardHolderName).toBe('Example');
  });
  it('decodes customerCode from "customer_code"', () => {
    expect(decodeCardTransaction({ customer_code: 'CST1' }).customerCode).toBe('CST1');
  });
  it('decodes invoiceNumber from "invoice_number"', () => {
    expect(decodeCardTransaction({ invoice_number: 'INV1' }).invoiceNumber).toBe('INV1');
  });
  it('decodes warning from "Warning"', () => {
    expect(decodeCardTransaction({ Warning: 'w' }).warning).toBe('w');
  });
});

describe('decodePaymentPlan — alternate key spellings', () => {
  it('decodes id from "Id"', () => {
    expect(decodePaymentPlan({ Id: 2 }).id).toBe(2);
  });
  it('decodes dateCreated from "date_created"', () => {
    expect(decodePaymentPlan({ date_created: '2026-01-01' }).dateCreated).toBe('2026-01-01');
  });
  it('decodes dateUpdated from "date_updated"', () => {
    expect(decodePaymentPlan({ date_updated: '2026-01-02' }).dateUpdated).toBe('2026-01-02');
  });
  it('decodes name from "Name"', () => {
    expect(decodePaymentPlan({ Name: 'Plan' }).name).toBe('Plan');
  });
  it('decodes description from "Description"', () => {
    expect(decodePaymentPlan({ Description: 'Desc' }).description).toBe('Desc');
  });
  it('decodes type from "Type"', () => {
    expect(decodePaymentPlan({ Type: 'recurring' }).type).toBe('recurring');
  });
  it('decodes status from "Status"', () => {
    expect(decodePaymentPlan({ Status: 'active' }).status).toBe('active');
  });
  it('decodes currency from "Currency"', () => {
    expect(decodePaymentPlan({ Currency: 'CAD' }).currency).toBe('CAD');
  });
  it('decodes cardTerminalId from "card_terminal_id"', () => {
    expect(decodePaymentPlan({ card_terminal_id: 8 }).cardTerminalId).toBe(8);
  });
  it('decodes setupAmount from "setup_amount"', () => {
    expect(decodePaymentPlan({ setup_amount: 5 }).setupAmount).toBe(5);
  });
  it('decodes recurringAmount from "recurring_amount"', () => {
    expect(decodePaymentPlan({ recurring_amount: 10 }).recurringAmount).toBe(10);
  });
  it('decodes billSetupImmediately from "bill_setup_immediately"', () => {
    expect(decodePaymentPlan({ bill_setup_immediately: 'true' }).billSetupImmediately).toBe('true');
  });
  it('decodes billingPeriod from "billing_period"', () => {
    expect(decodePaymentPlan({ billing_period: 'monthly' }).billingPeriod).toBe('monthly');
  });
  it('decodes billingPeriodIncrements from "billing_period_increments"', () => {
    expect(decodePaymentPlan({ billing_period_increments: 1 }).billingPeriodIncrements).toBe(1);
  });
  it('decodes dateBilling from "date_billing"', () => {
    expect(decodePaymentPlan({ date_billing: '2026-02-01' }).dateBilling).toBe('2026-02-01');
  });
  it('decodes termType from "term_type"', () => {
    expect(decodePaymentPlan({ term_type: 'ongoing' }).termType).toBe('ongoing');
  });
  it('decodes freeTrialPeriod from "free_trial_period"', () => {
    expect(decodePaymentPlan({ free_trial_period: 14 }).freeTrialPeriod).toBe(14);
  });
  it('decodes taxType from "tax_type"', () => {
    expect(decodePaymentPlan({ tax_type: 'inclusive' }).taxType).toBe('inclusive');
  });
  it('decodes taxCalculation from "tax_calculation"', () => {
    expect(decodePaymentPlan({ tax_calculation: 'auto' }).taxCalculation).toBe('auto');
  });
  it('decodes termLength from "term_length"', () => {
    expect(decodePaymentPlan({ term_length: 12 }).termLength).toBe(12);
  });
  it('decodes paymentMethod from "payment_method"', () => {
    expect(decodePaymentPlan({ payment_method: 'card' }).paymentMethod).toBe('card');
  });
  it('decodes businessEmail from "business_email"', () => {
    expect(decodePaymentPlan({ business_email: 'a@b.c' }).businessEmail).toBe('a@b.c');
  });
  it('decodes addOnIds from "add_on_ids"', () => {
    expect(decodePaymentPlan({ add_on_ids: [1, 2] }).addOnIds).toEqual([1, 2]);
  });
  it('decodes isProrated from "is_prorated"', () => {
    expect(decodePaymentPlan({ is_prorated: 'false' }).isProrated).toBe('false');
  });
});

describe('decodeSubscriptionPayment — alternate key spellings', () => {
  it('decodes id from "Id"', () => {
    expect(decodeSubscriptionPayment({ Id: 1 }).id).toBe(1);
  });
  it('decodes setupAmount from "setup_amount"', () => {
    expect(decodeSubscriptionPayment({ setup_amount: 5 }).setupAmount).toBe(5);
  });
  it('decodes recurringAmount from "recurring_amount"', () => {
    expect(decodeSubscriptionPayment({ recurring_amount: 10 }).recurringAmount).toBe(10);
  });
  it('decodes addOnAmount from "add_on_amount"', () => {
    expect(decodeSubscriptionPayment({ add_on_amount: 2 }).addOnAmount).toBe(2);
  });
  it('decodes amount from "Amount"', () => {
    expect(decodeSubscriptionPayment({ Amount: 17 }).amount).toBe(17);
  });
  it('decodes taxAmount from "tax_amount"', () => {
    expect(decodeSubscriptionPayment({ tax_amount: 1.5 }).taxAmount).toBe(1.5);
  });
  it('decodes status from "Status"', () => {
    expect(decodeSubscriptionPayment({ Status: 'PAID' }).status).toBe('PAID');
  });
  it('decodes dateDue from "date_due"', () => {
    expect(decodeSubscriptionPayment({ date_due: '2026-02-01' }).dateDue).toBe('2026-02-01');
  });
  it('decodes dateProcessed from "date_processed"', () => {
    expect(decodeSubscriptionPayment({ date_processed: '2026-01-15' }).dateProcessed).toBe(
      '2026-01-15'
    );
  });
  it('decodes paymentNumber from "payment_number"', () => {
    expect(decodeSubscriptionPayment({ payment_number: 3 }).paymentNumber).toBe(3);
  });
  it('decodes numberOfRetries from "number_of_retries"', () => {
    expect(decodeSubscriptionPayment({ number_of_retries: 2 }).numberOfRetries).toBe(2);
  });
});

describe('decodeSubscription — alternate key spellings', () => {
  it('decodes id from "Id"', () => {
    expect(decodeSubscription({ Id: 1 }).id).toBe(1);
  });
  it('decodes dateCreated from "date_created"', () => {
    expect(decodeSubscription({ date_created: '2026-01-01' }).dateCreated).toBe('2026-01-01');
  });
  it('decodes dateUpdated from "date_updated"', () => {
    expect(decodeSubscription({ date_updated: '2026-01-02' }).dateUpdated).toBe('2026-01-02');
  });
  it('decodes dateActivated from "date_activated"', () => {
    expect(decodeSubscription({ date_activated: '2026-01-03' }).dateActivated).toBe('2026-01-03');
  });
  it('decodes dateBilling from "date_billing"', () => {
    expect(decodeSubscription({ date_billing: '2026-02-01' }).dateBilling).toBe('2026-02-01');
  });
  it('decodes status from "Status"', () => {
    expect(decodeSubscription({ Status: 'active' }).status).toBe('active');
  });
  it('decodes paymentPlanId from "payment_plan_id"', () => {
    expect(decodeSubscription({ payment_plan_id: 9 }).paymentPlanId).toBe(9);
  });
  it('decodes customerCode from "customer_code"', () => {
    expect(decodeSubscription({ customer_code: 'CST1' }).customerCode).toBe('CST1');
  });
  it('decodes timesBilled from "times_billed"', () => {
    expect(decodeSubscription({ times_billed: 4 }).timesBilled).toBe(4);
  });
  it('decodes setupAmount from "setup_amount"', () => {
    expect(decodeSubscription({ setup_amount: 5 }).setupAmount).toBe(5);
  });
  it('decodes recurringAmount from "recurring_amount"', () => {
    expect(decodeSubscription({ recurring_amount: 10 }).recurringAmount).toBe(10);
  });
  it('decodes freeTrialPeriod from "free_trial_period"', () => {
    expect(decodeSubscription({ free_trial_period: 14 }).freeTrialPeriod).toBe(14);
  });
  it('decodes hasFailedPayments from "has_failed_payments"', () => {
    expect(decodeSubscription({ has_failed_payments: 'true' }).hasFailedPayments).toBe('true');
  });
  it('decodes isProrated from "is_prorated"', () => {
    expect(decodeSubscription({ is_prorated: 'false' }).isProrated).toBe('false');
  });
  it('decodes addOnIds from "add_on_ids"', () => {
    expect(decodeSubscription({ add_on_ids: [1, 2] }).addOnIds).toEqual([1, 2]);
  });
  it('decodes payments from "Payments"', () => {
    const s = decodeSubscription({ Payments: [{ id: 1, amount: 5 }] });
    expect(s.payments).toHaveLength(1);
    expect(s.payments[0].id).toBe(1);
  });
});

describe('decodeBankAccount — alternate key spellings', () => {
  it('decodes id from "Id"', () => {
    expect(decodeBankAccount({ Id: 1 }).id).toBe(1);
  });
  it('decodes customerId from "customer_id"', () => {
    expect(decodeBankAccount({ customer_id: 7 }).customerId).toBe(7);
  });
  it('decodes dateCreated from "date_created"', () => {
    expect(decodeBankAccount({ date_created: '2026-01-01' }).dateCreated).toBe('2026-01-01');
  });
  it('decodes dateUpdated from "date_updated"', () => {
    expect(decodeBankAccount({ date_updated: '2026-01-02' }).dateUpdated).toBe('2026-01-02');
  });
  it('decodes dateLastUsed from "date_last_used"', () => {
    expect(decodeBankAccount({ date_last_used: '2026-01-03' }).dateLastUsed).toBe('2026-01-03');
  });
  it('decodes dateVerified from "date_verified"', () => {
    expect(decodeBankAccount({ date_verified: '2026-01-04' }).dateVerified).toBe('2026-01-04');
  });
  it('decodes bankToken from "bank_token"', () => {
    expect(decodeBankAccount({ bank_token: 'btok' }).bankToken).toBe('btok');
  });
  it('decodes accountType from "account_type"', () => {
    expect(decodeBankAccount({ account_type: 'chequing' }).accountType).toBe('chequing');
  });
  it('decodes accountCorporate from "account_corporate"', () => {
    expect(decodeBankAccount({ account_corporate: 'personal' }).accountCorporate).toBe('personal');
  });
  it('decodes verified from "Verified" (1 → true, else false)', () => {
    expect(decodeBankAccount({ Verified: 1 }).verified).toBe(true);
    expect(decodeBankAccount({ Verified: 0 }).verified).toBe(false);
  });
  it('decodes ready from "Ready" (1 → true, else false)', () => {
    expect(decodeBankAccount({ Ready: 1 }).ready).toBe(true);
    expect(decodeBankAccount({ Ready: 0 }).ready).toBe(false);
  });
  it('decodes bankIdNumber from "bank_id_number"', () => {
    expect(decodeBankAccount({ bank_id_number: '003' }).bankIdNumber).toBe('003');
  });
  it('decodes transitNumber from "transit_number"', () => {
    expect(decodeBankAccount({ transit_number: '12345' }).transitNumber).toBe('12345');
  });
  it('decodes routingNumber from "routing_number"', () => {
    expect(decodeBankAccount({ routing_number: '021000021' }).routingNumber).toBe('021000021');
  });
  it('decodes bankAccountNumberL4 from "bankAccountNumberL4l4" and "bank_account_number_l4"', () => {
    expect(decodeBankAccount({ bankAccountNumberL4l4: '1234' }).bankAccountNumberL4).toBe('1234');
    expect(decodeBankAccount({ bank_account_number_l4: '5678' }).bankAccountNumberL4).toBe('5678');
  });
  it('decodes address from "Address"', () => {
    expect(
      decodeBankAccount({ Address: { name: 'N', street1: 'S', postalCode: 'P' } }).address?.name
    ).toBe('N');
  });
});

describe('decodePADAgreement — alternate key spellings', () => {
  it('decodes id from "Id"', () => {
    expect(decodePADAgreement({ Id: 1 }).id).toBe(1);
  });
  it('decodes accepted from "Accepted" (1 → true, else false)', () => {
    expect(decodePADAgreement({ Accepted: 1 }).accepted).toBe(true);
    expect(decodePADAgreement({ Accepted: 0 }).accepted).toBe(false);
  });
  it('decodes bankAccountId from "bank_account_id"', () => {
    expect(decodePADAgreement({ bank_account_id: 5 }).bankAccountId).toBe(5);
  });
  it('decodes customerId from "customer_id"', () => {
    expect(decodePADAgreement({ customer_id: 9 }).customerId).toBe(9);
  });
  it('decodes dateAccepted from "date_accepted"', () => {
    expect(decodePADAgreement({ date_accepted: '2026-01-01' }).dateAccepted).toBe('2026-01-01');
  });
  it('decodes dateCreated from "date_created"', () => {
    expect(decodePADAgreement({ date_created: '2026-01-02' }).dateCreated).toBe('2026-01-02');
  });
  it('decodes dateEarliestDebit from "date_earliest_debit"', () => {
    expect(decodePADAgreement({ date_earliest_debit: '2026-01-05' }).dateEarliestDebit).toBe(
      '2026-01-05'
    );
  });
  it('decodes dateRevoked from "date_revoked"', () => {
    expect(decodePADAgreement({ date_revoked: '2026-01-10' }).dateRevoked).toBe('2026-01-10');
  });
  it('decodes dateUpdated from "date_updated"', () => {
    expect(decodePADAgreement({ date_updated: '2026-01-03' }).dateUpdated).toBe('2026-01-03');
  });
  it('decodes ipAddress from "ip_address"', () => {
    expect(decodePADAgreement({ ip_address: '1.2.3.4' }).ipAddress).toBe('1.2.3.4');
  });
  it('decodes merchantAuthorized from "merchant_authorized" (1 → true, else false)', () => {
    expect(decodePADAgreement({ merchant_authorized: 1 }).merchantAuthorized).toBe(true);
    expect(decodePADAgreement({ merchant_authorized: 0 }).merchantAuthorized).toBe(false);
  });
  it('decodes type from "Type"', () => {
    expect(decodePADAgreement({ Type: 2 }).type).toBe(2);
  });
  it('decodes status from "Status"', () => {
    expect(decodePADAgreement({ Status: 1 }).status).toBe(1);
  });
});

describe('decodeACHTransaction — alternate key spellings', () => {
  it('decodes id from "Id"', () => {
    expect(decodeACHTransaction({ Id: 1 }).id).toBe(1);
  });
  it('decodes merchantId from "merchant_id"', () => {
    expect(decodeACHTransaction({ merchant_id: 5 }).merchantId).toBe(5);
  });
  it('decodes dateCreated from "date_created"', () => {
    expect(decodeACHTransaction({ date_created: '2026-01-01' }).dateCreated).toBe('2026-01-01');
  });
  it('decodes statusAuth from "status_auth"', () => {
    expect(decodeACHTransaction({ status_auth: 1 }).statusAuth).toBe(1);
  });
  it('decodes statusClearing from "status_clearing"', () => {
    expect(decodeACHTransaction({ status_clearing: 2 }).statusClearing).toBe(2);
  });
  it('decodes batchId from "batch_id"', () => {
    expect(decodeACHTransaction({ batch_id: 8 }).batchId).toBe(8);
  });
  it('decodes bankAccountId from "bank_account_id"', () => {
    expect(decodeACHTransaction({ bank_account_id: 3 }).bankAccountId).toBe(3);
  });
  it('decodes bankAccountL4 from "bankAccountL4l4" and "bank_account_l4"', () => {
    expect(decodeACHTransaction({ bankAccountL4l4: '1234' }).bankAccountL4).toBe('1234');
    expect(decodeACHTransaction({ bank_account_l4: '5678' }).bankAccountL4).toBe('5678');
  });
  it('decodes transactionType from "transaction_type"', () => {
    expect(decodeACHTransaction({ transaction_type: 1 }).transactionType).toBe(1);
  });
  it('decodes amount from "Amount"', () => {
    expect(decodeACHTransaction({ Amount: 50 }).amount).toBe(50);
  });
  it('decodes currency from "Currency"', () => {
    expect(decodeACHTransaction({ Currency: 124 }).currency).toBe(124);
  });
  it('decodes approvalCode from "approval_code"', () => {
    expect(decodeACHTransaction({ approval_code: 'A1' }).approvalCode).toBe('A1');
  });
  it('decodes test from "Test" (1 → true, else false)', () => {
    expect(decodeACHTransaction({ Test: 1 }).test).toBe(true);
    expect(decodeACHTransaction({ Test: 0 }).test).toBe(false);
  });
  it('decodes acquirerTransactionId from "acquirer_transaction_id"', () => {
    expect(decodeACHTransaction({ acquirer_transaction_id: 'acq1' }).acquirerTransactionId).toBe(
      'acq1'
    );
  });
  it('decodes responseMessage from "response_message"', () => {
    expect(decodeACHTransaction({ response_message: 'OK' }).responseMessage).toBe('OK');
  });
  it('decodes statusBatch from "status_batch"', () => {
    expect(decodeACHTransaction({ status_batch: 1 }).statusBatch).toBe(1);
  });
  it('decodes dateClosed from "date_closed"', () => {
    expect(decodeACHTransaction({ date_closed: '2026-01-02' }).dateClosed).toBe('2026-01-02');
  });
  it('decodes customerCode from "customer_code"', () => {
    expect(decodeACHTransaction({ customer_code: 'CST1' }).customerCode).toBe('CST1');
  });
  it('decodes invoiceNumber from "invoice_number"', () => {
    expect(decodeACHTransaction({ invoice_number: 'INV1' }).invoiceNumber).toBe('INV1');
  });
  it('decodes orderId from "order_id"', () => {
    expect(decodeACHTransaction({ order_id: 42 }).orderId).toBe(42);
  });
});

describe('decodeInvoice — alternate key spellings', () => {
  it('decodes id from "Id"', () => {
    expect(decodeInvoice({ Id: 1 }).id).toBe(1);
  });
  it('decodes invoiceNumber from "invoice_number"', () => {
    expect(decodeInvoice({ invoice_number: 'INV1' }).invoiceNumber).toBe('INV1');
  });
  it('decodes customerId from "customer_id"', () => {
    expect(decodeInvoice({ customer_id: 7 }).customerId).toBe(7);
  });
  it('decodes customerCode from "customer_code"', () => {
    expect(decodeInvoice({ customer_code: 'CST1' }).customerCode).toBe('CST1');
  });
  it('decodes dateCreated from "date_created"', () => {
    expect(decodeInvoice({ date_created: '2026-01-01' }).dateCreated).toBe('2026-01-01');
  });
  it('decodes dateUpdated from "date_updated"', () => {
    expect(decodeInvoice({ date_updated: '2026-01-02' }).dateUpdated).toBe('2026-01-02');
  });
  it('decodes status from "Status"', () => {
    expect(decodeInvoice({ Status: 'PAID' }).status).toBe('PAID');
  });
  it('decodes amount from "Amount", "totalAmount", and "total_amount"', () => {
    expect(decodeInvoice({ Amount: 10 }).amount).toBe(10);
    expect(decodeInvoice({ totalAmount: 20 }).amount).toBe(20);
    expect(decodeInvoice({ total_amount: 30 }).amount).toBe(30);
  });
  it('decodes currency from "Currency"', () => {
    expect(decodeInvoice({ Currency: 'CAD' }).currency).toBe('CAD');
  });
  it('decodes notes from "Notes"', () => {
    expect(decodeInvoice({ Notes: 'note' }).notes).toBe('note');
  });
  it('decodes lineItems from "line_items" and "items"', () => {
    expect(decodeInvoice({ line_items: [{ sku: 'A' }] }).lineItems).toHaveLength(1);
    expect(decodeInvoice({ items: [{ sku: 'B' }] }).lineItems).toHaveLength(1);
  });
  it('decodes line-item fields from alternate keys', () => {
    const inv = decodeInvoice({
      lineItems: [
        {
          SKU: 'sku1',
          Description: 'desc',
          Quantity: 2,
          Price: 5,
          Total: 10,
          tax_amount: 1,
          discount_amount: 0.5,
        },
      ],
    });
    const li = inv.lineItems[0];
    expect(li.sku).toBe('sku1');
    expect(li.description).toBe('desc');
    expect(li.quantity).toBe(2);
    expect(li.price).toBe(5);
    expect(li.total).toBe(10);
    expect(li.taxAmount).toBe(1);
    expect(li.discountAmount).toBe(0.5);
  });
});
