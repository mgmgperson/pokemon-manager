# Read-only capability MCP

The standalone stdio server exposes the same catalog queries as the local CLI.
It does not start Express, listen on a port, import application modules or select
a save. Client registration is optional and has **not** been performed.

## Interface

| Tool | Input | Result |
| --- | --- | --- |
| `capability_search` | `query`, optional `domain`, `lifecycle`, `evidence`, `freshness`, `kind`, `limit`, `cursor` | Ranked reviewed/discovered entries, source references, match reasons, total and next cursor |
| `capability_get` | Exact `id`, optional `limit`, `cursor` | One entry, paginated contracts/settings/effects/evidence and source references, or `found: false` |
| `capability_status` | Empty object | Presence, validity, working-tree drift, navigation freshness, counts and coverage limits |

Every response includes the shared status information: at the root for status,
under `status` for search/get. Each request reloads validated artifacts and hashes
freshly discovered eligible source; it never runs the extractors. Existing dirty,
untracked and legacy source follows the same exclusion policy as the CLI.

Search queries are 1–300 characters. Filters use the CLI's allowlisted values;
domains are lowercase letters/digits/hyphens, up to 60 characters. Search limits
default to 6, maximum 20; get detail limits default to 20, maximum 50. IDs are
bounded lookup keys (maximum 8,192 characters). Additional input fields are
rejected. Cursors are opaque, at most 512 characters; repeat the same query/ID
with `nextCursor` to continue. Source or artifact drift expires old cursors.

Successful tool results provide identical compact JSON in text and
`structuredContent`. The serialized payload is capped at 128 KiB; a larger
response produces a tool error asking for a smaller limit or narrower search.
Invalid inputs, expired cursors and query failures produce `isError: true`.
Missing/invalid catalogs are explicit status states with no search results.
Stale descriptions remain visible with their evidence/freshness labels, and
incomplete extraction remains visible even when the catalog is current. Zero
matches do not establish that a feature is absent.

There are no refresh, write, generator, application API, command execution,
arbitrary path/URL or source excerpt tools. The root is fixed by the executable;
callers cannot redirect it. All three tools advertise read-only, idempotent,
non-destructive and closed-world annotations. These describe the implementation;
the process still runs with the launching user's filesystem permissions.

## Launch and optional client registration

Requires Node.js 20 or newer and installed `server/` dependencies, including the
existing `ts-node` development dependency. Runtime dependencies are pinned to
`@modelcontextprotocol/server` 2.3.1 and Zod 4.6.7; the matching SDK client 2.3.1
is a development dependency used only for verification.

Replace `/ABS/Project-Pokemon` in these examples with the absolute checkout path.
Use this command directly in a stdio client, without an npm wrapper or a shell
that writes startup banners to stdout:

```sh
node /ABS/Project-Pokemon/server/node_modules/ts-node/dist/bin.js \
  --transpile-only \
  --project /ABS/Project-Pokemon/server/tsconfig.json \
  /ABS/Project-Pokemon/server/src/bin/capabilities-mcp.ts
```

This source-mode launch matches the extractor fingerprint used by the documented
CLI refresh. Compiled-JS tooling has a different extractor fingerprint; do not
mix it with a source-mode snapshot. The entry point accepts no arguments and
finds the checkout from its own location, regardless of the client's working
directory. Stdout is reserved for MCP protocol messages; diagnostics use stderr.
Waiting for stdin when launched manually is normal. No API key is required.

For a client using an `mcpServers` JSON configuration, the optional entry is:

```json
{
  "mcpServers": {
    "pokemon-capabilities": {
      "command": "node",
      "args": [
        "/ABS/Project-Pokemon/server/node_modules/ts-node/dist/bin.js",
        "--transpile-only",
        "--project", "/ABS/Project-Pokemon/server/tsconfig.json",
        "/ABS/Project-Pokemon/server/src/bin/capabilities-mcp.ts"
      ]
    }
  }
}
```

For Codex, the equivalent optional TOML entry is:

```toml
[mcp_servers.pokemon_capabilities]
command = "node"
args = [
  "/ABS/Project-Pokemon/server/node_modules/ts-node/dist/bin.js",
  "--transpile-only",
  "--project", "/ABS/Project-Pokemon/server/tsconfig.json",
  "/ABS/Project-Pokemon/server/src/bin/capabilities-mcp.ts"
]
enabled_tools = ["capability_search", "capability_get", "capability_status"]
startup_timeout_sec = 20
tool_timeout_sec = 60
```

These are documentation examples, not installed configuration. Registration in
the author's real client is a separate choice. After optional registration,
inspect the client's tool list (Codex: `codex mcp list` or `/mcp`) and call
`capability_status`, then search for `generatePokemonTeam`. Actual Codex/UI
registration has not been exercised; the SDK client verification below uses
the exact launch command from an unrelated working directory.

## Maintenance and verification

When status is stale/missing, maintain the catalog through the existing local
workflow, outside MCP. From `server/`:

```sh
npx ts-node src/bin/catalog-capabilities.ts refresh
npx ts-node src/bin/catalog-capabilities.ts check
npx ts-node src/tooling/capabilities/verify-mcp.ts
npm run build
```

Refresh does not renew review evidence. Follow the
[agent upkeep workflow](README.md#agent-reuse-workflow) for changed explanations.
No registration, app server or runtime save is needed for these commands.

The standalone check uses the official SDK client and a child stdio process over
disposable source fixtures. It compares status/search/get with shared local
queries; exercises pagination, source drift, incomplete extraction, expired
cursors, malformed/missing artifacts, input bounds and unknown operations; and
checks that requests leave artifacts unchanged. Its guarded server process
rejects writes, database/environment reads, app/database imports, subprocesses
and network operations. An additional client starts the exact production entry
point against repository source/catalog only. No application feature is executed.

SDK guidance: [tool registration and structured results](https://ts.sdk.modelcontextprotocol.io/v2/servers/tools.html),
[stdio lifecycle](https://ts.sdk.modelcontextprotocol.io/v2/serving/stdio.html).
Codex configuration: [official MCP guide](https://developers.openai.com/codex/mcp/).
