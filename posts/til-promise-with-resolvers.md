---
title: 'TIL: Promise.withResolvers() — Cleaner Deferred Promises'
date: '2026-10-06'
image: cover.jpg
excerpt: 'ES2024 adds Promise.withResolvers(), a one-liner that returns { promise, resolve, reject } so you can control a promise from outside its executor — no more leaking variables.'
isFeatured: false
---

The "deferred promise" pattern comes up more than you'd expect: wrapping a callback API, building an async event queue, coordinating async class initialization. Before ES2024, doing it required leaking `resolve` and `reject` out of the executor into outer variables — it worked, but it always felt awkward.

```js
// the old pattern
let resolve, reject;
const promise = new Promise((res, rej) => {
  resolve = res;
  reject = rej;
});

// somewhere later
resolve('done');
```

TypeScript would also complain about `resolve` potentially being `undefined` until assigned, requiring extra assertions.

## Promise.withResolvers()

`Promise.withResolvers()` is a static method added in ES2024. It returns an object with all three pieces up front:

```js
const { promise, resolve, reject } = Promise.withResolvers();

// pass promise wherever it's needed
doSomethingWith(promise);

// resolve or reject from anywhere, later
resolve('done');
```

Clean, no assertions needed, TypeScript happy.

## Wrapping a Callback API

The canonical use case is modernizing old callback-style APIs. Here's `FileReader`:

```js
function readFileAsText(file) {
  const { promise, resolve, reject } = Promise.withResolvers();

  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error);
  reader.readAsText(file);

  return promise;
}

// caller
const text = await readFileAsText(myFile);
console.log(text);
```

Before `withResolvers()` this would be wrapped in `new Promise((resolve, reject) => { ... })`, which works fine but buries the setup logic inside the executor.

## Async Class Initialization

Another pattern I reach for in React context providers and data-store classes:

```js
class DataStore {
  #readyPromise;
  #resolve;

  constructor() {
    const { promise, resolve } = Promise.withResolvers();
    this.#readyPromise = promise;
    this.#resolve = resolve;
    this.#init(); // fire and forget
  }

  async #init() {
    // async setup — fetch config, open DB connection, etc.
    await loadConfig();
    this.#resolve();
  }

  async get(key) {
    await this.#readyPromise; // waits until init() finishes
    return this.#data.get(key);
  }
}
```

Any call to `get()` before initialization completes just awaits the shared promise — no polling, no flags.

## Building a Simple Async Queue

```js
function createSignal() {
  return Promise.withResolvers();
}

// producer signals when new data is ready
const signal = createSignal();
producer.on('data', (chunk) => {
  signal.resolve(chunk);
});

// consumer waits for the signal
const chunk = await signal.promise;
```

## Browser and Node.js Support

| Environment | Since |
|---|---|
| Node.js | 22.0 (Apr 2024) |
| Chrome / Edge | 119 (Oct 2023) |
| Firefox | 121 (Dec 2023) |
| Safari | 17.4 (Mar 2024) |

If you need to support older environments, the polyfill is a one-liner:

```js
Promise.withResolvers ??= function () {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};
```

Drop that in a utils file at app startup and you're covered.

## The Takeaway

`Promise.withResolvers()` doesn't do anything you couldn't do before — it just removes the boilerplate of the deferred pattern and makes the intent explicit. I've replaced a handful of "leaky executor" utilities in my codebase with it and not missed the old approach once.
