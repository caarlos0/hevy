# Hevy CLI — Design

## Problem

There is no first-class command-line tool for managing [Hevy](https://hevy.com)
routines. The official mobile/web app is the only way to view and edit them,
which makes it painful to script changes, diff routines in version control, or
let an LLM-driven agent maintain them.

This project builds `hevy`, a small TypeScript/Node CLI that wraps the public
[Hevy API](https://api.hevyapp.com/docs/) so a human (or an agent) can list,
view, create, and edit routines from a terminal.

## Scope

In scope (v1):

- List routines (paginated)
- View a single routine
- Create a new routine (from `--file` or stdin)
- Edit an existing routine (`$EDITOR` round-trip, `--file`, or stdin)
- List exercise templates (with optional search filter)
- `whoami` — sanity-check auth by hitting `/v1/user/info`

Out of scope (v1, because the public API does not expose them):

- Routine folders (list/reorder/move)
- Deleting routines
- Workouts (history, create, count, events)
- OAuth / cookie-based auth against the internal web API

These can be added later if the public API grows them, or behind a separate
opt-in flag if we ever decide to use the internal API.

## Stack

- **TypeScript**, target Node 20+, ESM
- **commander** for CLI parsing (boring, ubiquitous)
- **openapi-typescript** to generate request/response types from the upstream
  OpenAPI document — types stay honest as the API evolves
- Native `fetch` (no `axios` / `node-fetch`)
- **vitest** for tests
- **tsup** to bundle to a single ESM file under `dist/` for the `bin` entry
- **prettier** + **eslint** (flat config) for formatting/linting

Runtime dependencies are intentionally tiny: `commander` plus whatever `tsup`
inlines at build time.

## CLI surface

```
hevy whoami

hevy routines list   [--page N] [--page-size N] [--json]
hevy routines get    <id> [--json]
hevy routines create [--file <path>]            # stdin if no --file
hevy routines edit   <id> [--file <path>]       # $EDITOR if no --file and stdin is a TTY
                                                # stdin if no --file and stdin is piped

hevy exercises list  [--search <term>] [--page N] [--page-size N] [--json]
```

Conventions:

- Default output for `list` / `get` / `whoami` is human-readable (compact
  table or summary).
- `--json` switches to raw JSON, suitable for piping into `jq`.
- `create` / `edit` accept the same JSON shape that the API returns from
  `get` — so `hevy routines get X --json | … | hevy routines edit X --file -`
  is a clean round-trip.
- `edit` without `--file` and with a TTY stdin pre-populates `$EDITOR` (falls
  back to `vi`) with the current routine, applies the edit on save, and
  no-ops if the user quits without changes.

Exit codes:

- `0` success
- `1` API error (non-2xx response)
- `2` network / unexpected runtime error
- `64` usage error (bad flags, missing required arg)

Error messages are written to stderr; structured output (JSON) only ever goes
to stdout so piping stays clean.

## Auth

- Single env var: `HEVY_API_KEY`, sent as the `api-key` header on every
  request (matches the OpenAPI security scheme).
- On startup, if `HEVY_API_KEY` is empty the CLI fails with:
  > `error: HEVY_API_KEY is not set. Get an API key at https://hevy.com/settings?api`
- A 401 response surfaces the same hint.

No config file in v1. Users who want persistence can `export` the var from
their shell rc, which matches the project's fish-first preference.

## Layout

```
src/
  api/
    client.ts          # fetch wrapper, throws HevyError on non-2xx
    errors.ts          # HevyError, UsageError
    types.ts           # generated from OpenAPI (committed, regenerated via npm script)
  commands/
    routines.ts        # list / get / create / edit
    exercises.ts       # list
    whoami.ts
  format/
    routines.ts        # pretty printers
    exercises.ts
  editor.ts            # spawn $EDITOR with a temp file, return edited bytes
  io.ts                # readStdin, writeJson helpers
  cli.ts               # commander wiring
  index.ts             # bin entry: parse argv, dispatch, map errors to exit codes

test/
  api/client.test.ts
  commands/routines.test.ts
  commands/exercises.test.ts
  editor.test.ts
  format/routines.test.ts

scripts/
  gen-types.ts         # run openapi-typescript against the upstream spec

package.json           # "bin": { "hevy": "./dist/index.js" }, "type": "module"
tsconfig.json
tsup.config.ts
vitest.config.ts
eslint.config.js
.github/workflows/ci.yml
README.md
```

## Module responsibilities

- `api/client.ts` — one function `request<T>(method, path, { query, body })`.
  Builds URL, attaches `api-key` header, parses JSON, throws `HevyError` with
  status + parsed body on non-2xx. Knows nothing about commands.
- `api/types.ts` — generated; never edited by hand.
- `commands/*` — pure orchestration: parse already-validated commander
  options, call `api/client`, hand result to `format/*` or `writeJson`.
- `format/*` — take a typed value, return a string. No I/O. Easy to snapshot-test.
- `editor.ts` — write JSON to a temp file under `os.tmpdir()`, spawn
  `process.env.EDITOR ?? 'vi'` inheriting stdio, read it back, return parsed
  JSON or throw on invalid JSON.
- `io.ts` — `readStdin(): Promise<string>` and `writeJson(value): void`
  helpers; isolating these makes tests trivial.
- `cli.ts` / `index.ts` — wire commander, translate thrown errors into the
  exit codes above, print messages to stderr.

This split keeps each file small and independently testable, which matters
both for humans and for agents iterating on this codebase.

## Error handling

- `HevyError` carries `status: number`, `message: string`, `body: unknown`.
- 401 → CLI prints the API-key hint above and exits 1.
- Other non-2xx → CLI prints `error: <status> <api message or status text>`
  and exits 1.
- `fetch` rejection (DNS, TCP) → exits 2 with the underlying message.
- Commander usage errors → exits 64.
- `edit` with invalid JSON in the saved file → exits 1, leaves the temp file
  on disk and prints its path so the user can recover their edits.

## Testing

- Unit tests mock `globalThis.fetch` and assert the outgoing request shape
  (method, URL, headers, body) plus correct parsing of mocked responses.
- `format/*` and `editor.ts` are tested in isolation against fixtures.
- One integration test hits the live API and is skipped unless
  `HEVY_API_KEY` is set in the environment — keeps CI offline by default but
  lets a maintainer run `vitest --run integration` locally.
- Coverage target: 80% lines on `src/`, enforced in CI.

## CI & release

- `.github/workflows/ci.yml`: matrix on Node 20 and 22, runs
  `npm ci && npm run lint && npm test && npm run build`.
- Release: tag `vX.Y.Z`, GitHub Action publishes to npm with provenance
  (`npm publish --provenance --access public`). No GoReleaser here — this is
  a pure JS package.

## Open questions / deferred

- **Routine folders / delete**: revisit if the public API gains them, or add
  an opt-in `--internal` mode that uses `HEVY_ACCESS_TOKEN` against the
  cookie-auth API. Not in v1.
- **Watch / sync mode** (mirror routines into a git repo): nice future
  extension, deliberately deferred.
- **Schema validation on edit**: v1 trusts the API to reject bad payloads.
  If error messages are unhelpful in practice, add `zod` validation derived
  from the generated types.
