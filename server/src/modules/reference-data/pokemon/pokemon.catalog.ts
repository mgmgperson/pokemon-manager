import { allPokemon, initPokemon } from '../../../reference-data/pokemon';
import { allSpecies, initSpecies } from '../../../reference-data/pokemon-species';
import { Abilities } from '../../../reference-data/enums/abilities';
import { EggGroups } from '../../../reference-data/enums/egg-groups';
import { GrowthRates } from '../../../reference-data/enums/growth-rates';
import { Types } from '../../../reference-data/enums/types';

export interface PokemonSpeciesSummary {
  id: number;
  name: string;
  generation: number;
  is_legendary: boolean;
  is_mythical: boolean;
}

export interface PokemonSpeciesDetail extends PokemonSpeciesSummary {
  base_happiness: number | null;
  capture_rate: number;
  genera: string;
}

export interface PokemonCatalogSummary {
  id: number;
  name: string;
  types: string[];
  is_default: boolean;
  base_stats: PokemonBaseStats;
}

interface PokemonBaseStats {
  hp: number;
  attack: number;
  defense: number;
  special_attack: number;
  special_defense: number;
  speed: number;
}

export interface PokemonCatalogDetail extends PokemonCatalogSummary {
  base_experience: number;
  abilities: string[];
  height: number;
  weight: number;
  species: {
    id: number;
    name: string;
    generation: number;
    genera: string;
    base_happiness: number | null;
    capture_rate: number;
    egg_groups: string[];
    evolves_from: { id: number; name: string } | null;
    forms_switchable: boolean;
    gender_rate: number;
    gender_ratio: string;
    growth_rate: string;
    has_gender_differences: boolean;
    hatch_counter: number | null;
    is_baby: boolean;
    is_legendary: boolean;
    is_mythical: boolean;
    varieties: Array<{ id: number; name: string; is_default: boolean }>;
  };
}

function ensureInitialized(): void {
  initPokemon();
  initSpecies();
}

function typeEnumToString(type: Types): string {
  return Types[type] || 'UNKNOWN';
}

function abilityEnumToString(ability: Abilities): string {
  return Abilities[ability] || 'UNKNOWN';
}

function eggGroupEnumToString(eggGroup: EggGroups): string {
  return EggGroups[eggGroup] || 'UNKNOWN';
}

function growthRateEnumToString(growthRate: GrowthRates): string {
  return GrowthRates[growthRate] || 'UNKNOWN';
}

function toSpeciesSummary(species: (typeof allSpecies)[number]): PokemonSpeciesSummary {
  return {
    id: species.id,
    name: species.name,
    generation: species.generation,
    is_legendary: species.isLegendary,
    is_mythical: species.isMythical,
  };
}

function toPokemonBaseStats(pokemon: (typeof allPokemon)[number]): PokemonBaseStats {
  return {
    hp: pokemon.baseHP,
    attack: pokemon.baseATK,
    defense: pokemon.baseDEF,
    special_attack: pokemon.baseSPATK,
    special_defense: pokemon.baseSPDEF,
    speed: pokemon.baseSPE,
  };
}

function toPokemonSummary(pokemon: (typeof allPokemon)[number]): PokemonCatalogSummary {
  return {
    id: pokemon.id,
    name: pokemon.name,
    types: pokemon.types.map(typeEnumToString),
    is_default: pokemon.isDefault,
    base_stats: toPokemonBaseStats(pokemon),
  };
}

export function listPokemonSpecies(limit?: number): PokemonSpeciesSummary[] {
  ensureInitialized();
  const species = allSpecies.map(toSpeciesSummary);
  return limit ? species.slice(0, limit) : species;
}

export function findPokemonSpeciesById(speciesId: number): PokemonSpeciesDetail | null {
  ensureInitialized();
  const species = allSpecies.find((candidate) => candidate.id === speciesId);

  if (!species) {
    return null;
  }

  const evolvedSpecies = species.evolvesFrom !== null
    ? allSpecies.find((candidate) => candidate.id === species.evolvesFrom)
    : null;

  return {
    ...toSpeciesSummary(species),
    base_happiness: species.baseHappiness,
    capture_rate: species.captureRate,
    genera: species.genera,
  };
}

export function listPokemonCatalog(limit?: number): PokemonCatalogSummary[] {
  ensureInitialized();
  const pokemon = allPokemon.map(toPokemonSummary);
  return limit ? pokemon.slice(0, limit) : pokemon;
}

export function findPokemonCatalogEntryById(pokemonId: number): PokemonCatalogDetail | null {
  ensureInitialized();
  const pokemon = allPokemon.find((candidate) => candidate.id === pokemonId);

  if (!pokemon) {
    return null;
  }

  const species = allSpecies.find((candidate) => candidate.id === pokemon.species);
  if (!species) {
    return null;
  }

  const evolvedSpecies = species.evolvesFrom !== null
    ? allSpecies.find((candidate) => candidate.id === species.evolvesFrom)
    : null;

  return {
    ...toPokemonSummary(pokemon),
    base_experience: pokemon.baseExperience,
    abilities: pokemon.abilities.map(abilityEnumToString),
    height: pokemon.height,
    weight: pokemon.weight,
    species: {
      id: species.id,
      name: species.name,
      generation: species.generation,
      genera: species.genera,
      base_happiness: species.baseHappiness,
      capture_rate: species.captureRate,
      egg_groups: species.eggGroups.map(eggGroupEnumToString),
      evolves_from: species.evolvesFrom !== null
        ? {
            id: species.evolvesFrom,
            name: evolvedSpecies?.name || 'Unknown',
          }
        : null,
      forms_switchable: species.formsSwitchable,
      gender_rate: species.genderRate,
      gender_ratio: species.getGenderRatio(),
      growth_rate: growthRateEnumToString(species.growthRate),
      has_gender_differences: species.hasGenderDifferences,
      hatch_counter: species.hatchCounter,
      is_baby: species.isBaby,
      is_legendary: species.isLegendary,
      is_mythical: species.isMythical,
      varieties: allPokemon
        .filter((candidate) => candidate.species === pokemon.species)
        .map((candidate) => ({
          id: candidate.id,
          name: candidate.name,
          is_default: candidate.isDefault,
        })),
    },
  };
}
