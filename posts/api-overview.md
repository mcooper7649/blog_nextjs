---
title: 'Working with REST APIs in JavaScript'
date: '2026-08-29'
image: api-main.png
excerpt: A practical guide to fetching, posting, and handling errors from REST APIs using the Fetch API and async/await in modern JavaScript.
isFeatured: true
---

REST APIs are the backbone of almost every web application. Whether you're pulling weather data, authenticating users, or submitting a form to a backend, you're talking to an API. This post covers how to work with them confidently in modern JavaScript — no third-party HTTP library required.

## What Is a REST API?

REST (Representational State Transfer) is an architectural style, not a strict protocol. A REST API exposes resources at URLs and lets clients manipulate them using standard HTTP methods:

| Method | Meaning |
|--------|---------|
| `GET` | Read a resource |
| `POST` | Create a resource |
| `PUT` / `PATCH` | Replace / partially update a resource |
| `DELETE` | Delete a resource |

The server responds with a status code and usually a JSON body. Status codes matter: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`.

## The Fetch API

Modern browsers and Node.js 18+ include `fetch` natively. No `npm install` needed.

### A Basic GET Request

```js
async function getUser(userId) {
  const response = await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const user = await response.json();
  return user;
}

const user = await getUser(1);
console.log(user.name); // "Leanne Graham"
```

Two things to note:
- `fetch` only rejects its promise on **network errors** (DNS failure, no connection). A `404` or `500` does NOT reject — you have to check `response.ok` yourself.
- `.json()` returns a promise, so you need to `await` it.

### POST — Sending JSON to an API

```js
async function createPost(title, body, userId) {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, body, userId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? `HTTP ${response.status}`);
  }

  return response.json(); // returns the created resource
}

const post = await createPost('Hello API', 'My first post', 1);
console.log(post.id); // 101
```

Always set `Content-Type: application/json` when sending a JSON body, or the server may reject or misparse your request.

### PUT and PATCH

`PUT` replaces the whole resource. `PATCH` applies a partial update. Syntax is the same as `POST` — just change the `method` and point to the resource URL:

```js
// Full replace
await fetch(`/api/users/42`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'New Name', email: 'new@example.com' }),
});

// Partial update — only send what changed
await fetch(`/api/users/42`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'New Name' }),
});
```

### DELETE

```js
const response = await fetch(`/api/posts/101`, { method: 'DELETE' });
if (!response.ok) throw new Error(`Failed to delete: ${response.status}`);
// DELETE often returns 204 No Content — don't try to parse a body
```

## Sending Authentication Headers

Most real APIs require a token. Pass it in the `Authorization` header:

```js
async function fetchPrivateData(token) {
  const response = await fetch('https://api.example.com/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    throw new Error('Unauthorized — check your token');
  }

  return response.json();
}
```

Store tokens in memory or in a secure HttpOnly cookie — never in `localStorage` for sensitive apps.

## Error Handling Done Right

It's tempting to slap a `try/catch` around fetch and call it done, but the error shape matters:

```js
async function safeFetch(url, options = {}) {
  let response;

  try {
    response = await fetch(url, options);
  } catch (networkError) {
    // Truly no connection, DNS failure, CORS preflight blocked, etc.
    throw new Error(`Network error: ${networkError.message}`);
  }

  if (!response.ok) {
    // Try to parse an error payload from the server
    let serverMessage = '';
    try {
      const body = await response.json();
      serverMessage = body.message ?? body.error ?? '';
    } catch {
      // Server didn't return JSON — that's fine
    }
    throw new Error(serverMessage || `HTTP ${response.status} ${response.statusText}`);
  }

  // 204 No Content — nothing to parse
  if (response.status === 204) return null;

  return response.json();
}
```

Now callers get a useful error message whether the failure is a network outage or a `422 Unprocessable Entity`.

## A Real-World Pattern: Data Fetching Hook in React

Combining everything above into a reusable React hook:

```jsx
import { useState, useEffect } from 'react';

function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const json = await response.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; }; // avoid state updates after unmount
  }, [url]);

  return { data, loading, error };
}

// Usage
function UserCard({ userId }) {
  const { data: user, loading, error } = useFetch(
    `https://jsonplaceholder.typicode.com/users/${userId}`
  );

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Error: {error}</p>;
  return <h2>{user.name}</h2>;
}
```

The `cancelled` flag is crucial: if the component unmounts before the fetch resolves, this prevents a state update on an unmounted component.

> **Tip:** If you find yourself rebuilding this pattern often, look at [TanStack Query](https://blog.mycodedojo.com/posts/tanstack-query-server-state). It handles caching, background refetching, and deduplication on top of exactly this pattern.

## Handling Pagination

Most list endpoints are paginated. Common patterns:

**Offset/limit:**
```js
const page = 2;
const limit = 10;
const res = await fetch(`/api/posts?page=${page}&limit=${limit}`);
const { data, total } = await res.json();
```

**Cursor-based (common in modern APIs):**
```js
let cursor = null;
const all = [];

do {
  const url = cursor
    ? `/api/posts?after=${cursor}`
    : `/api/posts`;

  const res = await fetch(url);
  const { posts, next } = await res.json();

  all.push(...posts);
  cursor = next; // null when no more pages
} while (cursor);
```

## Query Parameters the Clean Way

Don't build query strings with string concatenation — use `URLSearchParams`:

```js
const params = new URLSearchParams({
  q: 'react hooks',
  sort: 'newest',
  limit: '20',
});

const response = await fetch(`/api/search?${params}`);
```

This handles encoding special characters automatically (spaces → `%20`, `&` inside values, etc.).

## Types of APIs (Quick Reference)

Modern web development mostly uses **REST** and increasingly **GraphQL**, but you'll encounter others:

- **REST** — resource-oriented, HTTP verbs, JSON responses. The dominant choice for new APIs.
- **GraphQL** — single endpoint, client specifies exact data shape. Great when over-fetching is a real problem (mobile apps, complex dashboards).
- **gRPC** — binary protocol, extremely fast, used mostly in backend microservices.
- **WebSockets** — bidirectional, persistent connection. Use for chat, live dashboards, collaborative editing.
- **SOAP** — XML-based, mostly legacy enterprise. You'll encounter it integrating with older systems.

For 90% of frontend work, REST is the right default. Reach for GraphQL when your data model is genuinely complex and you need that precision.

## Summary

- Always check `response.ok` — fetch only rejects on network failure, not bad status codes.
- Set `Content-Type: application/json` when POSTing JSON.
- Pass tokens in the `Authorization` header.
- Use `URLSearchParams` for clean query strings.
- The `cancelled` flag pattern prevents state updates after unmount in React hooks.
- `204 No Content` responses have no body — don't try to parse them.

These patterns cover the vast majority of what you'll need when integrating any third-party or internal API.
