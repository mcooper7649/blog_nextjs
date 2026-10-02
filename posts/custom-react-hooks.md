---
title: 'Custom React Hooks: Extract, Reuse, and Test Your Logic'
date: '2026-10-02'
image: cover.jpg
excerpt: Custom hooks let you pull stateful logic out of components and reuse it anywhere. Here are three real-world hooks you will actually reach for.
isFeatured: false
---

React ships with a solid set of built-in hooks, but the real power comes when you write your own. Custom hooks let you extract stateful logic into a function you can reuse across components, test in isolation, and share across projects without changing any component hierarchy. I've been leaning on them heavily in every project I build, and they've consistently made my components cleaner.

## The Only Rule Worth Remembering

A custom hook is a JavaScript (or TypeScript) function whose name starts with `use`. That naming convention is all React needs to know that the function follows the Rules of Hooks — no calling it conditionally, no calling it outside a component or another hook. Beyond the name, there's nothing magic about them.

```ts
// this IS a custom hook — React can lint-check it correctly
function useWindowWidth() { ... }

// this is NOT — React won't enforce hook rules here
function getWindowWidth() { ... }
```

## `useLocalStorage` — Persistent State in One Line

The most common hook I reach for is `useLocalStorage`. It behaves exactly like `useState` but writes every update to `localStorage` and hydrates from it on mount.

```ts
import { useState, useEffect } from 'react';

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    const next = value instanceof Function ? value(storedValue) : value;
    setStoredValue(next);
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // quota exceeded or SSR — fail silently
    }
  };

  return [storedValue, setValue] as const;
}
```

Using it looks identical to `useState`:

```tsx
function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');

  return (
    <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
      Switch to {theme === 'light' ? 'dark' : 'light'} mode
    </button>
  );
}
```

The `typeof window === 'undefined'` guard keeps it safe in Next.js SSR without any extra work.

## `useDebounce` — Tame Expensive Side Effects

Debouncing is one of those problems that shows up everywhere: search inputs, resize handlers, form auto-save. Inlining a `setTimeout` every time gets tedious. A `useDebounce` hook keeps it tidy.

```ts
import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
```

The cleanup function in the effect cancels the previous timer whenever `value` changes before the delay fires — that's the whole debounce mechanism, and it's only nine lines.

```tsx
function SearchBox() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery) return;
    fetchResults(debouncedQuery);
  }, [debouncedQuery]); // fires 300 ms after the user stops typing

  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

## `useFetch` — Lightweight Data Fetching Without a Library

TanStack Query is the right tool for production data fetching (I wrote about it [here](/posts/tanstack-query-server-state)), but for a quick prototype or a project that doesn't warrant a full caching layer, a `useFetch` hook is handy.

```ts
import { useState, useEffect } from 'react';

type FetchState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

function useFetch<T>(url: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    setState({ data: null, loading: true, error: null });

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<T>;
      })
      .then(data => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch(err => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message });
      });

    return () => { cancelled = true; };
  }, [url]);

  return state;
}
```

The `cancelled` flag prevents a state update on an unmounted component — a pattern you always need when fetching inside an effect. Using it:

```tsx
type Post = { id: number; title: string };

function PostList() {
  const { data, loading, error } = useFetch<Post[]>('/api/posts');

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Error: {error}</p>;
  return <ul>{data!.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}
```

## When to Extract a Hook

I extract logic into a custom hook when any of these are true:

- **Reuse.** The same stateful logic appears in two or more components.
- **Complexity.** A component has more than one `useEffect` and they're hard to reason about together.
- **Testability.** I want to unit-test the logic without mounting a full component. With React Testing Library's `renderHook`, custom hooks are trivial to test:

```ts
import { renderHook, act } from '@testing-library/react';

test('useDebounce delays the value', async () => {
  const { result, rerender } = renderHook(
    ({ val }) => useDebounce(val, 200),
    { initialProps: { val: 'a' } }
  );
  expect(result.current).toBe('a');
  rerender({ val: 'b' });
  expect(result.current).toBe('a'); // not yet updated
  await act(() => new Promise(r => setTimeout(r, 250)));
  expect(result.current).toBe('b');
});
```

If the logic is one `useState` call used in a single component, keep it inline. Custom hooks earn their keep when they solve a named problem you will face more than once.

## Wrapping Up

Custom hooks are one of the highest-leverage patterns in React. Once you start writing them you will find yourself reaching for the pattern constantly — your components get thinner, your logic gets easier to test, and the next time you need debounced input or persisted state you have a one-liner to drop in. Start with the three here and build from there.
