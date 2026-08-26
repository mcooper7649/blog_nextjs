---
title: 'TypeScript Utility Types: The Ones You Will Actually Use'
date: '2026-08-26'
image: cover.jpg
excerpt: Partial, Pick, Omit, Record, ReturnType — TypeScript ships a toolkit of generic helpers that eliminate boilerplate and make your types composable. Here are the ones worth memorising.
isFeatured: false
---

TypeScript's utility types are built-in generic helpers that let you derive new types from existing ones — no copy-paste, no manual sync. They look magic at first, but every one of them is just a conditional or mapped type that TypeScript ships for you out of the box. Master a handful and you'll stop writing redundant interfaces entirely.

## The problem they solve

Say you have a `User` interface used everywhere in your app:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'viewer';
  createdAt: Date;
}
```

Now you need a type for the PATCH body (only `name` and `email` can change). You *could* write a separate interface — but then any future change to `User` must be reflected in two places. Utility types let you derive the PATCH type directly from `User` so they stay in sync automatically.

---

## `Partial<T>` — make every property optional

```typescript
function updateUser(id: number, changes: Partial<User>): Promise<User> {
  return fetch(`/api/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  }).then(r => r.json());
}

// Caller only sends what changed
updateUser(42, { name: 'Michael' });
```

`Partial<User>` is equivalent to writing `{ id?: number; name?: string; ... }`. Ideal for update/patch operations and form state where not all fields are filled yet.

---

## `Required<T>` — the opposite

Makes every property mandatory, stripping optionality. Useful after validation when you know all fields are present:

```typescript
interface DraftPost {
  title?: string;
  body?: string;
  slug?: string;
}

function publishPost(post: Required<DraftPost>) {
  // title, body, slug are all guaranteed here
}
```

---

## `Pick<T, K>` — keep only specific keys

```typescript
type UserPreview = Pick<User, 'id' | 'name'>;
// { id: number; name: string }

function renderUserCard(user: UserPreview) {
  return `${user.id}: ${user.name}`;
}
```

`Pick` keeps only the keys you list. It's the "allowlist" approach — great for data you expose to the client when you don't want to ship the whole object (e.g., omit `createdAt`, `role`).

---

## `Omit<T, K>` — remove specific keys

The complement of `Pick` — it's the blocklist approach:

```typescript
type UserWithoutDates = Omit<User, 'createdAt'>;
// { id: number; name: string; email: string; role: 'admin' | 'viewer' }

type CreateUserPayload = Omit<User, 'id' | 'createdAt'>;
// id is server-generated, createdAt is set automatically
```

`Omit` is my go-to for request payloads where the server fills in a few fields.

---

## `Readonly<T>` — prevent mutation

```typescript
const config: Readonly<{ apiUrl: string; timeout: number }> = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
};

config.timeout = 3000; // Error: Cannot assign to 'timeout' — it's read-only
```

Useful for configuration objects, Redux state, or any value that should be treated as immutable after creation. Note it's shallow — nested objects are still mutable unless you use `Readonly` recursively with `DeepReadonly` (not built-in, but easy to write).

---

## `Record<K, V>` — typed dictionaries

`Record` maps a set of keys to a value type. The first generic is the key type (usually a string union or `string`), the second is the value:

```typescript
type Role = 'admin' | 'editor' | 'viewer';

const permissions: Record<Role, string[]> = {
  admin:  ['read', 'write', 'delete'],
  editor: ['read', 'write'],
  viewer: ['read'],
};

// Safer than a plain object — TypeScript ensures every role is covered
```

If you add a new role to the union, TypeScript will immediately complain that your `permissions` object is missing an entry. That's the whole point.

---

## `ReturnType<T>` — extract a function's return type

Sometimes you don't own the type — you only have the function. `ReturnType` lets you derive the type from the function itself:

```typescript
function getSession() {
  return { userId: 1, token: 'abc', expiresAt: new Date() };
}

type Session = ReturnType<typeof getSession>;
// { userId: number; token: string; expiresAt: Date }
```

This is invaluable when working with third-party utilities that don't export their return types. If the library updates its shape, your derived type updates automatically.

---

## `Parameters<T>` — extract parameter types

The complement of `ReturnType`:

```typescript
function createNotification(message: string, level: 'info' | 'warn' | 'error') {
  // ...
}

type NotifyArgs = Parameters<typeof createNotification>;
// [message: string, level: 'info' | 'warn' | 'error']

// Useful for wrappers:
function queueNotification(...args: NotifyArgs) {
  setTimeout(() => createNotification(...args), 500);
}
```

---

## `Awaited<T>` — unwrap a Promise

Before `Awaited` (added in TS 4.5), extracting the resolved type of a Promise was awkward. Now:

```typescript
async function fetchUser(id: number): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}

type FetchedUser = Awaited<ReturnType<typeof fetchUser>>;
// User — the Promise is unwrapped
```

This composes beautifully: `Awaited<ReturnType<typeof fn>>` is a common pattern for typing async API functions you don't control.

---

## Combining them

The real power comes from composition. Here's a realistic example — a safe update function that only allows changing a user's name or email, and returns the bare minimum:

```typescript
type UpdateableFields = Pick<User, 'name' | 'email'>;
type UserChanges      = Partial<UpdateableFields>;
type UserSummary      = Pick<User, 'id' | 'name' | 'email'>;

async function updateUser(id: number, changes: UserChanges): Promise<UserSummary> {
  const res = await fetch(`/api/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}
```

All three types are derived from the single `User` source of truth. Add or rename a field in `User` and the compiler tells you everywhere that breaks.

---

## Quick reference

| Utility | What it does |
|---|---|
| `Partial<T>` | All props become optional |
| `Required<T>` | All props become mandatory |
| `Readonly<T>` | All props become read-only |
| `Pick<T, K>` | Keep only listed keys |
| `Omit<T, K>` | Remove listed keys |
| `Record<K, V>` | Map keys to a value type |
| `ReturnType<T>` | Infer a function's return type |
| `Parameters<T>` | Infer a function's parameter types |
| `Awaited<T>` | Unwrap a Promise (or nested Promises) |

The full list lives in the [TypeScript docs](https://www.typescriptlang.org/docs/handbook/utility-types.html) — there are a few more (`NonNullable`, `Extract`, `Exclude`, `ConstructorParameters`) worth a look once you're comfortable with the core nine.

---

The biggest mindset shift with utility types: stop thinking of your interfaces as independent declarations and start thinking of them as derived transformations of a single source. When your data model changes, one edit propagates everywhere — and the compiler catches the rest.
