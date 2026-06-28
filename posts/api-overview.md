---
title: "REST APIs in Practice: A JavaScript Developer's Guide"
date: '2026-06-28'
image: api-main.png
excerpt: APIs are the connective tissue of the modern web. This guide cuts through the theory and shows you how REST APIs actually work — with real fetch() examples, error handling, auth headers, and the patterns you will use every day.
isFeatured: true
---

## What is an API?

An API (Application Programming Interface) is a contract between two pieces of software. It says: "send me a request in this shape, and I'll send you a response in that shape." You call someone else's code without knowing how it works internally — only what you can ask it to do.

For web developers the term almost always means an **HTTP API**: a server with URLs you can call to create, read, update, or delete data. Every time you log in with Google, load a map widget, or fetch weather data, an HTTP API is doing the work.

---

## REST: the dominant style

REST (Representational State Transfer) is an architectural style, not a protocol. A REST API:

- Exposes **resources** identified by URLs (`/users/42`, `/posts`, `/orders/7/items`)
- Uses standard **HTTP verbs** to describe the action
- Returns **stateless** responses — each request carries everything the server needs; no session is kept on the server
- Sends structured data (almost always **JSON** today)

### HTTP verbs cheat-sheet

| Verb | Purpose | Body? | Typical status |
|------|---------|-------|----------------|
| `GET` | Fetch a resource | No | 200 OK |
| `POST` | Create a new resource | Yes | 201 Created |
| `PUT` | Replace a resource entirely | Yes | 200 OK |
| `PATCH` | Partially update a resource | Yes | 200 OK |
| `DELETE` | Remove a resource | No | 204 No Content |

---

## Making your first request with `fetch()`

The browser's built-in `fetch()` API is all you need to talk to a REST endpoint. It returns a Promise that resolves to a `Response` object.

```js
const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
const post = await response.json();
console.log(post.title); // "sunt aut facere repellat..."
```

Two `await`s — one for the network round-trip, one to parse the JSON body. That's the core pattern.

---

## Error handling: don't trust `fetch()` to throw

A common gotcha: `fetch()` only rejects its Promise on **network failure** (no connection, DNS error). A `404 Not Found` or `500 Internal Server Error` is a resolved Promise — you have to check `response.ok` yourself.

```js
async function getPost(id) {
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

try {
  const post = await getPost(9999);
  console.log(post);
} catch (err) {
  console.error(err.message); // "Request failed: 404 Not Found"
}
```

Wrap this pattern in a utility function so every caller gets consistent error behaviour without duplicating the check.

---

## Creating and updating resources

To send data you set the method, add a `Content-Type` header, and serialize your payload with `JSON.stringify()`.

```js
// POST — create a new post
const newPost = await fetch('https://jsonplaceholder.typicode.com/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'My first post',
    body: 'Hello world',
    userId: 1,
  }),
});

const created = await newPost.json();
console.log(created.id); // 101 (fake, but the shape is right)
```

```js
// PATCH — update only the title of post 1
const updated = await fetch('https://jsonplaceholder.typicode.com/posts/1', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Updated title' }),
});

const result = await updated.json();
console.log(result.title); // "Updated title"
```

Use `PUT` when you're replacing the whole resource; use `PATCH` when you're changing one or a few fields.

---

## Authentication headers

Most real APIs require you to prove who you are. Two patterns dominate:

### Bearer token (JWT or OAuth)

```js
async function fetchProtected(url, token) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

const data = await fetchProtected('/api/me', localStorage.getItem('token'));
```

### API key as a header

```js
const res = await fetch('https://api.example.com/data', {
  headers: { 'X-API-Key': process.env.NEXT_PUBLIC_API_KEY },
});
```

Never embed secret API keys in client-side code. Anything the browser can read, an attacker can read. Secret credentials belong in server-side code (Next.js API routes, Edge Functions, etc.) and are loaded from environment variables.

---

## A reusable fetch wrapper

Rather than repeating headers and error checks everywhere, build a thin wrapper:

```js
// lib/api.js
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

async function request(path, options = {}) {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('token')
    : null;

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${detail}`);
  }

  // 204 No Content has no body
  if (res.status === 204) return null;

  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: (path) => request(path, { method: 'DELETE' }),
};
```

Usage becomes one clear line:

```js
const user = await api.get('/users/42');
await api.patch('/users/42', { bio: 'Updated bio' });
await api.del('/posts/7');
```

---

## Handling query parameters

Build query strings with `URLSearchParams` — it handles encoding correctly:

```js
const params = new URLSearchParams({
  search: 'next.js',
  page: '2',
  limit: '10',
});

const res = await fetch(`/api/posts?${params}`);
// → /api/posts?search=next.js&page=2&limit=10
const { posts, total } = await res.json();
```

---

## Status codes you'll see constantly

| Code | Meaning | What to do |
|------|---------|-----------|
| 200 | OK | Parse the body |
| 201 | Created | Parse the body (new resource) |
| 204 | No Content | No body to parse |
| 400 | Bad Request | Fix the request shape |
| 401 | Unauthorized | Redirect to login / refresh token |
| 403 | Forbidden | User lacks permission — don't retry |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Usually a duplicate (email already taken) |
| 422 | Unprocessable Entity | Validation failed; show field errors |
| 429 | Too Many Requests | Back off; respect `Retry-After` header |
| 500 | Internal Server Error | Bug on the server; log and retry if idempotent |

---

## REST vs GraphQL

GraphQL is worth knowing about. Instead of multiple REST endpoints, you send a single query describing exactly what data you need:

```graphql
query {
  user(id: "42") {
    name
    email
    posts(first: 5) {
      title
      publishedAt
    }
  }
}
```

The tradeoffs:

- **REST** is simpler to cache (HTTP caching works naturally), easier to secure per-endpoint, and has tooling everywhere.
- **GraphQL** lets clients request precise shapes, avoids over-fetching, and reduces round-trips when you need data from multiple resources at once.

For most projects — especially teams new to APIs — REST is the right default. Reach for GraphQL when clients have highly variable data needs or you're building a public API consumed by many different clients.

---

## Quick patterns summary

1. Always check `response.ok` — don't assume a resolved Promise means success.
2. Centralize fetch in one `api.js` util — don't scatter raw `fetch()` calls everywhere.
3. Keep secrets server-side — never ship API keys to the browser.
4. Use `URLSearchParams` for query strings — manual string concatenation breaks with special characters.
5. Handle 401 centrally — expired tokens need a single consistent "redirect to login" path.

Once these patterns feel natural, you're ready to explore TanStack Query or SWR, which add caching, background refetching, and loading/error states on top of this foundation.
