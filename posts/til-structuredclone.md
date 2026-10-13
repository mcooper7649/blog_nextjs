---
title: 'TIL: structuredClone() — Native Deep Cloning Without the Hacks'
date: '2026-10-13'
image: cover.jpg
excerpt: JavaScript now has a built-in deep clone — no more JSON.parse(JSON.stringify()) gymnastics, and it actually handles Dates, Sets, Maps, and circular references.
isFeatured: false
---

**TIL** that JavaScript has had a native `structuredClone()` global since Node 17 and Chrome 98 — and I'm embarrassed by how long I kept reaching for the `JSON.parse(JSON.stringify())` trick instead.

## The Old Hack and Why It Breaks

```js
const clone = JSON.parse(JSON.stringify(original));
```

This works for plain objects with string/number values, but it silently corrupts:

- **`Date`** — stringified to an ISO string, not restored as a Date.
- **`Set` / `Map`** — collapsed to `{}` (an empty object).
- **`undefined` values** — dropped entirely.
- **Circular references** — throws a `TypeError`.
- **`RegExp`, `ArrayBuffer`, `Blob`** — lost or mangled.

If your object ever touches any of those types, you're cloning something subtly broken.

## structuredClone()

```js
const a = {
  name: 'config',
  created: new Date(),
  tags: new Set(['react', 'nextjs']),
  nested: { count: 0 },
};

const b = structuredClone(a);

b.nested.count = 99;
b.tags.add('typescript');

console.log(a.nested.count); // 0 — untouched
console.log(a.tags.size);    // 2 — untouched
console.log(b.created instanceof Date); // true ✓
```

Mutations to `b` don't bleed into `a`, and `Date` / `Set` / `Map` survive the round-trip as their original types.

Circular references also work fine:

```js
const obj = { self: null };
obj.self = obj;
const clone = structuredClone(obj); // no error
console.log(clone.self === clone);  // true
```

## What It Still Can't Clone

`structuredClone` uses the [Structured Clone Algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) — the same one used by `postMessage` and IndexedDB. It cannot clone:

- **Functions** — throws a `DataCloneError`.
- **DOM nodes** — throws a `DataCloneError`.
- **`Error` objects with non-standard properties** — the standard fields (`message`, `stack`) survive but custom properties are dropped.
- **Class instances** — the data clones but prototype chain does not; you get a plain object back.

For those cases you still need a library like `structuredClone`-aware deep-equal, or a hand-rolled recursive clone.

## Support

Available in Chrome 98+, Firefox 94+, Safari 15.4+, and Node.js 17+. If you need to support something older, the [MDN polyfill](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone) is one import away. For most projects today it's just there.
