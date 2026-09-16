---
title: "Building Custom React Hooks: Reusable Logic the Right Way"
date: '2026-09-16'
image: cover.jpg
excerpt: Custom hooks let you extract stateful logic into reusable functions — no HOCs, no render props, no magic. Here are four hooks I reach for in almost every project.
isFeatured: true
---

Every React project eventually grows a `utils/` folder full of helpers and a handful of components that do way too much. Custom hooks are the answer to both problems: they let you pull stateful logic out of components and reuse it cleanly, without the complexity of higher-order components or render props.

The rule is simple — any function that starts with `use` and calls other hooks is a custom hook. React's rules of hooks apply the same way they do in components.

Here are four hooks I reach for in almost every project.

## 1. `useFetch` — Async Data with Loading and Error States

Fetching data is one of the first things that clutters a component. A `useFetch` hook centralises the pattern.

```ts
// hooks/useFetch.ts
import { useState, useEffect } from 'react';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useFetch<T>(url: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    setState({ data: null, loading: true, error: null });

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<T>;
      })
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message });
      });

    return () => { cancelled = true; };
  }, [url]);

  return state;
}
```

The `cancelled` flag prevents a setState call after the component unmounts — a classic source of the "Can't perform a React state update on an unmounted component" warning.

Usage:

```tsx
function UserProfile({ id }: { id: number }) {
  const { data, loading, error } = useFetch<User>(`/api/users/${id}`);

  if (loading) return <Spinner />;
  if (error) return <p>Error: {error}</p>;
  return <h1>{data!.name}</h1>;
}
```

For more complex caching and background refetching, reach for TanStack Query — but `useFetch` is perfectly adequate for simple one-off requests.

## 2. `useLocalStorage` — Persist State Across Reloads

Syncing a piece of state to `localStorage` is a two-liner in theory, but the edge cases (SSR, invalid JSON, storage events) add up fast.

```ts
// hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // quota exceeded or private browsing — fail silently
    }
  }, [key, value]);

  return [value, setValue] as const;
}
```

The lazy initialiser (`useState(() => …)`) runs only once on mount, reading from storage before the first render. The `useEffect` keeps storage in sync after every change.

Usage:

```tsx
function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Switch to {theme === 'light' ? 'dark' : 'light'} mode
    </button>
  );
}
```

## 3. `useDebounce` — Slow Down Fast Inputs

Firing an API call on every keystroke in a search box is wasteful. `useDebounce` delays updating a value until the user pauses.

```ts
// hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```

Each time `value` changes the old timer is cleared and a new one starts. The cleanup function is the key — without it, every keystroke would fire the API call after the delay, defeating the purpose.

Usage:

```tsx
function Search() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);
  const { data } = useFetch<Result[]>(
    debouncedQuery ? `/api/search?q=${encodeURIComponent(debouncedQuery)}` : ''
  );

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {data?.map((r) => <p key={r.id}>{r.title}</p>)}
    </>
  );
}
```

## 4. `useOnClickOutside` — Close Dropdowns and Modals

Detecting a click outside a floating element is fiddly to do inline. A hook cleans it up.

```ts
// hooks/useOnClickOutside.ts
import { useEffect, RefObject } from 'react';

export function useOnClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}
```

The guard `ref.current.contains(event.target)` prevents the handler firing when you click *inside* the element.

Usage:

```tsx
function Dropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useOnClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref}>
      <button onClick={() => setOpen(!open)}>Menu</button>
      {open && <ul>{/* items */}</ul>}
    </div>
  );
}
```

## Rules and Tips

**Naming**: always prefix with `use`. This is how the React linter (`eslint-plugin-react-hooks`) knows to enforce rules of hooks inside your function.

**Stability**: if your hook returns callbacks, wrap them in `useCallback` so they don't cause unnecessary re-renders in consumers that pass them as `useEffect` dependencies.

**Testing**: custom hooks are plain functions — test them with `@testing-library/react`'s `renderHook`. Because the logic is extracted, you can test edge cases (error states, cancellation) without mounting a full component tree.

**Composition**: hooks compose. `useSearch` can call both `useFetch` and `useDebounce` internally. Keep each hook small and single-purpose; let composition handle complexity.

Custom hooks don't add any runtime overhead — they're just function calls. What they do add is clarity: a component that reads `useFetch`, `useLocalStorage`, and `useDebounce` tells you exactly what it does in three lines rather than 30.
