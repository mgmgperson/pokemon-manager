import { createHash } from 'crypto';
import { mkdir, rename, writeFile } from 'fs/promises';
import { dirname } from 'path';
import { AZGAAR_REVISION, AZGAAR_SOURCE_SHA256, CITY_NAME_BASES_PATH, parseCityNameBases } from '../infrastructure/reference/cityNameBases';
import { type AzgaarNameStyle, type CityNameBase } from '../generators/cityNameGenerator';

const sourceUrl = `https://raw.githubusercontent.com/Azgaar/Fantasy-Map-Generator/${AZGAAR_REVISION}/src/data/name-bases.ts`;
const upstreamStyles: Record<string, AzgaarNameStyle> = {
  English: 'english', Japanese: 'japanese', French: 'french', German: 'german', Italian: 'italian',
  Castillian: 'spanish', Korean: 'korean', Hawaiian: 'hawaiian',
};

async function downloadText(url: string): Promise<string> {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);
  return response.text();
}

async function main(): Promise<void> {
  const source = await downloadText(sourceUrl);
  if (createHash('sha256').update(source).digest('hex') !== AZGAAR_SOURCE_SHA256) {
    throw new Error('Upstream name-list checksum mismatch; existing local lists were not changed');
  }
  const license = await downloadText(`https://raw.githubusercontent.com/Azgaar/Fantasy-Map-Generator/${AZGAAR_REVISION}/LICENSE`);
  const bases: CityNameBase[] = [];
  // Parse only the pinned, checksum-verified data format; never execute downloaded TypeScript.
  const entries = /name: "([^"]+)",\s+i: \d+,\s+min: (\d+),\s+max: (\d+),\s+d: "[^"]*",\s+m: [\d.]+,\s+b: "([^"]+)"/g;
  for (const match of source.matchAll(entries)) {
    const style = upstreamStyles[match[1]];
    if (style) bases.push({ style, minLength: Number(match[2]), maxLength: Number(match[3]), names: match[4].split(',') });
  }
  const reference = { revision: AZGAAR_REVISION, sourceUrl, sourceSha256: AZGAAR_SOURCE_SHA256, license, bases };
  parseCityNameBases(reference);
  await mkdir(dirname(CITY_NAME_BASES_PATH), { recursive: true });
  const temporaryPath = `${CITY_NAME_BASES_PATH}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(reference) + '\n', { flag: 'wx' });
  await rename(temporaryPath, CITY_NAME_BASES_PATH);
  console.log(`Downloaded ${bases.length} city-name lists to ${CITY_NAME_BASES_PATH} (${Buffer.byteLength(JSON.stringify(reference))} bytes)`);
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
