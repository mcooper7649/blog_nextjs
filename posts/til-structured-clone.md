---
title: 'TIL: structuredClone() — JavaScript Has a Native Deep Clone'
date: '2026-10-27'
image: cover.jpg
excerpt: Stop reaching for JSON.parse/stringify — JavaScript ships a proper deep clone API and it handles Dates, Sets, Maps, and circular refs.
isFeatured: false
belt: white
---

TIL that JavaScript has had a built-in deep clone function — `structuredClone()` — available natively in major browsers since early 2022, and in Node.js 17+. The old `JSON.parse(JSON.stringify(obj))` trick still shows up out of habit, but it has real gotchas.

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

`JSON.parse(JSON.stringify())` mangles or rejects a lot of common data:

- **`Date`** → converted to an ISO string
- **`undefined`** values → dropped entirely  
- **`Set` / `Map`** → collapsed to `{}`
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

It uses the [Structured Clone Algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) — the same one powering `postMessage`, `IndexedDB`, and `history.pushState`, so it's well-tested.

## What It Still Won't Clone

A few things throw a `DataCloneError` by design:

- **Functions** — not serializable
- **DOM nodes** — can't be cloned

Class instances don't throw, but they lose their identity: the data is copied and the prototype chain is not.

```js
class Point {
  constructor(x, y) { this.x = x; this.y = y }
  toString() { return `(${this.x}, ${this.y})` }
}

const p = new Point(3, 4)
const clone = structuredClone(p)
console.log(clone instanceof Point) // false — prototype gone
console.log(clone.toString())       // '[object Object]'
console.log(clone.x, clone.y)       // 3 4
```

For those cases, a custom `clone()` method on the class is still the right call.

## Browser and Runtime Support

- **Chrome, Edge, Firefox, Safari** — supported since early 2022 (Baseline 2022)
- **Node.js 17+** — built-in global, no import needed
- **Deno / Bun** — supported

Targeting Node 16 or older? Polyfill with `@ungap/structured-clone`.

The bottom line: for cloning plain data objects, `structuredClone()` is the right default. Keep the JSON trick for actual JSON serialization work, not cloning.
