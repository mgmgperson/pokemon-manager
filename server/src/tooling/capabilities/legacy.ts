import { spawnSync } from 'child_process';
import { Diagnostic, SourceSymbol } from './types';
import { symbol } from './source';

interface LegacyFacts { symbols: SourceSymbol[]; diagnostics: Diagnostic[] }

const pythonParser = `
import ast, json, sys
source = sys.stdin.read()
try:
    tree = ast.parse(source)
except SyntaxError as error:
    print(json.dumps({"error": str(error), "line": error.lineno or 1, "column": error.offset or 1}))
    sys.exit(0)
entries = []
def visit(node, owner=None):
    named = isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef))
    if named:
        kind = 'class' if isinstance(node, ast.ClassDef) else 'function'
        signature = ('class ' + node.name) if kind == 'class' else ('async ' if isinstance(node, ast.AsyncFunctionDef) else '') + 'def ' + node.name + '(' + ast.unparse(node.args) + ')' + (' -> ' + ast.unparse(node.returns) if node.returns else '')
        entries.append(dict(name=node.name, owner=owner, kind=kind, line=node.lineno, column=node.col_offset+1, signature=signature, source=ast.get_source_segment(source, node)))
        owner = (owner + '.' if owner else '') + node.name
    for child in ast.iter_child_nodes(node):
        visit(child, owner)
visit(tree)
print(json.dumps({"entries": entries}))
`;

export function extractPython(path: string, source: string): LegacyFacts {
  const facts: LegacyFacts = { symbols: [], diagnostics: [] };
  // Isolated stdlib parser, source on stdin: never import or execute the target Python module.
  const process = spawnSync('python3', ['-I', '-c', pythonParser], { input: source, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 15000 });
  if (process.error || process.status !== 0) {
    facts.diagnostics.push({ path, line: 1, column: 1, code: 'parse-error', message: `Python AST parser unavailable: ${process.error?.message ?? process.stderr.slice(0, 300)}` });
    return facts;
  }
  const parsed: unknown = JSON.parse(process.stdout);
  if (!parsed || typeof parsed !== 'object') throw new Error(`Invalid Python parser response for ${path}`);
  if ('error' in parsed) {
    facts.diagnostics.push({ path, line: 'line' in parsed && typeof parsed.line === 'number' ? parsed.line : 1,
      column: 'column' in parsed && typeof parsed.column === 'number' ? parsed.column : 1, code: 'parse-error', message: String(parsed.error) });
    return facts;
  }
  if (!('entries' in parsed) || !Array.isArray(parsed.entries)) throw new Error(`Missing Python AST declarations for ${path}`);
  for (const entry of parsed.entries as unknown[]) {
    if (!entry || typeof entry !== 'object' || !('name' in entry) || typeof entry.name !== 'string'
      || !('owner' in entry) || !(entry.owner === null || typeof entry.owner === 'string')
      || !('line' in entry) || typeof entry.line !== 'number' || !('column' in entry) || typeof entry.column !== 'number'
      || !('kind' in entry) || typeof entry.kind !== 'string' || !('signature' in entry) || typeof entry.signature !== 'string'
      || !('source' in entry) || typeof entry.source !== 'string') throw new Error(`Invalid Python declaration in ${path}`);
    facts.symbols.push(symbol({ path, line: entry.line, column: entry.column }, entry.name, entry.owner, entry.kind,
      entry.name.startsWith('_') ? 'convention-private' : 'module', entry.signature, entry.source));
  }
  return facts;
}

function masked(source: string, sql = false): string {
  const pattern = sql ? /--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'/g
    : /\/\/[^\n]*|\/\*[\s\S]*?\*\/|R"([^\s()\\]{0,16})\([\s\S]*?\)\1"|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g;
  return source.replace(pattern, match => match.replace(/[^\n]/g, ' '));
}

function sourcePosition(path: string, source: string, offset: number): { path: string; line: number; column: number } {
  const prefix = source.slice(0, offset);
  return { path, line: prefix.split('\n').length, column: offset - prefix.lastIndexOf('\n') };
}

function closing(source: string, start: number, open: string, close: string): number {
  let depth = 0;
  for (let index = start; index < source.length; index++) {
    if (source[index] === open) depth++;
    else if (source[index] === close && --depth === 0) return index;
  }
  return -1;
}

export function extractCpp(path: string, source: string): LegacyFacts {
  const facts: LegacyFacts = { symbols: [], diagnostics: [{ path, line: 1, column: 1, code: 'lexical-cpp',
    message: 'Lexical declaration extraction only: no preprocessing, overload/type validation, macro expansion, operators, function pointers or template specialization resolution.' }] };
  const clean = masked(source).replace(/^\s*#.*$/gm, match => match.replace(/[^\n]/g, ' '));
  const scopes: { start: number; end: number; name: string }[] = [];
  for (const match of clean.matchAll(/\b(class|struct|namespace)\s+(\w+)[^;{}]*\{/g)) {
    const start = (match.index ?? 0) + match[0].length - 1;
    const end = closing(clean, start, '{', '}');
    if (end < 0) { facts.diagnostics.push({ ...sourcePosition(path, source, start), code: 'parse-error', message: 'Unbalanced C++ scope.' }); continue; }
    const parent = scopes.find(scope => scope.start < start && scope.end > end);
    const name = parent ? `${parent.name}::${match[2]}` : match[2];
    scopes.push({ start, end, name });
    facts.symbols.push(symbol(sourcePosition(path, source, match.index ?? 0), match[2], parent?.name ?? null,
      match[1], 'source-declaration', match[0].slice(0, -1), source.slice(match.index, end + 1)));
  }
  let bodyEnd = -1;
  // Anchored declarations exclude ordinary calls and control flow; function bodies are skipped as a unit.
  const pattern = /(?:^|[;{}\n])\s*(?:(?:public|private|protected)\s*:\s*)?((?:[\w:<>,*&~]+\s+)*((?:\w+::)*~?\w+))\s*\(/g;
  for (const match of clean.matchAll(pattern)) {
    const offset = (match.index ?? 0) + match[0].indexOf(match[1]);
    if (offset < bodyEnd || /^(?:if|else|while|for|switch|return|catch|sizeof|alignof|static_assert)$/.test(match[2])) continue;
    const open = (match.index ?? 0) + match[0].lastIndexOf('(');
    const endParameters = closing(clean, open, '(', ')');
    if (endParameters < 0) continue;
    const suffix = clean.slice(endParameters + 1).match(/^\s*(?:(?:const|noexcept|override|final)\s*)?(?::[^{};]*)?([;{])/);
    if (!suffix) continue;
    const definition = suffix[1] === '{';
    const endHeader = endParameters + 1 + suffix[0].length;
    const end = definition ? closing(clean, endHeader - 1, '{', '}') + 1 : endHeader;
    if (end <= 0) continue;
    if (definition) bodyEnd = end;
    const parts = match[2].split('::');
    const name = parts.pop() as string;
    const scope = scopes.filter(scope => scope.start < offset && scope.end >= end).sort((a, b) => b.start - a.start)[0];
    const owner = parts.length ? parts.join('::') : scope?.name ?? null;
    facts.symbols.push(symbol(sourcePosition(path, source, offset), name, owner, owner ? 'method' : 'function',
      'source-declaration', source.slice(offset, endHeader - (definition ? 1 : 0)), source.slice(offset, end)));
  }
  return facts;
}

export function extractSql(path: string, source: string): LegacyFacts {
  const facts: LegacyFacts = { symbols: [], diagnostics: [] };
  const clean = masked(source, true);
  for (const match of clean.matchAll(/\bCREATE\s+(?:TEMP(?:ORARY)?\s+)?(?:UNIQUE\s+)?(TABLE|INDEX|VIEW|TRIGGER)\s+(?:IF\s+NOT\s+EXISTS\s+)?((?:"[^"]+"|`[^`]+`|\[[^\]]+\]|[\w.])+)/gi)) {
    const offset = match.index ?? 0;
    const end = clean.indexOf(';', offset);
    const name = match[2].replace(/["`\[\]]/g, '');
    facts.symbols.push(symbol(sourcePosition(path, source, offset), name, null, `sql-${match[1].toLowerCase()}`,
      'schema', match[0], source.slice(offset, end < 0 ? source.length : end + 1)));
  }
  if (/\bCREATE\s+(?!TEMP|UNIQUE|TABLE|INDEX|VIEW|TRIGGER)/i.test(clean)) facts.diagnostics.push({ path, line: 1, column: 1, code: 'unsupported-sql', message: 'SQL declarations outside table/index/view/trigger require source inspection.' });
  return facts;
}
