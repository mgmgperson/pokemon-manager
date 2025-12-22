export interface PokemonEntity {
    id: number;
    name: string;
    types: string[];
    is_default: boolean;
    base_stats: {
        hp: number;
        attack: number;
        defense: number;
        special_attack: number;
        special_defense: number;
        speed: number;
    };
}

export interface PokemonSpecies {
    id: number;
    name: string;
    generation: number;
    is_legendary: boolean;
    is_mythical: boolean;
    base_happiness?: number;
    capture_rate?: number;
    genera?: string;
}
