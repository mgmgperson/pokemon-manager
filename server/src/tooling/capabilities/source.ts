import { createHash } from 'crypto';
import { readdir, readFile } from 'fs/promises';
import { extname, join, relative } from 'path';
import { Inventory, SourceFile, SourceLocation, SourceSymbol } from './types';

export function fingerprint(source: string | Buffer): string {
  return createHash('sha256').update(source).digest('hex');
}

export function stableId(path: string, kind: string, name: string): string {
  return `${path}#${kind}:${encodeURIComponent(name)}`;
}

export function symbol(location: SourceLocation, name: string, owner: string | null,
  kind: string, visibility: string, signature: string, source: string): SourceSymbol {
  return { ...location, id: stableId(location.path, kind, owner ? `${owner}.${name}` : name),
    name, owner, kind, visibility, signature: signature.replace(/\s+/g, ' ').trim().slice(0, 600),
    fingerprint: fingerprint(source), references: [] };
}

const excludedDirectories = new Set([
  '.git', '.pm', '.agents', '.codex', '.aws', '.ssh', '.vscode', '.idea', 'credentials', 'secrets',
  'node_modules', 'vendor', 'third_party', 'Crow', 'build', 'dist', 'dist-ssr',
  'coverage', 'backups', 'cache', '.cache', '__pycache__', 'oldjson', 'logs',
]);
const languages: Record<string, string> = {
  '.ts': 'typescript', '.tsx': 'tsx', '.js': 'javascript', '.jsx': 'jsx',
  '.mjs': 'javascript', '.cjs': 'javascript', '.py': 'python',
  '.cpp': 'cpp', '.cc': 'cpp', '.cxx': 'cpp', '.h': 'cpp', '.hpp': 'cpp',
  '.c': 'c', '.sql': 'sql', '.sh': 'shell', '.cmake': 'cmake',
  '.css': 'css', '.scss': 'scss', '.html': 'html', '.json': 'json',
};

export const coveragePolicies: string[] = [
  'Walk all repository directories without consulting Git; include ignored and untracked source.',
  `Prune directories by name before opening files: ${[...excludedDirectories].sort().join(', ')}.`,
  'Never follow symlinks. Exclude environment/credential files, saves, SQLite sidecars, binary assets, lockfiles and downloaded world-data exports before reading contents.',
  'Read recognized source/config/reference formats only. Other files are counted by extension; paths of secrets/saves are not recorded individually.',
  'Record JSON reference entry points and source declarations without copying data payloads or SQL seed rows.',
];

export interface DiscoveredSources {
  files: { path: string; language: string }[];
  exclusions: Inventory['coverage']['exclusions'];
}

export async function discoverSources(root: string): Promise<DiscoveredSources> {
  const files: DiscoveredSources['files'] = [];
  const excluded = new Map<string, { path: string; reason: string; entries: number }>();
  function skip(path: string, reason: string): void {
    const key = `${path}:${reason}`;
    const entry = excluded.get(key) ?? { path, reason, entries: 0 };
    entry.entries++;
    excluded.set(key, entry);
  }
  async function walk(directory: string): Promise<void> {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const absolute = join(directory, entry.name);
      const path = relative(root, absolute).split('\\').join('/');
      if (entry.isSymbolicLink()) { skip(path, 'symlink (not followed)'); continue; }
      if (entry.isDirectory()) {
        if (excludedDirectories.has(entry.name)) skip(path, 'excluded directory (subtree not enumerated)');
        else await walk(absolute);
        continue;
      }
      if (!entry.isFile()) { skip(relative(root, directory) || '.', 'non-regular entries'); continue; }
      const extension = extname(entry.name).toLowerCase();
      if (/(?:\.sqlite(?:[.-].*)?|\.db(?:[.-].*)?|\.bak|\.backup|\.pem|\.key|\.p12|\.pfx)$/i.test(entry.name)
        || /^(?:\.env(?:\..*)?|credentials(?:\..*)?|secrets?(?:\..*)?)$/i.test(entry.name)) {
        skip(relative(root, directory) || '.', 'save/environment/credential files'); continue;
      }
      if (entry.name.endsWith('-lock.json') || entry.name === 'yarn.lock' || path.startsWith('database/city-names/')) {
        skip(relative(root, directory) || '.', 'lockfiles/downloaded world-data'); continue;
      }
      const language = entry.name === 'CMakeLists.txt' ? 'cmake'
        : entry.name.endsWith('.tsx.new') ? 'tsx' : languages[extension];
      if (language) files.push({ path, language });
      else skip(relative(root, directory) || '.', `non-source/unrecognized format: ${extension || '(none)'}`);
    }
  }
  await walk(root);
  return { files, exclusions: [...excluded.values()].sort((a, b) => `${a.path}:${a.reason}`.localeCompare(`${b.path}:${b.reason}`, 'en')) };
}

export async function readSource(root: string, path: string, language: string): Promise<{ file: SourceFile; source: string }> {
  const source = await readFile(join(root, path), 'utf8');
  const legacy = path.startsWith('archive/') || path.startsWith('frontend/');
  const current = path.startsWith('server/') || path.startsWith('frontend-v2/');
  return { source, file: { path, language, fingerprint: fingerprint(source),
    lifecycle: legacy ? 'legacy' : current && !path.endsWith('.new') ? 'current' : 'unknown',
    lifecycleReason: legacy ? 'Archived backend or legacy frontend per repository guide.'
      : current && !path.endsWith('.new') ? 'Current package; individual declaration wiring is not asserted.' : 'No lifecycle established by repository context.',
    evidence: 'discovered', freshness: 'current', extraction: 'file-only', symbols: [] } };
}
