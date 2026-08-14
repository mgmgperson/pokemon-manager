import sqlite3 from 'sqlite3';
import { queryAll, queryOne } from '../../../infrastructure/database/sqlite';
import type {
  CityWeightRow,
  NameFrequencyRow,
  PokemonForFieldRating,
  RatingForGeneration,
  RegionWeightRow,
  TrainerForGeneration,
  WeightCache,
} from './randomizer.types';

interface DatabaseRegionWeightRow extends Omit<RegionWeightRow, 'population'> {
  population: number | null;
}

interface DatabaseCityWeightRow extends Omit<CityWeightRow, 'population'> {
  population: number | null;
}

export async function buildWeightCache(database: sqlite3.Database): Promise<WeightCache> {
  const [regionRows, cityRows, nameFrequencies] = await Promise.all([
    queryAll<DatabaseRegionWeightRow>(database, 'SELECT id, name, population FROM region'),
    queryAll<DatabaseCityWeightRow>(
      database,
      'SELECT id, name, region_id, population FROM city ORDER BY region_id'
    ),
    queryAll<NameFrequencyRow>(
      database,
      'SELECT region_id, type, country, frequency FROM region_name_frequency'
    ),
  ]);

  const regions = regionRows.map((region) => ({
    ...region,
    population: region.population || 1,
  }));
  const cities = cityRows.map((city) => ({
    ...city,
    population: city.population || 1,
  }));

  const citiesByRegion = new Map<number, CityWeightRow[]>();
  const cityWeightsByRegion = new Map<number, number[]>();
  for (const city of cities) {
    const citiesInRegion = citiesByRegion.get(city.region_id) ?? [];
    const weightsInRegion = cityWeightsByRegion.get(city.region_id) ?? [];
    citiesInRegion.push(city);
    weightsInRegion.push(city.population);
    citiesByRegion.set(city.region_id, citiesInRegion);
    cityWeightsByRegion.set(city.region_id, weightsInRegion);
  }

  const nameFrequenciesByRegion = new Map<
    string,
    Array<Pick<NameFrequencyRow, 'country' | 'frequency'>>
  >();
  for (const nameFrequency of nameFrequencies) {
    const key = `${nameFrequency.region_id}_${nameFrequency.type}`;
    const frequencies = nameFrequenciesByRegion.get(key) ?? [];
    frequencies.push({
      country: nameFrequency.country,
      frequency: nameFrequency.frequency,
    });
    nameFrequenciesByRegion.set(key, frequencies);
  }

  return {
    regions,
    regionWeights: regions.map((region) => region.population),
    citiesByRegion,
    cityWeightsByRegion,
    nameFrequenciesByRegion,
  };
}

export function findTrainerForGeneration(
  database: sqlite3.Database,
  trainerId: string
): Promise<TrainerForGeneration | null> {
  return queryOne<TrainerForGeneration>(
    database,
    'SELECT id, pwtr_rating FROM trainer WHERE id = ?',
    [trainerId]
  );
}

export function findLatestRatingForTrainer(
  database: sqlite3.Database,
  trainerId: string
): Promise<RatingForGeneration | null> {
  return queryOne<RatingForGeneration>(
    database,
    `
      SELECT id, overall_rating, typing_rating, mixed_rating, special_rating
      FROM rating
      WHERE trainer_id = ?
      ORDER BY year DESC
      LIMIT 1
    `,
    [trainerId]
  );
}

export function regionExists(database: sqlite3.Database, regionId: number): Promise<boolean> {
  return queryOne<{ id: number }>(database, 'SELECT id FROM region WHERE id = ?', [regionId])
    .then((region) => region !== null);
}

export function findPokemonForFieldRatings(
  database: sqlite3.Database,
  trainerId: string
): Promise<PokemonForFieldRating[]> {
  return queryAll<PokemonForFieldRating>(
    database,
    `
      SELECT species_id, pokemon_id, level, is_mega, is_gigantamax
      FROM pokemon
      WHERE trainer_id = ?
    `,
    [trainerId]
  );
}
