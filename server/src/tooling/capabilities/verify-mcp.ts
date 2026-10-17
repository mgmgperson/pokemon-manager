import assert from 'assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport, getDefaultEnvironment } from '@modelcontextprotocol/client/stdio';
import { loadCatalog, publicStatus, refreshCatalog, stampReviewedCapability } from './catalog';
import { searchCatalog, getCapability } from './query';
import { object } from './validation';

const guardedServer = `
const blocked = () => { throw new Error('Forbidden server operation'); };
const fs = require('fs'); const promises = require('fs/promises');
const originalRead = promises.readFile;
promises.readFile = async (path, ...args) => {
  if (/\\.sqlite(?:[.-]|$)|(?:^|\\/)\\.env(?:[./]|$)/i.test(String(path))) throw new Error('Excluded file read');
  return originalRead(path, ...args);
};
for (const name of ['writeFile','appendFile','rename','unlink','mkdir','rm','copyFile','open']) promises[name] = blocked;
for (const name of ['writeFileSync','appendFileSync','renameSync','unlinkSync','mkdirSync','rmSync','copyFileSync']) fs[name] = blocked;
for (const name of ['exec','execSync','execFile','execFileSync','spawn','spawnSync','fork']) require('child_process')[name] = blocked;
require('net').Server.prototype.listen = blocked; require('net').connect = blocked;
require('http').request = blocked; require('https').request = blocked; global.fetch = blocked;
const Module = require('module'); const originalLoad = Module._load;
Module._load = function(name, ...args) {
  if (['sqlite3','better-sqlite3','express'].includes(name) || /(?:^|\\/)app(?:\\.[jt]s)?$/.test(name)) throw new Error('Application module imported');
  return originalLoad.call(this, name, ...args);
};
const {serveStdio} = require('@modelcontextprotocol/server/stdio');
const {createCapabilityMcpServer} = require(process.argv[2]);
serveStdio(() => createCapabilityMcpServer(process.argv[1]));
`;

function structured(response: unknown): Record<string, unknown> {
  const envelope = object(response, 'MCP response');
  assert(!envelope.isError, JSON.stringify(envelope));
  const payload = object(envelope.structuredContent, 'structured MCP result');
  assert(Buffer.byteLength(JSON.stringify(payload)) <= 128 * 1024);
  return payload;
}

async function verify(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'capability-mcp-'));
  const serverDirectory = resolve(__dirname, '../../..');
  const sourceMode = __filename.endsWith('.ts');
  const loader = sourceMode ? ['-r', require.resolve('ts-node/register/transpile-only')] : [];
  const client = new Client({ name: 'capability-fixture-client', version: '1.0.0' });
  const transport = new StdioClientTransport({ command: process.execPath,
    args: [...loader, '-e', guardedServer, root, join(__dirname, sourceMode ? 'mcp.ts' : 'mcp.js')],
    cwd: serverDirectory, env: { ...getDefaultEnvironment(), TS_NODE_PROJECT: join(serverDirectory, 'tsconfig.json') }, stderr: 'pipe' });
  let stderr = '';
  transport.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
  try {
    await mkdir(join(root, 'server/src'), { recursive: true });
    await writeFile(join(root, 'server/src/tool.ts'), 'export function hiddenRosterTool(specialSlots: string[]){return specialSlots;}\nfunction spareSpecialSlots(){return [];}\n');
    await writeFile(join(root, 'server/src/style.css'), 'body { margin: 0; }\n');
    await writeFile(join(root, 'server/src/app.ts'), 'throw new Error("Do not import this application");\n');
    await mkdir(join(root, 'database'));
    await writeFile(join(root, 'database/db.sqlite'), 'SECRET SAVE CONTENT');
    await writeFile(join(root, 'database/meta.sqlite-wal'), 'SECRET SIDECAR CONTENT');
    await writeFile(join(root, '.env'), 'SECRET ENV CONTENT');
    await symlink('/does-not-exist', join(root, 'escape.ts'));
    let catalog = await refreshCatalog(root);
    assert(catalog.inventory);
    const tool = catalog.inventory.files.flatMap(file => file.symbols).find(symbol => symbol.name === 'hiddenRosterTool'); assert(tool);
    const record = stampReviewedCapability(catalog.inventory, { id: 'capability:fixture.roster', name: 'Fixture roster slots',
      purpose: 'Find an existing roster tool before implementation.', domain: 'tooling', searchTerms: ['roster'], lifecycle: 'current',
      lifecycleReason: 'Fixture source', evidence: 'source-inspected', verification: null, entryPoints: [tool.id], contracts: [],
      settings: ['specialSlots'], prerequisites: [], effects: ['Returns slots'], limitations: ['Source inspection only'], related: [],
    }, ['server/src/tool.ts']);
    const recordsPath = join(root, '.pm/capabilities/records');
    await mkdir(recordsPath); const recordPath = join(recordsPath, 'tooling.json');
    await writeFile(recordPath, JSON.stringify({ version: 1, records: [record] }));
    catalog = await refreshCatalog(root);
    const artifactPaths = ['inventory.json', 'index.md', 'records/tooling.json'].map(path => join(root, '.pm/capabilities', path));
    const before = await Promise.all(artifactPaths.map(path => readFile(path, 'utf8')));
    await client.connect(transport);
    const listed = await client.listTools();
    assert.deepEqual(listed.tools.map(tool => tool.name).sort(), ['capability_get', 'capability_search', 'capability_status']);
    for (const tool of listed.tools) assert.deepEqual(tool.annotations, { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false });
    const call = async (name: string, args: Record<string, unknown> = {}): Promise<Record<string, unknown>> => structured(await client.callTool({ name, arguments: args }));
    assert.deepEqual(await call('capability_status'), publicStatus(catalog));
    assert.equal(catalog.status.coverage.complete, false, 'file-only extraction must remain visible through MCP');
    const query = { query: 'specialSlots', limit: 1 };
    const searched = await call('capability_search', query);
    const searchCursor = searched.nextCursor;
    assert(typeof searchCursor === 'string');
    assert.deepEqual(searched, searchCatalog(catalog, query));
    assert.deepEqual(await call('capability_search', { ...query, cursor: searchCursor }), searchCatalog(catalog, { ...query, cursor: searchCursor }));
    const fetched = await call('capability_get', { id: record.id, limit: 3 });
    const nextCursor = fetched.nextCursor;
    assert(typeof nextCursor === 'string');
    // The wire format omits optional undefined reference properties.
    assert.deepEqual(fetched, JSON.parse(JSON.stringify(getCapability(catalog, record.id, { limit: 3 }))) as unknown);
    const nextPage = await call('capability_get', { id: record.id, limit: 3, cursor: nextCursor });
    assert.deepEqual(nextPage, JSON.parse(JSON.stringify(getCapability(catalog, record.id, { limit: 3, cursor: nextCursor }))) as unknown);
    for (const id of ['../../database/db.sqlite', '/etc/passwd', 'file:///etc/passwd', 'https://example.com', 'escape.ts']) {
      assert.equal((await call('capability_get', { id })).found, false);
    }
    for (const args of [{ query: 'x', limit: 21 }, { query: 'x', lifecycle: 'invalid' }, { query: 'x', path: '/etc/passwd' },
      { query: 'x', cursor: '../bad' }, { query: 'x'.repeat(301) }, { query: ' ' }]) {
      assert(object(await client.callTool({ name: 'capability_search', arguments: args }), 'error result').isError);
    }
    assert(object(await client.callTool({ name: 'capability_status', arguments: { refresh: true } }), 'strict status input').isError);
    assert(object(await client.callTool({ name: 'capability_get', arguments: { id: record.id, limit: 51 } }), 'get limit').isError);
    assert(object(await client.callTool({ name: 'capability_get', arguments: { id: record.id, root: '/etc' } }), 'strict get input').isError);
    for (const name of ['refresh', 'apply', 'execute', 'source_read']) {
      const rejected = await client.callTool({ name, arguments: {} }).catch((error: unknown) => error);
      assert(rejected instanceof Error || object(rejected, 'unknown tool').isError);
    }
    const zero = await call('capability_search', { query: 'nothing-matches-xyz' });
    assert.equal(zero.total, 0); assert.equal(object(zero.status, 'zero status').coverage !== undefined, true);
    assert.deepEqual(await Promise.all(artifactPaths.map(path => readFile(path, 'utf8'))), before);
    await writeFile(join(root, 'server/src/tool.ts'), 'export function hiddenRosterTool(specialSlots: string[]){return [...specialSlots];}\n');
    catalog = await loadCatalog(root);
    const stale = await call('capability_search', query);
    assert.deepEqual(stale, searchCatalog(catalog, query));
    assert.equal(object(stale.status, 'stale status').state, 'stale');
    assert(object(await client.callTool({ name: 'capability_search', arguments: { ...query, cursor: searchCursor } }), 'expired search cursor').isError);
    assert(object(await client.callTool({ name: 'capability_get', arguments: { id: record.id, cursor: nextCursor } }), 'expired cursor').isError);
    await writeFile(artifactPaths[0], '{broken inventory');
    assert.equal((await call('capability_status')).state, 'invalid');
    assert.equal((await call('capability_search', query)).total, 0);
    await rm(artifactPaths[0]);
    assert.equal((await call('capability_status')).state, 'missing');
    assert.equal((await call('capability_search', query)).total, 0);
    assert(!(await readdir(join(root, '.pm/capabilities'))).some(name => name.endsWith('.tmp')));
    await writeFile(artifactPaths[0], before[0]);
    await rm(artifactPaths[1]); await symlink('/does-not-exist', artifactPaths[1]);
    assert.equal((await call('capability_status')).state, 'invalid');
    assert.equal(stderr, '', 'stdio server should not log during successful protocol operation');
    process.stdout.write('MCP stdio fixture checks passed: shared queries, pagination, drift/error states, strict inputs, exclusions and read-only guarded process.\n');
  } finally { await client.close(); await transport.close(); await rm(root, { recursive: true, force: true }); }

  // Exercise the exact production launch command, independently of fixture injection.
  const production = new Client({ name: 'capability-repository-client', version: '1.0.0' });
  const productionTransport = new StdioClientTransport({ command: process.execPath,
    args: sourceMode ? [require.resolve('ts-node/dist/bin.js'), '--transpile-only', '--project', join(serverDirectory, 'tsconfig.json'), join(serverDirectory, 'src/bin/capabilities-mcp.ts')]
      : [join(serverDirectory, 'dist/bin/capabilities-mcp.js')], cwd: tmpdir(), stderr: 'pipe' });
  try {
    await production.connect(productionTransport);
    const repository = resolve(serverDirectory, '..');
    const catalog = await loadCatalog(repository);
    assert.deepEqual(structured(await production.callTool({ name: 'capability_status', arguments: {} })), publicStatus(catalog));
    const query = { query: 'generatePokemonTeam', limit: 2 };
    assert.deepEqual(structured(await production.callTool({ name: 'capability_search', arguments: query })), searchCatalog(catalog, query));
    process.stdout.write('Production MCP launch from an unrelated working directory matches local repository queries.\n');
  } finally { await production.close(); await productionTransport.close(); }
}

if (require.main === module) verify().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : 'MCP verification failed'}\n`);
  process.exitCode = 1;
});
