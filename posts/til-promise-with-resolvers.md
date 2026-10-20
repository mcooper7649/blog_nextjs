---
title: 'TIL: Promise.withResolvers() — The Deferred Promise Pattern, Finally Native'
date: '2026-10-20'
image: cover.jpg
excerpt: ES2024 ships Promise.withResolvers() — a clean way to expose a promise's resolve and reject outside its constructor, without the old callback gymnastics.
isFeatured: false
belt: yellow
---

**TIL** that ES2024 added `Promise.withResolvers()` — and I immediately deleted a utility function I've been copy-pasting between projects for three years.

## The Old Deferred Pattern

There's a common need in async code: create a `Promise` whose `resolve` and `reject` live outside the constructor, so external code can settle it later. Think about wiring up an event emitter, a one-time message listener, or a manual trigger:

```js
// The old way — everyone had a version of this
function createDeferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const { promise, resolve } = createDeferred();
someEventEmitter.once('done', resolve);
await promise;
```

It works, but it's a workaround for a missing built-in — and the variable assignment inside the executor always feels vaguely dirty.

## Promise.withResolvers()

Now there's a native one-liner:

```js
const { promise, resolve, reject } = Promise.withResolvers();

someEventEmitter.once('done', resolve);
someEventEmitter.once('error', reject);

await promise;
```

The return value is an object with three keys: `promise`, `resolve`, and `reject`. No factory function needed.

## A Real Example: Waiting on a WebSocket

The pattern shines when bridging event-driven APIs into async/await:

```js
async function waitForOpen(ws) {
  const { promise, resolve, reject } = Promise.withResolvers();

  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', (e) => reject(e), { once: true });

  return promise;
}

const ws = new WebSocket('wss://example.com');
await waitForOpen(ws);
ws.send('hello');
```

Before `withResolvers()`, this needed either the factory above or a nested `new Promise()` wrapping the event listeners — both adding indirection.

## Subclassing Works Too

`Promise.withResolvers()` is defined on `Promise` itself, so calling it on a subclass creates a deferred of that subclass:

```js
class TrackedPromise extends Promise { /* … */ }

const { promise } = TrackedPromise.withResolvers();
promise instanceof TrackedPromise; // true
```

## Support

`Promise.withResolvers()` ships in Chrome 119+, Firefox 121+, Safari 17.4+, and **Node.js 22+**. If you need Node.js 18/20, the two-liner factory above is still the cleanest fallback — but there's no polyfill complexity required, it's just three lines.

Time to audit my `utils/deferred.ts` files across a few repos.
