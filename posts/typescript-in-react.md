---
title: 'TypeScript in React: Practical Typing Patterns That Actually Help'
date: '2026-06-01'
image: cover.jpg
excerpt: TypeScript stops being noise and starts being useful the moment you learn a handful of patterns — typed props, useState generics, event handlers, and API responses.
isFeatured: false
---

I avoided TypeScript in my React projects longer than I should have. The error messages looked cryptic, the setup seemed heavy, and I already had PropTypes. Then a junior dev introduced a subtle prop-shape bug that took three hours to track down — a bug TypeScript would have caught at save time. I've typed my React ever since.

This post skips the philosophy and goes straight to the five patterns I reach for every day.

## 1. Typing component props with an interface

The most common thing you'll type is a component's props. Define an interface just above the component and pass it as the generic argument to `React.FC`, or just annotate the destructured parameter directly — the second approach is less noisy:

```tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean; // optional — note the '?'
  variant?: 'primary' | 'secondary'; // union type keeps valid values explicit
}

export function Button({ label, onClick, disabled = false, variant = 'primary' }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
```

The union type `'primary' | 'secondary'` is more useful than `string`. Passing `variant="danger"` now gives a compile-time error instead of a silent style mismatch at runtime.

## 2. useState with generics

`useState` infers its type from the initial value, which works fine for primitives. Where it breaks down is when the initial value is `null` or an empty array, because the inferred type becomes `null` or `never[]` and TypeScript won't let you assign anything real to it later.

Fix this by passing the type explicitly:

```tsx
// Bad — TypeScript infers the type as `null` only, so setUser won't accept a User object
const [user, setUser] = useState(null);

// Good — TypeScript knows it's User | null from the start
interface User {
  id: number;
  name: string;
  email: string;
}

const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<string[]>([]);
```

With the typed version, `setUser({ id: 1, name: 'Alice', email: 'alice@example.com' })` compiles cleanly, and `setUser({ id: 1, username: 'alice' })` (wrong shape) errors immediately.

## 3. Event handler types

Event types in React are namespaced under `React`. The ones I use constantly:

```tsx
function SearchBox() {
  const [query, setQuery] = useState('');

  // React.ChangeEvent<HTMLInputElement> is the type of the onChange event
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
  }

  // React.FormEvent<HTMLFormElement> for form submit
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log('Searching for:', query);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={query} onChange={handleChange} />
      <button type="submit">Search</button>
    </form>
  );
}
```

The pattern is always `React.<EventType><HTMLElement>`. A few to memorise:

| Event | HTML element | Type |
|---|---|---|
| `onChange` | `<input>` | `React.ChangeEvent<HTMLInputElement>` |
| `onChange` | `<select>` | `React.ChangeEvent<HTMLSelectElement>` |
| `onSubmit` | `<form>` | `React.FormEvent<HTMLFormElement>` |
| `onClick` | anything | `React.MouseEvent<HTMLButtonElement>` |
| `onKeyDown` | anything | `React.KeyboardEvent<HTMLInputElement>` |

## 4. Typing API responses

A common mistake is leaving `fetch` response data as `any`. That defeats the whole point. Define an interface that mirrors the API shape and cast once at the boundary:

```tsx
interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

async function fetchPost(id: number): Promise<Post> {
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json() as Promise<Post>;
}

// In a component:
function PostDetail({ id }: { id: number }) {
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    fetchPost(id).then(setPost);
  }, [id]);

  if (!post) return <p>Loading...</p>;

  return <h2>{post.title}</h2>; // TypeScript knows post.title is a string
}
```

The `as Promise<Post>` cast on `res.json()` is the one spot where you're trusting the server. If the shape changes, you only have one place to update.

## 5. Typing custom hooks

Custom hooks are where TypeScript earns its keep most clearly, because the return type becomes part of the hook's public API.

```tsx
interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<T>;
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [url]);

  return { data, loading, error };
}

// Usage — TypeScript knows posts is Post[] | null
const { data: posts, loading } = useFetch<Post[]>('/api/posts');
```

The generic `<T>` makes the hook reusable: call it once for posts, once for users, once for anything — and each callsite gets fully typed data back.

## Where to go from here

These five patterns cover the majority of TypeScript I write in day-to-day React work. Once they feel automatic, the natural next step is `React.ReactNode` and `React.PropsWithChildren` for components that render children, and `useReducer` with a discriminated union for complex state. But honestly, mastering props, state, events, API data, and custom hooks will make you more productive with TypeScript in React than reading any amount of theory.

Start by converting your next new component with typed props. The immediate feedback loop — catching a wrong prop type before you ever run the code — is what converts sceptics.
