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
    badge INTEGER NOT NULL,
    city_id INTEGER NOT NULL,
    type TEXT,
    FOREIGN KEY (city_id) REFERENCES city(id),
    FOREIGN KEY (trainer_id) REFERENCES trainer(id),
    FOREIGN KEY (badge) REFERENCES badge(id)
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
    FOREIGN KEY (trainer_id) REFERENCES trainer(id)
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
    description TEXT
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

CREATE TABLE shop (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    -- 'regional' means “applies to all locations tagged with X terrain OR region”
    -- 'special'  means “only at the specific location below”
    scope TEXT NOT NULL CHECK(scope IN ('regional', 'special')),
    region_id   INTEGER,
    terrain_id  INTEGER,
    location_id INTEGER,
    description TEXT,
    markup REAL DEFAULT 1.00,

    FOREIGN KEY (region_id)  REFERENCES region(id),
    FOREIGN KEY (terrain_id) REFERENCES terrain(id),
    FOREIGN KEY (location_id)REFERENCES location(id)
);

CREATE TABLE shop_item (
    shop_id  INTEGER NOT NULL,
    item_id  INTEGER NOT NULL,
    price    INTEGER NOT NULL,
    stock    INTEGER,            -- NULL = infinite stock
    PRIMARY KEY (shop_id, item_id),
    FOREIGN KEY (shop_id) REFERENCES shop(id)
);

CREATE TABLE travel_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainer_id INTEGER NOT NULL,
    from_location_id INTEGER,
    to_location_id INTEGER,
    departure_time TEXT,
    arrival_time TEXT,
    notes TEXT,
    FOREIGN KEY (trainer_id) REFERENCES trainer(id),
    FOREIGN KEY (from_location_id) REFERENCES location(id),
    FOREIGN KEY (to_location_id) REFERENCES location(id)
);

CREATE TABLE tournament_template (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    region_id INTEGER,                 -- NULL ⇒ global
    frequency TEXT CHECK (             -- for auto‑scheduling
        frequency IN ('one_off','annual','biennial','seasonal','monthly')
    ) DEFAULT 'one_off',
    start_month INTEGER,               -- e.g. 6 = June Conference
    team_type TEXT CHECK (             -- singles, teams of 2‑6, leagues, etc.
        team_type IN ('single','team')
    ) DEFAULT 'single',
    default_rule_set_id INTEGER,       -- FK below
    created_by_user_id INTEGER,        -- if players design their own

    FOREIGN KEY (region_id) REFERENCES region(id),
    FOREIGN KEY (default_rule_set_id) REFERENCES rule_set(id)
);

/* A concrete running instance (eg. 2027 Kanto Conference). */
CREATE TABLE tournament_event (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    edition_label TEXT,                -- "152nd Indigo Conference"
    start_date TEXT,
    end_date   TEXT,
    status TEXT CHECK(
        status IN ('scheduled','ongoing','completed','canceled')
    ) DEFAULT 'scheduled',
    FOREIGN KEY (template_id) REFERENCES tournament_template(id)
);

CREATE TABLE rule_set (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,                         -- "Standard Singles No‑Legend"
    notes TEXT
);


CREATE TABLE rule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_set_id INTEGER NOT NULL,
    key TEXT NOT NULL,       -- e.g. 'battle_format', 'allow_legendary'
    value TEXT NOT NULL,     -- store as TEXT, cast as needed
    FOREIGN KEY (rule_set_id) REFERENCES rule_set(id)
);
/*  example rows:
    (rule_set_id=7,'battle_format','singles')
    (rule_set_id=7,'double_elimination','false')
    (rule_set_id=7,'allow_legendary','false')
    (rule_set_id=7,'field_policy','neutral_only')
    (rule_set_id=7,'max_team_size','6')
    (rule_set_id=7,'max_pokemon_level','100')
    (rule_set_id=7,'seeded','true')
*/

CREATE TABLE stage_template (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_template_id INTEGER NOT NULL,
    seq INTEGER NOT NULL,              -- 1,2,3… order
    stage_type TEXT CHECK (
        stage_type IN ('round_robin','group','single_elim','double_elim','swiss')
    ),
    participants INTEGER,              -- expected entrants or NULL = auto
    groups INTEGER,                    -- for group stage
    best_of INTEGER DEFAULT 1,         -- Bo1, Bo3, Bo9…
    rule_set_id INTEGER,               -- override / additive rules
    FOREIGN KEY (tournament_template_id) REFERENCES tournament_template(id),
    FOREIGN KEY (rule_set_id) REFERENCES rule_set(id)
);

/* For the live event → expanded from stage_template. */
CREATE TABLE stage_event (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_event_id INTEGER NOT NULL,
    stage_template_id INTEGER NOT NULL,
    status TEXT CHECK(status IN ('pending','running','complete')) DEFAULT 'pending',
    FOREIGN KEY (tournament_event_id) REFERENCES tournament_event(id),
    FOREIGN KEY (stage_template_id)   REFERENCES stage_template(id)
);

CREATE TABLE qualification_rule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_template_id INTEGER NOT NULL,
    criterion_type TEXT CHECK (
        criterion_type IN ('badge','badge_count','min_rating','previous_winner','invite_only')
    ),
    value TEXT,      -- e.g. '8', '1500', '<other_tournament_id>'
    notes TEXT,
    FOREIGN KEY (tournament_template_id) REFERENCES tournament_template(id)
);

CREATE TABLE prize (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_template_id INTEGER NOT NULL,
    position INTEGER NOT NULL,         -- 1 = Champion, 2 = Runner‑up …
    prize_type TEXT CHECK (
        prize_type IN ('cash','item','tournament_ticket','title','badge','custom')
    ),
    value TEXT,        -- json or simple ID (item_id, tournament_template_id)
    FOREIGN KEY (tournament_template_id) REFERENCES tournament_template(id)
);

/* Represents a participant in a tournament */
CREATE TABLE tournament_participant (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stage_event_id INTEGER NOT NULL,
    seed INTEGER,
    FOREIGN KEY (stage_event_id) REFERENCES stage_event(id)
);

/* Represents a team member in a tournament, teams can have only 1 member representing a "participant" */
CREATE TABLE team_member (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_id INTEGER NOT NULL,
    trainer_id INTEGER NOT NULL,
    FOREIGN KEY (participant_id) REFERENCES tournament_participant(id),
    FOREIGN KEY (trainer_id)     REFERENCES trainer(id)
);

CREATE TABLE pokemon_registration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_member_id INTEGER NOT NULL,
    pokemon_id INTEGER NOT NULL,
    FOREIGN KEY (team_member_id) REFERENCES team_member(id),
    FOREIGN KEY (pokemon_id)     REFERENCES pokemon(id)
);

CREATE TABLE match (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stage_event_id INTEGER NOT NULL,
    round INTEGER,
    participant_a_id INTEGER NOT NULL,
    participant_b_id INTEGER NOT NULL,
    stadium_id INTEGER,                  
    winner_id INTEGER,                    -- NULL until finished
    scheduled_at TEXT,
    field_id INTEGER,                     -- which battle field to load
    FOREIGN KEY (stage_event_id)     REFERENCES stage_event(id),
    FOREIGN KEY (participant_a_id)   REFERENCES tournament_participant(id),
    FOREIGN KEY (participant_b_id)   REFERENCES tournament_participant(id),
    FOREIGN KEY (winner_id)          REFERENCES tournament_participant(id),
    FOREIGN KEY (field_id)           REFERENCES field(id),
    FOREIGN KEY (stadium_id)        REFERENCES stadium(id)
);

CREATE TABLE badge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,     -- canonical slug, e.g. 'cascade_badge', 'indigo_conf_winner'
    name TEXT NOT NULL,            -- display name
    category TEXT NOT NULL CHECK (
        category IN ('gym','tournament','conference','league','honor','custom')
    ),
    region_id INTEGER,             -- NULL if global
    image TEXT,                    -- path / asset key
    description TEXT,
    tournament_template_id INTEGER,

    FOREIGN KEY (region_id)              REFERENCES region(id),
    FOREIGN KEY (tournament_template_id) REFERENCES tournament_template(id)
);

CREATE TABLE trainer_badge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainer_id INTEGER NOT NULL,
    badge_id   INTEGER NOT NULL,
    awarded_at TEXT NOT NULL DEFAULT (datetime('now')),
    source_event_id INTEGER,       -- e.g. tournament_event.id where awarded; NULL if static grant
    notes TEXT,

    FOREIGN KEY (trainer_id)      REFERENCES trainer(id),
    FOREIGN KEY (badge_id)        REFERENCES badge(id),
    FOREIGN KEY (source_event_id) REFERENCES tournament_event(id)
);