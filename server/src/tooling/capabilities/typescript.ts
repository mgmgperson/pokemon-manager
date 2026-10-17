import ts from 'typescript';
import { AccessPoint, SourceLocation, SourceSymbol, TypeScriptFacts } from './types';
import { stableId, symbol } from './source';

export function extractTypeScript(path: string, source: string): TypeScriptFacts {
  const file = ts.createSourceFile(path.endsWith('.new') ? path.slice(0, -4) : path, source, ts.ScriptTarget.Latest, true);
  const facts: TypeScriptFacts = { symbols: [], imports: new Map(), exports: new Map(),
    routers: new Map(), registrations: [], accessPoints: [], links: [], diagnostics: [] };
  const declarations = new Map<string, ts.Expression>();
  const symbolNodes = new Map<ts.Node, SourceSymbol>();
  function location(node: ts.Node): SourceLocation {
    const position = file.getLineAndCharacterOfPosition(node.getStart(file));
    return { path, line: position.line + 1, column: position.character + 1 };
  }
  function text(node: ts.Node): string { return node.getText(file); }
  function diagnostic(node: ts.Node, code: string, message: string): void {
    facts.diagnostics.push({ ...location(node), code, message });
  }
  function exported(node: ts.Node): boolean {
    return ts.canHaveModifiers(node) && !!ts.getModifiers(node)?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword);
  }
  function unwrapped(expression: ts.Expression): ts.Expression {
    if (ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression)
      || ts.isSatisfiesExpression(expression) || ts.isNonNullExpression(expression)) return unwrapped(expression.expression);
    return expression;
  }
  function literal(expression: ts.Expression | undefined, seen = new Set<string>()): string | null {
    if (!expression) return null;
    expression = unwrapped(expression);
    if (ts.isStringLiteralLike(expression)) return expression.text;
    if (ts.isIdentifier(expression) && !seen.has(expression.text)) {
      seen.add(expression.text);
      return literal(declarations.get(expression.text), seen);
    }
    return null;
  }
  function values(expression: ts.Expression | undefined): (string | null)[] {
    if (expression && ts.isArrayLiteralExpression(expression)) return expression.elements.map(element => literal(element));
    return [literal(expression)];
  }
  function addSymbol(node: ts.Node, name: string, owner: string | null, kind: string, signature: string): SourceSymbol {
    let visibility = exported(node) ? 'exported' : 'local';
    if (ts.canHaveModifiers(node)) {
      const modifiers = ts.getModifiers(node) ?? [];
      if (modifiers.some(modifier => modifier.kind === ts.SyntaxKind.PrivateKeyword)) visibility = 'private';
      else if (modifiers.some(modifier => modifier.kind === ts.SyntaxKind.ProtectedKeyword)) visibility = 'protected';
      else if (owner && (ts.isMethodDeclaration(node) || ts.isPropertyDeclaration(node))) visibility = 'public';
    }
    const entry = symbol(location(node), name, owner, kind, visibility, signature, text(node));
    facts.symbols.push(entry);
    symbolNodes.set(node, entry);
    return entry;
  }
  function signature(node: ts.Node): string {
    if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)
      || ts.isMethodDeclaration(node) || ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)
      || ts.isConstructorDeclaration(node)) {
      return source.slice(node.getStart(file), node.body?.getStart(file) ?? node.end);
    }
    if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isEnumDeclaration(node)) {
      return `${ts.SyntaxKind[node.kind]} ${node.name?.text ?? 'default'}${'heritageClauses' in node && node.heritageClauses ? ` ${node.heritageClauses.map(text).join(' ')}` : ''}`;
    }
    if (ts.isVariableDeclaration(node) || ts.isPropertyDeclaration(node) || ts.isPropertyAssignment(node)) {
      const annotation = 'type' in node && node.type ? `: ${text(node.type)}` : '';
      const initializer = node.initializer;
      if (initializer && (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))) return `${text(node.name)}${annotation} = ${signature(initializer)}`;
      return `${text(node.name)}${annotation}${initializer ? ` = [${ts.SyntaxKind[initializer.kind]}]` : ''}`;
    }
    return text(node);
  }
  function declarationsPass(node: ts.Node): void {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) declarations.set(node.name.text, node.initializer);
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const module = node.moduleSpecifier.text;
      const clause = node.importClause;
      if (clause?.name) facts.imports.set(clause.name.text, { module, imported: 'default' });
      if (clause?.namedBindings) {
        if (ts.isNamespaceImport(clause.namedBindings)) facts.imports.set(clause.namedBindings.name.text, { module, imported: '*' });
        else for (const binding of clause.namedBindings.elements) facts.imports.set(binding.name.text, { module, imported: binding.propertyName?.text ?? binding.name.text });
      }
      facts.links.push({ ...location(node), kind: 'import', from: path, target: null, expression: module });
    }
    if (ts.isExportAssignment(node)) facts.exports.set('default', text(node.expression));
    if (ts.isExportDeclaration(node)) {
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const binding of node.exportClause.elements) {
          const local = binding.propertyName?.text ?? binding.name.text;
          if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
            const synthetic = `@reexport:${binding.name.text}`;
            facts.imports.set(synthetic, { module: node.moduleSpecifier.text, imported: local });
            facts.exports.set(binding.name.text, synthetic);
          } else facts.exports.set(binding.name.text, local);
        }
      }
      facts.links.push({ ...location(node), kind: 'reexport', from: path, target: null, expression: node.moduleSpecifier ? text(node.moduleSpecifier) : text(node) });
      if (!node.exportClause) diagnostic(node, 'export-star', 'Wildcard re-export recorded at file level; individual targets are unresolved.');
    }
    ts.forEachChild(node, declarationsPass);
  }
  declarationsPass(file);
  for (const [name, initializer] of declarations) {
    if (!ts.isCallExpression(initializer)) continue;
    const callee = initializer.expression;
    const binding = ts.isIdentifier(callee) ? facts.imports.get(callee.text) : undefined;
    if (binding?.module === 'express' && (binding.imported === 'default' || binding.imported === 'Router')) {
      facts.routers.set(name, binding.imported === 'Router' ? 'router' : 'app');
    } else if (ts.isPropertyAccessExpression(callee) && callee.name.text === 'Router'
      && ts.isIdentifier(callee.expression) && facts.imports.get(callee.expression.text)?.module === 'express') facts.routers.set(name, 'router');
  }
  function visit(node: ts.Node, owner: string | null): void {
    let entry: SourceSymbol | undefined;
    if (ts.isFunctionDeclaration(node)) entry = addSymbol(node, node.name?.text ?? 'default', owner, 'function', signature(node));
    else if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isEnumDeclaration(node)) entry = addSymbol(node, node.name?.text ?? 'default', owner, ts.isClassDeclaration(node) ? 'class' : ts.isInterfaceDeclaration(node) ? 'interface' : 'enum', signature(node));
    else if (ts.isTypeAliasDeclaration(node)) entry = addSymbol(node, node.name.text, owner, 'type', signature(node));
    else if (ts.isModuleDeclaration(node)) entry = addSymbol(node, text(node.name), owner, 'namespace', signature(node).split('{')[0]);
    else if (ts.isVariableDeclaration(node)) {
      const initializer = node.initializer;
      const callable = initializer && (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer));
      entry = addSymbol(node, text(node.name), owner, callable ? 'function' : 'variable', signature(node));
      const statement = node.parent.parent;
      if (exported(statement)) { entry.visibility = 'exported'; facts.exports.set(entry.name, entry.name); }
    } else if (ts.isMethodDeclaration(node) || ts.isMethodSignature(node)
      || ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)
      || ts.isPropertySignature(node) || ts.isPropertyDeclaration(node)) {
      entry = addSymbol(node, text(node.name), owner, ts.isPropertySignature(node) || ts.isPropertyDeclaration(node) ? 'property' : 'method', signature(node));
    } else if (ts.isConstructorDeclaration(node)) entry = addSymbol(node, 'constructor', owner, 'constructor', signature(node));
    else if (ts.isPropertyAssignment(node) && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) entry = addSymbol(node, text(node.name), owner, 'function', signature(node));
    else if (ts.isFunctionExpression(node) && node.name && !symbolNodes.has(node.parent)) entry = addSymbol(node, node.name.text, owner, 'function', signature(node));
    if (entry && exported(node)) facts.exports.set(ts.canHaveModifiers(node) && ts.getModifiers(node)?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword) ? 'default' : entry.name, entry.name);
    if (ts.isCallExpression(node)) {
      if (ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.expression)) {
        const receiver = node.expression.expression.text;
        const method = node.expression.name.text.toLowerCase();
        if (facts.routers.has(receiver) && ['use', 'get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'all'].includes(method)) {
          const first = node.arguments[0];
          const dynamicPrefix = method === 'use' && first && node.arguments.length > 1
            && ts.isIdentifier(first) && declarations.has(first.text)
            && !facts.routers.has(first.text)
            && !ts.isArrowFunction(declarations.get(first.text) as ts.Expression)
            && !ts.isFunctionExpression(declarations.get(first.text) as ts.Expression);
          const hasPath = first && (literal(first) !== null || ts.isArrayLiteralExpression(first) || ts.isRegularExpressionLiteral(first) || dynamicPrefix);
          const ambiguousPrefix = method === 'use' && !hasPath && node.arguments.length > 1
            && first && !ts.isArrowFunction(first) && !ts.isFunctionExpression(first);
          const routeValues = hasPath ? values(first) : method === 'use' && !ambiguousPrefix ? ['/'] : [null];
          const handlers = node.arguments.slice(hasPath || method !== 'use' ? 1 : 0).map(text);
          for (const route of routeValues) facts.registrations.push({ ...location(node), receiver, method, route, handlers, expression: text(node).slice(0, 300) });
          if (routeValues.includes(null)) diagnostic(node, 'dynamic-route', 'HTTP path cannot be resolved statically.');
        } else if (facts.routers.has(receiver) && method === 'route') diagnostic(node, 'chained-route', 'Chained router.route() is not resolved by this extractor.');
      } else if (ts.isElementAccessExpression(node.expression) && ts.isIdentifier(node.expression.expression)
        && facts.routers.has(node.expression.expression.text)) {
        diagnostic(node, 'dynamic-route', 'Computed router method is unresolved; inspect the source call.');
      }
      let parent: ts.Node | undefined = node.parent;
      while (parent && !symbolNodes.has(parent)) parent = parent.parent;
      const caller = parent ? symbolNodes.get(parent) : undefined;
      if (caller) {
        const expression = text(node.expression).slice(0, 300);
        caller.references.push(expression);
        facts.links.push({ ...location(node), kind: 'call', from: caller.id, target: null, expression });
      }
    }
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) extractJsx(node);
    const nextOwner = entry ? (owner ? `${owner}.${entry.name}` : entry.name) : owner;
    ts.forEachChild(node, child => visit(child, nextOwner));
  }
  function jsxValue(attribute: ts.JsxAttribute): ts.Expression | undefined {
    return attribute.initializer && ts.isJsxExpression(attribute.initializer) ? attribute.initializer.expression : attribute.initializer;
  }
  function jsxAttribute(node: ts.JsxOpeningLikeElement, name: string): ts.JsxAttribute | undefined {
    return node.attributes.properties.find((attribute): attribute is ts.JsxAttribute => ts.isJsxAttribute(attribute) && text(attribute.name) === name);
  }
  function routePath(node: ts.JsxOpeningLikeElement): string | null {
    const own = jsxAttribute(node, 'path');
    const value = own ? literal(jsxValue(own)) : '';
    if (value === null) return null;
    if (value.startsWith('/')) return value;
    let ancestor: ts.Node | undefined = node.parent;
    while (ancestor) {
      if (ts.isJsxElement(ancestor) && ancestor.openingElement !== node && text(ancestor.openingElement.tagName) === 'Route') {
        const prefix = routePath(ancestor.openingElement);
        return prefix === null ? null : `/${[prefix, value].join('/').split('/').filter(Boolean).join('/')}`;
      }
      ancestor = ancestor.parent;
    }
    return `/${value}`;
  }
  function navigationValues(node: ts.Node, expression: ts.Expression | undefined): (string | null)[] {
    const direct = literal(expression);
    if (direct !== null || !expression || !ts.isPropertyAccessExpression(expression)) return [direct];
    // Resolve menuItems.map(item => <Link to={item.path}/>) without treating every path property as navigation.
    let ancestor: ts.Node | undefined = node.parent;
    while (ancestor) {
      if (ts.isArrowFunction(ancestor) && ancestor.parameters[0] && text(ancestor.parameters[0].name) === text(expression.expression)
        && ts.isCallExpression(ancestor.parent) && ts.isPropertyAccessExpression(ancestor.parent.expression)
        && ancestor.parent.expression.name.text === 'map') {
        const arrayExpression = ancestor.parent.expression.expression;
        const array = ts.isIdentifier(arrayExpression) ? declarations.get(arrayExpression.text) : arrayExpression;
        if (array && ts.isArrayLiteralExpression(array)) return array.elements.map(element => {
          if (!ts.isObjectLiteralExpression(element)) return null;
          const property = element.properties.find(property => ts.isPropertyAssignment(property) && text(property.name) === expression.name.text);
          return property && ts.isPropertyAssignment(property) ? literal(property.initializer) : null;
        });
      }
      ancestor = ancestor.parent;
    }
    return [null];
  }
  function extractJsx(node: ts.JsxOpeningLikeElement): void {
    const tag = text(node.tagName);
    if (tag === 'Route') {
      const address = routePath(node);
      const element = jsxAttribute(node, 'element');
      const expression = element ? jsxValue(element) : undefined;
      const component = expression && (ts.isJsxSelfClosingElement(expression) || ts.isJsxElement(expression))
        ? text(ts.isJsxElement(expression) ? expression.openingElement.tagName : expression.tagName) : null;
      // Pathless layouts are recorded along with URL-bearing routes.
      addAccess(node, 'page', address, component, element ? text(element) : 'pathless layout');
      if (address === null || !component) diagnostic(node, 'dynamic-page', 'Page path or component is unresolved; inspect the JSX reference.');
    }
    const to = jsxAttribute(node, 'to') ?? (tag === 'a' ? jsxAttribute(node, 'href') : undefined);
    if (to) for (const address of navigationValues(node, jsxValue(to))) {
      addAccess(node, 'navigation', address, null, text(to));
      if (address === null) diagnostic(to, 'dynamic-navigation', 'Navigation target requires runtime values.');
    }
  }
  function addAccess(node: ts.Node, kind: AccessPoint['kind'], address: string | null, target: string | null, expression: string): void {
    facts.accessPoints.push({ ...location(node), id: stableId(path, kind, `${address ?? expression}:${target ?? ''}`),
      kind, address, target, expression: expression.slice(0, 300), resolution: address === null ? 'unresolved' : 'static' });
  }
  visit(file, null);
  for (const entry of facts.symbols) entry.references = [...new Set(entry.references)].sort();
  // createSourceFile is deliberately used without a Program: it never resolves or loads application dependencies.
  const diagnostics = (file as ts.SourceFile & { parseDiagnostics?: readonly ts.Diagnostic[] }).parseDiagnostics ?? [];
  for (const error of diagnostics) {
    const position = file.getLineAndCharacterOfPosition(error.start ?? 0);
    facts.diagnostics.push({ path, line: position.line + 1, column: position.character + 1,
      code: 'parse-error', message: ts.flattenDiagnosticMessageText(error.messageText, ' ') });
  }
  return facts;
}
