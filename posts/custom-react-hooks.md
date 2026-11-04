---
title: 'Custom React Hooks: Extract, Reuse, and Actually Test Them'
date: '2026-11-04'
image: cover.jpg
excerpt: Custom hooks are React's best composability tool — here is how to design them well, avoid the common pitfalls, and write tests that give you real confidence.
isFeatured: false
belt: green
---

One of the most common patterns in React codebases is the same logic copy-pasted across components. A `useEffect` that syncs something to `localStorage`. A `fetch` wrapper that sets `isLoading` and `error`. A resize observer cobbled together inline.

Custom hooks exist precisely to solve this. But there's a gap between *extracting code into a function that starts with `use`* and *designing a hook that's actually reusable*. This post is about closing that gap.

## What Makes a Hook Worth Extracting

A piece of logic is a good hook candidate when it:

1. **Mixes state and side effects** — this is the core value proposition of hooks
2. **Will genuinely be called from more than one place** — or is complex enough that isolating it makes the component dramatically easier to read
3. **Has a coherent, nameable contract** — if you can't describe what it does in four words, it may be doing too much

Don't extract a hook just to feel tidy. Three similar lines in a component is better than a premature abstraction.

## useLocalStorage: The Classic

This hook wraps `localStorage` with the full `useState`-like API so components never touch the storage API directly:

```ts
import { useState, useCallback } from 'react'

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const next = value instanceof Function ? value(storedValue) : value
        setStoredValue(next)
        window.localStorage.setItem(key, JSON.stringify(next))
      } catch {
        // SSR, private mode, or storage full — degrade gracefully
      }
    },
    [key, storedValue]
  )

  return [storedValue, setValue] as const
}
```

Usage is identical to `useState`:

```tsx
const [theme, setTheme] = useLocalStorage('theme', 'dark')
```

The lazy initializer in `useState(() => ...)` is important — it only runs once and avoids reading `localStorage` on every render. The `try/catch` blocks handle SSR (where `window` doesn't exist), storage being blocked, malformed JSON, and writes that fail because the quota is full.

One caveat for server-rendered apps: the server renders `initialValue`, but the browser's first render may read something different from storage, which causes a hydration mismatch. In Next.js, either read storage in a `useEffect` after mount or use `useSyncExternalStore`.

## useDebounce: Essential for Search Inputs

Debouncing is one of those things every developer reimplements. Extract it once:

```ts
import { useState, useEffect } from 'react'

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
```

The cleanup function is what makes this correct — it clears the previous timeout whenever `value` changes before the delay fires, so only the *last* value in a burst makes it through.

Using it in a search component:

```tsx
function SearchBar() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 350)

  useEffect(() => {
    if (debouncedQuery) fetchResults(debouncedQuery)
  }, [debouncedQuery])

  return <input value={query} onChange={e => setQuery(e.target.value)} />
}
```

## useFetch: When TanStack Query Is Overkill

For a quick prototype or a simple static site, TanStack Query is too much. This covers the common case:

```ts
import { useState, useEffect } from 'react'

type State<T> = { data: T | null; isLoading: boolean; error: string | null }

function useFetch<T>(url: string) {
  const [state, setState] = useState<State<T>>({
    data: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    setState({ data: null, isLoading: true, error: null })

    fetch(url, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<T>
      })
      .then(data => setState({ data, isLoading: false, error: null }))
      .catch(err => {
        if (err.name !== 'AbortError') {
          setState({ data: null, isLoading: false, error: err.message })
        }
      })

    return () => controller.abort()
  }, [url])

  return state
}
```

The `AbortController` is what makes this safe. When `url` changes or the component unmounts, the cleanup function cancels the in-flight request, so an older response can never overwrite a newer one.

## Testing Custom Hooks

This is where most tutorials stop, but it's arguably the most important part. Use `@testing-library/react` — specifically `renderHook`:

```ts
// useDebounce.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300))
    expect(result.current).toBe('hello')
  })

  it('does not update before the delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'hello' } }
    )
    rerender({ value: 'world' })
    act(() => vi.advanceTimersByTime(299))
    expect(result.current).toBe('hello')
  })

  it('updates after the delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'hello' } }
    )
    rerender({ value: 'world' })
    act(() => vi.advanceTimersByTime(300))
    expect(result.current).toBe('world')
  })
})
```

Fake timers let you test time-dependent behavior without actually waiting. The key insight is that `renderHook` lets you test a hook in isolation — no boilerplate component required.

## A Rule of Thumb for the API

Before you finalize a hook, ask: *does the return value feel like a natural primitive?*

- `useLocalStorage` → returns `[value, setter]` — mirrors `useState`, immediately familiar
- `useDebounce` → returns a single value — simple, no ceremony
- `useFetch` → returns `{ data, isLoading, error }` — object when there are three distinct things the caller needs

When a hook returns an object with more than four fields, that's usually a sign it's doing too much and should be split.

Custom hooks are one of the best parts of the React model. The discipline is knowing *when* to extract and *how* to design the contract so the hook is genuinely composable — not just a home for logic that didn't fit anywhere else.
