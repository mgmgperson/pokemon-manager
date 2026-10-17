import { resolve } from 'path';
import { buildInventory, writeInventory } from '../tooling/capabilities/inventory';

async function main(): Promise<void> {
  if (process.argv.length !== 2) throw new Error('Usage: npx ts-node src/bin/inventory-capabilities.ts (no arguments; scans this repository only)');
  const root = resolve(__dirname, '../../..');
  const inventory = await buildInventory(root);
  const output = await writeInventory(root, inventory);
  process.stdout.write(`${JSON.stringify({ output, files: inventory.files.length,
    symbols: inventory.files.reduce((count, file) => count + file.symbols.length, 0), accessPoints: inventory.accessPoints.length,
    complete: inventory.coverage.complete, diagnostics: inventory.coverage.diagnostics.length }, null, 2)}\n`);
}

if (require.main === module) main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Inventory generation failed'}\n`);
  process.exitCode = 1;
});
