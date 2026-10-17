import { createHash } from 'crypto';
import sqlite3 from 'sqlite3';
import { runInTransaction } from '../../../infrastructure/database/sqlite';
import { cityMapPoint, findCityLocationCandidates, type LocationCandidate } from './city-location-matching';
import { findCityLinkState, linkUnassignedCity } from './city-location.repository';
import { CityLocationError, requirePositiveInteger } from './city-location.service';

export interface BulkCityLink {
  cityId: number;
  cityName: string;
  regionId: number;
  population: number;
  locationId: number;
  locationName: string;
  signals: LocationCandidate['signals'];
  remainingAfterBatch: number;
}

export interface SkippedCityLink {
  cityId: number;
  cityName: string;
  regionId: number;
  reason: string;
}

export interface BulkCityLinkPreview {
  snapshot: string;
  links: BulkCityLink[];
  skipped: SkippedCityLink[];
}

async function buildBulkPreview(database: sqlite3.Database): Promise<BulkCityLinkPreview> {
  const state = await findCityLinkState(database);
  const budgets = new Map(state.locations.map((location) => [location.id, location]));
  const proposed: BulkCityLink[] = [];
  const skipped: SkippedCityLink[] = [];
  const totals = new Map<number, number>();
  for (const city of state.cities) {
    const skip = (reason: string): void => { skipped.push({ cityId: city.id, cityName: city.name, regionId: city.region_id, reason }); };
    if (city.location_id !== null) { skip('Already linked; existing assignment is preserved.'); continue; }
    if (!state.locations.some((location) => location.region_id === city.region_id)) {
      skip('No authored locations in this region.'); continue;
    }
    const point = cityMapPoint(city);
    if (!point) { skip('Missing or invalid city coordinates; review manually.'); continue; }
    const candidates = findCityLocationCandidates({ ...city, point }, state.locations);
    if (candidates.length !== 1) {
      skip(candidates.length > 1 ? 'Multiple suggested locations; review manually.' : 'No reliable suggested location.'); continue;
    }
    const candidate = candidates[0];
    if (!candidate.signals.some((signal) => signal === 'exact-name' || signal === 'inside-polygon')) {
      skip('Nearest-polygon fallback only; review manually.'); continue;
    }
    const budget = budgets.get(candidate.locationId)!;
    if (city.population === null || !Number.isSafeInteger(city.population) || city.population <= 0) {
      skip('Missing or invalid city population.'); continue;
    }
    if (budget.remainingPopulation === null || budget.cities.some((assigned) => assigned.region_id !== budget.region_id)) {
      skip('Invalid assigned-city regions or unknown location/assigned populations.'); continue;
    }
    if (city.population > budget.remainingPopulation) {
      skip(`City exceeds the location's remaining population budget by ${city.population - budget.remainingPopulation} people.`); continue;
    }
    proposed.push({ cityId: city.id, cityName: city.name, regionId: city.region_id, population: city.population,
      locationId: budget.id, locationName: budget.name, signals: candidate.signals, remainingAfterBatch: 0 });
    totals.set(budget.id, (totals.get(budget.id) ?? 0) + city.population);
  }
  const links: BulkCityLink[] = [];
  for (const link of proposed) {
    const total = totals.get(link.locationId)!;
    const remaining = budgets.get(link.locationId)!.remainingPopulation!;
    // Exclude the entire conflicting group, not an arbitrary first-come subset.
    if (!Number.isSafeInteger(total) || total > remaining) {
      skipped.push({ cityId: link.cityId, cityName: link.cityName, regionId: link.regionId,
        reason: 'Combined suggested cities exceed this location’s remaining population budget.' });
    } else {
      links.push({ ...link, remainingAfterBatch: remaining - total });
    }
  }
  return { snapshot: createHash('sha256').update(JSON.stringify(state)).digest('hex'), links,
    skipped: skipped.sort((left, right) => left.cityId - right.cityId) };
}

export function previewBulkCityLinks(database: sqlite3.Database): Promise<BulkCityLinkPreview> {
  return runInTransaction(database, () => buildBulkPreview(database));
}

export function applyBulkCityLinks(database: sqlite3.Database, body: unknown): Promise<{ linkedCount: number }> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new CityLocationError(400, 'Request body must be an object');
  const input = body as Record<string, unknown>;
  if (typeof input.snapshot !== 'string' || !/^[a-f0-9]{64}$/.test(input.snapshot)) {
    throw new CityLocationError(400, 'A valid preview snapshot is required');
  }
  if (!Array.isArray(input.links) || input.links.length === 0) throw new CityLocationError(400, 'A non-empty reviewed links array is required');
  const links = input.links.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new CityLocationError(400, 'Each link must be an object');
    const link = entry as Record<string, unknown>;
    return { cityId: requirePositiveInteger(link.cityId, 'cityId'), locationId: requirePositiveInteger(link.locationId, 'locationId') };
  });
  if (new Set(links.map((link) => link.cityId)).size !== links.length) throw new CityLocationError(400, 'Duplicate city links are not allowed');
  return runInTransaction(database, async () => {
    const preview = await buildBulkPreview(database);
    if (input.snapshot !== preview.snapshot) throw new CityLocationError(409, 'Geography changed since review. Generate a new bulk preview.');
    const approved = new Map(preview.links.map((link) => [link.cityId, link.locationId]));
    if (links.length !== approved.size || links.some((link) => approved.get(link.cityId) !== link.locationId)) {
      throw new CityLocationError(409, 'Requested links do not match the reviewed bulk preview');
    }
    for (const link of links) {
      const statement = await linkUnassignedCity(database, link.cityId, link.locationId);
      if (statement.changes !== 1) throw new CityLocationError(409, 'A city assignment changed. Generate a new bulk preview.');
    }
    return { linkedCount: links.length };
  });
}
