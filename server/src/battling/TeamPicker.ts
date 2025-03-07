import { PokemonRow } from "../types/database";
import { fetchTrainerPokemon, fetchTrainerFieldRating } from "../services/dbService";
import { Pokemon } from "../data/enums/pokemon";
import { Fields } from "../data/enums/fields";
import { viabilityRatings } from "../data/texts/viabilityDecimals";
import Decimal from "decimal.js";

/**
 * Returns an object containing:
 * - effectiveId: the Pokemon enum value to use for viability lookup (the variant if mega/gmax is active).
 * - displaySuffix: a string suffix to add to the name in battle (e.g., " (Mega)" or " (GMax)").
 *
 * It checks if the PokemonRow is marked as mega or gigamax. If so, it tries to find the corresponding
 * variant in the Pokemon enum. If not found, it falls back to the base variant.
 */
function getEffectiveVariant(poke: PokemonRow): { effectiveId: Pokemon; displaySuffix: string } {
  const baseId = poke.pokemon_id as Pokemon;
  const baseName = Pokemon[baseId]; // e.g., "MR_MIME"
  
  let effectiveId = baseId;
  let displaySuffix = "";

  if (poke.is_mega) {
    const megaName = baseName + "_MEGA";
    if (megaName in Pokemon) {
      effectiveId = (Pokemon as any)[megaName];
      displaySuffix = " (Mega)";
    }
  } else if (poke.is_gigantamax) {
    const gmaxName = baseName + "_GMAX";
    if (gmaxName in Pokemon) {
      effectiveId = (Pokemon as any)[gmaxName];
      displaySuffix = " (GMax)";
    }
  }
  return { effectiveId, displaySuffix };
}

/**
 * Compute "field advantage" for a single Pokémon using static viability data.
 * Uses the provided effective Pokemon variant for viability lookup.
 */
export async function computeFieldAdv(
  poke: PokemonRow,
  fieldName: string,
  trainerId: number,
  effectiveId: Pokemon
): Promise<number> {
  const fieldEnumValue = Fields[fieldName.toUpperCase() as keyof typeof Fields];
  if (!fieldEnumValue) {
    return 0;
  }
  const staticViability = viabilityRatings[effectiveId];
  let viability = 50; // fallback value
  if (staticViability && staticViability[fieldEnumValue]) {
    viability = staticViability[fieldEnumValue].toNumber();
  }
  const trainerField = await fetchTrainerFieldRating(trainerId, fieldName);
  const curStrength = poke.current_strength || 0;
  const lv = poke.level || 1;
  // Example damage factor formula (adjust as needed)
  return viability * (trainerField / 100) * (curStrength / 100) * (lv / 100);
}

/**
 * Pick the best 6 Pokémon for a trainer on a given field.
 * For each PokemonRow, we compute the field advantage using the effective variant.
 * Then we build the final team such that at most one Pokémon with a non-empty suffix (variant) appears.
 */
export async function pickBest6PokemonForField(
  trainerId: number,
  fieldName: string
): Promise<Array<{ poke: PokemonRow; adv: number; suffix: string }>> {
  const allPokes = await fetchTrainerPokemon(trainerId);
  const entries: Array<{ poke: PokemonRow; adv: number; suffix: string; baseAdv: number }> = [];

  // Compute both variant advantage and base advantage
  for (const p of allPokes) {
    if (p.pokemon_id === null) continue;
    // Compute effective variant advantage (with potential suffix)
    const { effectiveId, displaySuffix } = getEffectiveVariant(p);
    const variantAdv = await computeFieldAdv(p, fieldName, trainerId, effectiveId);
    // Compute base advantage (with no suffix) by using the base ID
    const baseAdv = await computeFieldAdv(p, fieldName, trainerId, p.pokemon_id as Pokemon);
    entries.push({ poke: p, adv: variantAdv, suffix: displaySuffix, baseAdv });
  }

  // Sort entries descending by advantage (using variant advantage)
  entries.sort((a, b) => b.adv - a.adv);

  // Build final team ensuring at most one entry with a non-empty suffix.
  const finalTeam: Array<{ poke: PokemonRow; adv: number; suffix: string }> = [];
  let variantUsed = false;

  let idx = 0;
  while (finalTeam.length < 6 && idx < entries.length) {
    const entry = entries[idx];
    // If this entry has a variant suffix:
    if (entry.suffix !== "") {
      // If a variant has already been used, try to use the base entry instead
      if (variantUsed) {
        // Check if the base advantage (with no suffix) is available and not already in the team.
        // We add the base entry instead:
        finalTeam.push({ poke: entry.poke, adv: entry.baseAdv, suffix: "" });
      } else {
        // Allow the variant and mark variantUsed as true.
        finalTeam.push({ poke: entry.poke, adv: entry.adv, suffix: entry.suffix });
        variantUsed = true;
      }
    } else {
      // Normal (base) entry, always allowed.
      finalTeam.push({ poke: entry.poke, adv: entry.adv, suffix: "" });
    }
    idx++;
  }

  // If after this process we have fewer than 6 entries, then fill with any remaining base entries.
  // (This is a fallback; ideally your team always has at least 6.)
  while (finalTeam.length < 6 && idx < entries.length) {
    const entry = entries[idx];
    if (entry.suffix === "") {
      finalTeam.push({ poke: entry.poke, adv: entry.adv, suffix: "" });
    }
    idx++;
  }

  return finalTeam;
}
