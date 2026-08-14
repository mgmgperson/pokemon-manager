import { type Request, type Response } from 'express';
import { allItems } from '../../../reference-data/item';
import { getActiveDB } from '../../../infrastructure/database/activeSave';
import { findActiveTrainerInventory } from './item.repository';
import { ItemSaleError, sellInventoryItems, type SaleRequestItem } from './item.service';

interface InventoryItemResponse {
  id: number;
  name: string;
  category: number;
  buyPrice: number | null;
  sellPrice: number | null;
  description: string;
  quantity: number;
}

interface SaleBody {
  items?: unknown;
}

function parseSaleItems(value: unknown): SaleRequestItem[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const parsedItems: SaleRequestItem[] = [];
  const itemIds = new Set<number>();
  for (const item of value) {
    if (
      typeof item !== 'object' ||
      item === null ||
      !Number.isSafeInteger((item as { id?: unknown }).id) ||
      !Number.isSafeInteger((item as { quantity?: unknown }).quantity) ||
      (item as { id: number }).id <= 0 ||
      (item as { quantity: number }).quantity <= 0
    ) {
      return null;
    }

    const saleItem = item as SaleRequestItem;
    if (itemIds.has(saleItem.id)) {
      return null;
    }
    itemIds.add(saleItem.id);
    parsedItems.push(saleItem);
  }

  return parsedItems;
}

export async function getInventory(_request: Request, response: Response): Promise<void> {
  try {
    const inventory = await findActiveTrainerInventory(getActiveDB());
    const groupedInventory: Record<number, InventoryItemResponse[]> = {};

    for (const inventoryItem of inventory) {
      const item = allItems.find((candidate) => candidate.id === inventoryItem.item_id);
      if (!item) {
        continue;
      }
      const categoryItems = groupedInventory[item.category] ?? [];
      categoryItems.push({
        id: inventoryItem.item_id,
        name: item.name,
        category: item.category,
        buyPrice: item.buyPrice,
        sellPrice: item.sellPrice,
        description: item.description,
        quantity: inventoryItem.quantity,
      });
      groupedInventory[item.category] = categoryItems;
    }

    response.json({ message: 'success', data: groupedInventory });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function sellItems(
  request: Request<Record<string, never>, unknown, SaleBody>,
  response: Response
): Promise<void> {
  const saleItems = parseSaleItems(request.body.items);
  if (!saleItems) {
    response.status(400).json({ error: 'Items must be a non-empty list of positive item IDs and quantities' });
    return;
  }

  try {
    const sale = await sellInventoryItems(getActiveDB(), saleItems);
    response.json({ message: 'success', data: sale });
  } catch (error) {
    if (error instanceof ItemSaleError) {
      response.status(400).json({ error: error.message });
      return;
    }
    response.status(400).json({ error: (error as Error).message });
  }
}

export function listItemCatalog(_request: Request, response: Response): void {
  response.json({
    message: 'success',
    data: allItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      buyPrice: item.buyPrice,
      sellPrice: item.sellPrice,
    })),
  });
}
