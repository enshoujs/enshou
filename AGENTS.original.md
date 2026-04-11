# AGENTS.md

Always load `caveman` skill.

## Tech Stack & Architecture

- **Framework:** `@enshou/core` provides Hono-based application layer, DI-integrated controllers, and validation middleware.
- **DI (@enshou/di):** Singleton-by-default container using `Symbol` tokens. Supports `transient` scope. Zero-dependency runtime.
- **Decorators:** TC39 Stage 3 (Standard). **Strictly NO legacy `reflect-metadata`.** Use `context.addInitializer`.
- **Validation:** Adapter-based (`@enshou/valibot`, `@enshou/zod`) leveraging Hono's `c.req.valid`.
- **Tooling:** `pnpm` workspaces with `catalogs`. `tsdown` (SWC) for ESM builds. `oxlint`/`oxfmt` for CI/CD.

## Critical Commands

- **Root:** `pnpm build`, `pnpm test`, `pnpm check` (runs `oxfmt && oxlint --fix`).
- **Hooks:** `lefthook` triggers `build`, `check`, and `test` on pre-commit. **Failures block commits.**
- **Examples:** `pnpm -C examples/core dev`, `pnpm -C examples/di dev`.

## Validation Flow

- **Before Committing:** Run `pnpm check && pnpm test`.
- **Development Cycle:** Use the narrowest validation scope possible (e.g., `vitest run test/specific.test.ts`) for speed.
- **Cross-Package Changes:** Always run root `pnpm build` to verify workspace linking and type generation.
- **Integration Check:** Verify behavior through `examples/core` or `examples/di` when modifying framework runtime.

## Engineering Constraints

- **Package Integrity:** `@enshou/di` is the foundation; do not import `@enshou/core` or external framework logic into it.
- **API Surface:** Every package must export its public API via `src/index.ts`. Private logic stays in subdirectories.
- **Metadata Management:** Routing and DI metadata are attached during class definition (decorators) and initialization. Use `getControllerMetadata(this.constructor)` for instance methods.
- **Validation Linking:** Controller methods use `Ctx<InferSchema<typeof Schema>>` to ensure type safety between schema and handler.

## "Gotchas" & Pitfalls

- **Circular Dependencies:** DI throws on cycles. Use `useFactory` to defer resolution if a cycle is unavoidable.
- **Decorator Order:** Metadata collection is sensitive to decorator execution order (bottom-to-top for methods). `@Use` must be placed ABOVE the route decorator (e.g., `@Get`).
- **ESM Only:** The entire project is `type: "module"`. Avoid CJS-specific globals (`__dirname`, etc.).
- **Build Performance:** `tsdown` uses `dts: { oxc: true }` for fast type generation. If declarations are missing, check `tsdown.config.ts`.
