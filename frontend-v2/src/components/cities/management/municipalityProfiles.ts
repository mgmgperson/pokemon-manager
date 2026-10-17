import { resolvePopulationBudget } from './municipalityData';

export interface MunicipalityProfile {
  id: string;
  name: string;
  description: string;
  populationPerCity: number;
  budgetPercentage: number;
  minimumPopulation: number;
  alpha: number;
  offset: number;
}

export const municipalityProfiles: readonly MunicipalityProfile[] = [
  {
    id: 'route', name: 'Route / sparse settlements', description: 'A populated corridor with a few settlements, leaving most remaining population outside generated municipalities.',
    populationPerCity: 25000, budgetPercentage: 10, minimumPopulation: 1000, alpha: 1.3, offset: 0,
  },
  {
    id: 'rural', name: 'Rural', description: 'A few small centres, with most remaining population left outside generated municipalities.',
    populationPerCity: 40000, budgetPercentage: 25, minimumPopulation: 1000, alpha: 1.5, offset: 0,
  },
  {
    id: 'small-towns', name: 'Small-town network', description: 'Several towns with a moderate size spread and a substantial non-municipal remainder.',
    populationPerCity: 40000, budgetPercentage: 50, minimumPopulation: 2000, alpha: 1.2, offset: 1,
  },
  {
    id: 'suburban', name: 'Suburban area', description: 'Many municipalities with a flatter distribution, suited to a large suburban belt.',
    populationPerCity: 60000, budgetPercentage: 80, minimumPopulation: 5000, alpha: 0.85, offset: 2,
  },
  {
    id: 'urban', name: 'Urban centre + satellites', description: 'A dominant centre and smaller satellites, using most of the remaining population.',
    populationPerCity: 80000, budgetPercentage: 95, minimumPopulation: 10000, alpha: 1.4, offset: 0,
  },
  {
    id: 'island', name: 'Island / coastal towns', description: 'A main town and smaller settlements, with room for population outside municipalities; not for every island.',
    populationPerCity: 15000, budgetPercentage: 60, minimumPopulation: 1000, alpha: 1.5, offset: 0,
  },
];

export function profileCityCount(profile: MunicipalityProfile, remainingPopulation: number | null, maximumCityCount: number): number {
  const budget = resolvePopulationBudget(String(profile.budgetPercentage), 'percentage', remainingPopulation);
  if (!Number.isSafeInteger(budget) || budget < profile.minimumPopulation) return 0;
  return Math.min(maximumCityCount, Math.floor(budget / profile.minimumPopulation), Math.max(1, Math.round(budget / profile.populationPerCity)));
}
