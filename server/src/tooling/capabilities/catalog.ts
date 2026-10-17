import { lstat, readFile, readdir, realpath } from 'fs/promises';
import { join } from 'path';
import { CapabilityRecord, Catalog, CatalogStatus, SourceStamp } from './catalog-types';
import { Inventory } from './types';
import { buildInventory, extractorFingerprint } from './inventory';
import { renderNavigationIndex } from './navigation';
import { writeCatalogArtifacts } from './catalog-artifacts';
import { discoverSources, fingerprint } from './source';
import { validateInventory, validateRecords } from './validation';

function missing(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
async function readArtifactText(root: string, path: string): Promise<string> {
  let absolute = root;
  for (const part of path.split('/')) {
    absolute = join(absolute, part);
    if ((await lstat(absolute)).isSymbolicLink()) throw new Error(`Catalog symlink refused: ${path}`);
  }
  const stat = await lstat(absolute);
  if (!stat.isFile() || stat.size > 64 * 1024 * 1024) throw new Error(`Catalog artifact is not a bounded regular file: ${path}`);
  return readFile(absolute, 'utf8');
}
async function readArtifact(root: string, path: string): Promise<unknown> {
  return JSON.parse(await readArtifactText(root, path)) as unknown;
}
export async function readCapabilityRecords(root: string): Promise<{ records: CapabilityRecord[]; state: 'missing' | 'valid' }> {
  const directory = '.pm/capabilities/records';
  try {
    for (const path of ['.pm', '.pm/capabilities', directory]) {
      if ((await lstat(join(root, path))).isSymbolicLink()) throw new Error(`Catalog symlink refused: ${path}`);
    }
    const names = (await readdir(join(root, directory))).filter(name => name.endsWith('.json')).sort();
    if (names.length > 128) throw new Error('Too many capability record files');
    const records: CapabilityRecord[] = [];
    for (const name of names) {
      if (!/^[a-z0-9-]+\.json$/.test(name)) throw new Error('Invalid capability record filename');
      records.push(...validateRecords(await readArtifact(root, `${directory}/${name}`)));
    }
    if (records.length > 5000) throw new Error('Too many capability records');
    if (new Set(records.map(record => record.id)).size !== records.length) throw new Error('Duplicate capability ID across domains');
    return { records, state: names.length ? 'valid' : 'missing' };
  } catch (error: unknown) {
    if (missing(error)) return { records: [], state: 'missing' };
    throw error;
  }
}

export function dependencyPaths(inventory: Inventory, roots: string[]): string[] {
  const paths = new Set(inventory.files.map(file => file.path));
  const edges = new Map<string, Set<string>>();
  for (const link of inventory.links) {
    const target = link.target?.split('#')[0];
    if (!target || !paths.has(target) || !paths.has(link.path)) continue;
    const targets = edges.get(link.path) ?? new Set<string>(); targets.add(target); edges.set(link.path, targets);
  }
  const found = new Set<string>();
  const queue = [...roots];
  while (queue.length) {
    const path = queue.pop() as string;
    if (found.has(path) || !paths.has(path)) continue;
    found.add(path);
    queue.push(...(edges.get(path) ?? []));
    const parents = path.split('/'); parents.pop();
    while (parents.length) {
      const manifest = `${parents.join('/')}/package.json`;
      if (paths.has(manifest)) { queue.push(manifest); break; }
      parents.pop();
    }
  }
  return [...found].sort();
}

function dependencyRoots(inventory: Inventory, references: string[]): string[] {
  return references.map(reference => {
    const point = inventory.accessPoints.find(point => point.id === reference);
    return (point?.target ?? reference).split('#')[0];
  });
}

export function stampReviewedCapability(inventory: Inventory,
  record: Omit<CapabilityRecord, 'inspectedSources' | 'dependencies' | 'extractorFingerprint'>,
  inspectedPaths: string[]): CapabilityRecord {
  const hashes = new Map(inventory.files.map(file => [file.path, file.fingerprint]));
  function stamp(path: string): SourceStamp {
    const hash = hashes.get(path);
    if (!hash) throw new Error(`Review references ineligible/missing source: ${path}`);
    return { path, fingerprint: hash };
  }
  const inspected = [...new Set(inspectedPaths)].sort();
  const dependencies = dependencyPaths(inventory, dependencyRoots(inventory, [...record.entryPoints, ...record.contracts])).filter(path => !inspected.includes(path));
  return validateRecords({ version: 1, records: [{ ...record, extractorFingerprint: inventory.extractorFingerprint,
    inspectedSources: inspected.map(stamp), dependencies: dependencies.map(stamp) }] })[0];
}

function emptyStatus(): CatalogStatus {
  return { state: 'missing', recordsState: 'missing', navigation: 'missing', issues: [],
    drift: { added: [], removed: [], changed: [], extractorChanged: false, coverageChanged: false },
    counts: { files: 0, symbols: 0, accessPoints: 0, explanations: 0, staleExplanations: 0 },
    coverage: { complete: false, diagnostics: {}, limitations: ['Missing inventory; run catalog-capabilities.ts refresh from server/.'] } };
}

async function inspectCatalog(repositoryRoot: string, replacement?: Inventory, checkNavigation = true): Promise<Catalog> {
  const catalog: Catalog = { inventory: null, records: [], freshness: new Map(), currentHashes: new Map(), status: emptyStatus() };
  try {
    const root = await realpath(repositoryRoot);
    let value: unknown;
    try { value = replacement ?? await readArtifact(root, '.pm/capabilities/inventory.json'); }
    catch (error: unknown) { if (missing(error)) return catalog; throw error; }
    const inventory = validateInventory(value);
    catalog.inventory = inventory;
    const records = await readCapabilityRecords(root);
    catalog.records = records.records;
    catalog.status.recordsState = records.state;
    const discovery = await discoverSources(root);
    // Hash only freshly discovered eligible paths, never paths supplied by a stored record/artifact.
    for (const file of discovery.files) catalog.currentHashes.set(file.path, fingerprint(await readFile(join(root, file.path))));
    const previous = new Map(inventory.files.map(file => [file.path, file.fingerprint]));
    const added = [...catalog.currentHashes.keys()].filter(path => !previous.has(path)).sort();
    const removed = [...previous.keys()].filter(path => !catalog.currentHashes.has(path)).sort();
    const changed = [...catalog.currentHashes.keys()].filter(path => previous.has(path) && previous.get(path) !== catalog.currentHashes.get(path)).sort();
    const extractor = await extractorFingerprint();
    const extractorChanged = extractor !== inventory.extractorFingerprint;
    const formats: Record<string, number> = {};
    for (const file of discovery.files) formats[file.language] = (formats[file.language] ?? 0) + 1;
    const uncertainExclusions = (entries: Inventory['coverage']['exclusions']): string => JSON.stringify(entries
      .filter(entry => entry.reason.startsWith('non-source/unrecognized format:') || entry.reason === 'symlink (not followed)')
      .map(entry => [entry.path, entry.reason, entry.entries]).sort());
    const coverageChanged = JSON.stringify(Object.entries(formats).sort()) !== JSON.stringify(Object.entries(inventory.coverage.formats).sort())
      || uncertainExclusions(discovery.exclusions) !== uncertainExclusions(inventory.coverage.exclusions);
    catalog.status.drift = { added, removed, changed, extractorChanged, coverageChanged };
    const references = new Set([...inventory.files.map(file => file.path), ...inventory.files.flatMap(file => file.symbols.map(symbol => symbol.id)), ...inventory.accessPoints.map(point => point.id)]);
    const recordIds = new Set(catalog.records.map(record => record.id));
    for (const record of catalog.records) {
      const reasons: string[] = [];
      if (record.extractorFingerprint !== extractor) reasons.push('Extractor changed since source inspection; review evidence references.');
      const stamps = [...record.inspectedSources, ...record.dependencies];
      for (const stamp of stamps) {
        if (!catalog.currentHashes.has(stamp.path)) reasons.push(`Missing/ineligible source: ${stamp.path}`);
        else if (catalog.currentHashes.get(stamp.path) !== stamp.fingerprint) reasons.push(`Changed source/dependency: ${stamp.path}`);
      }
      const inspected = new Set(record.inspectedSources.map(stamp => stamp.path));
      for (const ref of [...record.entryPoints, ...record.contracts]) {
        if (!references.has(ref)) reasons.push(`Missing inventory reference: ${ref}`);
        if (!inspected.has(ref.split('#')[0])) reasons.push(`Entry/contract lacks inspected source evidence: ${ref}`);
      }
      for (const path of dependencyPaths(inventory, dependencyRoots(inventory, [...record.entryPoints, ...record.contracts]))) {
        if (!stamps.some(stamp => stamp.path === path)) reasons.push(`Unrecorded dependency: ${path}`);
      }
      for (const related of record.related) if (!recordIds.has(related)) reasons.push(`Missing related capability: ${related}`);
      catalog.freshness.set(record.id, { freshness: reasons.length ? 'stale' : 'current', reasons });
    }
    catalog.status.counts = { files: inventory.files.length, symbols: inventory.files.reduce((count, file) => count + file.symbols.length, 0),
      accessPoints: inventory.accessPoints.length, explanations: catalog.records.length,
      staleExplanations: [...catalog.freshness.values()].filter(record => record.freshness === 'stale').length };
    const counts: Record<string, number> = {};
    for (const diagnostic of inventory.coverage.diagnostics) counts[diagnostic.code] = (counts[diagnostic.code] ?? 0) + 1;
    catalog.status.coverage = { complete: inventory.coverage.complete, diagnostics: counts, limitations: inventory.coverage.limitations };
    catalog.status.state = added.length || removed.length || changed.length || extractorChanged || coverageChanged || catalog.status.counts.staleExplanations ? 'stale' : 'current';
    if (records.state === 'missing') catalog.status.issues.push('No reviewed explanations; only discovery facts are available.');
    if (added.length || removed.length || changed.length || extractorChanged || coverageChanged) catalog.status.issues.push('Inventory drift: run refresh; source-review stale explanations separately.');
    if (catalog.status.counts.staleExplanations) catalog.status.issues.push('Refresh preserves stale explanations; inspect affected source before updating review stamps.');
    if (checkNavigation) {
      let navigation: string | null = null;
      try { navigation = await readArtifactText(root, '.pm/capabilities/index.md'); }
      catch (error: unknown) { if (!missing(error)) throw error; }
      catalog.status.navigation = navigation === null ? 'missing' : navigation === renderNavigationIndex(catalog) ? 'current' : 'stale';
      if (catalog.status.navigation !== 'current') {
        catalog.status.state = 'stale';
        catalog.status.issues.push('Navigation index missing or outdated; run catalog refresh.');
      }
    }
    return catalog;
  } catch (error: unknown) {
    catalog.status.state = 'invalid';
    catalog.status.issues = [(error instanceof Error ? error.message : 'Catalog validation failed').slice(0, 1200)];
    return catalog;
  }
}

export async function loadCatalog(repositoryRoot: string): Promise<Catalog> {
  return inspectCatalog(repositoryRoot);
}

export async function refreshCatalog(root: string): Promise<Catalog> {
  await readCapabilityRecords(await realpath(root));
  const inventory = validateInventory(await buildInventory(root));
  const planned = await inspectCatalog(root, inventory, false);
  if (planned.status.state === 'invalid') throw new Error(planned.status.issues.join('; '));
  await writeCatalogArtifacts(root, inventory, renderNavigationIndex(planned));
  return loadCatalog(root);
}

export type PublicStatus = CatalogStatus & {
  drift: CatalogStatus['drift'] & { totals: { added: number; removed: number; changed: number } };
  note: string;
  coverage: CatalogStatus['coverage'] & { diagnosticKindsTotal: number };
};

export function publicStatus(catalog: Catalog): PublicStatus {
  const status = catalog.status;
  return { ...status, issues: status.issues.slice(0, 12),
    drift: { ...status.drift, added: status.drift.added.slice(0, 20), removed: status.drift.removed.slice(0, 20), changed: status.drift.changed.slice(0, 20),
      totals: { added: status.drift.added.length, removed: status.drift.removed.length, changed: status.drift.changed.length } },
    coverage: { ...status.coverage, diagnostics: Object.fromEntries(Object.entries(status.coverage.diagnostics).slice(0, 20)),
      diagnosticKindsTotal: Object.keys(status.coverage.diagnostics).length, limitations: status.coverage.limitations.slice(0, 12) },
    note: 'Freshness and incomplete extraction are separate. Zero matches do not prove a capability is absent; inspect coverage and source.' };
}
