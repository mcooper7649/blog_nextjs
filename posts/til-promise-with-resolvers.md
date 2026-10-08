---
title: 'TIL: Promise.withResolvers() — No More Resolve/Reject Gymnastics'
date: '2026-10-08'
image: cover.jpg
excerpt: ES2024's Promise.withResolvers() hands you the resolve and reject callbacks directly, so you can pass them anywhere without a closure wrapper.
isFeatured: false
belt: yellow
---

**TIL** that ES2024 shipped `Promise.withResolvers()` — a tiny factory that finally solves the awkward pattern of trying to call `resolve` or `reject` from outside the Promise constructor.

## The Problem It Fixes

You've probably written this at least once:

```js
let resolve, reject;
const promise = new Promise((res, rej) => {
  resolve = res;
  reject = rej;
});

// Now you can call resolve/reject from somewhere else
setTimeout(() => resolve('done'), 1000);
```

This works, but it's ugly. The assignment inside the executor is a side effect that feels like a hack, and TypeScript often complains that `resolve` might be used before assignment. The whole pattern exists purely because the `Promise` constructor forces you to wire the callbacks through a closure.

## Promise.withResolvers()

The new API returns all three things at once:

```js
const { promise, resolve, reject } = Promise.withResolvers();

setTimeout(() => resolve('done'), 1000);

const result = await promise;
console.log(result); // 'done'
```

One line, no closure gymnastics, and the types come out clean in TypeScript without an assertion.

## Where This Actually Helps

The pattern gets genuinely useful anywhere you need to turn a callback-based API into a promise without the ceremony. A common case: wrapping a WebSocket or an EventEmitter so you can `await` the first event.

```js
function waitForOpen(ws) {
  const { promise, resolve, reject } = Promise.withResolvers();

  ws.addEventListener('open', () => resolve(ws), { once: true });
  ws.addEventListener('error', (e) => reject(e), { once: true });

  return promise;
}

// Usage
const ws = new WebSocket('wss://example.com');
await waitForOpen(ws);
ws.send(JSON.stringify({ type: 'hello' }));
```

The `{ once: true }` option cleans up the listeners automatically, so you don't need to call `removeEventListener` manually.

Another place I've found this useful: building a simple async task queue where each item in the queue gets its own deferred promise, and a worker loop calls `resolve` when it finishes the work.

## Browser and Node Support

- **Chrome** 119+
- **Firefox** 121+
- **Safari** 17.4+
- **Node.js** 22+ (and v21 with the `--harmony` flag)

If you're already targeting Node 22 LTS (the current long-term-support release), you have it. For older targets, the two-line assignment pattern is the fallback — just extract it into a `deferred()` helper function and call it done.

## One Gotcha

The returned `promise` is a standard `Promise` — it doesn't have any extra methods, and `resolve`/`reject` are ordinary functions. You can call them multiple times (only the first call matters, as with any Promise), and calling one after the other has no effect.
