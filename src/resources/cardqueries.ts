import type { TransportRequest } from '../transport.js';
import type { HelcimCardTransaction } from '../types.js';
import { firstArray } from '../util.js';
import { decodeCardTransaction, assertPositiveInteger } from '../decode.js';

export interface cardTransactionQueriesContext {
  request: TransportRequest;
}

/** Endpoint group factory — composed by client.ts. */
export function createCardTransactionQueriesApi({ request }: cardTransactionQueriesContext) {
  // ─── Card transactions ─────────────────────────────────────────────────
  /** Retrieve a single card transaction by id. */
  async function getCardTransaction(transactionId: number): Promise<HelcimCardTransaction> {
    assertPositiveInteger(
      transactionId,
      'Helcim getCardTransaction requires a positive integer transactionId'
    );
    const raw = await request('GET', `/card-transactions/${transactionId}`);
    return decodeCardTransaction(raw);
  }

  /** List card transactions, optionally filtered by customer or date range. */
  async function getCardTransactions(
    params: {
      customerCode?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<HelcimCardTransaction[]> {
    const raw = await request('GET', '/card-transactions', {
      query: {
        customerCode: params.customerCode,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        page: params.page,
        limit: params.limit,
      },
    });
    const arr = firstArray(raw, ['data', 'cardTransactions', 'transactions']) ?? [];
    return arr.map(decodeCardTransaction);
  }

  return {
    getCardTransaction,
    getCardTransactions,
  };
}
