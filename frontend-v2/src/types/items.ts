export enum ItemCategory {
    POKEBALL = 0,
    MEDICINE = 1,
    BATTLE_ITEMS = 2,
    BERRIES = 3,
    OTHER = 4
}

export interface InventoryItem {
    id: number;
    name: string;
    category: ItemCategory;
    buyPrice: number | null;
    sellPrice: number | null;
    description: string;
    quantity: number;
}

export interface GroupedInventory {
    [key: number]: InventoryItem[];
}
