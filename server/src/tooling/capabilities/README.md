# Repository capability discovery (change 011, Stages 1–4)

From `server/`:

```sh
npx ts-node src/bin/inventory-capabilities.ts
npx ts-node src/tooling/capabilities/verify.ts
npx ts-node src/tooling/capabilities/verify-catalog.ts
npx ts-node src/tooling/capabilities/verify-navigation.ts
npx ts-node src/tooling/capabilities/verify-mcp.ts
npm run build
```

The first command scans the working tree and atomically replaces the single
local artifact `.pm/capabilities/inventory.json`. It takes no arguments, imports
only inventory tooling, and needs no app server or save. Python 3 with the
standard-library `ast` module is required for Python declaration discovery; a
missing parser is reported as failed extraction, never as an empty successful
scan. Stages 1–3 added no dependencies. Stage 4 adds the pinned MCP server/Zod
dependencies and a development-only SDK client; see the [MCP guide](MCP.md).
Verification uses disposable source fixtures and never invokes discovered
application code.

The JSON is generated evidence for later catalog mapping, not a document to load
wholesale into an agent prompt. It contains files, declarations, access points,
import/export/direct-call links, fingerprints, and coverage diagnostics. Repeated
identical call links retain the first location and an occurrence count, keeping
large reference-data initializers out of the index. Source snippets/signatures
are bounded; full declarations remain at their file/line references. Neither
static registration nor a fresh hash proves that an application feature works.

Discovery walks all directories, including ignored/untracked legacy source,
without following symlinks. Directory exclusions and skipped formats are
enumerated in `coverage`; excluded directory counts describe encountered roots,
not files recursively counted inside them. Saves, sidecars, environment and
credential files, build/dependency/cache trees and downloaded world-data lists
are excluded before content reads. Static SQL under `database/saves/` is source
and is included. Unknown extensions are counted as unrecognized exclusions;
recognized formats without a symbol extractor have file-only diagnostics.

`coverage.complete` is deliberately false if extraction has parse errors,
unsupported/file-only formats, uncertain C++ declarations, dynamic wiring or
identity collisions. Inspect `coverage.diagnostics` and each file's `extraction`
field to distinguish those cases. Successful CLI exit means an internally
generated artifact was written, not that every construct was understood. A
fatal read/serialization/write error leaves the previous artifact in place.

IDs combine source path, kind and lexical qualified name, independently of line
numbers. Repeated declarations/overloads/registrations retain distinct IDs with
occurrence suffixes and diagnostics; direct links use the first declaration and
need source inspection when overloads exist. Fingerprints are SHA-256 over actual
working-tree content. Extractor fingerprints include the parser version,
extractor implementation and coverage policy; running compiled JS instead of
the documented TS command changes that implementation fingerprint.

HTTP paths compose static Express apps, imported/default-exported routers and
nested mounts. Middleware registrations remain separate. Local paths with no
known app mount retain `unmounted` status. JSX page paths compose nested/pathless
routes independently of navigation; simple literal menu arrays are supported.
Runtime expressions remain unresolved, with references to inspect. TypeScript
is parsed without a Program, so discovery never loads application dependencies.
See `coverage.limitations` for exact parser boundaries, including lexical C++
and SQL name-only extraction. This is source discovery, not a complete call graph.

## Local catalog commands

Run from `server/`:

```sh
npx ts-node src/bin/catalog-capabilities.ts refresh
npx ts-node src/bin/catalog-capabilities.ts check
npx ts-node src/bin/catalog-capabilities.ts status
npx ts-node src/bin/catalog-capabilities.ts search "specialSlots"
npx ts-node src/bin/catalog-capabilities.ts search "hidden helper" --lifecycle legacy --limit 3
npx ts-node src/bin/catalog-capabilities.ts get capability:pokemon.team-generation
```

`refresh` validates existing explanation files, regenerates the inventory and
short `.pm/capabilities/index.md`, and prepares both before replacing either.
Each replacement is atomic; reported write failures restore previous artifacts.
Process interruption or concurrent source/record changes remain detectable by
`check`. It **never rewrites
explanations or updates their review stamps**. It can repair malformed generated
inventory, but malformed explanations stop refresh before any generated write.
The older inventory-only CLI remains available but does not update navigation;
use catalog refresh for the complete generated snapshot.

`check`, `status`, `search` and `get` read artifacts and freshly discovered eligible
source only. They compare actual working-tree hashes, including dirty/untracked
files, additions/removals and changes in unsupported-format/symlink coverage.
They never parse/import application modules,
spawn a parser or command, open databases or mutate artifacts. Source parsing
(including the isolated Python AST subprocess) happens only during refresh.

`check` exits nonzero for missing, malformed or stale catalogs. Known incomplete
extraction is reported separately and does not alone fail a current snapshot.
`status.navigation` distinguishes current, stale and missing navigation; a
missing/outdated index also fails check. Index rows retain the snapshot's
evidence/freshness labels, so this page must be checked before relying on it.
`refresh` succeeds when it writes generated facts, even if explanations still
need review; run `check` for the combined state. Search/get return explicit
missing/invalid status with no results, and a nonzero CLI exit for those states.
Stale results remain available, visibly tagged. None of these evidence states
certifies that a discovered application feature works.

Search accepts `--domain`, `--lifecycle` (current/legacy/parked/unknown),
`--evidence` (discovered/source-inspected/runtime-exercised), `--freshness`
(current/stale/unknown), and `--kind` (capability/symbol/access-point/file).
Queries are 1–300 characters; result limit defaults to 6, maximum 20. Get uses
an exact catalog ID, with detail limit 20 by default, maximum 50. Both support
`--cursor` and return `nextCursor`, totals and explicit truncation. Cursors
expire when the query, artifacts or working-tree snapshot change. Get details
are paginated by kind (settings, effects, source, dependency, etc.); long values
are bounded and flagged. IDs are looked up, never interpreted as filesystem
paths. There is no arbitrary source-file fetch/excerpt operation.

Reviewed records rank alongside the full discovered inventory. Physical entry
points/contracts and directly associated HTTP wrappers are grouped into their
reviewed capability in search; their original IDs remain individually fetchable.
Unreviewed helpers, contracts, pages, commands and files stay searchable as
`discovered`, including legacy entries. Zero results always include the coverage
and freshness caveat. This fallback is intentional; it avoids requiring an
invented explanation for every source declaration.

## Explanation records and review evidence

Agent-owned JSON files in `.pm/capabilities/records/<domain>.json` contain
`{ "version": 1, "records": [...] }`. Each record has a stable capability ID,
purpose/domain/search terms, reusable entry point and contract IDs, settings,
prerequisites, effects, limitations, related IDs, lifecycle/reason and evidence.
Source-inspected records describe only what was actually inspected. The current
set covers representative workflows across the repository; the rest remains
discovery-only. No runtime claims were copied from old project notes.

`inspectedSources` records the fingerprints of source supporting those claims.
`dependencies` captures the transitive resolved local import/call dependencies of
implementation/contract entry points. HTTP/page dependencies begin at their
resolved handler/component, avoiding unrelated imports of an entire app root.
Owning package manifests are dependencies too, so package declaration changes
invalidate affected evidence without reading installed dependency trees.
Registration files can separately be inspected evidence. Dependency tracking is
limited to the extractor's static links; external libraries, runtime/dynamic
imports and C++/Python dependencies outside those links require explicit evidence
paths and remain subject to the documented coverage limits. Reference payloads
are represented only by file hashes.

Source edits, removed/ineligible files, missing inventory/related references,
unrecorded dependencies and extractor changes mark affected explanations stale.
Unrelated source edits mark inventory drift without automatically invalidating
unaffected explanations. Evidence level records the original kind of inspection;
it is **not renewed** by a current extraction or refresh. A runtime-exercised
record requires a verification reference and its scope. Existing prose and
fingerprints remain intact while stale.

When an agent reviews an affected capability, inspect the actual changed source
and dependencies, update its explanation, then use the pure
`stampReviewedCapability(inventory, record, inspectedPaths)` helper to capture
the new explicit review. Preserve other records in that domain file. The helper
does not inspect code, write records or grant evidence: invoking it is a deliberate
agent review action, never part of refresh. Run refresh/check after the edit.
The author is not expected to hand-maintain these files.

## Agent reuse workflow

The agent owns discovery and upkeep. The author does not maintain the index or
records by hand. Start with the small generated
[navigation page](../../../../.pm/capabilities/index.md), not the complete JSON
inventory. It lists a bounded selection of workflows and primary source links;
search/get covers the rest, including legacy and unreviewed helpers.

1. Read project context as required by `AGENTS.md`, then run catalog `check`.
   For missing/stale generated facts, run `refresh` and check again. Invalid
   explanations require inspecting/repairing the affected records before refresh
   can proceed. Refresh never clears stale source-review evidence by itself.
2. Search the task, setting and relevant API/page/command names. Fetch promising
   IDs using bounded get pages. Treat a zero result as a coverage/freshness limit,
   then search source directly; it is not proof that a feature is absent.
3. Read the actual referenced implementation, contracts, wrappers and call sites.
   Distinguish reusable underlying functions from narrower APIs. State what is
   reused, what needs extending and the specific gap; retain uncertainty and
   relevant parked/legacy status. Domain decisions still belong to project/world
   context and the author.
4. After authorized code changes, refresh facts. Inspect changed source and
   dependencies, update only affected explanations (or add a source-backed
   workflow entry), and explicitly stamp that review with the existing helper.
   Keep unchanged records and stale explanations intact; do not mass-renew
   fingerprints or turn discovery into runtime evidence.
5. Refresh again to update navigation after record edits, then run `check` and
   the checks required by the changed package. Report remaining coverage limits
   or stale evidence and any behavior that was not exercised.

### Example preflight: exposing roster slots in the randomizer preview

This is a source-inspection demonstration, not approval to implement a new API.
From `server/`:

```sh
npx ts-node src/bin/catalog-capabilities.ts search specialSlots --limit 3
npx ts-node src/bin/catalog-capabilities.ts get capability:pokemon.team-generation
npx ts-node src/bin/catalog-capabilities.ts get capability:randomizer.previews
```

- **Reuse:** `generatePokemonTeam` and `PokemonTeamGenerationOptions` in
  [pokemonGenerator.ts](../../generators/pokemonGenerator.ts) already support
  team size, excluded/unique species, strict generation/default-form preferences
  and explicit special slots. Regional population already translates reviewed
  per-trainer exceptional ownership into the generator's settings.
- **Extend:** if exposing these settings through the randomizer preview were
  approved, inspect its request boundary in
  [randomizer.controller.ts](../../modules/world-generation/randomizer/randomizer.controller.ts)
  and `PokemonTeamOptions`/`previewPokemonTeam` in
  [randomizer.service.ts](../../modules/world-generation/randomizer/randomizer.service.ts).
  That service currently forwards overall rating, types, generations and fields.
- **Gap:** this wrapper does not validate/forward the fifth per-call options
  argument. That is a scoped HTTP-boundary gap; another Pokemon selection engine
  is not needed. The exact HTTP contract would still need design/approval. Check
  current source before acting on this snapshot example.

The [read-only MCP interface and optional client setup](MCP.md) reuse these query
functions. Client configuration has not been installed or registered.
