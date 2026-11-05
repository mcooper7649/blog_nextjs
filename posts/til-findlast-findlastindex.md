---
title: 'TIL: findLast() and findLastIndex() — Search Arrays From the End'
date: '2026-11-05'
image: cover.jpg
excerpt: ES2023 added findLast() and findLastIndex() so you can stop reversing arrays just to find the last matching element.
isFeatured: false
belt: white
---

**TIL** that ES2023 added `Array.prototype.findLast()` and `Array.prototype.findLastIndex()` — the reverse-direction counterparts to `find()` and `findIndex()`. No more cloning and reversing an array just to grab the last match.

## The Old Approach

A common pattern before these methods: reverse a copy, search forward, then discard the copy.

```js
const events = [
  { type: 'click', ts: 1 },
  { type: 'scroll', ts: 2 },
  { type: 'click', ts: 3 },
  { type: 'scroll', ts: 4 },
]

// allocates a new array just to search one item
const lastClick = [...events].reverse().find(e => e.type === 'click')
console.log(lastClick) // { type: 'click', ts: 3 }
```

It works, but `.reverse()` mutates in place if you forget the spread, and you're allocating a new array solely to search it.

## findLast() and findLastIndex()

These methods walk from the end without touching the original array:

```js
const lastClick = events.findLast(e => e.type === 'click')
console.log(lastClick) // { type: 'click', ts: 3 }

const lastClickIdx = events.findLastIndex(e => e.type === 'click')
console.log(lastClickIdx) // 2
```

Same callback contract as `find()` and `findIndex()` — the predicate receives `(element, index, array)`. When nothing matches, `findLast()` returns `undefined` and `findLastIndex()` returns `-1`.

## A Practical Example: Latest Error in a Log

```js
const log = [
  { level: 'info',  msg: 'Server started' },
  { level: 'error', msg: 'DB timeout' },
  { level: 'info',  msg: 'Retry succeeded' },
  { level: 'error', msg: 'Rate limit hit' },
  { level: 'info',  msg: 'Request complete' },
]

const lastError = log.findLast(entry => entry.level === 'error')
// { level: 'error', msg: 'Rate limit hit' }
```

One call, no copy, no reversal — a clear statement of intent.

## TypeScript Type-Guard Overload

Both methods support the same type-guard overload that `find()` does, narrowing the return type:

```ts
interface AppEvent {
  type: 'click' | 'scroll'
  ts: number
}

function isClick(e: AppEvent): e is { type: 'click'; ts: number } {
  return e.type === 'click'
}

const events: AppEvent[] = [...]
const last = events.findLast(isClick)
// typed as { type: 'click'; ts: number } | undefined
```

## Browser and Runtime Support

| Runtime | Available since |
|---------|----------------|
| Chrome / Edge | 97+ |
| Firefox | 104+ |
| Safari | 15.4+ |
| Node.js | 18+ |

Baseline 2022 — safe to use in all modern targets without a polyfill. If you need to support Node 16, polyfill with `core-js` or add it inline:

```js
Array.prototype.findLast ??= function(fn) {
  for (let i = this.length - 1; i >= 0; i--) {
    if (fn(this[i], i, this)) return this[i]
  }
}
```

---

Straightforward addition. If you've ever written `[...arr].reverse().find()`, reach for `findLast()` instead.
