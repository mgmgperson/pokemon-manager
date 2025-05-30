import { allPokemon, PokemonEntity, initPokemon } from '../data/pokemon';
import { allSpecies, PokemonSpecies, initSpecies } from '../data/pokemon-species';
import { Fields } from '../data/enums/fields';
import { Types } from '../data/enums/types';
import { Species } from '../data/enums/pokemon-species';
import { PokemonForms } from '../data/enums/pokemon-form';
import { Pokemon } from '../data/enums/pokemon';
import { RATING_MAP } from '../data/conversions/conversions';
import Decimal from 'decimal.js';

// Ensure Pokémon data is initialized
if (allPokemon.length === 0) {
    initPokemon();
}

// Ensure Pokémon species data is initialized
if (allSpecies.length === 0) {
    initSpecies();
}

// Team size distribution (bell curve approximation)
const TEAM_SIZE_PROBABILITIES = [
    { size: 6, weight: 1 },
    { size: 8, weight: 5 },
    { size: 9, weight: 50 },
    { size: 12, weight: 50 },
    { size: 14, weight: 30 },
    { size: 15, weight: 25 },
    { size: 16, weight: 20 },
    { size: 18, weight: 15 },
    { size: 20, weight: 10 },
    { size: 21, weight: 5 },
    { size: 24, weight: 1 },
];

/**
 * Determines what kind of special Pokémon (if any) to add to a team
 * based on the trainer's rating and position in the team
 */
function determinePokemonRarity(overallRating: number, position: number, teamSize: number): 'normal' | 'legendary' | 'mythical' {
    // For weaker trainers, always use normal Pokémon
    if (overallRating < 75) {
        return 'normal';
    }
    
    // For very top trainers, decide based on position in team
    if (overallRating >= 90) {
        // Potentially allow one legendary as an ace for top trainers
        if (position === 0 && Math.random() < 0.4) {
            return 'legendary';
        }
        // Potentially allow mythical for extremely top trainers in special positions
        if (overallRating >= 95 && position === teamSize - 1 && Math.random() < 0.25) {
            return 'mythical';
        }
        // Allow another legendary potentially, but very rare
        if (position === Math.floor(teamSize / 2) && Math.random() < 0.15) {
            return 'legendary';
        }
    }
    // For strong trainers, maybe allow one legendary
    else if (overallRating >= 80) {
        // Maybe allow one legendary as an ace
        if (position === 0 && Math.random() < 0.2) {
            return 'legendary';
        }
    }
    
    // Default to normal Pokémon
    return 'normal';
}

/**
 * Generate a random Pokémon team based on trainer's overall rating
 * 
 * @param overallRating Trainer's overall rating (0-99)
 * @param typePreferences Optional array of preferred Pokémon types
 * @param generationPreferences Optional array of preferred Pokémon generations
 * @param fieldPreferences Optional array of preferred battle fields
 * @returns Array of Pokémon with their details
 */
export function generatePokemonTeam(
    overallRating: number,
    typePreferences?: Types[],
    generationPreferences?: number[],
    fieldPreferences?: Fields[]
): any[] {
    // Determine team size using bell curve distribution
    const teamSize = determineTeamSize();
    
    // Calculate level range based on trainer rating
    const levelRange = calculateLevelRange(overallRating);
    
    // Get eligible fully evolved Pokémon
    let eligiblePokemon = filterEligiblePokemon(typePreferences, generationPreferences, fieldPreferences);
    
    // We'll apply type/generation preferences at each selection step (in the loop below),
    // instead of filtering the entire pool upfront
    
    // Determine special Pokémon allowances based on trainer rating
    const canUseMega = overallRating >= 80;  // Only trainers with 80+ rating can have Mega Pokémon
    const canUseGmax = overallRating >= 83;  // Only high-rated trainers can have Gigantamax Pokémon
    
    // Count for special Pokémon
    let megaCount = 0;
    let gmaxCount = 0;
    let legendaryCount = 0;
    let mythicalCount = 0;
    
    // Max allowed special Pokémon
    const maxMega = overallRating >= 90 ? 1 : 0;  // At most 1 Mega per team for top trainers
    // Gigantamax slightly more accessible than Mega but still restricted
    const maxGmax = overallRating >= 95 ? 2 : (overallRating >= 87 ? 1 : 0);
    const maxLegendary = overallRating >= 90 ? 2 : (overallRating >= 80 ? 1 : 0);
    const maxMythical = overallRating >= 95 ? 1 : 0;
    
    // Generate the team
    const team: any[] = [];
    
    for (let i = 0; i < teamSize; i++) {
        // Determine what kind of Pokémon to add based on trainer rating and position
        let pokemonRarity = determinePokemonRarity(overallRating, i, teamSize);
        
        // Get species info for all eligible Pokémon
        const eligibleSpecies = eligiblePokemon.map(p => {
            const species = allSpecies.find(s => s.id === p.species);
            return { pokemon: p, species };
        }).filter(item => item.species !== undefined);
        
        let currentEligible: PokemonEntity[] = [];
        
        // Filter based on rarity
        if (pokemonRarity === 'legendary' && legendaryCount < maxLegendary) {
            // Only include legendaries
            currentEligible = eligibleSpecies
                .filter(item => item.species!.isLegendary && !item.species!.isMythical)
                .map(item => item.pokemon);
            
            if (currentEligible.length === 0) {
                // If no legendaries match our criteria, fall back to normal
                pokemonRarity = 'normal';
            }
        } else if (pokemonRarity === 'mythical' && mythicalCount < maxMythical) {
            // Only include mythicals
            currentEligible = eligibleSpecies
                .filter(item => item.species!.isMythical)
                .map(item => item.pokemon);
            
            if (currentEligible.length === 0) {
                // If no mythicals match our criteria, fall back to normal
                pokemonRarity = 'normal';
            }
        }
        
        // Handle normal Pokémon and fallback cases
        if (pokemonRarity === 'normal' || currentEligible.length === 0) {
            // Filter out legendaries and mythicals for normal selection
            currentEligible = eligibleSpecies
                .filter(item => !item.species!.isLegendary && !item.species!.isMythical)
                .map(item => item.pokemon);
        }
        
        // Avoid empty list
        if (currentEligible.length === 0) {
            currentEligible = eligiblePokemon;
        }
        
        // Apply type preferences probabilistically 
        // ~75% chance to select a Pokémon that matches type preferences if they exist
        let preferredByType: PokemonEntity[] = [];
        if (typePreferences && typePreferences.length > 0 && Math.random() < 0.75) {
            preferredByType = currentEligible.filter(pokemon => 
                pokemon.types.some(type => typePreferences.includes(type))
            );
            
            // If we found type matches, use them for selection
            if (preferredByType.length > 0) {
                currentEligible = preferredByType;
            }
        }
        
        // Apply generation preferences probabilistically
        // ~90% chance to select a Pokémon from preferred generations if they exist
        let preferredByGeneration: PokemonEntity[] = [];
        if (generationPreferences && generationPreferences.length > 0 && Math.random() < 0.9) {
            preferredByGeneration = currentEligible.filter(pokemon => {
                const species = allSpecies.find(s => s.id === pokemon.species);
                return species && generationPreferences.includes(species.generation);
            });
            
            // If we found generation matches, use them for selection
            if (preferredByGeneration.length > 0) {
                currentEligible = preferredByGeneration;
            }
        }
        
        // Weighted selection
        const pokemon = selectPokemon(currentEligible, fieldPreferences, team);
        
        if (pokemon) {
            // Remove selected Pokémon from eligible pool to avoid duplicates
            eligiblePokemon = eligiblePokemon.filter(p => p.id !== pokemon.id);
            
            // Calculate Pokémon level based on trainer rating and some variance
            const level = calculatePokemonLevel(levelRange.min, levelRange.max);
            
            // Get species info
            const species = allSpecies.find(s => s.id === pokemon.species);
            
            // Determine if this is a special Pokémon
            let isMega = false;
            
            // Check if this Pokémon can have a Gigantamax form
            const speciesName = pokemon.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
            const hasGmaxForm = species?.varieties?.some(pokemonId => {
                // Look for form names like "CHARIZARD_GMAX"
                const formName = Pokemon[pokemonId];
                return typeof formName === 'string' && formName.includes('_GMAX');
            });
            
            let isGigantamax = false;
            
            // Only add mega if trainer is qualified and we haven't reached the limit
            // Megas should be used on strong but not legendary Pokémon
            if (canUseMega && megaCount < maxMega && 
                pokemonRarity === 'normal' && 
                i >= Math.floor(teamSize / 3) && // Not one of the first few Pokémon
                Math.random() < 0.5) { // 50% chance to use mega slot if available
                isMega = true;
                megaCount++;
            }
            // Check for Gigantamax eligibility - only if not already mega
            // Gigantamax should be used on normal Pokémon, preferably later in the team
            else if (!isMega && canUseGmax && gmaxCount < maxGmax && hasGmaxForm && 
                     pokemonRarity === 'normal' &&
                     // Position Gigantamax Pokémon strategically in the team
                     // For higher-rated trainers, place Gigantamax in more important positions
                     ((overallRating >= 90 && i === Math.floor(teamSize * 0.25)) || // ~25% through the team for top trainers
                      (overallRating < 90 && i >= Math.floor(teamSize * 0.6))) && // Later in team for others
                     Math.random() < (overallRating >= 90 ? 0.5 : 0.3)) { // Higher chance for top trainers
                isGigantamax = true;
                gmaxCount++;
            }
            
            // Update special counts
            if (species?.isLegendary) legendaryCount++;
            if (species?.isMythical) mythicalCount++;
            
            team.push({
                species_id: pokemon.species,
                pokemon_id: pokemon.id,
                name: pokemon.name,
                level: level,
                types: pokemon.types,
                is_mega: isMega,
                is_gigantamax: isGigantamax
            });
        }
    }
    
    return team;
}

/**
 * Determine team size using weighted random selection
 */
function determineTeamSize(): number {
    const totalWeight = TEAM_SIZE_PROBABILITIES.reduce((sum, entry) => sum + entry.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const entry of TEAM_SIZE_PROBABILITIES) {
        if (random < entry.weight) {
            return entry.size;
        }
        random -= entry.weight;
    }
    
    return 15; // Default fallback
}

/**
 * Calculate level range based on trainer's overall rating
 */
function calculateLevelRange(overallRating: number): { min: number, max: number } {
    // Higher rating trainers get higher level Pokémon
    // Overall rating 0-99 maps to level ranges
    if (overallRating >= 90) {
        return { min: 80, max: 100 };
    } else if (overallRating >= 80) {
        return { min: 70, max: 90 };
    } else if (overallRating >= 70) {
        return { min: 60, max: 80 };
    } else if (overallRating >= 60) {
        return { min: 55, max: 70 };
    } else if (overallRating >= 50) {
        return { min: 50, max: 65 };
    } else if (overallRating >= 40) {
        return { min: 45, max: 55 };
    } else if (overallRating >= 30) {
        return { min: 40, max: 50 };
    } else if (overallRating >= 20) {
        return { min: 35, max: 45 };
    } else if (overallRating >= 10) {
        return { min: 30, max: 40 };
    } else {
        return { min: 25, max: 35 };
    }
}

/**
 * Calculate individual Pokémon level within given range
 */
function calculatePokemonLevel(min: number, max: number): number {
    // Add some randomness within the range
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Filter eligible Pokémon based on preferences
 */
function filterEligiblePokemon(
    typePreferences?: Types[],
    generationPreferences?: number[],
    fieldPreferences?: Fields[]
): PokemonEntity[] {
    // Start with all available Pokémon
    let allEligible = [...allPokemon];
    
    // Filter to only include fully evolved Pokémon 
    const fullyEvolved = filterOnlyFullyEvolvedPokemon(allEligible);
    
    // Use fully evolved Pokémon if we have enough
    if (fullyEvolved.length >= 30) { // Ensure we have enough variety
        allEligible = fullyEvolved;
    }
    
    return allEligible;
}

/**
 * Filter the Pokémon list to only include fully evolved Pokémon
 */
function filterOnlyFullyEvolvedPokemon(pokemonList: PokemonEntity[]): PokemonEntity[] {
    // Get all species that don't have any further evolutions
    // A species is fully evolved if no other species evolves from it
    const allSpeciesIds = new Set(allSpecies.map(s => s.id));
    const evolvesFromMap = new Map<Species, Species[]>();
    
    // Create a map of which species evolve from which
    allSpecies.forEach(species => {
        if (species.evolvesFrom !== null) {
            if (!evolvesFromMap.has(species.evolvesFrom)) {
                evolvesFromMap.set(species.evolvesFrom, []);
            }
            evolvesFromMap.get(species.evolvesFrom)!.push(species.id);
        }
    });
    
    // A species is fully evolved if no other species evolves from it
    const fullyEvolvedSpecies = new Set<Species>();
    
    allSpeciesIds.forEach(speciesId => {
        if (!evolvesFromMap.has(speciesId)) {
            fullyEvolvedSpecies.add(speciesId);
        }
    });
    
    // Special case: Some Pokémon don't evolve at all but are still considered "fully evolved"
    // For example: Tauros, Kangaskhan, Farfetch'd, etc.
    allSpecies.forEach(species => {
        if (species.evolvesFrom === null && !evolvesFromMap.has(species.id)) {
            fullyEvolvedSpecies.add(species.id);
        }
    });
    
    // Filter the original list to only include fully evolved Pokémon
    return pokemonList.filter(pokemon => {
        return fullyEvolvedSpecies.has(pokemon.species);
    });
}

/**
 * Prioritize Pokémon by evolution stage
 */
function prioritizeByEvolutionStage(pokemon: PokemonEntity[]): PokemonEntity[] {
    return pokemon.sort((a, b) => {
        // Find evolution stage by checking if this species evolves from something
        const speciesA = allSpecies.find(s => s.id === a.species);
        const speciesB = allSpecies.find(s => s.id === b.species);

        // Check if species exists
        if (!speciesA || !speciesB) return 0;
        
        const stageA = getEvolutionStage(speciesA);
        const stageB = getEvolutionStage(speciesB);
        
        // Higher evolution stage first
        if (stageB !== stageA) {
            return stageB - stageA;
        }
        
        // If same evolution stage, sort by base stat total
        return b.getBaseStatTotal() - a.getBaseStatTotal();
    });
}

/**
 * Get the evolution stage of a Pokémon species
 */
function getEvolutionStage(species: PokemonSpecies): number {
    let currentSpecies: PokemonSpecies | null = species;
    let stage = 1;
    
    // Follow the evolution chain backward to count stages
    while (currentSpecies && currentSpecies.evolvesFrom !== null) {
        stage++;
        currentSpecies = allSpecies.find(s => s.id === currentSpecies!.evolvesFrom) || null;
    }
    
    return stage;
}

/**
 * Select a Pokémon based on field preferences and team composition
 */
function selectPokemon(
    eligiblePokemon: PokemonEntity[], 
    fieldPreferences?: Fields[],
    currentTeam: any[] = []
): PokemonEntity {
    if (eligiblePokemon.length === 0) {
        // Fallback to all Pokémon if none are eligible
        eligiblePokemon = [...allPokemon];
    }

    // Always use neutral field viability as a base factor
    const weightedPokemon = eligiblePokemon.map(pokemon => {
        // Start with a low base weight to allow for more variance
        let weight = 0.5; 
        
        // Get viability ratings
        const viabilityRatings = pokemon.getViabilityRatings();
        
        // Use neutral field viability as the primary factor
        const neutralFieldViability = viabilityRatings[Fields.NEUTRAL] || new Decimal(0);
        
        // Calculate weight based on viability
        // This approach allows a bell curve where mid-tier Pokémon are most common
        const viabilityScore = neutralFieldViability.toNumber();
        
        if (viabilityScore < 30) {
            // Weaker Pokémon get slightly increased representation
            weight += 0.5 + (viabilityScore / 60);
        } else if (viabilityScore < 60) {
            // Mid-tier Pokémon are most common
            weight += 1.0 + (viabilityScore / 60);
        } else if (viabilityScore < 80) {
            // Strong Pokémon are somewhat common
            weight += 0.75 + (viabilityScore / 80);
        } else {
            // Very strong Pokémon are less common
            weight += 0.5 + (viabilityScore / 120);
        }
        
        // If field preferences are provided, give bonus to Pokémon good in those fields
        if (fieldPreferences && fieldPreferences.length > 0) {
            fieldPreferences.forEach(field => {
                if (field !== Fields.NEUTRAL && viabilityRatings[field]) {
                    weight += viabilityRatings[field].toNumber() / 150; // Small boost for field preference
                }
            });
        }
        
        // Less emphasis on BST now, just a very minor factor
        const bst = pokemon.getBaseStatTotal();
        if (bst < 400) {
            weight += 0.2; // Slight boost for weaker Pokémon
        } else if (bst > 600) {
            weight += 0.05; // Very small boost for very strong Pokémon
        } else {
            weight += 0.1; // Small boost for mid-BST Pokémon
        }
        
        return { item: pokemon, weight };
    });
    
    // Select Pokémon using weighted random selection
    return weightedRandomSelection(weightedPokemon);
}

/**
 * Perform weighted random selection
 */
function weightedRandomSelection<T>(items: { item: T, weight: number }[]): T {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of items) {
        if (random < item.weight) {
            return item.item;
        }
        random -= item.weight;
    }
    
    // Fallback
    return items[0].item;
}

/**
 * Convert PWTR rating to overall rating (0-99)
 */
export function convertPWTRToOverallRating(pwtrRating: number): number {
    // Use RATING_MAP to convert PWTR rating to overall rating
    for (let i = 0; i < RATING_MAP.length; i++) {
        if (pwtrRating >= RATING_MAP[i][0]) {
            // If exact match, return the corresponding rating
            if (pwtrRating === RATING_MAP[i][0]) {
                return RATING_MAP[i][1];
            }
            
            // If we're at the highest rating, return it
            if (i === 0) {
                return RATING_MAP[0][1];
            }
            
            // Otherwise, interpolate between the two nearest ratings
            const [higherPwtr, higherRating] = RATING_MAP[i - 1];
            const [lowerPwtr, lowerRating] = RATING_MAP[i];
            const ratio = (pwtrRating - lowerPwtr) / (higherPwtr - lowerPwtr);
            return Math.round(lowerRating + ratio * (higherRating - lowerRating));
        }
    }
    
    // If lower than the lowest rating, return the lowest rating
    return RATING_MAP[RATING_MAP.length - 1][1];
}