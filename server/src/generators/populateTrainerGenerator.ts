import sqlite3 from 'sqlite3';
import { RANK_BREAKPOINTS, TYPE_WEIGHTS } from '../reference-data/conversions/conversions';
import { generateRandomTrainer } from './trainerGenerator';
import { generateGeneralRatings } from './generalRatingGenerator';
import { generateFormatRatingsFixed } from './formatRatingGenerator';
import { generateFieldRatings } from './fieldRatingGenerator';
import { generatePokemonTeam } from './pokemonGenerator';
import { Types } from '../reference-data/enums/types';
import { allPokemon, initPokemon, PokemonEntity } from '../reference-data/pokemon';

interface PreparedStatements {
  insertTrainer: sqlite3.Statement;
  insertHometown: sqlite3.Statement;
  insertRating: sqlite3.Statement;
  insertMentalRating: sqlite3.Statement;
  insertFormatRating: sqlite3.Statement;
  insertPokemon: sqlite3.Statement;
  insertFieldRating: sqlite3.Statement;
}

interface WeightCache {
  regions?: Array<{ id: number; name: string; population: number }>;
  regionWeights?: number[];
  citiesByRegion?: Map<number, Array<{ id: number; name: string; region_id: number; population: number }>>;
  cityWeightsByRegion?: Map<number, number[]>;
  nameFrequenciesByRegion?: Map<string, any[]>; // key: "regionId_F" or "regionId_S"
}

interface RatingRange {
  minRating: number;
  maxRating: number;
  targetCount: number;
  existingCount: number;
  toGenerate: number;
}

interface GeneratedTrainerData {
  trainerId: number;
  pwtrRating: number;
  regionId: number;
  typePreferences?: Types[];
}

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

/**
 * Sample types without replacement using TYPE_WEIGHTS
 */
function weightedSampleTypes(count: number): Types[] {
  const entries: Array<{ type: Types; weight: number }> = [];
  for (const key in TYPE_WEIGHTS) {
    const t = Number(key) as unknown as Types;
    const w = TYPE_WEIGHTS[t as unknown as Types] ?? 0;
    if (w > 0) entries.push({ type: t, weight: w });
  }

  const picked: Types[] = [];
  for (let k = 0; k < count && entries.length > 0; k++) {
    const total = entries.reduce((s, e) => s + e.weight, 0);
    let r = Math.random() * total;
    for (let i = 0; i < entries.length; i++) {
      r -= entries[i].weight;
      if (r <= 0) {
        picked.push(entries[i].type);
        entries.splice(i, 1);
        break;
      }
    }
  }

  return picked;
}

/**
 * Main function to populate additional trainers up to 5000 total
 */
export const populateGeneratedTrainers = async (db: sqlite3.Database): Promise<void> => {
  console.log('Starting trainer generation to fill up to 5000 trainers...');
  ensurePokemonCache();

  // Build weight cache once for all trainers
  console.log('Building weight cache...');
  const cache: WeightCache = await buildWeightCache(db);
  console.log('Weight cache built');

  // Step 1: Determine rating ranges and how many trainers to generate in each
  const ratingRanges = await determineRatingRanges(db);
  
  console.log(`Need to generate ${ratingRanges.reduce((sum, range) => sum + range.toGenerate, 0)} trainers total`);

  // Step 2: Generate trainers for each range
  const generatedTrainers = await generateTrainersForRanges(db, ratingRanges, cache);
  
  console.log(`Generated ${generatedTrainers.length} new trainers`);

  // Step 3: Generate ratings, teams, and field ratings for all new trainers
  await generateRatingsAndTeamsForTrainers(db, generatedTrainers);
  
  console.log('Trainer generation completed successfully');
};

/**
 * Determine how many trainers to generate in each rating range based on RANK_BREAKPOINTS
 */
async function determineRatingRanges(db: sqlite3.Database): Promise<RatingRange[]> {
  // Get existing trainer counts by rating range
  const existingTrainers = await allAsync<{ pwtr_rating: number }>(
    db,
    'SELECT pwtr_rating FROM trainer WHERE pwtr_rating IS NOT NULL ORDER BY pwtr_rating DESC'
  );

  const ranges: RatingRange[] = [];

  // Process each breakpoint range (top to bottom)
  // Stop at rank 4457 (index 25: [4457, 3200]) - only generate top ~4500 trainers
  const maxIndex = Math.min(25, RANK_BREAKPOINTS.length - 1);
  for (let i = 0; i < maxIndex; i++) {
    const [currentRank, currentRating] = RANK_BREAKPOINTS[i];
    const [nextRank, nextRating] = RANK_BREAKPOINTS[i + 1];

    // Target count is the difference in ranks
    const targetCount = nextRank - currentRank;

    // Count existing trainers in this range
    const existingCount = existingTrainers.filter(
      (t) => t.pwtr_rating >= nextRating && t.pwtr_rating <= currentRating
    ).length;

    // Calculate how many to generate
    const toGenerate = Math.max(0, targetCount - existingCount);

    if (toGenerate > 0) {
      ranges.push({
        minRating: nextRating,
        maxRating: currentRating,
        targetCount,
        existingCount,
        toGenerate
      });
    }
  }

  return ranges;
}

/**
 * Generate trainers for all rating ranges using prepared statements
 */
async function generateTrainersForRanges(
  db: sqlite3.Database,
  ranges: RatingRange[],
  cache: WeightCache
): Promise<GeneratedTrainerData[]> {
  const generatedTrainers: GeneratedTrainerData[] = [];

  // Prepare statements
  const stmtTrainer = await prepareStatement(
    db,
    `INSERT INTO trainer (fname, lname, region_id, birthdate, pwtr_rating, peak_rating, peak_rank, active_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const stmtHometown = await prepareStatement(
    db,
    `INSERT INTO trainer_hometown (trainer_id, city_id) VALUES (?, ?)`
  );

  await execAsync(db, 'BEGIN TRANSACTION');
  
  try {
    for (const range of ranges) {
      console.log(
        `Generating ${range.toGenerate} trainers in range ${range.minRating}-${range.maxRating} (existing: ${range.existingCount}/${range.targetCount})`
      );

      for (let i = 0; i < range.toGenerate; i++) {
        const pwtrRating = Math.floor(
          Math.random() * (range.maxRating - range.minRating + 1) + range.minRating
        );

        // Use the trainer generator with cached weights
        const trainerResult = await generateRandomTrainer(db, undefined, undefined, undefined, pwtrRating, cache);

        // Insert trainer using prepared statement
        const trainerId = await runStatement(stmtTrainer, [
          trainerResult.trainer.fname,
          trainerResult.trainer.lname,
          trainerResult.trainer.region_id,
          trainerResult.trainer.birthdate,
          trainerResult.trainer.pwtr_rating,
          trainerResult.trainer.peak_rating,
          trainerResult.trainer.peak_rank,
          trainerResult.trainer.active_status ? 1 : 0
        ]);

        // Insert hometown using prepared statement
        await runStatement(stmtHometown, [trainerId, trainerResult.hometown.city_id]);

        // 50% chance this trainer is a type specialist (1 or 2 types)
        let typePreferences: Types[] | undefined = undefined;
        if (Math.random() < 0.5) {
          const count = Math.random() < 0.5 ? 1 : 2;
          typePreferences = weightedSampleTypes(count);
        }

        generatedTrainers.push({
          trainerId,
          pwtrRating,
          regionId: trainerResult.trainer.region_id,
          typePreferences
        });
      }
    }

    await execAsync(db, 'COMMIT');
  } catch (error) {
    await execAsync(db, 'ROLLBACK');
    throw error;
  } finally {
    await finalizeStatement(stmtTrainer);
    await finalizeStatement(stmtHometown);
  }

  return generatedTrainers;
}

/**
 * Generate ratings, teams, and field ratings for all newly generated trainers
 */
async function generateRatingsAndTeamsForTrainers(
  db: sqlite3.Database,
  trainers: GeneratedTrainerData[]
): Promise<void> {
  console.log('Generating ratings and teams for new trainers...');

  await execAsync(db, 'BEGIN TRANSACTION');

  try {
    for (let i = 0; i < trainers.length; i++) {
      const trainer = trainers[i];

      // Log progress every 100 trainers
      if (i % 100 === 0) {
        console.log(`Processing trainer ${i + 1}/${trainers.length}...`);
      }

      // Generate general ratings
      const generalRatings = generateGeneralRatings(trainer.trainerId, trainer.pwtrRating);

      const ratingId = await runAsync(
        db,
        `INSERT INTO rating (trainer_id, year, overall_rating, typing_rating, mixed_rating, special_rating)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          trainer.trainerId,
          generalRatings.year,
          generalRatings.overall_rating,
          generalRatings.typing_rating,
          generalRatings.mixed_rating,
          generalRatings.special_rating
        ]
      );

      // Generate mental ratings
      const mentalRatings = generateMentalRatings(generalRatings.overall_rating);
      await runAsync(
        db,
        `INSERT INTO mental_rating (
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
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
        ]
      );

      // Generate format ratings
      const formatRatings = generateFormatRatingsFixed(
        generalRatings.overall_rating,
        trainer.trainerId,
        ratingId
      ) as any;
      await runAsync(
        db,
        `INSERT INTO format_rating (
          rating_id,
          singles_rating,
          doubles_rating,
          tag_battle_rating,
          battle_factory_rating,
          rotation_rating,
          sixes_rating,
          threes_rating,
          twos_rating
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ratingId,
          formatRatings.singles_rating,
          formatRatings.doubles_rating,
          formatRatings.tag_battle_rating,
          formatRatings.battle_factory_rating,
          formatRatings.rotation_rating,
          formatRatings.sixes_rating,
          formatRatings.threes_rating,
          formatRatings.twos_rating
        ]
      );

      // Generate Pokémon team
      const generationPreferences = trainer.regionId ? [trainer.regionId] : undefined;
      const typePreferences = trainer.typePreferences ? trainer.typePreferences : undefined;
      const team = generatePokemonTeam(
        generalRatings.overall_rating,
        typePreferences,
        generationPreferences
      );

      const teamRows: Array<{
        species_id: number;
        pokemon_id: number;
        level: number;
        is_mega: number;
        is_gigantamax: number;
      }> = [];

      for (const pokemon of team) {
        await runAsync(
          db,
          `INSERT INTO pokemon (
            trainer_id,
            species_id,
            pokemon_id,
            level,
            nickname,
            is_mega,
            is_gigantamax
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            trainer.trainerId,
            pokemon.species_id,
            pokemon.pokemon_id,
            pokemon.level,
            pokemon.name,
            pokemon.is_mega ? 1 : 0,
            pokemon.is_gigantamax ? 1 : 0
          ]
        );

        teamRows.push({
          species_id: pokemon.species_id,
          pokemon_id: pokemon.pokemon_id,
          level: pokemon.level,
          is_mega: pokemon.is_mega ? 1 : 0,
          is_gigantamax: pokemon.is_gigantamax ? 1 : 0
        });
      }

      // Generate field ratings
      if (teamRows.length > 0) {
        const trainerPokemon = teamRows.map((p) => ({
          species_id: p.species_id,
          pokemon_id: p.pokemon_id,
          level: p.level || 50,
          is_mega: p.is_mega || 0,
          is_gigantamax: p.is_gigantamax || 0
        }));

        const fieldRatings = generateFieldRatings(trainerPokemon, {
          overall: generalRatings.overall_rating,
          typing: generalRatings.typing_rating,
          mixed: generalRatings.mixed_rating,
          special: generalRatings.special_rating
        });

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
          'swarm_field_rating',
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

        const placeholders = new Array(FIELD_COLUMNS.length + 1).fill('?').join(', ');
        const values = [
          ratingId,
          ...FIELD_COLUMNS.map((column) => fieldRatings[column] ?? generalRatings.overall_rating)
        ];

        await runAsync(
          db,
          `INSERT INTO field_rating (rating_id, ${FIELD_COLUMNS.join(', ')}) VALUES (${placeholders})`,
          values
        );
      }
    }

    await execAsync(db, 'COMMIT');
    console.log('All ratings and teams generated successfully');
  } catch (error) {
    await execAsync(db, 'ROLLBACK');
    throw error;
  }
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

/**
 * Build a cache of location/name weights to avoid repeated DB queries
 */
async function buildWeightCache(db: sqlite3.Database): Promise<WeightCache> {
  const cache: WeightCache = {
    citiesByRegion: new Map(),
    cityWeightsByRegion: new Map(),
    nameFrequenciesByRegion: new Map()
  };

  // Load all regions
  cache.regions = await allAsync<{ id: number; name: string; population: number }>(
    db,
    'SELECT id, name, population FROM region'
  );
  cache.regionWeights = cache.regions.map(r => r.population || 1);

  // Load all cities grouped by region
  const allCities = await allAsync<{ id: number; name: string; region_id: number; population: number }>(
    db,
    'SELECT id, name, region_id, population FROM city'
  );

  for (const city of allCities) {
    if (!cache.citiesByRegion!.has(city.region_id)) {
      cache.citiesByRegion!.set(city.region_id, []);
    }
    cache.citiesByRegion!.get(city.region_id)!.push(city);
  }

  // Pre-calculate city weights per region
  for (const [regionId, cities] of cache.citiesByRegion!) {
    cache.cityWeightsByRegion!.set(
      regionId,
      cities.map(c => c.population || 1)
    );
  }

  // Load all name frequencies
  const allNameFreqs = await allAsync<{ region_id: number; country: string; frequency: number; type: string }>(
    db,
    'SELECT region_id, country, frequency, type FROM region_name_frequency'
  );

  for (const freq of allNameFreqs) {
    const key = `${freq.region_id}_${freq.type}`;
    if (!cache.nameFrequenciesByRegion!.has(key)) {
      cache.nameFrequenciesByRegion!.set(key, []);
    }
    cache.nameFrequenciesByRegion!.get(key)!.push({
      country: freq.country,
      frequency: freq.frequency
    });
  }

  return cache;
}

/**
 * Prepare a SQL statement
 */
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

/**
 * Run a prepared statement and return lastID
 */
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

/**
 * Finalize a prepared statement
 */
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
