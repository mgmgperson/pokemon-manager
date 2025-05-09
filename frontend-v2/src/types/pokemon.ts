export interface Pokemon {
    id: number;
    trainer_id: number;
    species_id: number;
    pokemon_id: number;
    level: number;
    ot_name: string;
    ot_id: number;
    nickname: string;
    attack: number;
    defense: number;
    special_attack: number;
    special_defense: number;
    speed: number;
    hp: number;
    happiness: number;
    iv_hp: number;
    iv_attack: number;
    iv_defense: number;
    iv_special_attack: number;
    iv_special_defense: number;
    iv_speed: number;
    ev_hp: number;
    ev_attack: number;
    ev_defense: number;
    ev_special_attack: number;
    ev_special_defense: number;
    ev_speed: number;
    nature_id: number;
    ability_id: number;
    gender: string;
    shiny: boolean;
    pokeball_id: number;
    held_item_id: number;
    experience_points: number;
    is_gigantamax: boolean;
    is_mega: boolean;
    date_met_at: string;
    location_met_at: string;
    level_met_at: number;
    current_hp: number;
    current_strength: number;
    status_id: number;
    battles_won: number;
    battles_lost: number;
    kills: number;
    deaths: number;
    training_efficiency: number;
    nature: string;
    hp_iv: number;
    attack_iv: number;
    defense_iv: number;
    special_attack_iv: number;
    special_defense_iv: number;
    speed_iv: number;
    hp_ev: number;
    attack_ev: number;
    defense_ev: number;
    special_attack_ev: number;
    special_defense_ev: number;
    speed_ev: number;
    created_at: string;
    updated_at: string;
}

export interface PokemonSpecies {
    id: number;
    name: string;
    base_experience: number;
    height: number;
    weight: number;
    stats: Array<{
        base_stat: number;
        effort: number;
        stat: {
            name: string;
            url: string;
        };
    }>;
    types: Array<{
        slot: number;
        type: {
            name: string;
            url: string;
        };
    }>;
    sprites: {
        front_default: string;
        back_default: string;
        front_shiny: string;
        back_shiny: string;
    };
}

export interface Type {
    type: {
        name: string;
        url: string;
    };
}

export interface BaseStats {
    hp: number;
    attack: number;
    defense: number;
    special_attack: number;
    special_defense: number;
    speed: number;
}

export interface Nature {
    id: number;
    name: string;
    increased_stat: string | null;
    decreased_stat: string | null;
}

export interface PokemonForm {
    stats: {
        base_stat: number;
        stat: {
            name: string;
        };
    }[];
} 