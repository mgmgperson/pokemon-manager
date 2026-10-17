export interface SourceLocation {
  path: string;
  line: number;
  column: number;
}

export interface Diagnostic extends SourceLocation {
  code: string;
  message: string;
}

export interface SourceSymbol extends SourceLocation {
  id: string;
  name: string;
  owner: string | null;
  kind: string;
  visibility: string;
  signature: string;
  fingerprint: string;
  references: string[];
}

export interface SourceLink extends SourceLocation {
  kind: 'import' | 'reexport' | 'export' | 'call';
  from: string;
  target: string | null;
  expression: string;
  occurrences?: number;
}

export interface AccessPoint extends SourceLocation {
  id: string;
  kind: 'http' | 'page' | 'navigation' | 'cli' | 'package-command' | 'middleware';
  address: string | null;
  method?: string;
  target: string | null;
  expression: string;
  resolution: 'static' | 'unresolved' | 'unmounted';
}

export interface SourceFile {
  path: string;
  language: string;
  fingerprint: string;
  lifecycle: 'current' | 'legacy' | 'unknown';
  lifecycleReason: string;
  evidence: 'discovered';
  freshness: 'current';
  extraction: 'parsed' | 'partial' | 'file-only' | 'failed';
  symbols: SourceSymbol[];
}

export interface Inventory {
  version: 1;
  extractorFingerprint: string;
  snapshotFingerprint: string;
  files: SourceFile[];
  links: SourceLink[];
  accessPoints: AccessPoint[];
  coverage: {
    complete: boolean;
    roots: string[];
    formats: Record<string, number>;
    exclusions: { path: string; reason: string; entries: number }[];
    policies: string[];
    limitations: string[];
    diagnostics: Diagnostic[];
  };
}

export interface ImportBinding {
  module: string;
  imported: string;
}

export interface RouteRegistration extends SourceLocation {
  receiver: string;
  method: string;
  route: string | null;
  handlers: string[];
  expression: string;
}

export interface TypeScriptFacts {
  symbols: SourceSymbol[];
  imports: Map<string, ImportBinding>;
  exports: Map<string, string>;
  routers: Map<string, 'app' | 'router'>;
  registrations: RouteRegistration[];
  accessPoints: AccessPoint[];
  links: SourceLink[];
  diagnostics: Diagnostic[];
}
