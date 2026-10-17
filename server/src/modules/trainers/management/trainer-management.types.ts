export interface NumericRange {
  minimum: number;
  maximum: number;
}

export interface ExistingTrainerProposalInput {
  regionId?: number;
  hometownCityId?: number;
  ageRange?: NumericRange;
  pwtrRange?: NumericRange;
  activeStatus?: boolean;
  includeRatings: boolean;
}

export interface ProfileProposal {
  regionId?: number;
  hometownCityId?: number;
  hometownName?: string;
  birthdate?: string;
  pwtrRating?: number;
  peakRating?: number;
  peakRank?: number;
  activeStatus?: boolean;
}

export interface GeneralRatingProposal {
  overallRating: number;
  typingRating: number;
  mixedRating: number;
  specialRating: number;
}

export interface ExistingTrainerProposal {
  trainerId: number;
  profile: ProfileProposal;
  rating: GeneralRatingProposal | null;
  notices: string[];
}

export interface ExistingTrainerApplyInput {
  profile?: ProfileProposal;
  rating?: GeneralRatingProposal;
}

export type TrainerNameGender = 'M' | 'F';

export interface NewTrainerProposalInput {
  regionId: number;
  hometownCityId?: number;
  gender?: TrainerNameGender;
  ageRange: NumericRange;
  pwtrRange: NumericRange;
  activeStatus: boolean;
  includeRatings: boolean;
}

export interface TrainerProfileProposal {
  estimatedPeakAbility?: number | null;
  estimatedPeakAbilityYear?: number | null;
  fname: string;
  lname: string;
  regionId: number;
  hometownCityId?: number;
  hometownName?: string;
  birthdate: string;
  pwtrRating: number | null;
  peakRating: number | null;
  peakRank: number | null;
  activeStatus: boolean;
}

export interface NewTrainerProfileProposal extends TrainerProfileProposal {
  pwtrRating: number;
  peakRating: number;
  peakRank: number;
}

export interface NewTrainerProposal {
  profile: NewTrainerProfileProposal;
  rating: GeneralRatingProposal | null;
  nameGender: TrainerNameGender;
  notices: string[];
}

export interface NewTrainerApplyInput {
  profile: NewTrainerProfileProposal;
  rating?: GeneralRatingProposal;
}

export interface RosterProposalInput {
  pokemonCount: number;
  typeIds: number[];
  generations: number[];
}

export interface RosterPokemonProposal {
  speciesId: number;
  pokemonId: number;
  name: string;
  level: number;
  typeIds: number[];
  isMega: boolean;
  isGigantamax: boolean;
  details: GeneratedPokemonDetails;
}

export interface RosterProposal {
  trainerId: number;
  existingPokemonCount: number;
  pokemon: RosterPokemonProposal[];
  overallRating: number;
  notices: string[];
}

export interface RosterApplyInput {
  pokemon: RosterPokemonProposal[];
}
import type { GeneratedPokemonDetails } from '../../../generators/pokemonSetGenerator';
