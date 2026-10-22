---
title: 'TIL: Promise.withResolvers() — A Cleaner Deferred Pattern'
date: '2026-10-22'
image: cover.jpg
excerpt: ES2024 ships Promise.withResolvers() — no more awkward variable hoisting to expose resolve and reject outside the executor.
isFeatured: false
belt: yellow
---

**TIL** that ES2024 shipped `Promise.withResolvers()` — something I'd been faking with a `let resolve, reject` dance for years. It's now in Node.js 22+, Chrome 119+, Firefox 121+, and Safari 17.4+.

## The Old Deferred Pattern

Sometimes you need to resolve or reject a promise from *outside* the executor — wiring a callback-based API, signaling between components, or waiting for user input. The classic workaround leaked variables via hoisting:

```js
let resolve, reject;
const promise = new Promise((res, rej) => {
  resolve = res;
  reject = rej;
});

// later…
resolve('done');
```

It works, but TypeScript complains (`possibly undefined`), linters flag the hoisted `let`, and the intent is murky.

## Promise.withResolvers()

One call, everything bundled:

```js
const { promise, resolve, reject } = Promise.withResolvers();

// pass `promise` to the consumer
// keep `resolve` / `reject` for the producer
resolve('done');
```

The returned object has exactly three keys: `promise`, `resolve`, `reject`. No more hoisting, no type narrowing needed, clear producer/consumer split.

## Wrapping a Callback-Based API

This is where it shines. Wrapping `setTimeout` as a cancellable `delay`:

```js
function delay(ms) {
  const { promise, resolve, reject } = Promise.withResolvers();
  const id = setTimeout(resolve, ms);
  return {
    promise,
    cancel: () => {
      clearTimeout(id);
      reject(new DOMException('Aborted', 'AbortError'));
    },
  };
}

const d = delay(5000);
d.promise.then(() => console.log('fired')).catch(() => console.log('cancelled'));

// somewhere else
d.cancel(); // logs "cancelled"
```

Before, passing `reject` out of the executor required the same hoisting trick — now it reads as plain data flow.

## One-Shot Event Resolution

Another common pattern: waiting for a single event to fire before proceeding:

```js
function waitForEvent(emitter, event) {
  const { promise, resolve, reject } = Promise.withResolvers();
  emitter.once(event, resolve);
  emitter.once('error', reject);
  return promise;
}

await waitForEvent(stream, 'open');
```

Clean, composable, no extra state required.

## Browser and Node Support

`Promise.withResolvers()` is available in:

- **Node.js 22+** (and 21.7+ with a flag)
- **Chrome 119+**, **Edge 119+**
- **Firefox 121+**
- **Safari 17.4+**

For older targets a one-liner polyfill covers you:

```js
Promise.withResolvers ??= function() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};
```

It's a small addition, but it removes a category of awkward boilerplate that every JavaScript developer has written at least once.
