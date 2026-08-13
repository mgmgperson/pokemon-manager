# Pokemon Manager Agent Guide

This file defines how coding agents should work in this repository. Keep it
concise, accurate, and updated when the same mistake or ambiguity recurs.

## Read the relevant context

- Read `.pm/CURRENT.md` before substantial work when it exists.
- Read the active change linked from `.pm/CURRENT.md` when one is identified.
- Read `.pm/CHARTER.md` before making product-scope decisions when it exists.
- Read `.pm/WORLD.md` before changing domain rules, simulation behavior,
  generators, schemas, tournaments, rankings, geography, or world-facing text.
- Do not treat legacy code, placeholder data, or TODO comments as world canon.
- Do not invent missing world rules. Surface the ambiguity and ask for a
  decision when it materially affects the implementation.

## Repository map

- `server/`: Express and TypeScript backend, static reference data, generators,
  battle logic, and world-simulation code.
- `frontend-v2/`: current React, Vite, Material UI, and TanStack Query frontend.
- `frontend/`: legacy Create React App frontend. Do not modify it unless the
  task explicitly targets it.
- `database/`: SQL schemas and sample data. Generated `.sqlite` files are local
  runtime data and are ignored by Git.
- `.pm/`: local product, world, planning, and decision context. It is not part
  of the public repository.

## Commands

Run commands from the package they target.

### Backend (`server/`)

```sh
npm install
npm run dev
npm run build
npm start
```

There is currently no backend lint or automated test command.

### Current frontend (`frontend-v2/`)

```sh
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

There is currently no automated test command for `frontend-v2`.

## Scope and simplicity

- Try to make the smallest coherent change that satisfies the request.
- Prefer straightforward code over clever code or speculative flexibility.
- Do not add abstractions, layers, configuration, dependencies, or extension
  points without a current concrete use. Surface these questions if it happens.
- Do not add placeholder implementations or future-system scaffolding unless
  the task specifically calls for them.
- Reuse an existing type, function, component, or dependency when it is a clean
  fit. Do not force reuse when it makes the code harder to understand.
- Keep unrelated cleanup out of feature and bug-fix changes. If nearby cleanup
  is required to make the requested change safe, keep it local and explain it.
- Preserve existing behavior unless the requested change intentionally alters
  it. Treat broad refactors and dependency consolidation as separate changes.

## TypeScript conventions

- Maintain strict TypeScript. Do not introduce new `any` types; use a concrete
  type or `unknown` with narrowing.
- Give exported functions and public module boundaries explicit types.
- Validate and normalize external input at HTTP, database, and file boundaries.
- Prefer small functions with one clear responsibility and early returns over
  deeply nested control flow.
- Use descriptive domain names. Avoid vague names such as `data`, `item`, or
  `result` when a more specific name is practical.
- Represent a domain concept once within the scope of the change. Check for an
  existing type before creating a duplicate.
- Extract a constant when it gives a domain value a meaningful name or prevents
  repeated literals. Do not create constants for one-off values without benefit.
- Follow the formatting of the file being changed until formatting is
  standardized repository-wide. Do not reformat unrelated lines.

## Comments and documentation

- Prefer self-explanatory code. Comments should explain why, a non-obvious
  constraint, or a domain rule that cannot be expressed clearly in code.
- Keep comments short and adjacent to the code they clarify.
- Do not narrate obvious statements, parameters, loops, or control flow.
- Do not copy full database schemas into source-file comments. Link to or name
  the relevant schema/table and document only the invariant the code relies on.
- Delete or update stale comments when behavior changes.
- Do not leave commented-out code.
- Use TODOs only for concrete, intentionally deferred work. State what remains
  and why; do not add speculative lists of possible future systems.
- Add JSDoc only when an exported API has behavior, constraints, or units that
  its types and name do not make clear.

## Frontend conventions

- Use functional React components and hooks.
- Use TanStack Query for remote server state. Keep transient UI state local.
- Use the existing Material UI and Tailwind setup; do not add another UI or
  styling framework for a local need.
- Keep data fetching separate from presentation when doing so reduces actual
  duplication or complexity.
- Handle loading, error, empty, and populated states when they are relevant to
  the component being changed.
- Do not edit both frontend implementations to keep them synchronized. The
  active target is `frontend-v2` unless explicitly stated otherwise.

## Backend and data conventions

- Keep route handlers thin. Put reusable domain, simulation, generation, and
  persistence behavior in focused modules rather than duplicating it in routes.
- Parameterize SQL values. Never build SQL values directly from untrusted input.
- Use a transaction for related writes when partial completion would leave the
  save inconsistent.
- Do not start an asynchronous database write without awaiting or otherwise
  handling its completion when later behavior depends on that write.
- The backend currently contains multiple database libraries and an incomplete
  persistence transition. Do not introduce another database approach or expand
  the inconsistency incidentally.
- Do not modify a user's `.sqlite` save while developing or validating code.
  Use a disposable database or copy when runtime database checks are necessary.
- There is no established migration runner. Do not invent migration commands or
  claim that migrations were run. For a schema change, identify the affected SQL
  schema, creation/default-data code, queries, and TypeScript types explicitly.
- Keep static reference data distinct from mutable save/world state. Consult
  `.pm/WORLD.md` for the domain-level distinction.

## Verification and handoff

- Run only checks that actually exist and are relevant to the changed package.
- For backend changes, run `npm run build` in `server/`.
- For `frontend-v2` changes, run `npm run lint` and `npm run build`.
- For runtime behavior that cannot be safely exercised, review the changed call
  path and state clearly that it was not executed.
- Do not introduce a test framework solely to make a change appear verified.
- Do not say tests passed when the package has no tests.
- Before handing off, review the diff for unrelated edits, duplicated logic,
  stale comments, unsafe database writes, and accidental behavior changes.
- Report what changed, what commands ran, and what remains unverified.

## Project documents

- `.pm/CHARTER.md` defines what the product fundamentally is and is not.
- `.pm/CURRENT.md` summarizes the present state and points to active work.
- `.pm/ROADMAP.md` contains high-level possible future outcomes.
- `.pm/WORLD.md` contains current world and domain truth.
- `.pm/changes/` contains bounded active work packets.
- `.pm/decisions/` contains lasting cross-cutting decisions, not routine choices.
- `.pm/archive/` contains completed, abandoned, or superseded project documents.

Keep status, roadmap, and world canon out of `AGENTS.md`; link to the appropriate
project document instead. If detailed conventions make this file hard to scan,
move the area-specific guidance into `.pm/steering/` and keep the controlling
rule and link here.