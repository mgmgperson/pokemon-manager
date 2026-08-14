import { Items } from "./enums/items";

/* High-level buckets for UI filters, shop rules, etc. */
export enum ItemCategory {
  POKEBALL,
  MEDICINE,
  BATTLE_ITEM,
  EVOLUTION,
  HELD_ITEM,
  BERRY,
  KEY_ITEM
}

export interface ItemEffect {
  captureRateMod?: number;   // Poké Balls
  hpRestore?: number;        // Potions / Berries
  statusCure?: 'poison' | 'paralysis' | 'freeze' | 'burn' | 'sleep';
  evolvesSpecies?: boolean;  // Stones
}

export class Item {
  constructor(
    public readonly id: Items,
    public readonly name: string,
    public readonly category: ItemCategory,
    public readonly buyPrice: number | null,  // null if not purchasable
    public readonly sellPrice: number | null, // null if not sellable
    public readonly description: string,
    public readonly effect: ItemEffect = {}
  ) {}
}

export const allItems: Item[] = [
  new Item( Items.POKE_BALL, 'Poké Ball', ItemCategory.POKEBALL, 200, 100, 'A device for catching wild Pokémon.',
    { captureRateMod: 1 }
  ),
  new Item( Items.GREAT_BALL, 'Great Ball', ItemCategory.POKEBALL, 600, 300, 'A good, high-performance Ball that provides a higher success rate.',
    { captureRateMod: 1.5 }
  ),
  new Item( Items.POTION, 'Potion', ItemCategory.MEDICINE, 300, 150, 'A spray-type medicine for treating wounds. It can be used to restore 20 HP to a single Pokémon.',
    { hpRestore: 20 }
  )
]