import sqlite3 from 'sqlite3';

interface Trainer {
  id: number;
  fname: string;
  lname: string;
  region_id: number;
  birthdate: string;
  pwtr_rating: number;
  peak_rating: number;
  peak_rank: number | null;
  active_status: boolean;
}

interface Badge {
  id: number;
  code: string;
  name: string;
  category: string;
  regionId: number | null;
  tournamentTemplateId: number | null;
}

interface TournamentTemplate {
  id: number;
  name: string;
  regionId: number;
  frequency: string; // 'annual' or 'biennial'
  startMonth: number;
}

interface TrainerBadgeRecord {
  trainer_id: number;
  badge_id: number;
  awarded_at: string;
  source_event_id: null;
  notes: string;
}

interface TournamentDate {
  year: number;
  month: number;
  regionId: number;
  tournamentId: number;
}

// Region start years
const REGION_START_YEARS: { [key: number]: number } = {
  1: 1996, // Kanto
  2: 1999, // Johto
  3: 2002, // Hoenn
  4: 2004, // Sinnoh
  5: 2004, // Unova
  6: 2006, // Kalos
  7: 2006, // Alola
  8: 2012  // Galar
};

// Conference badge tiers (participant, top32, top16, quarterfinalist, semifinalist, finalist, champion)
const CONFERENCE_BADGE_OFFSETS = {
  participant: 0,
  top32: 1,
  top16: 2,
  quarterfinalist: 3,
  semifinalist: 4,
  finalist: 5,
  champion: 6
};

/**
 * Get all trainers from database
 */
function getAllTrainers(db: sqlite3.Database): Promise<Trainer[]> {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT id, fname, lname, region_id, birthdate, pwtr_rating, peak_rating, peak_rank, active_status FROM trainer',
      (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as Trainer[]);
        }
      }
    );
  });
}

/**
 * Get all badges from database
 */
function getAllBadges(db: sqlite3.Database): Promise<Badge[]> {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT id, code, name, category, region_id as regionId, tournament_template_id as tournamentTemplateId FROM badge',
      (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as Badge[]);
        }
      }
    );
  });
}

/**
 * Get all tournament templates from database
 */
function getTournamentTemplates(db: sqlite3.Database): Promise<TournamentTemplate[]> {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT id, name, region_id as regionId, frequency, start_month as startMonth FROM tournament_template',
      (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as TournamentTemplate[]);
        }
      }
    );
  });
}

/**
 * Get existing trainer badges from database
 */
function getExistingBadges(db: sqlite3.Database): Promise<{ trainer_id: number; badge_id: number; awarded_at: string }[]> {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT trainer_id, badge_id, awarded_at FROM trainer_badge',
      (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

/**
 * Calculate age of trainer at a given date
 */
function getAgeAtDate(birthdate: string, targetDate: Date): number {
  const birth = new Date(birthdate);
  let age = targetDate.getFullYear() - birth.getFullYear();
  const monthDiff = targetDate.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && targetDate.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Generate random date when trainer was between minAge and maxAge
 */
function getRandomAgeDate(birthdate: string, minAge: number, maxAge: number, earliestYear: number): string {
  const birth = new Date(birthdate);
  const minYear = Math.max(birth.getFullYear() + minAge, earliestYear);
  const maxYear = birth.getFullYear() + maxAge;
  
  const year = minYear + Math.floor(Math.random() * (maxYear - minYear + 1));
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1; // Safe for all months
  
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Generate gym badges for trainers based on their rating
 */
function generateGymBadges(
  trainers: Trainer[],
  badges: Badge[],
  existingBadges: Set<string>,
  trainerBadges: Map<number, TrainerBadgeRecord[]>
): TrainerBadgeRecord[] {
  const generatedBadges: TrainerBadgeRecord[] = [];
  const gymBadgesByRegion: { [regionId: number]: Badge[] } = {};
  
  // Group gym badges by region
  badges.forEach(badge => {
    if (badge.category === 'gym' && badge.regionId) {
      if (!gymBadgesByRegion[badge.regionId]) {
        gymBadgesByRegion[badge.regionId] = [];
      }
      gymBadgesByRegion[badge.regionId].push(badge);
    }
  });
  
  trainers.forEach(trainer => {
    const regionsToAward: number[] = [];
    
    // Check if trainer has any championship badges and get their regions
    const championshipRegions = new Set<number>();
    const existingTrainerBadges = trainerBadges.get(trainer.id) || [];
    existingTrainerBadges.forEach(tb => {
      const badge = badges.find(b => b.id === tb.badge_id);
      if (badge?.category === 'conference' && badge.code.includes('winner') && badge.regionId) {
        championshipRegions.add(badge.regionId);
      }
    });
    
    // Award gym badges for all regions where trainer has championships
    championshipRegions.forEach(regionId => {
      if (!regionsToAward.includes(regionId)) {
        regionsToAward.push(regionId);
      }
    });
    
    // Always consider home region if rating >= 3100
    if (trainer.pwtr_rating >= 3100 && !regionsToAward.includes(trainer.region_id)) {
      regionsToAward.push(trainer.region_id);
    }
    
    // High-rated trainers might have badges from multiple regions
    if (trainer.pwtr_rating >= 3700) {
      const numExtraRegions = Math.floor(Math.random() * 3); // 0-2 extra regions
      const availableRegions = Object.keys(gymBadgesByRegion)
        .map(Number)
        .filter(r => r !== trainer.region_id && !regionsToAward.includes(r) && REGION_START_YEARS[r]);
      
      for (let i = 0; i < numExtraRegions && availableRegions.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableRegions.length);
        const region = availableRegions.splice(randomIndex, 1)[0];
        
        // Tail probability: higher rating = more likely
        const prob = (trainer.pwtr_rating - 3700) / 500;
        if (Math.random() < prob) {
          regionsToAward.push(region);
        }
      }
    }
    
    // Award 8 badges per region
    regionsToAward.forEach(regionId => {
      const regionBadges = gymBadgesByRegion[regionId];
      if (!regionBadges || regionBadges.length === 0) return;
      
      // Check if trainer has championships in this region - if so, get earliest date
      const championshipsInRegion = existingTrainerBadges.filter(tb => {
        const badge = badges.find(b => b.id === tb.badge_id);
        return badge?.category === 'conference' && badge.code.includes('winner') && badge.regionId === regionId;
      });
      
      let earliestChampionshipDate: Date | null = null;
      if (championshipsInRegion.length > 0) {
        const dates = championshipsInRegion.map(tb => new Date(tb.awarded_at));
        earliestChampionshipDate = new Date(Math.min(...dates.map(d => d.getTime())));
      }
      
      // Randomly select 8 badges (or all if less than 8)
      const numToAward = Math.min(8, regionBadges.length);
      const shuffled = [...regionBadges].sort(() => Math.random() - 0.5);
      const selectedBadges = shuffled.slice(0, numToAward);
      
      selectedBadges.forEach(badge => {
        const key = `${trainer.id}-${badge.id}`;
        if (!existingBadges.has(key)) {
          let awardDate: string;
          
          if (earliestChampionshipDate) {
            // Award gym badge before the championship date
            const championshipYear = earliestChampionshipDate.getFullYear();
            const birth = new Date(trainer.birthdate);
            const minYear = Math.max(birth.getFullYear() + 10, REGION_START_YEARS[regionId] || 1996);
            const maxYear = championshipYear - 1; // At least 1 year before championship
            
            if (maxYear >= minYear) {
              const year = minYear + Math.floor(Math.random() * (maxYear - minYear + 1));
              const month = Math.floor(Math.random() * 12) + 1;
              const day = Math.floor(Math.random() * 28) + 1;
              awardDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            } else {
              // Championship was very early, use same year but earlier month
              const month = Math.max(1, earliestChampionshipDate.getMonth() - 1);
              const day = Math.floor(Math.random() * 28) + 1;
              awardDate = `${championshipYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
          } else {
            awardDate = getRandomAgeDate(
              trainer.birthdate,
              10,
              24,
              REGION_START_YEARS[regionId] || 1996
            );
          }
          
          generatedBadges.push({
            trainer_id: trainer.id,
            badge_id: badge.id,
            awarded_at: awardDate,
            source_event_id: null,
            notes: `Gym badge earned in ${badge.name}`
          });
          
          existingBadges.add(key);
        }
      });
    });
  });
  
  return generatedBadges;
}

/**
 * Generate all tournament dates from start year to 2025
 */
function generateTournamentDates(templates: TournamentTemplate[]): TournamentDate[] {
  const dates: TournamentDate[] = [];
  const currentYear = 2025;
  
  templates.forEach(template => {
    const startYear = REGION_START_YEARS[template.regionId];
    if (!startYear) return;
    
    for (let year = startYear; year <= currentYear; year++) {
      if (template.frequency === 'annual') {
        // Once per year
        dates.push({
          year,
          month: template.startMonth,
          regionId: template.regionId,
          tournamentId: template.id
        });
      } else if (template.frequency === 'biennial') {
        // Twice per year: startMonth and startMonth + 6
        dates.push({
          year,
          month: template.startMonth,
          regionId: template.regionId,
          tournamentId: template.id
        });
        
        const secondMonth = template.startMonth + 6;
        if (secondMonth <= 12) {
          dates.push({
            year,
            month: secondMonth,
            regionId: template.regionId,
            tournamentId: template.id
          });
        }
      }
    }
  });
  
  return dates.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    if (a.month !== b.month) return a.month - b.month;
    return a.tournamentId - b.tournamentId;
  });
}

/**
 * Check if trainer has 8 badges in a region by a certain date
 */
function hasEightBadges(
  trainerId: number,
  regionId: number,
  byDate: Date,
  trainerBadges: Map<number, TrainerBadgeRecord[]>,
  badges: Badge[]
): boolean {
  const badgeRecords = trainerBadges.get(trainerId) || [];
  const gymBadgeIds = new Set(
    badges.filter(b => b.category === 'gym' && b.regionId === regionId).map(b => b.id)
  );
  
  let count = 0;
  for (const record of badgeRecords) {
    if (gymBadgeIds.has(record.badge_id)) {
      const awardDate = new Date(record.awarded_at);
      if (awardDate <= byDate) {
        count++;
        if (count >= 8) return true;
      }
    }
  }
  
  return false;
}

/**
 * Check if trainer has already won a tournament (has champion badge)
 */
function hasWonTournament(
  trainerId: number,
  tournamentId: number,
  trainerBadges: Map<number, TrainerBadgeRecord[]>,
  badges: Badge[]
): boolean {
  const badgeRecords = trainerBadges.get(trainerId) || [];
  const championBadgeId = badges.find(
    b => b.category === 'conference' && 
         b.tournamentTemplateId === tournamentId && 
         b.code.includes('winner')
  )?.id;
  
  if (!championBadgeId) return false;
  
  return badgeRecords.some(r => r.badge_id === championBadgeId);
}

/**
 * Check if trainer already participated in this region's tournament this year
 */
function alreadyParticipatedThisYear(
  trainerId: number,
  regionId: number,
  year: number,
  trainerBadges: Map<number, TrainerBadgeRecord[]>
): boolean {
  const badgeRecords = trainerBadges.get(trainerId) || [];
  
  for (const record of badgeRecords) {
    const awardYear = new Date(record.awarded_at).getFullYear();
    if (awardYear === year && record.notes.includes('Conference')) {
      // Check if it's for this region
      if (record.notes.toLowerCase().includes('conference')) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Calculate weight for trainer in a tournament based on various factors
 */
function calculateTournamentWeight(
  trainer: Trainer,
  tournamentDate: Date,
  tournamentYear: number
): number {
  let weight = 1;
  
  // Age factor (prime: 18-35)
  const age = getAgeAtDate(trainer.birthdate, tournamentDate);
  if (age >= 18 && age <= 35) {
    weight *= 2.0;
  } else if (age >= 14 && age < 18) {
    weight *= 1.3;
  } else if (age > 35 && age <= 45) {
    weight *= 1.5;
  } else if (age < 14 || age > 45) {
    weight *= 0.3;
  }
  
  // Peak rating factor - top trainers have MUCH bigger advantage
  if (trainer.peak_rating >= 4000) {
    weight *= 80.0;
  } else if (trainer.peak_rating >= 3800) {
    weight *= 50.0;
  } else if (trainer.peak_rating >= 3600) {
    weight *= 10.0;
  } else if (trainer.peak_rating >= 3400) {
    weight *= 3.0;
  }
  
  // Peak rank factor - even stronger advantage
  if (trainer.peak_rank !== null) {
    if (trainer.peak_rank <= 10) {
      weight *= 5.0;
    } else if (trainer.peak_rank <= 50) {
      weight *= 3.0;
    } else if (trainer.peak_rank <= 100) {
      weight *= 2.0;
    }
  }
  
  // Historical factor: older tournaments favor trainers born earlier
  const birthYear = new Date(trainer.birthdate).getFullYear();
  const yearDiff = tournamentYear - birthYear - 20; // Assume prime at 20
  
  if (tournamentYear < 2005) {
    // Old tournaments: heavily favor older trainers
    if (birthYear < 1985) {
      weight *= 2.0;
    } else if (birthYear < 1990) {
      weight *= 1.5;
    } else {
      weight *= 0.5;
    }
  } else if (tournamentYear >= 2015) {
    // Recent tournaments: favor younger trainers
    if (birthYear >= 1995) {
      weight *= 1.8;
    } else if (birthYear >= 1990) {
      weight *= 1.3;
    } else {
      weight *= 0.7;
    }
  }
  
  // Random factor for variety
  weight *= (0.5 + Math.random() * 1.5);
  
  return weight;
}

/**
 * Generate tournament placement badges
 */
function generateTournamentBadges(
  trainers: Trainer[],
  badges: Badge[],
  templates: TournamentTemplate[],
  tournamentDates: TournamentDate[],
  existingBadges: Set<string>,
  trainerBadges: Map<number, TrainerBadgeRecord[]>
): TrainerBadgeRecord[] {
  const generatedBadges: TrainerBadgeRecord[] = [];
  
  // Process each tournament date
  tournamentDates.forEach(tournDate => {
    const template = templates.find(t => t.id === tournDate.tournamentId);
    if (!template) return;
    
    const tournamentDate = new Date(tournDate.year, tournDate.month - 1, 15);
    
    // Find eligible trainers
    const eligible = trainers.filter(trainer => {
      // Must have 8 badges in this region by this date
      if (!hasEightBadges(trainer.id, tournDate.regionId, tournamentDate, trainerBadges, badges)) {
        return false;
      }
      
      // Cannot have already won this tournament
      if (hasWonTournament(trainer.id, tournDate.tournamentId, trainerBadges, badges)) {
        return false;
      }
      
      // Cannot have participated in same region this year
      if (alreadyParticipatedThisYear(trainer.id, tournDate.regionId, tournDate.year, trainerBadges)) {
        return false;
      }
      
      // Random chance to not participate (even if eligible)
      // Higher-rated trainers more likely to participate
      const participationProb = Math.min(0.8, trainer.pwtr_rating / 5000);
      if (Math.random() > participationProb) {
        return false;
      }
      
      // Trainers with previous championships VERY unlikely to participate in different region
      const hasChampionship = Array.from(trainerBadges.get(trainer.id) || []).some(b => {
        const badge = badges.find(bg => bg.id === b.badge_id);
        return badge?.category === 'conference' && badge.code.includes('winner');
      });
      
      if (hasChampionship && trainer.region_id !== tournDate.regionId) {
        // Extremely low chance to participate in different region if already champion
        return Math.random() < 0.01;
      }
      
      return true;
    });
    
    if (eligible.length === 0) return;
    
    // Calculate weights for all eligible trainers
    const weighted = eligible.map(trainer => ({
      trainer,
      weight: calculateTournamentWeight(trainer, tournamentDate, tournDate.year)
    }));
    
    // Define placements to fill
    const placements: { count: number; tier: string }[] = [
      { count: 1, tier: 'finalist' },
      { count: 2, tier: 'semifinalist' },
      { count: 4, tier: 'quarterfinalist' },
      { count: 8, tier: 'top16' },
      { count: 16, tier: 'top32' }
    ];
    
    const selectedTrainers = new Set<number>();
    
    // For each placement tier
    placements.forEach(placement => {
      // Some spots might go to non-default trainers (retired players)
      const nonDefaultProb = tournDate.year < 2010 ? 0.3 : 0.1;
      const numToSelect = Math.floor(placement.count * (1 - nonDefaultProb));
      
      // Select trainers for this tier
      const available = weighted.filter(w => !selectedTrainers.has(w.trainer.id));
      if (available.length === 0) return;
      
      // Sort by weight and select top trainers (with some randomness)
      const sorted = available.sort((a, b) => b.weight - a.weight);
      const selected = sorted.slice(0, Math.min(numToSelect, sorted.length));
      
      selected.forEach(({ trainer }) => {
        selectedTrainers.add(trainer.id);
        
        // Generate single date for ALL badges from this tournament (20-28 of the month)
        const day = 20 + Math.floor(Math.random() * 9);
        const awardDate = `${tournDate.year}-${String(tournDate.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Award all badges from top32 up to this placement
        const badgeTiers = ['top32', 'top16', 'top8', 'top4', 'finalist'];
        const endIndex = badgeTiers.indexOf(placement.tier === 'quarterfinalist' ? 'top8' : 
                                           placement.tier === 'semifinalist' ? 'top4' : placement.tier);
        
        for (let i = 0; i <= endIndex; i++) {
          const tier = badgeTiers[i];
          const badgeId = getBadgeIdForTier(template.id, tier, badges);
          
          if (badgeId) {
            const key = `${trainer.id}-${badgeId}`;
            if (!existingBadges.has(key)) {
              const badge: TrainerBadgeRecord = {
                trainer_id: trainer.id,
                badge_id: badgeId,
                awarded_at: awardDate,
                source_event_id: null,
                notes: `${template.name} ${tier.replace('top', 'Top ')} - ${tournDate.month}/${tournDate.year}`
              };
              
              generatedBadges.push(badge);
              existingBadges.add(key);
              
              // Add to trainer's badge list
              if (!trainerBadges.has(trainer.id)) {
                trainerBadges.set(trainer.id, []);
              }
              trainerBadges.get(trainer.id)!.push(badge);
            }
          }
        }
      });
    });
  });
  
  return generatedBadges;
}

/**
 * Get badge ID for a specific tournament tier
 */
function getBadgeIdForTier(
  tournamentTemplateId: number,
  tier: string,
  badges: Badge[]
): number | null {
  const badge = badges.find(b => 
    b.category === 'conference' && 
    b.tournamentTemplateId === tournamentTemplateId &&
    b.code.includes(tier.replace('top', 'top'))
  );
  return badge?.id || null;
}

/**
 * Award badges to existing champions if they don't have lower-tier badges
 */
function awardChampionPreviousBadges(
  badges: Badge[],
  existingBadges: Set<string>,
  trainerBadges: Map<number, TrainerBadgeRecord[]>
): TrainerBadgeRecord[] {
  const generatedBadges: TrainerBadgeRecord[] = [];
  
  // Find all trainers with champion badges
  trainerBadges.forEach((badgeList, trainerId) => {
    badgeList.forEach(badgeRecord => {
      const badge = badges.find(b => b.id === badgeRecord.badge_id);
      if (badge?.code.includes('winner')) {
        // This is a champion badge
        const template = badge.tournamentTemplateId;
        if (!template) return;
        
        // Award all lower-tier badges if not already awarded
        const tiers = ['top32', 'top16', 'top8', 'top4', 'finalist'];
        tiers.forEach(tier => {
          const tierBadgeId = getBadgeIdForTier(template, tier, badges);
          if (tierBadgeId) {
            const key = `${trainerId}-${tierBadgeId}`;
            if (!existingBadges.has(key)) {
              generatedBadges.push({
                trainer_id: trainerId,
                badge_id: tierBadgeId,
                awarded_at: badgeRecord.awarded_at, // Same date as championship
                source_event_id: null,
                notes: `Awarded with championship - ${badgeRecord.notes}`
              });
              existingBadges.add(key);
              trainerBadges.get(trainerId)!.push(generatedBadges[generatedBadges.length - 1]);
            }
          }
        });
      }
    });
  });
  
  return generatedBadges;
}

/**
 * Main function to populate badge ownership for all trainers
 */
export const populateBadgeOwnership = async (db: sqlite3.Database): Promise<void> => {
  console.log('Starting badge ownership generation...');
  
  // Fetch all necessary data
  const trainers = await getAllTrainers(db);
  const badges = await getAllBadges(db);
  const templates = await getTournamentTemplates(db);
  const existingBadgeRecords = await getExistingBadges(db);
  
  console.log(`Loaded ${trainers.length} trainers, ${badges.length} badges, ${templates.length} tournament templates`);
  console.log(`Found ${existingBadgeRecords.length} existing badge records`);
  
  // Create set of existing badges for quick lookup
  const existingBadges = new Set<string>(
    existingBadgeRecords.map(b => `${b.trainer_id}-${b.badge_id}`)
  );
  
  // Create map of trainer badges for tournament logic
  const trainerBadges = new Map<number, TrainerBadgeRecord[]>();
  existingBadgeRecords.forEach(record => {
    if (!trainerBadges.has(record.trainer_id)) {
      trainerBadges.set(record.trainer_id, []);
    }
    trainerBadges.get(record.trainer_id)!.push({
      trainer_id: record.trainer_id,
      badge_id: record.badge_id,
      awarded_at: record.awarded_at,
      source_event_id: null,
      notes: ''
    });
  });
  
  // Step 1: Award previous badges to existing champions FIRST
  console.log('Awarding previous badges to champions...');
  const championPreviousBadges = awardChampionPreviousBadges(badges, existingBadges, trainerBadges);
  console.log(`Generated ${championPreviousBadges.length} badges for champions`);
  
  // Step 2: Generate gym badges (will now check for championships and award before them)
  console.log('Generating gym badges...');
  const gymBadges = generateGymBadges(trainers, badges, existingBadges, trainerBadges);
  console.log(`Generated ${gymBadges.length} gym badges`);
  
  // Add gym badges to trainer badge map
  gymBadges.forEach(badge => {
    if (!trainerBadges.has(badge.trainer_id)) {
      trainerBadges.set(badge.trainer_id, []);
    }
    trainerBadges.get(badge.trainer_id)!.push(badge);
  });
  
  // Step 3: Generate tournament dates
  console.log('Generating tournament schedule...');
  const tournamentDates = generateTournamentDates(templates);
  console.log(`Generated ${tournamentDates.length} tournament dates`);
  
  // Step 4: Generate tournament placement badges
  console.log('Generating tournament placement badges...');
  const tournamentBadges = generateTournamentBadges(
    trainers,
    badges,
    templates,
    tournamentDates,
    existingBadges,
    trainerBadges
  );
  console.log(`Generated ${tournamentBadges.length} tournament placement badges`);
  
  // Combine all generated badges
  const allGeneratedBadges = [
    ...championPreviousBadges,
    ...gymBadges,
    ...tournamentBadges
  ];
  
  console.log(`Total badges to insert: ${allGeneratedBadges.length}`);
  
  // Insert all badges in a transaction
  return new Promise((resolve, reject) => {
    if (allGeneratedBadges.length === 0) {
      console.log('No badges to insert');
      resolve();
      return;
    }
    
    const insertSql = `
      INSERT INTO trainer_badge (trainer_id, badge_id, awarded_at, source_event_id, notes)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    db.serialize(() => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        let completed = 0;
        const total = allGeneratedBadges.length;
        
        allGeneratedBadges.forEach(badge => {
          db.run(
            insertSql,
            [badge.trainer_id, badge.badge_id, badge.awarded_at, badge.source_event_id, badge.notes],
            (err) => {
              if (err) {
                console.error(`Error inserting badge for trainer ${badge.trainer_id}:`, err);
                db.run('ROLLBACK');
                reject(err);
                return;
              }
              
              completed++;
              if (completed % 1000 === 0) {
                console.log(`Inserted ${completed}/${total} badges...`);
              }
              
              if (completed === total) {
                db.run('COMMIT', (commitErr) => {
                  if (commitErr) {
                    reject(commitErr);
                  } else {
                    console.log(`Successfully inserted ${total} badge ownership records`);
                    resolve();
                  }
                });
              }
            }
          );
        });
      });
    });
  });
};
