import assert from 'assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink, readdir } from 'fs/promises';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { buildInventory, writeInventory } from './inventory';
import { extractTypeScript } from './typescript';
import { extractCpp, extractSql } from './legacy';

async function verify(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'capability-inventory-'));
  async function source(path: string, contents: string): Promise<void> {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), contents);
  }
  try {
    await source('.pm/CURRENT.md', 'Disposable project context.');
    await source('.gitignore', 'archive/\ndatabase/migrators/\n');
    await source('server/src/app.ts', `
      import express from 'express'; import management from './management';
      const app = express(); app.use('/management', management);
      app.use('/body', express.json());
      throw new Error('Application source must never execute');
    `);
    await source('server/src/management.ts', `
      import {Router} from 'express'; import population from './population';
      const router = Router(); router.use('/population', population); export default router;
    `);
    await source('server/src/population.ts', `
      import {Router} from 'express'; import {apply} from './wrapper';
      const router = Router(); router.post('/apply', apply); export default router;
    `);
    await source('server/src/wrapper.ts', `export {apply} from './handlers';`);
    await source('server/src/handlers.ts', `
      function privateHelper(input: string): string { return input; }
      export function apply(input: string): string { return privateHelper(input); }
      export const catalog = [Decimal.fromString('1'), Decimal.fromString('2')];
      export interface Contract { setting: boolean }
      export class Worker { run(): string { return privateHelper('run'); } }
    `);
    await source('server/src/dynamic.ts', `
      import {Router} from 'express'; const router=Router();
      const prefix = getPrefix(); router.use(prefix, router);
      router.get(getPath(), handler); router[method]('/computed', handler);
      router.route('/chain').get(handler); export default router;
    `);
    await source('server/src/bin/example.ts', `throw new Error('Do not run this CLI');`);
    await source('server/package.json', JSON.stringify({ scripts: { example: 'ts-node src/bin/example.ts' } }));
    await source('frontend-v2/src/App.tsx', `
      import Screen from './Screen';
      const menu=[{path:'/area/visible'}];
      export const App = () => <><Routes><Route path="area" element={<Layout/>}>
        <Route element={<Layout/>}><Route path="hidden" element={<Screen/>}/></Route>
      </Route></Routes>{menu.map(entry => <Link to={entry.path}/>)}<Link to={runtimePath}/></>;
    `);
    await source('frontend-v2/src/Screen.tsx', 'export default function Screen(){return <div/>}');
    await source('frontend/src/Old.tsx', 'export const Old = () => <Route path="/old" element={<OldScreen/>}/>;');
    await source('archive/backend/old.cpp', `
      // void fake() {}
      class Old { public: Old(int count); int run() const; };
      Old::Old(int count) : count(count) {}
      int Old::run() const { if (ready()) { return call(); } return 0; }
      int legacy_free(int value) { return value; }
      const char* text = R"SQL(void fake_sql() { })SQL";
    `);
    await source('database/migrators/old.py', `
raise RuntimeError('Do not import me')
def migrate(value: int):
    def helper():
        return value
    return helper()
class Migrator:
    async def preview(self):
        return None
`);
    await source('database/schema.sql', `-- CREATE TABLE fake(x);
      CREATE TABLE trainer(id INTEGER, name TEXT);
      CREATE UNIQUE INDEX trainer_name ON trainer(name);
      INSERT INTO trainer VALUES(1, 'PRIVATE SEED PAYLOAD');
      CREATE VIEW trainers AS SELECT * FROM trainer;
    `);
    await source('other/util.rs', 'fn rust_helper() {}');
    await source('other/site.html', '<html></html>');
    await source('new-root/new.ts', 'export function untrackedHelper(){}');
    // These are poison symlinks, not saves. Discovery must never follow or open them.
    await symlink('/does-not-exist', join(root, 'database/db.sqlite'));
    await symlink('/does-not-exist', join(root, 'database/meta.sqlite-wal'));
    await symlink('/does-not-exist', join(root, '.env'));
    await symlink('/does-not-exist', join(root, 'escape.ts'));
    await source('node_modules/package/index.ts', 'function vendor(){}');
    await source('archive/backend/build/generated.cpp', 'void generated(){}');
    await source('database/other.sqlite', 'POISON SAVE: not source');
    await source('database/other.sqlite-shm', 'POISON SIDECAR: not source');
    await source('.env.production', 'POISON ENV: not source');
    const first = await buildInventory(root);
    assert.deepEqual(first, await buildInventory(root), 'identical working trees produce identical artifacts');
    assert(first.files.some(file => file.path === 'database/migrators/old.py'));
    assert(first.files.some(file => file.path === 'new-root/new.ts'));
    assert(!first.files.some(file => /sqlite|node_modules|\/build\/|escape|\.env/.test(file.path)));
    assert(first.coverage.exclusions.some(entry => entry.reason === 'save/environment/credential files' && entry.entries >= 2));
    assert(!JSON.stringify(first).includes('POISON SAVE'));
    assert(first.coverage.exclusions.some(entry => entry.reason.includes('.rs')));
    const symbols = first.files.flatMap(file => file.symbols);
    const helper = symbols.find(symbol => symbol.name === 'privateHelper');
    assert(helper && helper.visibility === 'local');
    assert(symbols.some(symbol => symbol.name === 'run' && symbol.owner === 'Worker'));
    assert(symbols.some(symbol => symbol.name === 'setting' && symbol.owner === 'Contract'));
    assert(symbols.some(symbol => symbol.name === 'helper' && symbol.owner === 'migrate'));
    assert(symbols.some(symbol => symbol.name === 'preview' && symbol.owner === 'Migrator'));
    assert(symbols.some(symbol => symbol.name === 'legacy_free'));
    assert(symbols.some(symbol => symbol.name === 'run' && symbol.owner === 'Old'));
    assert(!symbols.some(symbol => ['fake', 'fake_sql', 'call', 'ready'].includes(symbol.name)));
    assert(first.files.find(file => file.path === 'archive/backend/old.cpp')?.lifecycle === 'legacy');
    const http = first.accessPoints.find(point => point.kind === 'http' && point.address === '/management/population/apply');
    assert(http?.target?.includes('handlers.ts#function:apply'));
    assert(!first.accessPoints.some(point => point.kind === 'http' && point.address === '/body'));
    assert(first.accessPoints.some(point => point.kind === 'middleware' && point.address === '/body'));
    assert(first.accessPoints.some(point => point.kind === 'page' && point.address === '/area/hidden' && point.target?.includes('Screen.tsx#function:Screen')));
    assert(!first.accessPoints.some(point => point.kind === 'navigation' && point.address === '/area/hidden'));
    assert(first.accessPoints.some(point => point.kind === 'navigation' && point.address === '/area/visible'));
    assert(first.accessPoints.some(point => point.kind === 'package-command' && point.target === 'server/src/bin/example.ts'));
    assert(first.accessPoints.some(point => point.kind === 'cli' && point.target === 'server/src/bin/example.ts'));
    assert(first.links.some(link => link.kind === 'call' && link.target === helper.id));
    assert(first.links.some(link => link.expression === 'Decimal.fromString' && link.occurrences === 2));
    assert(!JSON.stringify(first).includes('PRIVATE SEED PAYLOAD'));
    assert(first.coverage.diagnostics.some(diagnostic => diagnostic.code === 'dynamic-route'));
    assert(first.coverage.diagnostics.some(diagnostic => diagnostic.code === 'chained-route'));
    assert(first.coverage.diagnostics.some(diagnostic => diagnostic.code === 'dynamic-navigation'));
    assert(!first.coverage.complete);
    assert.equal(new Set(symbols.map(symbol => symbol.id)).size, symbols.length);
    const shifted = extractTypeScript('server/src/handlers.ts', '\n\nfunction privateHelper(input: string): string { return input; }');
    assert.equal(shifted.symbols[0].id, helper.id, 'line shifts do not change identity');
    assert.equal(shifted.symbols[0].fingerprint, helper.fingerprint);
    const dynamicMount = extractTypeScript('dynamic.ts', "import express from 'express'; const app=express(); app.use(getPrefix(), router);");
    assert.equal(dynamicMount.registrations[0].route, null, 'ambiguous runtime mount must not invent a root prefix');
    const malformed = extractTypeScript('broken.ts', 'export function broken(');
    assert(malformed.diagnostics.some(diagnostic => diagnostic.code === 'parse-error'));
    const overloads = extractCpp('overloads.h', 'class C {\n C();\n C(int value);\n int f() const;\n};');
    assert.equal(overloads.symbols.filter(symbol => symbol.name === 'C').length, 3);
    const quotedSql = extractSql('quoted.sql', 'CREATE TABLE "a-table"(x); CREATE TRIGGER `t` AFTER INSERT ON "a-table" BEGIN SELECT 1; END;');
    assert.deepEqual(quotedSql.symbols.map(symbol => symbol.name), ['a-table', 't']);
    const output = await writeInventory(root, first);
    const serialized = await readFile(output, 'utf8');
    await writeInventory(root, await buildInventory(root));
    assert.equal(await readFile(output, 'utf8'), serialized, 'artifact does not ingest itself');
    // Serialization failure must leave the previous valid artifact intact and clean temporary files.
    const circular = { ...first };
    Object.assign(circular, { cycle: circular });
    await assert.rejects(writeInventory(root, circular));
    assert.equal(await readFile(output, 'utf8'), serialized);
    assert.deepEqual(await readdir(dirname(output)), ['inventory.json']);
    await source('database/migrators/broken.py', 'def broken(:');
    const failed = await buildInventory(root);
    assert.equal(failed.files.find(file => file.path.endsWith('broken.py'))?.extraction, 'failed');
    assert(failed.coverage.diagnostics.some(diagnostic => diagnostic.code === 'parse-error'));
    await rm(join(root, '.pm/capabilities'), { recursive: true });
    await symlink(join(root, 'server'), join(root, '.pm/capabilities'));
    await assert.rejects(writeInventory(root, first), /symlinked output/);
    process.stdout.write('Capability inventory fixture checks passed (source parsing only; no application or save access).\n');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

if (require.main === module) verify().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : 'Inventory verification failed'}\n`);
  process.exitCode = 1;
});
