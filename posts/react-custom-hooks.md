---
title: 'Building Reusable Custom Hooks in React'
date: '2026-06-19'
image: cover.jpg
excerpt: Custom hooks let you extract repeated logic from components into clean, testable, shareable functions — here is how to build three you will actually use.
isFeatured: false
---

Custom hooks are the React feature developers sleep on the longest, then wonder how they lived without. They are just functions that call other hooks — no special syntax, no new APIs — but they let you pull repeated logic out of components into something shareable, testable in isolation, and composable with other hooks.

I am going to walk through three custom hooks I reach for constantly: `useLocalStorage`, `useDebounce`, and `useFetch`. By the end you will have a pattern you can apply to any hook you need to write.

## The one rule you must follow

Custom hooks must start with `use`. That is not a style preference — React's linter enforces it. The prefix tells React (and ESLint's exhaustive-deps rule) that the function may call other hooks, which only works inside React's render context.

```jsx
// ✅ valid — React treats this as a hook
function useLocalStorage(key, initialValue) { ... }

// ❌ invalid — React won't track hook calls inside this
function getLocalStorage(key, initialValue) { ... }
```

Everything else — arguments, return shape, internal implementation — is up to you.

## useLocalStorage

React's `useState` is ephemeral: a page refresh wipes it. `useLocalStorage` behaves identically from the call site but syncs to `localStorage` under the hood.

```jsx
import { useState } from 'react'

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value
    setStoredValue(valueToStore)
    try {
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch {
      console.error('useLocalStorage: could not write to localStorage')
    }
  }

  return [storedValue, setValue]
}
```

Usage:

```jsx
function Settings() {
  const [theme, setTheme] = useLocalStorage('theme', 'dark')

  return (
    <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
      Switch to {theme === 'dark' ? 'light' : 'dark'} mode
    </button>
  )
}
```

A few things worth explaining. I initialize state with a **lazy initializer** (a function) so `localStorage` is only read once on mount, not on every render. The `typeof window === 'undefined'` guard prevents crashes in SSR environments like Next.js where `window` does not exist during the server render. Both the read and write are wrapped in `try/catch` because `localStorage` can be disabled by browser policy or private-browsing restrictions.

## useDebounce

Debouncing delays a value update until the user stops typing (or resizing, or moving). Without it, searching as you type fires an API call on every keystroke.

```jsx
import { useState, useEffect } from 'react'

function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
```

Usage with TanStack Query:

```jsx
function SearchBox() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 400)

  const { data } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => fetchResults(debouncedQuery),
    enabled: debouncedQuery.length > 2,
  })

  return (
    <>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search…"
      />
      {data?.map(result => <p key={result.id}>{result.title}</p>)}
    </>
  )
}
```

The cleanup function (`return () => clearTimeout(timer)`) is the critical detail. Every time `value` changes, the previous timer is cancelled and a fresh one starts. The debounced value only updates once the user pauses for `delay` milliseconds.

Notice I am combining `useDebounce` with TanStack Query's `enabled` option — two hooks composing cleanly. This is the real power of custom hooks: each one does one thing, and you stack them to get complex behavior without complex components.

## useFetch

If you are not using TanStack Query, a solid `useFetch` hook eliminates the standard fetch boilerplate:

```jsx
import { useState, useEffect, useRef } from 'react'

function useFetch(url) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  useEffect(() => {
    if (!url) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    fetch(url, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(json => {
        setData(json)
        setLoading(false)
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err)
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [url])

  return { data, loading, error }
}
```

Usage:

```jsx
function UserProfile({ userId }) {
  const { data: user, loading, error } = useFetch(`/api/users/${userId}`)

  if (loading) return <p>Loading…</p>
  if (error) return <p>Error: {error.message}</p>
  return <h1>{user.name}</h1>
}
```

The `AbortController` separates a production-ready hook from a naive one. Without it, if the component unmounts while a request is in flight — or if `userId` changes before the previous response arrives — you get the classic "can't perform a React state update on an unmounted component" warning. Aborting the previous request in each effect cleanup prevents that entirely.

## When to extract a custom hook

Extract when you find yourself copying the same `useState`/`useEffect` block into a second component. The signal is **duplication**, not complexity. A hook with three lines is still worth writing if it captures an important pattern.

Do not extract prematurely. A one-off `useEffect` embedded in a single component is perfectly fine. The abstraction pays off when you actually reuse it.

One more thing: custom hooks are trivial to unit-test with `@testing-library/react`'s `renderHook` utility. That alone is a good reason to pull shared logic into a hook rather than leave it buried inside a component.

```jsx
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage'

test('stores and retrieves a value', () => {
  const { result } = renderHook(() => useLocalStorage('key', 'initial'))

  expect(result.current[0]).toBe('initial')

  act(() => result.current[1]('updated'))

  expect(result.current[0]).toBe('updated')
  expect(localStorage.getItem('key')).toBe('"updated"')
})
```

---

The three hooks above — `useLocalStorage`, `useDebounce`, and `useFetch` — cover a large share of the cases where developers reach for a third-party utility. Build them yourself once and you understand exactly what they do, when they fail, and how to extend them. The pattern scales: any repeated stateful behavior in your app is a candidate for extraction into a hook of its own.
