---
title: 'TIL: structuredClone() — Deep Copy Objects Without the JSON Hack'
date: '2026-09-29'
image: cover.jpg
excerpt: 'The browser and Node.js finally ship a native deep-clone utility. No more JSON.parse(JSON.stringify()) or lodash just for this.'
isFeatured: false
---

Every JavaScript developer has written this at least once:

```js
const copy = JSON.parse(JSON.stringify(original));
```

It works — until it doesn't. Dates become strings, `undefined` values vanish, functions throw, and circular references crash the whole thing. I've been reaching for lodash's `_.cloneDeep` just for this one operation for years. Not anymore.

## Meet structuredClone()

`structuredClone()` is a global function added to browsers in early 2022 (Chrome 98, Firefox 94, Safari 15.4) and to Node.js in v17. It performs a [structured clone](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) — the same algorithm the browser uses internally when you `postMessage` between workers.

```js
const original = {
  name: 'Alice',
  scores: [95, 87, 100],
  createdAt: new Date(),
  settings: { theme: 'dark' },
};

const copy = structuredClone(original);

copy.settings.theme = 'light';
copy.scores.push(72);

console.log(original.settings.theme); // 'dark'  ← not mutated
console.log(original.scores.length);  // 3       ← not mutated
console.log(copy.createdAt instanceof Date); // true ← still a Date!
```

Compare that to the JSON round-trip:

```js
const jsonCopy = JSON.parse(JSON.stringify(original));
console.log(jsonCopy.createdAt instanceof Date); // false — it's a string now
```

## What it handles that JSON can't

| Value | JSON round-trip | structuredClone |
|---|---|---|
| `Date` | Becomes a string | ✅ Preserved as `Date` |
| `undefined` in arrays | Becomes `null` | ✅ Preserved |
| `Map` / `Set` | Lost entirely | ✅ Cloned correctly |
| `ArrayBuffer` / `TypedArray` | Throws | ✅ Cloned correctly |
| Circular references | Throws | ✅ Handled |
| `RegExp` | Becomes `{}` | ✅ Preserved |
| Functions | Throws | ❌ Not cloneable |
| DOM nodes | Throws | ❌ Not cloneable |

Functions and DOM nodes are intentionally excluded — they can't be serialized across worker boundaries anyway.

## Transferable objects

There's a bonus feature: you can *transfer* certain objects (like `ArrayBuffer`) instead of copying them, moving ownership and avoiding the copy entirely:

```js
const buffer = new ArrayBuffer(1024 * 1024); // 1 MB
const { transferred } = structuredClone(
  { data: buffer },
  { transfer: [buffer] }
);
// buffer is now detached (zero-length) — ownership moved
console.log(buffer.byteLength); // 0
```

This is mostly relevant for worker communication, but it's good to know it's there.

## When to use it

Reach for `structuredClone()` whenever you need a deep copy of a plain data object, especially one that contains `Date`s, `Map`s, `Set`s, or nested arrays. If you're only deep-cloning to remove a lodash dependency, this is your exit ramp.

The one thing it won't do is clone class instances with custom prototypes — the clone will have `Object.prototype`, not your class's prototype. For those cases you still need a custom `clone()` method or a library. But for plain data? `structuredClone()` is all you need.
