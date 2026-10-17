import { CapabilityRecord, Catalog, Evidence, Freshness, Lifecycle, SearchInput } from './catalog-types';
import { publicStatus, PublicStatus } from './catalog';
import { fingerprint } from './source';
import { object, string } from './validation';

interface Reference { id: string; path: string; line: number }
interface Row {
  id: string; kind: 'capability' | 'symbol' | 'access-point' | 'file';
  name: string; purpose: string; domain: string; lifecycle: Lifecycle; evidence: Evidence; freshness: Freshness;
  entryPoints: Reference[]; fields: { label: string; text: string }[];
  exactTerms?: string[];
  record?: CapabilityRecord;
}
interface Detail { kind: string; value: string; reference?: Reference }
interface Summary {
  id: string; kind: Row['kind']; name: string; purpose: string; domain: string;
  lifecycle: Lifecycle; evidence: Evidence; freshness: Freshness; entryPoints: Reference[];
}
export interface SearchResponse {
  status: PublicStatus; query: string; total: number;
  results: Array<Summary & { matchReasons: string[] }>;
  nextCursor: string | null; truncated: boolean;
}
export type GetResponse = { status: PublicStatus; found: false; id: string }
  | (Summary & { status: PublicStatus; found: true; totalDetails: number;
    details: Array<Detail & { valueTruncated: boolean }>; nextCursor: string | null; truncated: boolean });

function domainFor(path: string): string {
  if (path.startsWith('archive/')) return 'legacy';
  const module = path.match(/server\/src\/modules\/([^/]+)/)?.[1];
  if (module) return module;
  for (const [part, domain] of [['/generators/', 'generation'], ['/engines/', 'simulation'], ['/reference-data/', 'reference-data'],
    ['/infrastructure/', 'infrastructure'], ['/tooling/', 'tooling'], ['/bin/', 'tooling'], ['/trainers/', 'trainers'], ['/regions/', 'geography'], ['/cities/', 'geography']] as const) {
    if (path.includes(part)) return domain;
  }
  return path.startsWith('database/') ? 'database' : path.startsWith('frontend') ? 'frontend' : 'configuration';
}
function inventoryReference(catalog: Catalog, id: string): Reference | undefined {
  const inventory = catalog.inventory;
  const point = inventory?.accessPoints.find(point => point.id === id);
  if (point) return { id, path: point.path, line: point.line };
  const file = inventory?.files.find(file => file.path === id.split('#')[0]);
  const symbol = file?.symbols.find(symbol => symbol.id === id);
  return symbol ? { id, path: symbol.path, line: symbol.line } : file && id === file.path ? { id, path: file.path, line: 1 } : undefined;
}
function sourceFreshness(catalog: Catalog, path: string): Freshness {
  const file = catalog.inventory?.files.find(file => file.path === path);
  return file && catalog.currentHashes.get(path) === file.fingerprint && !catalog.status.drift.extractorChanged ? 'current' : 'stale';
}
function rows(catalog: Catalog, group = true): Row[] {
  if (!catalog.inventory || catalog.status.state === 'invalid') return [];
  const inventory = catalog.inventory;
  const output: Row[] = [];
  const grouped = new Set<string>();
  for (const record of catalog.records) {
    const refs = [...record.entryPoints, ...record.contracts];
    refs.forEach(ref => grouped.add(ref));
    const related = inventory.accessPoints.filter(point => record.entryPoints.includes(point.id) || !!point.target && record.entryPoints.includes(point.target));
    for (const point of related) grouped.add(point.id);
    output.push({ id: record.id, kind: 'capability', name: record.name, purpose: record.purpose, domain: record.domain,
      lifecycle: record.lifecycle, evidence: record.evidence, freshness: catalog.freshness.get(record.id)?.freshness ?? 'unknown',
      entryPoints: record.entryPoints.map(ref => inventoryReference(catalog, ref)).filter((ref): ref is Reference => !!ref), record,
      exactTerms: refs.map(ref => {
        const point = inventory.accessPoints.find(point => point.id === ref);
        const symbol = inventory.files.find(file => file.path === ref.split('#')[0])?.symbols.find(symbol => symbol.id === ref);
        return point?.address ?? symbol?.name ?? ref;
      }),
      fields: [{ label: 'name/purpose', text: `${record.name} ${record.purpose}` }, { label: 'domain', text: record.domain },
        { label: 'settings/contracts', text: [...record.settings, ...record.contracts].join(' ') },
        { label: 'search terms', text: record.searchTerms.join(' ') },
        { label: 'entry points/routes/commands', text: [...refs, ...related.map(point => `${point.address ?? ''} ${point.expression}`)].join(' ') },
        { label: 'prerequisites/effects/limitations', text: [...record.prerequisites, ...record.effects, ...record.limitations].join(' ') }] });
  }
  for (const file of inventory.files) {
    const common = { domain: domainFor(file.path), lifecycle: file.lifecycle, evidence: 'discovered' as const, freshness: sourceFreshness(catalog, file.path) };
    output.push({ ...common, id: file.path, kind: 'file', name: file.path, purpose: `${file.language}; ${file.extraction} source discovery.`,
      entryPoints: [{ id: file.path, path: file.path, line: 1 }], fields: [{ label: 'source path', text: file.path }] });
    for (const symbol of file.symbols) {
      if (group && grouped.has(symbol.id)) continue;
      output.push({ ...common, id: symbol.id, kind: 'symbol', name: symbol.owner ? `${symbol.owner}.${symbol.name}` : symbol.name,
        purpose: `Discovered ${symbol.kind}: ${symbol.signature}`, entryPoints: [{ id: symbol.id, path: file.path, line: symbol.line }],
        fields: [{ label: 'symbol/signature', text: `${symbol.name} ${symbol.owner ?? ''} ${symbol.signature}` }, { label: 'source path', text: file.path }] });
    }
  }
  for (const point of inventory.accessPoints) {
    if (group && grouped.has(point.id)) continue;
    const file = inventory.files.find(file => file.path === point.path);
    output.push({ id: point.id, kind: 'access-point', name: `${point.method ?? point.kind} ${point.address ?? '(unresolved)'}`,
      purpose: `Discovered ${point.kind}; ${point.resolution} wiring.`, domain: domainFor(point.path), lifecycle: file?.lifecycle ?? 'unknown',
      evidence: 'discovered', freshness: sourceFreshness(catalog, point.path), entryPoints: [{ id: point.id, path: point.path, line: point.line }],
      fields: [{ label: 'address/command', text: `${point.address ?? ''} ${point.method ?? ''}` },
        { label: 'source/handler expression', text: `${point.path} ${point.target ?? ''} ${point.expression}` }] });
  }
  return output;
}

function normalize(text: string): string {
  return text.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().replace(/[^a-z0-9/:.-]+/g, ' ');
}
function pageLimit(value: unknown, fallback: number, maximum: number): number {
  if (value === undefined) return fallback;
  if (!Number.isSafeInteger(value) || Number(value) < 1 || Number(value) > maximum) throw new Error(`limit must be an integer from 1 to ${maximum}`);
  return Number(value);
}
function revision(catalog: Catalog, scope: unknown): string {
  return fingerprint(JSON.stringify([catalog.inventory, catalog.status.state, [...catalog.currentHashes], catalog.records, scope]));
}
function offsetFor(cursor: unknown, revision: string): number {
  if (cursor === undefined) return 0;
  if (typeof cursor !== 'string' || cursor.length > 512 || !/^[\w-]+$/.test(cursor)) throw new Error('Invalid cursor');
  const parsed = object(JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as unknown, 'cursor');
  if (parsed.revision !== revision) throw new Error('Cursor expired or belongs to another query; restart pagination');
  if (!Number.isSafeInteger(parsed.offset) || Number(parsed.offset) < 0) throw new Error('Invalid cursor offset');
  return Number(parsed.offset);
}
function cursorFor(offset: number, revision: string): string {
  return Buffer.from(JSON.stringify({ offset, revision })).toString('base64url');
}
function summary(row: Row): Summary {
  return { id: row.id, kind: row.kind, name: row.name.slice(0, 400), purpose: row.purpose.slice(0, 1200), domain: row.domain,
    lifecycle: row.lifecycle, evidence: row.evidence, freshness: row.freshness, entryPoints: row.entryPoints.slice(0, 3) };
}

export function searchCatalog(catalog: Catalog, input: SearchInput): SearchResponse {
  const query = string(input.query, 'query', 300).trim();
  if (!query) throw new Error('Query must not be blank');
  const allowed: Record<string, readonly string[]> = { lifecycle: ['current', 'legacy', 'parked', 'unknown'],
    evidence: ['discovered', 'source-inspected', 'runtime-exercised'], freshness: ['current', 'stale', 'unknown'], kind: ['capability', 'symbol', 'access-point', 'file'] };
  for (const [key, options] of Object.entries(allowed)) {
    const value = input[key as keyof SearchInput];
    if (value !== undefined && (typeof value !== 'string' || !options.includes(value))) throw new Error(`Invalid ${key} filter`);
  }
  if (input.domain !== undefined && (typeof input.domain !== 'string' || !/^[a-z0-9-]{1,60}$/.test(input.domain))) throw new Error('Invalid domain filter');
  const limit = pageLimit(input.limit, 6, 20);
  const tokens = [...new Set(normalize(query).split(' ').filter(Boolean))];
  if (!tokens.length) throw new Error('Query needs searchable characters');
  const ranked = rows(catalog).filter(row => (!input.domain || row.domain === input.domain) && (!input.lifecycle || row.lifecycle === input.lifecycle)
    && (!input.evidence || row.evidence === input.evidence) && (!input.freshness || row.freshness === input.freshness) && (!input.kind || row.kind === input.kind))
    .map(row => {
      const reasons: string[] = [];
      const hits = new Set<string>();
      let score = 0;
      for (const field of row.fields) {
        const haystack = normalize(field.text);
        const matched = tokens.filter(token => haystack.includes(token));
        if (matched.length) { score += matched.length * (field.label === 'name/purpose' ? 5 : 2); reasons.push(field.label); matched.forEach(token => hits.add(token)); }
      }
      if (normalize(row.name).includes(normalize(query))) score += 15;
      if (row.exactTerms?.some(term => normalize(term) === normalize(query))) score += 30;
      if (hits.size === tokens.length && hits.size) score += 10;
      if (row.kind === 'capability' && hits.size) score += 5;
      return { row, score, reasons, hits: hits.size };
    }).filter(match => match.hits > 0).sort((a, b) => b.hits - a.hits || b.score - a.score || a.row.id.localeCompare(b.row.id, 'en'));
  const rev = revision(catalog, { query, domain: input.domain, lifecycle: input.lifecycle, evidence: input.evidence, freshness: input.freshness, kind: input.kind });
  const offset = offsetFor(input.cursor, rev);
  if (offset > ranked.length) throw new Error('Cursor offset exceeds results');
  return { status: publicStatus(catalog), query, total: ranked.length,
    results: ranked.slice(offset, offset + limit).map(match => ({ ...summary(match.row), matchReasons: match.reasons.slice(0, 4) })),
    nextCursor: offset + limit < ranked.length ? cursorFor(offset + limit, rev) : null,
    truncated: offset + limit < ranked.length };
}

export function getCapability(catalog: Catalog, id: string, options: { limit?: number; cursor?: string } = {}): GetResponse {
  string(id, 'entry ID', 8192);
  const limit = pageLimit(options.limit, 20, 50);
  // Exact lookup of inventory IDs only. This function never interprets an ID as a filesystem request.
  const row = rows(catalog, false).find(row => row.id === id);
  if (!row) return { status: publicStatus(catalog), found: false, id };
  const details: Detail[] = [];
  if (row.record) {
    const record = row.record;
    details.push({ kind: 'lifecycle-evidence', value: record.lifecycleReason });
    if (record.verification) details.push({ kind: 'verification', value: `${record.verification.reference}: ${record.verification.scope}` });
    for (const kind of ['settings', 'prerequisites', 'effects', 'limitations', 'entryPoints', 'contracts', 'related'] as const) {
      for (const value of record[kind]) details.push({ kind, value, reference: inventoryReference(catalog, value) });
    }
    for (const [kind, stamps] of [['inspectedSource', record.inspectedSources], ['dependency', record.dependencies]] as const) {
      for (const stamp of stamps) details.push({ kind, value: `${stamp.path} @ ${stamp.fingerprint}`, reference: inventoryReference(catalog, stamp.path) });
    }
    for (const reason of catalog.freshness.get(id)?.reasons ?? []) details.push({ kind: 'staleness', value: reason });
  } else {
    const file = catalog.inventory?.files.find(file => file.path === row.entryPoints[0]?.path);
    if (file) {
      details.push({ kind: 'discovery-limits', value: `${file.lifecycleReason} Evidence is discovery only; extraction ${file.extraction}.` });
      for (const record of catalog.records) if (record.inspectedSources.some(source => source.path === file.path)) {
        details.push({ kind: 'related-capability', value: record.id });
      }
      const symbol = file.symbols.find(symbol => symbol.id === id);
      if (symbol) {
        details.push({ kind: 'signature', value: symbol.signature });
        for (const value of symbol.references) details.push({ kind: 'call-expression', value });
      } else if (row.kind === 'file') for (const symbol of file.symbols) details.push({ kind: symbol.kind, value: symbol.signature, reference: { id: symbol.id, path: symbol.path, line: symbol.line } });
      for (const point of catalog.inventory?.accessPoints ?? []) {
        if (point.id === id || point.target === id || row.kind === 'file' && point.path === file.path) details.push({ kind: point.kind,
          value: `${point.method ?? ''} ${point.address ?? '(unresolved)'}: ${point.expression}`, reference: { id: point.id, path: point.path, line: point.line } });
      }
    }
  }
  const rev = revision(catalog, { id });
  const offset = offsetFor(options.cursor, rev);
  if (offset > details.length) throw new Error('Cursor offset exceeds details');
  return { status: publicStatus(catalog), found: true, ...summary(row), totalDetails: details.length,
    details: details.slice(offset, offset + limit).map(detail => ({ ...detail, value: detail.value.slice(0, 1200), valueTruncated: detail.value.length > 1200 })),
    nextCursor: offset + limit < details.length ? cursorFor(offset + limit, rev) : null, truncated: offset + limit < details.length };
}
