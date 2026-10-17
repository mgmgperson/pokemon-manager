import { mkdir, readFile, rename, unlink, realpath, lstat } from 'fs/promises';
import { dirname, join, relative, resolve } from 'path';
import ts from 'typescript';
import { randomUUID } from 'crypto';
import { AccessPoint, Inventory, TypeScriptFacts } from './types';
import { coveragePolicies, discoverSources, fingerprint, readSource, stableId } from './source';
import { extractTypeScript } from './typescript';
import { extractCpp, extractPython, extractSql } from './legacy';
import { resolveWiring } from './wiring';

export async function buildInventory(repositoryRoot: string): Promise<Inventory> {
  const root = await realpath(repositoryRoot);
  const discovery = await discoverSources(root);
  const inventory: Inventory = { version: 1, extractorFingerprint: '', snapshotFingerprint: '', files: [], links: [], accessPoints: [],
    coverage: { complete: true, roots: [], formats: {}, exclusions: discovery.exclusions, policies: coveragePolicies,
      limitations: [
        'Discovery evidence only; no application feature has been imported, run or certified working.',
        'TypeScript syntax AST only: no type checking, CommonJS/alias module resolution, implicit type members or runtime route construction.',
        'Symbol ownership is lexical; block-local duplicate bindings are diagnosed, not silently merged. Anonymous callbacks have no independent symbol.',
        'Call links resolve direct local/imported names. Member calls and runtime aliases retain expressions with null targets.',
        'React JSX Route/to discovery assumes conventional React Router names; dynamic navigation, object-based routers and wrappers need source inspection.',
        'C++ uses lexical declaration extraction, not a compiler. Preprocessor branches are not evaluated; all discovered declarations require inspection.',
        'SQL extracts CREATE table/index/view/trigger names only; column contracts and embedded/dynamic SQL remain at their source references.',
        'Package command bindings are syntax facts; shell commands are never executed or treated as proof that a tool works.',
        'File-only formats retain a fingerprint and explicit diagnostic; unrecognized extensions are counted in exclusions, not silently parsed.',
      ], diagnostics: [] } };
  const typescriptFiles = new Map<string, TypeScriptFacts>();
  for (const discovered of discovery.files) {
    const { file, source } = await readSource(root, discovered.path, discovered.language);
    inventory.files.push(file);
    inventory.coverage.formats[file.language] = (inventory.coverage.formats[file.language] ?? 0) + 1;
    if (['typescript', 'tsx', 'javascript', 'jsx'].includes(file.language)) {
      const facts = extractTypeScript(file.path, source);
      typescriptFiles.set(file.path, facts);
      file.symbols = facts.symbols;
      inventory.coverage.diagnostics.push(...facts.diagnostics);
      file.extraction = facts.diagnostics.some(diagnostic => diagnostic.code === 'parse-error') ? 'failed' : 'parsed';
    } else if (['python', 'cpp', 'sql'].includes(file.language)) {
      const facts = file.language === 'python' ? extractPython(file.path, source)
        : file.language === 'cpp' ? extractCpp(file.path, source) : extractSql(file.path, source);
      file.symbols = facts.symbols;
      inventory.coverage.diagnostics.push(...facts.diagnostics);
      file.extraction = facts.diagnostics.some(diagnostic => diagnostic.code === 'parse-error') ? 'failed' : file.language === 'cpp' ? 'partial' : 'parsed';
    } else if (file.path.endsWith('package.json')) {
      extractPackageCommands(file.path, source, new Set(discovery.files.map(file => file.path)), inventory.accessPoints);
      file.extraction = 'parsed';
    } else {
      inventory.coverage.diagnostics.push({ path: file.path, line: 1, column: 1, code: 'file-only',
        message: `File-level ${file.language} discovery; no symbol/behavior extraction for this format.` });
    }
    if (/\/bin\/[^/]+\.[cm]?[jt]s$/.test(file.path) || (file.language === 'python' && /if\s+__name__\s*==\s*['"]__main__['"]/.test(source))
      || (file.language === 'cpp' && file.symbols.some(symbol => symbol.name === 'main' && !symbol.owner))) {
      const tsCommand = /\.ts$/.test(file.path) ? `cd ${file.path.split('/')[0]} && npx ts-node ${file.path.split('/').slice(1).join('/')}` : null;
      inventory.accessPoints.push({ path: file.path, line: 1, column: 1, id: stableId(file.path, 'cli', 'entry'), kind: 'cli',
        address: tsCommand ?? (file.language === 'python' ? `python3 ${file.path}` : null), target: file.path,
        expression: 'Source entry point; inspect argument validation and prerequisites before invocation.', resolution: file.language === 'cpp' ? 'unresolved' : 'static' });
    }
  }
  const wiring = resolveWiring(typescriptFiles, new Set(discovery.files.map(file => file.path)));
  inventory.accessPoints.push(...wiring.accessPoints);
  inventory.links.push(...wiring.links);
  const uniqueLinks = new Map<string, Inventory['links'][number]>();
  for (const link of inventory.links) {
    const key = JSON.stringify([link.kind, link.from, link.target, link.expression]);
    const existing = uniqueLinks.get(key);
    if (existing) existing.occurrences = (existing.occurrences ?? 1) + 1;
    else uniqueLinks.set(key, link);
  }
  inventory.links = [...uniqueLinks.values()];
  inventory.coverage.diagnostics.push(...wiring.diagnostics);
  // Overloads/repeated registrations must remain visible, rather than overwrite the first declaration.
  const identities = new Map<string, number>();
  for (const entry of [...inventory.files.flatMap(file => file.symbols), ...inventory.accessPoints]) {
    const baseId = entry.id;
    const count = identities.get(baseId) ?? 0;
    identities.set(baseId, count + 1);
    if (count) {
      entry.id = `${baseId}~${count + 1}`;
      inventory.coverage.diagnostics.push({ path: entry.path, line: entry.line, column: entry.column, code: 'identity-collision',
        message: `Repeated declaration/registration ${baseId}; occurrence suffix ${count + 1}. Inspect before treating these as independent capabilities.` });
    }
  }
  inventory.files.sort((a, b) => a.path.localeCompare(b.path, 'en'));
  inventory.accessPoints.sort((a, b) => a.id.localeCompare(b.id, 'en'));
  inventory.coverage.diagnostics.sort((a, b) => a.path.localeCompare(b.path, 'en') || a.line - b.line || a.column - b.column || a.code.localeCompare(b.code, 'en'));
  inventory.coverage.roots = [...new Set(inventory.files.map(file => file.path.includes('/') ? file.path.split('/')[0] : '.'))].sort();
  inventory.coverage.complete = !inventory.coverage.diagnostics.some(diagnostic => diagnostic.code !== 'unmounted-router');
  inventory.extractorFingerprint = await extractorFingerprint();
  inventory.snapshotFingerprint = fingerprint(JSON.stringify(inventory.files.map(file => [file.path, file.fingerprint])));
  return inventory;
}

export async function extractorFingerprint(): Promise<string> {
  const extractorFiles = ['inventory.ts', 'source.ts', 'typescript.ts', 'legacy.ts', 'wiring.ts', 'types.ts'];
  const sources = await Promise.all(extractorFiles.map(file => readFile(join(__dirname, file.replace('.ts', __filename.endsWith('.js') ? '.js' : '.ts')), 'utf8')));
  return fingerprint(JSON.stringify({ version: 1, typescript: ts.version, sources, policies: coveragePolicies }));
}

function extractPackageCommands(path: string, source: string, files: Set<string>, accessPoints: AccessPoint[]): void {
  const parsed: unknown = JSON.parse(source);
  if (!parsed || typeof parsed !== 'object' || !('scripts' in parsed)) return;
  if (!parsed.scripts || typeof parsed.scripts !== 'object' || Array.isArray(parsed.scripts)) throw new Error(`Invalid scripts in ${path}`);
  for (const [name, command] of Object.entries(parsed.scripts)) {
    if (typeof command !== 'string') throw new Error(`Invalid package command ${path}:${name}`);
    const entry = command.match(/(?:^|\s)([\w./-]+\.[cm]?[jt]sx?)(?:\s|$)/)?.[1];
    const target = entry ? join(dirname(path), entry).split('\\').join('/') : null;
    accessPoints.push({ path, line: 1, column: 1, id: stableId(path, 'package-command', name), kind: 'package-command',
      address: `npm --prefix ${dirname(path)} run ${name}`, target: target && files.has(target) ? target : null, expression: command, resolution: 'static' });
  }
}

export async function writeInventory(root: string, inventory: Inventory): Promise<string> {
  const repository = await realpath(root);
  // Only this fixed local artifact is writable; reject symlinked parents rather than escaping through .pm.
  for (const directory of ['.pm', '.pm/capabilities']) {
    const path = join(repository, directory);
    try {
      if ((await lstat(path)).isSymbolicLink()) throw new Error(`Refusing symlinked output directory: ${directory}`);
    } catch (error: unknown) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
      await mkdir(path);
    }
    if (relative(repository, await realpath(path)).startsWith('..')) throw new Error('Output escaped repository');
  }
  const output = resolve(repository, '.pm/capabilities/inventory.json');
  const temporary = `${output}.${randomUUID()}.tmp`;
  try {
    const { writeFile } = await import('fs/promises');
    await writeFile(temporary, `${JSON.stringify(inventory, null, 2)}\n`, { flag: 'wx' });
    await rename(temporary, output);
  } finally {
    await unlink(temporary).catch((error: unknown) => {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
    });
  }
  return output;
}
