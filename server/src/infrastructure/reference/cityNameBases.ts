import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { AZGAAR_NAME_STYLES, isAzgaarNameStyle, type CityNameBase } from '../../generators/cityNameGenerator';

export const AZGAAR_REVISION = 'b944003c145459ca59f179e3c535414a29edade2';
export const AZGAAR_SOURCE_SHA256 = '7f1ea073c3ab88e4e28616ed44fcf609423a67742db48561a0138de150a247d5';
export const CITY_NAME_BASES_PATH = resolve(__dirname, '../../../../database/city-names/azgaar.json');

export function parseCityNameBases(value: unknown): CityNameBase[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid city-name reference file');
  const reference = value as Record<string, unknown>;
  if (reference.revision !== AZGAAR_REVISION || reference.sourceSha256 !== AZGAAR_SOURCE_SHA256
    || typeof reference.license !== 'string' || !reference.license.includes('MIT License') || !Array.isArray(reference.bases)) {
    throw new Error('Unexpected city-name reference source or format');
  }
  const bases = reference.bases.map((value: unknown): CityNameBase => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid city-name base');
    const base = value as Record<string, unknown>;
    if (!isAzgaarNameStyle(base.style) || typeof base.minLength !== 'number' || typeof base.maxLength !== 'number'
      || !Number.isInteger(base.minLength) || !Number.isInteger(base.maxLength) || base.minLength < 2
      || base.maxLength < base.minLength || base.maxLength > 40 || !Array.isArray(base.names)
      || base.names.length < 100 || !base.names.every((name: unknown) =>
        typeof name === 'string' && name.length <= 80 && /^[a-z][a-z '-]*[a-z]$/i.test(name))) {
      throw new Error('Invalid city-name base entries');
    }
    return { style: base.style, minLength: base.minLength, maxLength: base.maxLength, names: base.names as string[] };
  });
  if (bases.length !== AZGAAR_NAME_STYLES.length || new Set(bases.map((base) => base.style)).size !== bases.length) {
    throw new Error('City-name reference must contain each supported style exactly once');
  }
  return bases;
}

export async function loadCityNameBases(): Promise<CityNameBase[]> {
  try {
    return parseCityNameBases(JSON.parse(await readFile(CITY_NAME_BASES_PATH, 'utf8')));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`City-name lists unavailable: ${reason}. Run npm run names:download in server/`);
  }
}
