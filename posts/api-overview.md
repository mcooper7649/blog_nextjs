---
title: 'REST APIs in JavaScript: A Practical Field Guide'
date: '2022-06-06'
image: api-main.png
excerpt: From fetch() basics to typed TypeScript responses, error handling, and authentication — everything you need to consume REST APIs confidently in modern JavaScript.
isFeatured: true
belt: white
---

Every web app eventually talks to an API. Whether you're pulling weather data, posting a comment, or refreshing a list of orders, the mechanism is the same: your client sends an HTTP request and waits for a response. Understanding how that works — and where it breaks — is one of the most broadly useful skills in web development.

## What Is a REST API?

REST (Representational State Transfer) is an architectural style for designing HTTP services. A REST API exposes **resources** — things like users, posts, or orders — through predictable URLs, and uses standard HTTP verbs to describe what you want to do to them:

| Verb | Meaning | Example URL |
|------|---------|------------|
| `GET` | Read a resource | `GET /users/42` |
| `POST` | Create a resource | `POST /users` |
| `PUT` | Replace a resource | `PUT /users/42` |
| `PATCH` | Partially update | `PATCH /users/42` |
| `DELETE` | Delete a resource | `DELETE /users/42` |

The server responds with an HTTP status code that tells you what happened (200 OK, 201 Created, 404 Not Found, 500 Internal Server Error, etc.) and usually a JSON body.

## Making Your First Request with fetch

The browser's built-in `fetch` API is the standard way to make HTTP requests. It returns a Promise that resolves to a `Response` object:

```js
// Basic GET request
const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
const post = await response.json();

console.log(post.title); // "sunt aut facere repellat..."
```

Two `await` calls — one to get the response headers, one to read and parse the body. That two-step design is intentional: you might want to inspect headers before deciding whether to parse the body at all.

## Always Check the Status Code

`fetch` only rejects the Promise for network-level failures (no connection, DNS error). A 404 or 500 **does not reject** — you get a resolved Response whose `ok` property is `false`. This is the most common `fetch` gotcha:

```js
async function getPost(id) {
  const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return response.json();
}

try {
  const post = await getPost(1);
  console.log(post.title);
} catch (err) {
  console.error('Failed to load post:', err.message);
}
```

This pattern — check `response.ok`, throw on failure, `catch` at the call site — is the baseline you want everywhere.

## POST, PUT, and PATCH Requests

Any request with a body needs a `Content-Type` header and the body serialised as a string:

```js
async function createPost(data) {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create post: ${response.status}`);
  }

  return response.json(); // returns the created object (usually with an `id`)
}

const newPost = await createPost({
  title: 'Hello from fetch',
  body: 'Using the REST API directly.',
  userId: 1,
});

console.log(newPost.id); // 101
```

`PATCH` works identically but you only send the fields you want to update. `DELETE` usually has no body at all:

```js
await fetch('https://jsonplaceholder.typicode.com/posts/1', {
  method: 'DELETE',
});
```

## Sending Authentication Headers

Most real APIs require authentication. The two most common mechanisms are API keys and Bearer tokens (JWTs, OAuth access tokens):

```js
// API key in a header
const response = await fetch('https://api.example.com/data', {
  headers: {
    'X-API-Key': process.env.NEXT_PUBLIC_API_KEY,
  },
});

// Bearer token (OAuth / JWT)
const response = await fetch('https://api.example.com/me', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

Never put secret API keys in client-side code. If the key is secret it must stay on the server — in a Next.js API route, an Edge Function, or a backend service. `NEXT_PUBLIC_` variables are bundled into the browser; anything without that prefix stays server-side.

## Typing API Responses in TypeScript

Once you're in TypeScript, it's worth typing your responses. `response.json()` returns `Promise<any>` by default, which throws away the type information you worked hard to have. The fix is a small typed wrapper:

```ts
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }

  return response.json() as Promise<T>;
}

// Now every call site is typed
interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

const post = await fetchJson<Post>('https://jsonplaceholder.typicode.com/posts/1');
console.log(post.title); // TypeScript knows this is a string
```

This is a casting approach — the runtime still trusts whatever the server sends. If you want a **runtime guarantee** that the shape is correct, reach for [Zod](https://blog.mycodedojo.com/posts/zod-runtime-validation):

```ts
import { z } from 'zod';

const PostSchema = z.object({
  id: z.number(),
  userId: z.number(),
  title: z.string(),
  body: z.string(),
});

async function getPost(id: number) {
  const raw = await fetchJson(`https://jsonplaceholder.typicode.com/posts/${id}`);
  return PostSchema.parse(raw); // throws a ZodError if the shape is wrong
}
```

## Handling Errors Gracefully in React

In a React component you usually have three states to handle: loading, error, and data. The cleanest way to manage this is with [TanStack Query](https://blog.mycodedojo.com/posts/tanstack-query-server-state), but here's the plain `useEffect` pattern for reference:

```tsx
import { useState, useEffect } from 'react';

interface Post {
  id: number;
  title: string;
  body: string;
}

function PostDetail({ id }: { id: number }) {
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Post = await res.json();
        if (!cancelled) setPost(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Error: {error}</p>;
  if (!post) return null;

  return (
    <article>
      <h2>{post.title}</h2>
      <p>{post.body}</p>
    </article>
  );
}
```

The `cancelled` flag prevents a state update after the component unmounts — a common source of "Can't perform a React state update on an unmounted component" warnings.

## Common HTTP Status Codes

You'll encounter these constantly when debugging API calls:

| Code | Name | When to expect it |
|------|------|-------------------|
| 200 | OK | Successful GET, PATCH, or DELETE |
| 201 | Created | Successful POST that created a resource |
| 204 | No Content | Success with no response body (common for DELETE) |
| 400 | Bad Request | You sent invalid data |
| 401 | Unauthorized | Missing or invalid credentials |
| 403 | Forbidden | Authenticated but not permitted |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource or a state conflict |
| 422 | Unprocessable Entity | Validation error (common in REST APIs) |
| 429 | Too Many Requests | Rate limited — back off and retry |
| 500 | Internal Server Error | Bug on the server |
| 503 | Service Unavailable | Server is overloaded or down |

## Retry Logic and Timeouts

`fetch` has no built-in timeout. For anything important, add an `AbortController`:

```js
async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
}
```

For retries on transient errors (429, 503, network failures), a simple exponential backoff works well:

```js
async function fetchWithRetry(url, options = {}, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`Retryable error: ${res.status}`);
      }
      return res;
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      await new Promise(r => setTimeout(r, 2 ** attempt * 200)); // 400ms, 800ms, 1600ms
    }
  }
}
```

## REST vs GraphQL: A Quick Take

REST is predictable and well-tooled — every HTTP client speaks it. Its weakness is over-fetching (getting fields you don't need) and under-fetching (making multiple round trips to assemble one screen's data).

GraphQL solves both by letting the client declare exactly what it needs in a single query. The tradeoff is complexity: a custom query language, a schema to maintain, and a resolver layer on the server. For apps with many different clients or complex data graphs, it's worth it. For a straightforward CRUD API, REST is usually simpler to build, debug, and cache.

Most public APIs are REST; most teams start with REST and add GraphQL if they hit the pain points REST can't solve.

---

The essentials come down to: always check `response.ok`, handle loading and error states explicitly, keep secrets off the client, and type your responses. Everything else — retries, caching, auth refresh — layers on top of those fundamentals.
