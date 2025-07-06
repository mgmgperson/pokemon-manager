export interface Terrain {
    id: number;
    code: string;
    name: string;
    description: string;
}

export interface LocationTerrain {
    terrain_id: number;
    rate: number;
    field_id: number | null;
}
