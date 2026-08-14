import sqlite3 from 'sqlite3';
import { queryAll, queryOne, runStatement } from '../../../infrastructure/database/sqlite';

export interface Message {
  id: number;
  sent_at: string;
  sender: string | null;
  subject: string;
  body: string;
  is_read: number | null;
  message_type: string | null;
}

export function findRecentMessages(database: sqlite3.Database): Promise<Message[]> {
  return queryAll<Message>(
    database,
    `
      SELECT *
      FROM message
      ORDER BY sent_at DESC
      LIMIT 50
    `
  );
}

export function findMessageById(
  database: sqlite3.Database,
  messageId: string
): Promise<Message | null> {
  return queryOne<Message>(database, 'SELECT * FROM message WHERE id = ?', [messageId]);
}

export function markMessageRead(database: sqlite3.Database, messageId: string): Promise<void> {
  return runStatement(
    database,
    'UPDATE message SET is_read = TRUE WHERE id = ?',
    [messageId]
  ).then(() => undefined);
}
