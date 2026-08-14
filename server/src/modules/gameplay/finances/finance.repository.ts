import sqlite3 from 'sqlite3';
import { queryAll, queryOne } from '../../../infrastructure/database/sqlite';

export interface FinanceStatus {
  balance: number | null;
  debt: number | null;
}

export interface FinancialTransaction {
  id: number;
  trainer_id: number;
  amount: number;
  description: string | null;
  date: string;
  category: string | null;
}

interface TransactionCountRow {
  total: number;
}

export interface TransactionPage {
  transactions: FinancialTransaction[];
  total: number;
  limit: number;
  offset: number;
}

export function findActiveTrainerFinance(database: sqlite3.Database): Promise<FinanceStatus | null> {
  return queryOne<FinanceStatus>(
    database,
    `
      SELECT tf.balance, tf.debt
      FROM trainer_finance tf
      JOIN game_state gs ON tf.trainer_id = gs.active_trainer_id
    `
  );
}

export async function findTransactionPage(
  database: sqlite3.Database,
  limit: number,
  offset: number,
  category?: string
): Promise<TransactionPage> {
  const categoryClause = category ? ' WHERE ft.category = ?' : '';
  const categoryParameters = category ? [category] : [];
  const transactionsSql = `
    SELECT ft.*
    FROM financial_transaction ft
    JOIN game_state gs ON ft.trainer_id = gs.active_trainer_id
    ${categoryClause}
    ORDER BY ft.date DESC
    LIMIT ? OFFSET ?
  `;
  const countSql = `
    SELECT COUNT(*) AS total
    FROM financial_transaction ft
    JOIN game_state gs ON ft.trainer_id = gs.active_trainer_id
    ${categoryClause}
  `;
  const [countRow, transactions] = await Promise.all([
    queryOne<TransactionCountRow>(database, countSql, categoryParameters),
    queryAll<FinancialTransaction>(database, transactionsSql, [
      ...categoryParameters,
      limit,
      offset,
    ]),
  ]);

  return {
    transactions,
    total: countRow?.total ?? 0,
    limit,
    offset,
  };
}
