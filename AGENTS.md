# AGENTS.md

## Project Purpose and Stack

- `enshou` is a `pnpm` workspace for the TypeScript packages that make up the Enshou framework
- `@enshou/core` provides the application layer: `Application`, controller/route decorators, Hono context helpers, and validation middleware
- `@enshou/di` provides the DI container, `@Inject`, and token helpers.
- `@enshou/valibot` and `@enshou/zod` provide `ValidatorAdapter` implementations.
- Build tooling uses `tsdown` with shared defaults in `tsdown.base.ts`.
- Formatting/linting use `oxfmt` and `oxlint`; tests use `vitest`.
- Decorators use the current proposal API, NOT legacy decorator metadata.

## Commands That Work Here

- Root: `pnpm build`, `pnpm test`, `pnpm check`
- `examples/core`: `pnpm dev`
- `examples/di`: `pnpm dev`

## Repo Structure

- `packages/core/src/*` is the main editing area for framework runtime behavior.
- `packages/di/src/*` is the standalone DI package.
- `examples/core` is the main framework example.
- `examples/di` is the DI example.

## Conventions and Boundaries

- Add public exports through each package's `src/index.ts`.
- Preserve the current decorator model; do not switch to legacy decorator metadata.
- Keep package boundaries intact; do not move DI concerns into framework adapters or examples.
- Do not replace existing metadata attachment patterns unless the whole package is being updated consistently.

## Validation Policy

- Use the narrowest validation that matches the change scope while editing.
- Run repo-root `pnpm check`, `pnpm test`, and `pnpm build` when changes affect public exports, shared config, package wiring, or cross-package behavior.
- Re-run the relevant example app when changing example code or behavior exercised through examples.
