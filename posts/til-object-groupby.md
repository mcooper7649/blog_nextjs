---
title: 'TIL: Object.groupBy() — JavaScript Finally Has a Native Group By'
date: '2026-09-22'
image: cover.jpg
excerpt: ES2024 ships Object.groupBy() and Map.groupBy() — no more reduce() gymnastics just to bucket an array into groups.
isFeatured: false
---

**TIL** that JavaScript (ES2024) shipped `Object.groupBy()` — something I'd been reaching for lodash or a manual `reduce()` to do for years. It's now in Node.js 21+ and all modern browsers, and it's cleaner than anything I'd been writing by hand.

## The Old Way

Grouping an array of objects by a property used to mean either pulling in a utility library or writing something like this every time:

```js
const posts = [
  { title: 'Hello', category: 'react' },
  { title: 'World', category: 'nextjs' },
  { title: 'Hooks 101', category: 'react' },
];

const grouped = posts.reduce((acc, post) => {
  const key = post.category;
  (acc[key] ??= []).push(post);
  return acc;
}, {});
// { react: [...], nextjs: [...] }
```

It works, but it's noisy enough that I always extracted it into a shared helper — boilerplate for something this common.

## Object.groupBy()

Now there's a native single-liner:

```js
const grouped = Object.groupBy(posts, (post) => post.category);
// {
//   react: [{ title: 'Hello', … }, { title: 'Hooks 101', … }],
//   nextjs: [{ title: 'World', … }]
// }
```

The callback receives `(element, index)` — the same signature as `Array.prototype.map`. Whatever it returns becomes the group key. Groups appear in insertion order.

One subtlety: the returned object has a **null prototype**, so there's no prototype pollution risk. If you iterate it, use `Object.entries()` or `Object.keys()` as normal — they still work on null-prototype objects.

## Map.groupBy() for Non-String Keys

If you need to group by a non-string key — a number, an object reference, a Date — reach for `Map.groupBy()` instead:

```js
const byLength = Map.groupBy(posts, (post) => post.title.length);
// Map { 5 => [{ title: 'Hello', … }], 5 => [...], 9 => [...] }
```

`Map.groupBy` preserves key identity the way a `Map` always does, so two objects with the same content but different references are separate keys.

## A Real-World React Example

The place I reach for this most often is rendering grouped lists in React:

```jsx
const PostsByCategory = ({ posts }) => {
  const byCategory = Object.groupBy(posts, (p) => p.category);

  return Object.entries(byCategory).map(([category, items]) => (
    <section key={category}>
      <h2>{category}</h2>
      <ul>
        {items.map((p) => (
          <li key={p.slug}>{p.title}</li>
        ))}
      </ul>
    </section>
  ));
};
```

Before ES2024 this would've been a `reduce` call followed by `Object.entries` — same logic, just more lines.

## Support and Fallback

`Object.groupBy` ships in Chrome 117+, Firefox 119+, Safari 17.4+, and Node.js 21+. If you need to target something older today, the `reduce` pattern above is a perfectly readable fallback. No polyfill library required — it's three lines.

The spec is part of [TC39's "change Array by copy" family of additions](https://github.com/tc39/proposal-array-grouping), which also brought us `Array.prototype.toSorted()`, `toReversed()`, and `with()` — all focused on immutable array operations. Worth a look if you haven't seen them.
