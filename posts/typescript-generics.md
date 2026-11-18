---
title: 'TypeScript Generics: Write Functions That Work on Any Type'
date: '2026-11-18'
image: cover.jpg
excerpt: Generics let you write functions and types that stay fully typed without locking down a single concrete type — the practical alternative to any.
isFeatured: false
belt: green
---

TypeScript's `any` type is a pressure-relief valve. When the compiler complains and you're in a hurry, slapping `any` on something makes the error disappear. The cost is that you've opted that variable out of type checking entirely — the compiler will never catch a mistake there again.

Generics give you the same flexibility without paying that cost. A generic function works with many types while still tracking which type it's operating on, so errors show up at the call site, not at runtime.

## The Core Idea

Consider a function that returns the first element of an array:

```ts
function getFirst(arr: any[]): any {
  return arr[0];
}

const name = getFirst(['Alice', 'Bob']); // name: any — TypeScript forgot it's a string
```

The `any` return type throws away the information TypeScript already has. With a generic, you give that type a name so it flows through:

```ts
function getFirst<T>(arr: T[]): T {
  return arr[0];
}

const name = getFirst(['Alice', 'Bob']); // name: string ✓
const count = getFirst([1, 2, 3]);       // count: number ✓
```

The `<T>` after the function name declares a **type parameter** — a placeholder that TypeScript fills in automatically at every call site based on the argument you pass.

## Constraints with `extends`

By default, `T` could be anything, which limits what you can do with it inside the function. If you need to access a property, constrain the type parameter:

```ts
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: 1, name: 'Alice' };
const id = getProperty(user, 'id');     // number
const name = getProperty(user, 'name'); // string
getProperty(user, 'missing');           // ✗ compile error
```

`K extends keyof T` tells TypeScript that `K` must be one of the actual keys of `T`. The return type `T[K]` is the type of that specific property — so you get a different concrete type back for each key you pass.

## Generic Interfaces for Shared Shapes

API responses almost always wrap data in a common envelope: `{ data, error, status }`. A generic interface captures that pattern once:

```ts
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

type UserResponse = ApiResponse<{ id: number; name: string }>;
type PostsResponse = ApiResponse<Post[]>;
```

Now every consumer of these types gets full autocomplete on `response.data` without any casting.

## A Type-Safe Fetch Wrapper

Putting constraints and interfaces together, here is a utility you can drop into any project:

```ts
async function apiFetch<T>(url: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return { data: null, error: `HTTP ${res.status}`, status: res.status };
    }
    const data: T = await res.json();
    return { data, error: null, status: res.status };
  } catch (err) {
    return { data: null, error: String(err), status: 0 };
  }
}

// Usage — the caller decides what type the response body has
const { data, error } = await apiFetch<User>('/api/users/1');
if (data) {
  console.log(data.name); // TypeScript knows this is a string
}
```

The function does not know or care about `User` — it just promises to give you back whatever type you asked for. You take responsibility for the cast at the call site, which is where you have enough context to make it accurately.

Pair this with [Zod](/posts/zod-runtime-validation) to validate the runtime shape and you get safety at both compile time and runtime.

## Generic React Components

Generics work in components too. A typed list component avoids repeating the same render pattern for every data type:

```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item) => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}

// Usage
<List
  items={users}
  keyExtractor={(u) => String(u.id)}
  renderItem={(u) => <span>{u.name}</span>}
/>
```

TypeScript infers `T` from `items`, so `renderItem` and `keyExtractor` are automatically typed as `(item: User) => ...` — no explicit annotation needed at the call site.

## When Not to Use Generics

Generics add cognitive overhead, so reach for them only when a function or type genuinely needs to work across multiple types **and** that type information needs to flow through to the return value or other parameters.

If the function takes one concrete type and returns a concrete type, skip the generic — it only obscures what the function does. If you need to accept "anything" but don't care about the type afterward, `unknown` with a type guard is safer than `any` and clearer than a pointless `<T>`.

The sweet spot for generics is shared utilities — data-fetching wrappers, collection transformers, storage helpers — where the same logic applies to many shapes of data and you want the compiler to track which shape you're using at each call site.

## Further Reading

- [TypeScript Handbook: Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [TypeScript Utility Types](/posts/typescript-utility-types) — `Partial`, `Pick`, `ReturnType`, and friends built on the same ideas
- [TypeScript in React](/posts/typescript-in-react) — typing props, events, and hooks
