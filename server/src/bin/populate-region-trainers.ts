import { readFile, realpath, stat, writeFile } from 'fs/promises';
import { resolve } from 'path';
import sqlite3 from 'sqlite3';
import { closeDatabase, openDatabase, runStatement } from '../infrastructure/database/sqlite';
import { createPopulationProposal } from '../modules/trainers/population/trainer-population-cohort.service';
import { populationObject } from '../modules/trainers/population/trainer-population-proposal.validation';
import { applyPopulationProposal, reviewPopulationProposal } from '../modules/trainers/population/trainer-population-review.service';

const usage = [
  'npx ts-node src/bin/populate-region-trainers.ts propose --database <existing-copy.sqlite> --brief <brief.json> --output <new-proposal.json>',
  'npx ts-node src/bin/populate-region-trainers.ts review --database <same-copy.sqlite> --proposal <edited-proposal.json> --output <new-review.json>',
  'npx ts-node src/bin/populate-region-trainers.ts apply --database <same-copy.sqlite> --review <review.json>',
  'Propose/review open the explicit database read-only. Apply writes the exact reviewed records in one transaction.',
  'Output files must be new. No default save, save selection, meta access or schema transition.',
].join('\n');

async function main(): Promise<void> {
  const action = process.argv[2];
  if (action === '--help') { process.stdout.write(`${usage}\n`); return; }
  if (action !== 'propose' && action !== 'review' && action !== 'apply') throw new Error('Choose propose, review or apply explicitly');
  const options = new Map<string, string>();
  const inputFlag = action === 'propose' ? '--brief' : action === 'review' ? '--proposal' : '--review';
  for (let index = 3; index < process.argv.length; index += 2) {
    const argument = process.argv[index];
    const value = process.argv[index + 1];
    if (!['--database', inputFlag, ...(action === 'apply' ? [] : ['--output'])].includes(argument)
      || options.has(argument) || !value || value.startsWith('--')) throw new Error(`Unknown, repeated or incomplete argument: ${argument}`);
    options.set(argument, resolve(value));
  }
  if (!options.has('--database') || !options.has(inputFlag) || (action !== 'apply' && !options.has('--output'))) {
    throw new Error('Explicit database, input and (for propose/review) output paths are required');
  }
  const databasePath = await realpath(options.get('--database')!);
  if (!(await stat(databasePath)).isFile()) throw new Error('--database must name an existing file');
  const input: unknown = JSON.parse(await readFile(options.get(inputFlag)!, 'utf8'));
  const database = await openDatabase(databasePath, action === 'apply' ? sqlite3.OPEN_READWRITE : sqlite3.OPEN_READONLY);
  try {
    if (action === 'apply') {
      const review = populationObject(input, 'Review file', ['version', 'mode', 'proposal', 'reviewToken', 'changes', 'warnings', 'distributions']);
      if (review.version !== 1 || review.mode !== 'review-only') throw new Error('Unsupported review file version or mode');
      await runStatement(database, 'PRAGMA foreign_keys = ON');
      const receipt = await applyPopulationProposal(database, { proposal: review.proposal, reviewToken: review.reviewToken });
      process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
    } else {
      const proposal = action === 'propose' ? await createPopulationProposal(database, input)
        : await reviewPopulationProposal(database, input);
      await writeFile(options.get('--output')!, `${JSON.stringify(proposal, null, 2)}\n`, { flag: 'wx' });
      process.stdout.write(`${JSON.stringify({ mode: action, databasePath, output: options.get('--output') })}\n`);
    }
  } finally {
    await closeDatabase(database);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Population operation failed'}\n${usage}\n`);
  process.exitCode = 1;
});
