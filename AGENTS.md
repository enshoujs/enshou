# AGENTS.md

Always load `caveman` skill.

## Tech Stack & Architecture

- **Framework:** `@enshou/core` give Hono app layer, DI controller, validation middleware.
- **DI (@enshou/di):** default singleton container with `Symbol` token. Support `transient`. Zero runtime dep.
- **Decorators:** TC39 Stage 3 only. **NO legacy `reflect-metadata`.** Use `context.addInitializer`.
- **Validation:** adapter style (`@enshou/valibot`, `@enshou/zod`) use Hono `c.req.valid`.
- **Tooling:** `pnpm` workspace with `catalogs`. `tsdown` (SWC) for ESM build. `oxlint`/`oxfmt` for CI/CD.

## Critical Commands

- **Root:** `pnpm build`, `pnpm test`, `pnpm check` (run `oxfmt && oxlint --fix`).
- **Hooks:** `lefthook` run `build`, `check`, `test` on pre-commit. **Fail = block commit.**
- **Examples:** `pnpm -C examples/core dev`, `pnpm -C examples/di dev`.

## Validation Flow

- **Before Committing:** run `pnpm check && pnpm test`.
- **Development Cycle:** use narrowest validation possible for speed (ex `vitest run test/specific.test.ts`).
- **Cross-Package Changes:** always run root `pnpm build` to verify workspace link and type gen.
- **Integration Check:** verify behavior in `examples/core` or `examples/di` when changing framework runtime.

## Engineering Constraints

- **Package Integrity:** `@enshou/di` = foundation; no import `@enshou/core` or outside framework logic into it.
- **API Surface:** each package must export public API from `src/index.ts`. Private logic stay in subdir.
- **Metadata Management:** route + DI metadata attach at class define time (decorator) and init. Use `getControllerMetadata(this.constructor)` for instance method.
- **Validation Linking:** controller method use `Ctx<InferSchema<typeof Schema>>` so schema and handler stay type-safe.

## "Gotchas" & Pitfalls

- **Circular Dependencies:** DI throw on cycle. Use `useFactory` to defer resolve if cycle unavoidable.
- **Decorator Order:** metadata collect sensitive to decorator order (bottom-to-top for method). `@Use` must sit ABOVE route decorator (ex `@Get`).
- **ESM Only:** whole project `type: "module"`. Avoid CJS globals (`__dirname`, etc.).
- **Build Performance:** `tsdown` use `dts: { oxc: true }` for fast type gen. If declaration missing, check `tsdown.config.ts`.
