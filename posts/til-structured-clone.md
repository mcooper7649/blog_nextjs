---
title: 'TIL: structuredClone() — JavaScript Has a Native Deep Clone'
date: '2026-10-27'
image: cover.jpg
excerpt: Stop reaching for JSON.parse/stringify — JavaScript ships a proper deep clone API and it handles Dates, Sets, Maps, and circular refs.
isFeatured: false
---

TIL that JavaScript has had a built-in deep clone function — `structuredClone()` — available natively in browsers and Node.js since early 2022. I kept defaulting to the old `JSON.parse(JSON.stringify(obj))` trick out of habit, but that shortcut has real gotchas.

## The Old Way and Its Gotchas

```js
const original = {
  name: 'Alice',
  born: new Date('1990-01-01'),
  tags: ['admin'],
}

// Date becomes a string — silently
const broken = JSON.parse(JSON.stringify(original))
console.log(broken.born instanceof Date) // false — it's a string now
```

`JSON.parse(JSON.stringify())` silently destroys:

- **`Date`** → converted to an ISO string
- **`undefined`** values → dropped entirely  
- **`Set` / `Map`** → collapsed to `{}` or `[]`
- **`RegExp`** → `{}`
- **Circular references** → throws a TypeError

## structuredClone() Does the Right Thing

```js
const original = {
  name: 'Alice',
  born: new Date('1990-01-01'),
  tags: new Set(['admin', 'user']),
  config: new Map([['theme', 'dark']]),
}

const clone = structuredClone(original)

console.log(clone.born instanceof Date)      // true ✓
console.log(clone.tags instanceof Set)       // true ✓
console.log(clone.tags === original.tags)    // false — it's a real deep copy
```

It uses the [Structured Clone Algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) — the same one powering `postMessage`, `IndexedDB`, and `history.pushState`, so it's well-tested and fast.

## What It Still Won't Clone

A few things throw a `DataCloneError` by design:

- **Functions** — not serializable
- **DOM nodes** — can't cross context boundaries
- **Class instances** — object data is cloned but the prototype chain is lost

```js
class Point {
  constructor(x, y) { this.x = x; this.y = y }
  toString() { return `(${this.x}, ${this.y})` }
}

const p = new Point(3, 4)
const clone = structuredClone(p)
console.log(typeof clone.toString) // 'undefined' — prototype gone
```

For those cases a custom `clone()` method or a lean library like `rfdc` is still the right call.

## Browser and Runtime Support

- **Chrome, Edge, Firefox, Safari** — supported since early 2022 (Baseline 2022)
- **Node.js 17+** — built-in global, no import needed
- **Deno / Bun** — supported

Targeting Node 16 or older? Polyfill with `@ungap/structured-clone`.

The bottom line: for cloning plain data objects, `structuredClone()` is the right default. Keep the JSON trick for actual JSON serialization work, not cloning.
