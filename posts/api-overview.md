---
title: 'Consuming REST APIs in JavaScript: fetch, Error Handling & React Patterns'
date: '2026-08-23'
image: api-main.png
excerpt: A practical guide to fetching data from REST APIs with the native fetch API — covering GET, POST, proper error handling, and clean React integration patterns.
isFeatured: true
---

REST APIs are everywhere. Whether you're pulling weather data, talking to your own backend, or wiring up a third-party service, you need to know how to consume them reliably. This post walks through the patterns I actually use — native `fetch`, real error handling, and clean React integration — skipping the theory and getting straight to code that works.

## What "REST" Means in Practice

REST (Representational State Transfer) is a set of conventions for how clients and servers communicate over HTTP. In practice it means:

- **Resources are URLs**: `/users`, `/users/42`, `/posts/42/comments`
- **HTTP verbs say what to do**: `GET` to read, `POST` to create, `PUT`/`PATCH` to update, `DELETE` to remove
- **JSON is the lingua franca**: request and response bodies are almost always `application/json`
- **Stateless**: every request carries everything the server needs; no session on the wire

That's it. Everything else is an implementation detail.

## The fetch API

`fetch` is built into every modern browser and into Node.js since v18. No install required.

### Basic GET request

```js
const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
const post = await response.json();
console.log(post.title);
```

Two steps: wait for the HTTP response, then parse the JSON body. Easy — but there's a gotcha.

### Why you must check `response.ok`

`fetch` only rejects the promise on *network errors* (no connection, DNS failure). A 404 or 500 from the server resolves normally. If you skip the status check you'll silently swallow server errors:

```js
// ❌ Wrong — will silently treat a 404 as success
const response = await fetch('/api/users/999');
const data = await response.json(); // { message: 'Not Found' } — but no error thrown

// ✅ Correct — throw on non-2xx responses
async function fetchPost(id) {
  const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
```

I wrap this in a helper I use across every project:

```js
// lib/api.js
export async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status}: ${body}`);
  }

  // 204 No Content has no body to parse
  if (response.status === 204) return null;

  return response.json();
}
```

### POST with a JSON body

```js
import { apiFetch } from './lib/api';

const newPost = await apiFetch('https://jsonplaceholder.typicode.com/posts', {
  method: 'POST',
  body: JSON.stringify({
    title: 'My Post',
    body: 'Hello world',
    userId: 1,
  }),
});

console.log(newPost.id); // server-assigned ID echoed back
```

The `Content-Type: application/json` header tells the server how to parse the body. Don't forget `JSON.stringify` — `fetch` won't serialize an object for you.

### Authenticated requests

Most real APIs require a token. Pass it in the `Authorization` header:

```js
const data = await apiFetch('https://api.example.com/me', {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});
```

Never embed API keys in client-side code that ships to a browser — use environment variables on a server-side route instead.

## REST APIs in React

### The basic useEffect pattern

```jsx
import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false; // prevent state update on unmount

    apiFetch('https://jsonplaceholder.typicode.com/posts?_limit=10')
      .then((data) => {
        if (!cancelled) {
          setPosts(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

The `cancelled` flag prevents a React warning ("Can't perform a state update on an unmounted component") when the component unmounts before the fetch completes — common with fast navigation.

### Extracting a reusable hook

Once you're doing this in more than one place, pull it into a hook:

```js
// hooks/useFetch.js
import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch(url)
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });

    return () => { cancelled = true; };
  }, [url]);

  return { data, loading, error };
}
```

Usage:

```jsx
function UserProfile({ userId }) {
  const { data: user, loading, error } = useFetch(
    userId ? `/api/users/${userId}` : null
  );

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  return <div>{user.name}</div>;
}
```

Passing `null` as the URL skips the fetch, which is useful when you're waiting on a dependency (like `userId`) to be ready.

## When to reach for a library

The patterns above cover a lot of ground. When you need more — automatic caching, background refetching, deduplication of parallel requests, optimistic updates — reach for **TanStack Query** (React Query). It sits on top of `fetch` and handles the hard stuff. I have a [full post on TanStack Query v5](/posts/tanstack-query-server-state) if you want the deep dive.

For REST APIs specifically, `fetch` + a small helper like `apiFetch` above is often all you need for a side project or a small production app. Add TanStack Query when your data-fetching logic starts feeling repetitive or your loading states get complicated.

## Quick reference

| Goal | Code |
|------|------|
| GET JSON | `await apiFetch('/api/resource')` |
| POST JSON | `await apiFetch('/api/resource', { method: 'POST', body: JSON.stringify(data) })` |
| PUT (full update) | `await apiFetch('/api/resource/1', { method: 'PUT', body: JSON.stringify(data) })` |
| PATCH (partial) | `await apiFetch('/api/resource/1', { method: 'PATCH', body: JSON.stringify(patch) })` |
| DELETE | `await apiFetch('/api/resource/1', { method: 'DELETE' })` |
| With auth | Add `headers: { Authorization: 'Bearer <token>' }` to any call |

That's the full picture. Start with `fetch`, add the `ok` check, wrap it in a helper, and you'll handle 95% of what REST APIs throw at you.
