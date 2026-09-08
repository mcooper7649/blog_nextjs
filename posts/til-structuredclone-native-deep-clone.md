---
title: "TIL: structuredClone() — Native Deep Cloning in JavaScript"
date: '2026-09-08'
image: cover.jpg
excerpt: JavaScript finally has a built-in deep clone function — no more JSON.parse/stringify hacks or lodash just to copy a nested object.
isFeatured: false
---

I was refactoring some React state logic this week when I caught myself typing the old `JSON.parse(JSON.stringify(obj))` incantation. Turns out JavaScript has had a proper built-in for this since Node.js 17 and all modern browsers: `structuredClone()`.

## The Old Way — and Its Sharp Edges

```js
// The classic hack — works for simple cases, breaks for everything else
const copy = JSON.parse(JSON.stringify(original));
```

This silently corrupts or drops:

- **`undefined`** values — they disappear entirely
- **`Date` objects** — become ISO strings, not `Date` instances
- **`Map` and `Set`** — become `{}` and `[]` respectively
- **Functions** — dropped without warning
- **Circular references** — throws a `TypeError`

## The New Way

```js
const original = {
  name: 'Michael',
  meta: {
    created: new Date('2026-01-01'),
    tags: new Set(['js', 'web']),
    scores: [95, 87, 100],
  },
};

const copy = structuredClone(original);

// Mutating the copy leaves the original untouched
copy.meta.scores.push(72);
console.log(original.meta.scores.length);    // 3 — untouched
console.log(copy.meta.created instanceof Date); // true — still a real Date
console.log(copy.meta.tags instanceof Set);     // true — still a real Set
```

`structuredClone()` uses the [Structured Clone Algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) — the same algorithm browsers use internally for `postMessage` and `IndexedDB`. It correctly handles `Date`, `Map`, `Set`, `RegExp`, `ArrayBuffer`, `Blob`, and circular references.

## Where It Still Falls Short

You can't clone **functions** — the algorithm throws a `DataCloneError`. If your object contains methods, you'll need a library (`klona` is a good lightweight pick) or a custom recursive clone.

## Practical React Tip

This is great for updating deeply nested state without awkward spread chains or pulling in `immer`:

```js
function updateUserPreferences(prev, newTheme) {
  const next = structuredClone(prev);
  next.user.preferences.theme = newTheme;
  next.user.lastModified = new Date();
  return next;
}

setAppState(prev => updateUserPreferences(prev, 'dark'));
```

No `{ ...prev, user: { ...prev.user, preferences: { ...prev.user.preferences, theme: 'dark' } } }` gymnastics. Clean.

## Browser and Node Support

| Runtime | Since |
|---------|-------|
| Node.js | 17.0 (Oct 2021) |
| Chrome | 98 |
| Firefox | 94 |
| Safari | 15.4 |

If you're building for modern environments — which most of us are — `structuredClone()` is safe to reach for today. No import, no install.
