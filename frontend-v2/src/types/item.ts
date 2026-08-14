import { ItemCategory } from '../../../server/src/reference-data/item';

export interface InventoryItem {
    id: number;
    name: string;
    category: ItemCategory;
    buyPrice: number | null;
    sellPrice: number | null;
    description: string;
    quantity: number;
}

export type GroupedInventory = {
    [K in ItemCategory]?: InventoryItem[];
};

export const categoryNames: Record<ItemCategory, string> = {
    [ItemCategory.POKEBALL]: 'Poké Balls',
    [ItemCategory.MEDICINE]: 'Medicine',
    [ItemCategory.BATTLE_ITEM]: 'Battle Items',
    [ItemCategory.EVOLUTION]: 'Evolution Items',
    [ItemCategory.HELD_ITEM]: 'Held Items',
    [ItemCategory.BERRY]: 'Berries',
    [ItemCategory.KEY_ITEM]: 'Key Items'
};
