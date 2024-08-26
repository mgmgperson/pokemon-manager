-- Locations

CREATE TABLE region (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    population INTEGER
);

CREATE TABLE city (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    region_id INTEGER NOT NULL,
    population INTEGER,
    x_coordinate FLOAT,
    y_coordinate FLOAT,
    description TEXT,
    FOREIGN KEY (region_id) REFERENCES region(id)
);

CREATE TABLE stadium (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT,
    capacity INTEGER,
    city_id INTEGER NOT NULL,
    FOREIGN KEY (city_id) REFERENCES city(id)
);

-- League

CREATE TABLE gym_leader (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainer_id INTEGER NOT NULL,
    badge TEXT,
    city_id INTEGER NOT NULL,
    type TEXT,
    FOREIGN KEY (city_id) REFERENCES city(id),
    FOREIGN KEY (trainer_id) REFERENCES trainer(id)
);

CREATE TABLE elite_four (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainer_id INTEGER NOT NULL,
    region_id INTEGER NOT NULL,
    FOREIGN KEY (region_id) REFERENCES region(id),
    FOREIGN KEY (trainer_id) REFERENCES trainer(id)
);

CREATE TABLE champion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainer_id INTEGER NOT NULL,
    region_id INTEGER NOT NULL,
    FOREIGN KEY (region_id) REFERENCES region(id),
    FOREIGN KEY (trainer_id) REFERENCES trainer(id)
);

CREATE TABLE grand_champion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainer_id INTEGER NOT NULL,
    FOREIGN KEY (trainer_id) REFERENCES trainer(id)
);

-- Trainers

CREATE TABLE trainer (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fname TEXT,
    lname TEXT,
    region_id INTEGER,
    birthdate TEXT,  -- Storing dates as text in ISO 8601 format
    pwtr_rating FLOAT,
    peak_rating FLOAT,
    peak_rank INTEGER,
    active_status BOOLEAN,
    FOREIGN KEY (region_id) REFERENCES region(id)
);

-- Pokemon

CREATE TABLE pokemon (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainer_id INTEGER NOT NULL,
    species_id INTEGER NOT NULL, --to use with PokeAPI first, then switch later
    pokemon_id INTEGER, -- using pokemon path of PokeAPI
    level INTEGER,

    ot_name TEXT,
    ot_id INTEGER,

    -- new
    nickname TEXT,
    attack INTEGER,
    defense INTEGER,
    special_attack INTEGER,
    special_defense INTEGER,
    speed INTEGER,
    hp INTEGER,
    happiness INTEGER,

    -- evs/ivs
    iv_hp INTEGER,
    iv_attack INTEGER,
    iv_defense INTEGER,
    iv_special_attack INTEGER,
    iv_special_defense INTEGER,
    iv_speed INTEGER,
    
    ev_hp INTEGER,
    ev_attack INTEGER,
    ev_defense INTEGER,
    ev_special_attack INTEGER,
    ev_special_defense INTEGER,
    ev_speed INTEGER,

    -- relate to other tables, pokeapi first then swap
    nature_id INTEGER,
    ability_id INTEGER,

    -- flavor attributes
    gender TEXT,
    shiny BOOLEAN,
    pokeball_id INTEGER,
    held_item_id INTEGER,
    experience_points INTEGER,
    is_gigantamax BOOLEAN,
    is_mega BOOLEAN,

    -- stats
    current_hp INTEGER,
    current_strength INTEGER,
    status_id INTEGER,
    battles_won INTEGER,
    battles_lost INTEGER,
    kills INTEGER,
    deaths INTEGER,

    -- training
    training_efficiency INTEGER,


    FOREIGN KEY (trainer_id) REFERENCES trainer(id)
);

-- TODO: moves table linking with pokemon

-- new pokemon tables

CREATE TABLE pokemon_species (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    species TEXT,
    type1 TEXT,
    type2 TEXT,
    ability1 TEXT,
    ability2 TEXT,
    ability3 TEXT,
    hidden_ability TEXT,
    base_hp INTEGER,
    base_attack INTEGER,
    base_defense INTEGER,
    base_special_attack INTEGER,
    base_special_defense INTEGER,
    base_speed INTEGER,
    base_total INTEGER,
    image TEXT
);


-- Ratings
CREATE TABLE rating (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainer_id INTEGER NOT NULL,
    year INTEGER,
    overall_rating INTEGER,
    typing_rating INTEGER,
    mixed_rating INTEGER,
    special_rating INTEGER,
    FOREIGN KEY (trainer_id) REFERENCES trainer(trainer_id)
);

CREATE TABLE format_rating (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rating_id INTEGER NOT NULL,
    singles_rating INTEGER,
    doubles_rating INTEGER,
    tag_battle_rating INTEGER,
    battle_factory_rating INTEGER,
    rotation_rating INTEGER,
    sixes_rating INTEGER,
    threes_rating INTEGER,
    twos_rating INTEGER,
    FOREIGN KEY (rating_id) REFERENCES rating(id)
);

CREATE TABLE field_rating (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rating_id INTEGER NOT NULL,
    pumped_field_rating INTEGER,
    windy_field_rating INTEGER,
    corrosive_field_rating INTEGER,
    desert_field_rating INTEGER,
    cliffs_field_rating INTEGER,
    swarm_field_rating INTEGER,
    haunted_field_rating INTEGER,
    factory_field_rating INTEGER,
    infernal_field_rating INTEGER,
    watersurface_field_rating INTEGER,
    grassy_field_rating INTEGER,
    electirized_field_rating INTEGER,
    psychic_field_rating INTEGER,
    icy_field_rating INTEGER,
    draconidden_field_rating INTEGER,
    darkcavern_field_rating INTEGER,
    misty_field_rating INTEGER,
    city_field_rating INTEGER,
    mirror_field_rating INTEGER,
    concertvenue_field_rating INTEGER,
    crystalcavern_field_rating INTEGER,
    waterfall_field_rating INTEGER,
    volcanic_field_rating INTEGER,
    forest_field_rating INTEGER,
    flowergarden_field_rating INTEGER,
    swamp_field_rating INTEGER,
    bewitchedwoods_field_rating INTEGER,
    murkwatersurface_field_rating INTEGER,
    smoky_field_rating INTEGER,
    frozendimensional_field_rating INTEGER,
    valleyofwinds_field_rating INTEGER,
    losthotel_field_rating INTEGER,
    taiga_field_rating INTEGER,
    ashenbeach_field_rating INTEGER,
    underwater_field_rating INTEGER,
    starlightarena_field_rating INTEGER,
    snowymountain_field_rating INTEGER,
    bigtop_field_rating INTEGER,
    backalley_field_rating INTEGER,
    neutral_field_rating INTEGER,
    chess_field_rating INTEGER,
    deepearth_field_rating INTEGER,
    inverse_field_rating INTEGER,
    glitch_field_rating INTEGER,
    dimensional_field_rating INTEGER,
    colosseum_field_rating INTEGER,
    trickster_field_rating INTEGER,
    fantasy_field_rating INTEGER,
    rainbow_field_rating INTEGER,
    newworld_field_rating INTEGER,
    FOREIGN KEY (rating_id) REFERENCES rating(id)
);

CREATE TABLE mental_rating (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rating_id INTEGER NOT NULL,
    
    -- new ratings

    -- in-battle
    planning_rating INTEGER,
    risk_rating INTEGER,
    prediction_rating INTEGER,
    clutch_rating INTEGER,
    consistency_rating INTEGER,
    motivation_rating INTEGER, --refers to the trainer's ability to motivate their pokemon
    pokemon_knowledge_rating INTEGER, --refers to the trainer's knowledge of pokemon
    trainer_knowledge_rating INTEGER, --refers to the trainer's knowledge of other trainers

    -- out-of-battle
    training_rating INTEGER, --refers to the trainer's ability to train their pokemon
    conditioning_rating INTEGER,
    determination_rating INTEGER,
    facilities_rating INTEGER,
    
    -- overall
    attack_rating INTEGER,
    defense_rating INTEGER,
    speed_rating INTEGER,
    gimmick_rating INTEGER,
    

    FOREIGN KEY (rating_id) REFERENCES rating(id)
);


-- TODO: matches, tournaments, and seasons

-- TODO: PPL

-- TODO: Tours

-- TODO: Specific pokemon data (abilities, moves, etc.)


-- Junction tables

CREATE TABLE trainer_hometown (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainer_id INTEGER NOT NULL,
    city_id INTEGER NOT NULL,
    FOREIGN KEY (trainer_id) REFERENCES trainer(id),
    FOREIGN KEY (city_id) REFERENCES city(id)
);

