# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: zero-dependency static HTML, CSS, and JavaScript inside the `KalebCole/hevy` fork, deployed with GitHub Pages. This keeps the marketing surface isolated in `site/` and avoids changing the CLI runtime or its Node dependency graph.

## Users

Primary users are lifters who also work in terminals: developers, automation-minded athletes, and agent builders who want direct access to their Hevy account while scripting or working in a development environment.

## Product purpose

Hevy CLI exposes workout data and write workflows as composable terminal commands. The landing page should let a visitor understand the CLI, see honest examples, install it, and reach the source repository.

## Positioning

Hevy CLI brings Hevy account data into shell pipelines, JSON files, editors, and agent workflows. Unlike a general API reference, it provides a human-readable terminal surface and predictable machine-readable output from the same executable.

## Operating context

Users install with npm, run with npx, or download prebuilt macOS, Linux, and Windows releases. API commands use `HEVY_API_KEY`. Users inspect account data, pipe raw JSON through tools such as `jq` and `grep`, author JSON payloads in files or stdin, edit resources through `$VISUAL` or `$EDITOR`, and validate mutations locally with `--dry-run`.

## Capabilities and constraints

- Inspect identity, routines, routine folders, workouts, workout count/events, exercises/history, and measurements.
- Create and edit routines, workouts, and measurements; create folders and custom exercises.
- `--json` emits API responses to stdout for scripts and agents. Errors use stderr and non-zero exit codes.
- `--dry-run` validates create/edit payload structure locally before mutation. Some edit paths without a file still require a remote GET.
- `hevy --help` and `hevy --version` work without an API key. API commands require `HEVY_API_KEY` from `https://hevy.com/settings?api`.
- Product name is Hevy. Package is `@caarlos0/hevy`; executable is `hevy`.
- Hevy CLI is an open-source community project, not an official Hevy Studios product. Do not counterfeit the proprietary app UI, imply affiliation, copy marketing claims, or expose/fabricate credentials.

## Brand commitments

Use Hevy's strong red accent, clean workout tracking vocabulary, progress data, and athletic energy as inspiration while giving the CLI its own terminal-first identity. Avoid generic SaaS card grids, purple gradients, fake testimonials, fake metrics, and vague productivity claims. Public copy should be direct, specific, and human.

## Evidence on hand

- Upstream README and source in this repository are authoritative for CLI behavior.
- Public API reference: `https://api.hevyapp.com/docs/`.
- Upstream repository and releases: `https://github.com/caarlos0/hevy`.
- Hevy product reference: `https://www.hevyapp.com/`.
- Representative UI data must be clearly illustrative. No user testimonials or CLI adoption statistics are available and none may be invented.

## Product principles

1. Show the workflow, not a paraphrased README.
2. Keep every claim traceable to the README, source, tests, API reference, or release artifacts.
3. Make terminal output useful to both humans and programs.
4. Treat mutation safety and transparent failure behavior as product features.
5. Preserve community-built independence from Hevy Studios.

## Accessibility & inclusion

Responsive web surface with semantic landmarks, visible keyboard focus, sufficient contrast, meaningful labels, no motion-dependent comprehension, and full support for `prefers-reduced-motion`.
