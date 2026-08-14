import sqlite3 from 'sqlite3';
import { queryOne } from '../../../infrastructure/database/sqlite';

export interface GameState {
  id: number;
  save_name: string;
  created_at: string;
  last_played_at: string;
  current_date: string;
  current_time: string;
  active_trainer_id: number;
  active_location_id: number;
  trainer_fname: string | null;
  trainer_lname: string | null;
  location_name: string | null;
  region_name: string | null;
}

interface ActiveTrainerRow {
  active_trainer_id: number;
}

export async function findLatestGameState(database: sqlite3.Database): Promise<GameState | null> {
  return queryOne<GameState>(
    database,
    `
      SELECT
        gs.*,
        t.fname AS trainer_fname,
        t.lname AS trainer_lname,
        l.name AS location_name,
        r.name AS region_name
      FROM game_state gs
      LEFT JOIN trainer t ON gs.active_trainer_id = t.id
      LEFT JOIN location l ON gs.active_location_id = l.id
      LEFT JOIN region r ON l.region_id = r.id
      ORDER BY gs.last_played_at DESC
      LIMIT 1
    `
  );
}

export async function findActiveTrainerId(database: sqlite3.Database): Promise<number | null> {
  const row = await queryOne<ActiveTrainerRow>(
    database,
    `
      SELECT active_trainer_id
      FROM game_state
      ORDER BY last_played_at DESC
      LIMIT 1
    `
  );

  return row?.active_trainer_id ?? null;
}
