---
title: 'Custom React Hooks: Practical Patterns That Clean Up Your Components'
date: '2026-09-28'
image: cover.jpg
excerpt: Custom hooks let you pull logic out of components and reuse it anywhere. Here are four hooks I reach for on almost every project — with real TypeScript code you can drop in.
isFeatured: true
---

If you've been writing React for a while, you've probably noticed a pattern: the same logic — fetching data, syncing with `localStorage`, debouncing an input — ends up copy-pasted across components. Custom hooks fix that. They're just functions that start with `use` and can call other hooks, but used well they make your components dramatically easier to read and test.

This post walks through four hooks I actually use in production, each solving a distinct problem.

## 1. `useFetch` — Async Data Without the Boilerplate

Every component that fetches data needs loading, error, and data state. Writing that inline gets old fast.

```ts
import { useState, useEffect } from 'react';

type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

export function useFetch<T>(url: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({ status: 'idle' });

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setState({ status: 'loading' });

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<T>;
      })
      .then(data => {
        if (!cancelled) setState({ status: 'success', data });
      })
      .catch(error => {
        if (!cancelled) setState({ status: 'error', error });
      });

    return () => { cancelled = true; };
  }, [url]);

  return state;
}
```

The `cancelled` flag prevents setting state on an unmounted component — a common React gotcha when navigating away before a fetch completes. The discriminated union return type means TypeScript will make you handle every case:

```tsx
function UserCard({ id }: { id: string }) {
  const result = useFetch<User>(`/api/users/${id}`);

  if (result.status === 'loading') return <Spinner />;
  if (result.status === 'error') return <p>Error: {result.error.message}</p>;
  if (result.status !== 'success') return null;

  return <div>{result.data.name}</div>;
}
```

No `useQuery` overhead for simple cases, and the component itself contains zero async logic.

## 2. `useLocalStorage` — Persistent State That Survives Refreshes

`useState` forgets everything on page reload. `useLocalStorage` works as a drop-in replacement that persists to `localStorage`, including proper SSR safety.

```ts
import { useState, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initial: T) {
  const [stored, setStored] = useState<T>(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initial;
    } catch {
      return initial;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored(prev => {
        const next = typeof value === 'function'
          ? (value as (prev: T) => T)(prev)
          : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch { /* quota exceeded or private mode — degrade gracefully */ }
        return next;
      });
    },
    [key],
  );

  return [stored, setValue] as const;
}
```

Using it looks identical to `useState`:

```tsx
const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
```

Two things worth noting: the lazy initialiser runs only once (no flash of initial state on mount), and the `typeof window === 'undefined'` guard makes it safe in Next.js server components.

## 3. `useDebounce` — Tame Expensive Side Effects

Firing a search API call on every keystroke is wasteful. `useDebounce` delays updating a value until the user stops typing.

```ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```

Using it in a search component:

```tsx
function SearchBox() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 350);
  const results = useFetch<Result[]>(
    debouncedQuery ? `/api/search?q=${encodeURIComponent(debouncedQuery)}` : '',
  );

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {results.status === 'success' && <ResultList items={results.data} />}
    </>
  );
}
```

`debouncedQuery` only updates 350 ms after the user stops typing, so `useFetch` only fires then. Combine these two hooks and you get a fully functional debounced search with no libraries.

## 4. `useOnClickOutside` — Close Dropdowns and Modals Cleanly

Detecting a click outside a container — to close a dropdown, dismiss a popover — requires reaching into the DOM with a ref and attaching a document listener. Repeating that logic inline is messy.

```ts
import { useEffect, RefObject } from 'react';

export function useOnClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void,
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

Usage:

```tsx
function Dropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref}>
      <button onClick={() => setOpen(o => !o)}>Menu</button>
      {open && <ul>…</ul>}
    </div>
  );
}
```

The cleanup in `useEffect` ensures the listeners are removed when the component unmounts — no memory leaks.

## Rules of Thumb

A few things I've learned writing custom hooks:

- **One concern per hook.** If you catch yourself naming it `useFormAndFetch`, split it.
- **Return an object when there are three or more values**, so callers can destructure by name instead of position.
- **Keep the interface familiar.** Mirror patterns from the standard hooks (`useState`'s tuple, `useQuery`'s status union) so the hook feels native.
- **Test hooks with `renderHook` from React Testing Library**, not by wrapping them in a dummy component.

Custom hooks aren't magic — they're just functions. But extracting the right logic into them is one of the highest-leverage refactors you can do in a React codebase.
