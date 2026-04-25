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
| [src/index.ts](src/index.ts) | Public API barrel export via [src/exports.ts](src/exports.ts) |
| [src/connector.ts](src/connector.ts) | Axis-aligned snap logic — proximity check + insert matching |
| [src/insert.ts](src/insert.ts) | Immutable singletons: `Tab`, `Slot`, `None` — piece edge shapes |
| [src/anchor.ts](src/anchor.ts) | Mutable 2-D position held by each piece |
| [src/validator.ts](src/validator.ts) | `PuzzleValidator` / `PieceValidator` / `NullValidator` |
| [src/spatial-metadata.ts](src/spatial-metadata.ts) | Validators for solved/relative/absolute position checks |
| [src/metadata.ts](src/metadata.ts) | `copy<T>()` — deep-clone metadata via `structuredClone` |
| [src/outline.ts](src/outline.ts) | `Classic`, `Rounded`, `Squared` silhouette strategies |
| [src/shuffler.ts](src/shuffler.ts) | Piece-to-position mapping functions |
| [src/drag-mode.ts](src/drag-mode.ts) | `TryDisconnection`, `ForceDisconnection`, `NoDrag` strategies |
| [src/sequence.ts](src/sequence.ts) | Insert-sequence generators: `flipflop`, `twoAndTwo`, `random`, `fixed` |
| [src/structure.ts](src/structure.ts) | 4-char puzzle structure serialisation (`"TS--"` = right Tab, down Slot) |
| [src/vector.ts](src/vector.ts) | 2-D vector utilities (exported as namespace `Vector`) |

## Conventions

- **All source files are flat** — no subdirectories under `src/`
- **Test files mirror source**: `src/foo.ts` → `test/foo.test.ts` (Vitest)
- **Naming**: files `kebab-case`, classes `PascalCase`, functions `camelCase`
- **Exports**: barrel uses both named exports and namespace re-exports (e.g., `export * as Vector from './vector'`); types use `export type`
- **ESLint**: flat config via `@antfu/eslint-config` — semi-colons required, single quotes
- **Strict TS**: `strict: true`, `noImplicitAny`, `isolatedModules`

## Testing Conventions

- Vitest with `globals: true` — `describe`, `it`, `expect`, `beforeEach` are available **without imports**
- Use `DummyPainter` (no-op renderer) for all `Canvas`-layer tests; never instantiate `KonvaPainter` in tests
- Coverage provider: V8 with `lcov` + `text` reporters

## Gotchas

- **`Piece` structure is not cloned**: The object passed to `new Piece(struct)` is stored by reference. Mutating it after construction changes the piece.
- **`Canvas.draw()` is one-shot**: Calling it a second time throws. Call `canvas.reinitialize()` before redrawing.
- **`Insert` singletons are immutable**: `Tab`, `Slot`, `None` — never reassign piece edges; safe to share across pieces.
- **`Anchor` is mutable**: `translate(dx, dy)` mutates in-place; use `translated(dx, dy)` for a new copy.
- **Proximity is per-axis, not Euclidean**: Two pieces snap when `Math.abs(axis_dist) <= puzzle.proximity` AND inserts match.
- **`Validator` fires on transitions only**: `onValid` triggers only when the state changes from invalid → valid, not on every valid check.
- **`Metadata.copy()`**: Use it when storing user-provided metadata — prevents shared mutation between pieces.

## Build Outputs

tsup produces two builds:
1. **Library** (CJS + ESM) → `dist/` with `.d.ts` declarations; `konva` is external
2. **Browser bundle** (IIFE) → `docs/public/js/headbreaker.js`; konva bundled in

## Releases

- npm publish is triggered **only on `v*` tags** pushed to the repo
- Coverage badge is auto-committed to `badges/` on each push to `main`

## Docs

Documentation site lives in [docs/](docs/) (Astro). Auto-deploys to GitHub Pages on changes to `docs/**` or `src/**` on `main`.
