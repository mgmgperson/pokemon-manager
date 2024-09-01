// src/types/types.ts

export interface Ability {
    ability: {
        name: string;
        url: string;
    };
    is_hidden: boolean;
}

export interface Stat {
    stat: {
        name: string;
        url: string;
    };
    base_stat: number;
    effort: number;
}

export interface Type {
    slot: number;
    type: {
        name: string;
        url: string;
    };
}

export interface PokemonForm {
    id: number;
    name: string;
    abilities: Ability[];
    height: number;
    weight: number;
    stats: Stat[];
    base_experience: number;
    types: Type[];
    sprites: Sprites;
    moves: PokemonMove[];
    species: {
        name: string;
        url: string;
    };
}

export interface PokemonSpecies {
    name: string;
    nationalDexNumber: number;
    generation: {
        name: string;
        url: string;
    };
    genera: {
        genus: string;
        language: {
            name: string;
        };
    }[];
    varieties: any[];
    capture_rate: number;
    base_happiness: number;
    growth_rate: {
        name: string;
    };
    egg_groups: {
        name: string;
    }[];
    gender_rate: number;
    hatch_counter: number;
    flavor_text_entries: FlavorTextEntry[];
    color: {
        name: string;
        url: string;
    };
    shape: {
        name: string;
        url: string;
    };
    id: number;
    evolution_chain:{
        url: string;
    };
}

export interface EvolutionChainLink {
    species: {
        name: string;
        url: string;
    };
    evolves_to: EvolutionChainLink[];
}

export interface PokemonBasicInfoProps {
    form: PokemonForm;
    species: PokemonSpecies;
    evolution_chain: EvolutionChainLink;
}

export interface Sprites {
    back_default: string | null;
    back_female: string | null;
    back_shiny: string | null;
    back_shiny_female: string | null;
    front_default: string | null;
    front_female: string | null;
    front_shiny: string | null;
    front_shiny_female: string | null;
    other?: {
        dream_world: {
            front_default: string | null;
            front_female: string | null;
        };
        home: {
            front_default: string | null;
            front_female: string | null;
            front_shiny: string | null;
            front_shiny_female: string | null;
        };
        'official-artwork': {
            front_default: string | null;
            front_shiny: string | null;
        };
        showdown: {
            back_default: string | null;
            back_female: string | null;
            back_shiny: string | null;
            back_shiny_female: string | null;
            front_default: string | null;
            front_female: string | null;
            front_shiny: string | null;
            front_shiny_female: string | null;
        };
    };
    versions?: Record<string, any>;
}

export interface FlavorTextEntry {
    flavor_text: string;
    language: {
        name: string;
    };
    version: {
        name: string;
        url: string;
    };
}

export interface Move {
    name: string;
    url: string;
}

export interface VersionGroupDetails {
    level_learned_at: number;
    move_learn_method: {
        name: string;
        url: string;
    };
    version_group: {
        name: string;
        url: string;
    };
}

export interface PokemonMove {
    move: {
        name: string;
        url: string;
    };
    version_group_details: {
        level_learned_at: number;
        move_learn_method: {
            name: string;
        };
        version_group: {
            name: string;
            url: string;
        };
    }[];
}


export interface GenericMoveDetails {
    id: number;
    name: string;
    power: number;
    accuracy: number;
    pp: number;
    damage_class: string;
    type: string;
    level_learned_at: number;
    machine: string;
    learn_method: string;
    version_group: string;
    version_group_id: number;
}

export interface PokemonLearnsetProps {
    moves: GenericMoveDetails[];
}

export interface City {
    name: string;
    population: number;
    x_coordinate: number;
    y_coordinate: number;
}

export interface GymLeader {
    id: number;
    name: string;
    type: string;
    city_name: string;
}

export interface Region {
    name: string;
    population: number;
    cities: City[];
    champion: string | null;
    eliteFour: string[];
    gymLeaders: GymLeader[];
    id: number;
}

//trainer api types

export interface Hometown {
    city_id: number;
    city_name: string;
    region_id: number;
    region_name: string;
}

export interface Trainer {
    id: number;
    fname: string;
    lname: string;
    region_id: number;
    birthdate: string | null;
    pwtr_rating: number;
    peak_rating: number | null;
    peak_rank: number | null;
    active_status: boolean;
    region_name: string;
    rank: number;
    title: string;
}

export interface Rating {
    id: number;
    trainer_id: number;
    year: number;
    overall_rating: number;
    typing_rating: number;
    mixed_rating: number;
    special_rating: number;
}

export interface FormatRating {
    id: number;
    rating_id: number;
    singles_rating: number | null;
    doubles_rating: number | null;
    tag_battle_rating: number | null;
    battle_factory_rating: number | null;
    rotation_rating: number | null;
    sixes_rating: number | null;
    threes_rating: number | null;
    twos_rating: number | null;
}

interface FieldRating {
    id: number;
    rating_id: number;
    pumped_field_rating: number;
    windy_field_rating: number;
    corrosive_field_rating: number;
    desert_field_rating: number;
    cliffs_field_rating: number;
    swarm_field_rating: number;
    haunted_field_rating: number;
    factory_field_rating: number;
    infernal_field_rating: number;
    watersurface_field_rating: number;
    grassy_field_rating: number;
    electirized_field_rating: number;
    psychic_field_rating: number;
    icy_field_rating: number;
    draconidden_field_rating: number;
    darkcavern_field_rating: number;
    misty_field_rating: number;
    city_field_rating: number;
    mirror_field_rating: number;
    concertvenue_field_rating: number;
    crystalcavern_field_rating: number;
    waterfall_field_rating: number;
    volcanic_field_rating: number;
    forest_field_rating: number;
    flowergarden_field_rating: number;
    swamp_field_rating: number;
    bewitchedwoods_field_rating: number;
    murkwatersurface_field_rating: number;
    smoky_field_rating: number;
    frozendimensional_field_rating: number;
    valleyofwinds_field_rating: number;
    losthotel_field_rating: number;
    taiga_field_rating: number;
    ashenbeach_field_rating: number;
    underwater_field_rating: number;
    starlightarena_field_rating: number;
    snowymountain_field_rating: number;
    bigtop_field_rating: number;
    backalley_field_rating: number;
    neutral_field_rating: number;
    chess_field_rating: number;
    deepearth_field_rating: number;
    inverse_field_rating: number;
    glitch_field_rating: number;
    dimensional_field_rating: number;
    colosseum_field_rating: number;
    trickster_field_rating: number;
    fantasy_field_rating: number;
    rainbow_field_rating: number;
    newworld_field_rating: number;
}


export interface TypeRating {
    id: number;
    rating_id: number;
    pumped_field_rating: number | null;
    windy_field_rating: number | null;
    corrosive_field_rating: number | null;
    desert_field_rating: number | null;
    cliffs_field_rating: number | null;
    swarm_field_rating: number | null;
    haunted_field_rating: number | null;
    factory_field_rating: number | null;
    infernal_field_rating: number | null;
    watersurface_field_rating: number | null;
    grassy_field_rating: number | null;
    electirized_field_rating: number | null;
    psychic_field_rating: number | null;
    icy_field_rating: number | null;
    draconidden_field_rating: number | null;
    darkcavern_field_rating: number | null;
    misty_field_rating: number | null;
    city_field_rating: number | null;
    mirror_field_rating: number | null;
    concertvenue_field_rating: number | null;
}

export interface MixedRating {
    id: number;
    rating_id: number;
    crystalcavern_field_rating: number | null;
    waterfall_field_rating: number | null;
    volcanic_field_rating: number | null;
    forest_field_rating: number | null;
    flowergarden_field_rating: number | null;
    swamp_field_rating: number | null;
    bewitchedwoods_field_rating: number | null;
    murkwatersurface_field_rating: number | null;
    smoky_field_rating: number | null;
    frozendimensional_field_rating: number | null;
    valleyofwinds_field_rating: number | null;
    losthotel_field_rating: number | null;
    taiga_field_rating: number | null;
    ashenbeach_field_rating: number | null;
    underwater_field_rating: number | null;
    starlightarena_field_rating: number | null;
    snowymountain_field_rating: number | null;
}

export interface SpecialRating {
    id: number;
    rating_id: number;
    bigtop_field_rating: number | null;
    backalley_field_rating: number | null;
    neutral_field_rating: number | null;
    chess_field_rating: number | null;
    deepearth_field_rating: number | null;
    inverse_field_rating: number | null;
    glitch_field_rating: number | null;
    dimensional_field_rating: number | null;
    colosseum_field_rating: number | null;
    trickster_field_rating: number | null;
    fantasy_field_rating: number | null;
    rainbow_field_rating: number | null;
    newworld_field_rating: number | null;
}
    

export interface MentalRating {
    id: number;
    rating_id: number;
    planning_rating: number | null;
    risk_rating: number | null;
    prediction_rating: number | null;
    clutch_rating: number | null;
    consistency_rating: number | null;
    motivation_rating: number | null;
    pokemon_knowledge_rating: number | null;
    trainer_knowledge_rating: number | null;
    training_rating: number | null;
    conditioning_rating: number | null;
    determination_rating: number | null;
    facilities_rating: number | null;
    attack_rating: number | null;
    defense_rating: number | null;
    speed_rating: number | null;
    gimmick_rating: number | null;
}

export interface TrainerData {
    trainer: Trainer;
    rating: Rating;
    format_rating: FormatRating;
    field_rating: FieldRating;
    mental_rating: MentalRating;
    hometowns: Hometown[];
}

export interface Pokemon {
    id: number;
    trainer_id: number;
    species_id: number;
    pokemon_id: number;
    level: number;
    ot_name: string | null;
    ot_id: number | null;
    nickname: string | null;
    attack: number | null;
    defense: number | null;
    special_attack: number | null;
    special_defense: number | null;
    speed: number | null;
    hp: number | null;
    happiness: number | null;
    iv_hp: number | null;
    iv_attack: number | null;
    iv_defense: number | null;
    iv_special_attack: number | null;
    iv_special_defense: number | null;
    iv_speed: number | null;
    ev_hp: number | null;
    ev_attack: number | null;
    ev_defense: number | null;
    ev_special_attack: number | null;
    ev_special_defense: number | null;
    ev_speed: number | null;
    nature_id: number | null;
    ability_id: number | null;
    gender: string | null;
    shiny: boolean;
    pokeball_id: number | null;
    held_item_id: number | null;
    experience_points: number | null;
    is_gigantamax: boolean;
    is_mega: boolean;
    current_hp: number | null;
    current_strength: number | null;
    status_id: number | null;
    battles_won: number | null;
    battles_lost: number | null;
    kills: number | null;
    deaths: number | null;
    training_efficiency: number | null;
    level_met_at: number | null;
    date_met_at: string | null;
    location_met_at: string | null;
}

export interface Nature {
    id: number;
    name: string;
    increased_stat: string;
    decreased_stat: string;
}