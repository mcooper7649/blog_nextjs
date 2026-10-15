---
title: "TIL: TypeScript's satisfies Operator"
date: '2026-10-15'
image: cover.jpg
excerpt: The satisfies keyword validates a value against a type without widening it — you get the safety net and the most specific inference at the same time.
isFeatured: false
belt: green
---

`satisfies` is one of those small TypeScript features that's easy to skip until you see what it does.

## The Problem

Say you have a config object and a type that constrains it. The obvious move is a type annotation:

```ts
type Config = Record<string, string | string[]>;

const config: Config = {
  root: './src',
  extensions: ['.ts', '.tsx'],
};
```

TypeScript now validates the shape — great. But `config.root` has type `string | string[]`, so calling `.toUpperCase()` on it is a compile error even though *you know* it's a plain string. TypeScript widened the inference to match the annotation. You gave up the specific type to get the constraint.

## satisfies Keeps Both

```ts
const config = {
  root: './src',
  extensions: ['.ts', '.tsx'],
} satisfies Config;
```

Now TypeScript:
- **Still validates** that every value is `string | string[]` — a wrong value type is caught at compile time.
- **Still infers specifically** — `config.root` is `string` and `config.extensions` is `string[]`, so `.toUpperCase()` and `.join(',')` both work without extra narrowing.

## Another common case — record of tuples

```ts
type Palette = Record<string, [number, number, number]>;

const colors = {
  red: [255, 0, 0],
  green: [0, 128, 0],
  blue: [0, 0, 255],
} satisfies Palette;

// ✅ TypeScript catches  blue: [0, 0]  (wrong tuple length)
// ✅ colors.red is inferred as [number, number, number] (not number[])
```

With `: Palette`, the tuple check is the same, but the specific keys are gone: `colors.purple` would compile and be typed as if it existed. With `satisfies`, `colors.purple` is an error, because TypeScript remembers exactly which keys you wrote.

## Route maps and other lookup tables

This pattern shows up a lot in Next.js projects with typed route configs:

```ts
type RouteConfig = {
  path: string;
  protected: boolean;
};

const ROUTES = {
  home: { path: '/', protected: false },
  dashboard: { path: '/dashboard', protected: true },
  settings: { path: '/settings', protected: true },
} satisfies Record<string, RouteConfig>;

// ✅ ROUTES.home.path is string — no widening
// ✅ Adding  home: { path: '/', protected: 'yes' }  is a compile error
// ✅ ROUTES.nope is a compile error, because the exact keys are kept
```

## When to reach for it

- **Object literals validated against a wider type** — theme tokens, config maps, route tables, anything where you want the constraint but need specific inference downstream.
- **Pairing with `as const`** — `{ ... } as const satisfies Config` keeps literal types and still checks the shape.
- **Zero-cost assertions** — it adds no runtime code, purely a compile-time check.

`satisfies` landed in TypeScript 4.9 (November 2022). If you're on a modern project you've had it for a while — worth adding to your mental toolkit if you haven't already.
