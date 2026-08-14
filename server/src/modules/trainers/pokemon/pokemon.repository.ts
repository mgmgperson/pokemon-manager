import sqlite3 from 'sqlite3';
import { queryOne, runStatement, type StatementResult } from '../../../infrastructure/database/sqlite';

type NumericValue = number | null;
type BooleanValue = boolean | number | null;

export interface PokemonWriteInput {
  trainer_id?: NumericValue;
  species_id?: NumericValue;
  pokemon_id?: NumericValue;
  level?: NumericValue;
  ot_name?: string | null;
  ot_id?: NumericValue;
  nickname?: string | null;
  attack?: NumericValue;
  defense?: NumericValue;
  special_attack?: NumericValue;
  special_defense?: NumericValue;
  speed?: NumericValue;
  hp?: NumericValue;
  happiness?: NumericValue;
  iv_hp?: NumericValue;
  iv_attack?: NumericValue;
  iv_defense?: NumericValue;
  iv_special_attack?: NumericValue;
  iv_special_defense?: NumericValue;
  iv_speed?: NumericValue;
  ev_hp?: NumericValue;
  ev_attack?: NumericValue;
  ev_defense?: NumericValue;
  ev_special_attack?: NumericValue;
  ev_special_defense?: NumericValue;
  ev_speed?: NumericValue;
  nature_id?: NumericValue;
  ability_id?: NumericValue;
  gender?: string | null;
  shiny?: BooleanValue;
  pokeball_id?: NumericValue;
  held_item_id?: NumericValue;
  experience_points?: NumericValue;
  is_gigantamax?: BooleanValue;
  is_mega?: BooleanValue;
  date_met_at?: string | null;
  location_met_at?: string | null;
  level_met_at?: NumericValue;
  current_hp?: NumericValue;
  current_strength?: NumericValue;
  status_id?: NumericValue;
  battles_won?: NumericValue;
  battles_lost?: NumericValue;
  kills?: NumericValue;
  deaths?: NumericValue;
  training_efficiency?: NumericValue;
}

export interface PokemonInstance extends PokemonWriteInput {
  id: number;
  trainer_id: number;
  species_id: number;
  trainer_fname: string | null;
  trainer_lname: string | null;
}

const INSERT_COLUMNS: ReadonlyArray<keyof PokemonWriteInput> = [
  'trainer_id', 'species_id', 'pokemon_id', 'level',
  'ot_name', 'ot_id',
  'nickname', 'attack', 'defense', 'special_attack', 'special_defense', 'speed', 'hp', 'happiness',
  'iv_hp', 'iv_attack', 'iv_defense', 'iv_special_attack', 'iv_special_defense', 'iv_speed',
  'ev_hp', 'ev_attack', 'ev_defense', 'ev_special_attack', 'ev_special_defense', 'ev_speed',
  'nature_id', 'ability_id',
  'gender', 'shiny', 'pokeball_id', 'held_item_id', 'experience_points', 'is_gigantamax', 'is_mega',
  'date_met_at', 'location_met_at', 'level_met_at',
  'current_hp', 'current_strength', 'status_id',
  'battles_won', 'battles_lost', 'kills', 'deaths',
  'training_efficiency',
];

const UPDATE_COLUMNS = INSERT_COLUMNS.filter((column) => column !== 'trainer_id');

function valuesFor(
  input: PokemonWriteInput,
  columns: ReadonlyArray<keyof PokemonWriteInput>
): unknown[] {
  return columns.map((column) => input[column]);
}

export function findPokemonInstanceById(
  database: sqlite3.Database,
  pokemonId: string
): Promise<PokemonInstance | null> {
  return queryOne<PokemonInstance>(
    database,
    `
      SELECT
        p.*,
        t.fname AS trainer_fname,
        t.lname AS trainer_lname
      FROM pokemon p
      JOIN trainer t ON p.trainer_id = t.id
      WHERE p.id = ?
    `,
    [pokemonId]
  );
}

export function updatePokemonInstance(
  database: sqlite3.Database,
  pokemonId: string,
  input: PokemonWriteInput
): Promise<StatementResult> {
  const assignments = UPDATE_COLUMNS.map((column) => `${column} = ?`).join(', ');
  return runStatement(
    database,
    `UPDATE pokemon SET ${assignments} WHERE id = ?`,
    [...valuesFor(input, UPDATE_COLUMNS), pokemonId]
  );
}

export function createPokemonInstance(
  database: sqlite3.Database,
  input: PokemonWriteInput
): Promise<StatementResult> {
  const placeholders = INSERT_COLUMNS.map(() => '?').join(', ');
  return runStatement(
    database,
    `INSERT INTO pokemon (${INSERT_COLUMNS.join(', ')}) VALUES (${placeholders})`,
    valuesFor(input, INSERT_COLUMNS)
  );
}
