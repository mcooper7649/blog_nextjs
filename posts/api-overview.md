---
title: 'REST APIs in Practice: A Practical JavaScript Guide'
date: '2026-10-17'
image: api-main.png
excerpt: A practical walkthrough of REST APIs for JavaScript developers — HTTP methods, status codes, fetch, error handling, auth headers, and building your own endpoints with Next.js.
isFeatured: true
belt: white
---

## What is a REST API?

An API (Application Programming Interface) is a contract between two pieces of software. One side says "send me data in this shape," the other side says "here is the response you'll get back." The two sides never need to know how the other is built internally.

REST (Representational State Transfer) is the dominant style for web APIs today. It's not a protocol or a specification — it's a set of architectural constraints that make APIs predictable and easy to work with:

- **Stateless** — every request carries all the information the server needs; no session lives on the server between requests.
- **Resource-based** — you address nouns (`/users`, `/posts/42`), not verbs (`/getUser`, `/createPost`).
- **Uniform interface** — the same four HTTP methods apply to every resource.

---

## The Four HTTP Methods You'll Actually Use

| Method | Meaning | Typical status on success |
|--------|---------|--------------------------|
| `GET` | Read a resource | 200 OK |
| `POST` | Create a new resource | 201 Created |
| `PUT` / `PATCH` | Update an existing resource | 200 OK |
| `DELETE` | Remove a resource | 204 No Content |

`PUT` replaces the entire resource; `PATCH` sends only the fields that changed. In practice, most APIs accept either.

---

## Consuming an API with `fetch`

The browser's built-in `fetch` function is all you need for GET requests:

```js
async function getPosts() {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts');

  if (!res.ok) {
    throw new Error(`HTTP error: ${res.status}`);
  }

  const posts = await res.json();
  return posts; // array of post objects
}
```

The key check is `res.ok` (true when status is 200–299). `fetch` does **not** throw on 4xx/5xx — it only rejects on network failure. Always check `res.ok` before calling `res.json()`.

### POST with a JSON body

```js
async function createPost(title, body, userId) {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body, userId }),
  });

  if (!res.ok) {
    throw new Error(`Failed to create post: ${res.status}`);
  }

  return res.json(); // returns the newly created object (with id)
}
```

### PUT / PATCH to update

```js
async function updatePost(id, patch) {
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });

  if (!res.ok) throw new Error(`Update failed: ${res.status}`);
  return res.json();
}
```

### DELETE

```js
async function deletePost(id) {
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  // 204 No Content — no body to parse
}
```

---

## Authentication

Most real-world APIs require authentication. The two most common patterns:

### Bearer token (JWT / OAuth)

```js
const res = await fetch('https://api.example.com/me', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
});
```

### API key in a header

```js
const res = await fetch('https://api.example.com/data', {
  headers: {
    'X-API-Key': process.env.NEXT_PUBLIC_API_KEY,
  },
});
```

Never hardcode keys in client-side code. Prefix with `NEXT_PUBLIC_` only if the key is safe to expose to browsers — otherwise call the API from a Next.js Route Handler so the key stays server-side.

---

## HTTP Status Codes Worth Knowing

You'll encounter these constantly when consuming or building APIs:

| Code | Meaning | Notes |
|------|---------|-------|
| 200 | OK | Generic success |
| 201 | Created | Resource was created (POST) |
| 204 | No Content | Success with no body (DELETE) |
| 400 | Bad Request | Malformed body or missing fields |
| 401 | Unauthorized | Missing or invalid credentials |
| 403 | Forbidden | Authenticated but lacks permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (e.g. email taken) |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate-limited — back off and retry |
| 500 | Internal Server Error | Bug on the server side |

---

## A Reusable `apiFetch` Wrapper

Writing `if (!res.ok)` on every call gets old fast. Here's a small wrapper I use:

```ts
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(res.status, body || res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// Usage
const user = await apiFetch<User>('/api/users/42');
const newPost = await apiFetch<Post>('/api/posts', {
  method: 'POST',
  body: JSON.stringify({ title: 'Hello', body: 'World' }),
});
```

Now you get typed responses and automatic error throwing everywhere.

---

## Building a REST API with Next.js Route Handlers

Next.js App Router makes it straightforward to build your own API alongside your UI. Create a file at `app/api/posts/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';

const posts: { id: number; title: string; body: string }[] = [];
let nextId = 1;

export async function GET() {
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const { title, body } = await req.json();

  if (!title || !body) {
    return NextResponse.json(
      { error: 'title and body are required' },
      { status: 400 }
    );
  }

  const post = { id: nextId++, title, body };
  posts.push(post);

  return NextResponse.json(post, { status: 201 });
}
```

For a single-resource route at `app/api/posts/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const post = posts.find(p => p.id === Number(params.id));
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(post);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const idx = posts.findIndex(p => p.id === Number(params.id));
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  posts.splice(idx, 1);
  return new NextResponse(null, { status: 204 });
}
```

This gives you a proper REST interface:

```
GET    /api/posts       → 200 with array
POST   /api/posts       → 201 with new post
GET    /api/posts/42    → 200 or 404
DELETE /api/posts/42    → 204 or 404
```

---

## REST vs GraphQL: When to Use Which

GraphQL gets a lot of attention, but REST is still the right default for most projects.

**Use REST when:**
- You're building or consuming a simple CRUD API
- You want standard HTTP caching (CDN, `Cache-Control` headers)
- Your team is small and moving fast
- You're integrating with third-party APIs (they're almost always REST)

**Consider GraphQL when:**
- Clients have very different data-shape needs (mobile vs web vs partner)
- You're experiencing "over-fetching" — repeatedly getting huge objects when you only need two fields
- Your data graph is genuinely complex (deeply nested relations, many-to-many)

GraphQL adds real complexity (schema definition, resolvers, a type system, client libraries). Make sure the tradeoff is worth it before reaching for it.

---

## Quick Reference

A cheat sheet for common patterns:

```js
// GET list
const items = await apiFetch('/api/items');

// GET single
const item = await apiFetch('/api/items/1');

// POST create
const created = await apiFetch('/api/items', {
  method: 'POST',
  body: JSON.stringify({ name: 'New Item' }),
});

// PATCH partial update
const updated = await apiFetch('/api/items/1', {
  method: 'PATCH',
  body: JSON.stringify({ name: 'Updated Name' }),
});

// DELETE
await apiFetch('/api/items/1', { method: 'DELETE' });
```

REST APIs are everywhere in modern web development. Understanding the conventions — resources, HTTP methods, status codes, and authentication patterns — makes you faster at both consuming third-party services and designing your own.
