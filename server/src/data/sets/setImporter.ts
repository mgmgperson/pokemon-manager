import * as fs from 'fs';
import * as path from 'path';
import { allPokemon, PokemonEntity, initPokemon } from '../pokemon';
import { Pokemon } from '../enums/pokemon';
import { Abilities } from '../enums/abilities';

/**
 * Smogon tier URLs to fetch usage data from (in order of priority)
 */
const SMOGON_URLS = [
  'https://www.smogon.com/stats/2025-10/chaos/gen9lc-1500.json',
  'https://www.smogon.com/stats/2025-10/chaos/gen9zu-1500.json',
  'https://www.smogon.com/stats/2025-10/chaos/gen9pu-1500.json',
  'https://www.smogon.com/stats/2025-10/chaos/gen9nu-1500.json',
  'https://www.smogon.com/stats/2025-10/chaos/gen9ru-1500.json',
  'https://www.smogon.com/stats/2025-10/chaos/gen9uu-1500.json',
  'https://www.smogon.com/stats/2025-10/chaos/gen9ou-1500.json',
  'https://www.smogon.com/stats/2025-10/chaos/gen9ubers-1500.json',
  'https://www.smogon.com/stats/2025-10/chaos/gen9ag-1500.json',
  'https://www.smogon.com/stats/2025-10/chaos/gen9nationaldexru-1500.json',
  'https://www.smogon.com/stats/2025-10/chaos/gen9nationaldexuu-1500.json',
  'https://www.smogon.com/stats/2025-10/chaos/gen9nationaldex-1500.json',
  'https://www.smogon.com/stats/2025-10/chaos/gen9nationaldexubers-1500.json',
];

interface SmogonData {
  info: {
    metagame: string;
    cutoff: number;
  };
  data: {
    [pokemonName: string]: {
      'Raw count': number;
      Abilities: { [ability: string]: number };
      Spreads: { [spread: string]: number };
    };
  };
}

interface PokemonSet {
  pokemonId: Pokemon;
  abilities: { [abilityId: number]: number }; // ability enum -> weight
  spreads: { spread: string; weight: number }[]; // top 20 spreads normalized
}

/**
 * Normalize a name for matching (remove non-alphanumeric, lowercase)
 */
function normalizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

/**
 * Try to match a Smogon Pokemon name to our Pokemon enum
 * Returns the matching PokemonEntity or null
 */
function matchPokemonName(smogonName: string): PokemonEntity | null {
  const normalizedSmogon = normalizeName(smogonName);

    // Try exact match first
  for (const pokemon of allPokemon) {
    const normalizedOurs = normalizeName(pokemon.name);
    if (normalizedOurs === normalizedSmogon) {
      return pokemon;
    }
  }
  
  // Try prefix/suffix matching
  for (const pokemon of allPokemon) {
    const normalizedOurs = normalizeName(pokemon.name);
    
    // Check if one starts with the other
    if (normalizedSmogon.startsWith(normalizedOurs) || normalizedOurs.startsWith(normalizedSmogon)) {
      return pokemon;
    }
    
    // Check if one ends with the other
    if (normalizedSmogon.endsWith(normalizedOurs) || normalizedOurs.endsWith(normalizedSmogon)) {
      return pokemon;
    }
  }
  
  // Try partial matching (at least 80% of characters match in order)
  for (const pokemon of allPokemon) {
    const normalizedOurs = normalizeName(pokemon.name);
    
    // Calculate similarity - how many characters match in order
    let matches = 0;
    let ourIdx = 0;
    for (let i = 0; i < normalizedSmogon.length && ourIdx < normalizedOurs.length; i++) {
      if (normalizedSmogon[i] === normalizedOurs[ourIdx]) {
        matches++;
        ourIdx++;
      }
    }
    
    const similarity = matches / Math.max(normalizedSmogon.length, normalizedOurs.length);
    if (similarity >= 0.8) {
      return pokemon;
    }
  }
  
  return null;
}

/**
 * Match a Smogon ability name to our Abilities enum
 */
function matchAbilityName(smogonAbility: string, pokemonEntity: PokemonEntity): number | null {
  const normalizedSmogon = normalizeName(smogonAbility);
  
  // Check each of the Pokemon's abilities
  for (const abilityId of pokemonEntity.abilities) {
    const abilityName = Abilities[abilityId];
    if (!abilityName) continue;
    
    const normalizedAbility = normalizeName(abilityName);
    
    if (normalizedAbility === normalizedSmogon) {
      return abilityId;
    }
  }
  
  return null;
}

/**
 * Fetch JSON data from a URL
 */
async function fetchJSON(url: string): Promise<SmogonData | null> {
  try {
    console.log(`Fetching: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return data as SmogonData;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

/**
 * Process a single tier's data
 */
function processTierData(
  data: SmogonData,
  existingSets: Map<Pokemon, PokemonSet>
): void {
  const tierName = data.info.metagame;
  console.log(`Processing tier: ${tierName}`);
  
  let added = 0;
  let skipped = 0;
  
  for (const [smogonName, pokemonData] of Object.entries(data.data)) {
    // Try to match the Pokemon
    const matchedPokemon = matchPokemonName(smogonName);
    
    if (!matchedPokemon) {
      console.warn(`Could not match Pokemon: ${smogonName}`);
      continue;
    }
    
    // Skip if we already have a set for this Pokemon
    if (existingSets.has(matchedPokemon.id)) {
      //console.log(`Skipping ${smogonName} (${Pokemon[matchedPokemon.id]}), set already exists`);
      skipped++;
      continue;
    }
    
    // Process abilities
    const abilityWeights: { [abilityId: number]: number } = {};
    let totalAbilityWeight = 0;
    
    for (const [abilityName, weight] of Object.entries(pokemonData.Abilities)) {
      const abilityId = matchAbilityName(abilityName, matchedPokemon);
      if (abilityId !== null) {
        abilityWeights[abilityId] = weight;
        totalAbilityWeight += weight;
      }
    }
    
    // Normalize abilities to percentages (0-100)
    if (totalAbilityWeight > 0) {
      for (const abilityId in abilityWeights) {
        abilityWeights[abilityId] = (abilityWeights[abilityId] / totalAbilityWeight) * 100;
      }
    }
    
    // Process spreads - take top 20 and normalize
    const spreadEntries = Object.entries(pokemonData.Spreads)
      .sort(([, a], [, b]) => b - a) // Sort by weight descending
      .slice(0, 20); // Take top 20
    
    const totalSpreadWeight = spreadEntries.reduce((sum, [, weight]) => sum + weight, 0);
    
    const spreads = spreadEntries.map(([spread, weight]) => ({
      spread,
      weight: totalSpreadWeight > 0 ? (weight / totalSpreadWeight) * 100 : 0,
    }));
    
    // Create the set
    const pokemonSet: PokemonSet = {
      pokemonId: matchedPokemon.id,
      abilities: abilityWeights,
      spreads,
    };
    
    existingSets.set(matchedPokemon.id, pokemonSet);
    added++;
  }
  
  console.log(`  Added: ${added}, Skipped: ${skipped}`);
}

/**
 * Generate the sets.ts file content
 */
function generateSetsFile(sets: Map<Pokemon, PokemonSet>): string {
  const lines: string[] = [];
  
  lines.push(`import { Pokemon } from '../enums/pokemon';`);
  lines.push(`import { Abilities } from '../enums/abilities';`);
  lines.push(``);
  lines.push(`/**`);
  lines.push(` * Pokemon competitive set data imported from Smogon usage statistics`);
  lines.push(` * Each Pokemon has weighted abilities and EV spreads based on usage`);
  lines.push(` */`);
  lines.push(``);
  lines.push(`export interface PokemonSpread {`);
  lines.push(`  spread: string; // Format: "Nature:HP/Atk/Def/SpA/SpD/Spe"`);
  lines.push(`  weight: number; // Percentage (0-100)`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`export interface PokemonSetData {`);
  lines.push(`  pokemonId: Pokemon;`);
  lines.push(`  abilities: { [abilityId: number]: number }; // Ability ID -> percentage`);
  lines.push(`  spreads: PokemonSpread[]; // Top 20 spreads, normalized to 100%`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`export const POKEMON_SETS: { [pokemonId: number]: PokemonSetData } = {`);
  
  // Sort by Pokemon ID for consistent output
  const sortedSets = Array.from(sets.entries()).sort(([a], [b]) => a - b);
  
  for (const [pokemonId, setData] of sortedSets) {
    lines.push(`  [Pokemon.${Pokemon[pokemonId]}]: {`);
    lines.push(`    pokemonId: Pokemon.${Pokemon[pokemonId]},`);
    lines.push(`    abilities: {`);
    
    for (const [abilityId, weight] of Object.entries(setData.abilities)) {
      const abilityName = Abilities[parseInt(abilityId)];
      lines.push(`      [Abilities.${abilityName}]: ${weight.toFixed(2)},`);
    }
    
    lines.push(`    },`);
    lines.push(`    spreads: [`);
    
    for (const { spread, weight } of setData.spreads) {
      lines.push(`      { spread: "${spread}", weight: ${weight.toFixed(2)} },`);
    }
    
    lines.push(`    ],`);
    lines.push(`  },`);
  }
  
  lines.push(`};`);
  lines.push(``);
  lines.push(`/**`);
  lines.push(` * Get set data for a specific Pokemon`);
  lines.push(` */`);
  lines.push(`export function getPokemonSet(pokemonId: Pokemon): PokemonSetData | null {`);
  lines.push(`  return POKEMON_SETS[pokemonId] || null;`);
  lines.push(`}`);
  lines.push(``);
  
  return lines.join('\n');
}

/**
 * Main function to import all Smogon sets and generate sets.ts
 */
export async function importSmogonSets(): Promise<void> {
  console.log('Starting Smogon set import...');
  console.log(`Total Pokemon in database: ${allPokemon.length}`);
  
  const existingSets = new Map<Pokemon, PokemonSet>();
  
  // Process each tier in order
  for (const url of SMOGON_URLS) {
    const data = await fetchJSON(url);
    if (data) {
      processTierData(data, existingSets);
    }
  }
  
  console.log(`\nTotal sets imported: ${existingSets.size}`);
  
  // Find Pokemon without sets
  const pokemonWithoutSets: string[] = [];
  for (const pokemon of allPokemon) {
    if (!existingSets.has(pokemon.id)) {
      pokemonWithoutSets.push(`${Pokemon[pokemon.id]} (${pokemon.name})`);
    }
  }
  
  console.log(`\nPokemon without sets: ${pokemonWithoutSets.length}`);
  if (pokemonWithoutSets.length > 0) {
    console.log('Pokemon missing sets:');
    for (const name of pokemonWithoutSets) {
      console.log(`  - ${name}`);
    }
    // for (const name of pokemonWithoutSets.slice(0, 50)) { // Show first 50
    //   console.log(`  - ${name}`);
    // }
    // if (pokemonWithoutSets.length > 50) {
    //   console.log(`  ... and ${pokemonWithoutSets.length - 50} more`);
    // }
  }
  
  // Generate the sets.ts file
  console.log('\nGenerating sets.ts file...');
  const fileContent = generateSetsFile(existingSets);
  
  const outputPath = path.join(__dirname, 'sets.ts');
  fs.writeFileSync(outputPath, fileContent, 'utf-8');
  
  console.log(`✓ sets.ts generated at: ${outputPath}`);
  console.log(`✓ Import complete! ${existingSets.size} Pokemon have set data.`);
}

// Run if executed directly
if (require.main === module) {
  initPokemon();
  importSmogonSets()
    .then(() => {
      console.log('\nSet import completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error during set import:', error);
      process.exit(1);
    });
}
