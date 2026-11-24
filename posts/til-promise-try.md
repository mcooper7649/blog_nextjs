---
title: 'TIL: Promise.try() — Start Any Function in a Promise Chain'
date: '2026-11-24'
image: cover.jpg
excerpt: Promise.try() wraps any function — sync or async — in a Promise, so errors always flow through .catch() instead of escaping the chain.
isFeatured: false
belt: yellow
---

ES2025 adds a small static method to `Promise` that you will reach for more often than you expect: `Promise.try()`.

## The problem

Suppose you have a function that might be synchronous or asynchronous:

```js
function getUser(id) {
  if (!id) throw new Error('id is required'); // synchronous throw
  return fetch(`/api/users/${id}`).then(r => r.json());
}
```

If you call it inside a `.then()` chain, the synchronous throw is caught automatically — `.then()` wraps its callback in a promise. But if you call it at the _start_ of a chain, the throw escapes to a plain `try/catch`, not your `.catch()` handler:

```js
// The sync throw from getUser(null) goes uncaught here:
getUser(null)
  .then(user => render(user))
  .catch(err => showError(err)); // ← never reached for the sync throw
```

The manual fix is awkward:

```js
Promise.resolve()
  .then(() => getUser(null))
  .then(user => render(user))
  .catch(err => showError(err));
```

## Promise.try() cleans it up

```js
Promise.try(() => getUser(null))
  .then(user => render(user))
  .catch(err => showError(err)); // catches both sync AND async errors
```

`Promise.try(fn)` calls `fn()`, and whether `fn` throws synchronously or returns a rejected promise, the error surfaces in `.catch()`. Works equally well with `async` functions — no double-wrapping occurs.

## With arguments

`Promise.try` accepts additional arguments that are forwarded to the callback:

```js
Promise.try(getUser, userId)
  .then(render)
  .catch(showError);
```

## Practical pattern: wrapping unsafe sync code before an async chain

```js
function parseAndFetch(rawJson) {
  return Promise.try(() => {
    const { endpoint, params } = JSON.parse(rawJson); // sync, may throw
    return fetch(buildUrl(endpoint, params));          // async
  }).then(r => r.json());
}
```

Without `Promise.try`, a bad `rawJson` value throws before any promise exists, so you need a surrounding `try/catch` that duplicates your `.catch()` handler.

## Support

| Environment | Since |
|-------------|-------|
| Node.js | 22.1.0 |
| Chrome | 130 |
| Firefox | 132 |
| Safari | 18.4 |

For anything older, the polyfill is one line:

```js
if (!Promise.try) {
  Promise.try = (fn, ...args) => new Promise(resolve => resolve(fn(...args)));
}
```

The Promise constructor already catches synchronous throws in its executor, so this is a faithful replacement.

## When to reach for it

Use `Promise.try` whenever you are calling an unknown or mixed sync/async function at the beginning of a promise chain. It makes the intent explicit — _"start a promise chain here, and funnel all errors through `.catch()`"_ — without introducing a no-op `.then(() => ...)` wrapper.
