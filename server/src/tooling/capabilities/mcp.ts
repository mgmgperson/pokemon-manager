import { McpServer, type CallToolResult } from '@modelcontextprotocol/server';
import { z } from 'zod/v4';
import { loadCatalog, publicStatus } from './catalog';
import { getCapability, searchCatalog } from './query';

const cursor = z.string().min(1).max(512).regex(/^[\w-]+$/).optional();
const searchInput = z.object({
  query: z.string().min(1).max(300),
  domain: z.string().regex(/^[a-z0-9-]{1,60}$/).optional(),
  lifecycle: z.enum(['current', 'legacy', 'parked', 'unknown']).optional(),
  evidence: z.enum(['discovered', 'source-inspected', 'runtime-exercised']).optional(),
  freshness: z.enum(['current', 'stale', 'unknown']).optional(),
  kind: z.enum(['capability', 'symbol', 'access-point', 'file']).optional(),
  limit: z.number().int().min(1).max(20).optional(),
  cursor,
}).strict();
const getInput = z.object({
  id: z.string().min(1).max(8192),
  limit: z.number().int().min(1).max(50).optional(),
  cursor,
}).strict();
const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

function result(payload: object): CallToolResult {
  const text = JSON.stringify(payload);
  if (Buffer.byteLength(text, 'utf8') > 128 * 1024) throw new Error('Response exceeds 128 KiB; request a smaller limit or narrower search.');
  return { content: [{ type: 'text', text }], structuredContent: payload as Record<string, unknown> };
}

async function readOperation(operation: () => Promise<object>): Promise<CallToolResult> {
  try { return result(await operation()); }
  catch (error: unknown) {
    const payload = { error: { message: (error instanceof Error ? error.message : 'Catalog query failed').slice(0, 600) } };
    return { ...result(payload), isError: true };
  }
}

export function createCapabilityMcpServer(repositoryRoot: string): McpServer {
  const server = new McpServer({ name: 'pokemon-capabilities', version: '1.0.0' }, {
    instructions: 'Search this repository for reusable functions, settings, APIs, pages and commands. Fetch matching IDs, then inspect referenced source. Lifecycle, evidence and freshness are separate; incomplete coverage or zero matches do not prove absence. Refresh/review are separate local maintainer operations and are unavailable through MCP.',
  });
  server.registerTool('capability_search', {
    description: 'Search reviewed capabilities and the full discovered repository, including private helpers and legacy source. Returns bounded ranked entries, references, freshness/coverage and a nextCursor; default limit 6, maximum 20.',
    inputSchema: searchInput, annotations,
  }, async (input) => readOperation(async () => searchCatalog(await loadCatalog(repositoryRoot), input)));
  server.registerTool('capability_get', {
    description: 'Fetch one exact capability/inventory ID with paginated settings, contracts, prerequisites, effects and source evidence. Default detail limit 20, maximum 50. IDs are lookup keys; no filesystem paths or URLs are fetched.',
    inputSchema: getInput, annotations,
  }, async ({ id, ...options }) => readOperation(async () => getCapability(await loadCatalog(repositoryRoot), id, options)));
  server.registerTool('capability_status', {
    description: 'Read catalog presence, validity, working-tree drift, navigation freshness, counts and extraction limits. This never refreshes or rewrites artifacts.',
    inputSchema: z.object({}).strict(), annotations,
  }, async () => readOperation(async () => publicStatus(await loadCatalog(repositoryRoot))));
  return server;
}
