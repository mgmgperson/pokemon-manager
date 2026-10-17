import type { PopulationProposal } from './trainer-population-proposal.types';

export interface PopulationReview {
  version: 1;
  mode: 'review-only';
  proposal: PopulationProposal;
  reviewToken: string;
  changes: string[];
  warnings: string[];
  distributions: {
    ratings: Array<{ bandId: string; count: number }>;
    ages: Array<{ minimum: number; maximum: number; count: number }>;
    outsideAgeBands: number;
    strongest: Array<{ key: string; name: string; pwtr: number | null; ability?: number; estimatedPeakAbility?: number | null; declinePoints?: number }>;
    beforeInactive?: number;
    afterInactive?: number;
    unknownOfficial?: { currentPwtr: number; peakPwtr: number; peakRank: number; peakYear: number };
    beforeActive: number;
    afterActive: number;
    protectedTrainers: number;
    ceilingExclusive: number | null;
  };
}

export interface PopulationApplyResult {
  mode: 'applied';
  proposalId: string;
  reviewToken: string;
  created: Array<{ key: string; trainerId: number; ratingId: number; pokemonIds: number[] }>;
}
