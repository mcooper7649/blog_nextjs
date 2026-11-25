---
title: 'useTransition and startTransition: Keep React Responsive During Expensive Updates'
date: '2026-11-25'
image: cover.jpg
excerpt: React 18 lets you mark slow state updates as non-urgent so the browser stays responsive while they render.
isFeatured: false
belt: green
coverPending: true
coverPrompt: 'A traffic conductor in an orange vest directing two streams of cars at an intersection, one lane marked fast and urgent with a vermilion stripe, the other slower but steady.'
---

React re-renders synchronously by default. That means if you trigger a state update that causes a slow render tree — a large filtered list, a heavy data table, a complex chart — the browser cannot handle keypresses, scrolls, or clicks until the render finishes.

React 18 introduced a first-class way to tell React which updates are urgent and which can wait: `useTransition` and `startTransition`.

## The Problem

Say you have a search input that filters a list of 10,000 items. Typing into the input feels sluggish because every keystroke kicks off a slow re-render.

```tsx
function SlowList({ query }: { query: string }) {
  const items = ALL_ITEMS.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase())
  )
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  )
}

function Search() {
  const [query, setQuery] = useState('')

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <SlowList query={query} />
    </>
  )
}
```

Each character typed blocks the UI until `SlowList` finishes filtering and rendering. The input feels unresponsive.

## Splitting Urgent from Non-Urgent Updates

React 18 introduced the concept of *transitions* — a category of state updates that are explicitly non-urgent. React can interrupt a transition render to process urgent work (like a keypress), then resume it later.

`useTransition` gives you two things: a function to wrap non-urgent updates, and a boolean that tells you whether a transition is in-flight.

```tsx
import { useState, useTransition } from 'react'

function Search() {
  const [query, setQuery] = useState('')
  const [deferredQuery, setDeferredQuery] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Urgent: update the input immediately
    setQuery(e.target.value)

    // Non-urgent: update the filtered list in a transition
    startTransition(() => {
      setDeferredQuery(e.target.value)
    })
  }

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending && <span>Updating...</span>}
      <SlowList query={deferredQuery} />
    </>
  )
}
```

The input stays in sync with every keystroke because `setQuery` is urgent. The filtered list update is wrapped in `startTransition`, so React can delay or interrupt it when faster work (the next keypress) arrives. `isPending` is `true` while the transition is in progress — perfect for a loading indicator.

## `startTransition` Without the Hook

If you need to mark a transition from outside a component (a router, a callback library), there is a standalone `startTransition` import:

```tsx
import { startTransition } from 'react'

function goToPage(page: string) {
  startTransition(() => {
    setCurrentPage(page)
  })
}
```

The difference: the standalone version does not give you `isPending`. Use `useTransition` inside components when you want the pending state; use the standalone import in utility code that cannot call hooks.

## Transitions with Suspense

Transitions integrate well with Suspense. When a transition triggers a component that suspends (fetches data), React holds the previous UI visible instead of immediately showing the fallback, then swaps to the new content when it is ready. This avoids a jarring flash.

```tsx
function App() {
  const [page, setPage] = useState('home')
  const [isPending, startTransition] = useTransition()

  function navigate(next: string) {
    startTransition(() => setPage(next))
  }

  return (
    <>
      <nav>
        <button onClick={() => navigate('home')}>Home</button>
        <button onClick={() => navigate('profile')}>Profile</button>
      </nav>
      {isPending && <div className="loading-bar" />}
      <Suspense fallback={<Spinner />}>
        {page === 'home' ? <HomePage /> : <ProfilePage />}
      </Suspense>
    </>
  )
}
```

Without the transition, every navigation would immediately mount the `<Spinner />` fallback even if the new page loads in 50ms — a visual flicker. With the transition, React keeps the current page visible and shows the loading bar until the next page is ready.

## useTransition vs useDeferredValue

Both deal with the same problem (slow renders blocking the UI) but from different angles.

| | `useTransition` | `useDeferredValue` |
|---|---|---|
| What you control | The state *setter* call | The *value* passed to a child |
| When to reach for it | You own the state update | You receive a prop or value you cannot defer at the source |
| Gives `isPending` | Yes | No |

If you own the state and the setter, use `useTransition`. If you are receiving a value from a parent and cannot touch the setter, use `useDeferredValue`.

## What Transitions Are Not

Transitions are not async operations. Everything inside `startTransition` still runs synchronously — React just gives it lower scheduling priority. Do not put `fetch` calls or `await` expressions inside the callback directly; those belong in event handlers or data-fetching libraries. Transitions only control *rendering* priority.

Transitions also do not replace debouncing. A debounced input waits before firing the state update at all. A transition fires immediately but lets React deprioritize the resulting render. For a search-as-you-type experience the two are complementary: debounce the network request, use a transition for the local filter render.

## Practical Rule of Thumb

Reach for `useTransition` when:

- A state update causes a visibly slow render (> ~100ms).
- You want the UI to stay interactive during that render.
- You can clearly separate the "urgent" update (the input value) from the "non-urgent" one (what gets filtered or navigated to).

For most apps this means list filtering, tab/page navigation, and large data table updates — anywhere that re-renders a lot of nodes at once.
