import { lstat, mkdir, readFile, realpath, rename, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { Inventory } from './types';

function missing(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

export async function writeCatalogArtifacts(repositoryRoot: string, inventory: Inventory, navigation: string): Promise<void> {
  const root = await realpath(repositoryRoot);
  for (const directory of ['.pm', '.pm/capabilities']) {
    const path = join(root, directory);
    try {
      const stat = await lstat(path);
      if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`Catalog directory refused: ${directory}`);
    } catch (error: unknown) {
      if (!missing(error)) throw error;
      await mkdir(path);
    }
  }
  const directory = join(root, '.pm/capabilities');
  const artifacts = [
    { path: join(directory, 'inventory.json'), contents: `${JSON.stringify(inventory, null, 2)}\n` },
    { path: join(directory, 'index.md'), contents: navigation },
  ];
  const prepared: Array<{ path: string; temporary: string; previous: Buffer | null }> = [];
  const committed: typeof prepared = [];
  try {
    for (const artifact of artifacts) {
      let previous: Buffer | null = null;
      try {
        const stat = await lstat(artifact.path);
        if (stat.isSymbolicLink() || !stat.isFile() || stat.size > 64 * 1024 * 1024) throw new Error(`Catalog artifact refused: ${artifact.path}`);
        previous = await readFile(artifact.path);
      } catch (error: unknown) { if (!missing(error)) throw error; }
      const entry = { path: artifact.path, temporary: `${artifact.path}.${randomUUID()}.tmp`, previous };
      prepared.push(entry);
      await writeFile(entry.temporary, artifact.contents, { flag: 'wx' });
    }
    for (const entry of prepared) {
      await rename(entry.temporary, entry.path);
      committed.push(entry);
    }
  } catch (error: unknown) {
    // Preserve both previous artifacts on reported write failures. Interrupted processes are detected by check.
    const failures: unknown[] = [];
    for (const entry of committed.reverse()) {
      try {
        if (entry.previous === null) await unlink(entry.path);
        else {
          await writeFile(entry.temporary, entry.previous, { flag: 'wx' });
          await rename(entry.temporary, entry.path);
        }
      } catch (failure: unknown) { failures.push(failure); }
    }
    if (failures.length) throw new AggregateError([error, ...failures], 'Catalog write and rollback failed; run refresh/check to repair');
    throw error;
  } finally {
    for (const entry of prepared) await unlink(entry.temporary).catch((error: unknown) => { if (!missing(error)) throw error; });
  }
}
