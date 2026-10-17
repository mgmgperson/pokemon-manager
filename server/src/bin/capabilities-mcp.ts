import { resolve } from 'path';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { createCapabilityMcpServer } from '../tooling/capabilities/mcp';

function main(): void {
  if (process.argv.length !== 2) throw new Error('capabilities-mcp takes no arguments; its repository root is fixed by this entry point.');
  const repository = resolve(__dirname, '../../..');
  const handle = serveStdio(() => createCapabilityMcpServer(repository), {
    onerror: (error: Error): void => { process.stderr.write(`${error.message.slice(0, 600)}\n`); },
  });
  const shutdown = (): void => { void handle.close().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : 'MCP shutdown failed'}\n`);
    process.exitCode = 1;
  }); };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

if (require.main === module) {
  try { main(); }
  catch (error: unknown) {
    process.stderr.write(`${error instanceof Error ? error.message : 'Capability MCP startup failed'}\n`);
    process.exitCode = 1;
  }
}
