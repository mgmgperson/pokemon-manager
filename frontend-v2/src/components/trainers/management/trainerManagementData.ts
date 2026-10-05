import axios from 'axios';

export interface ManagementRegion {
  id: number;
  name: string;
}

export interface ManagementCity {
  id: number;
  name: string;
  region_id: number;
}

export interface GeneralRatingProposal {
  overallRating: number;
  typingRating: number;
  mixedRating: number;
  specialRating: number;
}

export async function fetchManagementRegions(): Promise<ManagementRegion[]> {
  const { data } = await axios.get<{ data: ManagementRegion[] }>('http://localhost:5000/regions');
  return data.data;
}

export async function fetchManagementCities(): Promise<ManagementCity[]> {
  const { data } = await axios.get<{ data: ManagementCity[] }>('http://localhost:5000/cities');
  return data.data;
}
