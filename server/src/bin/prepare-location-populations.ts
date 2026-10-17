import { createHash } from 'crypto';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { parseArgs } from 'util';
import sqlite3 from 'sqlite3';
import { closeDatabase, openDatabase, queryAll } from '../infrastructure/database/sqlite';

export interface LocationEstimate {
  name: string;
  group: string;
  estimateMillions: number;
  minimumPopulation: number;
  fixedPopulation?: number;
}

interface PopulationRow {
  id: number;
  name: string;
  population: number | null;
}

function positivePopulation(value: number | null, label: string): number {
  if (value === null || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive safe integer`);
  }
  return value;
}

// Supports quoted fields/escaped quotes, but deliberately rejects multiline spreadsheet cells.
function csvFields(line: string): string[] {
  const fields: string[] = [];
  let field = '', quoted = false, closed = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (quoted) {
      if (character !== '"') field += character;
      else if (line[index + 1] === '"') { field += '"'; index += 1; }
      else { quoted = false; closed = true; }
    } else if (character === ',') {
      fields.push(field.trim()); field = ''; closed = false;
    } else if (character === '"' && field === '' && !closed) {
      quoted = true;
    } else if (character === '"' || (closed && character.trim() !== '')) {
      throw new Error('Invalid CSV quoting; multiline cells are not supported');
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error('Unclosed CSV quote; multiline cells are not supported');
  return [...fields, field.trim()];
}

export function parseLocationCsv(csv: string): { regionName: string; locations: LocationEstimate[] } {
  const rows = csv.replace(/^\uFEFF/, '').split(/\r?\n/).map(csvFields)
    .filter((fields) => fields.some((field) => field !== ''));
  const regionName = rows.shift()?.[0];
  if (!regionName || rows.length === 0) throw new Error('CSV needs a region header and location rows');
  const names = new Set<string>();
  let group = '';
  const locations = rows.map((fields): LocationEstimate => {
    const [name, estimate, heading] = fields;
    if (!name || !estimate || !/^\d+(?:\.\d+)?$/.test(estimate)
      || !Number.isFinite(Number(estimate)) || Number(estimate) <= 0 || fields.length > 4) {
      throw new Error(`Invalid location estimate: ${fields.join(',')}`);
    }
    const key = name.normalize('NFKC').toLowerCase();
    if (names.has(key)) throw new Error(`Repeated location name: ${name}`);
    names.add(key);
    if (heading) group = heading;
    return { name, group, estimateMillions: Number(estimate), minimumPopulation: 1 };
  });
  return { regionName, locations };
}

/** Preserves fixed populations and city floors; returns integer populations in input order. */
export function allocateLocationPopulations(
  locations: readonly LocationEstimate[], total: number, variation: number, random: () => number
): number[] {
  positivePopulation(total, 'Regional population');
  if (!locations.length || !Number.isFinite(variation) || variation < 0 || variation >= 1) {
    throw new Error('Locations are required; variation must be between 0 (inclusive) and 1 (exclusive)');
  }
  const populations = locations.map((location) => {
    positivePopulation(location.minimumPopulation, `${location.name} minimum`);
    if (!Number.isFinite(location.estimateMillions) || location.estimateMillions <= 0) {
      throw new Error(`Invalid estimate for ${location.name}`);
    }
    if (location.fixedPopulation === undefined) return 0;
    positivePopulation(location.fixedPopulation, `${location.name} fixed population`);
    if (location.fixedPopulation < location.minimumPopulation) throw new Error(`Fixed population is below the city floor for ${location.name}`);
    return location.fixedPopulation;
  });
  const required = locations.reduce((sum, location) => sum + (location.fixedPopulation ?? location.minimumPopulation), 0);
  if (!Number.isSafeInteger(required) || required > total) throw new Error('Fixed populations and city floors exceed the regional total');
  const weights = locations.map((location) => {
    if (location.fixedPopulation !== undefined) return 0;
    const sample = random();
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1) throw new Error('Random samples must be in [0, 1)');
    const weight = location.estimateMillions * (1 + variation * (2 * sample - 1));
    if (!Number.isFinite(weight) || weight <= 0) throw new Error(`Invalid randomized weight for ${location.name}`);
    return weight;
  });
  let remaining = total - populations.reduce((sum, population) => sum + population, 0);
  let pending = locations.map((_, index) => index).filter((index) => locations[index].fixedPopulation === undefined);
  while (pending.length) {
    const weightTotal = pending.reduce((sum, index) => sum + weights[index], 0);
    if (!Number.isFinite(weightTotal)) throw new Error('Combined estimates are too large');
    const belowFloor = pending.filter((index) => remaining * (weights[index] / weightTotal) < locations[index].minimumPopulation);
    if (belowFloor.length) {
      for (const index of belowFloor) {
        populations[index] = locations[index].minimumPopulation;
        remaining -= populations[index];
      }
      pending = pending.filter((index) => !belowFloor.includes(index));
      continue;
    }
    const shares = pending.map((index) => ({ index, share: remaining * (weights[index] / weightTotal) }));
    for (const { index, share } of shares) populations[index] = Math.floor(share);
    const remainder = remaining - shares.reduce((sum, { index }) => sum + populations[index], 0);
    // Largest remainders avoid handing all rounding leftovers to the last spreadsheet row.
    shares.sort((left, right) => (right.share % 1) - (left.share % 1) || left.index - right.index);
    for (const { index } of shares.slice(0, remainder)) populations[index] += 1;
    remaining = 0;
    break;
  }
  if (remaining !== 0 || populations.reduce((sum, population) => sum + population, 0) !== total) {
    throw new Error('Locations cannot consume the exact regional total with these constraints');
  }
  return populations;
}

function applyCityConstraints(
  locations: LocationEstimate[], cities: readonly PopulationRow[], constraints: unknown
): Map<string, PopulationRow[]> {
  if (!Array.isArray(constraints)) throw new Error('City constraints must be a JSON array');
  const assignments = new Map<string, PopulationRow[]>();
  const assignedCities = new Set<number>();
  for (const value of constraints as unknown[]) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid city constraint');
    const constraint = value as Record<string, unknown>;
    if (typeof constraint.location !== 'string' || !Array.isArray(constraint.cityIds) || !constraint.cityIds.length
      || (constraint.fixed !== undefined && typeof constraint.fixed !== 'boolean')
      || Object.keys(constraint).some((key) => !['location', 'cityIds', 'fixed'].includes(key))) {
      throw new Error('Each constraint needs location, nonempty cityIds, and optional boolean fixed');
    }
    const location = locations.find((entry) => entry.name === constraint.location);
    if (!location || assignments.has(location.name)) throw new Error(`Unknown or repeated constrained location: ${constraint.location}`);
    const matchedCities = (constraint.cityIds as unknown[]).map((id): PopulationRow => {
      if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0 || assignedCities.has(id)) {
        throw new Error(`Invalid or repeated city id: ${String(id)}`);
      }
      const city = cities.find((entry) => entry.id === id);
      if (!city) throw new Error(`City ${id} is not in the CSV region`);
      positivePopulation(city.population, `City ${city.name}`);
      assignedCities.add(id);
      return city;
    });
    location.minimumPopulation = positivePopulation(matchedCities.reduce((sum, city) => sum + city.population!, 0), `${location.name} city total`);
    if (constraint.fixed) location.fixedPopulation = location.minimumPopulation;
    assignments.set(location.name, matchedCities);
  }
  return assignments;
}

function seededRandom(seed: string): () => number {
  let state = createHash('sha256').update(seed).digest().readUInt32LE(0);
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const usage = 'Usage: npx ts-node src/bin/prepare-location-populations.ts --database <path> --csv <path> --seed <text> [--constraints <json-path>] [--variation 0.05]';

async function main(): Promise<void> {
  const { values } = parseArgs({ options: {
    database: { type: 'string' }, csv: { type: 'string' }, seed: { type: 'string' },
    constraints: { type: 'string' }, variation: { type: 'string', default: '0.05' }, help: { type: 'boolean' },
  } });
  if (values.help) { process.stdout.write(`${usage}\n`); return; }
  if (!values.database || !values.csv || !values.seed) throw new Error('--database, --csv, and --seed are required');
  if (!values.variation?.trim()) throw new Error('--variation needs a number');
  const { regionName, locations } = parseLocationCsv(await readFile(resolve(values.csv), 'utf8'));
  const constraints: unknown = values.constraints ? JSON.parse(await readFile(resolve(values.constraints), 'utf8')) : [];
  const database = await openDatabase(resolve(values.database), sqlite3.OPEN_READONLY);
  try {
    const regions = await queryAll<PopulationRow>(database, 'SELECT id, name, population FROM region WHERE name = ?', [regionName]);
    if (regions.length !== 1) throw new Error(`CSV region must match exactly one saved region: ${regionName}`);
    const region = regions[0];
    const total = positivePopulation(region.population, `${region.name} population`);
    const cities = await queryAll<PopulationRow>(database, 'SELECT id, name, population FROM city WHERE region_id = ? ORDER BY id', [region.id]);
    const assignments = applyCityConstraints(locations, cities, constraints);
    const populations = allocateLocationPopulations(locations, total, Number(values.variation), seededRandom(values.seed));
    const rows: (string | number)[][] = [['location', 'group', 'estimate_millions', 'population', 'change_percent', 'mode', 'minimum_population', 'cities']];
    locations.forEach((location, index) => rows.push([
      location.name, location.group, location.estimateMillions, populations[index],
      ((populations[index] / (location.estimateMillions * 1_000_000) - 1) * 100).toFixed(2),
      location.fixedPopulation === undefined ? 'estimated' : 'fixed', location.minimumPopulation,
      (assignments.get(location.name) ?? []).map((city) => `${city.id}: ${city.name}`).join('; '),
    ]));
    const assignedIds = new Set([...assignments.values()].flat().map((city) => city.id));
    const unresolved = cities.filter((city) => !assignedIds.has(city.id));
    process.stderr.write(`${region.name}: ${locations.length} locations, exactly ${total} people; seed=${values.seed}, variation=${values.variation}\n`);
    process.stderr.write(`${locations.filter((location) => location.fixedPopulation !== undefined).length} fixed locations. Group headings are review labels only, not parent locations.\n`);
    if (unresolved.length) process.stderr.write(`Unresolved city assignments (${unresolved.length}); review boundaries before importing: ${unresolved.map((city) => `${city.id}: ${city.name}`).join('; ')}\n`);
    process.stdout.write(rows.map((row) => row.map(csvCell).join(',')).join('\n') + '\n');
  } finally {
    await closeDatabase(database);
  }
}

if (require.main === module) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n${usage}\n`);
    process.exitCode = 1;
  });
}
