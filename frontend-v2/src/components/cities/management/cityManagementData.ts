import axios from 'axios';
import type { BasicRegion } from '../../../types/region';

export interface CityRecord {
  id: number;
  name: string;
  region_id: number;
  population: number | null;
  description: string | null;
  x_coordinate: number | null;
  y_coordinate: number | null;
  location_id: number | null;
}

export interface MapPoint { x: number; y: number; }

export interface LocationOption {
  id: number;
  name: string;
  region_id: number;
  population: number | null;
  polygon: MapPoint[] | null;
}

export interface LocationCandidate {
  locationId: number;
  locationName: string;
  signals: Array<'exact-name' | 'inside-polygon' | 'nearest-polygon'>;
  distance: number | null;
}

export const locationSignalLabels: Record<LocationCandidate['signals'][number], string> = {
  'exact-name': 'Exact name match',
  'inside-polygon': 'City inside polygon',
  'nearest-polygon': 'Nearest polygon fallback — not containment',
};

export interface BulkCityLink {
  cityId: number;
  cityName: string;
  regionId: number;
  population: number;
  locationId: number;
  locationName: string;
  signals: LocationCandidate['signals'];
  remainingAfterBatch: number;
}

export interface BulkCityLinkPreview {
  snapshot: string;
  links: BulkCityLink[];
  skipped: Array<{ cityId: number; cityName: string; regionId: number; reason: string }>;
}

export interface CityLocationReview {
  city: CityRecord;
  point: MapPoint | null;
  locations: LocationOption[];
  candidates: LocationCandidate[];
}

export interface LocationBudget extends LocationOption {
  cities: CityRecord[];
  assignedPopulation: number | null;
  remainingPopulation: number | null;
}

const API = 'http://localhost:5000';

export async function fetchRegions(): Promise<BasicRegion[]> {
  const response = await axios.get<{ data: BasicRegion[] }>(`${API}/regions`);
  return response.data.data;
}

export async function fetchCities(): Promise<CityRecord[]> {
  const response = await axios.get<{ data: CityRecord[] }>(`${API}/cities`);
  return response.data.data;
}

export async function fetchCityLocationReview(cityId: number): Promise<CityLocationReview> {
  const response = await axios.get<{ data: CityLocationReview }>(`${API}/city-management/cities/${cityId}/locations`);
  return response.data.data;
}

export async function fetchLocationBudget(locationId: number): Promise<LocationBudget> {
  const response = await axios.get<{ data: LocationBudget }>(`${API}/city-management/locations/${locationId}`);
  return response.data.data;
}

export async function changeCityLocation(cityId: number, locationId: number | null): Promise<void> {
  await axios.put(`${API}/city-management/cities/${cityId}/location`, { location_id: locationId });
}

export async function fetchBulkLinkPreview(): Promise<BulkCityLinkPreview> {
  const response = await axios.get<{ data: BulkCityLinkPreview }>(`${API}/city-management/bulk-links/preview`);
  return response.data.data;
}

export async function applyBulkLinkPreview(preview: BulkCityLinkPreview): Promise<number> {
  const response = await axios.post<{ data: { linkedCount: number } }>(`${API}/city-management/bulk-links/apply`, {
    snapshot: preview.snapshot, links: preview.links.map(({ cityId, locationId }) => ({ cityId, locationId })),
  });
  return response.data.data.linkedCount;
}
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: unknown }>(error) && typeof error.response?.data?.error === 'string') {
    return error.response.data.error;
  }
  return error instanceof Error ? error.message : 'Unable to complete the request';
}

export function formatPopulation(population: number | null): string {
  return population === null ? 'Unknown' : population.toLocaleString();
}

export function reviewLocationPopulation(
  city: CityRecord,
  locationId: number | null,
  budget: LocationBudget | undefined
): { remainingAfterLink: number | null; conflict: string | null } {
  if (locationId === null || !budget) return { remainingAfterLink: null, conflict: null };
  if (city.population === null || !Number.isSafeInteger(city.population) || city.population <= 0) {
    return { remainingAfterLink: null, conflict: 'Complete the city’s positive population before linking.' };
  }
  if (budget.region_id !== city.region_id || budget.cities.some((assigned) => assigned.region_id !== city.region_id)) {
    return { remainingAfterLink: null, conflict: 'City and assigned location must belong to the same region.' };
  }
  if (budget.remainingPopulation === null) {
    return { remainingAfterLink: null, conflict: 'Complete the location and assigned city populations before linking.' };
  }
  const remainingAfterLink = budget.remainingPopulation - (locationId === city.location_id ? 0 : city.population);
  return { remainingAfterLink, conflict: remainingAfterLink < 0 ? 'This city exceeds the selected location’s population budget.' : null };
}
