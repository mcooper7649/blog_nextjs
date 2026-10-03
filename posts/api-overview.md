---
title: 'Consuming REST APIs in JavaScript: fetch, async/await, and Real-World Patterns'
date: '2026-10-03'
image: api-main.png
excerpt: A practical guide to fetching data, handling errors, authenticating requests, and avoiding common pitfalls when working with REST APIs in JavaScript.
isFeatured: true
---

REST APIs are everywhere. Whether you're pulling user data from your own backend, integrating a payment provider, or displaying weather data in a React component, you're making HTTP requests and parsing JSON. This guide focuses on the practical side — real code patterns you'll actually use.

## The Basics: fetch and async/await

The modern way to make HTTP requests in JavaScript is the `fetch` API combined with `async/await`. Here's a minimal GET request:

```js
async function getUser(id) {
  const response = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`);
  const user = await response.json();
  return user;
}
```

Simple, but there's a catch: `fetch` only rejects on network failure. A 404 or 500 response resolves normally — `response.ok` will be `false`, but no error is thrown. You need to check yourself:

```js
async function getUser(id) {
  const response = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
```

Always check `response.ok` before calling `.json()`. This is the single most common mistake when using `fetch`.

## POST, PATCH, and DELETE

For anything other than a GET, you pass an options object as the second argument. The most important fields are `method`, `headers`, and `body`:

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
    throw new Error(`Failed to create post: ${response.status}`);
  }

  return response.json();
}
```

`Content-Type: application/json` tells the server you're sending JSON. `JSON.stringify()` converts your object to a string — the body must be a string, not a plain object.

For PATCH and DELETE the shape is the same, just with `method: 'PATCH'` or `method: 'DELETE'`. Delete requests often have no body:

```js
async function deletePost(id) {
  const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Delete failed: ${response.status}`);
  }
  // 204 No Content — nothing to parse
}
```

## Authentication

Most real APIs require authentication. Two common patterns:

**Bearer token** (used by GitHub, Stripe, most OAuth APIs):

```js
async function getMyRepos(token) {
  const response = await fetch('https://api.github.com/user/repos', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
  return response.json();
}
```

**API key in a query param** (older APIs, weather services, etc.):

```js
async function getWeather(city, apiKey) {
  const url = new URL('https://api.example.com/weather');
  url.searchParams.set('q', city);
  url.searchParams.set('appid', apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
  return response.json();
}
```

Using `URL` + `searchParams` to build query strings is cleaner and safer than string interpolation — it handles encoding automatically.

## Error Handling in React

In a React component you'll want to handle loading, success, and error states. With TanStack Query this is mostly automatic, but if you're using `useEffect`:

```jsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getUser(userId);
        if (!cancelled) setUser(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Error: {error}</p>;
  return <h2>{user.name}</h2>;
}
```

The `cancelled` flag prevents state updates on unmounted components — without it you'll get the "Can't perform a React state update on an unmounted component" warning.

## Building a Reusable Fetch Wrapper

Repeating `if (!response.ok) throw new Error(...)` everywhere is tedious. A thin wrapper pays for itself quickly:

```js
async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text}`);
  }

  // 204 No Content has no body
  if (response.status === 204) return null;

  return response.json();
}

// Usage
const user = await apiFetch(`/api/users/${id}`);
const post = await apiFetch('/api/posts', {
  method: 'POST',
  body: JSON.stringify({ title: 'Hello' }),
});
```

This wrapper: checks `response.ok`, includes `Content-Type` by default, handles 204, and surfaces the response body in the error message so you know *why* a request failed.

## REST vs. GraphQL — The Practical Trade-off

REST APIs are collections of endpoints, each returning a fixed shape. GraphQL APIs have a single endpoint where the client specifies exactly what fields it needs.

REST is simpler to get started with and has better tooling (caches, CDNs, browser dev tools). It can over-fetch (getting fields you don't need) or under-fetch (needing two requests for related data).

GraphQL shines when your frontend needs highly variable data shapes — for example a mobile app that wants a condensed view and a desktop app that wants the full object. It comes with more setup and a steeper learning curve.

For most projects, start with REST. Reach for GraphQL when over/under-fetching becomes a real pain point, not a theoretical one.

## Quick Reference

| Task | Code |
|------|------|
| GET | `fetch(url)` |
| POST with JSON | `fetch(url, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) })` |
| Check for errors | `if (!response.ok) throw new Error(...)` |
| Bearer auth | `headers: { Authorization: 'Bearer ' + token }` |
| Build query string | `new URL(base); url.searchParams.set(key, val)` |
| Parse body | `await response.json()` |
| No body (204) | Check `response.status === 204` before `.json()` |

REST APIs are straightforward once you internalize the `response.ok` check and get a feel for how headers and body work. A small wrapper function eliminates most of the boilerplate, and from there you're just calling functions.
