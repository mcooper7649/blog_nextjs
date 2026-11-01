---
title: 'REST APIs: A Practical Guide for Web Developers'
date: '2022-06-06'
image: api-main.png
excerpt: APIs let applications talk to each other over the web. Here's everything you need to know to consume and understand REST APIs as a JavaScript developer.
isFeatured: true
belt: white
---

## What Is an API?

An API (Application Programming Interface) is a contract between two pieces of software. One side says "send me a request in this shape and I'll give you back data in that shape." The other side follows those rules and gets what it needs without caring how the first side works internally.

On the web, most APIs you'll use are **REST APIs** — they communicate over HTTP using URLs, JSON, and a handful of standard verbs. When you log in with Google, pull weather data for a dashboard, or post a tweet, you're hitting a REST API.

---

## The HTTP Verbs (Methods)

REST maps database operations to HTTP methods. You don't need to memorise all of them — these five cover 95% of real APIs:

| Method   | Meaning         | Typical use               |
|----------|-----------------|---------------------------|
| `GET`    | Read            | Fetch a list or single item |
| `POST`   | Create          | Submit a new resource     |
| `PUT`    | Replace         | Replace a whole resource  |
| `PATCH`  | Partial update  | Change specific fields    |
| `DELETE` | Remove          | Delete a resource         |

---

## Status Codes That Actually Matter

Every HTTP response comes with a numeric status code. You'll encounter these constantly:

| Range | Meaning    | Common ones                              |
|-------|------------|------------------------------------------|
| 2xx   | Success    | 200 OK, 201 Created, 204 No Content      |
| 3xx   | Redirect   | 301 Moved Permanently, 302 Found         |
| 4xx   | Client err | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Unprocessable Entity |
| 5xx   | Server err | 500 Internal Server Error, 503 Service Unavailable |

**401 vs 403:** 401 means "you're not authenticated" (send a valid token). 403 means "I know who you are, but you don't have permission."

---

## Making API Calls with `fetch`

The browser's built-in `fetch` is all you need for most API work:

```js
// GET — fetch a list
async function getUsers() {
  const res = await fetch('https://api.example.com/users');

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  const data = await res.json();
  return data; // array of user objects
}
```

```js
// POST — create a resource
async function createPost(title, body) {
  const res = await fetch('https://api.example.com/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body }),
  });

  if (!res.ok) throw new Error(`${res.status}`);
  return res.json(); // the created post with its new id
}
```

```js
// PATCH — update specific fields
async function updateUsername(userId, newName) {
  const res = await fetch(`https://api.example.com/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: newName }),
  });

  return res.json();
}
```

```js
// DELETE
async function deletePost(postId) {
  const res = await fetch(`https://api.example.com/posts/${postId}`, {
    method: 'DELETE',
  });

  // Many DELETE endpoints return 204 No Content — no body to parse
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
}
```

Always check `res.ok` (true when status is 200–299) before calling `res.json()` — calling `.json()` on an error response will parse the error body but won't throw, so you'll silently get `{ error: "not found" }` instead of the data you expected.

---

## Authentication

Most APIs require you to prove who you are. Two patterns dominate:

### API Keys

You include a key in a header on every request. Simple, stateless, common for server-to-server calls:

```js
const res = await fetch('https://api.openweathermap.org/data/2.5/weather?q=London', {
  headers: {
    'X-API-Key': process.env.WEATHER_API_KEY,
  },
});
```

Keep API keys in environment variables (`.env.local` in Next.js) — **never hard-code them in client-side code or commit them to Git**.

### Bearer Tokens (OAuth / JWT)

After a user logs in, the server returns a token. You attach it to every subsequent request in the `Authorization` header:

```js
async function getMyProfile(accessToken) {
  const res = await fetch('https://api.example.com/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return res.json();
}
```

The token proves identity without sending a password. Tokens usually expire (often in 1 hour); OAuth flows include a refresh token that gets you a new access token without re-prompting the user.

---

## Request and Response Shape

A typical JSON REST response:

```json
// GET /posts/42
{
  "id": 42,
  "title": "Hello World",
  "author": { "id": 7, "name": "Alice" },
  "tags": ["intro", "tutorial"],
  "publishedAt": "2024-03-15T09:00:00Z",
  "body": "..."
}
```

Common conventions:
- IDs are strings or integers; some APIs use UUIDs
- Dates are ISO 8601 strings (`2024-03-15T09:00:00Z`)
- Pagination usually comes as `page`/`perPage` query params and a `total` in the response
- Errors include a `message` or `error` field, sometimes a `code` for programmatic handling

---

## REST vs GraphQL (in 30 Seconds)

REST exposes multiple endpoints (`/users`, `/posts`, `/comments`). GraphQL exposes **one** endpoint where you declare exactly what fields you want:

```graphql
query {
  user(id: "42") {
    name
    posts(last: 3) {
      title
      publishedAt
    }
  }
}
```

GraphQL eliminates over-fetching (getting fields you don't need) and under-fetching (making multiple round-trips to assemble a view). It adds schema complexity and a steeper learning curve. REST is simpler and often the right choice; GraphQL shines when clients have very different data needs — like a mobile app that needs less than a web app.

---

## A Note on Public vs Private APIs

- **Public APIs** — anyone can call them, sometimes with an API key (GitHub, OpenWeatherMap, Stripe sandbox, NASA).
- **Private/Internal APIs** — internal microservices, not exposed to the internet.
- **Partner APIs** — requires a business agreement and credentials (Stripe production, Twilio).

Start with public APIs when learning — the [JSONPlaceholder](https://jsonplaceholder.typicode.com/) free fake API is great for practice (`GET /posts`, `POST /posts`, etc.) and doesn't require any credentials.
