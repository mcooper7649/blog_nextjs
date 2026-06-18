---
title: 'TIL: structuredClone() — Native Deep Cloning in JavaScript'
date: '2026-06-18'
image: cover.jpg
excerpt: Forget the JSON.parse/stringify hack — JavaScript now has a built-in structuredClone() that correctly handles Dates, Maps, Sets, and circular references.
isFeatured: false
---

If you've ever needed a deep copy of a JavaScript object, you've probably reached for this old trick at some point:

```js
const clone = JSON.parse(JSON.stringify(original));
```

It mostly works, but it has real sharp edges: `Date` objects silently become strings, `undefined` values disappear, `Map` and `Set` are lost entirely, and circular references throw. There's a proper native solution now.

## Meet `structuredClone()`

Node.js 17+ and all modern browsers ship a built-in `structuredClone()` function, based on the HTML [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm):

```js
const original = {
  name: 'Michael',
  createdAt: new Date(),
  tags: ['react', 'node'],
};

const clone = structuredClone(original);

clone.tags.push('docker');

console.log(original.tags);               // ['react', 'node'] — untouched
console.log(clone.createdAt instanceof Date); // true ✅
```

The clone is fully independent — mutating nested arrays or objects in the copy never affects the original.

## What it handles correctly

| Value | `JSON.parse/stringify` | `structuredClone()` |
|---|---|---|
| `Date` | Converts to string ❌ | Real `Date` instance ✅ |
| `Map` / `Set` | Lost as `{}` ❌ | Cloned with entries ✅ |
| `undefined` | Silently dropped ❌ | Preserved ✅ |
| `ArrayBuffer` | Throws ❌ | Deep-copied ✅ |
| Circular refs | Throws ❌ | Handled ✅ |

```js
const set = new Set([1, 2, 3]);
const map = new Map([['hits', 42]]);

const clone = structuredClone({ set, map });

clone.map.set('hits', 0);
console.log(map.get('hits')); // 42 — original unchanged
```

## What it can't clone

`structuredClone()` doesn't handle everything. **Functions, DOM nodes, and class methods** are not supported — attempting to clone them throws a `DataCloneError`:

```js
// Throws DataCloneError
structuredClone({ fn: () => console.log('hi') });
```

Class instances are partially cloned: the own-property data survives, but the prototype chain is stripped, so you get a plain object back. If you have a `User` class with methods, the clone won't have those methods.

## When I reach for it

Anytime I need a deep copy for:

- **React state updates** where I can't mutate the existing reference
- **`Worker` / `postMessage`** — this is actually the same algorithm the browser uses internally, so it's a perfect fit
- **Defensive copies** in utility functions that shouldn't modify their inputs

For objects that contain functions or class instances with important prototypes, a targeted manual clone or `lodash.cloneDeep` is still the right tool. But for pure data objects — the majority of what I work with in practice — `structuredClone()` is now my default.

Browser support is at 97 %+ globally as of mid-2026, and it's been in Node.js since v17. If you're still running the JSON hack on data-only objects, swap it out — it's a one-line change with strictly better semantics.
