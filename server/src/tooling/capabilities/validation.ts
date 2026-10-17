import { Inventory } from './types';
import { CapabilityRecord } from './catalog-types';

function requireCondition(condition: boolean, label: string): asserts condition {
  if (!condition) throw new Error(`Malformed catalog: ${label}`);
}
export function object(value: unknown, label: string): Record<string, unknown> {
  requireCondition(!!value && typeof value === 'object' && !Array.isArray(value), label);
  return value as Record<string, unknown>;
}
export function string(value: unknown, label: string, maximum = 4096): string {
  requireCondition(typeof value === 'string' && value.length > 0 && value.length <= maximum, label);
  return value as string;
}
function strings(value: unknown, label: string, maximum = 200000): string[] {
  requireCondition(Array.isArray(value) && value.length <= maximum, label);
  return (value as unknown[]).map(entry => string(entry, label));
}
function array(value: unknown, label: string): unknown[] {
  requireCondition(Array.isArray(value) && value.length <= 250000, label);
  return value as unknown[];
}
function choice(value: unknown, choices: string[], label: string): void {
  requireCondition(typeof value === 'string' && choices.includes(value), label);
}
function hash(value: unknown): void { requireCondition(typeof value === 'string' && /^[a-f0-9]{64}$/.test(value), 'source fingerprint'); }
export function sourcePath(value: unknown): string {
  const path = string(value, 'source path');
  requireCondition(!path.startsWith('/') && !path.includes('\\') && !path.includes('\0')
    && path.split('/').every(part => part !== '..' && part !== '.' && part.length > 0), 'repository-relative path');
  return path;
}
function location(value: Record<string, unknown>): void {
  sourcePath(value.path);
  requireCondition(Number.isSafeInteger(value.line) && Number(value.line) > 0
    && Number.isSafeInteger(value.column) && Number(value.column) > 0, 'source location');
}
function nullableString(value: unknown): void { if (value !== null) string(value, 'nullable string', 100000); }

export function validateInventory(value: unknown): Inventory {
  const inventory = object(value, 'inventory');
  requireCondition(inventory.version === 1, 'inventory version');
  hash(inventory.extractorFingerprint); hash(inventory.snapshotFingerprint);
  const ids = new Set<string>();
  function identity(value: unknown): void {
    const id = string(value, 'identity', 100000);
    requireCondition(!ids.has(id), `duplicate identity ${id.slice(0, 100)}`);
    ids.add(id);
  }
  const paths = new Set<string>();
  for (const entry of array(inventory.files, 'files')) {
    const file = object(entry, 'source file');
    const path = sourcePath(file.path);
    requireCondition(!paths.has(path), `duplicate source ${path}`); paths.add(path);
    string(file.language, 'language'); hash(file.fingerprint);
    choice(file.lifecycle, ['current', 'legacy', 'unknown'], 'file lifecycle'); string(file.lifecycleReason, 'lifecycle reason');
    requireCondition(file.evidence === 'discovered' && file.freshness === 'current', 'inventory evidence');
    choice(file.extraction, ['parsed', 'partial', 'file-only', 'failed'], 'extraction');
    for (const entry of array(file.symbols, 'symbols')) {
      const symbol = object(entry, 'symbol');
      location(symbol); requireCondition(symbol.path === path, 'symbol file'); identity(symbol.id);
      string(symbol.name, 'name'); nullableString(symbol.owner); string(symbol.kind, 'kind');
      string(symbol.visibility, 'visibility'); string(symbol.signature, 'signature'); hash(symbol.fingerprint);
      strings(symbol.references, 'symbol references');
    }
  }
  for (const entry of array(inventory.accessPoints, 'access points')) {
    const point = object(entry, 'access point'); location(point); identity(point.id);
    requireCondition(paths.has(String(point.path)), 'access point file');
    choice(point.kind, ['http', 'page', 'navigation', 'cli', 'package-command', 'middleware'], 'access kind');
    nullableString(point.address); nullableString(point.target); string(point.expression, 'access expression', 100000);
    if (point.method !== undefined) string(point.method, 'HTTP method');
    choice(point.resolution, ['static', 'unresolved', 'unmounted'], 'access resolution');
  }
  for (const entry of array(inventory.links, 'links')) {
    const link = object(entry, 'link'); location(link);
    choice(link.kind, ['import', 'reexport', 'export', 'call'], 'link kind');
    string(link.from, 'link origin', 100000); nullableString(link.target); string(link.expression, 'link expression', 100000);
    if (link.occurrences !== undefined) requireCondition(Number.isSafeInteger(link.occurrences) && Number(link.occurrences) > 0, 'occurrences');
  }
  const coverage = object(inventory.coverage, 'coverage'); requireCondition(typeof coverage.complete === 'boolean', 'coverage completeness');
  for (const name of ['roots', 'policies', 'limitations']) strings(coverage[name], name);
  for (const count of Object.values(object(coverage.formats, 'formats'))) requireCondition(Number.isSafeInteger(count) && Number(count) >= 0, 'format count');
  for (const entry of array(coverage.diagnostics, 'diagnostics')) {
    const diagnostic = object(entry, 'diagnostic'); location(diagnostic); string(diagnostic.code, 'diagnostic code'); string(diagnostic.message, 'diagnostic message', 100000);
  }
  for (const entry of array(coverage.exclusions, 'exclusions')) {
    const exclusion = object(entry, 'exclusion'); string(exclusion.path, 'excluded path'); string(exclusion.reason, 'exclusion reason');
    requireCondition(Number.isSafeInteger(exclusion.entries) && Number(exclusion.entries) >= 0, 'exclusion count');
  }
  return value as Inventory;
}

export function validateRecords(value: unknown): CapabilityRecord[] {
  const envelope = object(value, 'capability records'); requireCondition(envelope.version === 1, 'record version');
  const ids = new Set<string>();
  const records = array(envelope.records, 'records');
  requireCondition(records.length <= 5000, 'record count');
  for (const entry of records) {
    const record = object(entry, 'capability record');
    const id = string(record.id, 'capability ID', 200);
    requireCondition(/^capability:[a-z0-9][a-z0-9.-]*$/.test(id) && !ids.has(id), 'unique capability ID'); ids.add(id);
    for (const name of ['name', 'purpose', 'domain', 'lifecycleReason']) string(record[name], name, name === 'purpose' ? 1200 : 400);
    requireCondition(/^[a-z0-9-]+$/.test(String(record.domain)), 'domain');
    choice(record.lifecycle, ['current', 'legacy', 'parked', 'unknown'], 'lifecycle');
    choice(record.evidence, ['discovered', 'source-inspected', 'runtime-exercised'], 'evidence');
    hash(record.extractorFingerprint);
    for (const name of ['searchTerms', 'entryPoints', 'contracts', 'settings', 'prerequisites', 'effects', 'limitations', 'related']) strings(record[name], name, 100);
    for (const name of ['inspectedSources', 'dependencies']) {
      const seen = new Set<string>();
      for (const entry of array(record[name], name)) {
        const stamp = object(entry, 'source stamp'); const path = sourcePath(stamp.path); hash(stamp.fingerprint);
        requireCondition(!seen.has(path), 'duplicate stamp'); seen.add(path);
      }
      if (name === 'inspectedSources') requireCondition(seen.size > 0, 'source evidence required');
    }
    if (record.verification !== null) {
      const verification = object(record.verification, 'verification'); string(verification.reference, 'verification reference'); string(verification.scope, 'verification scope');
    }
    if (record.evidence === 'runtime-exercised') requireCondition(record.verification !== null, 'runtime verification reference/scope required');
  }
  return records as CapabilityRecord[];
}
