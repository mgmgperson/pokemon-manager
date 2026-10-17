export const AZGAAR_NAME_STYLES = ['english', 'japanese', 'french', 'german', 'italian', 'spanish', 'korean', 'hawaiian'] as const;
export type AzgaarNameStyle = typeof AZGAAR_NAME_STYLES[number];
export type CityNameStyle = 'pokemon' | AzgaarNameStyle;
export type CityNamingStyle = CityNameStyle | 'mixed';
export const MAX_CITY_PROPOSAL_COUNT = 100;

export interface CityNameBase {
  style: AzgaarNameStyle;
  minLength: number;
  maxLength: number;
  names: string[];
}

// These are proposal vocabulary, not additions to the authored world's geography.
const pokemonNameRoots = [
  'Amber', 'Auburn', 'Azure', 'Cerise', 'Coral', 'Garnet', 'Ivory', 'Ochre', 'Opal', 'Russet', 'Sienna', 'Teal',
  'Aster', 'Azalea', 'Basil', 'Briar', 'Camellia', 'Clover', 'Dahlia', 'Fern', 'Hazel', 'Heather', 'Holly', 'Iris',
  'Juniper', 'Laurel', 'Linden', 'Magnolia', 'Mallow', 'Marigold', 'Mimosa', 'Nettle', 'Orchid', 'Primrose',
  'Rowan', 'Sorrel', 'Thistle', 'Willow', 'Yarrow', 'Agate', 'Beryl', 'Calcite', 'Flint', 'Jasper', 'Malachite',
  'Mica', 'Onyx', 'Peridot', 'Quartz', 'Spinel', 'Topaz', 'Tourmaline',
  'Alabaster', 'Amethyst', 'Apricot', 'Aquamarine', 'Carmine', 'Celestine', 'Chartreuse', 'Cinnabar', 'Citrine',
  'Cobalt', 'Copper', 'Crimson', 'Emerald', 'Indigo', 'Jade', 'Lapis', 'Lilac', 'Mauve', 'Pearl', 'Saffron',
  'Sapphire', 'Scarlet', 'Sepia', 'Silver', 'Tangerine', 'Turquoise', 'Umber', 'Vermilion', 'Violet',
  'Acacia', 'Alder', 'Anemone', 'Arbutus', 'Aspen', 'Begonia', 'Bluebell', 'Calendula', 'Cassia', 'Cedar',
  'Chicory', 'Clematis', 'Cypress', 'Elder', 'Freesia', 'Gardenia', 'Ginkgo', 'Hawthorn', 'Heliotrope',
  'Hibiscus', 'Hyacinth', 'Hydrangea', 'Jacaranda', 'Jasmine', 'Lavender', 'Lotus', 'Lupine', 'Myrtle',
  'Narcissus', 'Oleander', 'Peony', 'Petunia', 'Poppy', 'Rhododendron', 'Rosemary', 'Salvia', 'Sequoia',
  'Verbena', 'Wisteria', 'Zinnia', 'Andesite', 'Apatite', 'Basalt', 'Celestite', 'Chalcedony', 'Dolomite',
  'Feldspar', 'Galena', 'Gypsum', 'Hematite', 'Kyanite', 'Obsidian', 'Olivine', 'Pyrite', 'Rhyolite',
  'Selenite', 'Serpentine', 'Slate', 'Travertine', 'Zephyr', 'Aurora', 'Solstice', 'Equinox', 'Crescent',
  'Halcyon', 'Horizon', 'Mirage', 'Nimbus', 'Radiance', 'Serenade', 'Sonata', 'Tempest', 'Trillium',
  'Abelia', 'Achillea', 'Allium', 'Angelica', 'Artemisia', 'Balsam', 'Bergamot', 'Borage', 'Campanula',
  'Caraway', 'Catalpa', 'Celosia', 'Cosmos', 'Dianthus', 'Echinacea', 'Eglantine', 'Forsythia', 'Gentian',
  'Geranium', 'Goldenrod', 'Lantana', 'Larkspur', 'Lisianthus', 'Lobelia', 'Lunaria', 'Monarda', 'Nemesia',
  'Nigella', 'Oxalis', 'Passiflora', 'Pimpernel', 'Plumeria', 'Portulaca', 'Scabiosa', 'Silene', 'Statice',
  'Sweetbriar', 'Tamarisk', 'Valerian', 'Veronica', 'Viola', 'Amaranth', 'Aventurine', 'Azurite', 'Carnelian',
  'Corundum', 'Diopside', 'Fluorite', 'Iolite', 'Larimar', 'Lazurite', 'Lepidolite', 'Moonstone', 'Morganite',
  'Rhodonite', 'Rubellite', 'Sodalite', 'Sunstone', 'Tanzanite', 'Verdigris', 'Viridian', 'Aureole', 'Brilliance',
  'Cadence', 'Cascade', 'Cresset', 'Elysian', 'Iridescence', 'Luminary', 'Nocturne', 'Opaline', 'Reverie',
  'Sirocco', 'Starlight', 'Sundew', 'Sylvan', 'Vesper',
];
const settlementEndings = [
  'bank', 'brook', 'field', 'grove', 'stead', 'vale', 'wick', 'wood', 'borough', 'bridge', 'bury', 'crest',
  'dale', 'ford', 'gate', 'haven', 'hurst', 'mere', 'mont', 'ridge', 'stone', 'ton', 'view', 'well',
];
const imageryPrefixes = [
  'Bright', 'Cloud', 'Dawn', 'Dew', 'Dream', 'Dusk', 'Ember', 'Even', 'Frost', 'Glimmer', 'Glow', 'Gold',
  'Lumen', 'Mist', 'Moon', 'Morning', 'Night', 'Prism', 'Rain', 'Rose', 'Rune', 'Sea', 'Shimmer', 'Sky',
  'Snow', 'Spark', 'Spring', 'Star', 'Storm', 'Sun', 'Thorn', 'Tide', 'Twilight', 'Wind', 'Winter',
];
const imageryEndings = [
  'bell', 'bloom', 'bough', 'chime', 'crown', 'feather', 'glade', 'glass', 'gleam', 'heart', 'leaf', 'light',
  'lily', 'petal', 'plume', 'ribbon', 'song', 'spire', 'veil', 'whisper', 'wing',
];
const placeDescriptors = [
  'Bluffs', 'Commons', 'Crossing', 'Falls', 'Gardens', 'Harbor', 'Heights', 'Hollow', 'Landing', 'Park',
  'Point', 'Reach', 'Ridge', 'Shores', 'Springs', 'Terrace',
];
const POKEMON_TWO_WORD_NAME_CHANCE = 0.02;
const pokemonSeedNames = new Set([...pokemonNameRoots, ...imageryPrefixes].map((name) => name.toLowerCase()));
const pokemonChain = buildChain([...pokemonNameRoots, ...imageryPrefixes]);

export function isCityNameStyle(value: unknown): value is CityNameStyle {
  return value === 'pokemon' || isAzgaarNameStyle(value);
}

export function resolveCityNameStyles(style: CityNamingStyle, mixedStyles?: readonly CityNameStyle[]): CityNameStyle[] {
  if (style !== 'mixed') {
    if (!isCityNameStyle(style)) throw new Error('Unknown city naming style');
    if (mixedStyles !== undefined) throw new Error('mixedStyles is only supported for Mixed naming');
    return [style];
  }
  if (!Array.isArray(mixedStyles) || mixedStyles.length < 2 || mixedStyles.length > AZGAAR_NAME_STYLES.length + 1
    || !mixedStyles.every(isCityNameStyle) || new Set(mixedStyles).size !== mixedStyles.length) {
    throw new Error('Mixed naming requires 2–9 distinct supported styles');
  }
  return [...mixedStyles];
}

export function isAzgaarNameStyle(value: unknown): value is AzgaarNameStyle {
  return typeof value === 'string' && AZGAAR_NAME_STYLES.some((style) => style === value);
}

export function normalizeCityName(name: string): string {
  return name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

function pick<T>(choices: readonly T[], random: () => number): T {
  return choices[Math.floor(random() * choices.length)];
}

function pokemonName(random: () => number, islandName: boolean = false): { name: string; family: string } | null {
  let name: string;
  let family: string;
  if (random() < 0.5) {
    const stem = markovName({ minLength: 5, maxLength: 12 }, pokemonChain, random);
    if (!stem || pokemonSeedNames.has(stem.toLowerCase()) || /^[^aeiouy]{3}|[^aeiouy '-]{4}|[aeiouy]{4}/i.test(stem)) return null;
    name = stem;
    family = stem;
  } else {
    // Retain the relative mix of the existing single-word patterns.
    const pattern = random() * 0.75;
    if (pattern >= 0.45) {
      const prefix = pick(imageryPrefixes, random);
      name = prefix + pick(imageryEndings, random);
      family = prefix;
    } else {
      const root = pick(pokemonNameRoots, random);
      name = islandName || pattern < 0.25 ? root : root + pick(settlementEndings, random);
      family = root;
    }
  }
  if (!islandName && random() < POKEMON_TWO_WORD_NAME_CHANCE) name += ` ${pick(placeDescriptors, random)}`;
  return { name, family };
}

function buildChain(names: readonly string[]): Map<string, string[]> {
  const chain = new Map<string, string[]>();
  for (const name of names) {
    const letters = `^^${name.trim().toLowerCase()}$`;
    for (let index = 2; index < letters.length; index += 1) {
      const context = letters.slice(index - 2, index);
      const next = chain.get(context) ?? [];
      next.push(letters[index]);
      chain.set(context, next);
    }
  }
  return chain;
}

function markovName(base: Pick<CityNameBase, 'minLength' | 'maxLength'>, chain: Map<string, string[]>, random: () => number): string | null {
  let context = '^^';
  let name = '';
  for (let index = 0; index <= base.maxLength; index += 1) {
    const choices = chain.get(context);
    if (!choices?.length) return null;
    const next = pick(choices, random);
    if (next === '$') {
      if (name.length < base.minLength || !/^[a-z][a-z '-]*[a-z]$/i.test(name)) return null;
      return name.replace(/(^|[ -])(\S)/g, (_match, separator: string, letter: string) => separator + letter.toUpperCase());
    }
    name += next;
    context = context.slice(1) + next;
  }
  return null;
}

function oneEditApart(left: string, right: string): boolean {
  if (Math.min(left.length, right.length) < 4 || Math.abs(left.length - right.length) > 1) return false;
  let leftIndex = 0, rightIndex = 0, edits = 0;
  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] === right[rightIndex]) {
      leftIndex += 1;
      rightIndex += 1;
      continue;
    }
    if (++edits > 1) return false;
    if (left.length >= right.length) leftIndex += 1;
    if (right.length >= left.length) rightIndex += 1;
  }
  return true;
}

export function generateCityNames(
  count: number,
  style: CityNamingStyle,
  existingNames: readonly string[],
  bases: readonly CityNameBase[] = [],
  random: () => number = Math.random,
  mixedStyles?: readonly CityNameStyle[],
  islandNamePercent: number = 0
): string[] {
  if (!Number.isSafeInteger(count) || count < 1 || count > MAX_CITY_PROPOSAL_COUNT) {
    throw new Error(`City count must be between 1 and ${MAX_CITY_PROPOSAL_COUNT}`);
  }
  if (!Number.isFinite(islandNamePercent) || islandNamePercent < 0 || islandNamePercent > 100) {
    throw new Error('Island name percentage must be between 0 and 100');
  }
  const styles = resolveCityNameStyles(style, mixedStyles);
  const styleBases = new Map<CityNameStyle, CityNameBase>();
  const chains = new Map<CityNameStyle, Map<string, string[]>>();
  for (const selected of styles) {
    if (selected === 'pokemon') continue;
    const base = bases.find((candidate) => candidate.style === selected);
    if (!base) throw new Error(`Missing ${selected} name list; run npm run names:download in server/`);
    styleBases.set(selected, base);
    chains.set(selected, buildChain(base.names));
  }
  const rotation = styles.length > 1 ? Math.floor(random() * styles.length) : 0;
  const schedule = Array.from({ length: count }, (_, index) => styles[(index + rotation) % styles.length]);
  if (styles.length > 1) for (let index = schedule.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [schedule[index], schedule[other]] = [schedule[other], schedule[index]];
  }
  // Fix each row's naming choice before retries; collisions must not bias the island share.
  const islandNames = Array.from({ length: count }, () => islandNamePercent === 100
    || (islandNamePercent > 0 && random() < islandNamePercent / 100));
  const excluded = new Set(existingNames.map(normalizeCityName));
  const nearCollisionNames = [...excluded];
  const trainingNames = new Set<string>();
  // Avoid returning an unchanged training example; this is not a guarantee against all real-world names.
  for (const base of styleBases.values()) base.names.forEach((name) => {
    const normalized = normalizeCityName(name);
    excluded.add(normalized);
    trainingNames.add(normalized);
  });
  const names: string[] = [];
  const usedPokemonFamilies = new Set<string>();
  for (let attempt = 0; attempt < count * 200 && names.length < count; attempt += 1) {
    const selected = schedule[names.length];
    const islandName = islandNames[names.length];
    const base = styleBases.get(selected), chain = chains.get(selected);
    const pokemon = selected === 'pokemon' ? pokemonName(random, islandName) : null;
    const stem = pokemon ? pokemon.name : base && chain ? markovName(base, chain, random) : null;
    if (!stem) continue;
    if (islandName && (/\s|\bisland\b/i.test(stem) || trainingNames.has(normalizeCityName(stem)))) continue;
    const name = islandName ? `${stem} Island` : stem;
    if (pokemon && usedPokemonFamilies.has(pokemon.family)) continue;
    const normalized = normalizeCityName(name);
    if (excluded.has(normalized) || nearCollisionNames.some((existing) => oneEditApart(normalized, existing))) continue;
    excluded.add(normalized);
    nearCollisionNames.push(normalized);
    if (pokemon) usedPokemonFamilies.add(pokemon.family);
    names.push(name);
  }
  if (names.length !== count) throw new Error('Could not generate enough distinct city names; try another style or a smaller count');
  return names;
}
