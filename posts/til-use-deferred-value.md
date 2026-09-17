---
title: "TIL: useDeferredValue — React's Built-in Way to Defer Expensive Renders"
date: '2026-09-17'
image: cover.jpg
excerpt: React 18 ships a hook that lets you keep your UI responsive during expensive filtering or searching without a single setTimeout.
isFeatured: false
---

I've reached for `useDebounce` many times when a search input caused laggy renders. Turns out React 18 ships exactly what I needed: `useDeferredValue`.

## The problem

You have a text input that filters a large list. Every keystroke triggers a re-render of the whole list. On 10,000 items that's noticeable jank.

The usual fix is a debounce utility — wait until the user stops typing, then update. Works, but it introduces an artificial delay even when the user's device is fast.

## What useDeferredValue does

`useDeferredValue` accepts a value and returns a version of it that React is allowed to defer. React will render immediately with the *old* deferred value (keeping the UI responsive), then re-render with the updated value when the browser has an idle frame.

```jsx
import { useState, useDeferredValue, useMemo } from 'react';

function SearchList({ items }) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(
    () => items.filter(i => i.toLowerCase().includes(deferredQuery.toLowerCase())),
    [items, deferredQuery]
  );

  const isStale = query !== deferredQuery;

  return (
    <>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search…"
      />
      <ul style={{ opacity: isStale ? 0.6 : 1, transition: 'opacity 0.15s' }}>
        {filtered.map(item => <li key={item}>{item}</li>)}
      </ul>
    </>
  );
}
```

The `isStale` flag is the key UX touch: compare `query` (the live value) to `deferredQuery` (the deferred one). When they differ, the list is showing stale results, so you can dim it or show a spinner. When they match, you're current.

## How it differs from useTransition

`useTransition` wraps a *state update* — you use it when you own the setter. `useDeferredValue` wraps a *value* — useful when the value comes from props or an external source you don't control.

```jsx
// useTransition — you own the setter
const [isPending, startTransition] = useTransition();
startTransition(() => setQuery(e.target.value));

// useDeferredValue — you only have the value
const deferredQuery = useDeferredValue(queryFromProps);
```

## When to reach for it

Use it when:
- Component re-renders are visibly slow and the data comes from a frequently-changing value
- You want adaptive performance (fast on fast devices, deferred only when needed) instead of a fixed delay
- The value comes from props and you can't wrap the setter in `useTransition`

Skip it for simple lists or cheap computations — the double-render has overhead and it's not worth adding complexity for snappy UIs.

React's concurrent features are subtle but `useDeferredValue` is one of the easier wins to reach for. No extra library, no magic timeout value to tune.
