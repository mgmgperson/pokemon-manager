import { open, readFile } from 'fs/promises';
import { resolve } from 'path';
import sqlite3 from 'sqlite3';
import { closeDatabase, openDatabase, queryAll, runInTransaction, runStatement } from '../infrastructure/database/sqlite';

const LEVEL_INCREASE = 5;
const MAX_POKEMON_LEVEL = 100;
const PLAN_VERSION = 1;

interface ScriptOptions {
  databasePath: string;
  planPath: string;
  apply: boolean;
  limit: number | undefined;
}

interface PokemonLevelTarget {
  pokemonId: number;
  trainerId: number;
  previousLevel: number;
  proposedLevel: number;
}

interface LevelRebalancePlan {
  version: number;
  databasePath: string;
  levelIncrease: number;
  targets: PokemonLevelTarget[];
}

interface PokemonLevelTargetRow {
  pokemon_id: number;
  trainer_id: number;
  level: number;
}

function usage(): string {
  return [
    'Usage:',
    '  npx ts-node src/bin/rebalance-generated-pokemon-levels.ts --database <path> --plan <path> [--limit <count>]',
    '  npx ts-node src/bin/rebalance-generated-pokemon-levels.ts --database <path> --plan <path> --apply',
    '',
    'The first command reads the database and writes a reviewable plan file.',
    'The --apply command uses that exact plan and updates no newly discovered rows.',
  ].join('\n');
}

function parsePositiveInteger(value: string, label: string): number {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${label} must be a positive whole number`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${label} must be a positive whole number`);
  }
  return parsed;
}

function parseOptions(argumentsList: string[]): ScriptOptions {
  let databasePath: string | undefined;
  let planPath: string | undefined;
  let apply = false;
  let limit: number | undefined;

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === '--database' || argument === '--plan' || argument === '--limit') {
      const value = argumentsList[index + 1];
      if (!value) {
        throw new Error(`${argument} requires a value`);
      }
      if (argument === '--database') {
        databasePath = value;
      } else if (argument === '--plan') {
        planPath = value;
      } else {
        limit = parsePositiveInteger(value, '--limit');
      }
      index += 1;
    } else if (argument === '--apply') {
      apply = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!databasePath || !planPath) {
    throw new Error('--database and --plan are required');
  }
  if (apply && limit !== undefined) {
    throw new Error('--limit is only available while creating a plan');
  }

  return {
    databasePath: resolve(process.cwd(), databasePath),
    planPath: resolve(process.cwd(), planPath),
    apply,
    limit,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requirePositiveInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
    throw new Error(`Invalid ${label} in level-rebalance plan`);
  }
  return value;
}

function parsePlanTarget(value: unknown): PokemonLevelTarget {
  if (!isRecord(value)) {
    throw new Error('Invalid target in level-rebalance plan');
  }

  const previousLevel = requirePositiveInteger(value.previousLevel, 'previousLevel');
  const proposedLevel = requirePositiveInteger(value.proposedLevel, 'proposedLevel');
  if (
    previousLevel > MAX_POKEMON_LEVEL
    || previousLevel % 5 === 0
    || proposedLevel !== Math.min(previousLevel + LEVEL_INCREASE, MAX_POKEMON_LEVEL)
  ) {
    throw new Error('Invalid level transition in level-rebalance plan');
  }

  return {
    pokemonId: requirePositiveInteger(value.pokemonId, 'pokemonId'),
    trainerId: requirePositiveInteger(value.trainerId, 'trainerId'),
    previousLevel,
    proposedLevel,
  };
}

function parsePlan(content: string, expectedDatabasePath: string): LevelRebalancePlan {
  const value: unknown = JSON.parse(content);
  if (!isRecord(value) || value.version !== PLAN_VERSION || value.levelIncrease !== LEVEL_INCREASE) {
    throw new Error('Invalid or unsupported level-rebalance plan');
  }
  if (value.databasePath !== expectedDatabasePath || !Array.isArray(value.targets)) {
    throw new Error('Level-rebalance plan does not match the selected database');
  }

  const targets = value.targets.map(parsePlanTarget);
  const pokemonIds = new Set(targets.map((target) => target.pokemonId));
  if (pokemonIds.size !== targets.length) {
    throw new Error('Level-rebalance plan contains duplicate Pokémon targets');
  }

  return {
    version: PLAN_VERSION,
    databasePath: expectedDatabasePath,
    levelIncrease: LEVEL_INCREASE,
    targets,
  };
}

async function findTargets(database: sqlite3.Database, limit: number | undefined): Promise<PokemonLevelTarget[]> {
  const parameters = limit === undefined ? [] : [limit];
  const limitClause = limit === undefined ? '' : 'LIMIT ?';
  const rows = await queryAll<PokemonLevelTargetRow>(
    database,
    `
      SELECT id AS pokemon_id, trainer_id, level
      FROM pokemon
      WHERE level BETWEEN 1 AND ?
        AND level % 5 <> 0
      ORDER BY id
      ${limitClause}
    `,
    [MAX_POKEMON_LEVEL, ...parameters]
  );

  return rows.map((row) => ({
    pokemonId: row.pokemon_id,
    trainerId: row.trainer_id,
    previousLevel: row.level,
    proposedLevel: Math.min(row.level + LEVEL_INCREASE, MAX_POKEMON_LEVEL),
  }));
}

async function writePlan(planPath: string, plan: LevelRebalancePlan): Promise<void> {
  const file = await open(planPath, 'wx');
  try {
    await file.writeFile(`${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  } finally {
    await file.close();
  }
}

async function applyPlan(database: sqlite3.Database, plan: LevelRebalancePlan): Promise<void> {
  await runInTransaction(database, async () => {
    for (const target of plan.targets) {
      const updateResult = await runStatement(
        database,
        'UPDATE pokemon SET level = ? WHERE id = ? AND trainer_id = ? AND level = ?',
        [target.proposedLevel, target.pokemonId, target.trainerId, target.previousLevel]
      );
      if (updateResult.changes !== 1) {
        throw new Error(`Pokémon ${target.pokemonId} no longer matches its reviewed level plan`);
      }
    }
  });
}

function summarizePlan(plan: LevelRebalancePlan, mode: 'dry-run' | 'applied'): void {
  const affectedTrainerIds = new Set(plan.targets.map((target) => target.trainerId));
  const levelChanges = new Map<string, number>();
  for (const target of plan.targets) {
    const transition = `${target.previousLevel}->${target.proposedLevel}`;
    levelChanges.set(transition, (levelChanges.get(transition) ?? 0) + 1);
  }

  console.log(JSON.stringify({
    mode,
    databasePath: plan.databasePath,
    pokemonAdjusted: plan.targets.length,
    affectedTrainers: affectedTrainerIds.size,
    levelIncrease: LEVEL_INCREASE,
    levelChanges: Object.fromEntries(levelChanges),
    sample: plan.targets.slice(0, 20),
  }, null, 2));
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  if (!options.apply) {
    const database = await openDatabase(options.databasePath, sqlite3.OPEN_READONLY);
    try {
      const targets = await findTargets(database, options.limit);
      const plan: LevelRebalancePlan = {
        version: PLAN_VERSION,
        databasePath: options.databasePath,
        levelIncrease: LEVEL_INCREASE,
        targets,
      };
      await writePlan(options.planPath, plan);
      summarizePlan(plan, 'dry-run');
    } finally {
      await closeDatabase(database);
    }
    return;
  }

  const plan = parsePlan(await readFile(options.planPath, 'utf8'), options.databasePath);
  const database = await openDatabase(options.databasePath, sqlite3.OPEN_READWRITE);
  try {
    await applyPlan(database, plan);
    summarizePlan(plan, 'applied');
  } finally {
    await closeDatabase(database);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  console.error(usage());
  process.exitCode = 1;
});
