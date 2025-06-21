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

-- Name frequencies by region
CREATE TABLE region_name_frequency (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    region_id INTEGER NOT NULL,
    frequency INTEGER NOT NULL,
    country TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('F', 'S')),
    FOREIGN KEY (region_id) REFERENCES region(id)
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
    date_met_at TEXT,
    location_met_at TEXT,
    level_met_at INTEGER,

    -- stats
    current_hp INTEGER,
    current_strength INTEGER, -- includes fatigue from training
    status_id INTEGER,
    battles_won INTEGER,
    battles_lost INTEGER,
    kills INTEGER,
    deaths INTEGER,

    -- training
    training_efficiency INTEGER,


    FOREIGN KEY (trainer_id) REFERENCES trainer(id)
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
    FOREIGN KEY (trainer_id) REFERENCES trainer(id)
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

-- TODO: More trainer infos, game functionality


CREATE TABLE game_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    save_name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_played_at TEXT NOT NULL DEFAULT (datetime('now')),

    -- in-world clock
    current_date TEXT NOT NULL,         
    current_time TEXT NOT NULL,

    active_trainer_id INTEGER NOT NULL, -- The trainer currently being played
    active_location_id INTEGER NOT NULL, -- The current location of the active trainer

    FOREIGN KEY (active_trainer_id) REFERENCES trainer(id),
    FOREIGN KEY (active_location_id) REFERENCES location(id)
);


CREATE TABLE trainer_finance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainer_id INTEGER NOT NULL,
    balance INTEGER DEFAULT 0, 
    debt INTEGER DEFAULT 0, 
    FOREIGN KEY (trainer_id) REFERENCES trainer(id)
);

CREATE TABLE financial_transaction (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainer_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    category TEXT CHECK(category IN (
        'prize', 'wages', 'sponsor', 'training', 'travel',
        'item_purchase', 'sale', 'taxes', 'misc'
    )),
    FOREIGN KEY (trainer_id) REFERENCES trainer(id)
);

CREATE TABLE inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainer_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1, 
    FOREIGN KEY (trainer_id) REFERENCES trainer(id),
    FOREIGN KEY (item_id) REFERENCES item(id)
);

CREATE TABLE training_program (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    focus_stat TEXT CHECK(focus_stat IN (
        'hp', 'attack', 'defense', 'special_attack',
        'special_defense', 'speed', 'happiness', 'bond', 'move'
    )),
    base_duration INTEGER NOT NULL,
    fatigue_cost INTEGER NOT NULL DEFAULT 5,
    cost INTEGER NOT NULL DEFAULT 100, -- cost in in-game currency
    description TEXT
);

CREATE TABLE training_session (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainer_id INTEGER NOT NULL,
    pokemon_id INTEGER NOT NULL,
    program_id INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    success BOOLEAN,
    fatigue INTEGER DEFAULT 0, -- fatigue accumulated during the session
    notes TEXT,
    FOREIGN KEY (trainer_id) REFERENCES trainer(id),
    FOREIGN KEY (pokemon_id) REFERENCES pokemon(id),
    FOREIGN KEY (program_id) REFERENCES training_program(id)
);

CREATE TABLE injury (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    approximate_healing_time INTEGER NOT NULL, -- days
    description TEXT,
    FOREIGN KEY (pokemon_id) REFERENCES pokemon(id)  
);

CREATE TABLE pokemon_injury (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pokemon_id INTEGER NOT NULL,
    injury_id INTEGER NOT NULL,
    healing_time INTEGER NOT NULL, -- days
    FOREIGN KEY (pokemon_id) REFERENCES pokemon(id),
    FOREIGN KEY (injury_id) REFERENCES injury(id)
);

CREATE TABLE message (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sent_at TEXT NOT NULL DEFAULT (datetime('now')),
    sender TEXT,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    message_type TEXT CHECK(message_type IN (
        'battle_result', 'offer', 'news', 'tutorial', 'alert', 'finance'
    )),
);

-- Locations
CREATE TABLE location (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    region_id INTEGER NOT NULL,
    description TEXT,
    population INTEGER,


    -- polygonal area for more complex locations
    area_coordinates TEXT, -- JSON array of coordinate pairs (latitude, longitude)

    travel_time INTEGER, -- rating for how long it takes to travel across the location, 1 very quick, 5 very long (might be due to change into travel time in days)

    parent_location_id INTEGER, -- For sub-zones or nested areas
    accessibility INTEGER DEFAULT 1, -- How accessible the location is (1-5 scale), 1 accessible, 5 very inaccessible (might be due to change into HM compatibility)
    FOREIGN KEY (region_id) REFERENCES region(id),
    FOREIGN KEY (parent_location_id) REFERENCES location(id)
);

CREATE TABLE terrain_spawn {
    terrain_id INTEGER NOT NULL,
    pokemon_id INTEGER NOT NULL,
    rate INTEGER NOT NULL, -- relative spawn rate or weight
    time_of_day TEXT CHECK (time_of_day IN ('day', 'night', 'dawn', 'dusk', 'any')) DEFAULT 'any',
    season TEXT CHECK (season IN ('spring', 'summer', 'autumn', 'winter', 'any')) DEFAULT 'any',
    min_level INTEGER DEFAULT 1,
    max_level INTEGER DEFAULT 100,
    encounter_type TEXT CHECK(encounter_type IN ('grass', 'water', 'cave', 'sky', 'fishing', 'event')) DEFAULT 'grass',
    PRIMARY KEY (terrain_id, pokemon_id, time_of_day, season, encounter_type),
    FOREIGN KEY (terrain_id) REFERENCES terrain(id)
}

CREATE TABLE terrain (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL, -- short code for referencing
    name TEXT NOT NULL,
    default_field_id INTEGER, -- use with field effects
    description TEXT,
);

CREATE TABLE location_terrain (
    location_id INTEGER NOT NULL,
    terrain_id  INTEGER NOT NULL,
    rate INTEGER NOT NULL, -- relative frequency of this terrain in the location
    field_id INTEGER, -- use with field effects
    PRIMARY KEY (location_id, terrain_id),
    FOREIGN KEY (location_id) REFERENCES location(id),
    FOREIGN KEY (terrain_id)  REFERENCES terrain(id)
);

CREATE TABLE region_generation_spawn ( -- corresponding a pokemon's generation to a dynamic region
    region_id INTEGER NOT NULL,
    generation INTEGER NOT NULL,
    rate INTEGER NOT NULL, -- relative spawn rate or weight
    PRIMARY KEY (region_id, generation),
    FOREIGN KEY (region_id) REFERENCES region(id),
);