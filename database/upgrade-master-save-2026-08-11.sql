-- One-time upgrade for the legacy Master Save. Run against a verified backup
-- first, then against database/db.sqlite only after the checks pass.
BEGIN IMMEDIATE;

CREATE TABLE IF NOT EXISTS injury (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    approximate_healing_time INTEGER NOT NULL,
    description TEXT,
    pokemon_id INTEGER NOT NULL,
    FOREIGN KEY (pokemon_id) REFERENCES pokemon(id)
);

CREATE TABLE IF NOT EXISTS pokemon_injury (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pokemon_id INTEGER NOT NULL,
    injury_id INTEGER NOT NULL,
    healing_time INTEGER NOT NULL,
    FOREIGN KEY (pokemon_id) REFERENCES pokemon(id),
    FOREIGN KEY (injury_id) REFERENCES injury(id)
);

CREATE TABLE IF NOT EXISTS terrain_spawn (
    terrain_id INTEGER NOT NULL,
    pokemon_id INTEGER NOT NULL,
    rate INTEGER NOT NULL,
    time_of_day TEXT CHECK (time_of_day IN ('day', 'night', 'dawn', 'dusk', 'any')) DEFAULT 'any',
    season TEXT CHECK (season IN ('spring', 'summer', 'autumn', 'winter', 'any')) DEFAULT 'any',
    min_level INTEGER DEFAULT 1,
    max_level INTEGER DEFAULT 100,
    encounter_type TEXT CHECK(encounter_type IN ('grass', 'water', 'cave', 'sky', 'fishing', 'event')) DEFAULT 'grass',
    PRIMARY KEY (terrain_id, pokemon_id, time_of_day, season, encounter_type),
    FOREIGN KEY (terrain_id) REFERENCES terrain(id)
);

CREATE TABLE IF NOT EXISTS region_generation_spawn (
    region_id INTEGER NOT NULL,
    generation INTEGER NOT NULL,
    rate INTEGER NOT NULL,
    PRIMARY KEY (region_id, generation),
    FOREIGN KEY (region_id) REFERENCES region(id)
);

CREATE TABLE IF NOT EXISTS travel_log (
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

CREATE TABLE IF NOT EXISTS event_template (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('story', 'battle', 'gift_pokemon', 'tournament_ceremony', 'system')),
    description TEXT,
    default_payload_json TEXT,
    auto_open_overlay BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS event_instance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER,
    type TEXT NOT NULL CHECK (type IN ('story', 'battle', 'gift_pokemon', 'tournament_ceremony', 'system')),
    title TEXT NOT NULL,
    subtitle TEXT,
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'active', 'resolved', 'canceled')) DEFAULT 'scheduled',
    starts_at TEXT NOT NULL,
    ends_at TEXT,
    priority INTEGER DEFAULT 0,
    payload_json TEXT,
    match_id INTEGER,
    tournament_event_id INTEGER,
    gym_leader_id INTEGER,
    location_id INTEGER,
    region_id INTEGER,
    stadium_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    resolved_at TEXT,
    FOREIGN KEY (template_id) REFERENCES event_template(id),
    FOREIGN KEY (match_id) REFERENCES match(id),
    FOREIGN KEY (tournament_event_id) REFERENCES tournament_event(id),
    FOREIGN KEY (gym_leader_id) REFERENCES gym_leader(id),
    FOREIGN KEY (location_id) REFERENCES location(id),
    FOREIGN KEY (region_id) REFERENCES region(id),
    FOREIGN KEY (stadium_id) REFERENCES stadium(id)
);

CREATE TABLE IF NOT EXISTS event_option (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('choice', 'text', 'reward')),
    label TEXT,
    body TEXT,
    sort_order INTEGER DEFAULT 0,
    conditions_json TEXT,
    effects_json TEXT,
    FOREIGN KEY (event_id) REFERENCES event_instance(id)
);

CREATE TABLE IF NOT EXISTS event_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    at TEXT NOT NULL DEFAULT (datetime('now')),
    message TEXT NOT NULL,
    data_json TEXT,
    FOREIGN KEY (event_id) REFERENCES event_instance(id)
);

CREATE TABLE IF NOT EXISTS trainer_badge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainer_id INTEGER NOT NULL,
    badge_id INTEGER NOT NULL,
    awarded_at TEXT NOT NULL DEFAULT (datetime('now')),
    source_event_id INTEGER,
    notes TEXT,
    FOREIGN KEY (trainer_id) REFERENCES trainer(id),
    FOREIGN KEY (badge_id) REFERENCES badge(id),
    FOREIGN KEY (source_event_id) REFERENCES tournament_event(id)
);

ALTER TABLE inventory RENAME TO inventory_legacy_20260811;
CREATE TABLE inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainer_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    UNIQUE (trainer_id, item_id),
    FOREIGN KEY (trainer_id) REFERENCES trainer(id)
);
INSERT INTO inventory (trainer_id, item_id, quantity)
SELECT trainer_id, item_id, quantity FROM inventory_legacy_20260811;
DROP TABLE inventory_legacy_20260811;

DROP TABLE IF EXISTS team_player;

COMMIT;
