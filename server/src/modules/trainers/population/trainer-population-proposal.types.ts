import type { Fields } from '../../../reference-data/enums/fields';
import type { Types } from '../../../reference-data/enums/types';
import type { GeneratedPokemonDetails } from '../../../generators/pokemonSetGenerator';
import type { GeneralRatingProposal, TrainerProfileProposal, NumericRange, RosterPokemonProposal } from '../management/trainer-management.types';
import type { FieldRatingColumn, FormatRatingColumn, MentalRatingColumn } from '../trainer/trainer.types';
import type { PopulationPlan, PopulationPlanningInput } from './trainer-population.types';

export const SPECIAL_OWNERSHIP_KINDS = ['legendary', 'mythical', 'mega', 'gmax'] as const;
export type SpecialOwnershipKind = typeof SPECIAL_OWNERSHIP_KINDS[number];
export type SpecialOwnershipSettings = Record<SpecialOwnershipKind, { chancePercent: number; count: number }>;

export interface ActivePopulationProposalInput {
  snapshot: string;
  planning: PopulationPlanningInput;
  ageRatingBias: number;
  nameGender: 'random' | 'M' | 'F';
  pokemon: {
    types: Types[];
    generations: number[];
    fields: Fields[];
    specialistPercentage: number;
    dualTypePercentage: number;
    rosterSize: NumericRange | null;
    specialOwnership: SpecialOwnershipSettings;
  };
}

export interface PopulationTrainerProposal {
  key: string;
  profile: TrainerProfileProposal;
  declinePoints?: number;
  nameGender: 'M' | 'F';
  age: number;
  ratingBandId: string;
  ageBand: NumericRange;
  typePreferences: Types[];
  ratingYear: number;
  generalRatings: GeneralRatingProposal;
  ratingBasis?: GeneralRatingProposal;
  formatRatings: Record<FormatRatingColumn, number>;
  mentalRatings: Record<MentalRatingColumn, number>;
  fieldRatings: Record<FieldRatingColumn, number>;
  pokemon: Array<Omit<RosterPokemonProposal, 'details'> & { details: Omit<GeneratedPokemonDetails, 'otId'> }>;
  specialOwnership: Record<SpecialOwnershipKind, number>;
  notices: string[];
}

export interface PopulationProposal {
  version: 1 | 2;
  mode: 'preview-only';
  proposalId: string;
  snapshot: string;
  brief: PopulationProposalInput;
  plan: PopulationPlan;
  trainers: PopulationTrainerProposal[];
  summary: {
    trainerCount: number;
    pokemonCount: number;
    exceptionalTrainers: number;
    specials: Record<SpecialOwnershipKind, { expectedTrainers: number; actualTrainers: number; pokemonCount: number }>;
  };
  notices: string[];
}

export interface InactivePopulationProposalInput {
  cohort: 'inactive';
  battleCounters: 'unrecorded-zero';
  snapshot: string;
  batch: { regionId: number; count: number };
  ageRange: NumericRange;
  peakAbility: NumericRange;
  declinePoints: NumericRange;
  peakYear: NumericRange | null;
  nameGender: ActivePopulationProposalInput['nameGender'];
  pokemon: ActivePopulationProposalInput['pokemon'];
}
export type PopulationProposalInput = ActivePopulationProposalInput | InactivePopulationProposalInput;
export function isInactiveBrief(brief: PopulationProposalInput): brief is InactivePopulationProposalInput {
  return 'cohort' in brief && brief.cohort === 'inactive';
}
