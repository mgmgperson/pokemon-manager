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
async function getCountryFrequencies(regionId: number, type: 'F' | 'S'): Promise<CountryFrequency[]> {
  const mainDb = getActiveDB();
  return new Promise((resolve, reject) => {
    mainDb.all<CountryFrequency>(
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
export async function generateName(regionId: number, gender: 'M' | 'F'): Promise<NameResult> {
  try {
    // Get country frequencies for forenames
    const forenameFrequencies = await getCountryFrequencies(regionId, 'F');
    const countries = forenameFrequencies.map(f => f.country);
    const weights = forenameFrequencies.map(f => f.frequency);
    
    // Select random country for forename
    const forenameCountry = weightedRandom(countries, weights);
    
    // Get forenames for selected country and gender
    const forenames = await getNames(forenameCountry, gender, 'forenames');
    const forenameWeights = forenames.map(f => f.count);
    const forename = weightedRandom(forenames.map(f => f.name), forenameWeights);
    
    // Get country frequencies for surnames
    const surnameFrequencies = await getCountryFrequencies(regionId, 'S');
    const surnameCountries = surnameFrequencies.map(f => f.country);
    const surnameWeights = surnameFrequencies.map(f => f.frequency);
    
    // Select random country for surname
    const surnameCountry = weightedRandom(surnameCountries, surnameWeights);
    
    // Get surnames for selected country and gender
    const surnames = await getNames(surnameCountry, gender, 'surnames');
    const surnameWeights2 = surnames.map(s => s.count);
    const surname = weightedRandom(surnames.map(s => s.name), surnameWeights2);
    
    return {
      fname: forename,
      lname: surname
    };
  } catch (error) {
    console.error('Error generating name:', error);
    throw error;
  }
} 