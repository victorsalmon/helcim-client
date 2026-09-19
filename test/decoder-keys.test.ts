import { describe, it, expect } from 'vitest';
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
} from '../src/index.js';

// These tests systematically verify every alternate key supported by the decoders.
// Each alternate key is tested in isolation to kill StringLiteral mutants that
// would change a key like 'Name' to ''.

describe('decodeAddress alternate keys', () => {
  it('reads name from Name (PascalCase)', () => {
    expect(decodeAddress({ Name: 'Example', street1: '1 St', postalCode: 'H0H' })?.name).toBe('Example');
  });

  it('reads street1 from Street1 and street_1', () => {
    expect(decodeAddress({ name: 'J', Street1: '1 St', postalCode: 'H0H' })?.street1).toBe('1 St');
    expect(decodeAddress({ name: 'J', street_1: '2 St', postalCode: 'H0H' })?.street1).toBe('2 St');
  });

  it('reads postalCode from PostalCode and postal_code', () => {
    expect(decodeAddress({ name: 'J', street1: '1 St', PostalCode: 'H0H' })?.postalCode).toBe('H0H');
    expect(decodeAddress({ name: 'J', street1: '1 St', postal_code: 'H1H' })?.postalCode).toBe('H1H');
  });

  it('reads street2 from Street2 and street_2', () => {
    const r = decodeAddress({ name: 'J', street1: '1 St', postalCode: 'H0H', Street2: 'Apt 2' });
    expect(r?.street2).toBe('Apt 2');
    const r2 = decodeAddress({ name: 'J', street1: '1 St', postalCode: 'H0H', street_2: 'Apt 3' });
    expect(r2?.street2).toBe('Apt 3');
  });

  it('reads city from City', () => {
    expect(decodeAddress({ name: 'J', street1: '1 St', postalCode: 'H0H', City: 'Example City' })?.city).toBe('Example City');
  });

  it('reads province from Province', () => {
    expect(decodeAddress({ name: 'J', street1: '1 St', postalCode: 'H0H', Province: 'AB' })?.province).toBe('AB');
  });

  it('reads country from Country', () => {
    expect(decodeAddress({ name: 'J', street1: '1 St', postalCode: 'H0H', Country: 'CA' })?.country).toBe('CA');
  });

  it('reads phone from Phone', () => {
    expect(decodeAddress({ name: 'J', street1: '1 St', postalCode: 'H0H', Phone: '555' })?.phone).toBe('555');
  });

  it('reads email from Email', () => {
    expect(decodeAddress({ name: 'J', street1: '1 St', postalCode: 'H0H', Email: 'a@b.com' })?.email).toBe('a@b.com');
  });
});

describe('decodeCard alternate keys', () => {
  it('reads id from Id', () => {
    expect(decodeCard({ Id: 42 }).id).toBe(42);
  });

  it('reads cardHolderName from cardHolder and card_holder_name', () => {
    expect(decodeCard({ cardHolder: 'Example' }).cardHolderName).toBe('Example');
    expect(decodeCard({ card_holder_name: 'ExampleC' }).cardHolderName).toBe('ExampleC');
  });

  it('reads cardF6L4 from cardF4L6 and card_f6l4', () => {
    expect(decodeCard({ cardF4L6: '5454' }).cardF6L4).toBe('5454');
    expect(decodeCard({ card_f6l4: '6363' }).cardF6L4).toBe('6363');
  });

  it('reads cardToken from card_token', () => {
    expect(decodeCard({ card_token: 'tok' }).cardToken).toBe('tok');
  });

  it('reads cardExpiry from card_expiry', () => {
    expect(decodeCard({ card_expiry: '1257' }).cardExpiry).toBe('1257');
  });

  it('reads dateCreated from date_created', () => {
    expect(decodeCard({ date_created: '2024-01-01' }).dateCreated).toBe('2024-01-01');
  });

  it('reads dateUpdated from date_updated', () => {
    expect(decodeCard({ date_updated: '2024-01-02' }).dateUpdated).toBe('2024-01-02');
  });
});

describe('decodeCustomer alternate keys', () => {
  it('reads id from Id', () => {
    expect(decodeCustomer({ Id: 42 }).id).toBe(42);
  });

  it('reads customerCode from customer_code', () => {
    expect(decodeCustomer({ customer_code: 'CST1' }).customerCode).toBe('CST1');
  });

  it('reads businessName from business_name', () => {
    expect(decodeCustomer({ business_name: 'Example Inc.' }).businessName).toBe('Example Inc.');
  });

  it('reads contactName from contact_name', () => {
    expect(decodeCustomer({ contact_name: 'Example' }).contactName).toBe('Example');
  });

  it('reads cellPhone from cellphone and cell_phone', () => {
    expect(decodeCustomer({ cellphone: '555' }).cellPhone).toBe('555');
    expect(decodeCustomer({ cell_phone: '666' }).cellPhone).toBe('666');
  });

  it('reads cards from Cards', () => {
    expect(decodeCustomer({ Cards: [{ id: 1 }] }).cards).toHaveLength(1);
    expect(decodeCustomer({ Cards: [{ id: 1 }] }).cards[0].id).toBe(1);
  });

  it('reads billingAddress from billing_address', () => {
    expect(decodeCustomer({ billing_address: { name: 'J', street1: '1 St', postalCode: 'H0H' } }).billingAddress?.name).toBe('J');
  });

  it('reads shippingAddress from shipping_address', () => {
    expect(decodeCustomer({ shipping_address: { name: 'J', street1: '2 St', postalCode: 'H0H' } }).shippingAddress?.name).toBe('J');
  });
});

describe('decodeCardTransaction alternate keys', () => {
  it('reads transactionId from transaction_id', () => {
    expect(decodeCardTransaction({ transaction_id: 42 }).transactionId).toBe(42);
  });

  it('reads cardBatchId from card_batch_id', () => {
    expect(decodeCardTransaction({ card_batch_id: 5 }).cardBatchId).toBe(5);
  });

  it('reads dateCreated from date_created', () => {
    expect(decodeCardTransaction({ date_created: '2024-01-01' }).dateCreated).toBe('2024-01-01');
  });

  it('reads status from Status', () => {
    expect(decodeCardTransaction({ Status: 'APPROVED' }).status).toBe('APPROVED');
  });

  it('reads type from Type', () => {
    expect(decodeCardTransaction({ Type: 'purchase' }).type).toBe('purchase');
  });

  it('reads amount from Amount', () => {
    expect(decodeCardTransaction({ Amount: 100 }).amount).toBe(100);
  });

  it('reads currency from Currency', () => {
    expect(decodeCardTransaction({ Currency: 'CAD' }).currency).toBe('CAD');
  });

  it('reads avsResponse from avs_response', () => {
    expect(decodeCardTransaction({ avs_response: 'X' }).avsResponse).toBe('X');
  });

  it('reads cvvResponse from cvv_response', () => {
    expect(decodeCardTransaction({ cvv_response: 'M' }).cvvResponse).toBe('M');
  });

  it('reads cardType from card_type', () => {
    expect(decodeCardTransaction({ card_type: 'Visa' }).cardType).toBe('Visa');
  });

  it('reads approvalCode from approval_code', () => {
    expect(decodeCardTransaction({ approval_code: '1234' }).approvalCode).toBe('1234');
  });

  it('reads cardToken from card_token', () => {
    expect(decodeCardTransaction({ card_token: 'tok' }).cardToken).toBe('tok');
  });

  it('reads cardNumber from card_number', () => {
    expect(decodeCardTransaction({ card_number: '5454' }).cardNumber).toBe('5454');
  });

  it('reads cardHolderName from card_holder_name', () => {
    expect(decodeCardTransaction({ card_holder_name: 'Example' }).cardHolderName).toBe('Example');
  });

  it('reads customerCode from customer_code', () => {
    expect(decodeCardTransaction({ customer_code: 'CST1' }).customerCode).toBe('CST1');
  });

  it('reads invoiceNumber from invoice_number', () => {
    expect(decodeCardTransaction({ invoice_number: 'INV1' }).invoiceNumber).toBe('INV1');
  });

  it('reads warning from Warning', () => {
    expect(decodeCardTransaction({ Warning: 'test' }).warning).toBe('test');
  });
});

describe('decodePaymentPlan alternate keys', () => {
  it('reads id from Id', () => {
    expect(decodePaymentPlan({ Id: 42 }).id).toBe(42);
  });

  it('reads dateCreated from date_created', () => {
    expect(decodePaymentPlan({ date_created: '2024-01-01' }).dateCreated).toBe('2024-01-01');
  });

  it('reads dateUpdated from date_updated', () => {
    expect(decodePaymentPlan({ date_updated: '2024-01-02' }).dateUpdated).toBe('2024-01-02');
  });

  it('reads name from Name', () => {
    expect(decodePaymentPlan({ Name: 'Pro' }).name).toBe('Pro');
  });

  it('reads description from Description', () => {
    expect(decodePaymentPlan({ Description: 'desc' }).description).toBe('desc');
  });

  it('reads type from Type', () => {
    expect(decodePaymentPlan({ Type: 'subscription' }).type).toBe('subscription');
  });

  it('reads status from Status', () => {
    expect(decodePaymentPlan({ Status: 'active' }).status).toBe('active');
  });

  it('reads currency from Currency', () => {
    expect(decodePaymentPlan({ Currency: 'CAD' }).currency).toBe('CAD');
  });

  it('reads cardTerminalId from card_terminal_id', () => {
    expect(decodePaymentPlan({ card_terminal_id: 5 }).cardTerminalId).toBe(5);
  });

  it('reads setupAmount from setup_amount', () => {
    expect(decodePaymentPlan({ setup_amount: 20 }).setupAmount).toBe(20);
  });

  it('reads recurringAmount from recurring_amount', () => {
    expect(decodePaymentPlan({ recurring_amount: 10 }).recurringAmount).toBe(10);
  });

  it('reads billSetupImmediately from bill_setup_immediately', () => {
    expect(decodePaymentPlan({ bill_setup_immediately: 'immediate' }).billSetupImmediately).toBe('immediate');
  });

  it('reads billingPeriod from billing_period', () => {
    expect(decodePaymentPlan({ billing_period: 'monthly' }).billingPeriod).toBe('monthly');
  });

  it('reads billingPeriodIncrements from billing_period_increments', () => {
    expect(decodePaymentPlan({ billing_period_increments: 12 }).billingPeriodIncrements).toBe(12);
  });

  it('reads dateBilling from date_billing', () => {
    expect(decodePaymentPlan({ date_billing: '2024-01-01' }).dateBilling).toBe('2024-01-01');
  });

  it('reads termType from term_type', () => {
    expect(decodePaymentPlan({ term_type: 'forever' }).termType).toBe('forever');
  });

  it('reads freeTrialPeriod from free_trial_period', () => {
    expect(decodePaymentPlan({ free_trial_period: 30 }).freeTrialPeriod).toBe(30);
  });

  it('reads taxType from tax_type', () => {
    expect(decodePaymentPlan({ tax_type: 'customer' }).taxType).toBe('customer');
  });

  it('reads taxCalculation from tax_calculation', () => {
    expect(decodePaymentPlan({ tax_calculation: 'country_only' }).taxCalculation).toBe('country_only');
  });

  it('reads termLength from term_length', () => {
    expect(decodePaymentPlan({ term_length: 365 }).termLength).toBe(365);
  });

  it('reads paymentMethod from payment_method', () => {
    expect(decodePaymentPlan({ payment_method: 'card' }).paymentMethod).toBe('card');
  });

  it('reads businessEmail from business_email', () => {
    expect(decodePaymentPlan({ business_email: 'biz@test.com' }).businessEmail).toBe('biz@test.com');
  });

  it('reads addOnIds from add_on_ids', () => {
    expect(decodePaymentPlan({ add_on_ids: [1, 2] }).addOnIds).toEqual([1, 2]);
  });

  it('reads isProrated from is_prorated', () => {
    expect(decodePaymentPlan({ is_prorated: 'yes' }).isProrated).toBe('yes');
  });
});

describe('decodeSubscriptionPayment alternate keys', () => {
  it('reads id from Id', () => {
    expect(decodeSubscriptionPayment({ Id: 42 }).id).toBe(42);
  });

  it('reads setupAmount from setup_amount', () => {
    expect(decodeSubscriptionPayment({ setup_amount: 20 }).setupAmount).toBe(20);
  });

  it('reads recurringAmount from recurring_amount', () => {
    expect(decodeSubscriptionPayment({ recurring_amount: 10 }).recurringAmount).toBe(10);
  });

  it('reads addOnAmount from add_on_amount', () => {
    expect(decodeSubscriptionPayment({ add_on_amount: 5 }).addOnAmount).toBe(5);
  });

  it('reads amount from Amount', () => {
    expect(decodeSubscriptionPayment({ Amount: 100 }).amount).toBe(100);
  });

  it('reads taxAmount from tax_amount', () => {
    expect(decodeSubscriptionPayment({ tax_amount: 5 }).taxAmount).toBe(5);
  });

  it('reads status from Status', () => {
    expect(decodeSubscriptionPayment({ Status: 'approved' }).status).toBe('approved');
  });

  it('reads dateDue from date_due', () => {
    expect(decodeSubscriptionPayment({ date_due: '2024-01-01' }).dateDue).toBe('2024-01-01');
  });

  it('reads dateProcessed from date_processed', () => {
    expect(decodeSubscriptionPayment({ date_processed: '2024-01-02' }).dateProcessed).toBe('2024-01-02');
  });

  it('reads paymentNumber from payment_number', () => {
    expect(decodeSubscriptionPayment({ payment_number: 3 }).paymentNumber).toBe(3);
  });

  it('reads numberOfRetries from number_of_retries', () => {
    expect(decodeSubscriptionPayment({ number_of_retries: 2 }).numberOfRetries).toBe(2);
  });
});

describe('decodeSubscription alternate keys', () => {
  it('reads id from Id', () => {
    expect(decodeSubscription({ Id: 42 }).id).toBe(42);
  });

  it('reads dateCreated from date_created', () => {
    expect(decodeSubscription({ date_created: '2024-01-01' }).dateCreated).toBe('2024-01-01');
  });

  it('reads dateUpdated from date_updated', () => {
    expect(decodeSubscription({ date_updated: '2024-01-02' }).dateUpdated).toBe('2024-01-02');
  });

  it('reads dateActivated from date_activated', () => {
    expect(decodeSubscription({ date_activated: '2024-01-01' }).dateActivated).toBe('2024-01-01');
  });

  it('reads dateBilling from date_billing', () => {
    expect(decodeSubscription({ date_billing: '2024-01-01' }).dateBilling).toBe('2024-01-01');
  });

  it('reads status from Status', () => {
    expect(decodeSubscription({ Status: 'active' }).status).toBe('active');
  });

  it('reads paymentPlanId from payment_plan_id', () => {
    expect(decodeSubscription({ payment_plan_id: 5 }).paymentPlanId).toBe(5);
  });

  it('reads customerCode from customer_code', () => {
    expect(decodeSubscription({ customer_code: 'CST1' }).customerCode).toBe('CST1');
  });

  it('reads timesBilled from times_billed', () => {
    expect(decodeSubscription({ times_billed: 3 }).timesBilled).toBe(3);
  });

  it('reads setupAmount from setup_amount', () => {
    expect(decodeSubscription({ setup_amount: 20 }).setupAmount).toBe(20);
  });

  it('reads recurringAmount from recurring_amount', () => {
    expect(decodeSubscription({ recurring_amount: 10 }).recurringAmount).toBe(10);
  });

  it('reads freeTrialPeriod from free_trial_period', () => {
    expect(decodeSubscription({ free_trial_period: 30 }).freeTrialPeriod).toBe(30);
  });

  it('reads hasFailedPayments from has_failed_payments', () => {
    expect(decodeSubscription({ has_failed_payments: 'yes' }).hasFailedPayments).toBe('yes');
  });

  it('reads isProrated from is_prorated', () => {
    expect(decodeSubscription({ is_prorated: 'yes' }).isProrated).toBe('yes');
  });

  it('reads addOnIds from add_on_ids', () => {
    expect(decodeSubscription({ add_on_ids: [1, 2] }).addOnIds).toEqual([1, 2]);
  });

  it('reads payments from Payments', () => {
    expect(decodeSubscription({ Payments: [{ id: 1 }] }).payments).toHaveLength(1);
    expect(decodeSubscription({ Payments: [{ id: 1 }] }).payments[0].id).toBe(1);
  });
});

describe('decodeBankAccount alternate keys', () => {
  it('reads id from Id', () => {
    expect(decodeBankAccount({ Id: 42 }).id).toBe(42);
  });

  it('reads customerId from customer_id', () => {
    expect(decodeBankAccount({ customer_id: 5 }).customerId).toBe(5);
  });

  it('reads dateCreated from date_created', () => {
    expect(decodeBankAccount({ date_created: '2024-01-01' }).dateCreated).toBe('2024-01-01');
  });

  it('reads dateUpdated from date_updated', () => {
    expect(decodeBankAccount({ date_updated: '2024-01-02' }).dateUpdated).toBe('2024-01-02');
  });

  it('reads dateLastUsed from date_last_used', () => {
    expect(decodeBankAccount({ date_last_used: '2024-01-03' }).dateLastUsed).toBe('2024-01-03');
  });

  it('reads dateVerified from date_verified', () => {
    expect(decodeBankAccount({ date_verified: '2024-01-04' }).dateVerified).toBe('2024-01-04');
  });

  it('reads bankToken from bank_token', () => {
    expect(decodeBankAccount({ bank_token: 'tok' }).bankToken).toBe('tok');
  });

  it('reads accountType from account_type', () => {
    expect(decodeBankAccount({ account_type: 'CHECKING' }).accountType).toBe('CHECKING');
  });

  it('reads accountCorporate from account_corporate', () => {
    expect(decodeBankAccount({ account_corporate: 'PERSONAL' }).accountCorporate).toBe('PERSONAL');
  });

  it('reads verified from Verified', () => {
    expect(decodeBankAccount({ Verified: 1 }).verified).toBe(true);
    expect(decodeBankAccount({ Verified: 0 }).verified).toBe(false);
  });

  it('reads ready from Ready', () => {
    expect(decodeBankAccount({ Ready: 1 }).ready).toBe(true);
    expect(decodeBankAccount({ Ready: 0 }).ready).toBe(false);
  });

  it('reads bankIdNumber from bank_id_number', () => {
    expect(decodeBankAccount({ bank_id_number: '003' }).bankIdNumber).toBe('003');
  });

  it('reads transitNumber from transit_number', () => {
    expect(decodeBankAccount({ transit_number: '23456' }).transitNumber).toBe('23456');
  });

  it('reads routingNumber from routing_number', () => {
    expect(decodeBankAccount({ routing_number: '123456789' }).routingNumber).toBe('123456789');
  });

  it('reads bankAccountNumberL4 from bankAccountNumberL4l4 and bank_account_number_l4', () => {
    expect(decodeBankAccount({ bankAccountNumberL4l4: '1234' }).bankAccountNumberL4).toBe('1234');
    expect(decodeBankAccount({ bank_account_number_l4: '5678' }).bankAccountNumberL4).toBe('5678');
  });

  it('reads address from Address', () => {
    expect(decodeBankAccount({ Address: { name: 'J', street1: '1 St', postalCode: 'H0H' } }).address?.name).toBe('J');
  });
});

describe('decodePADAgreement alternate keys', () => {
  it('reads id from Id', () => {
    expect(decodePADAgreement({ Id: 42 }).id).toBe(42);
  });

  it('reads accepted from Accepted', () => {
    expect(decodePADAgreement({ Accepted: 1 }).accepted).toBe(true);
    expect(decodePADAgreement({ Accepted: 0 }).accepted).toBe(false);
  });

  it('reads bankAccountId from bank_account_id', () => {
    expect(decodePADAgreement({ bank_account_id: 5 }).bankAccountId).toBe(5);
  });

  it('reads customerId from customer_id', () => {
    expect(decodePADAgreement({ customer_id: 10 }).customerId).toBe(10);
  });

  it('reads dateAccepted from date_accepted', () => {
    expect(decodePADAgreement({ date_accepted: '2024-01-01' }).dateAccepted).toBe('2024-01-01');
  });

  it('reads dateCreated from date_created', () => {
    expect(decodePADAgreement({ date_created: '2024-01-01' }).dateCreated).toBe('2024-01-01');
  });

  it('reads dateEarliestDebit from date_earliest_debit', () => {
    expect(decodePADAgreement({ date_earliest_debit: '2024-01-02' }).dateEarliestDebit).toBe('2024-01-02');
  });

  it('reads dateRevoked from date_revoked', () => {
    expect(decodePADAgreement({ date_revoked: '2024-01-03' }).dateRevoked).toBe('2024-01-03');
  });

  it('reads dateUpdated from date_updated', () => {
    expect(decodePADAgreement({ date_updated: '2024-01-04' }).dateUpdated).toBe('2024-01-04');
  });

  it('reads ipAddress from ip_address', () => {
    expect(decodePADAgreement({ ip_address: '1.1.1.1' }).ipAddress).toBe('1.1.1.1');
  });

  it('reads merchantAuthorized from merchant_authorized', () => {
    expect(decodePADAgreement({ merchant_authorized: 1 }).merchantAuthorized).toBe(true);
    expect(decodePADAgreement({ merchant_authorized: 0 }).merchantAuthorized).toBe(false);
  });

  it('reads type from Type', () => {
    expect(decodePADAgreement({ Type: 1 }).type).toBe(1);
  });

  it('reads status from Status', () => {
    expect(decodePADAgreement({ Status: 2 }).status).toBe(2);
  });
});

describe('decodeACHTransaction alternate keys', () => {
  it('reads id from Id', () => {
    expect(decodeACHTransaction({ Id: 42 }).id).toBe(42);
  });

  it('reads merchantId from merchant_id', () => {
    expect(decodeACHTransaction({ merchant_id: 5 }).merchantId).toBe(5);
  });

  it('reads dateCreated from date_created', () => {
    expect(decodeACHTransaction({ date_created: '2024-01-01' }).dateCreated).toBe('2024-01-01');
  });

  it('reads statusAuth from status_auth', () => {
    expect(decodeACHTransaction({ status_auth: 1 }).statusAuth).toBe(1);
  });

  it('reads statusClearing from status_clearing', () => {
    expect(decodeACHTransaction({ status_clearing: 0 }).statusClearing).toBe(0);
  });

  it('reads batchId from batch_id', () => {
    expect(decodeACHTransaction({ batch_id: 10 }).batchId).toBe(10);
  });

  it('reads bankAccountId from bank_account_id', () => {
    expect(decodeACHTransaction({ bank_account_id: 20 }).bankAccountId).toBe(20);
  });

  it('reads bankAccountL4l4 as first key for bankAccountL4', () => {
    expect(decodeACHTransaction({ bankAccountL4l4: '1234' }).bankAccountL4).toBe('1234');
  });

  it('reads bankAccountL4 as second key', () => {
    expect(decodeACHTransaction({ bankAccountL4: '5678' }).bankAccountL4).toBe('5678');
  });

  it('reads bank_account_l4 as third key', () => {
    expect(decodeACHTransaction({ bank_account_l4: '9999' }).bankAccountL4).toBe('9999');
  });

  it('reads transactionType from transaction_type', () => {
    expect(decodeACHTransaction({ transaction_type: 1 }).transactionType).toBe(1);
  });

  it('reads amount from Amount', () => {
    expect(decodeACHTransaction({ Amount: 100 }).amount).toBe(100);
  });

  it('reads currency from Currency', () => {
    expect(decodeACHTransaction({ Currency: 1 }).currency).toBe(1);
  });

  it('reads approvalCode from approval_code', () => {
    expect(decodeACHTransaction({ approval_code: '1234' }).approvalCode).toBe('1234');
  });

  it('reads test from Test', () => {
    expect(decodeACHTransaction({ Test: 1 }).test).toBe(true);
    expect(decodeACHTransaction({ Test: 0 }).test).toBe(false);
  });

  it('reads acquirerTransactionId from acquirer_transaction_id', () => {
    expect(decodeACHTransaction({ acquirer_transaction_id: 'abc' }).acquirerTransactionId).toBe('abc');
  });

  it('reads responseMessage from response_message', () => {
    expect(decodeACHTransaction({ response_message: 'ok' }).responseMessage).toBe('ok');
  });

  it('reads statusBatch from status_batch', () => {
    expect(decodeACHTransaction({ status_batch: 1 }).statusBatch).toBe(1);
  });

  it('reads dateClosed from date_closed', () => {
    expect(decodeACHTransaction({ date_closed: '2024-01-01' }).dateClosed).toBe('2024-01-01');
  });

  it('reads customerCode from customer_code', () => {
    expect(decodeACHTransaction({ customer_code: 'CST1' }).customerCode).toBe('CST1');
  });

  it('reads invoiceNumber from invoice_number', () => {
    expect(decodeACHTransaction({ invoice_number: 'INV1' }).invoiceNumber).toBe('INV1');
  });

  it('reads orderId from order_id', () => {
    expect(decodeACHTransaction({ order_id: 99 }).orderId).toBe(99);
  });
});

describe('decodeInvoice alternate keys', () => {
  it('reads id from Id', () => {
    expect(decodeInvoice({ Id: 42 }).id).toBe(42);
  });

  it('reads invoiceNumber from invoice_number', () => {
    expect(decodeInvoice({ invoice_number: 'INV1' }).invoiceNumber).toBe('INV1');
  });

  it('reads customerId from customer_id', () => {
    expect(decodeInvoice({ customer_id: 5 }).customerId).toBe(5);
  });

  it('reads customerCode from customer_code', () => {
    expect(decodeInvoice({ customer_code: 'CST1' }).customerCode).toBe('CST1');
  });

  it('reads dateCreated from date_created', () => {
    expect(decodeInvoice({ date_created: '2024-01-01' }).dateCreated).toBe('2024-01-01');
  });

  it('reads dateUpdated from date_updated', () => {
    expect(decodeInvoice({ date_updated: '2024-01-02' }).dateUpdated).toBe('2024-01-02');
  });

  it('reads status from Status', () => {
    expect(decodeInvoice({ Status: 'paid' }).status).toBe('paid');
  });

  it('reads amount from Amount, totalAmount, and total_amount', () => {
    expect(decodeInvoice({ Amount: 100 }).amount).toBe(100);
    expect(decodeInvoice({ totalAmount: 200 }).amount).toBe(200);
    expect(decodeInvoice({ total_amount: 300 }).amount).toBe(300);
  });

  it('reads currency from Currency', () => {
    expect(decodeInvoice({ Currency: 'CAD' }).currency).toBe('CAD');
  });

  it('reads notes from Notes', () => {
    expect(decodeInvoice({ Notes: 'note' }).notes).toBe('note');
  });

  it('reads lineItems from line_items and items', () => {
    expect(decodeInvoice({ line_items: [{ description: 'x' }] }).lineItems).toHaveLength(1);
    expect(decodeInvoice({ items: [{ description: 'y' }] }).lineItems).toHaveLength(1);
  });

  it('reads line item alternate keys', () => {
    const inv = decodeInvoice({ lineItems: [{
      SKU: 'abc', Description: 'desc', Quantity: 2, Price: 5, Total: 10,
      tax_amount: 1, discount_amount: 2,
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
