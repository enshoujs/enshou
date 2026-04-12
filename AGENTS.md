# AGENTS.md

## Repo Shape

- `pnpm` workspace monorepo. Workspaces live in `packages/*` and `examples/*`; dependency versions come from `pnpm-workspace.yaml` catalogs.
- Main packages:
  - `@enshou/di`: standalone DI container. Default scope is singleton; `transient` exists. Must stay framework-agnostic.
  - `@enshou/core`: Hono-based app layer with DI-driven controllers, decorators, validation wiring, and a thin root API. Prefer subpaths for specific contracts: `@enshou/core/decorators`, `/http`, `/middleware`, `/validation`.
  - `@enshou/valibot`, `@enshou/zod`: validation adapters for `@enshou/core`.
- Examples under `examples/*` are integration smoke apps, not just demos.

## Build, Test, Check

- Root commands:
  - `pnpm build` -> recursive package builds
  - `pnpm test` -> recursive package tests
  - `pnpm check` -> `oxfmt && oxlint --fix`
  - `pnpm prepare` -> installs git hooks via `lefthook`
- Package-local commands:
  - `pnpm -C packages/core test`
  - `pnpm -C packages/di test`
  - `pnpm -C packages/<name> build`
- Example dev servers:
  - `pnpm -C examples/core dev`
  - `pnpm -C examples/di dev`

## Validation Workflow

- Preferred manual gate before handoff: `pnpm check && pnpm test && pnpm build`.
- Pre-commit hook runs `pnpm build`, `pnpm check`, `pnpm test`; failures block commits, and `check` may rewrite/stage files.
- For narrow changes, run the smallest relevant validation first:
  - single package: `pnpm -C packages/<name> test` or `pnpm -C packages/<name> build`
  - focused Vitest file: `vitest run test/path/to/file.test.ts`
- Any change to public exports, workspace links, or package boundaries requires root `pnpm build` before task is complete.
- Any change to runtime behavior in `@enshou/core` should also be exercised through `examples/core` or `examples/di`.

## Code Style and Tooling

- ESM-only repo (`"type": "module"`). Avoid CommonJS globals and patterns.
- TypeScript uses `moduleResolution: "Bundler"` and `allowImportingTsExtensions: true`.
- Tests run in Vitest with SWC and Stage 3 decorators (`decoratorVersion: '2022-03'`). Do not introduce legacy decorator patterns or `reflect-metadata`.
- Formatting/linting is via `oxfmt` + `oxlint --fix`, not ESLint/Prettier.

## Architecture Constraints

- `@enshou/di` is foundation layer. Do not import `@enshou/core` or framework/runtime concerns into it.
- In `@enshou/core`, keep public API in explicit barrels and hide implementation in internal modules; avoid leaking metadata/build helpers.
- Controller validation is adapter-based; handler typing should stay linked to schema typing (`c.req.valid(...)` flow).
- Package exports are deliberate API boundaries. If a type/function is meant for consumers, export it from `src/index.ts` or an intentional subpath barrel.

## Testing Protocol

- Prefer focused tests during iteration, then end with root validation gate.
- `@enshou/core` and `@enshou/di` have package test suites; `@enshou/valibot` and `@enshou/zod` are mainly validated by build/type integration, so run their package builds when touching adapter types.
- When decorators, metadata, or DI resolution change, run both package tests and an example app smoke check.

## Git Conventions

- Commit history mostly follows Conventional Commits; prefer `feat:`, `fix:`, `refactor:`, `chore:` with optional scope like `fix(core): ...`.
- Keep commit subjects short and imperative.
- No enforced branch naming config found; prefer topic branches matching commit scope, e.g. `feat/core-subpaths`, `fix/di-cycle`.

## Environment and Setup

- No required environment variables for local build/test found in repo.
- First setup step is `pnpm install`; this also enables hooks through `prepare`/`lefthook`.
- Examples use Bun for local dev scripts; package builds/tests use `pnpm`, `tsdown`, and `vitest`.

## Gotchas

- Decorator order matters: method decorators are order-sensitive; `@Use` must be placed above route decorators like `@Get`.
- Metadata is attached through Stage 3 decorator initializers; use initializer-safe patterns such as `getControllerMetadata(this.constructor)` where needed.
- DI circular dependencies throw. Break cycles with deferred factories instead of cross-import hacks.
- `pnpm check` mutates files. Re-read diffs after running it.
- `tsdown` base config assumes ESM library output with declaration generation (`dts: { oxc: true }`); if subpath exports change, update package `tsdown.config.ts` entry lists too.
