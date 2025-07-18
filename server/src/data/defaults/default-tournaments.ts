/* ============================================================
   Default data for the Indigo Conference (Kanto)
   ============================================================ */

/* ---------- 1.  Rule‑sets & rules ---------- */

export interface RuleSet {
  id: number;
  name: string;
  notes?: string;
}

export interface Rule {
  id: number;
  ruleSetId: number;
  key: string;
  value: string;
}

/*  • rs1 = Singles 3v3, no legendaries
    • rs2 = Singles 6v6, no legendaries (final stages)           */
export const defaultRuleSets: RuleSet[] = [
  { id: 1, name: 'Singles 3 v 3 - No Legend' },
  { id: 2, name: 'Singles 6 v 6 - No Legend' }
];

export const defaultRules: Rule[] = [
  // ---- rs1 ----
  { id: 1, ruleSetId: 1, key: 'battle_format',      value: 'singles' },
  { id: 2, ruleSetId: 1, key: 'max_team_size',      value: '3' },
  { id: 3, ruleSetId: 1, key: 'allow_legendary',    value: 'false' },
  { id: 4, ruleSetId: 1, key: 'field_policy',       value: 'neutral_only' },
  { id: 5, ruleSetId: 1, key: 'double_elimination', value: 'false' },

  // ---- rs2 ----
  { id: 6, ruleSetId: 2, key: 'battle_format',      value: 'singles' },
  { id: 7, ruleSetId: 2, key: 'max_team_size',      value: '6' },
  { id: 8, ruleSetId: 2, key: 'allow_legendary',    value: 'false' },
  { id: 9, ruleSetId: 2, key: 'field_policy',       value: 'neutral_only' },
  { id: 10, ruleSetId: 2, key: 'double_elimination', value: 'false' }
];

/* ---------- 2.  Tournament template ---------- */

export interface TournamentTemplate {
  id: number;
  name: string;
  description?: string;
  regionId?: number;
  frequency: 'one_off' | 'annual' | 'biennial' | 'seasonal' | 'monthly';
  startMonth?: number;
  teamType: 'single' | 'team';
  defaultRuleSetId?: number;
}

export const defaultTournamentTemplates: TournamentTemplate[] = [
  {
    id: 1,
    name: 'Indigo Conference',
    description:
      'Premier Kanto Pokémon League tournament. Held twice a year (January & July).',
    regionId: 1,               // Kanto
    frequency: 'seasonal',     // scheduler will spawn Jan & Jul
    startMonth: 1,             // first edition each year = January
    teamType: 'single',
    defaultRuleSetId: 1
  }
];

/* ---------- 3.  Stage templates ---------- */

export interface StageTemplate {
  id: number;
  tournamentTemplateId: number;
  seq: number;
  stageType: 'round_robin' | 'group' | 'single_elim' | 'double_elim' | 'swiss';
  participants?: number;
  groups?: number;
  bestOf?: number;
  ruleSetId?: number;
}

export const defaultStageTemplates: StageTemplate[] = [
  /* Initial group stage (pots A–G) */
  { id: 1, tournamentTemplateId: 1, seq: 1, stageType: 'group', groups: undefined, bestOf: 1, ruleSetId: 1 },

  /* Super‑group stage (64 groups) */
  { id: 2, tournamentTemplateId: 1, seq: 2, stageType: 'group', groups: 64,  bestOf: 1, ruleSetId: 1 },

  /*  Round‑of‑128 (3 v 3) */
  { id: 3, tournamentTemplateId: 1, seq: 3, stageType: 'single_elim', bestOf: 1, ruleSetId: 1 },

  /* Round‑of‑64 (3 v 3) */
  { id: 4, tournamentTemplateId: 1, seq: 4, stageType: 'single_elim', bestOf: 1, ruleSetId: 1 },

  /* Top‑32 onward (6 v 6 full battles) */
  { id: 5, tournamentTemplateId: 1, seq: 5, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },

  { id: 6, tournamentTemplateId: 1, seq: 6, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 }, // quarterfinals
  { id: 7, tournamentTemplateId: 1, seq: 7, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 }, // semifinals
  { id: 8, tournamentTemplateId: 1, seq: 8, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 }  // finals
];

/* ---------- 4.  Qualification rules ---------- */

export interface QualificationRule {
  id: number;
  tournamentTemplateId: number;
  criterionType: 'badge' | 'badge_count' | 'min_rating' | 'previous_winner' | 'invite_only';
  value: string;
  notes?: string;
}

export const defaultQualificationRules: QualificationRule[] = [
  { id: 1, tournamentTemplateId: 1, criterionType: 'badge_count', value: '8', notes: 'All eight Kanto Gym Badges' }
];

/* ---------- 5.  Prize pool ---------- */

export interface Prize {
  id: number;
  tournamentTemplateId: number;
  position: number;
  prizeType: 'cash' | 'item' | 'tournament_ticket' | 'title' | 'badge' | 'custom';
  value: string;
}

export const defaultPrizes: Prize[] = [
  { id: 1, tournamentTemplateId: 1, position: 1, prizeType: 'cash',  value: '1000000' },
  { id: 2, tournamentTemplateId: 1, position: 1, prizeType: 'badge', value: 'Indigo Conference Winner' },
  { id: 3, tournamentTemplateId: 1, position: 1, prizeType: 'tournament_ticket', value: 'KANTO_ELITE_FOUR_CHALLENGE' },

  { id: 4, tournamentTemplateId: 1, position: 2, prizeType: 'cash', value: '250000' },
  { id: 5, tournamentTemplateId: 1, position: 3, prizeType: 'cash', value: '100000' }, // semifinalists
  { id: 6, tournamentTemplateId: 1, position: 5, prizeType: 'cash', value: '50000'  }, // quarterfinalists
  { id: 7, tournamentTemplateId: 1, position: 9, prizeType: 'cash', value: '25000'  }, // round‑of‑16
  { id: 8, tournamentTemplateId: 1, position: 17, prizeType: 'cash', value: '10000' }  // round‑of‑32
];

export interface Badge {
  id: number;
  code: string;
  name: string;
  category: 'gym' | 'tournament' | 'conference' | 'league' | 'honor' | 'custom';
  regionId?: number;              
  image?: string;                 
  description?: string;
  tournamentTemplateId?: number;  
}

export interface TrainerBadge {
  trainerId: number;
  badgeId: number;
  awardedAt?: string;             // ISO date
  sourceEventId?: number;         // tournament_event FK
  notes?: string;
}

export const defaultBadges: Badge[] = [
  /* ---------- Kanto Gym Badges ---------- */
  { id: 1, code: 'boulder_badge',   name: 'Boulder Badge',   category: 'gym', regionId: 1, description: 'Awarded by the Moon City Gym.' },
  { id: 2, code: 'cascade_badge',   name: 'Cascade Badge',   category: 'gym', regionId: 1, description: 'Awarded by the Cerulean Gym.' },
  { id: 3, code: 'thunder_badge',   name: 'Thunder Badge',   category: 'gym', regionId: 1, description: 'Awarded by the Vermilion Gym.' },
  { id: 4, code: 'rainbow_badge',   name: 'Rainbow Badge',   category: 'gym', regionId: 1, description: 'Awarded by the Celadon Gym.' },
  { id: 5, code: 'soul_badge',      name: 'Soul Badge',      category: 'gym', regionId: 1, description: 'Awarded by the Fuchsia Gym.' },
  { id: 6, code: 'marsh_badge',     name: 'Marsh Badge',     category: 'gym', regionId: 1, description: 'Awarded by the Saffron Gym.' },
  { id: 7, code: 'crystal_badge',   name: 'Crystal Badge',   category: 'gym', regionId: 1, description: 'Awarded by the Storm Isle Gym.' },
  { id: 8, code: 'earth_badge',     name: 'Earth Badge',     category: 'gym', regionId: 1, description: 'Awarded by the Viridian Gym.' },
  { id: 9, code: 'phantom_badge',   name: 'Phantom Badge',   category: 'gym', regionId: 1, description: 'Awarded by the Lavender Gym.' },
  { id: 10, code: 'harmony_badge',   name: 'Harmony Badge',  category: 'gym', regionId: 1, description: 'Awarded by the Hop City Gym.' },
  { id: 11, code: 'starter_badge',   name: 'Starter Badge',   category: 'gym', regionId: 1, description: 'Awarded by the Pallet Town Gym.' },
  { id: 12, code: "alloy_badge",     name: 'Alloy Badge',     category: 'gym', regionId: 1, description: 'Awarded by the Gold Coast Gym.' },

  /* ---------- Indigo Conference Badges ---------- */
  { id: 101, code: 'indigo_conf_participant', name: 'Indigo Conference Participant', category: 'conference', regionId: 1, tournamentTemplateId: 1, description: 'Qualified for the Indigo Conference.' },
  { id: 102, code: 'indigo_conf_top32',       name: 'Indigo Conference Top 32',      category: 'conference', regionId: 1, tournamentTemplateId: 1, description: 'Reached the Top 32 of the Indigo Conference.' },
  { id: 103, code: 'indigo_conf_top16',       name: 'Indigo Conference Top 16',      category: 'conference', regionId: 1, tournamentTemplateId: 1, description: 'Reached the Round of 16.' },
  { id: 104, code: 'indigo_conf_top8',        name: 'Indigo Conference Quarterfinalist', category: 'conference', regionId: 1, tournamentTemplateId: 1, description: 'Reached the Quarterfinals.' },
  { id: 105, code: 'indigo_conf_top4',        name: 'Indigo Conference Semifinalist', category: 'conference', regionId: 1, tournamentTemplateId: 1, description: 'Reached the Semifinals.' },
  { id: 106, code: 'indigo_conf_finalist',    name: 'Indigo Conference Finalist',     category: 'conference', regionId: 1, tournamentTemplateId: 1, description: 'Runner-up of the Indigo Conference.' },
  { id: 107, code: 'indigo_conf_winner',      name: 'Indigo Conference Champion',     category: 'conference', regionId: 1, tournamentTemplateId: 1, description: 'Champion of the Indigo Conference.' }
];
