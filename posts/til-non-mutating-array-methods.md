---
title: 'TIL: toSorted(), toReversed(), toSpliced(), with() — Mutate-Free Array Methods'
date: '2026-10-29'
image: cover.jpg
excerpt: ES2023 gave JavaScript four non-mutating array methods that return a new array instead of changing the original — a small API improvement with big payoff in React.
isFeatured: false
belt: yellow
---

**TIL** that ES2023 shipped four array methods that return a *copy* instead of mutating in place: `toSorted()`, `toReversed()`, `toSpliced()`, and `with()`. They're part of the [change-array-by-copy proposal](https://github.com/tc39/proposal-change-array-by-copy) — same jobs as the classic mutating methods, just without the footgun.

## The Problem They Solve

JavaScript's original `sort()` and `reverse()` mutate the array in place, which bites you the moment you forget it:

```js
const scores = [42, 17, 99, 5];
const sorted = scores.sort((a, b) => a - b);
console.log(scores); // [5, 17, 42, 99]  ← original changed!
console.log(sorted === scores); // true   ← same reference
```

In React this is a state mutation bug — and a subtle one, since React may not re-render because the reference didn't change.

## toSorted() and toReversed()

Drop-in replacements that leave the original untouched:

```js
const scores = [42, 17, 99, 5];

const asc = scores.toSorted((a, b) => a - b);
console.log(scores); // [42, 17, 99, 5]  ← unchanged
console.log(asc);    // [5, 17, 42, 99]

const rev = scores.toReversed();
console.log(scores); // [42, 17, 99, 5]  ← still unchanged
console.log(rev);    // [5, 99, 17, 42]
```

Same comparator signature as `sort()`, same reversal behaviour as `reverse()` — just non-destructive.

## toSpliced()

`splice()` is the most dangerous mutator because it does three things at once (delete elements, insert elements, return removed items). `toSpliced()` returns the modified copy and discards nothing from the original:

```js
const fruits = ['apple', 'banana', 'cherry'];

// Remove 1 element at index 1, insert 'blueberry'
const updated = fruits.toSpliced(1, 1, 'blueberry');
console.log(fruits);  // ['apple', 'banana', 'cherry']  ← original safe
console.log(updated); // ['apple', 'blueberry', 'cherry']
```

Note: unlike `splice()`, `toSpliced()` doesn't return the removed elements — it returns the whole new array.

## with()

`with(index, value)` is the non-mutating counterpart to `arr[i] = value`. It returns a copy with one element replaced — handy for updating a single item in a React state array without destructuring:

```js
const tags = ['js', 'react', 'node'];

const updated = tags.with(1, 'nextjs');
console.log(tags);    // ['js', 'react', 'node']   ← unchanged
console.log(updated); // ['js', 'nextjs', 'node']
```

Before `with()`, the cleanest one-liner was `[...arr.slice(0, i), val, ...arr.slice(i + 1)]`. Not exactly readable at a glance.

## Why This Matters in React

Updating arrays in state without accidentally mutating them is one of React's most common gotchas. The new methods make the correct pattern the shortest one:

```jsx
// Updating a single todo without mutating state
const [todos, setTodos] = useState([
  { id: 1, text: 'Learn toSorted', done: false },
  { id: 2, text: 'Ship something', done: false },
]);

function toggle(index) {
  setTodos(prev =>
    prev.with(index, { ...prev[index], done: !prev[index].done })
  );
}

function sortByDone() {
  setTodos(prev => prev.toSorted((a, b) => a.done - b.done));
}
```

Both `with()` and `toSorted()` return a new array reference, so React sees the change and re-renders correctly.

## Support

All four methods are in Chrome 110+, Firefox 115+, Safari 16+, and Node.js 20+. If you need to target older environments, a concise shim covers all four in under 20 lines — or just use the spread-copy patterns they replace. No extra library needed.

These four might look like small additions, but after hitting mutation bugs enough times they become a reflex to reach for.
