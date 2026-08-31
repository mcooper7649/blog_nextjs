---
title: 'Zustand: Simple, Scalable Global State for React'
date: '2026-08-31'
image: cover.jpg
excerpt: Zustand gives you a global store with almost no boilerplate — no providers, no reducers, no action creators. Just a hook and a few lines of code.
isFeatured: false
---

I've shipped projects with `useState` lifted to the top, Context + `useReducer`, and full Redux Toolkit setups. Each has its place. But for most mid-size React apps — something past "one page" but not Facebook — I keep coming back to **Zustand**.

It's small (under 1 KB gzipped), requires no providers wrapping your app, and the entire mental model fits in your head in a single afternoon. Here's how I actually use it.

## What problem does it solve?

React's built-in state is excellent for local UI state: a modal open/closed, a form field value, a selected tab. The trouble starts when that state needs to be shared across distant components. You have two options:

1. **Prop-drilling** — pass state and callbacks down through every intermediate component. Works, but turns your component tree into a telephone game.
2. **Context + useReducer** — avoids drilling but causes every subscriber to re-render whenever *any* part of the context value changes. Context is not optimized for frequent updates.

Zustand sits in the gap: genuinely global state, with granular subscriptions so components only re-render when the slice they care about changes.

## Installation

```bash
npm install zustand
```

No peer dependencies, no polyfills, no extra config. That's it.

## Creating a store

A Zustand store is a single `create` call. Let's build a shopping-cart store:

```ts
import { create } from 'zustand'

type CartItem = { id: string; name: string; price: number; qty: number }

type CartStore = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  clearCart: () => void
  total: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, qty: i.qty + 1 } : i
          ),
        }
      }
      return { items: [...state.items, { ...item, qty: 1 }] }
    }),

  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

  clearCart: () => set({ items: [] }),

  // Derived value — reads from the store without subscribing
  total: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
}))
```

A few things to notice:

- **`set`** merges state shallowly (like `setState` in class components), so you only return the keys you want to update.
- **`get`** reads the current state inside actions — handy for computed values and async operations.
- **Everything lives in one place**: state shape, initial values, and actions. No separate action files, no reducers, no dispatch.

## Using the store in components

```tsx
import { useCartStore } from '@/store/cartStore'

export function CartIcon() {
  // Subscribe to only the `items` slice — won't re-render when `total` changes
  const items = useCartStore((state) => state.items)
  return <span>{items.reduce((n, i) => n + i.qty, 0)}</span>
}

export function CartTotal() {
  const total = useCartStore((state) => state.total())
  return <p>Total: ${total.toFixed(2)}</p>
}

export function AddToCartButton({ product }: { product: CartItem }) {
  const addItem = useCartStore((state) => state.addItem)
  return <button onClick={() => addItem(product)}>Add to cart</button>
}
```

Each component passes a **selector function** to `useCartStore`. Zustand uses strict equality on the selector's return value to decide whether to re-render. `CartIcon` won't re-render just because `total` changes, and `CartTotal` won't re-render just because someone updates a different store entirely.

This is the critical difference from Context: fine-grained reactivity without boilerplate.

## Persisting state across page loads

Zustand ships a `persist` middleware that wraps your store and syncs it to `localStorage` (or any other storage adapter) automatically:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // ... same store body as above
    }),
    {
      name: 'cart-storage', // localStorage key
      partialize: (state) => ({ items: state.items }), // only persist items, not functions
    }
  )
)
```

Reload the page and the cart is still there. The `partialize` option is important — you only want to serialize data, not action functions.

## Async actions

Actions can be `async` without any middleware or special handling:

```ts
type ProductStore = {
  products: Product[]
  loading: boolean
  fetchProducts: () => Promise<void>
}

export const useProductStore = create<ProductStore>((set) => ({
  products: [],
  loading: false,
  fetchProducts: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/products')
      const products = await res.json()
      set({ products, loading: false })
    } catch {
      set({ loading: false })
    }
  },
}))
```

Call `fetchProducts()` in a `useEffect`, a button handler, or a Next.js layout — the store stays in sync regardless of where the action is triggered.

## Zustand vs Context vs Redux: the quick answer

| Scenario | Best pick |
|---|---|
| State used by 1–2 sibling components | `useState` + props |
| Infrequently updated global state (theme, auth user) | React Context |
| Frequently updated or complex global state | **Zustand** |
| Very large team, strict unidirectional data flow, time-travel debugging | Redux Toolkit |

Context isn't bad — for a theme toggle or an authenticated user object that barely changes, it's perfect. The problem is using Context for state that changes on every keypress or every scroll event. That's where the unnecessary re-renders pile up and Zustand shines.

Redux Toolkit is still the right call for large enterprise apps where strict patterns matter more than brevity. But for most personal projects, startup frontends, or any app where you'd otherwise reach for Context as a workaround for prop-drilling, Zustand is the sweet spot.

## One last tip: slice pattern for large stores

As your store grows, split it into slices and compose them in a single `create` call:

```ts
// store/slices/uiSlice.ts
export type UiSlice = { sidebarOpen: boolean; toggleSidebar: () => void }
export const createUiSlice = (set: any): UiSlice => ({
  sidebarOpen: false,
  toggleSidebar: () => set((s: any) => ({ sidebarOpen: !s.sidebarOpen })),
})

// store/index.ts
import { create } from 'zustand'
import { createUiSlice, UiSlice } from './slices/uiSlice'
import { createCartSlice, CartSlice } from './slices/cartSlice'

export const useStore = create<UiSlice & CartSlice>()((...a) => ({
  ...createUiSlice(...a),
  ...createCartSlice(...a),
}))
```

Each slice is a plain function, easy to test in isolation, and the combined store exposes everything through one hook. Scale as far as you need without a framework.

---

Zustand won me over because it gets out of the way. No context provider tree, no action-type constants, no boilerplate to write before you can store a single value. Install it, call `create`, and you have global state that re-renders only what needs to re-render. For everything in between a toy app and a large Redux project, that's usually exactly what I need.
