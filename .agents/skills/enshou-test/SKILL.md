---
name: enshou-test
description: Principles and patterns for writing tests in the enshou project. Use when creating new tests or refactoring existing ones to ensure consistency with established standards based on @packages/di/test/**.
---

# Testing Principles

Follow these principles when writing tests to maintain consistency with the DI package style.

## 1. Flat Structure

Avoid top-level `describe` blocks when the file represents a single unit or class. Place `it` blocks directly at the top level. Use `describe` only when grouping multiple logically distinct sets of tests within one file.

## 2. Naming Convention

Test descriptions must start with "should".

- ✅ `it('should return same value for value provider', ...)`
- ❌ `it('returns a Hono instance', ...)`

## 3. Use `it`

Always use `it` from `vitest` for test cases. Avoid using `test`.

## 4. Isolation and Setup

Use `beforeEach` at the top level for shared setup and state reset. This ensures each test starts with a clean slate.

```typescript
let container: Container

beforeEach(() => {
  container = new Container()
})
```

## 5. Focused Tests

Each `it` block should focus on testing one specific behavior. If you need multiple assertions, ensure they are related to the same specific outcome.

## 6. Imports

Import Vitest utilities explicitly.

```typescript
import { beforeEach, expect, it, vi, describe } from 'vitest'
```

# Example (DI Pattern)

```typescript
import { beforeEach, expect, it } from 'vitest'
import { Container, createToken } from '../src'

let container: Container

beforeEach(() => {
  container = new Container()
})

it('should be singleton', () => {
  const TOKEN = createToken<Class>('token')
  class Class {}

  container.registerClass(TOKEN, Class)

  expect(container.resolve(TOKEN)).toBe(container.resolve(TOKEN))
})
```
