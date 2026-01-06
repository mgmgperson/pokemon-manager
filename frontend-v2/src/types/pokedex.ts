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

export interface PokemonVariety {
    id: number;
    name: string;
    is_default: boolean;
}

export interface PokemonDetail {
    id: number;
    name: string;
    types: string[];
    is_default: boolean;
    base_experience: number;
    abilities: string[];
    height: number;
    weight: number;
    base_stats: {
        hp: number;
        attack: number;
        defense: number;
        special_attack: number;
        special_defense: number;
        speed: number;
    };
    species: {
        id: number;
        name: string;
        generation: number;
        genera: string;
        base_happiness: number | null;
        capture_rate: number;
        egg_groups: string[];
        evolves_from: {
            id: number;
            name: string;
        } | null;
        forms_switchable: boolean;
        gender_rate: number;
        gender_ratio: string;
        growth_rate: string;
        has_gender_differences: boolean;
        hatch_counter: number | null;
        is_baby: boolean;
        is_legendary: boolean;
        is_mythical: boolean;
        varieties: PokemonVariety[];
    };
}

