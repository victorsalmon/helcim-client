import type { TransportRequest } from '../transport.js';
import { HELCIM_ACH_CURRENCY, numericBoolean } from '../types.js';
import type {
  HelcimBankAccount,
  HelcimPADAgreement,
  HelcimACHTransaction,
  CreateBankAccountInput,
  ProcessACHWithdrawInput,
} from '../types.js';
import { generateIdempotencyKey, firstString, firstNumber, firstArray } from '../util.js';
import {
  decodeBankAccount,
  decodePADAgreement,
  decodeACHTransaction,
  assertPositiveAmount,
  assertNonEmptyString,
  assertPositiveInteger,
  unwrapRecord,
  unwrapDataObject,
} from '../decode.js';

export interface bankAndAchContext {
  request: TransportRequest;
}

/** Endpoint group factory — composed by client.ts. */
export function createBankAndAchApi({ request }: bankAndAchContext) {
  // ─── Bank accounts ─────────────────────────────────────────────────────
  /** Add a bank account to a customer for ACH/PAD. */
  async function createBankAccount(
    customerId: number,
    input: CreateBankAccountInput
  ): Promise<{ id: number; message: string }> {
    assertPositiveInteger(
      customerId,
      'Helcim createBankAccount requires a positive integer customerId'
    );
    assertNonEmptyString(input.bankAccountNumber, 'createBankAccount bankAccountNumber');
    assertNonEmptyString(input.countryAlpha2, 'createBankAccount countryAlpha2');
    assertNonEmptyString(input.provinceAlpha2, 'createBankAccount provinceAlpha2');
    assertNonEmptyString(input.city, 'createBankAccount city');
    assertNonEmptyString(input.postalCode, 'createBankAccount postalCode');
    assertNonEmptyString(input.streetAddress, 'createBankAccount streetAddress');
    const body: Record<string, unknown> = {
      accountCorporate: input.accountCorporate,
      accountType: input.accountType,
      bankAccountNumber: input.bankAccountNumber,
      city: input.city,
      countryAlpha2: input.countryAlpha2,
      provinceAlpha2: input.provinceAlpha2,
      postalCode: input.postalCode,
      streetAddress: input.streetAddress,
    };
    if (input.bankFinancialNumber) body.bankFinancialNumber = input.bankFinancialNumber;
    if (input.bankTransitNumber) body.bankTransitNumber = input.bankTransitNumber;
    if (input.bankRoutingNumber) body.bankRoutingNumber = input.bankRoutingNumber;
    if (input.firstName) body.firstName = input.firstName;
    if (input.lastName) body.lastName = input.lastName;
    if (input.companyName) body.companyName = input.companyName;
    const raw = await request('POST', `/customers/${customerId}/bank-accounts`, { body });
    const data = unwrapDataObject(raw);
    const id = firstNumber(data, ['id', 'Id']) ?? 0;
    const message = firstString(data, ['message', 'Message']) ?? '';
    return { id, message };
  }

  /** List a customer's bank accounts. */
  async function getCustomerBankAccounts(customerId: number): Promise<HelcimBankAccount[]> {
    assertPositiveInteger(
      customerId,
      'Helcim getCustomerBankAccounts requires a positive integer customerId'
    );
    const raw = await request('GET', `/customers/${customerId}/bank-accounts`);
    const arr = Array.isArray(raw)
      ? raw
      : (firstArray(raw, ['data', 'bankAccounts', 'bank_accounts']) ?? []);
    return arr.map(decodeBankAccount);
  }

  /** Retrieve a single bank account for a customer. */
  async function getBankAccount(
    customerId: number,
    bankAccountId: number
  ): Promise<HelcimBankAccount> {
    assertPositiveInteger(
      customerId,
      'Helcim getBankAccount requires a positive integer customerId'
    );
    assertPositiveInteger(
      bankAccountId,
      'Helcim getBankAccount requires a positive integer bankAccountId'
    );
    const raw = await request('GET', `/customers/${customerId}/bank-accounts/${bankAccountId}`);
    return decodeBankAccount(unwrapDataObject(raw));
  }

  /** Set a customer's default bank account. */
  async function setBankAccountDefault(
    customerId: number,
    bankAccountId: number
  ): Promise<boolean> {
    assertPositiveInteger(
      customerId,
      'Helcim setBankAccountDefault requires a positive integer customerId'
    );
    assertPositiveInteger(
      bankAccountId,
      'Helcim setBankAccountDefault requires a positive integer bankAccountId'
    );
    await request('PATCH', `/customers/${customerId}/bank-accounts/${bankAccountId}/default`);
    return true;
  }

  /** Request that a customer add a new bank account via Helcim's hosted flow. */
  async function requestNewBankAccount(customerId: number): Promise<{ message: string }> {
    assertPositiveInteger(
      customerId,
      'Helcim requestNewBankAccount requires a positive integer customerId'
    );
    const raw = await request('POST', `/customers/${customerId}/bank-accounts/request`);
    const message = firstString(raw, ['message', 'Message']) ?? '';
    return { message };
  }

  // ─── PAD agreements ────────────────────────────────────────────────────
  /** List pre-authorized debit (PAD) agreements for a customer. */
  async function getPADs(customerId: number): Promise<HelcimPADAgreement[]> {
    assertPositiveInteger(customerId, 'Helcim getPADs requires a positive integer customerId');
    const raw = await request('GET', `/customers/${customerId}/pads`);
    const arr = Array.isArray(raw) ? raw : (firstArray(raw, ['data', 'pads', 'Pads']) ?? []);
    return arr.map(decodePADAgreement);
  }

  /** Retrieve a single PAD agreement for a customer. */
  async function getPAD(customerId: number, padId: number): Promise<HelcimPADAgreement> {
    assertPositiveInteger(customerId, 'Helcim getPAD requires a positive integer customerId');
    assertPositiveInteger(padId, 'Helcim getPAD requires a positive integer padId');
    const raw = await request('GET', `/customers/${customerId}/pads/${padId}`);
    return decodePADAgreement(unwrapDataObject(raw));
  }

  /** Update a PAD agreement (acceptance or status). */
  async function updatePAD(
    customerId: number,
    padId: number,
    updates: { accepted?: boolean; status?: number }
  ): Promise<HelcimPADAgreement> {
    assertPositiveInteger(customerId, 'Helcim updatePAD requires a positive integer customerId');
    assertPositiveInteger(padId, 'Helcim updatePAD requires a positive integer padId');
    const body: Record<string, unknown> = {};
    if (updates.accepted !== undefined) body.accepted = numericBoolean(updates.accepted);
    body.status = updates.status;
    const raw = await request('PUT', `/customers/${customerId}/pads/${padId}`, { body });
    return decodePADAgreement(unwrapDataObject(raw));
  }

  // ─── ACH transactions ──────────────────────────────────────────────────
  /** Withdraw funds from a customer's bank account via ACH/PAD. */
  async function processACHWithdraw(
    input: ProcessACHWithdrawInput,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimACHTransaction> {
    assertPositiveInteger(
      input.bankAccountId,
      'Helcim processACHWithdraw requires a positive integer bankAccountId'
    );
    assertPositiveInteger(
      input.customerId,
      'Helcim processACHWithdraw requires a positive integer customerId'
    );
    assertPositiveAmount(input.amount, 'processACHWithdraw amount');
    if (
      input.currencyId !== HELCIM_ACH_CURRENCY.CAD &&
      input.currencyId !== HELCIM_ACH_CURRENCY.USD
    ) {
      throw new Error('Helcim processACHWithdraw currencyId must be 1 (CAD) or 2 (USD)');
    }
    const body: Record<string, unknown> = {
      bankAccountId: input.bankAccountId,
      customerId: input.customerId,
      amount: input.amount,
      currencyId: input.currencyId,
    };
    body.orderId = input.orderId;
    const raw = await request('PUT', '/ach/withdraw', { body, idempotencyKey });
    return decodeACHTransaction(unwrapRecord(raw, ['transaction']));
  }

  /** Retrieve a single ACH transaction by id. */
  async function getACHTransaction(transactionId: number): Promise<HelcimACHTransaction> {
    assertPositiveInteger(
      transactionId,
      'Helcim getACHTransaction requires a positive integer transactionId'
    );
    const raw = await request('GET', `/ach/transactions/${transactionId}`);
    return decodeACHTransaction(unwrapRecord(raw, ['transaction', 'data']));
  }

  /** List ACH transactions, optionally filtered by customer. */
  async function getACHTransactions(
    params: {
      customerId?: number;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<HelcimACHTransaction[]> {
    const raw = await request('GET', '/ach/transactions', {
      query: {
        customerId: params.customerId,
        page: params.page,
        limit: params.limit,
      },
    });
    const arr = Array.isArray(raw) ? raw : (firstArray(raw, ['data', 'transactions']) ?? []);
    return arr.map(decodeACHTransaction);
  }

  /** Refund a settled ACH transaction. */
  async function refundACH(
    transactionId: number,
    amount: number,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimACHTransaction> {
    assertPositiveInteger(
      transactionId,
      'Helcim refundACH requires a positive integer transactionId'
    );
    assertPositiveAmount(amount, 'refundACH amount');
    const raw = await request('POST', `/ach/refund/${transactionId}`, {
      body: { amount },
      idempotencyKey,
    });
    return decodeACHTransaction(unwrapRecord(raw, ['transaction']));
  }

  /** Void an ACH transaction before it is settled. */
  async function voidACH(
    transactionId: number,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimACHTransaction> {
    assertPositiveInteger(
      transactionId,
      'Helcim voidACH requires a positive integer transactionId'
    );
    const raw = await request('POST', `/ach/void/${transactionId}`, { idempotencyKey });
    return decodeACHTransaction(unwrapRecord(raw, ['transaction']));
  }

  /** Cancel a pending ACH transaction. */
  async function cancelACH(
    transactionId: number,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<HelcimACHTransaction> {
    assertPositiveInteger(
      transactionId,
      'Helcim cancelACH requires a positive integer transactionId'
    );
    const raw = await request('POST', `/ach/cancel/${transactionId}`, { idempotencyKey });
    return decodeACHTransaction(unwrapRecord(raw, ['transaction']));
  }

  return {
    createBankAccount,
    getCustomerBankAccounts,
    getBankAccount,
    setBankAccountDefault,
    requestNewBankAccount,
    getPADs,
    getPAD,
    updatePAD,
    processACHWithdraw,
    getACHTransaction,
    getACHTransactions,
    refundACH,
    voidACH,
    cancelACH,
  };
}
