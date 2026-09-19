---
title: 'Application Programming Interfaces'
date: '2022-06-06'
image: api-main.png
excerpt: API stands for application programming interface, a concept that applies everywhere from command-line tools to enterprise Java code to Ruby on Rails web apps. An API is a way to programmatically interact with a separate software component or resource.
isFeatured: true
---

## What is an API?

An API (Application Programming Interface) is a contract between two pieces of software. One side says "here's what I can do and how to ask me" — the other side calls it without needing to know how it works internally.

You interact with APIs constantly: when a weather widget fetches a forecast, when you log in with Google, when your app saves data to a backend. The browser's own `fetch`, DOM methods, and Node's built-in modules are all APIs too.

## REST: The Dominant Style for Web APIs

REST (Representational State Transfer) isn't a protocol — it's a set of architectural constraints that map naturally onto HTTP. Most public APIs and virtually all modern backend services speak REST.

### The key ideas

- **Resources over actions** — URLs name *things*, not operations. `/users/42` beats `/getUser?id=42`.
- **HTTP verbs carry intent** — `GET` reads, `POST` creates, `PUT`/`PATCH` updates, `DELETE` removes.
- **Stateless** — every request carries all the context the server needs; no session state is stored server-side between calls.
- **Uniform interface** — consistent URL patterns and status codes let clients be written generically.

### HTTP status codes you'll use every day

| Range | Meaning | Common codes |
|-------|---------|--------------|
| 2xx | Success | 200 OK, 201 Created, 204 No Content |
| 3xx | Redirect | 301 Moved Permanently, 304 Not Modified |
| 4xx | Client error | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Unprocessable Entity |
| 5xx | Server error | 500 Internal Server Error, 503 Service Unavailable |

## Calling a REST API with `fetch`

Modern JavaScript makes consuming an API straightforward. Here's a reusable helper that handles JSON, throws on error status codes, and types the response:

```ts
// lib/api.ts
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// GET
const user = await apiFetch<{ id: number; name: string }>('/api/users/42');

// POST with a body
const newPost = await apiFetch<{ id: number }>('/api/posts', {
  method: 'POST',
  body: JSON.stringify({ title: 'Hello', body: 'World' }),
});
```

## Building a REST Endpoint in Node.js

If you're using Next.js API routes (Pages Router), a resource endpoint looks like this:

```ts
// pages/api/users/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';

type User = { id: number; name: string; email: string };

const USERS: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob',   email: 'bob@example.com' },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Number(req.query.id);
  const user = USERS.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  switch (req.method) {
    case 'GET':
      return res.status(200).json(user);

    case 'PATCH': {
      const updated = { ...user, ...req.body, id }; // id is immutable
      return res.status(200).json(updated);
    }

    case 'DELETE':
      return res.status(204).end();

    default:
      res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
```

A few things to notice:
- The status code is explicit and meaningful on every path.
- A `DELETE` returns `204 No Content` (no body needed after successful deletion).
- Unknown methods get `405 Method Not Allowed` with an `Allow` header — this is what the spec requires.

## Authentication Patterns

Most production APIs gate endpoints behind authentication. Two common approaches:

**Bearer token (JWT)** — the client sends `Authorization: Bearer <token>` on every request. The server verifies the token's signature without a database lookup. Stateless and scales well; token revocation requires a blocklist or short expiry.

```ts
const res = await fetch('/api/protected', {
  headers: { Authorization: `Bearer ${token}` },
});
```

**API key** — simpler, often used for server-to-server calls where you own both sides. Send it in a header (`X-API-Key`) rather than a query param so it stays out of server logs.

Never put credentials in a URL query string — they end up in access logs, browser history, and referrer headers.

## GraphQL: When REST Gets Chatty

REST shines for simple CRUD resources. It starts to strain when:
- A single UI view needs data from five different endpoints.
- Mobile clients need smaller payloads than desktop.
- Relationships between resources are deep and variable.

GraphQL solves this with a single endpoint that accepts a typed query describing exactly the shape you need:

```graphql
query GetUserWithPosts($id: ID!) {
  user(id: $id) {
    name
    email
    posts(last: 3) {
      title
      publishedAt
    }
  }
}
```

The server returns only what was asked for — no over-fetching, no under-fetching. The tradeoff: more complex server setup, a steeper learning curve, and caching is trickier (no plain HTTP cache for POST requests).

## Other Styles Worth Knowing

| Style | Format | When to consider |
|-------|--------|-----------------|
| **REST** | JSON over HTTP | Default choice for web/mobile APIs |
| **GraphQL** | JSON over HTTP (POST) | Complex, nested data; multiple clients with different needs |
| **gRPC** | Protocol Buffers over HTTP/2 | Internal microservices; high-throughput, low-latency |
| **WebSockets** | Binary/text frames | Real-time features (chat, live dashboards, multiplayer) |
| **SOAP** | XML over HTTP | Legacy enterprise integrations |

## Practical Tips

- **Version your API** — prefix routes with `/v1/` so you can evolve without breaking existing clients.
- **Return consistent error shapes** — `{ error: string; code?: string }` everywhere, not a mix of formats.
- **Validate inputs early** — reject bad data at the boundary with a 422, not a 500 deep inside your logic. A library like [Zod](/posts/zod-runtime-validation) makes this clean.
- **Use HTTPS everywhere** — plain HTTP exposes credentials and request bodies to anyone on the network path.
- **Paginate collections** — never return unbounded lists; use cursor or offset pagination with a `limit` param.

APIs are the backbone of modern software. Whether you're consuming a third-party service or designing your own backend, understanding REST conventions and HTTP semantics will save you hours of debugging and keep your clients predictable.
