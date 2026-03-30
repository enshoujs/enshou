# AGENTS.md

This file is for coding agents working in the `enshou` repository.

## Scope
- Follow this file for repo-specific behavior.
- No `.cursorrules`, `.cursor/rules/`, or `.github/copilot-instructions.md` files exist in this repository today.
- If those rule files are added later, merge their guidance with this file rather than ignoring them.

## Repository Snapshot
- Package manager: `pnpm` workspace.
- Language: TypeScript with native ESM-style imports and exports.
- Formatter and linter: `oxfmt` and `oxlint`.
- Tests: Vitest in `packages/di`.
- Git hooks: `lefthook`.
- Published packages: `@enshou/core`, `@enshou/di`.
- Internal workspace package: `@enshou/shared`.
- Example apps: `examples/core`, `examples/di`.
- Published packages build from `src/index.ts` into `dist/` with `tsdown`.
- `@enshou/shared` is private and bundled into published builds.

## Workspace Layout
- Workspace config: `pnpm-workspace.yaml` includes `packages/*` and `examples/*`.
- Root TS config: `tsconfig.json` includes only `packages/*/src/**/*.ts`.
- Shared compiler settings live in `tsconfig.base.json`.
- `packages/di/tsconfig.json` additionally includes `test` and `vitest.config.ts`.
- `packages/core/tsconfig.json` includes only `src`.
- Build output goes to `dist/`.
- `node_modules`, `dist`, and `.env` are gitignored.
- Public library entrypoints live in `packages/*/src/index.ts`.

## Canonical Commands
### Install
- Install workspace dependencies with `pnpm i`.
### Build
- Build the workspace with `pnpm build`.
- Root `build` expands to `pnpm run -r build`.
- Build only `@enshou/core` with `pnpm --filter @enshou/core build`.
- Build only `@enshou/di` with `pnpm --filter @enshou/di build`.
- `packages/shared` has no build script.
- `examples/*` have no build scripts.
- `tsdown` config lives in `packages/core/tsdown.config.ts` and `packages/di/tsdown.config.ts`.
- Builds are ESM-only and emit `.js` and `.d.ts` files.
### Lint And Format
- Canonical repo check: `pnpm check`.
- Root `check` expands to `oxfmt && oxlint --fix`.
- `pnpm check` is mutating because it rewrites formatting and applies lint fixes.
- There is no separate root `typecheck` script at the moment.
- `.oxlintrc.json` enables `eslint`, `oxc`, `typescript`, `unicorn`, and `vitest` plugins.
- `oxlint` is configured with `typeAware: true` and `typeCheck: true`.
### Tests
- There is no root `test` script.
- Only `packages/di` currently has tests.
- Run the full DI suite with `pnpm --filter @enshou/di test`.
- The DI package test script expands to `vitest run`.
- Vitest runs in the `node` environment.
### Single Test Commands
- Prefer direct Vitest execution through `pnpm exec` for targeted runs.
- Run one file: `pnpm --filter @enshou/di exec vitest run test/token.test.ts`.
- Run one file and line: `pnpm --filter @enshou/di exec vitest run test/container.test.ts:123`.
- Run by test name: `pnpm --filter @enshou/di exec vitest run -t "should be symbol"`.
- Avoid `pnpm --filter @enshou/di test -- test/token.test.ts`.
- In this repo, that form expands to `vitest run -- test/token.test.ts` and still runs the full suite.
### Example Apps
- Run the DI example with `pnpm --filter example-di dev`.
- Run the core example with `pnpm --filter example-core dev`.
- Example scripts currently use `bun` under the hood.

## Hooks
- Pre-commit config lives in `lefthook.yaml`.
- Pre-commit runs `pnpm check`.
- Pre-commit also runs `pnpm build`.
- Expect commits to fail if formatting, lint fixes, or builds are still outstanding.

## Code Style Guidelines
### Formatting
- Use 2-space indentation.
- Use single quotes.
- Omit semicolons.
- Keep trailing commas in multiline literals and argument lists.
- Prefer straightforward control flow and early returns over deeply nested branches.
- Let `oxfmt` settle final wrapping and whitespace.
### Imports And Exports
- Use ESM syntax only.
- Use `import type` for type-only imports.
- Use `export type` for type-only re-exports.
- Keep imports minimal and direct.
- Prefer relative imports inside a package.
- Prefer workspace package imports for cross-package usage, such as `@enshou/di` and `@enshou/shared`.
- Library code uses named exports.
- Default exports are currently limited to config files and example entrypoints.
- When adding a public API, update the package `src/index.ts` explicitly.
### TypeScript
- Assume `strict: true` is always in force.
- The repo uses `moduleResolution: Bundler`.
- The repo also uses `verbatimModuleSyntax: true`.
- Prefer explicit types on exported APIs.
- Prefer simple purposeful generics like `Token<T>` and `Class<T>`.
- Prefer `unknown` at boundaries over `any`.
- Existing `any` usage is mostly narrow decorator or runtime plumbing.
- Keep new `any` usage tightly scoped and justified.
- Cast late and narrowly.
- Decorator code follows the current decorators proposal APIs such as `ClassDecoratorContext` and `addInitializer`.
### Naming
- Use `PascalCase` for classes, decorators, interfaces, and exported types.
- Use `camelCase` for functions, methods, variables, and parameters.
- Use `UPPER_SNAKE_CASE` for tokens and metadata symbols.
- Examples include `CONFIG`, `LOGGER_TOKEN`, `HTTP_CLIENT_TOKEN`, `INJECTS_KEY`, `PREFIX_KEY`, and `ROUTE_KEY`.
- Token description strings are lowercase and often kebab-case, such as `'config'`, `'http-client'`, and `'user-service'`.
- Prefer clear domain names over abbreviations.
### API And File Structure
- Keep modules small and focused on one primary concern.
- Keep helper types close to the module that uses them.
- Avoid deep-import-only APIs as the main public surface.
- Use `packages/shared` for tiny shared runtime utilities and types.
- Keep public package exports centralized in `src/index.ts`.
- If a public API changes, update README examples in the affected package.
### Classes And State
- Prefer constructor injection for DI-managed classes.
- Declare dependencies explicitly with `@Inject([...])` when runtime resolution is needed.
- Use `private readonly` constructor properties when dependencies should not change.
- Keep mutable state minimal and contained.
- Put default values in the function signature when they are part of the API, for example `scope: Scope = 'singleton'`.
### Error Handling
- Throw ordinary `Error` instances unless a domain-specific error is clearly needed.
- Include the failing token or condition in the message when practical.
- Fail fast on missing providers and impossible states.
- Do not silently swallow errors.
### Tests
- DI tests live under `packages/di/test`.
- Test files match `test/**/*.test.ts`.
- Test names follow the `it('should ...')` style.
- Prefer explicit expectations over broad snapshots.
- `packages/di/vitest.config.ts` uses `unplugin-swc` so decorator-based tests compile correctly.
- If you change DI resolution, token behavior, or decorators, run targeted DI tests.
### Docs And Examples
- Keep comments sparse and useful.
- Prefer readable code and expressive names over explanatory comments.
- Keep README snippets aligned with the exported public API.
- Keep examples simple and representative rather than introducing a second architecture layer.
- `examples/core/src/index.ts` and `examples/di/src/index.ts` are good references for intended usage.

## Agent Guidance
- Before editing, decide whether the change belongs in `packages/core`, `packages/di`, `packages/shared`, or `examples/*`.
- Changes to runtime exports should usually update `src/index.ts` and the package README together.
- Changes to DI behavior should be followed by targeted Vitest runs in `packages/di`.
- Because `pnpm check` is mutating, use it when you are ready for formatting and lint autofixes, not as passive inspection.
