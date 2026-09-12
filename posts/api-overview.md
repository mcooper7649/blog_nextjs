---
title: 'REST APIs in Practice: Consuming and Building Them with JavaScript'
date: '2026-09-12'
image: api-main.png
excerpt: APIs are the backbone of every modern web app. Here is a practical guide to what they are, how to consume them with fetch and axios, and how to build your own with Express.
isFeatured: true
---

## What is an API?

An API (Application Programming Interface) is a contract that lets two pieces of software talk to each other. When your React front end loads user data, or when an n8n workflow pings a webhook, both are making API calls — sending a request to an agreed-upon endpoint and receiving a structured response.

For web development, the API you'll work with almost every day is the **REST API** — a stateless, resource-based style built on top of HTTP.

---

## REST in One Paragraph

REST stands for **Representational State Transfer**. It isn't a protocol like SOAP; it's a set of architectural constraints:

- **Resources** are identified by URLs — `/users/42`, `/posts`, `/orders/99/items`.
- **HTTP verbs** express intent — `GET` reads, `POST` creates, `PUT`/`PATCH` updates, `DELETE` removes.
- **Stateless** — every request carries all the context the server needs; there's no session stored on the server between calls.
- **JSON** is the de-facto payload format today (XML still exists but is rare in new APIs).

---

## Consuming a REST API with `fetch`

The browser's built-in `fetch` API is all you need to start hitting endpoints.

### Basic GET request

```js
async function getUser(id) {
  const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const user = await res.json();
  return user;
}

const user = await getUser(1);
console.log(user.name); // "Leanne Graham"
```

Always check `res.ok` before calling `.json()`. A 404 or 500 still resolves the promise — `fetch` only rejects on network errors, not HTTP error codes.

### POST request with a JSON body

```js
async function createPost(title, body, userId) {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body, userId }),
  });

  if (!res.ok) throw new Error(`Failed to create post: ${res.status}`);
  return res.json(); // returns the newly created resource
}
```

### Adding an auth header

Most real APIs require a bearer token:

```js
const res = await fetch('https://api.example.com/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

### Query parameters

Build query strings with `URLSearchParams` — it handles encoding automatically:

```js
const params = new URLSearchParams({ page: 2, limit: 10, sort: 'createdAt' });
const res = await fetch(`https://api.example.com/posts?${params}`);
```

---

## Using `axios` for Cleaner Code

`axios` is a popular HTTP client that wraps `fetch` with useful defaults: it throws on non-2xx status codes automatically, parses JSON by default, and makes interceptors easy.

```bash
npm install axios
```

```js
import axios from 'axios';

// Create a reusable instance with a base URL and default headers
const api = axios.create({
  baseURL: 'https://api.example.com',
  headers: { Authorization: `Bearer ${process.env.REACT_APP_API_TOKEN}` },
});

// GET
const { data: posts } = await api.get('/posts', { params: { page: 1 } });

// POST
const { data: newPost } = await api.post('/posts', { title: 'Hello', body: '...' });

// DELETE
await api.delete(`/posts/${id}`);
```

The main practical difference from `fetch`:

| Feature | `fetch` | `axios` |
|---|---|---|
| Throws on 4xx/5xx | No (check `res.ok`) | Yes (automatic) |
| JSON parsing | Manual (`.json()`) | Automatic (`data`) |
| Request interceptors | DIY wrapper | Built-in |
| Upload progress | No | Yes |
| Node.js support | Node 18+ native | Any version |

---

## Building Your Own REST Endpoint with Express

Consuming APIs is step one. Understanding how to build one closes the loop.

### Minimal Express setup

```bash
mkdir my-api && cd my-api
npm init -y
npm install express
```

```js
// server.js
import express from 'express';

const app = express();
app.use(express.json()); // parse JSON bodies

// In-memory store (replace with a real DB in production)
let posts = [
  { id: 1, title: 'First post', body: 'Hello world' },
];

// GET all posts
app.get('/posts', (req, res) => {
  res.json(posts);
});

// GET one post
app.get('/posts/:id', (req, res) => {
  const post = posts.find(p => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: 'Not found' });
  res.json(post);
});

// POST — create
app.post('/posts', (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'title and body required' });

  const post = { id: posts.length + 1, title, body };
  posts.push(post);
  res.status(201).json(post);
});

// PATCH — partial update
app.patch('/posts/:id', (req, res) => {
  const idx = posts.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  posts[idx] = { ...posts[idx], ...req.body };
  res.json(posts[idx]);
});

// DELETE
app.delete('/posts/:id', (req, res) => {
  const idx = posts.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  posts.splice(idx, 1);
  res.status(204).end();
});

app.listen(3001, () => console.log('API running on http://localhost:3001'));
```

```json
// package.json (add this)
{ "type": "module" }
```

Test it straight from the terminal:

```bash
# GET all
curl http://localhost:3001/posts

# POST
curl -X POST http://localhost:3001/posts \
  -H 'Content-Type: application/json' \
  -d '{"title":"My post","body":"Some content"}'

# PATCH
curl -X PATCH http://localhost:3001/posts/1 \
  -H 'Content-Type: application/json' \
  -d '{"title":"Updated title"}'

# DELETE
curl -X DELETE http://localhost:3001/posts/1
```

---

## HTTP Status Codes to Know

Return the right status codes — clients (and other devs) depend on them:

| Code | Meaning | When to use |
|------|---------|-------------|
| 200 | OK | Successful GET or PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input, missing fields |
| 401 | Unauthorized | No/invalid auth token |
| 403 | Forbidden | Authenticated but not allowed |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource, version mismatch |
| 422 | Unprocessable Entity | Validation failed |
| 500 | Internal Server Error | Unhandled server crash |

---

## Other API Styles (Quick Reference)

REST isn't the only option — you'll encounter these too:

- **GraphQL** — query exactly the fields you need in a single request. No over-fetching. Better for complex data graphs, harder to cache, steeper learning curve. Used by GitHub's API.
- **tRPC** — end-to-end type-safe procedure calls between a TypeScript server and client. Feels like calling local functions; great for full-stack TypeScript monorepos (e.g., a Next.js app).
- **gRPC** — uses Protocol Buffers and HTTP/2. Fast, binary, strongly typed. Common in microservice backends, less common in browser-facing APIs.
- **SOAP** — XML-based, heavy, largely legacy. You'll find it in enterprise and banking integrations.

For a new greenfield project: start with REST, evaluate GraphQL or tRPC if you're building a complex front end with many data shapes.

---

## Summary

1. REST APIs are resource-based, stateless, and use HTTP verbs to express intent.
2. Use `fetch` for simple cases; `axios` when you need interceptors, automatic error throwing, or wider Node.js compatibility.
3. Always handle non-2xx responses explicitly — `fetch` won't do it for you.
4. Return the right HTTP status codes from your own endpoints — `201` for creates, `204` for deletes, `400`/`404`/`422` for client errors.
5. `URLSearchParams` is your friend for building query strings safely.
