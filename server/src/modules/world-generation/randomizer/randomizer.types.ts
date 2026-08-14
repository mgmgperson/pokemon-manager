export interface RegionWeightRow {
  id: number;
  name: string;
  population: number;
}

export interface CityWeightRow {
  id: number;
  name: string;
  region_id: number;
  population: number;
}

export interface NameFrequencyRow {
  region_id: number;
  type: string;
  country: string;
  frequency: number;
}

export interface WeightCache {
  regions: RegionWeightRow[];
  regionWeights: number[];
  citiesByRegion: Map<number, CityWeightRow[]>;
  cityWeightsByRegion: Map<number, number[]>;
  nameFrequenciesByRegion: Map<string, Array<Pick<NameFrequencyRow, 'country' | 'frequency'>>>;
}

export interface TrainerForGeneration {
  id: number;
  pwtr_rating: number | null;
}

export interface RatingForGeneration {
  id: number;
  overall_rating: number | null;
  typing_rating: number | null;
  mixed_rating: number | null;
  special_rating: number | null;
}

export interface PokemonForFieldRating {
  species_id: number;
  pokemon_id: number;
  level: number;
  is_mega: number | null;
  is_gigantamax: number | null;
}
