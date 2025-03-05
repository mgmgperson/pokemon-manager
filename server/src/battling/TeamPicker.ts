import { PokemonRow } from '../types/database';
import { fetchTrainerPokemon, fetchTrainerFieldRating } from '../services/dbService';
import { fetchViabilityDoc } from '../services/mongoService';

/** 
 * Compute "field advantage" for a single Pokémon, given a field name and trainer ID.
 * This loads the viability doc from Mongo, the trainer's field rating from SQL,
 * and sums viability + trainerFieldRating + current_strength + level
 */
export async function computeFieldAdv(
  poke: PokemonRow,
  fieldName: string,
  trainerId: number
): Promise<number> {
  const viabilityDoc = await fetchViabilityDoc(poke.nickname || '');
  const trainerField = await fetchTrainerFieldRating(trainerId, fieldName);

  let viability = 50; // fallback
  if (viabilityDoc) {
    const ratingKey = fieldName + 'FieldRating'; // e.g. "windyFieldRating"
    viability = viabilityDoc.fieldRatings?.[ratingKey] ?? viabilityDoc.baseRating ?? 50;
  }
  const curStrength = poke.current_strength || 0;
  const lv = poke.level || 1;

  return viability * trainerField/100 * curStrength/100 * lv/100;
}

/**
 * Pick the best 6 Pokemon for a trainer on a given field (by advantage).
 */
export async function pickBest6PokemonForField(
  trainerId: number,
  fieldName: string
): Promise<PokemonRow[]> {
  // (1) get all their Pokemon
  const allPokes = await fetchTrainerPokemon(trainerId);

  // (2) compute field advantage for each
  const entries: Array<{ poke: PokemonRow; adv: number }> = [];
  for (const p of allPokes) {
    const adv = await computeFieldAdv(p, fieldName, trainerId);
    entries.push({ poke: p, adv });
  }

  // (3) sort descending by advantage
  entries.sort((a, b) => b.adv - a.adv);

  // (4) slice top 6
  return entries.slice(0, 6).map(e => e.poke);
}
