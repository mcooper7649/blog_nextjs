---
title: 'TypeScript Utility Types: The Ones You Will Actually Use'
date: '2026-11-02'
image: cover.jpg
excerpt: Partial, Pick, Omit, ReturnType, Awaited — six built-in TypeScript helpers that eliminate repetitive type definitions and make refactors painless.
isFeatured: false
belt: yellow
---

TypeScript ships with a set of built-in generic helpers called **utility types**. They live in the standard library so there is nothing to install — you just use them. Instead of copy-pasting type definitions, you derive new types from existing ones, which keeps code shorter and refactors safer.

Here are six that come up all the time.

---

## 1. `Partial<T>` — make every field optional

The most common place this shows up is an **update or PATCH payload**. You already have a full type for the entity; the update body should accept any subset of its fields.

```ts
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'member';
}

async function updateUser(id: number, changes: Partial<User>) {
  return fetch(`/api/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
}

// Both calls are valid:
updateUser(1, { name: 'Alice' });
updateUser(1, { email: 'new@example.com', role: 'admin' });
```

Without `Partial` you would either write a second `UserUpdate` interface (duplicating every field with `?`) or accept `unknown` and lose safety entirely.

---

## 2. `Required<T>` — the opposite of Partial

Sometimes you receive a type where everything is optional (perhaps from an external library or a database ORM), but in a specific code path you need to assert that certain fields are present. `Required<T>` makes every field non-optional.

```ts
// A config type where nothing is required at definition time
interface Config {
  apiUrl?: string;
  timeout?: number;
  retries?: number;
}

// After validation we know all fields exist
function buildClient(config: Required<Config>) {
  return { url: config.apiUrl, timeout: config.timeout };
}

// Validate at the boundary, then narrow the type
function startApp(raw: Config) {
  if (!raw.apiUrl || raw.timeout == null || raw.retries == null) {
    throw new Error('incomplete config');
  }
  buildClient(raw as Required<Config>);
}
```

The cast on the last line is one of the few places where `as` is earned: you just checked every field.

---

## 3. `Pick<T, K>` — cherry-pick fields

Use `Pick` when a function or component needs only part of a larger type. This keeps your function signatures honest — they only advertise the data they actually touch.

```ts
interface Post {
  id: string;
  title: string;
  body: string;
  author: string;
  publishedAt: string;
  tags: string[];
}

// The card only needs three fields — don't pass the whole Post
type PostCardProps = Pick<Post, 'id' | 'title' | 'publishedAt'>;

function PostCard({ id, title, publishedAt }: PostCardProps) {
  return (
    <article>
      <h2>{title}</h2>
      <time>{publishedAt}</time>
    </article>
  );
}
```

The bonus: if you later rename `publishedAt` to `createdAt` everywhere in `Post`, the compiler tells you about `PostCard` immediately — no grep required.

---

## 4. `Omit<T, K>` — exclude fields

`Omit` is `Pick`'s mirror. Use it when a type is almost right but you need to strip a few fields — typically when accepting create payloads that should not include a server-assigned `id`.

```ts
type CreateUserPayload = Omit<User, 'id'>;

async function createUser(payload: CreateUserPayload) {
  return fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// id is not accepted — TypeScript will error if you pass it
createUser({ name: 'Alice', email: 'a@b.com', role: 'member' });
```

A common pattern is to combine them: `Omit<User, 'id'> & { password: string }` for a registration form that needs an extra field the `User` type does not carry.

---

## 5. `ReturnType<F>` — infer the return type of a function

When you do not own a function's type definition, or when the return type is complex and you do not want to repeat it, `ReturnType` pulls it out automatically.

```ts
function getUserWithPosts() {
  return {
    user: { id: 1, name: 'Alice' },
    posts: [{ id: 10, title: 'Hello' }],
  };
}

type UserWithPosts = ReturnType<typeof getUserWithPosts>;
// { user: { id: number; name: string }; posts: { id: number; title: string }[] }

// Now use it wherever you pass that shape around:
function renderUserPage(data: UserWithPosts) { /* ... */ }
```

This is especially useful for tying the output of a data-fetching function to the props of the component that renders it — any change to the function automatically propagates.

---

## 6. `Awaited<T>` — unwrap a Promise

`Awaited` handles the async version of the same problem. Given an `async` function that returns `Promise<User[]>`, you often want the resolved type for prop types or local state.

```ts
async function fetchUsers(): Promise<User[]> {
  const res = await fetch('/api/users');
  return res.json();
}

// Extracts User[] without repeating the annotation
type FetchedUsers = Awaited<ReturnType<typeof fetchUsers>>;
// User[]

// Works with deeply nested Promises too:
type Deep = Awaited<Promise<Promise<string>>>;
// string
```

Combining `Awaited` and `ReturnType` is the idiomatic way to type a React Server Component's data shape — define the `async` fetch function once and derive everything from it.

---

## Composing them

The real power comes from combining these helpers. Here is a common pattern: a form component for editing an existing post that strips `id` and makes everything optional so partial saves work.

```ts
type PostEditFormData = Partial<Omit<Post, 'id'>>;

function PostEditForm({ initial }: { initial: PostEditFormData }) {
  // every field is optional — the user can save partial progress
}
```

Two utility types, zero hand-written duplicate interfaces.

---

TypeScript ships about twenty utility types in total. These six cover the vast majority of day-to-day cases. Once they click, you will find yourself writing far fewer redundant interface definitions and spending a lot less time chasing down the fallout from renamed fields.

The official [TypeScript Utility Types reference](https://www.typescriptlang.org/docs/handbook/utility-types.html) lists all of them — it is worth a read after you have internalized these first six.
