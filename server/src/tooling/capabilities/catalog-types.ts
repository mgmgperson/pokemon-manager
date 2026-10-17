import { Inventory } from './types';

export type Lifecycle = 'current' | 'legacy' | 'parked' | 'unknown';
export type Evidence = 'discovered' | 'source-inspected' | 'runtime-exercised';
export type Freshness = 'current' | 'stale' | 'unknown';
export interface SourceStamp { path: string; fingerprint: string }

export interface CapabilityRecord {
  id: string;
  name: string;
  purpose: string;
  domain: string;
  searchTerms: string[];
  lifecycle: Lifecycle;
  lifecycleReason: string;
  evidence: Evidence;
  verification: { reference: string; scope: string } | null;
  extractorFingerprint: string;
  entryPoints: string[];
  contracts: string[];
  settings: string[];
  prerequisites: string[];
  effects: string[];
  limitations: string[];
  related: string[];
  inspectedSources: SourceStamp[];
  dependencies: SourceStamp[];
}

export interface CatalogStatus {
  state: 'current' | 'stale' | 'missing' | 'invalid';
  recordsState: 'valid' | 'missing';
  navigation: 'current' | 'stale' | 'missing';
  issues: string[];
  drift: { added: string[]; removed: string[]; changed: string[]; extractorChanged: boolean; coverageChanged: boolean };
  counts: { files: number; symbols: number; accessPoints: number; explanations: number; staleExplanations: number };
  coverage: { complete: boolean; diagnostics: Record<string, number>; limitations: string[] };
}

export interface Catalog {
  inventory: Inventory | null;
  records: CapabilityRecord[];
  freshness: Map<string, { freshness: Freshness; reasons: string[] }>;
  currentHashes: Map<string, string>;
  status: CatalogStatus;
}

export interface SearchInput {
  query: string;
  domain?: string;
  lifecycle?: Lifecycle;
  evidence?: Evidence;
  freshness?: Freshness;
  kind?: 'capability' | 'symbol' | 'access-point' | 'file';
  limit?: number;
  cursor?: string;
}
