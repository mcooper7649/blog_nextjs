---
title: 'TIL: ES2023 Immutable Array Methods (toSorted, toReversed, toSpliced, with)'
date: '2026-09-24'
image: cover.jpg
excerpt: JavaScript finally ships non-mutating versions of sort, reverse, splice, and index-assignment. Stop defensively spreading before every sort.
isFeatured: false
---

If you've ever written `[...arr].sort(...)` just to avoid mutating state, there's good news: ES2023 added four immutable counterparts that return a new array instead of modifying the original.

## The four methods

**`toSorted(compareFn?)`** — like `.sort()`, but returns a new array:

```js
const scores = [42, 7, 99, 18];
const ranked = scores.toSorted((a, b) => b - a);
// ranked → [99, 42, 18, 7]
// scores → [42, 7, 99, 18]  (unchanged)
```

**`toReversed()`** — like `.reverse()`, but non-mutating:

```js
const steps = ['build', 'test', 'deploy'];
const undoOrder = steps.toReversed();
// undoOrder → ['deploy', 'test', 'build']
// steps     → ['build', 'test', 'deploy']  (unchanged)
```

**`toSpliced(start, deleteCount, ...items)`** — like `.splice()`, but returns the changed array (not the removed elements):

```js
const days = ['Mon', 'Tue', 'Thu', 'Fri'];
const fixed = days.toSpliced(2, 0, 'Wed'); // insert 'Wed' at index 2
// fixed → ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
// days  → ['Mon', 'Tue', 'Thu', 'Fri']  (unchanged)
```

**`.with(index, value)`** — immutable index assignment:

```js
const palette = ['red', 'green', 'blue'];
const updated = palette.with(1, 'lime');
// updated → ['red', 'lime', 'blue']
// palette → ['red', 'green', 'blue']  (unchanged)
```

## Why this matters in React

React state should never be mutated directly. Before these methods you had to spread defensively:

```js
// Old: easy to forget the spread and introduce a bug
setItems(prev => [...prev].sort((a, b) => a.name.localeCompare(b.name)));

// New: intent is crystal-clear, no spread needed
setItems(prev => prev.toSorted((a, b) => a.name.localeCompare(b.name)));
```

The new methods also work great with TypeScript — they return `T[]` and accept the same overloads as their mutating equivalents.

## Support

All four are in **Chrome 110+, Firefox 115+, Safari 16+, and Node.js 20+**. If you still need to support older targets, a one-liner polyfill exists via `core-js`, but for most projects in 2026 you can use them without a polyfill.

That's it — four small additions that make array transformations safer and more readable every day.
