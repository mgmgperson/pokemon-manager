import { allNatures, initNatures } from '../../../reference-data/nature';
import { Stat } from '../../../reference-data/enums/stat';

export interface NatureCatalogEntry {
  id: number;
  name: string;
  increased_stat: string;
  decreased_stat: string;
}

function ensureInitialized(): void {
  initNatures();
}

function statEnumToString(stat: Stat): string {
  switch (stat) {
    case Stat.HP:
      return 'hp';
    case Stat.ATK:
      return 'attack';
    case Stat.DEF:
      return 'defense';
    case Stat.SPATK:
      return 'special-attack';
    case Stat.SPDEF:
      return 'special-defense';
    case Stat.SPE:
      return 'speed';
    case Stat.ACC:
      return 'accuracy';
    case Stat.EVA:
      return 'evasion';
    default:
      return 'unknown';
  }
}

function toCatalogEntry(nature: (typeof allNatures)[number]): NatureCatalogEntry {
  return {
    id: nature.id,
    name: nature.name,
    increased_stat: statEnumToString(nature.increasedStat),
    decreased_stat: statEnumToString(nature.decreasedStat),
  };
}

ensureInitialized();

export function listNatures(limit?: number): NatureCatalogEntry[] {
  ensureInitialized();

  const natures = allNatures.map(toCatalogEntry);
  return limit ? natures.slice(0, limit) : natures;
}

export function findNatureById(natureId: number): NatureCatalogEntry | null {
  ensureInitialized();

  const nature = allNatures.find((candidate) => candidate.id === natureId);
  return nature ? toCatalogEntry(nature) : null;
}
