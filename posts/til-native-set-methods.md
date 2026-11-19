---
title: 'TIL: Set Now Has union(), intersection(), and difference() — No Lodash Needed'
date: '2026-11-19'
image: cover.jpg
excerpt: ES2024 ships seven new Set methods — union, intersection, difference, symmetricDifference, isSubsetOf, isSupersetOf, and isDisjointFrom — so you can stop converting to arrays for every set operation.
isFeatured: false
belt: yellow
---

**TIL** that JavaScript `Set` now ships seven built-in methods for set algebra — and they've been available in all modern runtimes since early 2024. I had no idea until I reached for Lodash to do a simple intersection.

## What We Got

```js
const a = new Set([1, 2, 3, 4]);
const b = new Set([3, 4, 5, 6]);

a.union(b)              // Set {1, 2, 3, 4, 5, 6}
a.intersection(b)       // Set {3, 4}
a.difference(b)         // Set {1, 2}        — in a but not b
a.symmetricDifference(b)// Set {1, 2, 5, 6} — in one but not both

a.isSubsetOf(b)         // false
a.isSupersetOf(b)       // false
a.isDisjointFrom(b)     // false — they share 3 and 4
```

All seven methods return a new `Set` (or a `boolean` for the three predicate methods) and leave the originals unchanged.

## The Old Way Was Painful

Before these landed, every set operation required converting to an array:

```js
// old intersection
const intersection = new Set([...a].filter(x => b.has(x)));
```

That `[...a]` spread allocates a temporary array just so you can call `.filter()`. For small sets it barely matters, but it's noisy and easy to get wrong. The new methods are both cleaner and more efficient — they iterate directly without materialising a full array copy.

## Works With Any Iterable

The argument doesn't have to be another `Set`. Any iterable — an array, a `Map` (uses its keys), or any other iterable object — is accepted:

```js
const admins = new Set(['alice', 'bob']);
const online = ['bob', 'carol', 'dave'];

admins.intersection(online); // Set { 'bob' }
```

This makes it easy to mix sets with the array data you already have.

## A Real-World Pattern

Checking feature-flag access:

```js
const userPermissions = new Set(user.roles);
const requiredPermissions = new Set(['read', 'write']);

if (requiredPermissions.isSubsetOf(userPermissions)) {
  // user has everything required
}
```

No helper, no loop, no temporary array.

## Support

| Environment | Since |
|---|---|
| Chrome | 122 (Feb 2024) |
| Firefox | 127 (Jun 2024) |
| Safari | 17.4 (Mar 2024) |
| Node.js | 22 |
| Deno | 1.42 |

If you need to support older environments, the `[...set].filter(...)` patterns still work as polyfill-free fallbacks. Otherwise, these are safe to use today in any greenfield Node 22+ or modern-browser project.
