export interface Trainer {
    id: number;
    fname: string;
    lname: string;
    pwtr_rating: number | null;
    region_id: number;
    region_name: string;
    title: string | null;
    rank: number;
    peak_rank: number | null;
    peak_rating: number | null;
    birthdate: string | null;
    active_status: boolean;
}

export interface TrainerRating {
    overall_rating: number;
    typing_rating: number;
    mixed_rating: number;
    special_rating: number;
}

export interface FieldRating {
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

export interface Hometown {
    region_id: number;
    region_name: string;
    city_id: number;
    city_name: string;
}

export interface TrainerData {
    trainer: Trainer;
    rating: TrainerRating;
    field_rating: FieldRating;
    mental_rating: MentalRating;
    format_rating: FormatRating;
    hometowns: Hometown[];
}

export interface RatingData {
    name: string;
    rating: number;
}

export const fieldNamesMap: { [key: string]: string } = {
    pumped_field_rating: 'Pumped',
    windy_field_rating: 'Windy',
    corrosive_field_rating: 'Corrosive',
    desert_field_rating: 'Desert',
    cliffs_field_rating: 'Cliffs',
    swarm_field_rating: 'Swarm',
    haunted_field_rating: 'Haunted',
    factory_field_rating: 'Factory',
    infernal_field_rating: 'Infernal',
    watersurface_field_rating: 'Water Surface',
    grassy_field_rating: 'Grassy',
    electirized_field_rating: 'Electrified',
    psychic_field_rating: 'Psychic',
    icy_field_rating: 'Icy',
    draconidden_field_rating: 'Draconid Den',
    darkcavern_field_rating: 'Dark Cavern',
    misty_field_rating: 'Misty',
    city_field_rating: 'City',
    mirror_field_rating: 'Mirror',
    concertvenue_field_rating: 'Concert Venue',
    crystalcavern_field_rating: 'Crystal Cavern',
    waterfall_field_rating: 'Waterfall',
    volcanic_field_rating: 'Volcanic',
    forest_field_rating: 'Forest',
    flowergarden_field_rating: 'Flower Garden',
    swamp_field_rating: 'Swamp',
    bewitchedwoods_field_rating: 'Bewitched Woods',
    murkwatersurface_field_rating: 'Murkwater Surface',
    smoky_field_rating: 'Smoky',
    frozendimensional_field_rating: 'Frozen Dimensional',
    valleyofwinds_field_rating: 'Valley of Winds',
    losthotel_field_rating: 'Lost Hotel',
    taiga_field_rating: 'Taiga',
    ashenbeach_field_rating: 'Ashen Beach',
    underwater_field_rating: 'Underwater',
    starlightarena_field_rating: 'Starlight Arena',
    snowymountain_field_rating: 'Snowy Mountain',
    bigtop_field_rating: 'Big Top',
    backalley_field_rating: 'Back Alley',
    neutral_field_rating: 'Neutral',
    chess_field_rating: 'Chess',
    deepearth_field_rating: 'Deep Earth',
    inverse_field_rating: 'Inverse',
    glitch_field_rating: 'Glitch',
    dimensional_field_rating: 'Dimensional',
    colosseum_field_rating: 'Colosseum',
    trickster_field_rating: 'Trickster',
    fantasy_field_rating: 'Fantasy',
    rainbow_field_rating: 'Rainbow',
    newworld_field_rating: 'New World',
    planning_rating: 'Planning',
    risk_rating: 'Risk',
    prediction_rating: 'Prediction',
    clutch_rating: 'Clutch',
    consistency_rating: 'Consistency',
    motivation_rating: 'Motivation',
    pokemon_knowledge_rating: 'Pokemon Knowledge',
    trainer_knowledge_rating: 'Trainer Knowledge',
    training_rating: 'Training',
    conditioning_rating: 'Conditioning',
    determination_rating: 'Determination',
    facilities_rating: 'Facilities',
    attack_rating: 'Attack',
    defense_rating: 'Defense',
    speed_rating: 'Speed',
    gimmick_rating: 'Gimmick',
    singles_rating: 'Singles',
    doubles_rating: 'Doubles',
    tag_battle_rating: 'Tag Battle',
    battle_factory_rating: 'Battle Factory',
    rotation_rating: 'Rotation',
    sixes_rating: 'Sixes',
    threes_rating: 'Threes',
    twos_rating: 'Twos',
}; 