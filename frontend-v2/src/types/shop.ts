// Shop type used in locations
export interface LocationShop {
    id: number;
    name: string;
    description: string;
    scope: 'special' | 'regional';
    shop_type: string;
}

// Full shop type
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

// Extended interface for editing that includes related entities
export interface EditableShop extends Shop {
    region_name?: string;
    terrain_name?: string;
    location_name?: string;
}

// Basic interfaces for dropdowns
export interface BasicRegion {
    id: number;
    name: string;
}

export interface BasicTerrain {
    id: number;
    name: string;
}

export interface BasicLocation {
    id: number;
    name: string;
    region_id: number;
}

export interface BasicItem {
    id: number;
    name: string;
    description: string;
    category: string;
    buyPrice: number;
    sellPrice: number;
}

// For shop item management
export interface ShopItemFormData {
    item_id: number;
    price: number;
    stock: number | null;
}
