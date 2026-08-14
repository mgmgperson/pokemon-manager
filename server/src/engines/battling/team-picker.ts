import Decimal from 'decimal.js';
import { PokemonRow } from '../../types/database';
import { Fields } from '../../reference-data/enums/fields';
import { Pokemon } from '../../reference-data/enums/pokemon';
import { viabilityRatings } from '../../reference-data/texts/viabilityDecimals';

export interface SelectedPokemon {
  poke: PokemonRow;
  adv: number;
  suffix: string;
}

interface RankedPokemon extends SelectedPokemon {
  baseAdv: number;
}

function getEffectiveVariant(pokemon: PokemonRow): { effectiveId: Pokemon; displaySuffix: string } {
  const baseId = pokemon.pokemon_id as Pokemon;
  const baseName = Pokemon[baseId];
  let effectiveId = baseId;
  let displaySuffix = '';

  if (pokemon.is_mega) {
    const megaId = Pokemon[`${baseName}_MEGA` as keyof typeof Pokemon];
    if (typeof megaId === 'number') {
      effectiveId = megaId;
      displaySuffix = ' (Mega)';
    }
  } else if (pokemon.is_gigantamax) {
    const gmaxId = Pokemon[`${baseName}_GMAX` as keyof typeof Pokemon];
    if (typeof gmaxId === 'number') {
      effectiveId = gmaxId;
      displaySuffix = ' (GMax)';
    }
  }

  return { effectiveId, displaySuffix };
}

export function fieldIdForName(fieldName: string): Fields | null {
  const fieldId = Fields[fieldName.toUpperCase() as keyof typeof Fields];
  return typeof fieldId === 'number' ? fieldId : null;
}

export function computeFieldAdvantage(
  pokemon: PokemonRow,
  fieldName: string,
  trainerFieldRating: number,
  effectiveId: Pokemon
): number {
  const fieldId = fieldIdForName(fieldName);
  if (fieldId === null) {
    return 0;
  }

  const staticViability = viabilityRatings[effectiveId];
  const viability: Decimal = staticViability?.[fieldId] ?? new Decimal(50);
  const currentStrength = pokemon.current_strength || 0;
  const level = pokemon.level || 1;
  return viability.toNumber() * (trainerFieldRating / 100) * (currentStrength / 100) * (level / 100);
}

export function pickBest6PokemonForField(
  pokemon: PokemonRow[],
  fieldName: string,
  trainerFieldRating: number
): SelectedPokemon[] {
  const rankedPokemon: RankedPokemon[] = [];

  for (const pokemonInstance of pokemon) {
    if (pokemonInstance.pokemon_id === null) {
      continue;
    }

    const { effectiveId, displaySuffix } = getEffectiveVariant(pokemonInstance);
    const variantAdvantage = computeFieldAdvantage(
      pokemonInstance,
      fieldName,
      trainerFieldRating,
      effectiveId
    );
    const baseAdvantage = computeFieldAdvantage(
      pokemonInstance,
      fieldName,
      trainerFieldRating,
      pokemonInstance.pokemon_id as Pokemon
    );
    rankedPokemon.push({
      poke: pokemonInstance,
      adv: variantAdvantage,
      suffix: displaySuffix,
      baseAdv: baseAdvantage,
    });
  }

  rankedPokemon.sort((left, right) => right.adv - left.adv);

  const selectedTeam: SelectedPokemon[] = [];
  let variantUsed = false;
  let index = 0;
  while (selectedTeam.length < 6 && index < rankedPokemon.length) {
    const candidate = rankedPokemon[index];
    if (candidate.suffix !== '' && variantUsed) {
      selectedTeam.push({ poke: candidate.poke, adv: candidate.baseAdv, suffix: '' });
    } else {
      selectedTeam.push({
        poke: candidate.poke,
        adv: candidate.adv,
        suffix: candidate.suffix,
      });
      variantUsed = variantUsed || candidate.suffix !== '';
    }
    index += 1;
  }

  while (selectedTeam.length < 6 && index < rankedPokemon.length) {
    const candidate = rankedPokemon[index];
    if (candidate.suffix === '') {
      selectedTeam.push({ poke: candidate.poke, adv: candidate.adv, suffix: '' });
    }
    index += 1;
  }

  return selectedTeam;
}
