---
title: 'REST APIs in Practice: Design, Build, and Consume Them in Node.js'
date: '2026-09-27'
image: api-main.png
excerpt: A practical guide to REST API design principles, building endpoints with Express, handling errors consistently, and consuming APIs from the browser.
isFeatured: true
---

## What Is an API?

An API (Application Programming Interface) is a contract between two pieces of software. One side promises to accept requests in a specific format and return responses in a predictable shape. The other side agrees to follow that contract.

On the web, that contract almost always means REST — stateless HTTP requests and JSON responses. This post covers what you actually need to know to design, build, and consume REST APIs in a Node.js project.

## REST in Plain English

REST (Representational State Transfer) is a set of architectural constraints, not a protocol. The key ones in practice:

- **Stateless** — every request carries everything the server needs; no session state lives on the server between requests.
- **Resource-oriented** — you model your domain as nouns (`/posts`, `/users/42`) and use HTTP verbs to express intent.
- **Uniform interface** — consistent URL patterns and status codes so consumers can reason about any endpoint before reading its docs.

That's it. The four-verb mapping:

| Verb     | Action         | Example             |
|----------|----------------|---------------------|
| `GET`    | Read           | `GET /posts`        |
| `POST`   | Create         | `POST /posts`       |
| `PUT`    | Replace whole  | `PUT /posts/42`     |
| `PATCH`  | Partial update | `PATCH /posts/42`   |
| `DELETE` | Remove         | `DELETE /posts/42`  |

## Building an API with Express

Install dependencies:

```bash
npm install express
npm install -D @types/express   # if using TypeScript
```

A minimal posts API:

```js
// server.js
import express from 'express';

const app = express();
app.use(express.json());

const posts = [
  { id: 1, title: 'Hello World', published: true },
  { id: 2, title: 'REST APIs', published: false },
];

// GET /posts — list (support ?published= filter)
app.get('/posts', (req, res) => {
  const { published } = req.query;
  const result =
    published !== undefined
      ? posts.filter((p) => String(p.published) === published)
      : posts;
  res.json(result);
});

// GET /posts/:id — single resource
app.get('/posts/:id', (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

// POST /posts — create
app.post('/posts', (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const newPost = { id: posts.length + 1, title, published: false };
  posts.push(newPost);
  res.status(201).json(newPost);
});

// PATCH /posts/:id — partial update
app.patch('/posts/:id', (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });

  Object.assign(post, req.body);
  res.json(post);
});

// DELETE /posts/:id
app.delete('/posts/:id', (req, res) => {
  const idx = posts.findIndex((p) => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });

  posts.splice(idx, 1);
  res.status(204).send();
});

app.listen(3001, () => console.log('API listening on :3001'));
```

Run it: `node server.js`, then test with curl:

```bash
# List all posts
curl http://localhost:3001/posts

# Get only published posts
curl "http://localhost:3001/posts?published=true"

# Create a post
curl -X POST http://localhost:3001/posts \
  -H 'Content-Type: application/json' \
  -d '{"title": "Docker Tips"}'

# Publish it (id=3)
curl -X PATCH http://localhost:3001/posts/3 \
  -H 'Content-Type: application/json' \
  -d '{"published": true}'

# Delete it
curl -X DELETE http://localhost:3001/posts/3
```

## Consistent Error Handling

Scattered `res.status(400).json({ error: ... })` calls work but get messy. A small error middleware keeps error responses uniform:

```js
// Throw this from route handlers
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Wrap async handlers so thrown errors propagate
const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Register after all routes
app.use((err, req, res, next) => {
  const status = err.status ?? 500;
  const message = status < 500 ? err.message : 'Internal server error';
  res.status(status).json({ error: message });
});
```

Usage in a route:

```js
app.get('/posts/:id', asyncRoute(async (req, res) => {
  const post = await db.findPost(req.params.id);
  if (!post) throw new ApiError(404, 'Post not found');
  res.json(post);
}));
```

## Status Codes That Actually Matter

You don't need to memorize all 70+ HTTP status codes. These ten cover almost every API:

| Code | Meaning |
|------|---------|
| 200  | OK — generic success |
| 201  | Created — use after POST that creates a resource |
| 204  | No Content — success with no body (DELETE) |
| 400  | Bad Request — caller sent invalid data |
| 401  | Unauthorized — missing or invalid credentials |
| 403  | Forbidden — authenticated but not allowed |
| 404  | Not Found — resource doesn't exist |
| 409  | Conflict — e.g. unique constraint violation |
| 422  | Unprocessable Entity — validation failure |
| 500  | Internal Server Error — something broke on the server |

The most common mistake is returning 200 with `{ success: false }` in the body. HTTP status codes exist so that callers — including load balancers, monitoring tools, and `fetch` — can reason about outcomes without parsing JSON.

## Consuming an API from React

`fetch` is built into every modern browser. A simple hook that handles loading and error states:

```js
import { useState, useEffect } from 'react';

function usePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/posts')
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      })
      .then(setPosts)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { posts, loading, error };
}
```

For anything beyond a quick prototype, reach for [TanStack Query](https://tanstack.com/query) — it handles caching, refetching on window focus, and background updates automatically.

## URL Design Rules of Thumb

- Use plural nouns for collections: `/posts`, not `/post` or `/getPost`.
- Nest resources only one level deep: `/users/42/posts` is fine, `/users/42/posts/7/comments/3` is too deep — just use `/comments/3`.
- Use query parameters for filtering, sorting, and pagination: `/posts?tag=docker&sort=date&page=2`.
- Keep verbs out of the URL — the HTTP method is the verb.

## Authentication: Adding JWT Headers

For protected endpoints, the client sends a token in the `Authorization` header:

```js
// Client
const res = await fetch('/api/me', {
  headers: { Authorization: `Bearer ${token}` },
});
```

On the server, a middleware reads and verifies it:

```js
import jwt from 'jsonwebtoken';

function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Protect a route
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ userId: req.user.sub });
});
```

## Wrapping Up

The short version:

1. Model your domain as resources and use HTTP verbs correctly.
2. Return the right status codes — don't bury errors inside 200 responses.
3. Keep error shapes consistent with a central error middleware.
4. On the client, `fetch` is fine for simple cases; TanStack Query is worth it for anything real.
5. Protect endpoints with JWT middleware once you add user accounts.

REST APIs are not complicated once the conventions click. The hardest part is staying disciplined — resisting the urge to create `/doTheThing` endpoints instead of modeling the underlying resource properly.
