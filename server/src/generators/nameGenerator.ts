import sqlite3 from 'sqlite3';
const { Database } = sqlite3.verbose();
import { getActiveDB } from '../services/dbManager';

// Connect to both databases
const namesDb = new Database('../database/names.sqlite');

interface NameResult {
  fname: string;
  lname: string;
}

interface CountryFrequency {
  country: string;
  frequency: number;
}

interface NameCount {
  name: string;
  count: number;
}

interface WeightCache {
  nameFrequenciesByRegion?: Map<string, any[]>;
}

interface NameListCacheEntry {
  names: string[];
  weights: number[];
}

// Cache for name lists keyed by `${type}_${country}_${gender}`
const nameListCache: Map<string, NameListCacheEntry> = new Map();

/**
 * Return cached name arrays for a given country/gender/type, building on first use.
 */
async function getNamesCached(country: string, gender: 'M' | 'F', type: 'forenames' | 'surnames') {
  const key = `${type}_${country}_${gender}`;
  const cached = nameListCache.get(key);
  if (cached) return cached;

  const rows = await getNames(country, gender, type);
  const names = rows.map(r => r.name);
  const weights = rows.map(r => r.count);
  const entry: NameListCacheEntry = { names, weights };
  nameListCache.set(key, entry);
  return entry;
}

/**
 * Select a random item based on weights
 */
function weightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }
  
  return items[items.length - 1];
}

/**
 * Get country frequencies for a region and name type
 */
async function getCountryFrequencies(db: sqlite3.Database, regionId: number, type: 'F' | 'S', cache?: WeightCache): Promise<CountryFrequency[]> {
  // Use cache if available
  if (cache?.nameFrequenciesByRegion) {
    const key = `${regionId}_${type}`;
    const cached = cache.nameFrequenciesByRegion.get(key);
    if (cached) {
      // console.log(`getCountryFrequencies: cache HIT for key=${key} (rows=${(cached && cached.length) || 0})`);
      return cached as CountryFrequency[];
    }
  }

  // console.log(`getCountryFrequencies: cache MISS for region=${regionId}, type=${type} - querying DB`);

  // Fallback to DB query
  return new Promise((resolve, reject) => {
    db.all<CountryFrequency>(
      `SELECT country, frequency FROM region_name_frequency 
       WHERE region_id = ? AND type = ?`,
      [regionId, type],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

/**
 * Get names for a country and gender
 */
async function getNames(country: string, gender: 'M' | 'F', type: 'forenames' | 'surnames'): Promise<NameCount[]> {
  return new Promise((resolve, reject) => {
    namesDb.all<NameCount>(
      `SELECT ${type.slice(0, -1)} as name, count 
       FROM ${type} 
       WHERE country = ? AND gender = ?`,
      [country, gender],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

/**
 * Generate a random name based on region and gender
 */
export async function generateName(db: sqlite3.Database, regionId: number, gender: 'M' | 'F', cache?: WeightCache): Promise<NameResult> {
  try {
    // Get country frequencies for forenames
    const forenameFrequencies = await getCountryFrequencies(db, regionId, 'F', cache);
    const countries = forenameFrequencies.map(f => f.country);
    const weights = forenameFrequencies.map(f => f.frequency);
    
    // Select random country for forename
    const forenameCountry = weightedRandom(countries, weights);
    
    // Get forenames for selected country and gender (cached arrays)
    const { names: forenameNames, weights: forenameWeights } = await getNamesCached(forenameCountry, gender, 'forenames');
    const forename = weightedRandom(forenameNames, forenameWeights);
    
    // Get country frequencies for surnames
    const surnameFrequencies = await getCountryFrequencies(db, regionId, 'S', cache);
    const surnameCountries = surnameFrequencies.map(f => f.country);
    const surnameWeights = surnameFrequencies.map(f => f.frequency);
    
    // Select random country for surname
    const surnameCountry = weightedRandom(surnameCountries, surnameWeights);
    
    // Get surnames for selected country and gender (cached arrays)
    const { names: surnameNames, weights: surnameNameWeights } = await getNamesCached(surnameCountry, gender, 'surnames');
    const surname = weightedRandom(surnameNames, surnameNameWeights);
    
    return {
      fname: forename,
      lname: surname
    };
  } catch (error) {
    console.error('Error generating name:', error);
    throw error;
  }
} 