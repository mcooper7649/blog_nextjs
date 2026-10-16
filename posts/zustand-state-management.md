---
title: 'Zustand: Simple Global State Without the Boilerplate'
date: '2026-10-16'
image: cover.jpg
excerpt: Zustand gives you global React state in under 10 lines — no providers, no reducers, no boilerplate. Here is how it works and when to reach for it.
isFeatured: false
---

Every React app eventually outgrows `useState`. You need to share state between components that aren't parent-child, and suddenly you're debating Redux vs Context vs some other library. I've tried most of them. These days I reach for [Zustand](https://github.com/pmndrs/zustand) first, and I almost always stick with it.

## Why Not Context?

React Context works — until it doesn't. The problem is that every context consumer re-renders whenever the context value changes, even if it only cares about one slice of a big object. Wrapping parts of the tree in `useMemo` helps, but it gets ugly fast. Context is great for static data (themes, locales). For frequently-updated shared state, it's a footgun.

## Creating a Store

Zustand's entire API fits in one function call:

```js
// store/useCartStore.js
import { create } from 'zustand'

const useCartStore = create((set) => ({
  items: [],
  addItem: (product) =>
    set((state) => ({ items: [...state.items, product] })),
  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  clearCart: () => set({ items: [] }),
}))

export default useCartStore
```

That's the whole store. No action types, no reducers, no dispatch. `set` merges the object you return (like `setState` in a class component), so you only need to specify what changed.

## Reading State in a Component

```jsx
function CartIcon() {
  const count = useCartStore((state) => state.items.length)

  return <button>Cart ({count})</button>
}
```

The selector `(state) => state.items.length` means this component only re-renders when `items.length` changes — not when an item's name or price is updated. That's the key advantage over Context: **surgical subscriptions**.

## Updating State From Anywhere

```jsx
function ProductCard({ product }) {
  const addItem = useCartStore((state) => state.addItem)

  return (
    <div>
      <h3>{product.name}</h3>
      <button onClick={() => addItem(product)}>Add to Cart</button>
    </div>
  )
}
```

No providers. No prop drilling. Any component can read or update the store directly.

## Async Actions

Zustand doesn't have a special async primitive — you just write async functions and call `set` when you have data:

```js
const usePostsStore = create((set) => ({
  posts: [],
  isLoading: false,
  fetchPosts: async () => {
    set({ isLoading: true })
    const res = await fetch('/api/posts')
    const posts = await res.json()
    set({ posts, isLoading: false })
  },
}))
```

Call it from a component or a `useEffect` — works exactly like you'd expect.

## TypeScript Support

Zustand's TypeScript support is clean. Define your state shape as an interface and pass it as the generic:

```ts
interface CartState {
  items: Product[]
  addItem: (product: Product) => void
  removeItem: (id: string) => void
  clearCart: () => void
}

const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (product) =>
    set((state) => ({ items: [...state.items, product] })),
  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  clearCart: () => set({ items: [] }),
}))
```

Full type inference from there — selectors are typed, actions are typed, no extra configuration.

## The `persist` Middleware

One of Zustand's best built-in extras is the `persist` middleware, which syncs your store to `localStorage` automatically:

```js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set) => ({
      items: [],
      addItem: (product) =>
        set((state) => ({ items: [...state.items, product] })),
      clearCart: () => set({ items: []  }),
    }),
    { name: 'cart-storage' } // localStorage key
  )
)
```

Cart contents survive a page refresh. You can also swap `localStorage` for `sessionStorage`, IndexedDB, or a custom adapter by passing a `storage` option.

## When Zustand Is the Right Tool

Zustand shines when:

- You have state that multiple unrelated components need to read or write
- You want fine-grained subscriptions to avoid unnecessary re-renders
- You need async actions without middleware boilerplate
- You want persistence without reaching for a separate library

It's not the right tool when the state is truly local to one component (use `useState`), or when you're dealing with server data that needs caching and invalidation — that's what [TanStack Query](/posts/tanstack-query-server-state) is for. The two libraries complement each other nicely: TanStack Query for remote state, Zustand for client/UI state that multiple parts of your app share.

## Installing It

```bash
npm install zustand
```

That's the only dependency. No peer dependencies, no required providers — drop it in and start using it.

## My Takeaway

What I appreciate most about Zustand is that it stays out of my way. There's no ceremony around defining actions, no boilerplate to wire up, and no mental model to internalize beyond "create a store, subscribe to slices of it." The full source for a real-world cart store fits in 20 lines. For most React apps, that's all the global state management you'll ever need.
