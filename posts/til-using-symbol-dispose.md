---
title: 'TIL: `using` — TypeScript Built-in Resource Cleanup'
date: '2026-11-12'
image: cover.jpg
excerpt: TypeScript 5.2 added the `using` declaration — a finally block that writes itself.
isFeatured: false
belt: green
---

TypeScript 5.2 shipped an implementation of the [TC39 Explicit Resource Management proposal](https://github.com/tc39/proposal-explicit-resource-management) (now Stage 4). The key addition is `using`: a declaration that automatically calls a cleanup method when the enclosing block exits — even on throw.

## The Problem

Cleanup code is easy to forget or nest awkwardly:

```ts
const conn = await db.connect();
try {
  const rows = await conn.query('SELECT * FROM users');
  // ... work ...
} finally {
  conn.release(); // must remember this every time
}
```

## How `using` Works

An object is *disposable* when it has a `[Symbol.dispose]()` method. Declare it with `using` and TypeScript emits a `try/finally` automatically:

```ts
class DbConnection implements Disposable {
  [Symbol.dispose]() {
    this.release();
  }
}

function fetchUsers() {
  using conn = new DbConnection();
  return conn.query('SELECT * FROM users');
} // conn[Symbol.dispose]() runs here, even if query throws
```

For async teardown use `await using` with `Symbol.asyncDispose`:

```ts
class DbConnection implements AsyncDisposable {
  async [Symbol.asyncDispose]() {
    await this.close();
  }
}

async function fetchUsers() {
  await using conn = await db.connect();
  return conn.query('SELECT * FROM users');
} // conn[Symbol.asyncDispose]() is awaited on exit
```

## Composing Resources with DisposableStack

When you open several resources, `DisposableStack` registers them and disposes in reverse order:

```ts
function processData() {
  using stack = new DisposableStack();
  const file = stack.use(openFile('data.csv'));
  const conn = stack.use(openDbConnection());
  // ... work ...
} // conn disposed first, then file
```

`AsyncDisposableStack` works the same way for async disposables.

## tsconfig Setup

Add `esnext.disposable` (or just `esnext`) to `lib`:

```json
{
  "compilerOptions": {
    "lib": ["ES2022", "esnext.disposable"],
    "target": "ES2022"
  }
}
```

TypeScript exposes `Disposable`, `AsyncDisposable`, `DisposableStack`, and `AsyncDisposableStack` automatically once the lib entry is present.

## Runtime Support

| Environment | Native support |
|---|---|
| TypeScript ≥ 5.2 | Yes (emits `try/finally` for older targets) |
| Node.js ≥ 22 | Yes (V8 12.1+) |
| Node.js 20 | Partial — `Symbol.dispose` exists, stack classes need polyfill |
| Chrome / Edge ≥ 125 | Yes |
| Firefox | Not yet |

TypeScript handles the down-emit, so you can use `using` today in any Node.js or browser project — the generated output is a plain `try/finally`.
