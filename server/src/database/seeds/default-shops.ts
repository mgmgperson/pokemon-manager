import { Items } from '../../reference-data/enums/items'

// CREATE TABLE shop (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     name TEXT NOT NULL,
//     -- 'regional' means “applies to all locations tagged with X terrain OR region”
//     -- 'special'  means “only at the specific location below”
//     scope TEXT NOT NULL CHECK(scope IN ('regional', 'special')),
//     region_id   INTEGER,
//     terrain_id  INTEGER,
//     location_id INTEGER,
//     description TEXT,
//     markup REAL DEFAULT 1.00,

//     FOREIGN KEY (region_id)  REFERENCES region(id),
//     FOREIGN KEY (terrain_id) REFERENCES terrain(id),
//     FOREIGN KEY (location_id)REFERENCES location(id)
// );

// CREATE TABLE shop_item (
//     shop_id  INTEGER NOT NULL,
//     item_id  INTEGER NOT NULL,
//     price    INTEGER NOT NULL,
//     stock    INTEGER,            -- NULL = infinite stock
//     PRIMARY KEY (shop_id, item_id),
//     FOREIGN KEY (shop_id) REFERENCES shop(id)
// );

interface Shop {
  id: number;
  name: string;
  scope: 'regional' | 'special'; 
  regionId?: number; 
  terrainId?: number; 
  locationId?: number; 
  description?: string; 
  markup: number; 
  items: { itemId: Items; price: number; stock?: number }[]; 
}

export const defaultShops: Shop[] = [
  {
    id: 1,
    name: 'Kanto PokéMart',
    scope: 'regional',
    regionId: 1,           // Kanto
    terrainId: 33,         // urban_core
    description: 'A general store for all your Pokémon needs.',
    markup: 1.00,
    items: [
      { itemId: Items.POKE_BALL,  price: 200 },
      { itemId: Items.POTION,     price: 300 },
      { itemId: Items.ANTIDOTE,   price: 100 }
    ]
  }
]
