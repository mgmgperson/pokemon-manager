-- For save slots, options, etc.

CREATE TABLE save_slot (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_played_at TEXT,
    path TEXT NOT NULL
);
