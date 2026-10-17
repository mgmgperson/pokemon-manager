import { posix } from 'path';
import { AccessPoint, Diagnostic, SourceLink, TypeScriptFacts } from './types';
import { stableId } from './source';

interface Binding { path: string; name: string }

export function resolveWiring(files: Map<string, TypeScriptFacts>, sourcePaths: Set<string>): { accessPoints: AccessPoint[]; links: SourceLink[]; diagnostics: Diagnostic[] } {
  const accessPoints: AccessPoint[] = [];
  const links: SourceLink[] = [];
  const diagnostics: Diagnostic[] = [];
  function modulePath(path: string, module: string): string | null {
    if (!module.startsWith('.')) return null;
    const base = posix.normalize(posix.join(posix.dirname(path), module));
    return [base, ...['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].map(extension => base + extension),
      ...['index.ts', 'index.tsx', 'index.js', 'index.jsx'].map(index => `${base}/${index}`)].find(candidate => sourcePaths.has(candidate)) ?? null;
  }
  function binding(path: string, name: string, seen = new Set<string>()): Binding | null {
    const key = `${path}#${name}`;
    if (seen.has(key)) return null;
    seen.add(key);
    const file = files.get(path);
    if (!file) return null;
    const imported = file.imports.get(name);
    if (imported) {
      const target = modulePath(path, imported.module);
      const local = target ? files.get(target)?.exports.get(imported.imported) : undefined;
      return target && local ? binding(target, local, seen) : null;
    }
    return file.symbols.some(symbol => !symbol.owner && symbol.name === name) ? { path, name } : null;
  }
  function symbolId(reference: Binding | null): string | null {
    return reference ? files.get(reference.path)?.symbols.find(symbol => symbol.name === reference.name && !symbol.owner)?.id ?? null : null;
  }
  function routerKey(reference: Binding | null): string | null {
    return reference && files.get(reference.path)?.routers.has(reference.name) ? `${reference.path}#${reference.name}` : null;
  }
  const mounts: { parent: string; child: string; prefix: string | null }[] = [];
  const apps: string[] = [];
  for (const [path, facts] of files) {
    for (const [name, kind] of facts.routers) if (kind === 'app') apps.push(`${path}#${name}`);
    for (const link of facts.links) {
      let target: string | null = null;
      if (link.kind === 'import') {
        target = modulePath(path, link.expression);
        if (link.expression.startsWith('.') && !target) diagnostics.push({ ...link, code: 'unresolved-import', message: `Local import target unavailable to TS resolver: ${link.expression}` });
      } else if (link.kind === 'call') target = symbolId(binding(path, link.expression));
      else if (link.kind === 'reexport') target = modulePath(path, link.expression.replace(/^['"]|['"]$/g, ''));
      links.push({ ...link, target });
    }
    for (const [exported, local] of facts.exports) links.push({ path, line: 1, column: 1, kind: 'export', from: `${path}#export:${exported}`, target: symbolId(binding(path, local)), expression: local });
    for (const registration of facts.registrations) {
      if (registration.method !== 'use') continue;
      for (const handler of registration.handlers) {
        const reference = binding(path, handler);
        const child = routerKey(reference);
        if (child) mounts.push({ parent: `${path}#${registration.receiver}`, child, prefix: registration.route });
        else accessPoints.push({ ...registration, id: stableId(path, 'middleware', `${registration.receiver}:${registration.route}:${handler}`),
          kind: 'middleware', address: registration.route, target: symbolId(reference), expression: handler,
          resolution: registration.route === null ? 'unresolved' : 'static' });
      }
    }
    for (const point of facts.accessPoints) {
      const target = point.target ? symbolId(binding(path, point.target)) : null;
      accessPoints.push({ ...point, target,
        resolution: point.kind === 'page' && !target ? 'unresolved' : point.resolution });
      if (point.kind === 'page' && point.target && !target) diagnostics.push({ path, line: point.line, column: point.column,
        code: 'unresolved-component', message: `Component reference is not a resolved local/imported symbol: ${point.target}` });
    }
  }
  const prefixes = new Map<string, Set<string | null>>();
  function traverse(key: string, prefix: string | null, ancestors: Set<string>): void {
    if (ancestors.has(key)) {
      diagnostics.push({ path: key.split('#')[0], line: 1, column: 1, code: 'router-cycle', message: `Cyclic router mount at ${key}` });
      return;
    }
    const known = prefixes.get(key) ?? new Set<string | null>();
    if (known.has(prefix)) return;
    known.add(prefix);
    prefixes.set(key, known);
    for (const mount of mounts.filter(mount => mount.parent === key)) traverse(mount.child,
      prefix === null || mount.prefix === null ? null : routeJoin(prefix, mount.prefix), new Set([...ancestors, key]));
  }
  for (const app of apps) traverse(app, '/', new Set());
  for (const [path, facts] of files) for (const route of facts.registrations) {
    if (route.method === 'use') continue;
    const mounted = prefixes.get(`${path}#${route.receiver}`);
    const knownPrefixes = mounted ?? new Set<string | null>([null]);
    for (const prefix of knownPrefixes) {
      const address = prefix === null || route.route === null ? null : routeJoin(prefix, route.route);
      const handler = route.handlers.at(-1);
      const target = handler ? symbolId(binding(path, handler)) : null;
      accessPoints.push({ path, line: route.line, column: route.column,
        id: stableId(path, 'http', `${route.method}:${address ?? route.route}:${route.receiver}:${target ?? 'inline-or-unresolved'}`),
        kind: 'http', address, method: route.method.toUpperCase(), target,
        expression: route.expression, resolution: !mounted ? 'unmounted' : address === null || !target ? 'unresolved' : 'static' });
      if (!target) diagnostics.push({ path, line: route.line, column: route.column, code: 'unresolved-handler',
        message: 'Inline/member/dynamic handler retained by source reference; no independent physical symbol resolved.' });
      if (!mounted) diagnostics.push({ ...route, code: 'unmounted-router', message: `No static app mount found for ${route.receiver}; local path ${route.route ?? '(dynamic)'} is retained in expression.` });
    }
  }
  return { accessPoints, links, diagnostics };
}

function routeJoin(prefix: string, path: string): string {
  return `/${[prefix, path].join('/').split('/').filter(Boolean).join('/')}`;
}
