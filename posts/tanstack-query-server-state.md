---
title: 'TanStack Query v5: Stop Managing Server State by Hand'
date: '2026-06-10'
image: cover.png
excerpt: If you are still fetching data with useEffect and useState, TanStack Query will feel like a superpower — caching, deduplication, background refetching, and mutations, all handled for you.
isFeatured: false
---

I was deep into my third project when I realized I was copy-pasting the same pattern every time:

```jsx
const [data, setData] = useState(null)
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState(null)

useEffect(() => {
  setIsLoading(true)
  fetch('/api/posts')
    .then(res => res.json())
    .then(json => { setData(json); setIsLoading(false) })
    .catch(err => { setError(err); setIsLoading(false) })
}, [])
```

Eight lines for what should be one. It doesn't cache, doesn't deduplicate requests, doesn't refetch in the background when the window regains focus, and has no retry logic. TanStack Query (formerly React Query) handles all of that — and more — with a clean API.

## What is TanStack Query?

TanStack Query is a library for managing **server state** in React. Server state is fundamentally different from UI state: it lives on a remote server, can become stale, must be fetched asynchronously, and is often needed by multiple components at once.

`useState` and `useReducer` are the right tools for UI state — a dropdown open/closed, a form field value, a toggle. TanStack Query is the right tool for data that comes from an API.

## Installation

```bash
npm install @tanstack/react-query
```

Wrap your app (or the relevant subtree) with `QueryClientProvider`:

```jsx
// main.jsx or App.jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  )
}
```

The `QueryClient` holds the in-memory cache. Every component inside the provider shares it automatically.

## Fetching data with useQuery

```jsx
import { useQuery } from '@tanstack/react-query'

function PostList() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const res = await fetch('/api/posts')
      if (!res.ok) throw new Error('Network response was not ok')
      return res.json()
    },
  })

  if (isPending) return <p>Loading…</p>
  if (isError) return <p>Error: {error.message}</p>

  return (
    <ul>
      {data.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

Three things worth calling out:

**`queryKey`** is the cache key. Any component that calls `useQuery` with the same key shares the same cached result — the network request fires exactly once, even if fifty components subscribe simultaneously. Include dynamic values in the key array (`['posts', userId]`) and TanStack Query treats them as separate cache entries automatically.

**`queryFn`** must return a promise that resolves to your data or throws on error. The library wraps it in retry logic (three attempts by default), background refetching on window focus, and garbage collection of stale entries.

**`isPending`** (renamed from `isLoading` in v5) is `true` only when there is no cached data *and* the query is fetching for the first time. Navigate away and come back — stale data renders instantly while a silent background refetch happens. Your users never see a loading spinner for data they already loaded minutes ago.

## Mutating data with useMutation

Reading is half the picture. Here is how to create a post and automatically refresh the list without touching any state:

```jsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

function CreatePost() {
  const queryClient = useQueryClient()

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: async (newPost) => {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      })
      if (!res.ok) throw new Error('Failed to create post')
      return res.json()
    },
    onSuccess: () => {
      // Mark the posts list as stale and trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  return (
    <div>
      <button
        onClick={() => mutate({ title: 'My new post', body: 'Content here…' })}
        disabled={isPending}
      >
        {isPending ? 'Saving…' : 'Create post'}
      </button>
      {isError && <p className="error">Error: {error.message}</p>}
    </div>
  )
}
```

`invalidateQueries` marks every cached query matching that key as stale and fires a refetch. The list component re-renders with fresh data the moment it arrives — no `setData`, no `useState`, no synchronization logic.

## Useful configuration options

```jsx
const { data } = useQuery({
  queryKey: ['posts', userId],
  queryFn: () => fetchPostsByUser(userId),
  staleTime: 5 * 60 * 1000,  // treat data as fresh for 5 minutes
  gcTime: 10 * 60 * 1000,    // keep unused cache entries for 10 minutes
  enabled: !!userId,           // skip the query entirely if userId is falsy
  retry: 2,                    // retry on error (default is 3)
})
```

`staleTime` is the one I adjust most often. The default is `0`, meaning data is immediately stale and a background refetch fires on every mount. For data that changes infrequently — a user profile, a list of categories — bumping this to a few minutes eliminates unnecessary network traffic.

`enabled` is essential when a query depends on a value that isn't available yet: a user ID from an auth query, a URL param, or a selected item in the UI. Without `enabled`, the query fires with `undefined` and your `queryFn` has to defensively handle that.

Note that `gcTime` (garbage-collection time) was called `cacheTime` in v4 — if you're migrating from an older project, rename it.

## Add the DevTools

During development, install the devtools package and drop it inside your provider:

```bash
npm install @tanstack/react-query-devtools
```

```jsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  <Router />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

You get a floating panel that shows every active query, its status, cache age, and the raw data. It changes how you debug data-fetching issues entirely — far better than `console.log` sprinkled around `useEffect` bodies.

## When to reach for it

TanStack Query is the right call when:

- You're fetching data from a REST or GraphQL API inside a React component
- Multiple components need the same remote data
- You want caching, retries, and background refetching without writing the plumbing yourself

It's overkill for fully static data (constants, feature flags bundled at build time) or purely local UI state. For those, `useState` or Context is still the right tool.

If you're on Next.js App Router, React Server Components handle the initial fetch on the server, but TanStack Query still earns its place for client-side interactions: mutations, optimistic updates, polling, and any query that reacts to user input in real time.

---

If you're still manually juggling loading/error/data triples in `useState`, give TanStack Query one afternoon. The boilerplate evaporates, the cache just works, and the refetch behavior is exactly what users expect — without you having to think about it.
