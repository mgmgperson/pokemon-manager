import assert from 'assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from 'fs/promises';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { buildInventory, writeInventory } from './inventory';
import { loadCatalog, refreshCatalog, stampReviewedCapability, publicStatus } from './catalog';
import { getCapability, searchCatalog } from './query';
import { CapabilityRecord } from './catalog-types';
import { validateInventory, validateRecords } from './validation';

async function verify(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'capability-catalog-'));
  async function source(path: string, contents: string): Promise<void> {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), contents);
  }
  async function records(record: CapabilityRecord): Promise<void> {
    await source('.pm/capabilities/records/generation.json', JSON.stringify({ version: 1, records: [record] }, null, 2));
  }
  try {
    assert.equal((await loadCatalog(root)).status.state, 'missing');
    await source('.pm/CURRENT.md', 'Fixture context');
    await source('server/src/generate.ts', `import {strength} from './dependency'; export function generatePokemonTeam(specialSlots: string[]){ return strength; }`);
    await source('server/src/dependency.ts', `export const strength = 50;`);
    await source('server/src/unrelated.ts', 'export function unrelated(){}');
    await source('server/package.json', '{"dependencies":{"example":"1.0.0"}}');
    await source('archive/old.py', 'raise RuntimeError("must not run")\ndef hidden_legacy_generator():\n    pass\n');
    await source('server/src/app.ts', `import express from 'express'; import {generatePokemonTeam} from './generate'; const app=express(); app.get('/team', generatePokemonTeam); throw new Error('must not execute');`);
    const inventory = validateInventory(await buildInventory(root));
    const generator = inventory.files.find(file => file.path.endsWith('generate.ts'))?.symbols.find(symbol => symbol.name === 'generatePokemonTeam');
    assert(generator);
    const record = stampReviewedCapability(inventory, { id: 'capability:pokemon.team', name: 'Pokemon roster generation', domain: 'generation',
      purpose: 'Generate Pokemon teams with explicit special ownership slots.', searchTerms: ['roster', 'legendary', 'mega'],
      lifecycle: 'current', lifecycleReason: 'Reviewed fixture function.', evidence: 'source-inspected', verification: null,
      entryPoints: [generator.id], contracts: [], settings: ['specialSlots selects exceptional roster members'],
      prerequisites: ['Prepared source input'], effects: ['Returns unsaved proposal'], limitations: ['Runtime not exercised'], related: [],
    }, ['server/src/generate.ts']);
    assert(record.dependencies.some(stamp => stamp.path.endsWith('dependency.ts')));
    await writeInventory(root, inventory); await records(record);
    let catalog = await loadCatalog(root);
    assert.equal(catalog.status.navigation, 'missing');
    assert.equal(catalog.status.state, 'stale');
    catalog = await refreshCatalog(root);
    assert.equal(catalog.status.state, 'current');
    assert.equal(catalog.freshness.get(record.id)?.freshness, 'current');
    assert.equal(searchCatalog(catalog, { query: 'specialSlots' }).results[0].id, record.id);
    assert.equal(searchCatalog(catalog, { query: '/team' }).results[0].id, record.id);
    assert(searchCatalog(catalog, { query: 'hidden_legacy_generator', lifecycle: 'legacy' }).results.some(row => row.evidence === 'discovered'));
    assert(getCapability(catalog, generator.id).found, 'grouped physical source IDs remain fetchable');
    assert.equal(getCapability(catalog, '../../database/db.sqlite').found, false);
    assert.equal(searchCatalog(catalog, { query: 'nonexistent' }).total, 0);
    assert(searchCatalog(catalog, { query: 'nonexistent' }).status.note.includes('Zero matches'));
    const originalBytes = await readFile(join(root, '.pm/capabilities/inventory.json'), 'utf8');
    const reviewBytes = await readFile(join(root, '.pm/capabilities/records/generation.json'), 'utf8');
    assert.deepEqual(await loadCatalog(root), catalog);
    assert.equal(await readFile(join(root, '.pm/capabilities/inventory.json'), 'utf8'), originalBytes, 'reads do not mutate inventory');
    const searchPage = searchCatalog(catalog, { query: 'server', limit: 1 });
    assert.equal(searchPage.results.length, 1); assert(searchPage.nextCursor);
    const nextPage = searchCatalog(catalog, { query: 'server', limit: 1, cursor: searchPage.nextCursor });
    assert.notEqual(nextPage.results[0].id, searchPage.results[0].id);
    const getPage = getCapability(catalog, record.id, { limit: 1 });
    assert(getPage.found && getPage.truncated && getPage.nextCursor);
    assert(getCapability(catalog, record.id, { limit: 1, cursor: getPage.nextCursor }).found);
    assert.throws(() => searchCatalog(catalog, { query: 'other', cursor: searchPage.nextCursor ?? undefined }), /Cursor/);
    assert.throws(() => searchCatalog(catalog, { query: 'server', limit: 21 }));
    assert.throws(() => searchCatalog(catalog, { query: ' ', limit: 1 }));
    assert.throws(() => getCapability(catalog, record.id, { cursor: '../bad' }));
    await source('server/src/unrelated.ts', 'export function unrelated(){return 1}');
    catalog = await loadCatalog(root);
    assert.equal(catalog.status.state, 'stale');
    assert.equal(catalog.freshness.get(record.id)?.freshness, 'current', 'unrelated changes do not invalidate reviewed capability');
    assert.throws(() => searchCatalog(catalog, { query: 'server', cursor: searchPage.nextCursor ?? undefined }), /Cursor/);
    await source('server/src/dependency.ts', 'export const strength = 60;');
    catalog = await loadCatalog(root);
    assert.equal(catalog.freshness.get(record.id)?.freshness, 'stale', 'dependency changes invalidate explanations before refresh');
    const staleSearch = searchCatalog(catalog, { query: 'specialSlots', freshness: 'stale' });
    assert.equal(staleSearch.results[0].evidence, 'source-inspected', 'freshness is separate from recorded evidence');
    catalog = await refreshCatalog(root);
    assert.equal(catalog.freshness.get(record.id)?.freshness, 'stale', 'refresh must not bless stale evidence');
    assert.equal(await readFile(join(root, '.pm/capabilities/records/generation.json'), 'utf8'), reviewBytes);
    assert.equal(catalog.status.drift.changed.length, 0);
    await source('server/src/new-untracked.ts', 'export function newUntracked(){}');
    await rm(join(root, 'archive/old.py'));
    catalog = await loadCatalog(root);
    assert(catalog.status.drift.added.includes('server/src/new-untracked.ts'));
    assert(catalog.status.drift.removed.includes('archive/old.py'));
    assert(catalog.status.drift.coverageChanged);
    const currentInventory = await buildInventory(root);
    const rereviewed = stampReviewedCapability(currentInventory, record, ['server/src/generate.ts']);
    await records(rereviewed); catalog = await refreshCatalog(root);
    assert.equal(catalog.status.state, 'current');
    await source('other/new.rs', 'fn unknown_language() {}');
    catalog = await loadCatalog(root);
    assert(catalog.status.drift.coverageChanged, 'new unsupported formats change coverage accounting');
    assert.equal(catalog.freshness.get(record.id)?.freshness, 'current');
    await refreshCatalog(root);
    await source('server/package.json', '{"dependencies":{"example":"2.0.0"}}');
    assert.equal((await loadCatalog(root)).freshness.get(record.id)?.freshness, 'stale', 'package dependency declarations invalidate affected evidence');
    await source('server/package.json', '{"dependencies":{"example":"1.0.0"}}');
    const extractionChanged = { ...rereviewed, extractorFingerprint: '0'.repeat(64) };
    await records(extractionChanged);
    assert.equal((await loadCatalog(root)).freshness.get(record.id)?.freshness, 'stale');
    await records({ ...rereviewed, entryPoints: ['server/src/generate.ts#function:missing'] });
    assert((await loadCatalog(root)).freshness.get(record.id)?.reasons.some(reason => reason.includes('Missing inventory reference')));
    await records({ ...rereviewed, related: ['capability:missing'] });
    assert((await loadCatalog(root)).freshness.get(record.id)?.reasons.some(reason => reason.includes('Missing related')));
    assert.throws(() => validateRecords({ version: 1, records: [{ ...record, evidence: 'runtime-exercised' }] }));
    assert.throws(() => validateInventory({ version: 1, files: [] }));
    await source('.pm/capabilities/records/generation.json', '{bad');
    assert.equal((await loadCatalog(root)).status.state, 'invalid');
    const beforeFailure = await readFile(join(root, '.pm/capabilities/inventory.json'), 'utf8');
    await assert.rejects(refreshCatalog(root));
    assert.equal(await readFile(join(root, '.pm/capabilities/inventory.json'), 'utf8'), beforeFailure);
    await records(rereviewed);
    await source('.pm/capabilities/records/duplicate.json', JSON.stringify({ version: 1, records: [rereviewed] }));
    assert.equal((await loadCatalog(root)).status.state, 'invalid');
    await rm(join(root, '.pm/capabilities/records/duplicate.json'));
    await source('.pm/capabilities/inventory.json', '{bad');
    assert.equal((await loadCatalog(root)).status.state, 'invalid');
    catalog = await refreshCatalog(root);
    assert.equal(catalog.status.state, 'current', 'refresh repairs broken generated facts without changing reviews');
    await rm(join(root, '.pm/capabilities/records/generation.json'));
    await symlink('/does-not-exist', join(root, '.pm/capabilities/records/generation.json'));
    assert.equal((await loadCatalog(root)).status.state, 'invalid');
    await rm(join(root, '.pm/capabilities/records/generation.json'));
    await symlink('/does-not-exist', join(root, 'server/src/dependency.ts.link.ts'));
    catalog = await loadCatalog(root);
    assert(!catalog.currentHashes.has('server/src/dependency.ts.link.ts'));
    assert(publicStatus(catalog).note.includes('incomplete extraction'));
    process.stdout.write('Capability catalog fixture checks passed: queries, provenance, drift, preservation, validation and filesystem boundaries.\n');
  } finally { await rm(root, { recursive: true, force: true }); }
}

if (require.main === module) verify().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : 'Catalog verification failed'}\n`);
  process.exitCode = 1;
});
