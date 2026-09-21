---
title: 'Building Custom React Hooks: Share Logic, Not JSX'
date: '2026-09-21'
image: cover.jpg
excerpt: Custom hooks are the best way to extract and reuse stateful logic across components. Here are four hooks I reach for in almost every project.
isFeatured: true
---

React's built-in hooks like `useState` and `useEffect` are powerful, but the real payoff comes when you compose them into **custom hooks** — functions you write yourself that encapsulate a repeatable pattern of logic. Instead of copying the same `useEffect` cleanup boilerplate into a dozen components, you write it once, test it once, and import it everywhere.

## The Only Rule That Matters

A custom hook is just a JavaScript function whose name starts with `use`. That naming convention is how React's linter (`eslint-plugin-react-hooks`) knows to enforce the rules of hooks inside it. Beyond that, it's plain JavaScript — no magic, no inheritance, no class lifecycle methods.

```ts
// valid custom hook — composes built-in hooks
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}
```

If it doesn't start with `use`, the linter won't catch stale closures or missing deps — so name it properly even for "trivial" wrappers.

---

## useDebounce

Debouncing is one of the most copy-pasted patterns in frontend code. Every search input needs it. Here's a clean, generic version:

```ts
import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```

Usage in a search component:

```tsx
function SearchBar() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (debouncedQuery) fetchResults(debouncedQuery);
  }, [debouncedQuery]);

  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

The effect fires after the user stops typing for 400 ms, not on every keystroke. The cleanup (`clearTimeout`) cancels the pending timer whenever `value` changes before the delay expires — so fast typers never flood your API.

---

## useLocalStorage

`localStorage` is synchronous and lives outside React's state, which makes it annoying to sync. This hook wraps it into a familiar `useState`-style API:

```ts
import { useState, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T) {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored(prev => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // quota exceeded or private-browsing restriction — fail silently
        }
        return next;
      });
    },
    [key]
  );

  return [stored, setValue] as const;
}
```

The lazy initializer (`useState(() => …)`) runs only once on mount, reading from `localStorage` without causing an extra render. The `try/catch` blocks handle private-browsing environments where `localStorage` throws instead of returning `null`.

---

## useFetch

A minimal data-fetching hook that covers the three states every async request has — loading, success, and error:

```ts
import { useState, useEffect } from 'react';

type Status = 'idle' | 'loading' | 'success' | 'error';

function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    setStatus('loading');

    fetch(url, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json() as Promise<T>;
      })
      .then(json => {
        setData(json);
        setStatus('success');
      })
      .catch(err => {
        if (err.name === 'AbortError') return; // component unmounted
        setError(err.message);
        setStatus('error');
      });

    return () => controller.abort();
  }, [url]);

  return { data, status, error };
}
```

The `AbortController` is critical here. When the component unmounts while a request is in-flight, the cleanup function aborts it — no stale state updates, no memory leaks, no `Can't perform a React state update on an unmounted component` warnings.

```tsx
function UserProfile({ userId }: { userId: string }) {
  const { data, status, error } = useFetch<User>(`/api/users/${userId}`);

  if (status === 'loading') return <Spinner />;
  if (status === 'error') return <p>Error: {error}</p>;
  if (!data) return null;
  return <h1>{data.name}</h1>;
}
```

For production apps I'd use [TanStack Query](https://tanstack.com/query) (which handles caching, deduplication, and background refetching), but `useFetch` is ideal for learning, prototypes, and cases where a full library is overkill.

---

## useEventListener

Manually adding and removing event listeners is a surprisingly common source of bugs — you forget the cleanup, or the handler reference changes on every render and the effect re-runs in a loop. This hook handles both:

```ts
import { useEffect, useRef } from 'react';

function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (e: WindowEventMap[K]) => void,
  element: EventTarget = window
) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const listener = (e: Event) =>
      savedHandler.current(e as WindowEventMap[K]);
    element.addEventListener(eventName, listener);
    return () => element.removeEventListener(eventName, listener);
  }, [eventName, element]);
}
```

Using a `ref` to hold the latest handler means the event listener itself is only attached once (no cleanup/re-attach churn), while always calling the current version of the callback.

```tsx
function EscapeModal({ onClose }: { onClose: () => void }) {
  useEventListener('keydown', e => {
    if (e.key === 'Escape') onClose();
  });
  return <div role="dialog">…</div>;
}
```

---

## When to Extract a Custom Hook

A rough rule: if you catch yourself copy-pasting a `useEffect` + `useState` combo a second time, make a hook. Some signals:

- The logic needs to run in multiple components with different data.
- The component is getting hard to read because of boilerplate.
- You want to test the logic in isolation without rendering a component.

Custom hooks pair especially well with unit tests — you can test them directly with `@testing-library/react-hooks` (or the `renderHook` export from `@testing-library/react` v13+) without mounting a full component tree.

The moment you understand that custom hooks are just functions that happen to call built-in hooks, a huge part of "advanced React" becomes obvious. Start small — wrap one `useEffect` — and the pattern clicks fast.
