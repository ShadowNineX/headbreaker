# headbreaker — Agent Instructions

TypeScript jigsaw puzzle framework. Two concerns: a **headless domain model** (`Puzzle`, `Piece`) with zero dependencies, and a **web rendering layer** (`Canvas`, `Painter`) backed by Konva.js (optional).

## Build & Test

Uses **Bun** as the package manager — not npm/yarn.

```sh
bun install           # install deps
bun run test          # run tests once
bun run test:watch    # watch mode
bun run typecheck     # tsc --noEmit
bun run lint          # ESLint
bun run lint:fix      # auto-fix ESLint
bun run build         # tsup: CJS + ESM → dist/, IIFE → docs/public/js/
bun run all           # typecheck → test → build (full CI flow)
```

## Architecture

| File | Role |
|------|------|
| [src/puzzle.ts](src/puzzle.ts) | Core headless model — piece collection, connections, validation |
| [src/piece.ts](src/piece.ts) | Individual piece — inserts, connectors, metadata, position |
| [src/canvas.ts](src/canvas.ts) | Visual wrapper around Puzzle + Painter; handles user interaction |
| [src/manufacturer.ts](src/manufacturer.ts) | Factory for building puzzles from configuration |
| [src/painter.ts](src/painter.ts) | Abstract renderer interface |
| [src/konva-painter.ts](src/konva-painter.ts) | Konva.js renderer (optional dep, external in library build, bundled in IIFE) |
| [src/index.ts](src/index.ts) | Public API barrel export |

## Conventions

- **All source files are flat** — no subdirectories under `src/`
- **Test files mirror source**: `src/foo.ts` → `test/foo.test.ts` (Vitest)
- **Naming**: files `kebab-case`, classes `PascalCase`, functions `camelCase`
- **Exports**: barrel uses both named exports and namespace re-exports (e.g., `export * as Vector from './vector'`); types use `export type`
- **ESLint**: flat config via `@antfu/eslint-config` — semi-colons required, single quotes
- **Strict TS**: `strict: true`, `noImplicitAny`, `isolatedModules`

## Build Outputs

tsup produces two builds:
1. **Library** (CJS + ESM) → `dist/` with `.d.ts` declarations; `konva` is external
2. **Browser bundle** (IIFE) → `docs/public/js/headbreaker.js`; konva bundled in

## Releases

- npm publish is triggered **only on `v*` tags** pushed to the repo
- Coverage badge is auto-committed to `badges/` on each push to `main`

## Docs

Documentation site lives in [docs/](docs/) (Astro). Auto-deploys to GitHub Pages on changes to `docs/**` or `src/**` on `main`.
