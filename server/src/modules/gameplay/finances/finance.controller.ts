import { type Request, type Response } from 'express';
import { getActiveDB } from '../../../infrastructure/database/activeSave';
import { findActiveTrainerFinance, findTransactionPage } from './finance.repository';

const TRANSACTION_CATEGORIES = [
  'prize',
  'wages',
  'sponsor',
  'training',
  'travel',
  'item_purchase',
  'sale',
  'taxes',
  'misc',
];

interface TransactionQuery {
  limit?: string | string[];
  offset?: string | string[];
  category?: string | string[];
}

function parseIntegerOrDefault(value: string | string[] | undefined, defaultValue: number): number {
  const parsedValue = parseInt(value as string, 10);
  return parsedValue || defaultValue;
}

export async function getFinanceStatus(_request: Request, response: Response): Promise<void> {
  try {
    const finance = await findActiveTrainerFinance(getActiveDB());
    response.json({
      message: 'success',
      data: finance ?? { balance: 0, debt: 0 },
    });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function listTransactions(
  request: Request<Record<string, never>, unknown, unknown, TransactionQuery>,
  response: Response
): Promise<void> {
  try {
    const limit = parseIntegerOrDefault(request.query.limit, 50);
    const offset = parseIntegerOrDefault(request.query.offset, 0);
    const category = typeof request.query.category === 'string' ? request.query.category : undefined;
    const transactionPage = await findTransactionPage(getActiveDB(), limit, offset, category);

    response.json({ message: 'success', data: transactionPage });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export function listTransactionCategories(_request: Request, response: Response): void {
  response.json({ message: 'success', data: TRANSACTION_CATEGORIES });
}
