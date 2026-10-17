import axios from 'axios';
import type { GeneralRatingProposal } from './trainerManagementData';
import type { NewTrainerProfileProposal, NumericRange } from './NewTrainerProposal';
import type { GeneratedPokemonDetails, RosterPokemonProposal } from './TrainerRosterProposal';

export const specialKinds = ['legendary', 'mythical', 'mega', 'gmax'] as const;
export type SpecialKind = typeof specialKinds[number];
export type RerollSection = 'trainer' | 'ratings' | 'roster';
export interface PreferenceOption { id: number; name: string; }
export interface PopulationPlanningInput {
  regionWeights: Array<{ regionId: number; populationMultiplier: number; cultureMultiplier: number }>;
  ageTargets: { scope: 'coverage' | 'all_active'; bands: Array<NumericRange & { percentage: number }> };
  batch: { regionId: number; count: number };
}
export interface ActivePopulationBrief {
  snapshot: string;
  planning: PopulationPlanningInput;
  ageRatingBias: number;
  nameGender: 'random' | 'M' | 'F';
  pokemon: {
    types: number[]; generations: number[]; fields: number[];
    specialistPercentage: number; dualTypePercentage: number;
    rosterSize: NumericRange | null;
    specialOwnership: Record<SpecialKind, { chancePercent: number; count: number }>;
  };
}
export interface InactivePopulationBrief {
  cohort: 'inactive'; battleCounters: 'unrecorded-zero'; snapshot: string; batch: { regionId: number; count: number };
  ageRange: NumericRange; peakAbility: NumericRange; declinePoints: NumericRange; peakYear: NumericRange | null;
  nameGender: ActivePopulationBrief['nameGender']; pokemon: ActivePopulationBrief['pokemon'];
}
export type PopulationBrief = ActivePopulationBrief | InactivePopulationBrief;
export function isInactiveBrief(brief: PopulationBrief): brief is InactivePopulationBrief { return 'cohort' in brief && brief.cohort === 'inactive'; }
export type PopulationProfile = Omit<NewTrainerProfileProposal, 'pwtrRating' | 'peakRating' | 'peakRank'> & {
  pwtrRating: number | null; peakRating: number | null; peakRank: number | null;
};
export interface PopulationInspection {
  snapshot: string; databaseFile: string; gameDate: string; ratingFloor: number; referenceCount: number;
  counts: { active: number; inactive: number; unknownStatus: number; activeInCoverage: number; activeBelowFloor: number; activeUnrated: number };
  referenceProjection: { additions: number; active: number; inCoverage: number };
  protection: { ready: boolean; ceilingExclusive: number | null; members: Array<{ id: number; name: string; pwtr: number | null; ability?: number; estimatedPeakAbility?: number | null; declinePoints?: number }> };
  regions: Array<{ id: number; name: string; population: number | null; counts: PopulationInspection['counts'];
    cities: number; weightedHometowns: number; locations: number; validPolygons: number; issues: string[] }>;
  pokemonPreferences: Record<'types' | 'generations' | 'fields', PreferenceOption[]>;
  ageCounts: Array<{ age: number; allActive: number; inCoverage: number }>;
  issues: string[];
}
export interface PopulationPlan {
  inactiveCohort?: { beforeInactive: number; afterInactive: number; ageRange: NumericRange };
  inspection: PopulationInspection;
  regionalTargets: Array<{ regionId: number; additionTarget: number; projectedActiveInCoverage: number }> | null;
  ageTargets: { scope: string; finalPopulation: number; outsideBands: number; invalidBirthdates: number;
    bands: Array<NumericRange & { percentage: number; existing: number; target: number; deficit: number; excess: number }> } | null;
  batch: { regionId: number; count: number; projectedWorldwideActive: number; projectedWorldwideActiveInCoverage: number;
    ratingBands: Array<{ bandId: string; count: number }>; ageBands: Array<NumericRange & { count: number }> | null; issues: string[] } | null;
  unresolvedInputs: string[];
}
export interface PopulationTrainer {
  key: string; declinePoints?: number; profile: PopulationProfile; nameGender: 'M' | 'F'; age: number; ratingBandId: string;
  ageBand: NumericRange; typePreferences: number[]; ratingYear: number;
  generalRatings: GeneralRatingProposal; ratingBasis?: GeneralRatingProposal;
  formatRatings: Record<string, number>; mentalRatings: Record<string, number>; fieldRatings: Record<string, number>;
  pokemon: Array<Omit<RosterPokemonProposal, 'details'> & { details: Omit<GeneratedPokemonDetails, 'otId'> }>;
  specialOwnership: Record<SpecialKind, number>; notices: string[];
}
export interface PopulationProposal {
  version: 1 | 2; mode: 'preview-only'; proposalId: string; snapshot: string; brief: PopulationBrief;
  plan: PopulationPlan; trainers: PopulationTrainer[];
  summary: { trainerCount: number; pokemonCount: number; exceptionalTrainers: number;
    specials: Record<SpecialKind, { expectedTrainers: number; actualTrainers: number; pokemonCount: number }> };
  notices: string[];
}
export interface PopulationReview {
  version: 1; mode: 'review-only'; proposal: PopulationProposal; reviewToken: string; changes: string[]; warnings: string[];
  distributions: { ratings: Array<{ bandId: string; count: number }>; ages: Array<NumericRange & { count: number }>;
    outsideAgeBands: number; strongest: Array<{ key: string; name: string; pwtr: number | null; ability?: number; estimatedPeakAbility?: number | null; declinePoints?: number }>;
    beforeInactive?: number; afterInactive?: number;
    unknownOfficial?: { currentPwtr: number; peakPwtr: number; peakRank: number; peakYear: number };
    beforeActive: number; afterActive: number; protectedTrainers: number; ceilingExclusive: number | null };
}
export interface PopulationReceipt {
  mode: 'applied'; proposalId: string; reviewToken: string;
  created: Array<{ key: string; trainerId: number; ratingId: number; pokemonIds: number[] }>;
}

const API = 'http://localhost:5000/trainer-management/population';
export async function fetchPopulation(): Promise<PopulationInspection> {
  return (await axios.get<{ data: PopulationInspection }>(API)).data.data;
}
export async function planPopulation(input: PopulationPlanningInput | InactivePopulationBrief): Promise<PopulationPlan> {
  return (await axios.post<{ data: PopulationPlan }>(`${API}/plan`, input)).data.data;
}
export async function validatePopulationBrief(value: unknown, snapshot: string): Promise<{ brief: PopulationBrief; plan: PopulationPlan }> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Load a complete brief object.');
  return (await axios.post<{ data: { brief: PopulationBrief; plan: PopulationPlan } }>(`${API}/brief`, { ...value, snapshot })).data.data;
}
export async function proposePopulation(input: PopulationBrief): Promise<PopulationProposal> {
  return (await axios.post<{ data: PopulationProposal }>(`${API}/proposals`, input)).data.data;
}
export async function reviewPopulation(proposal: unknown): Promise<PopulationReview> {
  return (await axios.post<{ data: PopulationReview }>(`${API}/review`, proposal)).data.data;
}
export async function rerollPopulation(proposal: PopulationProposal, trainerKey: string, section: RerollSection): Promise<PopulationReview> {
  return (await axios.post<{ data: PopulationReview }>(`${API}/reroll`, { proposal, trainerKey, section })).data.data;
}
export async function applyPopulation(review: PopulationReview): Promise<PopulationReceipt> {
  const current = await fetchPopulation();
  if (current.snapshot !== review.proposal.snapshot) throw new Error('The selected save changed. Export this draft and start a fresh batch against the current save.');
  return (await axios.post<{ data: PopulationReceipt }>(`${API}/apply`,
    { proposal: review.proposal, reviewToken: review.reviewToken })).data.data;
}
export function populationError(error: unknown): string {
  return axios.isAxiosError<{ error?: string }>(error) ? error.response?.data.error ?? error.message
    : error instanceof Error ? error.message : 'Population operation failed.';
}
export function exportPopulationJson(value: unknown, filename: string): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
