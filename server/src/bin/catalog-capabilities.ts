import { resolve } from 'path';
import { loadCatalog, publicStatus, refreshCatalog } from '../tooling/capabilities/catalog';
import { getCapability, searchCatalog } from '../tooling/capabilities/query';
import { SearchInput } from '../tooling/capabilities/catalog-types';

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  const root = resolve(__dirname, '../../..');
  if (!['refresh', 'check', 'status', 'search', 'get'].includes(command)) throw new Error('Usage: catalog-capabilities.ts refresh|check|status|search <query>|get <ID> [--limit N] [--cursor TOKEN] [--domain NAME] [--lifecycle VALUE] [--evidence VALUE] [--freshness VALUE] [--kind VALUE]');
  let response: object;
  if (['refresh', 'check', 'status'].includes(command)) {
    if (args.length) throw new Error(`${command} takes no arguments`);
    const catalog = command === 'refresh' ? await refreshCatalog(root) : await loadCatalog(root);
    response = publicStatus(catalog);
    if (catalog.status.state === 'invalid' || command === 'check' && catalog.status.state !== 'current') process.exitCode = 1;
  } else {
    const value = args.shift();
    if (!value || value.startsWith('--')) throw new Error(`${command} requires one ${command === 'get' ? 'ID' : 'quoted query'}`);
    const options: Record<string, string | number> = {};
    while (args.length) {
      const flag = args.shift(); const argument = args.shift();
      if (!flag?.startsWith('--') || !argument || argument.startsWith('--')) throw new Error('Flags require values');
      const key = flag.slice(2);
      if (!(command === 'get' ? ['limit', 'cursor'] : ['limit', 'cursor', 'domain', 'lifecycle', 'evidence', 'freshness', 'kind']).includes(key) || key in options) throw new Error(`Unknown/repeated flag ${flag}`);
      if (key === 'limit' && !/^\d+$/.test(argument)) throw new Error('limit must be a positive integer');
      options[key] = key === 'limit' ? Number(argument) : argument;
    }
    const catalog = await loadCatalog(root);
    response = command === 'search' ? searchCatalog(catalog, { query: value, ...options } as SearchInput)
      : getCapability(catalog, value, options);
    if (catalog.status.state === 'invalid' || catalog.status.state === 'missing') process.exitCode = 1;
  }
  process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
}

if (require.main === module) main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Catalog operation failed'}\n`);
  process.exitCode = 1;
});
