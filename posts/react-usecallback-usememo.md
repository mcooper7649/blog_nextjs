---
title: 'useCallback and useMemo: When They Actually Help'
date: '2026-06-12'
image: cover.png
excerpt: Most React devs either ignore these hooks or wrap everything in them "just to be safe." Both are wrong. Here is exactly when each one earns its place.
isFeatured: false
---

I've seen both extremes in code reviews: developers who never touch `useCallback` or `useMemo`, and developers who wrap every single value and function in them "for performance." Both approaches hurt. The hooks exist to solve two specific problems, and using them outside those problems just adds noise and — yes — a small runtime cost.

Let me walk through exactly when each one is worth it.

## The core idea: referential equality

React re-renders a component when its state or props change. The catch is that JavaScript uses **referential equality** for objects and functions — two objects with identical contents are not the same value unless they share the same reference.

```js
const a = { x: 1 }
const b = { x: 1 }
console.log(a === b) // false — different references
```

Every time a React component re-renders, any object or function defined inside it gets a brand-new reference. That's usually fine. It becomes a problem in two specific situations, which map neatly to the two hooks.

---

## `useCallback` — stabilizing a function reference

`useCallback(fn, deps)` returns the same function reference across renders, only creating a new one when a dependency changes.

### When it earns its place

**1. A function is listed as a `useEffect` dependency**

```tsx
function SearchResults({ query }: { query: string }) {
  const fetchResults = useCallback(async () => {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
    return res.json()
  }, [query])

  useEffect(() => {
    fetchResults().then(setResults)
  }, [fetchResults]) // stable reference — only re-runs when query changes
}
```

Without `useCallback`, `fetchResults` is a new function on every render, so the `useEffect` fires on every render regardless of whether `query` actually changed.

**2. A callback is passed to a child wrapped in `React.memo`**

`React.memo` skips re-rendering a child when its props haven't changed. But if you pass an inline callback, it gets a new reference each time and `React.memo` never gets to skip anything.

```tsx
const ExpensiveList = React.memo(function ExpensiveList({
  items,
  onDelete,
}: {
  items: string[]
  onDelete: (item: string) => void
}) {
  return (
    <ul>
      {items.map(item => (
        <li key={item}>
          {item} <button onClick={() => onDelete(item)}>×</button>
        </li>
      ))}
    </ul>
  )
})

function Parent({ items }: { items: string[] }) {
  const [log, setLog] = useState<string[]>([])

  // Stable reference — ExpensiveList only re-renders when items changes
  const handleDelete = useCallback((item: string) => {
    setLog(prev => [...prev, `Deleted: ${item}`])
  }, [])

  return <ExpensiveList items={items} onDelete={handleDelete} />
}
```

### When it does NOT help

If you're just defining a function inside a component and calling it locally in event handlers, `useCallback` buys you nothing. The creation cost of a plain function is essentially zero.

```tsx
// This is pointless — no one depends on this reference staying stable
const handleClick = useCallback(() => {
  console.log('clicked')
}, [])
```

---

## `useMemo` — skipping expensive recalculations

`useMemo(fn, deps)` caches the return value of `fn` and only recomputes it when a dependency changes.

### When it earns its place

**1. Genuinely expensive computation**

The classic case is filtering or sorting a large dataset on every render:

```tsx
function ProductList({ products, filter }: { products: Product[]; filter: string }) {
  const filtered = useMemo(
    () =>
      products.filter(p =>
        p.name.toLowerCase().includes(filter.toLowerCase())
      ),
    [products, filter]
  )

  return <ul>{filtered.map(p => <li key={p.id}>{p.name}</li>)}</ul>
}
```

If `products` has thousands of entries and the parent re-renders frequently for unrelated reasons, memoizing the filter result is worthwhile.

**2. Stable object/array references passed to memoized children**

The same referential equality problem that affects functions also affects objects and arrays:

```tsx
function Dashboard({ userId }: { userId: number }) {
  // Without useMemo, this object is new on every render
  const queryConfig = useMemo(
    () => ({ userId, includeArchived: false }),
    [userId]
  )

  return <DataGrid config={queryConfig} />
}
```

If `DataGrid` is wrapped in `React.memo` and receives `queryConfig` as a prop, you need a stable reference or `React.memo` is useless.

### When it does NOT help

Cheap calculations — string concatenation, simple arithmetic, short array maps — are not worth memoizing. The overhead of checking the dependency array often costs more than just recomputing.

```tsx
// Not worth it — this is not expensive
const displayName = useMemo(() => `${first} ${last}`, [first, last])
// Just write: const displayName = `${first} ${last}`
```

---

## The decision rule

Before reaching for either hook, ask two questions:

1. **Is a function or object being compared by reference** (in a `useEffect` dep array, or as a prop to a `React.memo` component)?
2. **Is there a measurably expensive computation** happening on every render?

If neither is true, skip the hook. Add it when you have a concrete reason — ideally after profiling with React DevTools — not as a precaution. Premature memoization makes code harder to read without making it faster.

Both hooks are genuinely useful. They just need to be aimed at a real target.
