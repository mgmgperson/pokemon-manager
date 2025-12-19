import { Fields } from '../data/enums/fields';
import { allPokemon } from '../data/pokemon';
import { Species } from '../data/enums/pokemon-species';
import { Pokemon } from '../data/enums/pokemon';
import Decimal from 'decimal.js';
import { viabilityRatings } from '../data/texts/viabilityDecimals';

// Debug mode - set to false for production
const DEBUG = true;

// Debug log function that only logs when DEBUG is true
function debugLog(...args: any[]): void {
  if (DEBUG) {
    console.log(...args);
  }
}

/**
 * Field averages and standard deviations across the database
 * These would typically be calculated from the entire dataset,
 * but for now we'll use placeholder values that will be calculated on init
 */
const fieldAverages: Record<string, number> = {};
const fieldStdDeviations: Record<string, number> = {};

// Initialize field stats with default values
function initializeFieldStats() {
  // Create an array with Field enum values 1-50
  const fieldsArray = Array.from({ length: 50 }, (_, i) => i + 1) as Fields[];

  // Default values
  fieldsArray.forEach((field) => {
    const fieldName = formatFieldName(field);
    fieldAverages[fieldName] = 70;
    fieldStdDeviations[fieldName] = 10;
  });

  // Overwrite with real values
  calculateFieldStats();
}

// Calculate real field stats from viability data
function calculateFieldStats() {
  const fieldRatings: Record<string, number[]> = {};
  const fieldsArray = Array.from({ length: 50 }, (_, i) => i + 1) as Fields[];

  fieldsArray.forEach((field) => {
    const fieldName = formatFieldName(field);
    fieldRatings[fieldName] = [];
  });

  Object.values(viabilityRatings).forEach((pokemonRatings) => {
    Object.entries(pokemonRatings).forEach(([fieldId, rating]) => {
      let fieldValue: number;
      if (isNaN(Number(fieldId))) {
        fieldValue = Fields[fieldId as keyof typeof Fields] as number;
      } else {
        fieldValue = Number(fieldId);
      }

      if (fieldValue >= 1 && fieldValue <= 50) {
        const fieldName = formatFieldName(fieldValue);
        fieldRatings[fieldName].push(rating.toNumber());
      }
    });
  });

  Object.entries(fieldRatings).forEach(([field, ratings]) => {
    if (ratings.length) {
      fieldAverages[field] = calculateAverage(ratings);
      fieldStdDeviations[field] = calculateStandardDeviation(ratings);
    }
  });
}

// Initialise averages / std-devs
initializeFieldStats();

/**
 * Interface representing a Pokémon on a trainer’s roster
 */
interface TrainerPokemon {
  species_id: number;
  pokemon_id: number;
  level: number;
  is_mega?: number;
  is_gigantamax?: number;
}

/**
 * Generate field ratings for a trainer based on their team and overall ratings
 */
export function generateFieldRatings(
  pokemonTeam: TrainerPokemon[],
  trainerRating: {
    overall: number;
    typing: number;
    mixed: number;
    special: number;
  }
): Record<string, number> {
  const pokemonFrequency: Record<number, number> = {};
  const averageTopRatings: Record<string, number> = {};
  const stdDevFactors: Record<string, number> = {};
  const fieldSpecificRatings: Record<string, number> = {};
  const justRatings: Record<string, number[]> = {};
  const trainerFieldRatings: Record<string, number> = {};

  let fieldIndex = 0;
  const fieldsArray = Array.from({ length: 50 }, (_, i) => i + 1) as Fields[];

  for (const field of fieldsArray) {
    const fieldName = formatFieldName(field);

    /**
     * Build an array of ratings for every Pokémon on the trainer’s list
     *   – `rating`  = base-form viability (ALWAYS)
     *   – `megaRating` = mega / G-Max viability if the Pokémon can transform
     */
    const pokemonRatings = pokemonTeam.map((pokemon) => {
      // base form rating (force flags off)
      const baseRating = getPokemonRating(
        { ...pokemon, is_mega: 0, is_gigantamax: 0 },
        field
      );

      // optional mega / g-max rating
      let megaRating = 0;
      if (
        (pokemon.is_mega && pokemon.is_mega === 1) ||
        (pokemon.is_gigantamax && pokemon.is_gigantamax === 1)
      ) {
        megaRating = getPokemonRating(pokemon, field);
      }

      return {
        pokemon_id: pokemon.pokemon_id,
        species_id: pokemon.species_id,
        rating: baseRating,
        megaRating,
        level: pokemon.level || 50,
        is_mega: pokemon.is_mega || 0,
        is_gigantamax: pokemon.is_gigantamax || 0,
      };
    });

    // Pick the best 6 for this field
    const topRatings = getTopRatings(pokemonRatings, fieldName);

    // Frequency map (for “unused Pokémon” debugging later)
    topRatings.forEach((p) => {
      pokemonFrequency[p.species_id] =
        (pokemonFrequency[p.species_id] ?? 0) + 1;
    });

    // Store rating array for maths
    justRatings[fieldName] = topRatings.map((p) => p.rating);

    // Averages / std-devs / category-specific trainer multipliers
    averageTopRatings[fieldName] = calculateAverage(justRatings[fieldName]);
    const deviationFromAverage =
      averageTopRatings[fieldName] - fieldAverages[fieldName];
    stdDevFactors[fieldName] =
      deviationFromAverage / (fieldStdDeviations[fieldName] || 1);
    fieldSpecificRatings[fieldName] = getFieldSpecificRating(
      trainerRating,
      fieldIndex
    );
    fieldIndex++;
  }

  // Highest average across every field (for normalisation)
  const topRating = Math.max(...Object.values(averageTopRatings));

  // Final rating per field
  fieldsArray.forEach((field) => {
    const fieldName = formatFieldName(field);
    trainerFieldRatings[fieldName] = Math.round(
      calculateTrainerFieldRating(
        averageTopRatings[fieldName],
        fieldSpecificRatings[fieldName],
        stdDevFactors[fieldName],
        trainerRating.overall,
        topRating
      )
    );

    if (field === 40) trainerFieldRatings[fieldName] = trainerRating.overall; // Neutral
    if (field === 43)
      trainerFieldRatings[fieldName] =
        (trainerRating.special + trainerFieldRatings[fieldName]) / 2; // Inverse
  });

  // debugLog(
  //   'Unused Pokémon:',
  //   pokemonTeam
  //     .filter((p) => !pokemonFrequency[p.species_id])
  //     .map((p) => Pokemon[p.pokemon_id])
  //     .join(', ')
  // );

  return trainerFieldRatings;
}

/**
 * Rating for a single Pokémon in a single field (level-adjusted)
 */
function getPokemonRating(pokemon: TrainerPokemon, field: Fields): number {
  const pokemonId = pokemon.pokemon_id as Pokemon;
  let highestRating = 0;

  // Base form
  if (viabilityRatings[pokemonId] && viabilityRatings[pokemonId][field]) {
    highestRating = viabilityRatings[pokemonId][field].toNumber();
  }

  // Mega / G-Max comparison
  if (
    (pokemon.is_mega && pokemon.is_mega === 1) ||
    (pokemon.is_gigantamax && pokemon.is_gigantamax === 1)
  ) {
    const baseName = Pokemon[pokemonId];
    if (baseName) {
      let formName = '';
      if (pokemon.is_mega === 1) {
        formName =
          pokemonId === Pokemon.CHARIZARD ? `${baseName}_MEGA_X` : `${baseName}_MEGA`;
      } else {
        formName = `${baseName}_GMAX`;
      }

      if (formName in Pokemon) {
        const formId = Pokemon[formName as keyof typeof Pokemon] as Pokemon;
        if (viabilityRatings[formId] && viabilityRatings[formId][field]) {
          const formRating = viabilityRatings[formId][field].toNumber();
          if (formRating > highestRating) highestRating = formRating;
        }
      }
    }
  }

  const levelAdjustmentFactor = (pokemon.level || 50) / 100;
  return highestRating * levelAdjustmentFactor;
}

/**
 * Select the best 6 Pokémon for a single field
 *
 *  1. Build an initial 6-member squad using **base-form ratings only**.
 *  2. From every mega / G-Max the trainer can use, pick the single highest-rated one.
 *  3. If that form improves the team (either beats its own base form or the weakest
 *     current member), swap it in.  Resulting squad will contain **at most one** mega.
 */
function getTopRatings(
  pokemonRatings: Array<{
    pokemon_id: number;
    species_id: number;
    rating: number; // base form
    megaRating: number; // 0 if not applicable
    level: number;
    is_mega?: number;
    is_gigantamax?: number;
  }>,
  fieldName: string
): Array<{
  pokemon_id: number;
  species_id: number;
  rating: number;
  level: number;
  is_mega?: number;
  is_gigantamax?: number;
}> {
  // --- 1. Initial squad (base forms only) -----------------------------------
  const baseCandidates = pokemonRatings.map((p) => ({
    pokemon_id: p.pokemon_id,
    species_id: p.species_id,
    rating: p.rating,
    level: p.level,
    is_mega: 0,
    is_gigantamax: 0,
  }));

  // Sort by rating desc
  const sortedBase = [...baseCandidates].sort((a, b) => b.rating - a.rating);

  const initialTeam: typeof baseCandidates = [];
  const takenSpecies = new Set<number>();

  for (const poke of sortedBase) {
    if (takenSpecies.has(poke.species_id)) continue;
    initialTeam.push(poke);
    takenSpecies.add(poke.species_id);
    if (initialTeam.length === 6) break;
  }

  // --- 2. Find the single best mega / G-Max the trainer can use -------------
  const megaCandidates = pokemonRatings
    .filter((p) => p.megaRating > 0)
    .map((p) => ({
      pokemon_id: p.pokemon_id,
      species_id: p.species_id,
      rating: p.megaRating,
      level: p.level,
      is_mega: p.is_mega ?? 0,
      is_gigantamax: p.is_gigantamax ?? 0,
    }));

  if (!megaCandidates.length) return initialTeam; // no megas available

  megaCandidates.sort((a, b) => b.rating - a.rating);
  const bestMega = megaCandidates[0];

  // --- 3. Swap logic --------------------------------------------------------
  const baseIndex = initialTeam.findIndex(
    (p) => p.species_id === bestMega.species_id
  );

  if (baseIndex >= 0) {
    // Replace its own base form if stronger
    if (bestMega.rating > initialTeam[baseIndex].rating) {
      initialTeam[baseIndex] = bestMega;
    }
  } else {
    // Replace weakest member if stronger
    let weakestIndex = 0;
    for (let i = 1; i < initialTeam.length; i++) {
      if (initialTeam[i].rating < initialTeam[weakestIndex].rating) {
        weakestIndex = i;
      }
    }
    if (bestMega.rating > initialTeam[weakestIndex].rating) {
      initialTeam[weakestIndex] = bestMega;
    }
  }

  return initialTeam;
}

/**
 * Translate a field enum / string to the DB column name
 */
function formatFieldName(fieldName: Fields | string): string {
  const fieldStr = typeof fieldName === 'number' ? Fields[fieldName] : fieldName;
  return `${fieldStr.toString().toLowerCase().replace(/_/g, '')}_field_rating`;
}

/** Mean helper */
function calculateAverage(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

/** Standard deviation helper */
function calculateStandardDeviation(nums: number[]): number {
  if (!nums.length) return 0;
  const mean = calculateAverage(nums);
  const squareDiffs = nums.map((n) => (n - mean) ** 2);
  return Math.sqrt(calculateAverage(squareDiffs));
}

/** Determine which of the trainer’s global ratings applies to a field-group */
function getFieldSpecificRating(
  trainerRating: {
    overall: number;
    typing: number;
    mixed: number;
    special: number;
  },
  fieldValue: number
): number {
  if (fieldValue >= 0 && fieldValue <= 19) return trainerRating.typing;
  if (fieldValue >= 20 && fieldValue <= 36) return trainerRating.mixed;
  if (fieldValue >= 37 && fieldValue <= 49) return trainerRating.special;
  return 0;
}

/** Combine all components into a single 0-99 score */
function calculateTrainerFieldRating(
  averageTopRating: number,
  fieldSpecificRating: number,
  stdDevFactor: number,
  overallRating: number,
  maxAverageRating: number
): number {
  const normalizedAverageTopRating = (averageTopRating / (maxAverageRating || 1)) * 99;
  const amplifiedStdDevFactor = stdDevFactor * 50;

  const fieldRating =
    normalizedAverageTopRating * 0.3 +
    fieldSpecificRating * 0.3 +
    overallRating * 0.25 +
    amplifiedStdDevFactor * 0.2;

  return Math.max(0, Math.min(fieldRating, 99));
}
