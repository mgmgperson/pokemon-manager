import sqlite3 from 'sqlite3';
import { queryAll, runStatement } from '../../../infrastructure/database/sqlite';

export interface InventoryRow {
  item_id: number;
  quantity: number;
}

export function findActiveTrainerInventory(database: sqlite3.Database): Promise<InventoryRow[]> {
  return queryAll<InventoryRow>(
    database,
    `
      SELECT i.item_id, i.quantity
      FROM inventory i
      JOIN game_state gs ON i.trainer_id = gs.active_trainer_id
      WHERE i.quantity > 0
    `
  );
}

export function findActiveTrainerInventoryItems(
  database: sqlite3.Database,
  itemIds: readonly number[]
): Promise<InventoryRow[]> {
  const placeholders = itemIds.map(() => '?').join(', ');
  return queryAll<InventoryRow>(
    database,
    `
      SELECT i.item_id, i.quantity
      FROM inventory i
      JOIN game_state gs ON i.trainer_id = gs.active_trainer_id
      WHERE i.item_id IN (${placeholders})
    `,
    itemIds
  );
}

export function creditActiveTrainerBalance(
  database: sqlite3.Database,
  amount: number
): Promise<void> {
  return runStatement(
    database,
    `
      UPDATE trainer_finance
      SET balance = balance + ?
      WHERE trainer_id = (SELECT active_trainer_id FROM game_state)
    `,
    [amount]
  ).then(() => undefined);
}

export function recordActiveTrainerSale(
  database: sqlite3.Database,
  amount: number,
  description: string
): Promise<void> {
  return runStatement(
    database,
    `
      INSERT INTO financial_transaction (trainer_id, amount, description, date, category)
      VALUES (
        (SELECT active_trainer_id FROM game_state),
        ?,
        ?,
        (SELECT current_date || ' ' || current_time FROM game_state),
        'sale'
      )
    `,
    [amount, description]
  ).then(() => undefined);
}

export function reduceActiveTrainerInventory(
  database: sqlite3.Database,
  itemId: number,
  quantity: number
): Promise<void> {
  return runStatement(
    database,
    `
      UPDATE inventory
      SET quantity = quantity - ?
      WHERE trainer_id = (SELECT active_trainer_id FROM game_state)
      AND item_id = ?
    `,
    [quantity, itemId]
  ).then(() => undefined);
}

export function removeEmptyActiveTrainerInventory(database: sqlite3.Database): Promise<void> {
  return runStatement(
    database,
    `
      DELETE FROM inventory
      WHERE quantity <= 0
      AND trainer_id = (SELECT active_trainer_id FROM game_state)
    `
  ).then(() => undefined);
}
