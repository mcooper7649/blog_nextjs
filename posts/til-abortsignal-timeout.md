---
title: 'TIL: AbortSignal.timeout() — Add Fetch Timeouts in One Line'
date: '2026-11-10'
image: cover.jpg
excerpt: AbortSignal.timeout(ms) replaces the manual AbortController + setTimeout + clearTimeout dance with a single call.
isFeatured: false
belt: white
---

**TIL** that `AbortSignal.timeout(ms)` exists — and it replaces about eight lines of `AbortController` boilerplate with one.

## The Old Way

Adding a timeout to `fetch` used to require a controller, a timer, and a cleanup step:

```javascript
const controller = new AbortController();
const timerId = setTimeout(() => controller.abort(), 5000);

try {
  const res = await fetch(url, { signal: controller.signal });
  const data = await res.json();
  return data;
} finally {
  clearTimeout(timerId); // easy to forget
}
```

If you skip the `clearTimeout`, the timer keeps the event loop alive and can fire after the response is already processed.

## The New Way

`AbortSignal.timeout(ms)` returns a signal that aborts itself after the given number of milliseconds — no controller, no timer variable, no cleanup:

```javascript
const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
const data = await res.json();
return data;
```

That's it. When the timeout fires, `fetch` throws a `DOMException` with `name === 'TimeoutError'`, which you can catch specifically:

```javascript
try {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  return await res.json();
} catch (err) {
  if (err.name === 'TimeoutError') {
    throw new Error('Request timed out after 5 s');
  }
  throw err; // AbortError, TypeError, network errors, etc.
}
```

## Combining a Timeout with Manual Cancellation

If you need *both* — a timeout *and* the ability to cancel manually — use `AbortSignal.any()` (Node 20.3+, Chrome 116+):

```javascript
const controller = new AbortController();

const signal = AbortSignal.any([
  controller.signal,         // manual cancel
  AbortSignal.timeout(5000), // auto timeout
]);

const res = await fetch(url, { signal });

// elsewhere, to cancel early:
controller.abort();
```

The combined signal aborts as soon as *either* source fires.

## Browser and Node Support

| Environment | Since |
|---|---|
| Chrome | 103 |
| Firefox | 100 |
| Safari | 16 |
| Node.js | 17.3 |
| Deno | 1.23 |

All modern runtimes support it. If you need to target older Node.js (< 17.3), fall back to the manual `AbortController` approach.

## The Practical Upside

The old pattern had two failure modes: forgetting `clearTimeout` (leaks a timer) and forgetting to pass the signal (the controller does nothing). `AbortSignal.timeout` removes both. The timeout is attached directly to the signal, so there is nothing to clean up and nothing to forget to wire in.
