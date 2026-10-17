import assert from 'assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadCatalog, refreshCatalog, stampReviewedCapability } from './catalog';
import { renderNavigationIndex } from './navigation';

async function verify(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'capability-navigation-'));
  const indexPath = join(root, '.pm/capabilities/index.md');
  const inventoryPath = join(root, '.pm/capabilities/inventory.json');
  const recordPath = join(root, '.pm/capabilities/records/tooling.json');
  try {
    await mkdir(join(root, 'server/src'), { recursive: true });
    await writeFile(join(root, 'server/src/tool.ts'), 'export function reusableTool() { return 1; }\n');
    let catalog = await refreshCatalog(root);
    assert.equal(catalog.status.state, 'current');
    assert.equal(catalog.status.navigation, 'current');
    assert(catalog.inventory);
    const declaration = catalog.inventory.files.flatMap(file => file.symbols).find(symbol => symbol.name === 'reusableTool');
    assert(declaration);
    const record = stampReviewedCapability(catalog.inventory, { id: 'capability:tooling.example', name: 'Example | [tool]',
      purpose: 'Reuse a tool before implementing another.', domain: 'tooling', searchTerms: ['reuse'],
      lifecycle: 'current', lifecycleReason: 'Fixture source', evidence: 'source-inspected', verification: null,
      entryPoints: [declaration.id], contracts: [], settings: [], prerequisites: [], effects: ['Returns a value'],
      limitations: ['Not application runtime verification'], related: [],
    }, ['server/src/tool.ts']);
    await mkdir(join(root, '.pm/capabilities/records'));
    await writeFile(recordPath, JSON.stringify({ version: 1, records: [record] }));
    catalog = await loadCatalog(root);
    assert.equal(catalog.status.navigation, 'stale', 'new explanations invalidate the generated index');
    catalog = await refreshCatalog(root);
    assert.equal(catalog.status.state, 'current');
    const index = await readFile(indexPath, 'utf8');
    const inventoryBytes = await readFile(inventoryPath, 'utf8');
    const recordBytes = await readFile(recordPath, 'utf8');
    assert(index.includes(record.id)); assert(index.includes('reusableTool'));
    assert(index.includes('source-inspected / current')); assert(index.includes('Example \\| \\[tool\\]'));
    assert(index.includes('Run `check`')); assert(index.includes('discovery-only'));
    assert.equal(renderNavigationIndex(catalog), index);
    await refreshCatalog(root);
    assert.equal(await readFile(indexPath, 'utf8'), index);
    assert.equal(await readFile(recordPath, 'utf8'), recordBytes);
    await writeFile(indexPath, 'outdated navigation');
    assert.equal((await loadCatalog(root)).status.navigation, 'stale');
    await rm(indexPath);
    assert.equal((await loadCatalog(root)).status.navigation, 'missing');
    await refreshCatalog(root);
    await writeFile(join(root, 'server/src/tool.ts'), 'export function reusableTool() { return 2; }\n');
    catalog = await refreshCatalog(root);
    assert.equal(catalog.freshness.get(record.id)?.freshness, 'stale');
    assert((await readFile(indexPath, 'utf8')).includes('source-inspected / stale'));
    assert.equal(await readFile(recordPath, 'utf8'), recordBytes, 'index generation cannot renew review evidence');
    const large = renderNavigationIndex({ ...catalog, records: Array.from({ length: 200 }, (_, number) => ({ ...record, id: `capability:tooling.${number}` })) });
    assert(large.length < 12000); assert(large.includes('of 200 workflow records shown'));
    const previousIndex = await readFile(indexPath, 'utf8');
    const previousInventory = await readFile(inventoryPath, 'utf8');
    await writeFile(join(root, 'server/src/new.ts'), 'export function newTool(){}');
    // Fail after the inventory rename to exercise restoration of both existing artifacts.
    const filesystem: typeof import('fs/promises') = require('fs/promises');
    const originalRename = filesystem.rename;
    let failOnce = true;
    filesystem.rename = async (from, to): Promise<void> => {
      if (String(to).endsWith('/index.md') && failOnce) { failOnce = false; throw new Error('Fixture index rename failure'); }
      return originalRename(from, to);
    };
    try { await assert.rejects(refreshCatalog(root), /Fixture index rename failure/); }
    finally { filesystem.rename = originalRename; }
    assert.equal(await readFile(inventoryPath, 'utf8'), previousInventory);
    assert.equal(await readFile(indexPath, 'utf8'), previousIndex);
    assert(!(await readdir(join(root, '.pm/capabilities'))).some(name => name.endsWith('.tmp')));
    await rm(indexPath); await symlink('/does-not-exist', indexPath);
    assert.equal((await loadCatalog(root)).status.state, 'invalid');
    await assert.rejects(refreshCatalog(root), /artifact refused/);
    assert.equal(await readFile(inventoryPath, 'utf8'), previousInventory);
    await rm(indexPath); await refreshCatalog(root);
    assert.notEqual(await readFile(inventoryPath, 'utf8'), inventoryBytes);
    process.stdout.write('Capability navigation checks passed: bounded deterministic index, freshness, record preservation, rollback and symlink refusal.\n');
  } finally { await rm(root, { recursive: true, force: true }); }
}

if (require.main === module) verify().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : 'Navigation verification failed'}\n`);
  process.exitCode = 1;
});
