import sqlite3 from 'sqlite3';
import { generateGeneralRatings } from './generalRatingGenerator';
import { generateFormatRatingsFixed } from './formatRatingGenerator';
import { generateFieldRatings } from './fieldRatingGenerator';
import { generatePokemonTeam } from './pokemonGenerator';
import { Types } from '../data/enums/types';
import { allPokemon, initPokemon, PokemonEntity } from '../data/pokemon';

interface TrainerRow {
  id: number;
  region_id: number | null;
  pwtr_rating: number | null;
}

interface PokemonRow {
  species_id: number;
  pokemon_id: number;
  level: number | null;
  is_mega: number | null;
  is_gigantamax: number | null;
}

interface PokemonRowWithTrainer extends PokemonRow {
  trainer_id: number;
}

interface RatingSummary {
  ratingId: number;
  overall: number;
  typing: number;
  mixed: number;
  special: number;
}

interface FormatRatingsResult {
  rating_id: number;
  singles_rating: number;
  doubles_rating: number;
  tag_battle_rating: number;
  battle_factory_rating: number;
  rotation_rating: number;
  sixes_rating: number;
  threes_rating: number;
  twos_rating: number;
}

interface PreparedStatements {
  insertRating: sqlite3.Statement;
  insertMentalRating: sqlite3.Statement;
  insertFormatRating: sqlite3.Statement;
  insertPokemon: sqlite3.Statement;
  insertFieldRating: sqlite3.Statement;
}

const FIELD_COLUMNS = [
  'pumped_field_rating',
  'windy_field_rating',
  'corrosive_field_rating',
  'desert_field_rating',
  'cliffs_field_rating',
  'swarm_field_rating',
  'haunted_field_rating',
  'factory_field_rating',
  'infernal_field_rating',
  'watersurface_field_rating',
  'grassy_field_rating',
  'electirized_field_rating',
  'psychic_field_rating',
  'icy_field_rating',
  'draconidden_field_rating',
  'darkcavern_field_rating',
  'misty_field_rating',
  'city_field_rating',
  'mirror_field_rating',
  'concertvenue_field_rating',
  'crystalcavern_field_rating',
  'waterfall_field_rating',
  'volcanic_field_rating',
  'forest_field_rating',
  'flowergarden_field_rating',
  'swamp_field_rating',
  'bewitchedwoods_field_rating',
  'murkwatersurface_field_rating',
  'smoky_field_rating',
  'frozendimensional_field_rating',
  'valleyofwinds_field_rating',
  'losthotel_field_rating',
  'taiga_field_rating',
  'ashenbeach_field_rating',
  'underwater_field_rating',
  'starlightarena_field_rating',
  'snowymountain_field_rating',
  'bigtop_field_rating',
  'backalley_field_rating',
  'neutral_field_rating',
  'chess_field_rating',
  'deepearth_field_rating',
  'inverse_field_rating',
  'glitch_field_rating',
  'dimensional_field_rating',
  'colosseum_field_rating',
  'trickster_field_rating',
  'fantasy_field_rating',
  'rainbow_field_rating',
  'newworld_field_rating'
];

const FIELD_RATING_PLACEHOLDERS = new Array(FIELD_COLUMNS.length + 1).fill('?').join(', ');

const INSERT_RATING_SQL = `
  INSERT INTO rating (trainer_id, year, overall_rating, typing_rating, mixed_rating, special_rating)
  VALUES (?, ?, ?, ?, ?, ?)
`;

const INSERT_MENTAL_RATING_SQL = `
  INSERT INTO mental_rating (
    rating_id,
    planning_rating,
    risk_rating,
    prediction_rating,
    clutch_rating,
    consistency_rating,
    motivation_rating,
    pokemon_knowledge_rating,
    trainer_knowledge_rating,
    training_rating,
    conditioning_rating,
    determination_rating,
    facilities_rating,
    attack_rating,
    defense_rating,
    speed_rating,
    gimmick_rating
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const INSERT_FORMAT_RATING_SQL = `
  INSERT INTO format_rating (
    rating_id,
    singles_rating,
    doubles_rating,
    tag_battle_rating,
    battle_factory_rating,
    rotation_rating,
    sixes_rating,
    threes_rating,
    twos_rating
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const INSERT_POKEMON_SQL = `
  INSERT INTO pokemon (
    trainer_id,
    species_id,
    pokemon_id,
    level,
    nickname,
    is_mega,
    is_gigantamax
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`;

const INSERT_FIELD_RATING_SQL = `
  INSERT INTO field_rating (rating_id, ${FIELD_COLUMNS.join(', ')}) VALUES (${FIELD_RATING_PLACEHOLDERS})
`;

const pokemonLookup: Map<number, PokemonEntity> = new Map();

function ensurePokemonCache() {
  if (allPokemon.length === 0) {
    initPokemon();
  }

  if (pokemonLookup.size === 0) {
    allPokemon.forEach((pokemon) => {
      pokemonLookup.set(pokemon.id, pokemon);
    });
  }
}

export const populateFullSaveData = async (db: sqlite3.Database): Promise<void> => {
  ensurePokemonCache();
  const trainers = await allAsync<TrainerRow>(db, 'SELECT id, region_id, pwtr_rating FROM trainer');
  const trainerPokemonMap = await loadTrainerPokemonMap(db);
  const statements = await prepareStatements(db);

  await execAsync(db, 'BEGIN TRANSACTION');
  try {
    for (const trainer of trainers) {
      const teamRef = trainerPokemonMap.get(trainer.id) ?? [];
      if (!trainerPokemonMap.has(trainer.id)) {
        trainerPokemonMap.set(trainer.id, teamRef);
      }

      const ratingSummary = await createRatingsForTrainer(db, trainer, statements);
      const updatedTeam = await ensureTrainerPokemonTeam(db, trainer, ratingSummary, teamRef, statements);
      await createFieldRatings(ratingSummary, statements, updatedTeam);
    }
    await execAsync(db, 'COMMIT');
  } catch (error) {
    await execAsync(db, 'ROLLBACK');
    throw error;
  } finally {
    await finalizeStatements(statements);
  }
};

async function createRatingsForTrainer(
  db: sqlite3.Database,
  trainer: TrainerRow,
  statements: PreparedStatements
): Promise<RatingSummary> {
  const generalRatings = generateGeneralRatings(trainer.id, trainer.pwtr_rating);

  const ratingId = await runStatement(statements.insertRating, [
    trainer.id,
    generalRatings.year,
    generalRatings.overall_rating,
    generalRatings.typing_rating,
    generalRatings.mixed_rating,
    generalRatings.special_rating
  ]);

  const mentalRatings = generateMentalRatings(generalRatings.overall_rating);
  await runStatement(statements.insertMentalRating, [
    ratingId,
    mentalRatings.planning_rating,
    mentalRatings.risk_rating,
    mentalRatings.prediction_rating,
    mentalRatings.clutch_rating,
    mentalRatings.consistency_rating,
    mentalRatings.motivation_rating,
    mentalRatings.pokemon_knowledge_rating,
    mentalRatings.trainer_knowledge_rating,
    mentalRatings.training_rating,
    mentalRatings.conditioning_rating,
    mentalRatings.determination_rating,
    mentalRatings.facilities_rating,
    mentalRatings.attack_rating,
    mentalRatings.defense_rating,
    mentalRatings.speed_rating,
    mentalRatings.gimmick_rating
  ]);

  const formatRatings = generateFormatRatingsFixed(generalRatings.overall_rating, trainer.id, ratingId) as unknown as FormatRatingsResult;
  await runStatement(statements.insertFormatRating, [
    ratingId,
    formatRatings.singles_rating,
    formatRatings.doubles_rating,
    formatRatings.tag_battle_rating,
    formatRatings.battle_factory_rating,
    formatRatings.rotation_rating,
    formatRatings.sixes_rating,
    formatRatings.threes_rating,
    formatRatings.twos_rating
  ]);

  return {
    ratingId,
    overall: generalRatings.overall_rating,
    typing: generalRatings.typing_rating,
    mixed: generalRatings.mixed_rating,
    special: generalRatings.special_rating
  };
}

async function ensureTrainerPokemonTeam(
  db: sqlite3.Database,
  trainer: TrainerRow,
  rating: RatingSummary,
  team: PokemonRow[],
  statements: PreparedStatements
): Promise<PokemonRow[]> {
  if (team.length >= 8) {
    return team;
  }

  const typePreferences = determineTypePreferences(team);
  const generationPreferences = trainer.region_id ? [trainer.region_id] : undefined;

  const generatedTeam = generatePokemonTeam(rating.overall, typePreferences.length ? typePreferences : undefined, generationPreferences);
  const speciesSeen = new Set<number>(team.map(p => p.species_id));

  // Insert all generated Pokémon (no cap). We only run this generator when the trainer
  // already has fewer than 8 Pokémon; if they have 8 or more we skip generation entirely.
  for (const pokemon of generatedTeam) {
    if (speciesSeen.has(pokemon.species_id)) {
      continue;
    }

    speciesSeen.add(pokemon.species_id);

    await runStatement(statements.insertPokemon, [
      trainer.id,
      pokemon.species_id,
      pokemon.pokemon_id,
      pokemon.level,
      pokemon.name,
      pokemon.is_mega ? 1 : 0,
      pokemon.is_gigantamax ? 1 : 0
    ]);

    team.push({
      species_id: pokemon.species_id,
      pokemon_id: pokemon.pokemon_id,
      level: pokemon.level,
      is_mega: pokemon.is_mega ? 1 : 0,
      is_gigantamax: pokemon.is_gigantamax ? 1 : 0
    });
  }

  return team;
}

async function createFieldRatings(
  rating: RatingSummary,
  statements: PreparedStatements,
  team: PokemonRow[]
): Promise<void> {
  if (!team || team.length === 0) {
    return;
  }

  const trainerPokemon = team.map((pokemon) => ({
    species_id: pokemon.species_id,
    pokemon_id: pokemon.pokemon_id,
    level: pokemon.level || 50,
    is_mega: pokemon.is_mega || 0,
    is_gigantamax: pokemon.is_gigantamax || 0
  }));

  const fieldRatings = generateFieldRatings(trainerPokemon, {
    overall: rating.overall,
    typing: rating.typing,
    mixed: rating.mixed,
    special: rating.special
  });

  const values = [rating.ratingId, ...FIELD_COLUMNS.map((column) => fieldRatings[column] ?? rating.overall)];

  await runStatement(statements.insertFieldRating, values);
}

async function loadTrainerPokemonMap(db: sqlite3.Database): Promise<Map<number, PokemonRow[]>> {
  const existingPokemon = await allAsync<PokemonRowWithTrainer>(
    db,
    'SELECT trainer_id, species_id, pokemon_id, level, is_mega, is_gigantamax FROM pokemon'
  );

  const map = new Map<number, PokemonRow[]>();

  existingPokemon.forEach((row) => {
    if (!map.has(row.trainer_id)) {
      map.set(row.trainer_id, []);
    }

    map.get(row.trainer_id)!.push({
      species_id: row.species_id,
      pokemon_id: row.pokemon_id,
      level: row.level,
      is_mega: row.is_mega,
      is_gigantamax: row.is_gigantamax
    });
  });

  return map;
}

async function prepareStatements(db: sqlite3.Database): Promise<PreparedStatements> {
  const [
    insertRating,
    insertMentalRating,
    insertFormatRating,
    insertPokemon,
    insertFieldRating
  ] = await Promise.all([
    prepareStatement(db, INSERT_RATING_SQL),
    prepareStatement(db, INSERT_MENTAL_RATING_SQL),
    prepareStatement(db, INSERT_FORMAT_RATING_SQL),
    prepareStatement(db, INSERT_POKEMON_SQL),
    prepareStatement(db, INSERT_FIELD_RATING_SQL)
  ]);

  return {
    insertRating,
    insertMentalRating,
    insertFormatRating,
    insertPokemon,
    insertFieldRating
  };
}

function finalizeStatements(statements: PreparedStatements): Promise<void> {
  const finalizers = Object.values(statements).map((statement) => finalizeStatement(statement));
  return Promise.all(finalizers).then(() => undefined);
}

function runStatement(statement: sqlite3.Statement, params: unknown[] = []): Promise<number> {
  return new Promise((resolve, reject) => {
    statement.run(params, function (err) {
      if (err) {
        reject(err);
        return;
      }

      resolve(this.lastID ?? 0);
    });
  });
}

function prepareStatement(db: sqlite3.Database, sql: string): Promise<sqlite3.Statement> {
  return new Promise((resolve, reject) => {
    const statement = db.prepare(sql, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(statement);
    });
  });
}

function finalizeStatement(statement: sqlite3.Statement): Promise<void> {
  return new Promise((resolve, reject) => {
    statement.finalize((err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

function generateMentalRatings(overall: number) {
  return {
    planning_rating: randomInt(Math.max(0, overall - 10), Math.min(99, overall + 10)),
    risk_rating: randomInt(Math.max(0, overall - 15), Math.min(99, overall + 5)),
    prediction_rating: randomInt(Math.max(0, overall - 20), Math.min(99, overall + 20)),
    clutch_rating: randomInt(Math.max(0, overall - 10), Math.min(99, overall + 15)),
    consistency_rating: randomInt(Math.max(0, overall - 10), Math.min(99, overall + 10)),
    motivation_rating: randomInt(Math.max(0, overall - 15), Math.min(99, overall + 15)),
    pokemon_knowledge_rating: randomInt(Math.max(0, overall - 10), Math.min(99, overall + 10)),
    trainer_knowledge_rating: randomInt(Math.max(0, overall - 10), Math.min(99, overall + 10)),
    training_rating: randomInt(Math.max(0, overall - 10), Math.min(99, overall + 10)),
    conditioning_rating: randomInt(Math.max(0, overall - 10), Math.min(99, overall + 10)),
    determination_rating: randomInt(Math.max(0, overall - 15), Math.min(99, overall + 15)),
    facilities_rating: randomInt(Math.max(0, overall - 15), Math.min(99, overall + 20)),
    attack_rating: randomInt(Math.max(0, overall - 15), Math.min(99, overall + 15)),
    defense_rating: randomInt(Math.max(0, overall - 15), Math.min(99, overall + 15)),
    speed_rating: randomInt(Math.max(0, overall - 15), Math.min(99, overall + 15)),
    gimmick_rating: randomInt(Math.max(0, overall - 15), Math.min(99, overall + 15))
  };
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function getTrainerPokemon(db: sqlite3.Database, trainerId: number): Promise<PokemonRow[]> {
  return allAsync<PokemonRow>(
    db,
    `SELECT species_id, pokemon_id, level, is_mega, is_gigantamax FROM pokemon WHERE trainer_id = ?`,
    [trainerId]
  );
}

function determineTypePreferences(team: PokemonRow[]): Types[] {
  const typeCounts: Record<number, number> = {};

  team.forEach((pokemon) => {
    const details = pokemonLookup.get(pokemon.pokemon_id);
    if (!details) {
      return;
    }

    details.types.forEach((type) => {
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
  });

  return Object.entries(typeCounts)
    .filter(([, count]) => count >= 2)
    .map(([type]) => Number(type) as Types);
}

function allAsync<T = any>(db: sqlite3.Database, sql: string, params: unknown[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows as T[]);
      }
    });
  });
}

function runAsync(db: sqlite3.Database, sql: string, params: unknown[] = []): Promise<number> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
        return;
      }

      resolve(this.lastID ?? 0);
    });
  });
}

function execAsync(db: sqlite3.Database, sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}
