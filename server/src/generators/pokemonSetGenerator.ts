import sqlite3 from 'sqlite3';
import { allSpecies } from '../reference-data/pokemon-species';
import { Items } from '../reference-data/enums/items';
import { getPokemonSet } from '../reference-data/sets/sets';
import { Natures } from '../reference-data/enums/natures';
import { allPokemon } from '../reference-data/pokemon';
import { RATING_MAP } from '../reference-data/conversions/conversions';
import { allNatures, initNatures } from '../reference-data/nature';
import { Stat } from '../reference-data/enums/stat';

/**
 * Compute final stat value based on base stat, IV, EV, level, and nature multiplier
 * Uses standard Pokemon stat calculation formula
 */
function computeFinalStat(
  statName: string,
  base: number,
  iv: number,
  ev: number,
  level: number,
  natureMult: number
): number {
  const floorFn = Math.floor;

  if (statName.toLowerCase() === 'hp') {
    return floorFn(0.01 * (2 * base + iv + floorFn(0.25 * ev)) * level) + level + 10;
  } else {
    let tmp = floorFn(0.01 * (2 * base + iv + floorFn(0.25 * ev)) * level) + 5;
    tmp = Math.round(tmp * natureMult);
    return tmp;
  }
}

/**
 * Get nature multipliers for each stat based on nature data
 * Returns array: [hp, attack, defense, special_attack, special_defense, speed]
 */
function getNatureMultipliers(natureId: number): number[] {
  // Initialize allNatures if needed
  if (allNatures.length === 0) {
    initNatures();
  }

  const nature = allNatures.find(n => n.id === natureId);
  
  if (!nature) {
    // Default to all 1.0 if nature not found
    return [1, 1, 1, 1, 1, 1];
  }

  // Map Stat enum to array indices
  // Array order: [hp, attack, defense, special_attack, special_defense, speed]
  const statToIndex: { [key: number]: number } = {
    [Stat.HP]: 0,
    [Stat.ATK]: 1,
    [Stat.DEF]: 2,
    [Stat.SPATK]: 3,
    [Stat.SPDEF]: 4,
    [Stat.SPE]: 5,
  };

  const multipliers = [1, 1, 1, 1, 1, 1];

  // If nature is neutral (same stat increased and decreased), return all 1.0
  if (nature.isNeutral()) {
    return multipliers;
  }

  // Apply nature effects
  const increasedIndex = statToIndex[nature.increasedStat];
  const decreasedIndex = statToIndex[nature.decreasedStat];

  if (increasedIndex !== undefined) {
    multipliers[increasedIndex] = 1.1;
  }
  if (decreasedIndex !== undefined) {
    multipliers[decreasedIndex] = 0.9;
  }

  return multipliers;
}

/**
 * Generate a single IV with tail-end distribution (31 most common, 0 rare)
 * Uses exponential distribution: P(X) = λ * e^(-λx)
 * We invert the scale so higher IVs are more likely
 */
function generateIV(): number {
  // Use exponential distribution with lambda = 0.15
  // This creates a strong bias toward higher values
  const lambda = 0.8;
  const u = Math.random();
  
  // Inverse CDF: x = -ln(1 - u) / λ
  // We want high values to be common, so we invert: 31 - x
  const exponentialValue = -Math.log(1 - u) / lambda;

  // Bucket the exponential value into integer steps, then invert so
  // x in [0,1) -> top value (31), x in [1,2) -> 30, etc.
  const bucket = Math.floor(Math.min(exponentialValue, 31));
  const iv = 31 - bucket;

  // Clamp to valid IV range [0, 31]
  return Math.max(0, Math.min(31, iv));
}

/**
 * Match a nature string (e.g., "Adamant", "Timid") to Natures enum
 */
function matchNature(natureName: string): number {
  const normalized = natureName.toUpperCase().replace(/[^A-Z]/g, '');
  
  // Try direct match
  for (const [key, value] of Object.entries(Natures)) {
    if (typeof value === 'number' && key === normalized) {
      return value;
    }
  }
  
  // Default to Hardy if no match
  return Natures.HARDY;
}

/**
 * Parse EV spread string like "Adamant:0/252/0/0/4/252" into nature and EV values
 */
function parseSpread(spread: string): {
  nature: number;
  ev_hp: number;
  ev_attack: number;
  ev_defense: number;
  ev_sp_attack: number;
  ev_sp_defense: number;
  ev_speed: number;
} {
  const parts = spread.split(':');
  if (parts.length !== 2) {
    // Invalid format, return default
    return {
      nature: Natures.HARDY,
      ev_hp: 0,
      ev_attack: 0,
      ev_defense: 0,
      ev_sp_attack: 0,
      ev_sp_defense: 0,
      ev_speed: 0,
    };
  }
  
  const natureName = parts[0];
  const evString = parts[1];
  const evValues = evString.split('/').map(v => parseInt(v) || 0);
  
  if (evValues.length !== 6) {
    // Invalid EV format
    return {
      nature: matchNature(natureName),
      ev_hp: 0,
      ev_attack: 0,
      ev_defense: 0,
      ev_sp_attack: 0,
      ev_sp_defense: 0,
      ev_speed: 0,
    };
  }
  
  return {
    nature: matchNature(natureName),
    ev_hp: evValues[0],
    ev_attack: evValues[1],
    ev_defense: evValues[2],
    ev_sp_attack: evValues[3],
    ev_sp_defense: evValues[4],
    ev_speed: evValues[5],
  };
}

/**
 * Select a weighted item from a list of {value, weight} pairs
 */
function selectWeighted<T>(items: Array<{ value: T; weight: number }>): T | null {
  if (items.length === 0) return null;
  
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return items[0].value;
  
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item.value;
    }
  }
  
  return items[items.length - 1].value;
}

/**
 * Generate a happiness value with tail-end distribution (most Pokemon are happy)
 * Returns values from 1-255, with most values being high (180-255)
 * Uses exponential distribution inverted so higher happiness is more common
 */
function generateHappiness(): number {
  // Use exponential distribution with lambda = 0.02
  // Lower lambda = gentler curve, suitable for 0-255 range
  const lambda = 0.02;
  const u = Math.random();

  // Inverse CDF: x = -ln(1 - u) / λ
  const exponentialValue = -Math.log(1 - u) / lambda;

  // Bucket the exponential value and invert so x in [0,1) -> 255 (max happiness)
  const bucket = Math.floor(Math.min(exponentialValue, 255));
  const happiness = 255 - bucket;

  // Clamp to valid happiness range [1, 255] (0 is not used in Pokemon)
  return Math.max(1, Math.min(255, happiness));
}

/**
 * Determine gender based on species gender rate
 * @param genderRate -1 = genderless, 0 = always male, 8 = always female, others = ratio
 * @returns "male", "female", or "genderless"
 */
function generateGender(genderRate: number): string {
  if (genderRate === -1) {
    return 'genderless';
  }
  if (genderRate === 0) {
    return 'male';
  }
  if (genderRate === 8) {
    return 'female';
  }
  
  // genderRate / 8 = probability of female
  // e.g., genderRate=1 -> 1/8 = 12.5% female
  //       genderRate=4 -> 4/8 = 50% female
  const femaleChance = genderRate / 8;
  return Math.random() < femaleChance ? 'female' : 'male';
}

/**
 * Determine if Pokemon is shiny (1/4096 chance)
 */
function generateShiny(): boolean {
  return Math.random() < (1 / 4096);
}

/**
 * Generate pokeball ID with weighted distribution
 * 95% chance: Poke Ball, Great Ball, or Ultra Ball (each 1/3)
 * 5% chance: Other balls evenly distributed
 */
function generatePokeballId(): number {
  const rand = Math.random();
  
  if (rand < 0.95) {
    // 95% chance for basic balls
    const basicRoll = Math.random();
    if (basicRoll < 1/3) {
      return Items.POKE_BALL;
    } else if (basicRoll < 2/3) {
      return Items.GREAT_BALL;
    } else {
      return Items.ULTRA_BALL;
    }
  } else {
    // 5% chance for other balls
    const otherBalls = [
      Items.MASTER_BALL,
      Items.SAFARI_BALL,
      Items.NET_BALL,
      Items.DIVE_BALL,
      Items.NEST_BALL,
      Items.REPEAT_BALL,
      Items.TIMER_BALL,
      Items.LUXURY_BALL,
      Items.PREMIER_BALL,
      Items.DUSK_BALL,
      Items.HEAL_BALL,
      Items.QUICK_BALL,
      Items.CHERISH_BALL
    ];
    return otherBalls[Math.floor(Math.random() * otherBalls.length)];
  }
}

/**
 * Generate level met at based on whether this is the trainer's highest-level Pokemon
 * If it's the highest (their "starter"), it was caught at a very low level (1-10)
 * Otherwise, it can be caught at a broader range
 * @param currentLevel The Pokemon's current level
 * @param isHighestForTrainer Whether this is one of the trainer's highest-level Pokemon
 */
function generateLevelMetAt(currentLevel: number, isHighestForTrainer: boolean): number {
  if (currentLevel <= 1) {
    return 1;
  }
  
  if (isHighestForTrainer) {
    // Weigh heavily in 1..10, but clamp to level-1
    const upper = Math.min(currentLevel - 1, 10);
    return upper >= 1 ? Math.floor(Math.random() * upper) + 1 : 1;
  } else {
    // Caught it later => random from 1..(level-1 or 20, whichever is higher)
    const upper = Math.max(currentLevel - 1, 20);
    if (upper > 1) {
      return Math.floor(Math.random() * upper) + 1;
    } else {
      return 1;
    }
  }
}

/**
 * Generate training efficiency with distribution favoring higher values
 * Most Pokemon should have good training efficiency (70-100)
 */
function generateTrainingEfficiency(): number {
  const rand = Math.random();
  
  // 60% chance of high efficiency (80-100)
  if (rand < 0.60) {
    return Math.floor(80 + Math.random() * 21);
  }
  // 30% chance of moderate efficiency (60-79)
  else if (rand < 0.90) {
    return Math.floor(60 + Math.random() * 20);
  }
  // 10% chance of lower efficiency (1-59)
  else {
    return Math.floor(1 + Math.random() * 59);
  }
}

/**
 * Generate random number using triangular distribution
 * Peaks at 'mode' value between min and max
 * @param min Minimum value
 * @param max Maximum value  
 * @param mode Peak value (defaults to min for left-skewed distribution)
 */
function randomTriangular(min: number, max: number, mode: number = min): number {
  const u = Math.random();
  const f = (mode - min) / (max - min);
  
  if (u < f) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  } else {
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
  }
}

/**
 * Generate date met at based on trainer's birthdate
 * Assumes journey starts at age 10, ends 12 years later or at END_DATE (2036)
 * Uses triangular distribution favoring earlier dates
 * If highest-level Pokemon => pick from first 1/6 of journey (their "starter")
 * Otherwise => pick from entire range, triangular skew toward start
 * @param birthdate Trainer's birthdate in YYYY-MM-DD format
 * @param isHighestForTrainer Whether this is one of the trainer's highest-level Pokemon
 * @param endDate The global end date (default 2036-12-31)
 */
function generateDateMetAt(
  birthdate: string | null,
  isHighestForTrainer: boolean,
  endDate: Date = new Date(2036, 11, 31)
): string {
  let startJourney: Date;
  
  if (!birthdate) {
    // Fallback: pick random date in [2000..2036], triangular skew toward 2000
    const start = new Date(2000, 0, 1);
    const delta = Math.floor((endDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const randomDays = Math.floor(randomTriangular(0, delta, 0));
    const metDate = new Date(start.getTime() + randomDays * 24 * 60 * 60 * 1000);
    return metDate.toISOString().split('T')[0];
  }
  
  try {
    const bdt = new Date(birthdate);
    
    // Journey starts at age 10
    // Handle leap day edge case (Feb 29 -> Mar 1)
    if (bdt.getMonth() === 1 && bdt.getDate() === 29) {
      startJourney = new Date(bdt.getFullYear() + 10, 2, 1); // March 1
    } else {
      startJourney = new Date(bdt.getFullYear() + 10, bdt.getMonth(), bdt.getDate());
    }
    
    // Clamp journey start to no earlier than 1900
    if (startJourney < new Date(1900, 0, 1)) {
      startJourney = new Date(1900, 0, 1);
    }
  } catch {
    // Invalid date format, use fallback
    const start = new Date(2000, 0, 1);
    const delta = Math.floor((endDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const randomDays = Math.floor(randomTriangular(0, delta, 0));
    const metDate = new Date(start.getTime() + randomDays * 24 * 60 * 60 * 1000);
    return metDate.toISOString().split('T')[0];
  }
  
  // Calculate up to 12 years after start_journey, or endDate, whichever is earlier
  const twelveYearsLater = new Date(startJourney.getFullYear() + 12, startJourney.getMonth(), startJourney.getDate());
  const finalEnd = twelveYearsLater < endDate ? twelveYearsLater : endDate;
  
  // If journey start is after final_end, return final_end
  if (startJourney > finalEnd) {
    return finalEnd.toISOString().split('T')[0];
  }
  
  const delta = Math.floor((finalEnd.getTime() - startJourney.getTime()) / (1000 * 60 * 60 * 24));
  if (delta < 1) {
    return finalEnd.toISOString().split('T')[0];
  }
  
  // If highest-level => pick from the first 1/6 of journey, triangular skew
  // Otherwise => pick from entire range, triangular skew
  let randomDays: number;
  if (isHighestForTrainer) {
    const sixthDays = Math.floor(delta / 6);
    randomDays = Math.floor(randomTriangular(0, sixthDays, 0));
  } else {
    randomDays = Math.floor(randomTriangular(0, delta, 0));
  }
  
  const metDate = new Date(startJourney.getTime() + randomDays * 24 * 60 * 60 * 1000);
  return metDate.toISOString().split('T')[0];
}

/**
 * Generate battle statistics based on years since caught and trainer rating
 */
function generateBattleStats(dateMetAt: string, pwtrRating: number, currentYear: number = 2036): {
  battlesWon: number;
  battlesLost: number;
  kills: number;
  deaths: number;
} {
  // Calculate years since caught
  const yearMet = parseInt(dateMetAt.split('-')[0]);
  const yearsActive = Math.max(0, currentYear - yearMet);
  
  // Base matches per year: 50-60, modified by trainer rating
  let matchesPerYear = 50 + Math.random() * 10;
  
  // Better trainers have more matches
  if (pwtrRating > 3000) {
    matchesPerYear *= 1.5;
  } else if (pwtrRating > 2500) {
    matchesPerYear *= 1.3;
  } else if (pwtrRating > 2000) {
    matchesPerYear *= 1.1;
  }
  
  const totalMatches = Math.floor(yearsActive * matchesPerYear);
  
  // Win rate based on trainer rating
  // Convert PWTR to overall rating for win rate calculation
  let winRate = 0.5; // Default 50%
  
  if (pwtrRating >= 3500) {
    winRate = 0.75 + Math.random() * 0.15; // 75-90%
  } else if (pwtrRating >= 3000) {
    winRate = 0.65 + Math.random() * 0.15; // 65-80%
  } else if (pwtrRating >= 2500) {
    winRate = 0.55 + Math.random() * 0.15; // 55-70%
  } else if (pwtrRating >= 2000) {
    winRate = 0.45 + Math.random() * 0.15; // 45-60%
  } else if (pwtrRating >= 1500) {
    winRate = 0.35 + Math.random() * 0.20; // 35-55%
  } else {
    winRate = 0.25 + Math.random() * 0.25; // 25-50%
  }
  
  const battlesWon = Math.floor(totalMatches * winRate);
  const battlesLost = totalMatches - battlesWon;
  
  // Kills and deaths are loosely correlated with wins/losses
  // But add variance - not every battle results in a KO
  const killRate = 0.6 + Math.random() * 0.3; // 60-90% of wins result in kills
  const deathRate = 0.4 + Math.random() * 0.3; // 40-70% of losses result in deaths
  
  const kills = Math.floor(battlesWon * killRate);
  const deaths = Math.floor(battlesLost * deathRate);
  
  return {
    battlesWon,
    battlesLost,
    kills,
    deaths
  };
}

/**
 * Populate Pokemon details for all Pokemon in the database
 * This fills in missing fields like OT info, gender, shiny status, etc.
 */
export async function populatePokemonDetails(db: sqlite3.Database): Promise<void> {
  console.log('Starting Pokemon details population...');
  
  return new Promise((resolve, reject) => {
    // First, get all Pokemon with their trainer info
    const sql = `
      SELECT 
        p.id,
        p.trainer_id,
        p.species_id,
        p.pokemon_id,
        p.level,
        t.fname,
        t.lname,
        t.pwtr_rating,
        t.birthdate
      FROM pokemon p
      JOIN trainer t ON p.trainer_id = t.id
    `;
    
    db.all(sql, [], (err, rows: any[]) => {
      if (err) {
        console.error('Error fetching Pokemon:', err);
        reject(err);
        return;
      }
      
      console.log(`Found ${rows.length} Pokemon to populate`);
      
      // Build map of trainer_id -> 6th highest level (to identify "starter" Pokemon)
      // Pokemon at or above this level are considered the trainer's earliest team
      const highestLevelMap: { [trainerId: number]: number } = {};
      const trainerPokemon: { [trainerId: number]: number[] } = {};
      
      rows.forEach(pokemon => {
        if (!trainerPokemon[pokemon.trainer_id]) {
          trainerPokemon[pokemon.trainer_id] = [];
        }
        trainerPokemon[pokemon.trainer_id].push(pokemon.level);
      });
      
      // For each trainer, sort levels descending and take the 6th highest as threshold
      Object.entries(trainerPokemon).forEach(([trainerId, levels]) => {
        const sorted = levels.sort((a, b) => b - a);
        // 6th highest (index 5) or the last one if fewer than 6 Pokemon
        const sixthHighest = sorted[Math.min(5, sorted.length - 1)] || 1;
        highestLevelMap[parseInt(trainerId)] = sixthHighest;
      });
      
      // Prepare update statement (now includes ability, nature, EVs, IVs, and calculated stats)
      const updateSql = `
        UPDATE pokemon
        SET
          ot_name = ?,
          ot_id = ?,
          nickname = ?,
          happiness = ?,
          gender = ?,
          shiny = ?,
          pokeball_id = ?,
          held_item_id = ?,
          experience_points = ?,
          date_met_at = ?,
          level_met_at = ?,
          current_hp = ?,
          current_strength = ?,
          status_id = ?,
          battles_won = ?,
          battles_lost = ?,
          kills = ?,
          deaths = ?,
          training_efficiency = ?,
          ability_id = ?,
          nature_id = ?,
          ev_hp = ?,
          ev_attack = ?,
          ev_defense = ?,
          ev_special_attack = ?,
          ev_special_defense = ?,
          ev_speed = ?,
          iv_hp = ?,
          iv_attack = ?,
          iv_defense = ?,
          iv_special_attack = ?,
          iv_special_defense = ?,
          iv_speed = ?,
          hp = ?,
          attack = ?,
          defense = ?,
          special_attack = ?,
          special_defense = ?,
          speed = ?
        WHERE id = ?
      `;
      
      // Begin transaction for bulk updates
      db.run('BEGIN TRANSACTION', (beginErr) => {
        if (beginErr) {
          console.error('Error starting transaction:', beginErr);
          reject(beginErr);
          return;
        }
        
        let completed = 0;
        let failed = 0;
        
        // Process each Pokemon
        rows.forEach((pokemon, index) => {
          // Find species info
          const species = allSpecies.find(s => s.id === pokemon.species_id);
          
          if (!species) {
            console.warn(`Species not found for Pokemon ID ${pokemon.id}, species_id: ${pokemon.species_id}`);
            failed++;
            return;
          }
          
          // Generate all the values
          const otName = `${pokemon.fname} ${pokemon.lname}`;
          const otId = pokemon.trainer_id;
          const nickname = species.name;
          const happiness = generateHappiness();
          const gender = generateGender(species.genderRate);
          const shiny = generateShiny() ? 1 : 0;
          const pokeballId = generatePokeballId();
          const heldItemId = 0;
          const experiencePoints = 0;
          
          // Determine if this is one of the trainer's highest-level Pokemon (their "starter" team)
          const highestLevel = highestLevelMap[pokemon.trainer_id] || 1;
          const isHighest = pokemon.level >= highestLevel;
          
          const levelMetAt = generateLevelMetAt(pokemon.level, isHighest);
          const dateMetAt = generateDateMetAt(pokemon.birthdate, isHighest);
          const currentHp = 100;
          const currentStrength = 100;
          const statusId = 0;
          const trainingEfficiency = generateTrainingEfficiency();
          
          const battleStats = generateBattleStats(dateMetAt, pokemon.pwtr_rating);
          
          // Get Pokemon entity to access abilities
          const pokemonEntity = allPokemon.find(p => p.id === pokemon.pokemon_id);
          
          // Get competitive set data for this Pokemon
          const setData = getPokemonSet(pokemon.pokemon_id);
          
          // Generate ability, nature, EVs, and IVs
          let abilityId = pokemonEntity && pokemonEntity.abilities.length > 0 
            ? pokemonEntity.abilities[0] 
            : 0;
          let natureId = Natures.HARDY;
          let ev_hp = 0, ev_attack = 0, ev_defense = 0, ev_sp_attack = 0, ev_sp_defense = 0, ev_speed = 0;
          
          if (setData) {
            // Select ability from weighted list
            const abilityWeights = Object.entries(setData.abilities).map(([id, weight]) => ({
              value: parseInt(id),
              weight,
            }));
            const selectedAbility = selectWeighted(abilityWeights);
            if (selectedAbility !== null) {
              abilityId = selectedAbility;
            }
            
            // Select spread from weighted list
            const spreadWeights = setData.spreads.map(s => ({
              value: s.spread,
              weight: s.weight,
            }));
            const selectedSpread = selectWeighted(spreadWeights);
            if (selectedSpread) {
              const parsed = parseSpread(selectedSpread);
              natureId = parsed.nature;
              ev_hp = parsed.ev_hp;
              ev_attack = parsed.ev_attack;
              ev_defense = parsed.ev_defense;
              ev_sp_attack = parsed.ev_sp_attack;
              ev_sp_defense = parsed.ev_sp_defense;
              ev_speed = parsed.ev_speed;
            }
          }
          
          // Generate IVs with tail distribution (31 most common)
          const iv_hp = generateIV();
          const iv_attack = generateIV();
          const iv_defense = generateIV();
          const iv_sp_attack = generateIV();
          const iv_sp_defense = generateIV();
          const iv_speed = generateIV();
          
          // Calculate final stats using base stats, IVs, EVs, level, and nature
          const natureMultipliers = getNatureMultipliers(natureId);
          const finalHP = computeFinalStat('hp', pokemonEntity?.baseHP || 0, iv_hp, ev_hp, pokemon.level, natureMultipliers[0]);
          const finalAttack = computeFinalStat('attack', pokemonEntity?.baseATK || 0, iv_attack, ev_attack, pokemon.level, natureMultipliers[1]);
          const finalDefense = computeFinalStat('defense', pokemonEntity?.baseDEF || 0, iv_defense, ev_defense, pokemon.level, natureMultipliers[2]);
          const finalSpAttack = computeFinalStat('special_attack', pokemonEntity?.baseSPATK || 0, iv_sp_attack, ev_sp_attack, pokemon.level, natureMultipliers[3]);
          const finalSpDefense = computeFinalStat('special_defense', pokemonEntity?.baseSPDEF || 0, iv_sp_defense, ev_sp_defense, pokemon.level, natureMultipliers[4]);
          const finalSpeed = computeFinalStat('speed', pokemonEntity?.baseSPE || 0, iv_speed, ev_speed, pokemon.level, natureMultipliers[5]);
          
          // Execute update
          db.run(
            updateSql,
            [
              otName,
              otId,
              nickname,
              happiness,
              gender,
              shiny,
              pokeballId,
              heldItemId,
              experiencePoints,
              dateMetAt,
              levelMetAt,
              currentHp,
              currentStrength,
              statusId,
              battleStats.battlesWon,
              battleStats.battlesLost,
              battleStats.kills,
              battleStats.deaths,
              trainingEfficiency,
              abilityId,
              natureId,
              ev_hp,
              ev_attack,
              ev_defense,
              ev_sp_attack,
              ev_sp_defense,
              ev_speed,
              iv_hp,
              iv_attack,
              iv_defense,
              iv_sp_attack,
              iv_sp_defense,
              iv_speed,
              finalHP,
              finalAttack,
              finalDefense,
              finalSpAttack,
              finalSpDefense,
              finalSpeed,
              pokemon.id
            ],
            (updateErr) => {
              if (updateErr) {
                console.error(`Error updating Pokemon ID ${pokemon.id}:`, updateErr);
                failed++;
              } else {
                completed++;
              }
              
              // Log progress every 500 Pokemon
              if ((completed + failed) % 500 === 0) {
                console.log(`Progress: ${completed + failed}/${rows.length} Pokemon processed`);
              }
              
              // If this was the last Pokemon, commit transaction
              if (completed + failed === rows.length) {
                db.run('COMMIT', (commitErr) => {
                  if (commitErr) {
                    console.error('Error committing transaction:', commitErr);
                    reject(commitErr);
                    return;
                  }
                  
                  console.log(`Pokemon details population completed: ${completed} successful, ${failed} failed`);
                  resolve();
                });
              }
            }
          );
        });
        
        // Handle case where no Pokemon to process
        if (rows.length === 0) {
          db.run('COMMIT', (commitErr) => {
            if (commitErr) {
              console.error('Error committing empty transaction:', commitErr);
              reject(commitErr);
              return;
            }
            console.log('No Pokemon to populate');
            resolve();
          });
        }
      });
    });
  });
}

/**
 * Generate Pokemon stats for a single Pokemon without saving to DB
 * Returns all the generated values for preview/API use
 */
export async function generatePokemonStats(
  db: sqlite3.Database,
  trainerId: number,
  pokemonId: number
): Promise<any> {
  return new Promise((resolve, reject) => {
    // Fetch trainer and Pokemon info
    const sql = `
      SELECT 
        p.id,
        p.trainer_id,
        p.species_id,
        p.pokemon_id,
        p.level,
        t.fname,
        t.lname,
        t.pwtr_rating,
        t.birthdate
      FROM pokemon p
      JOIN trainer t ON p.trainer_id = t.id
      WHERE p.id = ? AND p.trainer_id = ?
    `;
    
    db.get(sql, [pokemonId, trainerId], (err, pokemon: any) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!pokemon) {
        reject(new Error(`Pokemon with ID ${pokemonId} and trainer ID ${trainerId} not found`));
        return;
      }
      
      // Find species info
      const species = allSpecies.find(s => s.id === pokemon.species_id);
      
      if (!species) {
        reject(new Error(`Species with ID ${pokemon.species_id} not found`));
        return;
      }
      
      // Generate all the values (same logic as populatePokemonDetails)
      const otName = `${pokemon.fname} ${pokemon.lname}`;
      const otId = pokemon.trainer_id;
      const nickname = species.name;
      const happiness = generateHappiness();
      const gender = generateGender(species.genderRate);
      const shiny = generateShiny();
      const pokeballId = generatePokeballId();
      const heldItemId = 0;
      const experiencePoints = 0;
      
      // For single Pokemon generation, query to determine if it's among trainer's highest
      // We'll fetch the 6th highest level for this trainer
      const highestLevelSql = `
        SELECT level FROM pokemon
        WHERE trainer_id = ?
        ORDER BY level DESC
        LIMIT 1 OFFSET 5
      `;
      
      db.get(highestLevelSql, [pokemon.trainer_id], (err, highestRow: any) => {
        let isHighest = false;
        if (!err && highestRow) {
          const highestLevel = highestRow.level || 1;
          isHighest = pokemon.level >= highestLevel;
        }
        
        const levelMetAt = generateLevelMetAt(pokemon.level, isHighest);
        const dateMetAt = generateDateMetAt(pokemon.birthdate, isHighest);
        const currentHp = 100;
        const currentStrength = 100;
        const statusId = 0;
        const trainingEfficiency = generateTrainingEfficiency();
        
        const battleStats = generateBattleStats(dateMetAt, pokemon.pwtr_rating);
        
        // Get Pokemon entity to access abilities
        const pokemonEntity = allPokemon.find(p => p.id === pokemon.pokemon_id);
        
        // Get competitive set data for this Pokemon
        const setData = getPokemonSet(pokemon.pokemon_id);
        
        // Generate ability, nature, EVs, and IVs
        let abilityId = pokemonEntity && pokemonEntity.abilities.length > 0 
          ? pokemonEntity.abilities[0] 
          : 0;
        let natureId = Natures.HARDY;
        let ev_hp = 0, ev_attack = 0, ev_defense = 0, ev_sp_attack = 0, ev_sp_defense = 0, ev_speed = 0;
        
        if (setData) {
          // Select ability from weighted list
          const abilityWeights = Object.entries(setData.abilities).map(([id, weight]) => ({
            value: parseInt(id),
            weight,
          }));
          const selectedAbility = selectWeighted(abilityWeights);
          if (selectedAbility !== null) {
            abilityId = selectedAbility;
          }
          
          // Select spread from weighted list
          const spreadWeights = setData.spreads.map(s => ({
            value: s.spread,
            weight: s.weight,
          }));
          const selectedSpread = selectWeighted(spreadWeights);
          if (selectedSpread) {
            const parsed = parseSpread(selectedSpread);
            natureId = parsed.nature;
            ev_hp = parsed.ev_hp;
            ev_attack = parsed.ev_attack;
            ev_defense = parsed.ev_defense;
            ev_sp_attack = parsed.ev_sp_attack;
            ev_sp_defense = parsed.ev_sp_defense;
            ev_speed = parsed.ev_speed;
          }
        }
        
        // Generate IVs with tail distribution (31 most common)
        const iv_hp = generateIV();
        const iv_attack = generateIV();
        const iv_defense = generateIV();
        const iv_sp_attack = generateIV();
        const iv_sp_defense = generateIV();
        const iv_speed = generateIV();
        
        // Calculate final stats using base stats, IVs, EVs, level, and nature
        const natureMultipliers = getNatureMultipliers(natureId);
        const finalHP = computeFinalStat('hp', pokemonEntity?.baseHP || 0, iv_hp, ev_hp, pokemon.level, natureMultipliers[0]);
        const finalAttack = computeFinalStat('attack', pokemonEntity?.baseATK || 0, iv_attack, ev_attack, pokemon.level, natureMultipliers[1]);
        const finalDefense = computeFinalStat('defense', pokemonEntity?.baseDEF || 0, iv_defense, ev_defense, pokemon.level, natureMultipliers[2]);
        const finalSpAttack = computeFinalStat('special_attack', pokemonEntity?.baseSPATK || 0, iv_sp_attack, ev_sp_attack, pokemon.level, natureMultipliers[3]);
        const finalSpDefense = computeFinalStat('special_defense', pokemonEntity?.baseSPDEF || 0, iv_sp_defense, ev_sp_defense, pokemon.level, natureMultipliers[4]);
        const finalSpeed = computeFinalStat('speed', pokemonEntity?.baseSPE || 0, iv_speed, ev_speed, pokemon.level, natureMultipliers[5]);
        
        // Return all generated data
        resolve({
          pokemonId: pokemon.id,
          trainerId: pokemon.trainer_id,
          speciesId: pokemon.species_id,
          pokemonEnumId: pokemon.pokemon_id,
          level: pokemon.level,
          otName,
          otId,
          nickname,
          happiness,
          gender,
          shiny,
          pokeballId,
          heldItemId,
          experiencePoints,
          dateMetAt,
          levelMetAt,
          currentHp,
          currentStrength,
          statusId,
          battlesWon: battleStats.battlesWon,
          battlesLost: battleStats.battlesLost,
          kills: battleStats.kills,
          deaths: battleStats.deaths,
          trainingEfficiency,
          abilityId,
          natureId,
          ev_hp,
          ev_attack,
          ev_defense,
          ev_sp_attack,
          ev_sp_defense,
          ev_speed,
          iv_hp,
          iv_attack,
          iv_defense,
          iv_sp_attack,
          iv_sp_defense,
          iv_speed,
          hp: finalHP,
          attack: finalAttack,
          defense: finalDefense,
          special_attack: finalSpAttack,
          special_defense: finalSpDefense,
          speed: finalSpeed,
        });
      });
    });
  });
}
