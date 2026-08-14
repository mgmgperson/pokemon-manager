import sqlite3 from 'sqlite3';
import { runInTransaction } from '../../../infrastructure/database/sqlite';
import {
  addActiveInventory,
  createShop,
  createShopItem,
  debitActiveBalance,
  deleteShopItems,
  findActiveBalance,
  findShopItemsByIds,
  recordPurchase,
  updateShop,
  type ShopWriteInput,
} from './shop.repository';

export interface RequestedItem { id: number; quantity: number; }
export interface PurchasedItem extends RequestedItem { price: number; }
export class ShopOperationError extends Error {
  constructor(message: string, readonly status: number = 400) { super(message); }
}

export async function buyShopItems(
  database: sqlite3.Database,
  shopId: string,
  shopName: string,
  items: RequestedItem[]
): Promise<{ totalCost: number; items: PurchasedItem[] }> {
  const shopItems = await findShopItemsByIds(database, shopId, items.map((item) => item.id));
  const purchased = items.map((item) => {
    const shopItem = shopItems.find((candidate) => candidate.item_id === item.id);
    if (!shopItem) throw new ShopOperationError(`Item ${item.id} not available in this shop`);
    if (shopItem.stock !== null && shopItem.stock < item.quantity) throw new ShopOperationError(`Not enough stock for item ${item.id}`);
    return { ...item, price: shopItem.price };
  });
  const totalCost = purchased.reduce((total, item) => total + item.price * item.quantity, 0);
  await runInTransaction(database, async () => {
    if (!await findActiveBalance(database, totalCost)) throw new ShopOperationError('Insufficient funds');
    await debitActiveBalance(database, totalCost);
    await recordPurchase(database, -totalCost, `Purchased items from ${shopName}`);
    for (const item of purchased) await addActiveInventory(database, item.id, item.quantity);
  });
  return { totalCost, items: purchased };
}

export async function updateShopDetails(database: sqlite3.Database, shopId: string, shop: ShopWriteInput): Promise<void> {
  await runInTransaction(database, async () => {
    await updateShop(database, shopId, shop);
    if (!Array.isArray(shop.items)) return;
    await deleteShopItems(database, shopId);
    for (const item of shop.items) await createShopItem(database, shopId, item);
  });
}

export function createShopDetails(database: sqlite3.Database, shop: ShopWriteInput): Promise<number> {
  return runInTransaction(database, async () => {
    const statement = await createShop(database, shop);
    if (Array.isArray(shop.items)) {
      for (const item of shop.items) await createShopItem(database, statement.lastInsertId, item);
    }
    return statement.lastInsertId;
  });
}
