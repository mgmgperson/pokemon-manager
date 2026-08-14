import sqlite3 from 'sqlite3';
import { queryAll, queryOne, runStatement, type StatementResult } from '../../../infrastructure/database/sqlite';

type BooleanValue = boolean | number | null;

export interface TrainingProgram {
  id: number;
  name: string;
  focus_stat: string | null;
  base_duration: number;
  fatigue_cost: number;
  cost: number;
  description: string | null;
  trainer_id: number;
}

export interface TrainingProgramWriteInput {
  name?: string;
  focus_stat?: string | null;
  base_duration?: number;
  fatigue_cost?: number;
  cost?: number;
  trainer_id?: number;
  description?: string | null;
}

export interface TrainingSession {
  id: number;
  pokemon_id: number;
  program_id: number;
  start_time: string;
  end_time: string | null;
  success: BooleanValue;
  fatigue: number | null;
  notes: string | null;
}

export interface TrainingSessionWithPokemon extends TrainingSession {
  pokemon_name: string | null;
}

export interface TrainingSessionWithProgram extends TrainingSession {
  program_name: string | null;
}

export interface TrainingSessionDetail extends TrainingSession {
  pokemon_name: string | null;
  program_name: string | null;
}

export interface TrainingSessionCreateInput {
  pokemon_id?: number;
  program_id?: number;
  start_time?: string;
  end_time?: string | null;
  success?: BooleanValue;
  fatigue?: number;
  notes?: string | null;
}

export interface TrainingSessionUpdateInput {
  start_time?: string | null;
  end_time?: string | null;
  success?: BooleanValue;
  fatigue?: number;
  notes?: string | null;
}

const PROGRAM_COLUMNS = `
  p.id,
  p.name,
  p.focus_stat,
  p.base_duration,
  p.fatigue_cost,
  p.cost,
  p.description,
  p.trainer_id
`;

const SESSION_COLUMNS = `
  s.id,
  s.pokemon_id,
  s.program_id,
  s.start_time,
  s.end_time,
  s.success,
  s.fatigue,
  s.notes
`;

export function findTrainingPrograms(
  database: sqlite3.Database,
  trainerId: string
): Promise<TrainingProgram[]> {
  return queryAll<TrainingProgram>(
    database,
    `
      SELECT ${PROGRAM_COLUMNS}
      FROM training_program p
      WHERE p.trainer_id = ?
      ORDER BY p.name
    `,
    [trainerId]
  );
}

export function findTrainingProgramById(
  database: sqlite3.Database,
  programId: string
): Promise<TrainingProgram | null> {
  return queryOne<TrainingProgram>(
    database,
    `
      SELECT ${PROGRAM_COLUMNS}
      FROM training_program p
      WHERE p.id = ?
    `,
    [programId]
  );
}

export function createTrainingProgram(
  database: sqlite3.Database,
  input: TrainingProgramWriteInput
): Promise<StatementResult> {
  return runStatement(
    database,
    `
      INSERT INTO training_program (
        name, focus_stat, base_duration, fatigue_cost, cost, trainer_id, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.name,
      input.focus_stat,
      input.base_duration,
      input.fatigue_cost,
      input.cost,
      input.trainer_id,
      input.description,
    ]
  );
}

export function updateTrainingProgram(
  database: sqlite3.Database,
  programId: string,
  input: TrainingProgramWriteInput
): Promise<StatementResult> {
  return runStatement(
    database,
    `
      UPDATE training_program
      SET name = ?, focus_stat = ?, base_duration = ?, fatigue_cost = ?, cost = ?, description = ?
      WHERE id = ?
    `,
    [
      input.name,
      input.focus_stat,
      input.base_duration,
      input.fatigue_cost,
      input.cost,
      input.description,
      programId,
    ]
  );
}

export function findTrainingSessionsForProgram(
  database: sqlite3.Database,
  programId: string
): Promise<TrainingSessionWithPokemon[]> {
  return queryAll<TrainingSessionWithPokemon>(
    database,
    `
      SELECT ${SESSION_COLUMNS}, p.nickname AS pokemon_name
      FROM training_session s
      JOIN pokemon p ON s.pokemon_id = p.id
      WHERE s.program_id = ?
      ORDER BY s.start_time DESC
    `,
    [programId]
  );
}

export function findTrainingSessionsForPokemon(
  database: sqlite3.Database,
  pokemonId: string
): Promise<TrainingSessionWithProgram[]> {
  return queryAll<TrainingSessionWithProgram>(
    database,
    `
      SELECT ${SESSION_COLUMNS}, p.name AS program_name
      FROM training_session s
      JOIN training_program p ON s.program_id = p.id
      WHERE s.pokemon_id = ?
      ORDER BY s.start_time DESC
    `,
    [pokemonId]
  );
}

export function createTrainingSession(
  database: sqlite3.Database,
  input: TrainingSessionCreateInput
): Promise<StatementResult> {
  return runStatement(
    database,
    `
      INSERT INTO training_session (
        pokemon_id, program_id, start_time, end_time, success, fatigue, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.pokemon_id,
      input.program_id,
      input.start_time,
      input.end_time,
      input.success,
      input.fatigue,
      input.notes,
    ]
  );
}

export function updateTrainingSession(
  database: sqlite3.Database,
  sessionId: string,
  input: TrainingSessionUpdateInput
): Promise<StatementResult> {
  return runStatement(
    database,
    `
      UPDATE training_session
      SET start_time = COALESCE(?, start_time), end_time = ?, success = ?, fatigue = ?, notes = ?
      WHERE id = ?
    `,
    [input.start_time, input.end_time, input.success, input.fatigue, input.notes, sessionId]
  );
}

export function findTrainingSessionById(
  database: sqlite3.Database,
  sessionId: string
): Promise<TrainingSessionDetail | null> {
  return queryOne<TrainingSessionDetail>(
    database,
    `
      SELECT ${SESSION_COLUMNS}, p.nickname AS pokemon_name, tp.name AS program_name
      FROM training_session s
      JOIN pokemon p ON s.pokemon_id = p.id
      JOIN training_program tp ON s.program_id = tp.id
      WHERE s.id = ?
    `,
    [sessionId]
  );
}

export function deleteTrainingSession(
  database: sqlite3.Database,
  sessionId: string
): Promise<StatementResult> {
  return runStatement(database, 'DELETE FROM training_session WHERE id = ?', [sessionId]);
}
