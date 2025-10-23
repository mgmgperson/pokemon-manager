import sqlite3 from 'sqlite3';
const { Database } = sqlite3.verbose();

/* meta DB stays sync – no selects needed here now */
export const metaDB = new Database('../database/meta.sqlite');

/* in‑memory refs */
let activeSaveCode: string | null         = null;
let activeDB: sqlite3.Database | null     = null;
const cache: Record<string, sqlite3.Database> = {};

/* ---------- public API ---------- */

export function setActiveSave(code: string, path: string) {
    console.log('Setting active save:', code, 'at path:', path);
  /* reuse cached connection or open */
  if (!cache[code]) {
    cache[code] = new Database(path);
  }
  activeSaveCode = code;
  activeDB       = cache[code];

  /* update last_played_at (fire‑and‑forget) */
  metaDB.run(
    'UPDATE save_slot SET last_played_at = datetime("now") WHERE code = ?',
    [code]
  );
}

export function getActiveDB(): sqlite3.Database {
  if (!activeDB) throw new Error('No save currently selected');
  return activeDB;
}
