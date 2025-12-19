import sqlite3 from 'sqlite3';
import { generateName } from './nameGenerator';
import { RANK_BREAKPOINTS } from '../data/conversions/conversions';
const { Database } = sqlite3.verbose();
import { getActiveDB } from '../services/dbManager';

// Connect to the database

// Define interfaces
interface Trainer {
  id?: number;
  fname: string;
  lname: string;
  region_id: number;
  birthdate: string;
  pwtr_rating: number;
  peak_rating: number;
  peak_rank: number;
  active_status: boolean;
}

interface TrainerHometown {
  trainer_id?: number;
  city_id: number;
  city_name: string;
}

interface RegionData {
  id: number;
  name: string;
  population: number;
}

interface CityData {
  id: number;
  name: string;
  region_id: number;
  population: number;
}

interface GenerateTrainerResult {
  trainer: Trainer;
  hometown: TrainerHometown;
}

interface WeightCache {
  regions?: Array<{ id: number; name: string; population: number }>;
  regionWeights?: number[];
  citiesByRegion?: Map<number, Array<{ id: number; name: string; region_id: number; population: number }>>;
  cityWeightsByRegion?: Map<number, number[]>;
  nameFrequenciesByRegion?: Map<string, any[]>;
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
 * Get all regions from the database
 */
async function getRegions(db: sqlite3.Database): Promise<RegionData[]> {
  return new Promise((resolve, reject) => {
    db.all<RegionData>(
      'SELECT id, name, population FROM region',
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

/**
 * Get cities by region ID
 */
async function getCitiesByRegion(db: sqlite3.Database, regionId: number): Promise<CityData[]> {
  return new Promise((resolve, reject) => {
    db.all<CityData>(
      'SELECT id, name, region_id, population FROM city WHERE region_id = ?',
      [regionId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

/**
 * Generate a random region based on population weights
 */
async function generateRandomRegion(db: sqlite3.Database, regionId?: number, cache?: WeightCache): Promise<RegionData> {
  // Use cache if available
  if (cache?.regions && cache?.regionWeights) {
    // console.log(`generateRandomRegion: using cache (regionId=${regionId ?? 'random'})`);
    if (regionId) {
      const selectedRegion = cache.regions.find(r => r.id === regionId);
      if (selectedRegion) {
        return selectedRegion;
      }
    }
    return weightedRandom(cache.regions, cache.regionWeights);
  }
  // console.log(`generateRandomRegion: cache not available, falling back to DB (regionId=${regionId ?? 'random'})`);

  // Fallback to DB query
  const regions = await getRegions(db);
  
  if (regionId) {
    const selectedRegion = regions.find(r => r.id === regionId);
    if (selectedRegion) {
      return selectedRegion;
    }
  }
  
  const weights = regions.map(r => r.population || 1);
  return weightedRandom(regions, weights);
}

/**
 * Generate a random city in a region based on population weights
 */
async function generateRandomCity(db: sqlite3.Database, regionId: number, cache?: WeightCache): Promise<CityData> {
  // Use cache if available
  if (cache?.citiesByRegion && cache?.cityWeightsByRegion) {
    // console.log(`generateRandomCity: using cache for region ${regionId}`);
    const cities = cache.citiesByRegion.get(regionId);
    const weights = cache.cityWeightsByRegion.get(regionId);
    if (cities && weights) {
      if (cities.length === 0) {
        throw new Error(`No cities found for region ID ${regionId}`);
      }
      return weightedRandom(cities, weights);
    }
  }
  // console.log(`generateRandomCity: cache not available for region ${regionId}, falling back to DB`);

  // Fallback to DB query
  const cities = await getCitiesByRegion(db, regionId);
  
  if (cities.length === 0) {
    throw new Error(`No cities found for region ID ${regionId}`);
  }
  
  const weights = cities.map(c => c.population || 1);
  return weightedRandom(cities, weights);
}

/**
 * Generate a random gender (M or F)
 */
function generateRandomGender(gender?: 'M' | 'F'): 'M' | 'F' {
  if (gender === 'M' || gender === 'F') {
    return gender;
  }
  return Math.random() < 0.5 ? 'M' : 'F';
}

/**
 * Generate a random birthdate based on age or with a skewed distribution
 */
function generateBirthdate(targetAge?: number): string {
  const referenceDate = new Date(2036, 0, 1); // January 1, 2036
  
  if (targetAge !== undefined) {
    // Generate birthdate for the exact age
    const birthYear = referenceDate.getFullYear() - targetAge;
    const birthMonth = Math.floor(Math.random() * 12);
    const birthDay = Math.floor(Math.random() * 28) + 1; // Keep it simple, avoid month-specific day counts
    
    const birthdate = new Date(birthYear, birthMonth, birthDay);
    return birthdate.toISOString().split('T')[0]; // YYYY-MM-DD format
  }
  
  // Generate with skewed distribution, median age of 30
  // Using a log-normal distribution for right skew
  const meanAge = 30;
  const stdDev = 15;
  
  // Generate a value from a normal distribution
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  
  // Transform to log-normal
  const generatedAge = Math.max(18, Math.min(80, Math.round(Math.exp(Math.log(meanAge) + stdDev * z / 100))));
  
  const birthYear = referenceDate.getFullYear() - generatedAge;
  const birthMonth = Math.floor(Math.random() * 12);
  const birthDay = Math.floor(Math.random() * 28) + 1;
  
  const birthdate = new Date(birthYear, birthMonth, birthDay);
  return birthdate.toISOString().split('T')[0];
}

/**
 * Generate a PWTR rating with a skewed distribution
 */
function generatePwtrRating(): number {
  // Generate with skewed distribution, median around 3250
  // Using a log-normal distribution for left skew
  const meanRating = 3250;
  const stdDev = 500;
  
  // Generate a value from a normal distribution
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  
  // Invert for left skew
  z = -z;
  
  // Transform to desired range
  const rating = Math.max(1000, Math.min(4500, meanRating + stdDev * z));
  
  return Math.round(rating * 100) / 100; // Round to 2 decimal places
}

/**
 * Interpolate rating from rank (ported from Python)
 */
function interpolateRatingFromRank(rankVal: number): number {
  if (rankVal <= RANK_BREAKPOINTS[0][0]) {
    return RANK_BREAKPOINTS[0][1];
  }
  
  if (rankVal >= RANK_BREAKPOINTS[RANK_BREAKPOINTS.length - 1][0]) {
    return RANK_BREAKPOINTS[RANK_BREAKPOINTS.length - 1][1];
  }
  
  for (let i = 0; i < RANK_BREAKPOINTS.length - 1; i++) {
    const [r1, rating1] = RANK_BREAKPOINTS[i];
    const [r2, rating2] = RANK_BREAKPOINTS[i + 1];
    
    if (r1 <= rankVal && rankVal <= r2) {
      const ratio = (rankVal - r1) / (r2 - r1);
      const interpolated = rating1 + ratio * (rating2 - rating1);
      return interpolated;
    }
  }
  
  return RANK_BREAKPOINTS[RANK_BREAKPOINTS.length - 1][1]; // Fallback
}

/**
 * Compute age from birthdate
 */
function computeAgeFromBirthdate(birthdateStr: string): number {
  try {
    const birthdate = new Date(birthdateStr);
    const refDate = new Date(2036, 0, 1); // January 1, 2036
    
    let age = refDate.getFullYear() - birthdate.getFullYear();
    
    // Adjust age if the birthday hasn't occurred yet in the reference year
    if (
      refDate.getMonth() < birthdate.getMonth() ||
      (refDate.getMonth() === birthdate.getMonth() && refDate.getDate() < birthdate.getDate())
    ) {
      age--;
    }
    
    return age;
  } catch {
    return -1;
  }
}

/**
 * Generate peak rank based on age and current rating
 */
function generatePeakRank(age: number, currentRating: number): number {
  // Younger people are likely closer to their peak
  // Older people likely had better peak ranks in the past
  let ageFactor = 1.0;
  
  if (age < 25) {
    // Very young trainers might be at or near their peak
    ageFactor = 1.1;
  } else if (age < 35) {
    // Trainers in their prime might have slightly better peak
    ageFactor = 1.5;
  } else if (age < 45) {
    // Trainers past prime might have had significantly better peaks
    ageFactor = 2.0;
  } else {
    // Much older trainers likely had much better peaks
    ageFactor = 3.0;
  }
  
  // Find the current rank based on current rating
  let currentRank = RANK_BREAKPOINTS.length;
  for (let i = 0; i < RANK_BREAKPOINTS.length; i++) {
    if (currentRating >= RANK_BREAKPOINTS[i][1]) {
      currentRank = RANK_BREAKPOINTS[i][0];
      break;
    }
  }
  
  // Calculate peak rank by applying the age factor
  const peakRank = Math.max(1, Math.round(currentRank / ageFactor));
  
  // Add some randomization
  const randomFactor = Math.random() * 0.3 + 0.8; // Between 0.8 and 1.1
  return Math.max(1, Math.round(peakRank * randomFactor));
}

/**
 * Estimate peak rating based on peak rank, current rank, age, and current rating (ported from Python)
 */
function estimatePeakRating(peakRank: number, currentRank: number, age: number, currentRating: number): number {
  const base = interpolateRatingFromRank(peakRank);
  
  let ageFactor = 0;
  if (age >= 30) {
    const yrsOver = age - 30;
    ageFactor = Math.floor(Math.random() * 3 + 1) * yrsOver;
  }
  
  let rankFactor = 0;
  if (peakRank * 2 < currentRank) {
    rankFactor = Math.floor(Math.random() * 51 + 30); // Random between 30-80
  } else if (peakRank < currentRank) {
    rankFactor = Math.floor(Math.random() * 21 + 10); // Random between 10-30
  }
  
  const nearDistance = 5;
  const isNear = Math.abs(peakRank - currentRank) <= nearDistance;
  
  const noiseDecimal = Math.random() * 50 - 25; // Random between -25 and 25
  
  let finalRating: number;
  if (isNear) {
    finalRating = currentRating + (Math.random() * 100 - 50); // Random between -50 and 50
  } else {
    finalRating = base - ageFactor - rankFactor + noiseDecimal;
  }
  
  if (finalRating > 4500) {
    finalRating = 4500;
  }
  
  if (finalRating < currentRating) {
    finalRating = currentRating;
  }
  
  return Math.round(finalRating * 100) / 100; // Round to 2 decimal places
}

/**
 * Generate a random trainer
 */
export async function generateRandomTrainer(
  db: sqlite3.Database,
  regionId?: number,
  gender?: 'M' | 'F',
  age?: number,
  pwtr_rating?: number,
  cache?: WeightCache
): Promise<GenerateTrainerResult> {
  try {
    // 1. Generate region
    const region = await generateRandomRegion(db, regionId, cache);
    
    // 2. Generate gender
    const selectedGender = generateRandomGender(gender);
    
    // 3. Generate name based on region and gender
    const name = await generateName(db, region.id, selectedGender, cache);
    
    // 4. Generate birthdate
    const birthdate = generateBirthdate(age);
    
    // 5. Generate PWTR rating or use provided value
    const pwtrRating = pwtr_rating !== undefined ? pwtr_rating : generatePwtrRating();
    
    // 6. Compute age from birthdate
    const computedAge = computeAgeFromBirthdate(birthdate);
    
    // 7. Find the current rank based on pwtrRating
    let currentRank = RANK_BREAKPOINTS.length;
    for (let i = 0; i < RANK_BREAKPOINTS.length; i++) {
      if (pwtrRating >= RANK_BREAKPOINTS[i][1]) {
        currentRank = RANK_BREAKPOINTS[i][0];
        break;
      }
    }
    
    // 8. Generate peak rank based on age and current rating
    const peakRank = generatePeakRank(computedAge, pwtrRating);
    
    // 9. Estimate peak rating
    const peakRating = estimatePeakRating(peakRank, currentRank, computedAge, pwtrRating);
    
    // 10. Generate random city for hometown
    const city = await generateRandomCity(db, region.id, cache);
    
    // 11. Create trainer object
    const trainer: Trainer = {
      fname: name.fname,
      lname: name.lname,
      region_id: region.id,
      birthdate,
      pwtr_rating: pwtrRating,
      peak_rating: peakRating,
      peak_rank: peakRank,
      active_status: true //Math.random() > 0.2 // 80% chance of being active
    };
    
    // 12. Create hometown object
    const hometown: TrainerHometown = {
      city_id: city.id,
      city_name: city.name
    };
    
    return {
      trainer,
      hometown
    };
  } catch (error) {
    console.error('Error generating random trainer:', error);
    throw error;
  }
}