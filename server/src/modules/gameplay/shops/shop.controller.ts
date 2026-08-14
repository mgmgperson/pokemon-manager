import { type Request, type Response } from 'express';
import { allItems } from '../../../reference-data/item';
import { getActiveDB } from '../../../infrastructure/database/activeSave';
import {
  findAccessibleShop,
  findAllShops,
  findAvailableShops,
  findShopForEditing,
  findShopItems,
  type ShopItemRow,
  type ShopWriteInput,
} from './shop.repository';
import {
  ShopOperationError,
  buyShopItems,
  createShopDetails,
  updateShopDetails,
  type RequestedItem,
} from './shop.service';

function enrichItems(items: ShopItemRow[]) {
  return items.map((item) => {
    const details = allItems.find((candidate) => candidate.id === item.item_id);
    return details ? {
      id: item.item_id,
      name: details.name,
      description: details.description,
      category: details.category,
      basePrice: details.buyPrice,
      price: item.price,
      stock: item.stock,
    } : null;
  }).filter((item): item is NonNullable<typeof item> => item !== null);
}

function validateShop(shop: ShopWriteInput): string | null {
  if (!shop.name || !shop.scope) return 'Name and scope are required';
  if (shop.scope === 'regional' && (!shop.region_id || !shop.terrain_id)) return 'Regional shops require both region_id and terrain_id';
  if (shop.scope === 'special' && !shop.location_id) return 'Special shops require location_id';
  return null;
}

function validRequestedItems(items: unknown): items is RequestedItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    return false;
  }

  const itemIds = new Set<number>();
  for (const item of items) {
    if (
      typeof item !== 'object' ||
      item === null ||
      !Number.isSafeInteger((item as { id?: unknown }).id) ||
      !Number.isSafeInteger((item as { quantity?: unknown }).quantity) ||
      (item as { id: number }).id <= 0 ||
      (item as { quantity: number }).quantity <= 0
    ) {
      return false;
    }

    const requestedItem = item as RequestedItem;
    if (itemIds.has(requestedItem.id)) {
      return false;
    }
    itemIds.add(requestedItem.id);
  }

  return true;
}

async function accessibleShopOrResponse(shopId: string, response: Response) {
  const shop = await findAccessibleShop(getActiveDB(), shopId);
  if (!shop) {
    response.status(404).json({ error: 'Shop not found' });
    return null;
  }
  if (!shop.is_accessible) {
    response.status(403).json({ error: `This shop is only available in ${shop.location_description}` });
    return null;
  }
  return shop;
}

export async function listAvailableShops(_request: Request, response: Response): Promise<void> {
  try {
    const shops = await findAvailableShops(getActiveDB());
    response.json({ message: 'success', data: shops });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function getShop(request: Request<{ id: string }>, response: Response): Promise<void> {
  try {
    const shop = await accessibleShopOrResponse(request.params.id, response);
    if (!shop) return;
    response.json({ message: 'success', data: { ...shop, items: enrichItems(await findShopItems(getActiveDB(), request.params.id)) } });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function buyItems(request: Request<{ id: string }, unknown, { items?: RequestedItem[] }>, response: Response): Promise<void> {
  if (!validRequestedItems(request.body.items)) {
    response.status(400).json({
      error: 'Items must be a non-empty list of unique positive item IDs and quantities',
    });
    return;
  }
  try {
    const shop = await accessibleShopOrResponse(request.params.id, response);
    if (!shop) return;
    response.json({ message: 'success', data: await buyShopItems(getActiveDB(), request.params.id, shop.name, request.body.items) });
  } catch (error) {
    response.status(error instanceof ShopOperationError ? error.status : 400).json({
      error: (error as Error).message,
    });
  }
}

export async function listShops(_request: Request, response: Response): Promise<void> {
  try {
    const shops = await findAllShops(getActiveDB());
    response.json({ message: 'success', data: shops });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function updateShopController(request: Request<{ id: string }, unknown, ShopWriteInput>, response: Response): Promise<void> {
  const validationError = validateShop(request.body);
  if (validationError) {
    response.status(400).json({ error: validationError });
    return;
  }
  try {
    await updateShopDetails(getActiveDB(), request.params.id, request.body);
    response.json({ message: 'Shop updated successfully', data: { id: request.params.id } });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function getShopForEditing(request: Request<{ id: string }>, response: Response): Promise<void> {
  try {
    const shop = await findShopForEditing(getActiveDB(), request.params.id);
    if (!shop) {
      response.status(404).json({ error: 'Shop not found' });
      return;
    }
    response.json({ message: 'success', data: { ...shop, items: enrichItems(await findShopItems(getActiveDB(), request.params.id)) } });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function createShopController(
  request: Request<Record<string, never>, unknown, ShopWriteInput>,
  response: Response
): Promise<void> {
  const validationError = validateShop(request.body);
  if (validationError) {
    response.status(400).json({ error: validationError });
    return;
  }
  try {
    response.json({ message: 'Shop created successfully', data: { id: await createShopDetails(getActiveDB(), request.body) } });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}
