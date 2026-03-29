# AGENTS.md

This file is for coding agents working in the `enshou` repository.

## Scope

- Follow this file for repo-specific behavior.
- No `.cursorrules`, `.cursor/rules/`, or `.github/copilot-instructions.md` files exist here.

## Repository Overview

- Package manager: `pnpm` workspace.
- Language: TypeScript with native ESM output.
- Build tool: `tsdown` in each published package.
- Lint/format/type check: `oxfmt`, `oxlint`, `tsgo`.
- Hooks: `lefthook`.
- Packages:
  - `packages/core`
  - `packages/di`
  - `packages/http`
  - `examples/di`

## Workspace Layout

- Workspace config: `pnpm-workspace.yaml`.
- Shared TS config: `tsconfig.base.json`.
- Root TS include: `packages/*/src/**/*.ts` via `tsconfig.json`.
- `packages/di/tsconfig.json` also includes tests and `vitest.config.ts`.
- Build output goes to `dist/`.
- `dist/`, `node_modules/`, `.env` are gitignored.

## Canonical Commands

### Install

- `pnpm i`

### Build

- Full workspace build: `pnpm build`
- Root `build` expands to: `pnpm run -r build`
- Build one package:
  - `pnpm --filter @enshou/core build`
  - `pnpm --filter @enshou/di build`
  - `pnpm --filter @enshou/http build`

### Lint / Format / Type Check

- Canonical workspace check: `pnpm check`
- Root `check` expands to: `oxfmt && oxlint --fix && tsgo`
- `pnpm check` is mutating because `oxfmt` rewrites files and `oxlint --fix` applies fixes.
- Use it when you want code normalized to repo style, not as a read-only inspection.

### Tests

- There is no root `test` script.
- Only `packages/di` currently has tests.
- Run the full DI suite with: `pnpm --filter @enshou/di test`
- The package test script expands to: `vitest run`

### Single-Test Commands

- Prefer direct Vitest execution through `pnpm exec` for targeted runs.
- Run one file: `pnpm --filter @enshou/di exec vitest run test/token.test.ts`
- Run one test by file and line: `pnpm --filter @enshou/di exec vitest run test/container.test.ts:122`
- Run by test name: `pnpm --filter @enshou/di exec vitest run -t "should be symbol"`
- Avoid `pnpm --filter @enshou/di test -- test/token.test.ts`
- In this repo that expands to `vitest run -- test/token.test.ts` and currently runs the whole suite.

## Hooks

- Pre-commit config lives in `lefthook.yaml`.
- Pre-commit runs:
  - `pnpm check`
  - `pnpm build`
- Expect commits to fail if formatting, linting, type checks, or builds fail.

## Code Style Guidelines

### Formatting

- Use 2-space indentation.
- Use single quotes.
- Omit semicolons.
- Keep trailing commas in multiline literals and argument lists.
- Let `oxfmt` settle final whitespace and wrapping.

### Imports And Exports

- Only named exports for library code.
- Use `export type` for type-only re-exports.
- Use `import type` for type-only imports.
- Mixed value/type imports are acceptable when clear, for example `import { X, type Y } from './mod'`.
- Keep imports minimal and direct.
- Use relative imports inside a package and workspace package imports for cross-package usage.
- Config files may use `export default defineConfig(...)`; runtime/library modules should prefer named exports.

### TypeScript Rules

- Assume `strict: true` is always in force.
- The repo uses `moduleResolution: Bundler` and `verbatimModuleSyntax: true`.
- Write ESM-style imports/exports only.
- Prefer explicit types on exported APIs.
- Keep generics simple and purposeful.
- Prefer `unknown` at boundaries over `any`.
- Use `any` only for narrow type-system escape hatches, such as decorator or constructor plumbing.
- Cast narrowly and as late as possible.

### Naming

- Use `PascalCase` for classes, exported types, and decorators.
- Use `camelCase` for variables, functions, methods, and parameters.
- Use `UPPER_SNAKE_CASE` for tokens and symbolic constants like `INJECTS_KEY`, `CONFIG`, and `LOGGER_TOKEN`.
- Token description strings are lowercase and often kebab-case, for example `'http-client'`.
- Prefer clear domain names over abbreviations.

### API And File Structure

- Keep public package exports in `src/index.ts`.
- Add new public exports explicitly; do not rely on deep imports as the main API.
- Prefer small focused modules.
- Keep helper types close to the module that uses them.
- Follow the existing one-primary-concern-per-file pattern.

### Classes And State

- Prefer constructor injection and explicit dependencies.
- Use `private readonly` constructor properties when fields should not change.
- Keep mutable state contained and minimal.
- Default values should be obvious from signatures, for example `scope: Scope = 'singleton'`.

### Error Handling

- Throw ordinary `Error` instances for invalid internal state unless a domain-specific error is clearly needed.
- Include the failing token or condition in the message when practical.
- Fail fast on missing providers and impossible states.
- Do not swallow errors silently.

### Tests

- Tests currently live under `packages/di/test`.
- Test files match `test/**/*.test.ts`.
- Vitest environment is `node`.
- `packages/di/vitest.config.ts` uses `unplugin-swc` so decorator-based tests compile correctly.
- Prefer direct `it(...)` tests with explicit expectations.
- Keep test names behavioral and sentence-like, following the existing `should ...` style.

### Comments And Docs

- Keep comments sparse.
- Prefer readable code and expressive names over explanatory comments.
- Update README examples when public API behavior changes, especially in `packages/di/README.md`.

## Agent Guidance

- Before editing, decide whether the change belongs in `packages/core`, `packages/di`, `packages/http`, or `examples/di`.
- When changing exported APIs, update `src/index.ts` and any affected README examples.
- When changing DI runtime behavior or decorators, run DI tests directly.
- Expect `pnpm check` and `pnpm build` to be the repo's main quality gates.
