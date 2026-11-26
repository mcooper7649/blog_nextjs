---
title: 'TIL: crypto.randomUUID() — Generate UUIDs Without a Package'
date: '2026-11-26'
image: cover.jpg
excerpt: The Web Crypto API ships a native randomUUID() method in every modern browser and Node.js 14.17+, so you do not need the uuid package for most use cases.
isFeatured: false
belt: yellow
coverPending: true
coverPrompt: 'A close-up of a single snowflake crystal resting on a wooden surface, each arm perfectly unique and intricate, with a small vermilion drop of water beside it.'
---

The `uuid` package has tens of millions of weekly downloads, mostly for one thing: `uuidv4()`. Since Node.js 14.17 and every modern browser, you have that built in.

## The API

```js
const id = crypto.randomUUID();
// → '110e8400-e29b-41d4-a716-446655440000'
```

That's the full API for the common case. `crypto.randomUUID()` returns a version 4 (random) UUID as a lowercase string following RFC 4122. No import, no install.

## Browser and Node.js

In browsers, `crypto` is a global — it's the same object you already use for `crypto.subtle` or `crypto.getRandomValues()`.

In Node.js, `crypto` is a built-in module:

```js
// CommonJS
const { randomUUID } = require('crypto');

// ESM
import { randomUUID } from 'crypto';

const id = randomUUID();
```

Or use the global without an import in Node.js 19+:

```js
const id = crypto.randomUUID(); // global available in Node 19+
```

## Why it's safe to use

`crypto.randomUUID()` is cryptographically secure — it uses the same CSPRNG as `crypto.getRandomValues()`. The `uuid` package's `v4()` does the same, so the output quality is equivalent.

## When you still need the uuid package

The built-in only generates v4 UUIDs. Reach for the package when you need:

- **v1** (time-based) or **v7** (time-ordered, good for database primary keys)
- **v3 / v5** (namespace + name → deterministic UUID)
- Parsing and validating UUID strings (`validate()`, `parse()`)

For anything that's just "give me a unique string," the native method is enough.

## Real-world usage

```js
// React: stable key for dynamically added items
function AddItemButton({ onAdd }) {
  return (
    <button onClick={() => onAdd({ id: crypto.randomUUID(), text: '' })}>
      Add item
    </button>
  );
}
```

```js
// Node.js: request correlation ID
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});
```

```js
// Generating a batch of IDs without a loop helper
const ids = Array.from({ length: 5 }, () => crypto.randomUUID());
```

## Support

| Environment | Since |
|-------------|-------|
| Node.js | 14.17.0 |
| Chrome | 92 |
| Firefox | 95 |
| Safari | 15.4 |
| Edge | 92 |

All major environments have supported this for several years, so there is no need for a polyfill in any active codebase.

## The quick check

If `uuid` is in your `package.json` and you are only calling `v4()`, you can remove it:

```bash
npm uninstall uuid
```

Then replace `import { v4 as uuidv4 } from 'uuid'` with `crypto.randomUUID()`. One less dependency, same result.
