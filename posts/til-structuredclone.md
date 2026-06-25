---
title: 'TIL: structuredClone() — Native Deep Cloning in JavaScript'
date: '2026-06-25'
image: cover.jpg
excerpt: The JSON.parse/stringify hack has a real replacement built into the platform. Here is what it handles, what it does not, and when to reach for it in React.
isFeatured: false
---

If you have ever needed to deep-clone an object in JavaScript, you probably reached for one of two approaches: the JSON round-trip hack or a utility like Lodash's `_.cloneDeep`. As of Node.js 17 and all modern browsers (Chrome 98+, Firefox 94+, Safari 15.4+), there is a native option: `structuredClone()`.

## The Old Way and Its Sharp Edges

```js
const clone = JSON.parse(JSON.stringify(original));
```

This works for simple data, but it silently corrupts or drops several common types:

- `Date` objects become strings
- `Map` and `Set` become `{}` and `[]`
- `undefined` values in objects are dropped entirely
- `RegExp`, `ArrayBuffer`, `Blob` all break in different ways
- Circular references throw a runtime error

## Enter structuredClone

```js
const original = {
  created: new Date(),
  tags: new Set(['react', 'js']),
  meta: new Map([['version', 3]]),
};

const clone = structuredClone(original);

console.log(clone.created instanceof Date);   // true
console.log(clone.tags instanceof Set);       // true
clone.tags.add('node');
console.log(original.tags.has('node'));       // false — truly independent
```

It handles `Date`, `Map`, `Set`, `RegExp`, `ArrayBuffer`, `TypedArray`, `Blob`, `File`, `ImageData`, and circular references. The algorithm is the same one browsers already use to pass messages between workers via `postMessage`.

## What It Does Not Clone

Functions, DOM nodes, class instances with prototype methods, and `Symbol` values are not supported — `structuredClone` throws a `DataCloneError` if the input contains them. For those cases you still need a library.

## Practical Use in React

Deep cloning is a common need when you want to edit a draft of complex nested state without mutating the original:

```js
function useEditableCopy(original) {
  const [draft, setDraft] = useState(() => structuredClone(original));
  const reset = () => setDraft(structuredClone(original));
  return [draft, setDraft, reset];
}
```

Because `structuredClone` is synchronous and allocation-only, it is fast enough for UI interactions on reasonably sized objects. For very large payloads (thousands of nested nodes) `_.cloneDeep` may still win on raw speed, but for typical form state or config objects the native API is more than adequate.

The short version: if you are still writing `JSON.parse(JSON.stringify(...))` for deep copies, swap it for `structuredClone`. Your `Date`s will thank you.
