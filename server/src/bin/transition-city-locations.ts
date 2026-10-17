import { resolve } from 'path';
import sqlite3 from 'sqlite3';
import { closeDatabase, openDatabase, queryAll, runInTransaction, runStatement } from '../infrastructure/database/sqlite';
import { CITY_LOCATION_SCHEMA_VERSION as SCHEMA_VERSION, inspectCityLocationSchema } from '../infrastructure/database/cityLocationSchema';
import type { City } from '../modules/geography/cities/city.repository';
import { cityMapPoint, findCityLocationCandidates, parseLocationPolygon } from '../modules/geography/cities/city-location-matching';

interface RegionRow {
  id: number;
  name: string;
  population: number | null;
}

interface LocationRow extends RegionRow {
  region_id: number;
  area_coordinates: unknown;
}

function parseOptions(argumentsList: string[]): { databasePath: string; applySchema: boolean } {
  let databasePath: string | undefined;
  let applySchema = false;
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === '--database' && !databasePath) {
      const value = argumentsList[++index];
      if (!value || value.startsWith('--')) throw new Error('--database requires a path');
      databasePath = resolve(value);
    } else if (argument === '--apply-schema' && !applySchema) {
      applySchema = true;
    } else {
      throw new Error(`Unknown or repeated argument: ${argument}`);
    }
  }
  if (!databasePath) throw new Error('--database is required');
  return { databasePath, applySchema };
}

async function applySchema(database: sqlite3.Database): Promise<void> {
  await runStatement(database, 'PRAGMA foreign_keys = ON');
  await runInTransaction(database, async () => {
    const schema = await inspectCityLocationSchema(database);
    if (!schema.hasLocationId) {
      await runStatement(database, 'ALTER TABLE city ADD COLUMN location_id INTEGER REFERENCES location(id)');
    }
    await runStatement(database, 'CREATE INDEX IF NOT EXISTS city_location_idx ON city(location_id)');
    const indexes = await queryAll<{ name: string; unique: number; partial: number }>(database, 'PRAGMA index_list(city)');
    const index = indexes.find((entry) => entry.name === 'city_location_idx');
    const indexColumns = await queryAll<{ name: string }>(database, 'PRAGMA index_info(city_location_idx)');
    if (!index || index.unique || index.partial || indexColumns.length !== 1 || indexColumns[0].name !== 'location_id') {
      throw new Error('Unexpected city_location_idx definition');
    }
    const violations = await queryAll(database, 'PRAGMA foreign_key_check(city)');
    if (violations.length > 0) throw new Error('City foreign key violations found; schema upgrade rolled back');
    if (schema.schemaVersion < SCHEMA_VERSION) await runStatement(database, `PRAGMA user_version = ${SCHEMA_VERSION}`);
  });
}

function validPopulation(value: number | null): value is number {
  return value !== null && Number.isSafeInteger(value) && value >= 0;
}

function populationTotal(rows: readonly { population: number | null }[]): number | null {
  if (rows.some((row) => !validPopulation(row.population))) return null;
  const total = rows.reduce((sum, row) => sum + row.population!, 0);
  return Number.isSafeInteger(total) ? total : null;
}

async function createAudit(database: sqlite3.Database) {
  const schema = await inspectCityLocationSchema(database);
  const regions = await queryAll<RegionRow>(database, 'SELECT id, name, population FROM region ORDER BY id');
  const locations = await queryAll<LocationRow>(database,
    'SELECT id, name, region_id, population, area_coordinates FROM location ORDER BY id');
  const cities = await queryAll<City>(database, `
    SELECT id, name, region_id, population, x_coordinate, y_coordinate, description,
           ${schema.hasLocationId ? 'location_id' : 'NULL AS location_id'} FROM city ORDER BY id
  `);
  const matchableLocations = locations.map((location) => ({
    ...location, polygon: parseLocationPolygon(location.area_coordinates),
  }));
  const locationBudgets = matchableLocations.map((location) => {
    const assignedCities = cities.filter((city) => city.location_id === location.id);
    const assignedPopulation = populationTotal(assignedCities);
    const remainingPopulation = validPopulation(location.population) && assignedPopulation !== null
      ? location.population - assignedPopulation : null;
    const warnings: string[] = [];
    if (!location.polygon) warnings.push('invalid-polygon');
    if (!validPopulation(location.population)) warnings.push('unknown-or-invalid-population');
    if (assignedPopulation === null) warnings.push('unknown-or-invalid-assigned-population');
    if (remainingPopulation !== null && remainingPopulation < 0) warnings.push('population-exceeded');
    if (assignedCities.some((city) => city.region_id !== location.region_id)) warnings.push('cross-region-link');
    return {
      id: location.id, name: location.name, regionId: location.region_id, population: location.population,
      assignedCityCount: assignedCities.length, assignedPopulation, remainingPopulation, warnings,
    };
  });
  const cityMatches = cities.map((city) => {
    const point = cityMapPoint(city);
    const candidates = findCityLocationCandidates({ ...city, point }, matchableLocations).map((candidate) => {
      const budget = locationBudgets.find((location) => location.id === candidate.locationId)!;
      const assignedElsewhere = city.location_id !== candidate.locationId;
      const populationAfterLink = budget.assignedPopulation !== null && validPopulation(city.population)
        ? budget.assignedPopulation + (assignedElsewhere ? city.population : 0) : null;
      const warnings = [...budget.warnings];
      if (populationAfterLink === null) warnings.push('unknown-or-invalid-city-population');
      if (populationAfterLink !== null && validPopulation(budget.population) && populationAfterLink > budget.population) {
        warnings.push('link-would-exceed-population');
      }
      return { ...candidate, locationPopulation: budget.population, populationAfterLink, warnings };
    });
    const warnings: string[] = [];
    if (!point) warnings.push('invalid-city-coordinates');
    if (!validPopulation(city.population) || city.population === 0) warnings.push('unknown-or-invalid-city-population');
    const currentLocation = locations.find((location) => location.id === city.location_id);
    if (city.location_id !== null && !currentLocation) warnings.push('missing-linked-location');
    if (currentLocation && currentLocation.region_id !== city.region_id) warnings.push('cross-region-link');
    if (!regions.some((region) => region.id === city.region_id)) warnings.push('missing-region');
    const status = !locations.some((location) => location.region_id === city.region_id) ? 'uncovered'
      : candidates.length === 0 ? 'unmatched' : candidates.length > 1 ? 'ambiguous' : 'candidate';
    return { id: city.id, name: city.name, regionId: city.region_id, population: city.population,
      locationId: city.location_id, status, warnings, candidates };
  });
  return {
    reportVersion: 1,
    ...schema,
    summary: {
      regions: regions.length, locations: locations.length, cities: cities.length,
      linkedCities: cities.filter((city) => city.location_id !== null).length,
      uncoveredCities: cityMatches.filter((city) => city.status === 'uncovered').length,
      ambiguousCities: cityMatches.filter((city) => city.status === 'ambiguous').length,
      unmatchedCities: cityMatches.filter((city) => city.status === 'unmatched').length,
    },
    regions: regions.map((region) => {
      const regionalLocations = locations.filter((location) => location.region_id === region.id);
      const regionalCities = cities.filter((city) => city.region_id === region.id);
      return { id: region.id, name: region.name, population: region.population,
        locationCount: regionalLocations.length, locationPopulation: populationTotal(regionalLocations),
        cityCount: regionalCities.length, cityPopulation: populationTotal(regionalCities),
        coverage: regionalLocations.length > 0 ? 'has-locations' : 'uncovered' };
    }),
    locations: locationBudgets,
    cities: cityMatches,
  };
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const database = await openDatabase(options.databasePath,
    options.applySchema ? sqlite3.OPEN_READWRITE : sqlite3.OPEN_READONLY);
  try {
    if (options.applySchema) await applySchema(database);
    const audit = await runInTransaction(database, () => createAudit(database));
    process.stdout.write(`${JSON.stringify({ databasePath: options.databasePath, schemaApplyRequested: options.applySchema, ...audit }, null, 2)}\n`);
  } finally {
    await closeDatabase(database);
  }
}

if (require.main === module) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.stderr.write('Usage: npx ts-node src/bin/transition-city-locations.ts --database <path> [--apply-schema]\n');
    process.exitCode = 1;
  });
}
