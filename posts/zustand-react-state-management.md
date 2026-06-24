---
title: 'Zustand: Dead-Simple Global State for React'
date: '2026-06-24'
image: cover.jpg
excerpt: If you have ever reached for Redux to share a handful of values between components, Zustand is the dose of sanity you were looking for — no boilerplate, no providers, just a hook.
isFeatured: false
---

I have a complicated relationship with React state management. `useState` is great until the state needs to be shared. Then you either prop-drill it into oblivion or reach for Context, which works fine until you realize every consumer re-renders on every update. At that point you look at Redux and the boilerplate makes you want to close your laptop.

Then I found **Zustand** and stopped complaining.

## What is Zustand?

Zustand (German for "state") is a small (around 1 KB gzipped) state management library from the creators of Jotai and Valtio. It gives you a global store in a single function call, exposes state through a plain hook, and gets out of your way. No reducers, no action types, no Provider wrappers required.

```bash
npm install zustand
```

## Creating a Store

A store is a hook you create once with `create`. You define the initial state and the functions that update it — Zustand calls these "actions" and keeps them right next to the state they modify.

```js
import { create } from 'zustand'

const useCartStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  clearCart: () => set({ items: [] }),
}))
```

`set` merges the returned object into the store — you do not have to spread all the existing state yourself. Pass a function to `set` when you need the previous state.

## Using the Store in a Component

Call the hook anywhere in your tree. No Provider needed.

```jsx
function Cart() {
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)

  return (
    <div>
      <p>{items.length} item{items.length !== 1 ? 's' : ''} in cart</p>
      <button onClick={clearCart}>Clear cart</button>
      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.name} — ${item.price}</li>
        ))}
      </ul>
    </div>
  )
}
```

The selector you pass to `useCartStore` is what controls re-rendering. The `Cart` component above only re-renders when `items` changes — not when some unrelated part of the store updates. This is the key advantage over plain Context: **you get fine-grained subscriptions for free**.

## Subscribing to Derived Values

If you only care about `items.length`, select exactly that:

```jsx
function CartIcon() {
  const count = useCartStore((state) => state.items.length)
  return <span>{count > 0 ? `(${count})` : ''}</span>
}
```

`CartIcon` will only re-render when the count changes, not when item names or prices update.

## TypeScript Support

Add a type to `create` and you get full inference on everything:

```ts
import { create } from 'zustand'

interface CartItem {
  id: string
  name: string
  price: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  clearCart: () => void
}

const useCartStore = create<CartStore>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  clearCart: () => set({ items: [] }),
}))
```

## Persisting State to localStorage

The `persist` middleware wraps your store and saves it to storage automatically. Useful for theme preferences, auth tokens, cart state — anything you want to survive a page reload.

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeStore {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'theme-storage' } // localStorage key
  )
)
```

`persist` serializes to `localStorage` by default. You can swap it for `sessionStorage` or a custom async adapter if needed.

## Zustand vs TanStack Query

These two libraries solve different problems and work well together. I use **TanStack Query** for everything that comes from a server — fetching, caching, mutations, background refetching. I use **Zustand** for client-only state — UI state, preferences, things the server never needs to know about.

| Concern | Library |
|---|---|
| Data from an API | TanStack Query |
| Shopping cart contents | Zustand |
| User theme preference | Zustand (+ persist) |
| Paginated feed | TanStack Query |
| Modal open/closed | `useState` (local is fine) |

When in doubt: if the data has a source of truth on a server, reach for TanStack Query. If it only lives in the browser, reach for Zustand.

## When NOT to Use Zustand

Not everything needs a global store. If state is only used by one component and its children, `useState` or `useReducer` is simpler and more explicit. Reach for Zustand when:

- Multiple disconnected components need the same state.
- Prop-drilling would span more than two or three levels.
- You need persistence, devtools, or time-travel debugging on client state.

Zustand also ships a `devtools` middleware that wires into the Redux DevTools browser extension — handy when you need to inspect state history or trigger actions manually during development.

## The Bottom Line

Zustand does not try to solve every state management problem, and that is exactly why I like it. It handles shared client state with almost zero ceremony. Set up a store in 10 lines, use it from any component with a single hook call, and get fine-grained re-rendering without extra memoization gymnastics.

If your last global state solution felt like more work than the problem it solved, give Zustand 20 minutes. I think you will stay.
