import sqlite3 from 'sqlite3';
import { allItems } from '../../../reference-data/item';
import { runInTransaction } from '../../../infrastructure/database/sqlite';
import {
  creditActiveTrainerBalance,
  findActiveTrainerInventoryItems,
  recordActiveTrainerSale,
  reduceActiveTrainerInventory,
  removeEmptyActiveTrainerInventory,
} from './item.repository';

export interface SaleRequestItem {
  id: number;
  quantity: number;
}

export interface SoldItem {
  id: number;
  quantity: number;
  value: number;
}

export interface SaleResult {
  totalValue: number;
  items: SoldItem[];
}

export class ItemSaleError extends Error {}

export async function sellInventoryItems(
  database: sqlite3.Database,
  requestedItems: readonly SaleRequestItem[]
): Promise<SaleResult> {
  return runInTransaction(database, async () => {
    const inventory = await findActiveTrainerInventoryItems(
      database,
      requestedItems.map((item) => item.id)
    );
    const soldItems: SoldItem[] = [];

    for (const requestedItem of requestedItems) {
      const inventoryItem = inventory.find((item) => item.item_id === requestedItem.id);
      if (!inventoryItem || inventoryItem.quantity < requestedItem.quantity) {
        throw new ItemSaleError(`Insufficient quantity for item ${requestedItem.id}`);
      }

      const item = allItems.find((candidate) => candidate.id === requestedItem.id);
      if (!item || !item.sellPrice) {
        throw new ItemSaleError(`Item ${requestedItem.id} cannot be sold`);
      }

      soldItems.push({
        id: requestedItem.id,
        quantity: requestedItem.quantity,
        value: item.sellPrice * requestedItem.quantity,
      });
    }

    const totalValue = soldItems.reduce((total, item) => total + item.value, 0);
    await creditActiveTrainerBalance(database, totalValue);
    await recordActiveTrainerSale(
      database,
      totalValue,
      `Sold ${requestedItems.reduce((total, item) => total + item.quantity, 0)} items`
    );

    for (const item of soldItems) {
      await reduceActiveTrainerInventory(database, item.id, item.quantity);
    }
    await removeEmptyActiveTrainerInventory(database);

    return { totalValue, items: soldItems };
  });
}
