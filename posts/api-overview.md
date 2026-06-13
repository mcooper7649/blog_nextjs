---
title: "REST APIs in Practice: A JavaScript Developer's Guide"
date: '2026-06-13'
image: api-main.png
excerpt: APIs are the connective tissue of modern web apps. Here is a practical guide to how REST APIs work, the HTTP verbs and status codes you actually need, and how to consume them cleanly from JavaScript.
isFeatured: true
---

If you write JavaScript for a living you call APIs constantly — fetching user data, posting form submissions, pulling real-time quotes. Understanding what is happening beneath the abstraction layers makes you faster at debugging and better at designing your own endpoints. This guide covers the core concepts without the theory overload, then gets into real consumption patterns you can copy into your next project.

## What Is a REST API?

REST (Representational State Transfer) is an architectural style, not a protocol. A REST API exposes **resources** (users, products, orders) at stable URLs and lets clients manipulate them using standard HTTP methods. The client and server stay loosely coupled: the server does not store any session state between requests, and the client discovers everything it needs from the response.

The key constraints:

- **Stateless** — each request carries everything the server needs (auth token, params). No server-side sessions.
- **Uniform interface** — resources live at consistent URLs; HTTP verbs convey the action.
- **Representations** — resources are returned as JSON (or XML, though JSON dominates), not the internal model itself.

## HTTP Methods and When to Use Each

| Method | Safe? | Idempotent? | Typical use |
|--------|-------|-------------|-------------|
| `GET` | ✅ | ✅ | Read a resource or collection |
| `POST` | ❌ | ❌ | Create a new resource |
| `PUT` | ❌ | ✅ | Replace a resource entirely |
| `PATCH` | ❌ | ❌* | Update specific fields |
| `DELETE` | ❌ | ✅ | Remove a resource |

*PATCH is only idempotent if the operation is absolute (set field = value), not relative (increment field by 1).

**Safe** means no side-effects; **idempotent** means calling it twice has the same effect as calling it once. These properties matter when you retry failed requests.

## Status Codes You Will Actually Encounter

You do not need to memorise all 70+ HTTP status codes. These are the ones that come up in real work:

- `200 OK` — successful GET, PATCH, PUT
- `201 Created` — successful POST; the `Location` header often points to the new resource
- `204 No Content` — successful DELETE (or action) with nothing to return
- `400 Bad Request` — the client sent malformed JSON or failed validation
- `401 Unauthorized` — missing or invalid credentials
- `403 Forbidden` — authenticated, but not allowed to do this
- `404 Not Found` — resource does not exist
- `409 Conflict` — constraint violation (e.g., duplicate email)
- `422 Unprocessable Entity` — syntactically valid JSON but semantically wrong
- `429 Too Many Requests` — rate limited; check the `Retry-After` header
- `500 Internal Server Error` — the server broke; not your fault

## Consuming APIs with `fetch`

The browser `fetch` API is the baseline. Here is a minimal GET with proper error handling:

```js
async function getUser(id) {
  const res = await fetch(`https://api.example.com/users/${id}`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    // res.ok is true for 200–299 only
    const body = await res.json().catch(() => ({}));
    throw new Error(`API error ${res.status}: ${body.message ?? 'unknown'}`);
  }

  return res.json();
}
```

A common mistake is checking `catch` only for network errors and ignoring 4xx/5xx responses — `fetch` only rejects the promise on network failures, not on error status codes. Always check `res.ok`.

## Authentication Patterns

### API Key in a Header

Most public APIs use a static key. Keep it out of your source code — read it from an environment variable.

```js
const res = await fetch('https://api.example.com/data', {
  headers: {
    'X-API-Key': process.env.API_KEY,
    'Accept': 'application/json',
  },
});
```

### Bearer Token (JWT)

APIs that require user-specific access typically use a short-lived JWT issued after login:

```js
const res = await fetch('https://api.example.com/me', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  },
});
```

When the token expires the server returns `401`. Your client should detect this, attempt a silent refresh using a refresh token, then retry the original request. Most auth SDKs (e.g., Supabase, Auth0) handle this automatically.

## Sending a POST Request

```js
async function createPost(title, body, authorId) {
  const res = await fetch('https://api.example.com/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ title, body, authorId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `POST failed with ${res.status}`);
  }

  // 201 Created — the server returns the new resource
  return res.json();
}
```

## A Real Example: JSONPlaceholder

[JSONPlaceholder](https://jsonplaceholder.typicode.com) is a free fake REST API useful for prototyping. Here is a small React component that fetches a list of posts:

```jsx
import { useEffect, useState } from 'react';

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setPosts(await res.json());
      } catch (e) {
        setError(e.message);
      }
    }
    load();
  }, []);

  if (error) return <p>Error: {error}</p>;

  return (
    <ul>
      {posts.map((p) => (
        <li key={p.id}>{p.title}</li>
      ))}
    </ul>
  );
}
```

In a real Next.js project, prefer `fetch` inside a Server Component or a Route Handler instead of `useEffect` — you get caching and deduplication for free.

## Rate Limiting and Retrying

Most APIs throttle requests. When you get a `429`, read the `Retry-After` header (value is seconds) before retrying:

```js
async function fetchWithRetry(url, options, retries = 3) {
  const res = await fetch(url, options);

  if (res.status === 429 && retries > 0) {
    const wait = parseInt(res.headers.get('Retry-After') ?? '5', 10) * 1000;
    await new Promise((r) => setTimeout(r, wait));
    return fetchWithRetry(url, options, retries - 1);
  }

  return res;
}
```

For general network failures, use exponential backoff: wait 1s after the first failure, 2s after the second, 4s after the third.

## Quick Reference

```
GET    /posts          → list all posts
GET    /posts/42       → get post 42
POST   /posts          → create a post (body: JSON payload)
PATCH  /posts/42       → update fields on post 42
PUT    /posts/42       → replace post 42 entirely
DELETE /posts/42       → delete post 42
```

REST APIs follow this pattern across virtually every domain. Once you have the mental model — resources at stable URLs, verbs express intent, status codes signal outcome — reading unfamiliar API docs becomes much faster.
