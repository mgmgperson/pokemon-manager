import axios from 'axios';
import type { LocationBudget, LocationOption, MapPoint } from './cityManagementData';

export interface MunicipalityReview extends LocationBudget {
  snapshot: string;
  regionNames: string[];
  existingPlaceNames: string[];
  description: string | null;
  terrains: Array<{ name: string; rate: number | null }>;
  namingStyles: string[];
  maximumCityCount: number;
}

export interface MunicipalityOptions {
  cityCount: number;
  populationBudget: number;
  minimumPopulation: number;
  alpha: number;
  offset: number;
  namingStyle: string;
  mixedStyles?: string[];
  islandNamePercent?: number;
}

export interface ProposedMunicipality { name: string; population: number; point: MapPoint; }
export interface MunicipalityProposal {
  snapshot: string;
  parameters: MunicipalityOptions;
  cities: ProposedMunicipality[];
}

export interface ReviewedInput {
  snapshot: string;
  populationBudget: number;
  minimumPopulation: number;
  cities: ProposedMunicipality[];
}

export interface ReviewedMunicipalities extends ReviewedInput {
  locationId: number;
  regionId: number;
  totalPopulation: number;
  remainingPopulation: number;
}

export interface DraftMunicipality { name: string; population: string; x: string; y: string; rerollStyle?: string; islandName?: boolean; }

const API = 'http://localhost:5000/city-management';

export async function fetchGenerationLocations(regionId: number): Promise<LocationOption[]> {
  const response = await axios.get<{ data: LocationOption[] }>(`${API}/regions/${regionId}/locations`);
  return response.data.data;
}

export async function fetchMunicipalityReview(locationId: number): Promise<MunicipalityReview> {
  const response = await axios.get<{ data: MunicipalityReview }>(`${API}/locations/${locationId}/generation`);
  return response.data.data;
}

export async function generateMunicipalities(locationId: number, snapshot: string, options: MunicipalityOptions): Promise<MunicipalityProposal> {
  const response = await axios.post<{ data: MunicipalityProposal }>(`${API}/locations/${locationId}/proposals`, { snapshot, options });
  return response.data.data;
}

export async function reviewMunicipalities(locationId: number, proposal: ReviewedInput): Promise<ReviewedMunicipalities> {
  const response = await axios.post<{ data: ReviewedMunicipalities }>(`${API}/locations/${locationId}/proposals/review`, proposal);
  return response.data.data;
}

export async function applyMunicipalities(locationId: number, reviewed: ReviewedMunicipalities): Promise<number> {
  const { snapshot, populationBudget, minimumPopulation, cities } = reviewed;
  const response = await axios.post<{ data: { createdCities: Array<ProposedMunicipality & { id: number }> } }>(
    `${API}/locations/${locationId}/proposals/apply`, { snapshot, populationBudget, minimumPopulation, cities });
  return response.data.data.createdCities.length;
}

export async function rerollMunicipalityName(locationId: number, snapshot: string, namingStyle: string, excludedNames: string[], mixedStyles?: string[], islandName: boolean = false): Promise<string> {
  const response = await axios.post<{ data: string }>(`${API}/locations/${locationId}/names`,
    { snapshot, namingStyle, excludedNames, ...(namingStyle === 'mixed' ? { mixedStyles } : {}), islandName });
  return response.data.data;
}

export function numericInput(value: string): number { return value.trim() === '' ? NaN : Number(value); }

export type PopulationBudgetMode = 'amount' | 'percentage';

export function resolvePopulationBudget(value: string, mode: PopulationBudgetMode, remainingPopulation: number | null): number {
  const requested = numericInput(value);
  if (mode === 'amount') return requested;
  if (!Number.isFinite(requested) || requested <= 0 || requested > 100
    || remainingPopulation === null || !Number.isSafeInteger(remainingPopulation) || remainingPopulation <= 0) return NaN;
  return requested === 100 ? remainingPopulation : Math.floor(remainingPopulation * requested / 100);
}

export function parseDraftCities(cities: DraftMunicipality[]): ProposedMunicipality[] {
  return cities.map((city) => ({ name: city.name.trim(), population: numericInput(city.population),
    point: { x: numericInput(city.x), y: numericInput(city.y) } }));
}

export function namingStyleLabel(style: string): string {
  if (style === 'pokemon') return 'Pokémon · words + Markov';
  return style === 'mixed' ? 'Mixed · selected styles' : `${style.charAt(0).toUpperCase()}${style.slice(1)} · Markov`;
}

export function municipalityNameWarnings(cities: readonly Pick<ProposedMunicipality, 'name'>[], existingNames: readonly string[]): (string | null)[] {
  const normalize = (name: string): string => name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
  const existing = new Set(existingNames.map(normalize));
  const counts = new Map<string, number>();
  const names = cities.map((city) => normalize(city.name));
  for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  return names.map((name) => {
    if (!name) return null;
    const warnings: string[] = [];
    if (existing.has(name)) warnings.push('Name already used by a city or location in this save.');
    if ((counts.get(name) ?? 0) > 1) warnings.push('Name repeated in this proposal.');
    return warnings.length ? warnings.join(' ') : null;
  });
}

export function generationConflict(review: MunicipalityReview): string | null {
  if (review.remainingPopulation === null || review.remainingPopulation < 0
    || review.cities.some((city) => city.region_id !== review.region_id)) return 'Complete valid location and assigned-city populations/regions first.';
  if (!review.polygon) return 'This location needs a valid polygon before cities can be generated.';
  if (review.remainingPopulation === 0) return 'This location is fully allocated. There is no population available for new municipalities.';
  return null;
}

export function draftConflict(cities: ProposedMunicipality[], proposal: MunicipalityProposal): string | null {
  if (cities.length === 0) return 'Keep at least one proposed city, or discard the proposal.';
  if (cities.some((city) => !city.name || city.name.length > 200)) return 'Every city needs a name of 1–200 characters.';
  if (cities.some((city) => !Number.isSafeInteger(city.population) || city.population < proposal.parameters.minimumPopulation)) {
    return `City populations must be whole numbers of at least ${proposal.parameters.minimumPopulation}.`;
  }
  const total = cities.reduce((sum, city) => sum + city.population, 0);
  if (!Number.isSafeInteger(total) || total > proposal.parameters.populationBudget) return 'Edited populations exceed this proposal’s municipality budget.';
  if (cities.some((city) => [city.point.x, city.point.y].some((value) => !Number.isFinite(value) || value < 0 || value > 1))) {
    return 'Every coordinate needs a number between 0 and 1. Polygon containment is checked by the backend during review.';
  }
  return null;
}
