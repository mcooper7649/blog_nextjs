---
title: 'REST APIs in JavaScript: A Practical Field Guide'
date: '2026-10-25'
image: api-main.png
excerpt: Everything you actually need to work with REST APIs in JavaScript — fetch, error handling, authentication headers, and how to stop your network code from lying to you.
isFeatured: true
---

REST APIs are the lingua franca of the web. Whether you're pulling in weather data, posting to a third-party service, or building your own backend, you'll be making HTTP requests every single day. This guide skips the theory and gets to the patterns you'll actually reach for.

## The Problem with the Basics

Every beginner tutorial shows you this:

```js
fetch('https://api.example.com/users')
  .then(res => res.json())
  .then(data => console.log(data));
```

This code is broken. `fetch` only rejects its promise for *network errors* — a DNS failure, a refused connection. A `404 Not Found` or a `500 Internal Server Error` comes back as a *resolved* promise with a non-OK response. That means you'll happily log your error page's HTML as if it were real data.

Here's the pattern I use everywhere:

```js
async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}
```

`res.ok` is `true` only for 2xx status codes. This one helper makes all your subsequent code trustworthy.

## GET: Reading Data

The simplest case — no body, just a URL.

```js
const posts = await apiFetch('https://jsonplaceholder.typicode.com/posts');
// posts is an array of post objects
```

Query parameters belong in the URL. Use `URLSearchParams` to build them — never concatenate strings.

```js
const params = new URLSearchParams({ userId: 1, _limit: 5 });
const url = `https://jsonplaceholder.typicode.com/posts?${params}`;
const posts = await apiFetch(url);
```

This handles encoding for you. A raw `& ` or `+` in a search term won't break your request.

## POST: Sending JSON

Most APIs expect `Content-Type: application/json`. You have to set it yourself — `fetch` won't add it automatically.

```js
const newPost = await apiFetch('https://jsonplaceholder.typicode.com/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'New Post',
    body: 'Hello world',
    userId: 1,
  }),
});

console.log(newPost.id); // 101 — the server's assigned ID
```

## PUT and PATCH: Updating Data

`PUT` replaces the entire resource. `PATCH` applies a partial update. Most modern APIs use `PATCH` for edits.

```js
// Replace completely
await apiFetch(`https://api.example.com/posts/1`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Replaced', body: 'All fields required', userId: 1 }),
});

// Update just the title
await apiFetch(`https://api.example.com/posts/1`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Just this changed' }),
});
```

## DELETE: Removing Resources

```js
await apiFetch(`https://api.example.com/posts/1`, { method: 'DELETE' });
// Returns 200/204 with no body on success
```

Some DELETE endpoints return `204 No Content`. That means `res.json()` will throw because there's nothing to parse. Check the status first:

```js
async function apiDelete(url, options = {}) {
  const res = await fetch(url, { method: 'DELETE', ...options });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}
```

## Authentication

### API Keys in Headers

The most common pattern for server-to-server calls:

```js
const data = await apiFetch('https://api.openweathermap.org/data/2.5/weather?q=London', {
  headers: { 'X-Api-Key': process.env.WEATHER_API_KEY },
});
```

Never put API keys in client-side code. They end up in your JavaScript bundle and anyone can read them. Proxy calls through your own server.

### Bearer Tokens (OAuth / JWT)

After a user logs in, they get a token. You send it with every authenticated request:

```js
async function authenticatedFetch(url, options = {}) {
  const token = localStorage.getItem('access_token');
  return apiFetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
```

If the server returns `401 Unauthorized`, the token expired. You'll want to hook into that to refresh or redirect to login.

## A Reusable API Client

Rather than scattering headers and base URLs across your codebase, collect them in one place:

```js
// lib/api-client.js
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.example.com';

function getToken() {
  // works in a browser; swap for cookie/session on the server
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status} on ${path}: ${body}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
  patch: (path, data) => request(path, { method: 'PATCH', body: JSON.stringify(data) }),
  del: (path) => request(path, { method: 'DELETE' }),
};
```

Now your components stay clean:

```js
import { api } from '../lib/api-client';

const user = await api.get('/users/me');
const updated = await api.patch('/users/me', { displayName: 'Michael' });
```

## Handling Errors in Components

Network errors are facts of life. Show your users something useful rather than a blank screen:

```js
function useUser(userId) {
  const [user, setUser] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get(`/users/${userId}`)
      .then(setUser)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  return { user, error, loading };
}
```

Or, if you're using TanStack Query (which I'd recommend for anything beyond simple one-off fetches), the loading/error plumbing is handled for you — check out [that post](/posts/tanstack-query-server-state) for the full walkthrough.

## Timeouts

`fetch` has no built-in timeout. A stalled request will hang forever. Use `AbortController`:

```js
async function fetchWithTimeout(url, ms = 5000, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await apiFetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}
```

If the timeout fires, `fetch` throws an `AbortError`. Catch it separately if you want to show a "request timed out" message rather than a generic error.

## CORS: What It Is and When It Bites You

CORS (Cross-Origin Resource Sharing) is a browser security policy. When your React app at `localhost:3000` calls an API at `api.example.com`, the browser checks whether the API's response includes permission headers like:

```
Access-Control-Allow-Origin: https://yoursite.com
```

If not, the browser blocks the response — even though it was received. **This is a server-side problem, not a client-side one.** You fix it by configuring the API server to send the right headers, or by proxying requests through your own backend.

In Next.js, you can proxy during development with `rewrites` in `next.config.js`:

```js
// next.config.js
module.exports = {
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'https://api.example.com/:path*' },
    ];
  },
};
```

Now your frontend calls `/api/users` and Next.js forwards it server-side — no CORS because there's no cross-origin request from the browser.

## Quick Reference

| Method | Use for | Has body? | Typical success code |
|--------|---------|-----------|---------------------|
| GET | Read | No | 200 |
| POST | Create | Yes | 201 |
| PUT | Replace | Yes | 200 |
| PATCH | Update | Yes | 200 |
| DELETE | Remove | No | 200 or 204 |

The main things to remember: always check `res.ok`, never put API keys in frontend code, use `URLSearchParams` for query strings, and reach for a client wrapper early — the few minutes it takes to write one will save you hours of debugging scattered `fetch` calls.
