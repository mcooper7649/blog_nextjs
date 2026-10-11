---
title: 'REST APIs in JavaScript: A Practical Guide'
date: '2026-10-11'
image: api-main.png
excerpt: Learn how to consume REST APIs in vanilla JavaScript and React using the Fetch API and Axios, with real-world patterns for error handling, loading states, and async/await.
isFeatured: true
belt: white
---

## What Is an API?

An API (Application Programming Interface) is a contract between two pieces of software. One side exposes a defined set of endpoints; the other calls them to read or write data without caring about the implementation underneath. Every time you log in with Google, pull a weather widget, or send a message in a web app, an API call is happening behind the scenes.

In web development, "API" almost always means a **REST API** — a server you talk to over HTTP using URLs and JSON.

## HTTP Methods and What They Mean

REST APIs use standard HTTP verbs to signal intent:

| Method | Meaning | Typical use |
|--------|---------|-------------|
| `GET` | Read | Fetch a list or single item |
| `POST` | Create | Submit a new resource |
| `PUT` | Replace | Overwrite an entire resource |
| `PATCH` | Update | Change specific fields |
| `DELETE` | Remove | Delete a resource |

A well-designed API is **predictable**: `GET /posts` returns all posts, `GET /posts/42` returns one, `POST /posts` creates one, `DELETE /posts/42` removes it.

## HTTP Status Codes You'll Actually See

The server communicates success or failure through status codes:

- `200 OK` — request succeeded
- `201 Created` — resource was created (after a `POST`)
- `204 No Content` — success, nothing to return (after a `DELETE`)
- `400 Bad Request` — your request body is malformed
- `401 Unauthorized` — missing or invalid credentials
- `403 Forbidden` — authenticated but not allowed
- `404 Not Found` — resource doesn't exist
- `422 Unprocessable Entity` — valid JSON but fails validation
- `500 Internal Server Error` — the server broke, not your fault

## Fetching Data with the Fetch API

The browser's built-in `fetch` returns a Promise. The key gotcha: **a 4xx or 5xx response does NOT throw** — you have to check `response.ok` yourself.

```js
async function getPosts() {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts');

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const posts = await response.json();
  return posts;
}
```

### Sending JSON with POST

```js
async function createPost(title, body, userId) {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body, userId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create post: ${response.status}`);
  }

  return response.json();
}
```

### DELETE and PATCH

```js
// Delete a post
await fetch(`/api/posts/${id}`, { method: 'DELETE' });

// Patch (partial update) — only send the fields you want to change
const response = await fetch(`/api/posts/${id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Updated title' }),
});
```

## Using Axios Instead of Fetch

[Axios](https://axios-http.com/) is a popular alternative that automatically parses JSON, throws on non-2xx status codes, and supports request/response interceptors.

```bash
npm install axios
```

```js
import axios from 'axios';

// GET — data is already parsed
const { data: posts } = await axios.get('/api/posts');

// POST
const { data: newPost } = await axios.post('/api/posts', {
  title: 'Hello World',
  body: 'First post',
  userId: 1,
});
```

The big win with Axios: you don't need to check `response.ok` — it throws automatically on anything outside 2xx, so a single `try/catch` handles all errors cleanly.

## Consuming APIs in React

The standard pattern before TanStack Query: `useEffect` + `useState` with separate loading and error states.

```jsx
import { useState, useEffect } from 'react';

function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPosts() {
      try {
        const response = await fetch('/api/posts');
        if (!response.ok) throw new Error(`Error ${response.status}`);
        const data = await response.json();
        if (!cancelled) setPosts(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPosts();
    return () => { cancelled = true; }; // prevent state update on unmount
  }, []);

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

The `cancelled` flag prevents the "can't update state on unmounted component" warning when the component unmounts before the fetch resolves.

### The Easier Way: TanStack Query

For anything beyond a one-off fetch, [TanStack Query](https://tanstack.com/query) removes nearly all of this boilerplate:

```jsx
import { useQuery } from '@tanstack/react-query';

function PostList() {
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['posts'],
    queryFn: () => fetch('/api/posts').then(r => r.json()),
  });

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {posts.map(post => <li key={post.id}>{post.title}</li>)}
    </ul>
  );
}
```

You get caching, background refetching, deduplication, and loading/error states for free. I covered this in depth in [TanStack Query v5: Stop Managing Server State by Hand](/posts/tanstack-query-server-state).

## Adding Auth Headers

Most real APIs require a token. The cleanest approach is an Axios instance or a wrapper function so you never repeat the auth logic:

```js
// api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

Now every call through `api.get(...)` automatically includes the token.

## Handling Errors Gracefully

Never swallow errors silently. A minimal pattern I use in every project:

```js
async function safeFetch(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      message = body.message || body.error || message;
    } catch { /* non-JSON error body */ }
    throw new Error(message);
  }

  return response.json();
}
```

The API often sends a human-readable `message` field in error bodies — this extracts it when available.

## Quick Reference

```
GET    /posts          → 200 [{ id, title, … }, …]
GET    /posts/42       → 200 { id: 42, title: … }   | 404
POST   /posts          → 201 { id: 43, … }
PUT    /posts/42       → 200 { id: 42, … }
PATCH  /posts/42       → 200 { id: 42, … }
DELETE /posts/42       → 204 (empty body)
```

REST APIs follow these conventions across virtually every language and framework. Once you know the pattern, reading unfamiliar API docs becomes quick — you're just filling in resource names.
