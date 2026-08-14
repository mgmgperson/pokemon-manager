import sqlite3 from 'sqlite3';

export type SqliteParameters = readonly unknown[];

export interface StatementResult {
  changes: number;
  lastInsertId: number;
}

export interface TransactionOptions {
  rollbackOnSuccess?: boolean;
}

export async function runInTransaction<T>(
  database: sqlite3.Database,
  work: () => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  await runStatement(database, 'BEGIN TRANSACTION');

  try {
    const transactionResult = await work();
    await runStatement(database, options.rollbackOnSuccess ? 'ROLLBACK' : 'COMMIT');
    return transactionResult;
  } catch (error) {
    try {
      await runStatement(database, 'ROLLBACK');
    } catch (rollbackError) {
      console.error('Failed to roll back SQLite transaction:', rollbackError);
    }
    throw error;
  }
}

export function openDatabase(
  databasePath: string,
  mode: number = sqlite3.OPEN_READWRITE
): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    const database = new sqlite3.Database(databasePath, mode, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(database);
    });
  });
}

export function closeDatabase(database: sqlite3.Database): Promise<void> {
  return new Promise((resolve, reject) => {
    database.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

export function queryAll<T>(
  database: sqlite3.Database,
  sql: string,
  parameters: SqliteParameters = []
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    database.all(sql, parameters, (error: Error | null, rows: T[]) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

export function queryOne<T>(
  database: sqlite3.Database,
  sql: string,
  parameters: SqliteParameters = []
): Promise<T | null> {
  return new Promise((resolve, reject) => {
    database.get(sql, parameters, (error: Error | null, row: T | undefined) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row ?? null);
    });
  });
}

export function runStatement(
  database: sqlite3.Database,
  sql: string,
  parameters: SqliteParameters = []
): Promise<StatementResult> {
  return new Promise((resolve, reject) => {
    database.run(sql, parameters, function (error: Error | null) {
      if (error) {
        reject(error);
        return;
      }

      resolve({ changes: this.changes, lastInsertId: this.lastID });
    });
  });
}
