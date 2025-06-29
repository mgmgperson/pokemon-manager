export interface Shop {
    id: number;
    name: string;
    scope: 'regional' | 'special';
    region_id: number | null;
    terrain_id: number | null;
    location_id: number | null;
    description: string;
    markup: number;
    location_description?: string;
    is_accessible?: boolean;
    items: ShopItem[];
}

export interface ShopItem {
    id: number;
    name: string;
    description: string;
    category: string;
    basePrice: number;
    price: number;
    stock: number | null;  // null means infinite stock
}
