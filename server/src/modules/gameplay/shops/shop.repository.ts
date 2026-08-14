import sqlite3 from 'sqlite3';
import {
  queryAll,
  queryOne,
  runStatement,
  type StatementResult,
} from '../../../infrastructure/database/sqlite';

export interface ShopItemRow {
  item_id: number;
  price: number;
  stock: number | null;
}

export interface ShopAccessRow extends Record<string, unknown> {
  id: number;
  name: string;
  is_accessible: number;
  location_description: string | null;
}

export interface ShopWriteInput {
  name?: string;
  scope?: string;
  region_id?: number | null;
  terrain_id?: number | null;
  location_id?: number | null;
  description?: string | null;
  markup?: number | null;
  items?: ShopItemRow[];
}

const ACCESS_SQL = `
  WITH location_info AS (
    SELECT l.id AS location_id, l.region_id, lt.terrain_id
    FROM location l
    LEFT JOIN location_terrain lt ON l.id = lt.location_id
    JOIN game_state gs ON l.id = gs.active_location_id
  ), shop_with_location AS (
    SELECT s.*, CASE
      WHEN s.scope = 'special' THEN (
        SELECT l.name || ' in ' || r.name
        FROM location l JOIN region r ON l.region_id = r.id
        WHERE l.id = s.location_id
      )
      WHEN s.scope = 'regional' AND s.region_id IS NOT NULL THEN (
        SELECT r.name || ' region' FROM region r WHERE r.id = s.region_id
      )
      WHEN s.scope = 'regional' AND s.terrain_id IS NOT NULL THEN (
        SELECT t.name || ' areas' FROM terrain t WHERE t.id = s.terrain_id
      )
    END AS location_description,
    EXISTS (
      SELECT 1 FROM location_info li
      WHERE (s.scope = 'special' AND s.location_id = li.location_id)
         OR (s.scope = 'regional' AND s.region_id = li.region_id)
         OR (s.scope = 'regional' AND s.terrain_id = li.terrain_id)
    ) AS is_accessible
    FROM shop s
    WHERE s.id = ?
  )
  SELECT * FROM shop_with_location
`;

export function findAvailableShops(database: sqlite3.Database): Promise<Array<Record<string, unknown>>> {
  return queryAll(database, `
    WITH location_info AS (
      SELECT l.id AS location_id, l.region_id, lt.terrain_id
      FROM location l
      LEFT JOIN location_terrain lt ON l.id = lt.location_id
      JOIN game_state gs ON l.id = gs.active_location_id
    )
    SELECT DISTINCT s.*
    FROM shop s
    JOIN location_info li
    WHERE (s.scope = 'special' AND s.location_id = li.location_id)
       OR (s.scope = 'regional' AND s.region_id = li.region_id)
       OR (s.scope = 'regional' AND s.terrain_id = li.terrain_id)
  `);
}

export function findAccessibleShop(database: sqlite3.Database, shopId: string): Promise<ShopAccessRow | null> {
  return queryOne(database, ACCESS_SQL, [shopId]);
}

export function findShopItems(database: sqlite3.Database, shopId: string): Promise<ShopItemRow[]> {
  return queryAll(
    database,
    'SELECT si.item_id, si.price, si.stock FROM shop_item si WHERE si.shop_id = ?',
    [shopId]
  );
}

export function findShopItemsByIds(
  database: sqlite3.Database,
  shopId: string,
  itemIds: number[]
): Promise<ShopItemRow[]> {
  return queryAll(
    database,
    `SELECT si.item_id, si.price, si.stock FROM shop_item si
     WHERE si.shop_id = ? AND si.item_id IN (${itemIds.map(() => '?').join(', ')})`,
    [shopId, ...itemIds]
  );
}

export function findAllShops(database: sqlite3.Database): Promise<Array<Record<string, unknown>>> {
  return queryAll(database, `
    SELECT s.*, r.name AS region_name, t.name AS terrain_name, l.name AS location_name
    FROM shop s
    LEFT JOIN region r ON s.region_id = r.id
    LEFT JOIN terrain t ON s.terrain_id = t.id
    LEFT JOIN location l ON s.location_id = l.id
    ORDER BY s.name
  `);
}

export function findShopForEditing(
  database: sqlite3.Database,
  shopId: string
): Promise<Record<string, unknown> | null> {
  return queryOne(database, `
    SELECT s.*, r.name AS region_name, t.name AS terrain_name, l.name AS location_name
    FROM shop s
    LEFT JOIN region r ON s.region_id = r.id
    LEFT JOIN terrain t ON s.terrain_id = t.id
    LEFT JOIN location l ON s.location_id = l.id
    WHERE s.id = ?
  `, [shopId]);
}

export function findActiveBalance(
  database: sqlite3.Database,
  requiredBalance: number
): Promise<{ balance: number } | null> {
  return queryOne(database, `
    SELECT tf.balance
    FROM trainer_finance tf
    JOIN game_state gs ON tf.trainer_id = gs.active_trainer_id
    WHERE tf.balance >= ?
  `, [requiredBalance]);
}

export function debitActiveBalance(database: sqlite3.Database, amount: number): Promise<void> {
  return runStatement(database, `
    UPDATE trainer_finance
    SET balance = balance - ?
    WHERE trainer_id = (SELECT active_trainer_id FROM game_state)
  `, [amount]).then(() => undefined);
}

export function recordPurchase(database: sqlite3.Database, amount: number, description: string): Promise<void> {
  return runStatement(database, `
    INSERT INTO financial_transaction (trainer_id, amount, description, date, category)
    VALUES (
      (SELECT active_trainer_id FROM game_state), ?, ?,
      (SELECT current_date || ' ' || current_time FROM game_state), 'item_purchase'
    )
  `, [amount, description]).then(() => undefined);
}

export function addActiveInventory(database: sqlite3.Database, itemId: number, quantity: number): Promise<void> {
  return runStatement(database, `
    INSERT INTO inventory (trainer_id, item_id, quantity)
    VALUES ((SELECT active_trainer_id FROM game_state), ?, ?)
    ON CONFLICT(trainer_id, item_id) DO UPDATE SET quantity = quantity + ?
  `, [itemId, quantity, quantity]).then(() => undefined);
}

function shopWriteValues(shop: ShopWriteInput): unknown[] {
  return [
    shop.name,
    shop.scope,
    shop.scope === 'regional' ? shop.region_id : null,
    shop.scope === 'regional' ? shop.terrain_id : null,
    shop.scope === 'special' ? shop.location_id : null,
    shop.description,
    shop.markup || 1.0,
  ];
}

export function updateShop(database: sqlite3.Database, shopId: string, shop: ShopWriteInput): Promise<void> {
  return runStatement(database, `
    UPDATE shop
    SET name = ?, scope = ?, region_id = ?, terrain_id = ?, location_id = ?, description = ?, markup = ?
    WHERE id = ?
  `, [...shopWriteValues(shop), shopId]).then(() => undefined);
}

export function createShop(database: sqlite3.Database, shop: ShopWriteInput): Promise<StatementResult> {
  return runStatement(database, `
    INSERT INTO shop (name, scope, region_id, terrain_id, location_id, description, markup)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, shopWriteValues(shop));
}

export function deleteShopItems(database: sqlite3.Database, shopId: string | number): Promise<void> {
  return runStatement(database, 'DELETE FROM shop_item WHERE shop_id = ?', [shopId]).then(() => undefined);
}

export function createShopItem(
  database: sqlite3.Database,
  shopId: string | number,
  item: ShopItemRow
): Promise<void> {
  return runStatement(
    database,
    'INSERT INTO shop_item (shop_id, item_id, price, stock) VALUES (?, ?, ?, ?)',
    [shopId, item.item_id, item.price, item.stock || null]
  ).then(() => undefined);
}
