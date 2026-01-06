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
    frequency: 'biennial',     // scheduler will spawn Jan & Jul
    startMonth: 1,             // first edition each year = January
    teamType: 'single',
    defaultRuleSetId: 1
  },
  {
    id: 2,
    name: 'Silver Conference',
    description:
      'Premier Johto Pokémon League tournament. Held twice a year (March & September).',
    regionId: 2,               // Johto
    frequency: 'biennial',
    startMonth: 3,             // March
    teamType: 'single',
    defaultRuleSetId: 1
  },
  {
    id: 3,
    name: 'Ever Grande Conference',
    description:
      'Premier Hoenn Pokémon League tournament. Held twice a year (February & August).',
    regionId: 3,               // Hoenn
    frequency: 'biennial',
    startMonth: 2,             // February
    teamType: 'single',
    defaultRuleSetId: 1
  },
  {
    id: 4,
    name: 'Lily of the Valley Conference',
    description:
      'Premier Sinnoh Pokémon League tournament. Held annually in August.',
    regionId: 4,               // Sinnoh
    frequency: 'annual',
    startMonth: 8,             // August
    teamType: 'single',
    defaultRuleSetId: 1
  },
  {
    id: 5,
    name: 'Vertress Conference',
    description:
      'Premier Unova Pokémon League tournament. Held twice a year (June & December).',
    regionId: 5,               // Unova
    frequency: 'biennial',
    startMonth: 6,             // June
    teamType: 'single',
    defaultRuleSetId: 1
  },
  {
    id: 6,
    name: 'Lumiose Conference',
    description:
      'Premier Kalos Pokémon League tournament. Held annually in November.',
    regionId: 6,               // Kalos
    frequency: 'annual',
    startMonth: 11,            // November
    teamType: 'single',
    defaultRuleSetId: 1
  },
  {
    id: 7,
    name: 'Manalo Conference',
    description:
      'Premier Alola Pokémon League tournament. Held twice a year (February & August).',
    regionId: 7,               // Alola
    frequency: 'biennial',
    startMonth: 2,             // February
    teamType: 'single',
    defaultRuleSetId: 1
  },
  {
    id: 8,
    name: 'Wyndon Conference',
    description:
      'Premier Galar Pokémon League tournament. Held twice a year (April & October).',
    regionId: 8,               // Galar
    frequency: 'biennial',
    startMonth: 4,             // April
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
  { id: 1, tournamentTemplateId: 1, seq: 1, stageType: 'group', groups: 1, bestOf: 6, ruleSetId: 1 },

  /* Super‑group stage (64 groups) */
  { id: 2, tournamentTemplateId: 1, seq: 2, participants: 384, stageType: 'group', groups: 64, bestOf: 5, ruleSetId: 1 },

  /*  Round‑of‑128 (3 v 3) */
  { id: 3, tournamentTemplateId: 1, seq: 3, participants: 128, stageType: 'single_elim', bestOf: 1, ruleSetId: 1 },

  /* Round‑of‑64 (3 v 3) */
  { id: 4, tournamentTemplateId: 1, seq: 4, participants: 64, stageType: 'single_elim', bestOf: 1, ruleSetId: 1 },

  /* Top‑32 onward (6 v 6 full battles) */
  { id: 5, tournamentTemplateId: 1, seq: 5, participants: 32, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 6, tournamentTemplateId: 1, seq: 6, participants: 16, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 }, // round of 16
  { id: 7, tournamentTemplateId: 1, seq: 7, participants: 8, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 }, // quarterfinals
  { id: 8, tournamentTemplateId: 1, seq: 8, participants: 4, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },  // semifinals
  { id: 9, tournamentTemplateId: 1, seq: 9, participants: 2, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },  // finals

  /* ========== SILVER CONFERENCE (Johto) ========== */
  /* Initial group stage */
  { id: 10, tournamentTemplateId: 2, seq: 1, stageType: 'group', groups: 1, bestOf: 10, ruleSetId: 1 },
  /* Round‑of‑128 */
  { id: 11, tournamentTemplateId: 2, seq: 2, participants: 128, stageType: 'single_elim', bestOf: 1, ruleSetId: 1 },
  /* Round‑of‑64 */
  { id: 12, tournamentTemplateId: 2, seq: 3, participants: 64, stageType: 'single_elim', bestOf: 1, ruleSetId: 1 },
  /* Round‑of‑32 (6v6) */
  { id: 13, tournamentTemplateId: 2, seq: 4, participants: 32, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 14, tournamentTemplateId: 2, seq: 5, participants: 16, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 15, tournamentTemplateId: 2, seq: 6, participants: 8, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 16, tournamentTemplateId: 2, seq: 7, participants: 4, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 17, tournamentTemplateId: 2, seq: 8, participants: 2, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },

  /* ========== EVER GRANDE CONFERENCE (Hoenn) ========== */
  /* Initial group stage */
  { id: 18, tournamentTemplateId: 3, seq: 1, stageType: 'group', bestOf: 5, ruleSetId: 1 },
  /* Second group stage (128 groups, 768 participants) */
  { id: 19, tournamentTemplateId: 3, seq: 2, participants: 768, stageType: 'group', groups: 128, bestOf: 5, ruleSetId: 1 },
  /* Round‑of‑256 */
  { id: 20, tournamentTemplateId: 3, seq: 3, participants: 256, stageType: 'single_elim', bestOf: 1, ruleSetId: 1 },
  /* Round‑of‑128 */
  { id: 21, tournamentTemplateId: 3, seq: 4, participants: 128, stageType: 'single_elim', bestOf: 1, ruleSetId: 1 },
  /* Round‑of‑64 */
  { id: 22, tournamentTemplateId: 3, seq: 5, participants: 64, stageType: 'single_elim', bestOf: 1, ruleSetId: 1 },
  /* Round‑of‑32 (6v6) */
  { id: 23, tournamentTemplateId: 3, seq: 6, participants: 32, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 24, tournamentTemplateId: 3, seq: 7, participants: 16, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 25, tournamentTemplateId: 3, seq: 8, participants: 8, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 26, tournamentTemplateId: 3, seq: 9, participants: 4, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 27, tournamentTemplateId: 3, seq: 10, participants: 2, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },

  /* ========== LILY OF THE VALLEY CONFERENCE (Sinnoh) ========== */
  /* Initial group stage */
  { id: 28, tournamentTemplateId: 4, seq: 1, stageType: 'group', bestOf: 5, ruleSetId: 1 },
  /* Second group stage (128 groups, 768 participants) */
  { id: 29, tournamentTemplateId: 4, seq: 2, participants: 768, stageType: 'group', groups: 128, bestOf: 5, ruleSetId: 1 },
  /* Round‑of‑256 */
  { id: 30, tournamentTemplateId: 4, seq: 3, participants: 256, stageType: 'single_elim', bestOf: 1, ruleSetId: 1 },
  /* Round‑of‑128 */
  { id: 31, tournamentTemplateId: 4, seq: 4, participants: 128, stageType: 'single_elim', bestOf: 1, ruleSetId: 1 },
  /* Round‑of‑64 */
  { id: 32, tournamentTemplateId: 4, seq: 5, participants: 64, stageType: 'single_elim', bestOf: 1, ruleSetId: 1 },
  /* Round‑of‑32 (6v6) */
  { id: 33, tournamentTemplateId: 4, seq: 6, participants: 32, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 34, tournamentTemplateId: 4, seq: 7, participants: 16, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 35, tournamentTemplateId: 4, seq: 8, participants: 8, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 36, tournamentTemplateId: 4, seq: 9, participants: 4, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 37, tournamentTemplateId: 4, seq: 10, participants: 2, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },

  /* ========== VERTRESS CONFERENCE (Unova) ========== */
  /* Initial group stage */
  { id: 38, tournamentTemplateId: 5, seq: 1, stageType: 'group', bestOf: 9, ruleSetId: 1 },
  /* Second group stage (64 groups, 384 participants) */
  { id: 39, tournamentTemplateId: 5, seq: 2, participants: 384, stageType: 'group', groups: 64, bestOf: 5, ruleSetId: 1 },
  /* Round‑of‑128 */
  { id: 40, tournamentTemplateId: 5, seq: 3, participants: 128, stageType: 'single_elim', bestOf: 1, ruleSetId: 1 },
  /* Round‑of‑64 */
  { id: 41, tournamentTemplateId: 5, seq: 4, participants: 64, stageType: 'single_elim', bestOf: 1, ruleSetId: 1 },
  /* Round‑of‑32 (6v6) */
  { id: 42, tournamentTemplateId: 5, seq: 5, participants: 32, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 43, tournamentTemplateId: 5, seq: 6, participants: 16, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 44, tournamentTemplateId: 5, seq: 7, participants: 8, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 45, tournamentTemplateId: 5, seq: 8, participants: 4, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 46, tournamentTemplateId: 5, seq: 9, participants: 2, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },

  /* ========== LUMIOSE CONFERENCE (Kalos) ========== */
  /* Initial group stage */
  { id: 47, tournamentTemplateId: 6, seq: 1, stageType: 'group', bestOf: 5, ruleSetId: 1 },
  /* Second group stage (128 groups, 896 participants) */
  { id: 48, tournamentTemplateId: 6, seq: 2, participants: 896, stageType: 'group', groups: 128, bestOf: 6, ruleSetId: 1 },
  /* Round‑of‑256 */
  { id: 49, tournamentTemplateId: 6, seq: 3, participants: 256, stageType: 'single_elim', bestOf: 1, ruleSetId: 1 },
  /* Round‑of‑128 */
  { id: 50, tournamentTemplateId: 6, seq: 4, participants: 128, stageType: 'single_elim', bestOf: 1, ruleSetId: 1 },
  /* Round‑of‑64 */
  { id: 51, tournamentTemplateId: 6, seq: 5, participants: 64, stageType: 'single_elim', bestOf: 1, ruleSetId: 1 },
  /* Round‑of‑32 (6v6) */
  { id: 52, tournamentTemplateId: 6, seq: 6, participants: 32, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 53, tournamentTemplateId: 6, seq: 7, participants: 16, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 54, tournamentTemplateId: 6, seq: 8, participants: 8, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 55, tournamentTemplateId: 6, seq: 9, participants: 4, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 56, tournamentTemplateId: 6, seq: 10, participants: 2, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },

  /* ========== MANALO CONFERENCE (Alola) ========== */
  /* Initial group stage */
  { id: 57, tournamentTemplateId: 7, seq: 1, stageType: 'group', groups: 1, bestOf: 7, ruleSetId: 1 },
  /* Round‑of‑256 */
  { id: 58, tournamentTemplateId: 7, seq: 2, participants: 256, stageType: 'single_elim', bestOf: 1, ruleSetId: 1 },
  /* Round‑of‑128 */
  { id: 59, tournamentTemplateId: 7, seq: 3, participants: 128, stageType: 'single_elim', bestOf: 1, ruleSetId: 1 },
  /* Round‑of‑64 */
  { id: 60, tournamentTemplateId: 7, seq: 4, participants: 64, stageType: 'single_elim', bestOf: 1, ruleSetId: 1 },
  /* Round‑of‑32 (6v6) */
  { id: 61, tournamentTemplateId: 7, seq: 5, participants: 32, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 62, tournamentTemplateId: 7, seq: 6, participants: 16, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 63, tournamentTemplateId: 7, seq: 7, participants: 8, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 64, tournamentTemplateId: 7, seq: 8, participants: 4, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 65, tournamentTemplateId: 7, seq: 9, participants: 2, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },

  /* ========== WYNDON CONFERENCE (Galar) ========== */
  /* Initial group stage */
  { id: 66, tournamentTemplateId: 8, seq: 1, stageType: 'group', bestOf: 5, ruleSetId: 1 },
  /* Second group stage (128 groups, 768 participants) */
  { id: 67, tournamentTemplateId: 8, seq: 2, participants: 768, stageType: 'group', groups: 128, bestOf: 5, ruleSetId: 1 },
  /* Round‑of‑256 */
  { id: 68, tournamentTemplateId: 8, seq: 3, participants: 256, stageType: 'single_elim', bestOf: 1, ruleSetId: 1 },
  /* Round‑of‑128 */
  { id: 69, tournamentTemplateId: 8, seq: 4, participants: 128, stageType: 'single_elim', bestOf: 1, ruleSetId: 1 },
  /* Round‑of‑64 */
  { id: 70, tournamentTemplateId: 8, seq: 5, participants: 64, stageType: 'single_elim', bestOf: 1, ruleSetId: 1 },
  /* Round‑of‑32 (6v6) */
  { id: 71, tournamentTemplateId: 8, seq: 6, participants: 32, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 72, tournamentTemplateId: 8, seq: 7, participants: 16, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 73, tournamentTemplateId: 8, seq: 8, participants: 8, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 74, tournamentTemplateId: 8, seq: 9, participants: 4, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
  { id: 75, tournamentTemplateId: 8, seq: 10, participants: 2, stageType: 'single_elim', bestOf: 1, ruleSetId: 2 },
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
  { id: 1, tournamentTemplateId: 1, criterionType: 'badge_count', value: '8, 1', notes: 'All eight Kanto Gym Badges' },
  { id: 2, tournamentTemplateId: 2, criterionType: 'badge_count', value: '8, 2', notes: 'All eight Johto Gym Badges' },
  { id: 3, tournamentTemplateId: 3, criterionType: 'badge_count', value: '8, 3', notes: 'All eight Hoenn Gym Badges' },
  { id: 4, tournamentTemplateId: 4, criterionType: 'badge_count', value: '8, 4', notes: 'All eight Sinnoh Gym Badges' },
  { id: 5, tournamentTemplateId: 5, criterionType: 'badge_count', value: '8, 5', notes: 'All eight Unova Gym Badges' },
  { id: 6, tournamentTemplateId: 6, criterionType: 'badge_count', value: '8, 6', notes: 'All eight Kalos Gym Badges' },
  { id: 7, tournamentTemplateId: 7, criterionType: 'badge_count', value: '8, 7', notes: 'All eight Alola Gym Badges' },
  { id: 8, tournamentTemplateId: 8, criterionType: 'badge_count', value: '8, 8', notes: 'All eight Galar Gym Badges' }
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
  /* ========== INDIGO CONFERENCE (Kanto) ========== */
  { id: 1, tournamentTemplateId: 1, position: 1, prizeType: 'cash',  value: '1000000' },
  { id: 2, tournamentTemplateId: 1, position: 1, prizeType: 'badge', value: 'Indigo Conference Winner' },
  { id: 3, tournamentTemplateId: 1, position: 1, prizeType: 'tournament_ticket', value: 'KANTO_ELITE_FOUR_CHALLENGE' },
  { id: 4, tournamentTemplateId: 1, position: 2, prizeType: 'cash', value: '250000' },
  { id: 5, tournamentTemplateId: 1, position: 3, prizeType: 'cash', value: '100000' },
  { id: 6, tournamentTemplateId: 1, position: 5, prizeType: 'cash', value: '50000'  },
  { id: 7, tournamentTemplateId: 1, position: 9, prizeType: 'cash', value: '25000'  },
  { id: 8, tournamentTemplateId: 1, position: 17, prizeType: 'cash', value: '10000' },

  /* ========== SILVER CONFERENCE (Johto) ========== */
  { id: 9, tournamentTemplateId: 2, position: 1, prizeType: 'cash',  value: '1000000' },
  { id: 10, tournamentTemplateId: 2, position: 1, prizeType: 'badge', value: 'Silver Conference Winner' },
  { id: 11, tournamentTemplateId: 2, position: 1, prizeType: 'tournament_ticket', value: 'JOHTO_ELITE_FOUR_CHALLENGE' },
  { id: 12, tournamentTemplateId: 2, position: 2, prizeType: 'cash', value: '250000' },
  { id: 13, tournamentTemplateId: 2, position: 3, prizeType: 'cash', value: '100000' },
  { id: 14, tournamentTemplateId: 2, position: 5, prizeType: 'cash', value: '50000'  },
  { id: 15, tournamentTemplateId: 2, position: 9, prizeType: 'cash', value: '25000'  },
  { id: 16, tournamentTemplateId: 2, position: 17, prizeType: 'cash', value: '10000' },

  /* ========== EVER GRANDE CONFERENCE (Hoenn) ========== */
  { id: 17, tournamentTemplateId: 3, position: 1, prizeType: 'cash',  value: '1000000' },
  { id: 18, tournamentTemplateId: 3, position: 1, prizeType: 'badge', value: 'Ever Grande Conference Winner' },
  { id: 19, tournamentTemplateId: 3, position: 1, prizeType: 'tournament_ticket', value: 'HOENN_ELITE_FOUR_CHALLENGE' },
  { id: 20, tournamentTemplateId: 3, position: 2, prizeType: 'cash', value: '250000' },
  { id: 21, tournamentTemplateId: 3, position: 3, prizeType: 'cash', value: '100000' },
  { id: 22, tournamentTemplateId: 3, position: 5, prizeType: 'cash', value: '50000'  },
  { id: 23, tournamentTemplateId: 3, position: 9, prizeType: 'cash', value: '25000'  },
  { id: 24, tournamentTemplateId: 3, position: 17, prizeType: 'cash', value: '10000' },

  /* ========== LILY OF THE VALLEY CONFERENCE (Sinnoh) ========== */
  { id: 25, tournamentTemplateId: 4, position: 1, prizeType: 'cash',  value: '1000000' },
  { id: 26, tournamentTemplateId: 4, position: 1, prizeType: 'badge', value: 'Lily of the Valley Conference Winner' },
  { id: 27, tournamentTemplateId: 4, position: 1, prizeType: 'tournament_ticket', value: 'SINNOH_ELITE_FOUR_CHALLENGE' },
  { id: 28, tournamentTemplateId: 4, position: 2, prizeType: 'cash', value: '250000' },
  { id: 29, tournamentTemplateId: 4, position: 3, prizeType: 'cash', value: '100000' },
  { id: 30, tournamentTemplateId: 4, position: 5, prizeType: 'cash', value: '50000'  },
  { id: 31, tournamentTemplateId: 4, position: 9, prizeType: 'cash', value: '25000'  },
  { id: 32, tournamentTemplateId: 4, position: 17, prizeType: 'cash', value: '10000' },

  /* ========== VERTRESS CONFERENCE (Unova) ========== */
  { id: 33, tournamentTemplateId: 5, position: 1, prizeType: 'cash',  value: '1000000' },
  { id: 34, tournamentTemplateId: 5, position: 1, prizeType: 'badge', value: 'Vertress Conference Winner' },
  { id: 35, tournamentTemplateId: 5, position: 1, prizeType: 'tournament_ticket', value: 'UNOVA_ELITE_FOUR_CHALLENGE' },
  { id: 36, tournamentTemplateId: 5, position: 2, prizeType: 'cash', value: '250000' },
  { id: 37, tournamentTemplateId: 5, position: 3, prizeType: 'cash', value: '100000' },
  { id: 38, tournamentTemplateId: 5, position: 5, prizeType: 'cash', value: '50000'  },
  { id: 39, tournamentTemplateId: 5, position: 9, prizeType: 'cash', value: '25000'  },
  { id: 40, tournamentTemplateId: 5, position: 17, prizeType: 'cash', value: '10000' },

  /* ========== LUMIOSE CONFERENCE (Kalos) ========== */
  { id: 41, tournamentTemplateId: 6, position: 1, prizeType: 'cash',  value: '1000000' },
  { id: 42, tournamentTemplateId: 6, position: 1, prizeType: 'badge', value: 'Lumiose Conference Winner' },
  { id: 43, tournamentTemplateId: 6, position: 1, prizeType: 'tournament_ticket', value: 'KALOS_ELITE_FOUR_CHALLENGE' },
  { id: 44, tournamentTemplateId: 6, position: 2, prizeType: 'cash', value: '250000' },
  { id: 45, tournamentTemplateId: 6, position: 3, prizeType: 'cash', value: '100000' },
  { id: 46, tournamentTemplateId: 6, position: 5, prizeType: 'cash', value: '50000'  },
  { id: 47, tournamentTemplateId: 6, position: 9, prizeType: 'cash', value: '25000'  },
  { id: 48, tournamentTemplateId: 6, position: 17, prizeType: 'cash', value: '10000' },

  /* ========== MANALO CONFERENCE (Alola) ========== */
  { id: 49, tournamentTemplateId: 7, position: 1, prizeType: 'cash',  value: '1000000' },
  { id: 50, tournamentTemplateId: 7, position: 1, prizeType: 'badge', value: 'Manalo Conference Winner' },
  { id: 51, tournamentTemplateId: 7, position: 1, prizeType: 'tournament_ticket', value: 'ALOLA_ELITE_FOUR_CHALLENGE' },
  { id: 52, tournamentTemplateId: 7, position: 2, prizeType: 'cash', value: '250000' },
  { id: 53, tournamentTemplateId: 7, position: 3, prizeType: 'cash', value: '100000' },
  { id: 54, tournamentTemplateId: 7, position: 5, prizeType: 'cash', value: '50000'  },
  { id: 55, tournamentTemplateId: 7, position: 9, prizeType: 'cash', value: '25000'  },
  { id: 56, tournamentTemplateId: 7, position: 17, prizeType: 'cash', value: '10000' },

  /* ========== WYNDON CONFERENCE (Galar) ========== */
  { id: 57, tournamentTemplateId: 8, position: 1, prizeType: 'cash',  value: '1000000' },
  { id: 58, tournamentTemplateId: 8, position: 1, prizeType: 'badge', value: 'Wyndon Conference Winner' },
  { id: 59, tournamentTemplateId: 8, position: 1, prizeType: 'tournament_ticket', value: 'GALAR_ELITE_FOUR_CHALLENGE' },
  { id: 60, tournamentTemplateId: 8, position: 2, prizeType: 'cash', value: '250000' },
  { id: 61, tournamentTemplateId: 8, position: 3, prizeType: 'cash', value: '100000' },
  { id: 62, tournamentTemplateId: 8, position: 5, prizeType: 'cash', value: '50000'  },
  { id: 63, tournamentTemplateId: 8, position: 9, prizeType: 'cash', value: '25000'  },
  { id: 64, tournamentTemplateId: 8, position: 17, prizeType: 'cash', value: '10000' },
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
  { id: 10, code: 'harmony_badge',  name: 'Harmony Badge',   category: 'gym', regionId: 1, description: 'Awarded by the Hop City Gym.' },
  { id: 11, code: 'starter_badge',  name: 'Starter Badge',   category: 'gym', regionId: 1, description: 'Awarded by the Pallet Town Gym.' },
  { id: 12, code: 'alloy_badge',    name: 'Alloy Badge',     category: 'gym', regionId: 1, description: 'Awarded by the Gold Coast Gym.' },

  /* ---------- Johto Gym Badges ---------- */
  { id: 13, code: 'lumen_badge',     name: 'Lumen Badge',     category: 'gym', regionId: 2, description: 'Awarded by the Whitewood Gym.' },
  { id: 14, code: 'hive_badge',      name: 'Hive Badge',      category: 'gym', regionId: 2, description: 'Awarded by the Azalea Gym.' },
  { id: 15, code: 'anchor_badge',    name: 'Anchor Badge',    category: 'gym', regionId: 2, description: 'Awarded by the Olivine Gym.' },
  { id: 16, code: 'rising_badge',    name: 'Rising Badge',    category: 'gym', regionId: 2, description: 'Awarded by the Blackthorn Gym.' },
  { id: 17, code: 'storm_badge',     name: 'Storm Badge',     category: 'gym', regionId: 2, description: 'Awarded by the Cianwood Gym.' },
  { id: 18, code: 'zephyr_badge',    name: 'Zephyr Badge',    category: 'gym', regionId: 2, description: 'Awarded by the Kasado Gym.' },
  { id: 19, code: 'ember_badge',     name: 'Ember Badge',     category: 'gym', regionId: 2, description: 'Awarded by the Charicific Valley Gym.' },
  { id: 20, code: 'pixie_badge',     name: 'Pixie Badge',     category: 'gym', regionId: 2, description: 'Awarded by the Violet Gym.' },
  { id: 21, code: 'fog_badge',       name: 'Fog Badge',       category: 'gym', regionId: 2, description: 'Awarded by the Ecruteak Gym.' },
  { id: 22, code: 'glacier_badge',   name: 'Glacier Badge',   category: 'gym', regionId: 2, description: 'Awarded by the Alto Mare Gym.' },
  { id: 23, code: 'plain_badge',     name: 'Plain Badge',     category: 'gym', regionId: 2, description: 'Awarded by the Goldenrod Gym.' },
  { id: 24, code: 'eclipse_badge',   name: 'Eclipse Badge',   category: 'gym', regionId: 2, description: 'Awarded by the Evergreen Gym.' },

  /* ---------- Hoenn Gym Badges ---------- */
  { id: 25, code: 'rain_badge',      name: 'Rain Badge',      category: 'gym', regionId: 3, description: 'Awarded by the Sootopolis Gym.' },
  { id: 26, code: 'knuckle_badge',   name: 'Knuckle Badge',   category: 'gym', regionId: 3, description: 'Awarded by the Dewford Gym.' },
  { id: 27, code: 'heat_badge',      name: 'Heat Badge',      category: 'gym', regionId: 3, description: 'Awarded by the Lavaridge Gym.' },
  { id: 28, code: 'frost_badge',     name: 'Frost Badge',     category: 'gym', regionId: 3, description: 'Awarded by the Lilycove Gym.' },
  { id: 29, code: 'balance_badge',   name: 'Balance Badge',   category: 'gym', regionId: 3, description: 'Awarded by the Petalburg Gym.' },
  { id: 30, code: 'cinder_badge',    name: 'Cinder Badge',    category: 'gym', regionId: 3, description: 'Awarded by the Pyroberg Gym.' },
  { id: 31, code: 'stone_badge',     name: 'Stone Badge',     category: 'gym', regionId: 3, description: 'Awarded by the Rustboro Gym.' },
  { id: 32, code: 'venom_badge',     name: 'Venom Badge',     category: 'gym', regionId: 3, description: 'Awarded by the Slateport Gym.' },
  { id: 33, code: 'forge_badge',     name: 'Forge Badge',     category: 'gym', regionId: 3, description: 'Awarded by the Fallarbor Gym.' },
  { id: 34, code: 'mind_badge',      name: 'Mind Badge',      category: 'gym', regionId: 3, description: 'Awarded by the Mossdeep Gym.' },
  { id: 35, code: 'dynamo_badge',    name: 'Dynamo Badge',    category: 'gym', regionId: 3, description: 'Awarded by the New Mauville Gym.' },
  { id: 36, code: 'feather_badge',   name: 'Feather Badge',   category: 'gym', regionId: 3, description: 'Awarded by the Fortree Gym.' },

  /* ---------- Sinnoh Gym Badges ---------- */
  { id: 37, code: 'terrace_badge',   name: 'Terrace Badge',   category: 'gym', regionId: 4, description: 'Awarded by the Celestic Town Gym.' },
  { id: 38, code: 'mine_badge',      name: 'Mine Badge',      category: 'gym', regionId: 4, description: 'Awarded by the Canalave Gym.' },
  { id: 39, code: 'icicle_badge',    name: 'Icicle Badge',    category: 'gym', regionId: 4, description: 'Awarded by the Snowpoint Gym.' },
  { id: 40, code: 'odyssey_badge',   name: 'Odyssey Badge',   category: 'gym', regionId: 4, description: 'Awarded by the Alamos Gym.' },
  { id: 41, code: 'fen_badge',       name: 'Fen Badge',       category: 'gym', regionId: 4, description: 'Awarded by the Pastoria Gym.' },
  { id: 42, code: 'relic_badge',     name: 'Relic Badge',     category: 'gym', regionId: 4, description: 'Awarded by the Hearthome Gym.' },
  { id: 43, code: 'forest_badge',    name: 'Forest Badge',    category: 'gym', regionId: 4, description: 'Awarded by the Eterna Gym.' },
  { id: 44, code: 'oracle_badge',    name: 'Oracle Badge',    category: 'gym', regionId: 4, description: 'Awarded by the Solaceon Gym.' },
  { id: 45, code: 'meteor_badge',    name: 'Meteor Badge',    category: 'gym', regionId: 4, description: 'Awarded by the Veilstone Gym.' },
  { id: 46, code: 'aura_badge',      name: 'Aura Badge',      category: 'gym', regionId: 4, description: 'Awarded by the Crown City Gym.' },
  { id: 47, code: 'coal_badge',      name: 'Coal Badge',      category: 'gym', regionId: 4, description: 'Awarded by the Oreburgh Gym.' },
  { id: 48, code: 'beacon_badge',    name: 'Beacon Badge',    category: 'gym', regionId: 4, description: 'Awarded by the Sunyshore Gym.' },

  /* ---------- Unova Gym Badges ---------- */
  { id: 49, code: 'pyre_badge',      name: 'Pyre Badge',      category: 'gym', regionId: 5, description: 'Awarded by the Lacunosa Gym.' },
  { id: 50, code: 'insect_badge',    name: 'Insect Badge',    category: 'gym', regionId: 5, description: 'Awarded by the Castelia Gym.' },
  { id: 51, code: 'basic_badge',     name: 'Basic Badge',     category: 'gym', regionId: 5, description: 'Awarded by the Aspertia Gym.' },
  { id: 52, code: 'trio_badge',      name: 'Trio Badge',      category: 'gym', regionId: 5, description: 'Awarded by the Striaton Gym.' },
  { id: 53, code: 'quake_badge',     name: 'Quake Badge',     category: 'gym', regionId: 5, description: 'Awarded by the Driftveil Gym.' },
  { id: 54, code: 'bolt_badge',      name: 'Bolt Badge',      category: 'gym', regionId: 5, description: 'Awarded by the Nimbasa Gym.' },
  { id: 55, code: 'dread_badge',     name: 'Dread Badge',     category: 'gym', regionId: 5, description: 'Awarded by the Flocessy Gym.' },
  { id: 56, code: 'museum_badge',    name: 'Museum Badge',    category: 'gym', regionId: 5, description: 'Awarded by the Nacrene Gym.' },
  { id: 57, code: 'legend_badge',    name: 'Legend Badge',    category: 'gym', regionId: 5, description: 'Awarded by the Opelucid Gym.' },
  { id: 58, code: 'wave_badge',      name: 'Wave Badge',      category: 'gym', regionId: 5, description: 'Awarded by the Humilau Gym.' },
  { id: 59, code: 'toxic_badge',     name: 'Toxic Badge',     category: 'gym', regionId: 5, description: 'Awarded by the Virbank Gym.' },
  { id: 60, code: 'wraith_badge',    name: 'Wraith Badge',    category: 'gym', regionId: 5, description: 'Awarded by the Black City Gym.' },

  /* ---------- Kalos Gym Badges ---------- */
  { id: 61, code: 'soar_badge',      name: 'Soar Badge',      category: 'gym', regionId: 6, description: 'Awarded by the Champ-de-Mars Gym.' },
  { id: 62, code: 'fairy_badge',     name: 'Fairy Badge',     category: 'gym', regionId: 6, description: 'Awarded by the Laverre Gym.' },
  { id: 63, code: 'voltage_badge',   name: 'Voltage Badge',   category: 'gym', regionId: 6, description: 'Awarded by the Lumiose Gym.' },
  { id: 64, code: 'cliff_badge',     name: 'Cliff Badge',     category: 'gym', regionId: 6, description: 'Awarded by the Cyllage Gym.' },
  { id: 65, code: 'rumble_badge',    name: 'Rumble Badge',    category: 'gym', regionId: 6, description: 'Awarded by the Shalour Gym.' },
  { id: 66, code: 'maison_badge',    name: 'Maison Badge',    category: 'gym', regionId: 6, description: 'Awarded by the Kiloude Gym.' },
  { id: 67, code: 'psyche_badge',    name: 'Psyche Badge',    category: 'gym', regionId: 6, description: 'Awarded by the Anistar Gym.' },
  { id: 68, code: 'plant_badge',     name: 'Plant Badge',     category: 'gym', regionId: 6, description: 'Awarded by the Coumarine Gym.' },
  { id: 69, code: 'tidal_badge',     name: 'Tidal Badge',     category: 'gym', regionId: 6, description: 'Awarded by the Brux Gym.' },
  { id: 70, code: 'carapace_badge',  name: 'Carapace Badge',  category: 'gym', regionId: 6, description: 'Awarded by the Santalune Gym.' },
  { id: 71, code: 'bastion_badge',   name: 'Bastion Badge',   category: 'gym', regionId: 6, description: 'Awarded by the Dendemill Gym.' },
  { id: 72, code: 'iceberg_badge',   name: 'Iceberg Badge',   category: 'gym', regionId: 6, description: 'Awarded by the Snowbelle Gym.' },

  /* ---------- Alola Gym Badges ---------- */
  { id: 73, code: 'seafrost_badge',  name: 'Seafrost Badge',  category: 'gym', regionId: 7, description: 'Awarded by the Seafolk Village Gym.' },
  { id: 74, code: 'drift_badge',     name: 'Drift Badge',     category: 'gym', regionId: 7, description: 'Awarded by the Poni Coast Gym.' },
  { id: 75, code: 'tradewind_badge', name: 'Tradewind Badge', category: 'gym', regionId: 7, description: 'Awarded by the Heahea Gym.' },
  { id: 76, code: 'lava_badge',      name: 'Lava Badge',      category: 'gym', regionId: 7, description: 'Awarded by the Wela Volcano Gym.' },
  { id: 77, code: 'brook_badge',     name: 'Brook Badge',     category: 'gym', regionId: 7, description: 'Awarded by the Brooklet Hill Gym.' },
  { id: 78, code: 'canyon_badge',    name: 'Canyon Badge',    category: 'gym', regionId: 7, description: 'Awarded by the Poni Canyon Gym.' },
  { id: 79, code: 'summit_badge',    name: 'Summit Badge',    category: 'gym', regionId: 7, description: 'Awarded by the Mount Lanakila Gym.' },
  { id: 80, code: 'thunderpeak_badge', name: 'Thunderpeak Badge', category: 'gym', regionId: 7, description: 'Awarded by the Mount Lanakila Gym.' },
  { id: 81, code: 'midnight_badge',  name: 'Midnight Badge',  category: 'gym', regionId: 7, description: 'Awarded by the Malie Gym.' },
  { id: 82, code: 'cocoon_badge',    name: 'Cocoon Badge',    category: 'gym', regionId: 7, description: 'Awarded by the Po Gym.' },
  { id: 83, code: 'basalt_badge',    name: 'Basalt Badge',    category: 'gym', regionId: 7, description: 'Awarded by the Konikoni Gym.' },
  { id: 84, code: 'totem_badge',     name: 'Totem Badge',     category: 'gym', regionId: 7, description: 'Awarded by the Hau\'oli Gym.' },

  /* ---------- Galar Gym Badges ---------- */
  { id: 85, code: 'crown_badge',     name: 'Crown Badge',     category: 'gym', regionId: 8, description: 'Awarded by the Wyndon Gym.' },
  { id: 86, code: 'fae_badge',       name: 'Fae Badge',       category: 'gym', regionId: 8, description: 'Awarded by the Glimwood Gym.' },
  { id: 87, code: 'wisp_badge',      name: 'Wisp Badge',      category: 'gym', regionId: 8, description: 'Awarded by the Thorncliffe Gym.' },
  { id: 88, code: 'brawler_badge',   name: 'Brawler Badge',   category: 'gym', regionId: 8, description: 'Awarded by the Stow-on-Side Gym.' },
  { id: 89, code: 'blossom_badge',   name: 'Blossom Badge',   category: 'gym', regionId: 8, description: 'Awarded by the Ballonlea Gym.' },
  { id: 90, code: 'granite_badge',   name: 'Granite Badge',   category: 'gym', regionId: 8, description: 'Awarded by the Stockport Gym.' },
  { id: 91, code: 'borough_badge',   name: 'Borough Badge',   category: 'gym', regionId: 8, description: 'Awarded by the Croydon Gym.' },
  { id: 92, code: 'boiler_badge',    name: 'Boiler Badge',    category: 'gym', regionId: 8, description: 'Awarded by the Motostoke Gym.' },
  { id: 93, code: 'hazard_badge',    name: 'Hazard Badge',    category: 'gym', regionId: 8, description: 'Awarded by the Spikemuth Gym.' },
  { id: 94, code: 'floe_badge',      name: 'Floe Badge',      category: 'gym', regionId: 8, description: 'Awarded by the Circhester Gym.' },
  { id: 95, code: 'harbor_badge',    name: 'Harbor Badge',    category: 'gym', regionId: 8, description: 'Awarded by the Hulbury Gym.' },
  { id: 96, code: 'furrow_badge',    name: 'Furrow Badge',    category: 'gym', regionId: 8, description: 'Awarded by the Turffield Gym.' },

  /* ---------- Indigo Conference Badges (Kanto) ---------- */
  { id: 301, code: 'indigo_conf_participant', name: 'Indigo Conference Participant', category: 'conference', regionId: 1, tournamentTemplateId: 1, description: 'Qualified for the Indigo Conference.' },
  { id: 302, code: 'indigo_conf_top32',       name: 'Indigo Conference Top 32',      category: 'conference', regionId: 1, tournamentTemplateId: 1, description: 'Reached the Top 32 of the Indigo Conference.' },
  { id: 303, code: 'indigo_conf_top16',       name: 'Indigo Conference Top 16',      category: 'conference', regionId: 1, tournamentTemplateId: 1, description: 'Reached the Round of 16.' },
  { id: 304, code: 'indigo_conf_top8',        name: 'Indigo Conference Quarterfinalist', category: 'conference', regionId: 1, tournamentTemplateId: 1, description: 'Reached the Quarterfinals.' },
  { id: 305, code: 'indigo_conf_top4',        name: 'Indigo Conference Semifinalist', category: 'conference', regionId: 1, tournamentTemplateId: 1, description: 'Reached the Semifinals.' },
  { id: 306, code: 'indigo_conf_finalist',    name: 'Indigo Conference Finalist',     category: 'conference', regionId: 1, tournamentTemplateId: 1, description: 'Runner-up of the Indigo Conference.' },
  { id: 307, code: 'indigo_conf_winner',      name: 'Indigo Conference Champion',     category: 'conference', regionId: 1, tournamentTemplateId: 1, description: 'Champion of the Indigo Conference.' },

  /* ---------- Silver Conference Badges (Johto) ---------- */
  { id: 308, code: 'silver_conf_participant', name: 'Silver Conference Participant', category: 'conference', regionId: 2, tournamentTemplateId: 2, description: 'Qualified for the Silver Conference.' },
  { id: 309, code: 'silver_conf_top32',       name: 'Silver Conference Top 32',      category: 'conference', regionId: 2, tournamentTemplateId: 2, description: 'Reached the Top 32 of the Silver Conference.' },
  { id: 310, code: 'silver_conf_top16',       name: 'Silver Conference Top 16',      category: 'conference', regionId: 2, tournamentTemplateId: 2, description: 'Reached the Round of 16.' },
  { id: 311, code: 'silver_conf_top8',        name: 'Silver Conference Quarterfinalist', category: 'conference', regionId: 2, tournamentTemplateId: 2, description: 'Reached the Quarterfinals.' },
  { id: 312, code: 'silver_conf_top4',        name: 'Silver Conference Semifinalist', category: 'conference', regionId: 2, tournamentTemplateId: 2, description: 'Reached the Semifinals.' },
  { id: 313, code: 'silver_conf_finalist',    name: 'Silver Conference Finalist',     category: 'conference', regionId: 2, tournamentTemplateId: 2, description: 'Runner-up of the Silver Conference.' },
  { id: 314, code: 'silver_conf_winner',      name: 'Silver Conference Champion',     category: 'conference', regionId: 2, tournamentTemplateId: 2, description: 'Champion of the Silver Conference.' },

  /* ---------- Ever Grande Conference Badges (Hoenn) ---------- */
  { id: 315, code: 'ever_grande_conf_participant', name: 'Ever Grande Conference Participant', category: 'conference', regionId: 3, tournamentTemplateId: 3, description: 'Qualified for the Ever Grande Conference.' },
  { id: 316, code: 'ever_grande_conf_top32',       name: 'Ever Grande Conference Top 32',      category: 'conference', regionId: 3, tournamentTemplateId: 3, description: 'Reached the Top 32 of the Ever Grande Conference.' },
  { id: 317, code: 'ever_grande_conf_top16',       name: 'Ever Grande Conference Top 16',      category: 'conference', regionId: 3, tournamentTemplateId: 3, description: 'Reached the Round of 16.' },
  { id: 318, code: 'ever_grande_conf_top8',        name: 'Ever Grande Conference Quarterfinalist', category: 'conference', regionId: 3, tournamentTemplateId: 3, description: 'Reached the Quarterfinals.' },
  { id: 319, code: 'ever_grande_conf_top4',        name: 'Ever Grande Conference Semifinalist', category: 'conference', regionId: 3, tournamentTemplateId: 3, description: 'Reached the Semifinals.' },
  { id: 320, code: 'ever_grande_conf_finalist',    name: 'Ever Grande Conference Finalist',     category: 'conference', regionId: 3, tournamentTemplateId: 3, description: 'Runner-up of the Ever Grande Conference.' },
  { id: 321, code: 'ever_grande_conf_winner',      name: 'Ever Grande Conference Champion',     category: 'conference', regionId: 3, tournamentTemplateId: 3, description: 'Champion of the Ever Grande Conference.' },

  /* ---------- Lily of the Valley Conference Badges (Sinnoh) ---------- */
  { id: 322, code: 'lily_valley_conf_participant', name: 'Lily of the Valley Conference Participant', category: 'conference', regionId: 4, tournamentTemplateId: 4, description: 'Qualified for the Lily of the Valley Conference.' },
  { id: 323, code: 'lily_valley_conf_top32',       name: 'Lily of the Valley Conference Top 32',      category: 'conference', regionId: 4, tournamentTemplateId: 4, description: 'Reached the Top 32 of the Lily of the Valley Conference.' },
  { id: 324, code: 'lily_valley_conf_top16',       name: 'Lily of the Valley Conference Top 16',      category: 'conference', regionId: 4, tournamentTemplateId: 4, description: 'Reached the Round of 16.' },
  { id: 325, code: 'lily_valley_conf_top8',        name: 'Lily of the Valley Conference Quarterfinalist', category: 'conference', regionId: 4, tournamentTemplateId: 4, description: 'Reached the Quarterfinals.' },
  { id: 326, code: 'lily_valley_conf_top4',        name: 'Lily of the Valley Conference Semifinalist', category: 'conference', regionId: 4, tournamentTemplateId: 4, description: 'Reached the Semifinals.' },
  { id: 327, code: 'lily_valley_conf_finalist',    name: 'Lily of the Valley Conference Finalist',     category: 'conference', regionId: 4, tournamentTemplateId: 4, description: 'Runner-up of the Lily of the Valley Conference.' },
  { id: 328, code: 'lily_valley_conf_winner',      name: 'Lily of the Valley Conference Champion',     category: 'conference', regionId: 4, tournamentTemplateId: 4, description: 'Champion of the Lily of the Valley Conference.' },

  /* ---------- Vertress Conference Badges (Unova) ---------- */
  { id: 329, code: 'vertress_conf_participant', name: 'Vertress Conference Participant', category: 'conference', regionId: 5, tournamentTemplateId: 5, description: 'Qualified for the Vertress Conference.' },
  { id: 330, code: 'vertress_conf_top32',       name: 'Vertress Conference Top 32',      category: 'conference', regionId: 5, tournamentTemplateId: 5, description: 'Reached the Top 32 of the Vertress Conference.' },
  { id: 331, code: 'vertress_conf_top16',       name: 'Vertress Conference Top 16',      category: 'conference', regionId: 5, tournamentTemplateId: 5, description: 'Reached the Round of 16.' },
  { id: 332, code: 'vertress_conf_top8',        name: 'Vertress Conference Quarterfinalist', category: 'conference', regionId: 5, tournamentTemplateId: 5, description: 'Reached the Quarterfinals.' },
  { id: 333, code: 'vertress_conf_top4',        name: 'Vertress Conference Semifinalist', category: 'conference', regionId: 5, tournamentTemplateId: 5, description: 'Reached the Semifinals.' },
  { id: 334, code: 'vertress_conf_finalist',    name: 'Vertress Conference Finalist',     category: 'conference', regionId: 5, tournamentTemplateId: 5, description: 'Runner-up of the Vertress Conference.' },
  { id: 335, code: 'vertress_conf_winner',      name: 'Vertress Conference Champion',     category: 'conference', regionId: 5, tournamentTemplateId: 5, description: 'Champion of the Vertress Conference.' },

  /* ---------- Lumiose Conference Badges (Kalos) ---------- */
  { id: 336, code: 'lumiose_conf_participant', name: 'Lumiose Conference Participant', category: 'conference', regionId: 6, tournamentTemplateId: 6, description: 'Qualified for the Lumiose Conference.' },
  { id: 337, code: 'lumiose_conf_top32',       name: 'Lumiose Conference Top 32',      category: 'conference', regionId: 6, tournamentTemplateId: 6, description: 'Reached the Top 32 of the Lumiose Conference.' },
  { id: 338, code: 'lumiose_conf_top16',       name: 'Lumiose Conference Top 16',      category: 'conference', regionId: 6, tournamentTemplateId: 6, description: 'Reached the Round of 16.' },
  { id: 339, code: 'lumiose_conf_top8',        name: 'Lumiose Conference Quarterfinalist', category: 'conference', regionId: 6, tournamentTemplateId: 6, description: 'Reached the Quarterfinals.' },
  { id: 340, code: 'lumiose_conf_top4',        name: 'Lumiose Conference Semifinalist', category: 'conference', regionId: 6, tournamentTemplateId: 6, description: 'Reached the Semifinals.' },
  { id: 341, code: 'lumiose_conf_finalist',    name: 'Lumiose Conference Finalist',     category: 'conference', regionId: 6, tournamentTemplateId: 6, description: 'Runner-up of the Lumiose Conference.' },
  { id: 342, code: 'lumiose_conf_winner',      name: 'Lumiose Conference Champion',     category: 'conference', regionId: 6, tournamentTemplateId: 6, description: 'Champion of the Lumiose Conference.' },

  /* ---------- Manalo Conference Badges (Alola) ---------- */
  { id: 343, code: 'manalo_conf_participant', name: 'Manalo Conference Participant', category: 'conference', regionId: 7, tournamentTemplateId: 7, description: 'Qualified for the Manalo Conference.' },
  { id: 344, code: 'manalo_conf_top32',       name: 'Manalo Conference Top 32',      category: 'conference', regionId: 7, tournamentTemplateId: 7, description: 'Reached the Top 32 of the Manalo Conference.' },
  { id: 345, code: 'manalo_conf_top16',       name: 'Manalo Conference Top 16',      category: 'conference', regionId: 7, tournamentTemplateId: 7, description: 'Reached the Round of 16.' },
  { id: 346, code: 'manalo_conf_top8',        name: 'Manalo Conference Quarterfinalist', category: 'conference', regionId: 7, tournamentTemplateId: 7, description: 'Reached the Quarterfinals.' },
  { id: 347, code: 'manalo_conf_top4',        name: 'Manalo Conference Semifinalist', category: 'conference', regionId: 7, tournamentTemplateId: 7, description: 'Reached the Semifinals.' },
  { id: 348, code: 'manalo_conf_finalist',    name: 'Manalo Conference Finalist',     category: 'conference', regionId: 7, tournamentTemplateId: 7, description: 'Runner-up of the Manalo Conference.' },
  { id: 349, code: 'manalo_conf_winner',      name: 'Manalo Conference Champion',     category: 'conference', regionId: 7, tournamentTemplateId: 7, description: 'Champion of the Manalo Conference.' },

  /* ---------- Wyndon Conference Badges (Galar) ---------- */
  { id: 350, code: 'wyndon_conf_participant', name: 'Wyndon Conference Participant', category: 'conference', regionId: 8, tournamentTemplateId: 8, description: 'Qualified for the Wyndon Conference.' },
  { id: 351, code: 'wyndon_conf_top32',       name: 'Wyndon Conference Top 32',      category: 'conference', regionId: 8, tournamentTemplateId: 8, description: 'Reached the Top 32 of the Wyndon Conference.' },
  { id: 352, code: 'wyndon_conf_top16',       name: 'Wyndon Conference Top 16',      category: 'conference', regionId: 8, tournamentTemplateId: 8, description: 'Reached the Round of 16.' },
  { id: 353, code: 'wyndon_conf_top8',        name: 'Wyndon Conference Quarterfinalist', category: 'conference', regionId: 8, tournamentTemplateId: 8, description: 'Reached the Quarterfinals.' },
  { id: 354, code: 'wyndon_conf_top4',        name: 'Wyndon Conference Semifinalist', category: 'conference', regionId: 8, tournamentTemplateId: 8, description: 'Reached the Semifinals.' },
  { id: 355, code: 'wyndon_conf_finalist',    name: 'Wyndon Conference Finalist',     category: 'conference', regionId: 8, tournamentTemplateId: 8, description: 'Runner-up of the Wyndon Conference.' },
  { id: 356, code: 'wyndon_conf_winner',      name: 'Wyndon Conference Champion',     category: 'conference', regionId: 8, tournamentTemplateId: 8, description: 'Champion of the Wyndon Conference.' }
];
