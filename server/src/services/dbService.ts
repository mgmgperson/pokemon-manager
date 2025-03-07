// src/services/dbService.ts

import sqlite3 from 'sqlite3';
import { PokemonRow, TrainerRow } from '../types/database';

const { Database } = sqlite3.verbose();

// Create a global DB connection
export const sqlDb = new Database('../database/db.sqlite', (err: Error | null) => {
  if (err) {
    console.error('Error opening database:', err.message);
  }
});

// Helper to fetch trainer by ID
export function fetchTrainer(trainerId: number): Promise<TrainerRow | null> {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM trainer WHERE id = ?`;
    sqlDb.get(sql, [trainerId], (err, row) => {
      if (err) return reject(err);
      resolve(row as TrainerRow || null);
    });
  });
}

// Helper to fetch all Pokemon for a trainer
export function fetchTrainerPokemon(trainerId: number): Promise<PokemonRow[]> {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM pokemon WHERE trainer_id = ?`;
    sqlDb.all(sql, [trainerId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows as PokemonRow[]);
    });
  });
}

// Example to fetch a trainer's field rating
// We'll define just one function for demonstration:
export function fetchTrainerFieldRating(
  trainerId: number,
  fieldName: string
): Promise<number> {
  return new Promise((resolve, reject) => {
    const colName = fieldName.toLowerCase().replace(/_/g, '') + '_field_rating'; // e.g. "windyfieldrating"
    const sqlQuery = `
      SELECT fr.${colName} as ratingVal
      FROM field_rating fr
      JOIN rating r ON fr.rating_id = r.id
      WHERE r.trainer_id = ?
      ORDER BY r.year DESC
      LIMIT 1
    `;
    sqlDb.get(sqlQuery, [trainerId], (err, row: { ratingVal: number }) => {
      if (err) return reject(err);
      if (!row) return resolve(0);
      resolve(row.ratingVal || 0);
    });
  });
}
