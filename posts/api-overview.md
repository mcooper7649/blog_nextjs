---
title: "REST APIs: A Practical Developer's Guide"
date: '2026-09-20'
image: api-main.png
excerpt: REST APIs power nearly every web app you build. This guide explains what they are, how HTTP methods and status codes work, and how to both consume and build them with real JavaScript examples.
isFeatured: true
---

## What is an API?

An API (Application Programming Interface) is a contract that lets two pieces of software talk to each other. When your React frontend asks a server for data, it goes through an API. When your app processes a payment or sends a message, it is calling someone else's API.

Unless you write every single line of code from scratch, you are constantly interacting with APIs — internal ones between your own modules, and external ones exposed over HTTP.

## Web API Formats: A Quick History

Before REST became dominant, several approaches competed:

- **SOAP** — XML-based protocol with strict schemas and envelope wrapping. Still found in banking and enterprise. Verbose but self-describing.
- **XML-RPC** — Simpler predecessor to SOAP. Remote procedure calls over HTTP with XML payloads.
- **JSON-RPC** — Same concept as XML-RPC but with JSON. Lightweight.
- **REST** — Not a protocol but an architectural style built on standard HTTP. Most common today.
- **GraphQL** — A query language where the client specifies exactly what data it needs. One endpoint, flexible queries.

REST is the dominant choice for new APIs because it maps directly to HTTP verbs and URLs, is human-readable, and works well with browser caching.

## REST: The Four Core Ideas

### 1. Resources and URLs

In REST, everything is a *resource* identified by a URL:

```
/users           → collection of users
/users/42        → user with id 42
/users/42/posts  → posts belonging to user 42
```

URLs are nouns, never verbs. `/getUser` is not RESTful; `/users/42` is.

### 2. HTTP Methods

REST uses HTTP verbs to indicate the intended action:

| Method | Meaning | Example |
|--------|---------|---------|
| GET | Read | `GET /users/42` |
| POST | Create | `POST /users` |
| PUT | Replace entire resource | `PUT /users/42` |
| PATCH | Partial update | `PATCH /users/42` |
| DELETE | Remove | `DELETE /users/42` |

### 3. Status Codes

The response code tells the client what happened. Always use the right one — it is the primary error-signaling mechanism in REST:

| Range | Meaning | Common codes |
|-------|---------|--------------|
| 2xx | Success | 200 OK, 201 Created, 204 No Content |
| 3xx | Redirect | 301 Moved Permanently, 304 Not Modified |
| 4xx | Client error | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Unprocessable Entity |
| 5xx | Server error | 500 Internal Server Error, 503 Service Unavailable |

### 4. Statelessness

Each request must carry all the information the server needs to fulfill it. The server never stores client session state between requests. Authentication credentials are passed on every request, usually as a header.

## Consuming a REST API with `fetch`

Here is how to call a REST endpoint from JavaScript:

```js
async function getUser(id) {
  const response = await fetch(`https://api.example.com/users/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}
```

Creating a resource with POST:

```js
async function createPost(title, body) {
  const response = await fetch('https://api.example.com/posts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, body }),
  });

  if (response.status !== 201) {
    const error = await response.json();
    throw new Error(error.message ?? 'Create failed');
  }

  return response.json();
}
```

Always check `response.ok` (or the specific status code) before calling `.json()`. A 4xx or 5xx response is still a valid HTTP response — `fetch` does not reject the promise for those.

## Building REST Endpoints in Next.js

Next.js Route Handlers (App Router) let you build API endpoints directly inside your project under `app/api/`. The file structure matches the URL:

```
app/
  api/
    users/
      route.js          →  GET /api/users, POST /api/users
      [id]/
        route.js        →  GET /api/users/:id, PATCH /api/users/:id
```

Here is a handler for `GET /api/users` and `POST /api/users`:

```js
// app/api/users/route.js
import { NextResponse } from 'next/server';

const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
];

export async function GET() {
  return NextResponse.json(users);
}

export async function POST(request) {
  const body = await request.json();

  if (!body.name || !body.email) {
    return NextResponse.json(
      { error: 'name and email are required' },
      { status: 400 }
    );
  }

  const newUser = { id: users.length + 1, ...body };
  users.push(newUser);

  return NextResponse.json(newUser, { status: 201 });
}
```

And a dynamic route for individual users:

```js
// app/api/users/[id]/route.js
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { id } = await params;
  const user = users.find(u => u.id === Number(id));

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const index = users.findIndex(u => u.id === Number(id));

  if (index === -1) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  users[index] = { ...users[index], ...body };
  return NextResponse.json(users[index]);
}
```

Note that `params` in Next.js 15 is a Promise — always `await` it.

## Authentication Patterns

Most production APIs require authentication. Two common patterns:

**API Keys** — simplest approach for server-to-server calls:

```js
fetch('/api/data', {
  headers: { 'X-API-Key': process.env.MY_API_KEY },
});
```

**Bearer Tokens (JWT)** — issued after login and validated server-side on each request:

```js
// After login, store the token
sessionStorage.setItem('token', loginResponse.token);

// Include it in subsequent requests
fetch('/api/profile', {
  headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` },
});
```

On the server, always validate the token before trusting the request. Do not skip this step or fall back to trusting client-supplied user IDs.

## Consistent Error Responses

Pick a consistent error shape and use it everywhere in your API. A common pattern:

```json
{
  "error": "User not found",
  "code": "USER_NOT_FOUND",
  "status": 404
}
```

A helper makes this easy in Next.js:

```js
function errorResponse(message, code, status) {
  return NextResponse.json({ error: message, code, status }, { status });
}

// Usage
return errorResponse('User not found', 'USER_NOT_FOUND', 404);
```

Consistent error shapes let the client handle errors in one place instead of guessing the response shape for every endpoint.

## REST vs GraphQL

REST works well for:
- Public APIs where HTTP caching matters (CDN-friendly)
- Simple CRUD resources
- Teams already comfortable with HTTP semantics

GraphQL earns its complexity when:
- Clients have very different data needs (mobile vs. web)
- You want to eliminate over-fetching (sending 20 fields when 3 are needed)
- You are building a product API consumed by many different clients

For most internal APIs and typical web backends, REST is simpler to build, debug, and cache. GraphQL is worth the overhead when client flexibility genuinely pays off.

---

REST is one of those concepts that is simple on the surface but has depth once you start thinking about status codes, idempotency, caching, and versioning. Getting the fundamentals right — resource-oriented URLs, correct HTTP verbs, and honest status codes — makes your API much easier for others (and your future self) to use.
