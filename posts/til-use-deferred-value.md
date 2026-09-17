---
title: "TIL: useDeferredValue — React's Built-in Way to Defer Expensive Renders"
date: '2026-09-17'
image: cover.jpg
excerpt: React 18 ships a hook that lets you keep your UI responsive during expensive filtering or searching without a single setTimeout.
isFeatured: false
belt: green
---

A debounce hook is the usual fix when a search input causes laggy renders, but React 18 ships another option: `useDeferredValue`.

## The problem

You have a text input that filters a large list. Every keystroke triggers a re-render of the whole list. On 10,000 items that's noticeable jank.

The usual fix is a debounce utility — wait until the user stops typing, then update. That works, but it introduces an artificial delay even when the user's device is fast.

## What useDeferredValue does

`useDeferredValue` accepts a value and returns a version of it that React is allowed to defer. React first re-renders with the *old* deferred value (keeping the input responsive), then tries a second render with the new value in the background. If the user types again, that background render is abandoned.

```jsx
import { useState, useDeferredValue, memo } from 'react';

// memo is essential: it lets React skip this render when the query hasn't changed
const SlowList = memo(function SlowList({ items, query }) {
  const filtered = items.filter(i => i.toLowerCase().includes(query.toLowerCase()));
  return (
    <ul>
      {filtered.map(item => <li key={item}>{item}</li>)}
    </ul>
  );
});

function SearchList({ items }) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const isStale = query !== deferredQuery;

  return (
    <>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search…"
      />
      <div style={{ opacity: isStale ? 0.6 : 1, transition: 'opacity 0.15s' }}>
        <SlowList items={items} query={deferredQuery} />
      </div>
    </>
  );
}
```

Without `memo`, `SlowList` would re-render with the parent on every keystroke, and deferring would gain nothing. The `isStale` flag is the key UX touch: compare `query` (the live value) to `deferredQuery` (the deferred one). When they differ, the list is showing stale results, so you can dim it or show a spinner. When they match, you're current.

## How it differs from useTransition

`useTransition` wraps a *state update* — you use it when you own the setter. `useDeferredValue` wraps a *value* — useful when the value comes from props or an external source you don't control.

```jsx
// useTransition — you own the setter
const [isPending, startTransition] = useTransition();
startTransition(() => setResults(search(e.target.value)));

// useDeferredValue — you only have the value
const deferredQuery = useDeferredValue(queryFromProps);
```

A controlled input's own state can't go in a transition, because the input has to update right away. That's why the example above defers the value instead.

## When to reach for it

Use it when:
- Component re-renders are visibly slow and the data comes from a frequently-changing value
- You want adaptive performance (fast on fast devices, deferred only when needed) instead of a fixed delay
- The value comes from props and you can't wrap the setter in `useTransition`

Skip it for simple lists or cheap computations, where the extra render isn't worth the complexity. And it doesn't reduce network requests, so keep a debounce for search-as-you-type API calls.

React's concurrent features are subtle, but `useDeferredValue` is one of the easier ones to use: no extra library and no timeout value to tune.
