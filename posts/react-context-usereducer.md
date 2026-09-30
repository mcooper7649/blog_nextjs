---
title: 'React Context + useReducer: Lightweight State Management Without Redux'
date: '2026-09-30'
image: cover.jpg
excerpt: Before reaching for Redux or Zustand, see how far React's own Context API and useReducer hook can take you — and exactly when they stop being the right tool.
isFeatured: false
---

For years, the answer to "how do I share state across components in React?" was "add Redux." That's still a fine answer for large apps, but it comes with boilerplate that can feel disproportionate for anything small or medium-sized. Since React 16.8, the combination of the Context API and `useReducer` covers a surprising amount of ground without a single extra dependency.

## The problem: prop drilling

Suppose you have a shopping cart. The cart icon in the navbar needs to know how many items are in it. The product page needs to add to it. The checkout page needs to read and clear it. These components are spread across the component tree and have no direct parent–child relationship. Passing the cart state as props from the top down — "prop drilling" — leads to components accepting props they don't use just to hand them to their children.

Context solves this by providing a value at a high level in the tree and making it available to any descendant without explicit prop passing.

## Setting up Context

First, create the context and a provider component:

```jsx
// CartContext.jsx
import { createContext, useContext, useReducer } from 'react'

const CartContext = createContext(null)

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.id === action.item.id)
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i
          ),
        }
      }
      return { ...state, items: [...state.items, { ...action.item, qty: 1 }] }
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.id) }
    case 'CLEAR_CART':
      return { ...state, items: [] }
    default:
      throw new Error(`Unknown action: ${action.type}`)
  }
}

const initialState = { items: [] }

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
```

A few things worth noting here:

- `cartReducer` is a **pure function** — given the same state and action, it always returns the same new state. That makes it trivially testable.
- The `throw` in the `default` case is intentional. It catches typos in action types immediately instead of silently doing nothing.
- The custom `useCart` hook is a one-liner wrapper that also enforces usage inside the provider.

## Wrapping your app

```jsx
// main.jsx
import { CartProvider } from './CartContext'
import App from './App'

export default function Root() {
  return (
    <CartProvider>
      <App />
    </CartProvider>
  )
}
```

## Consuming the context

Any component inside the tree can now read and update the cart directly:

```jsx
// AddToCartButton.jsx
import { useCart } from './CartContext'

export default function AddToCartButton({ product }) {
  const { dispatch } = useCart()
  return (
    <button onClick={() => dispatch({ type: 'ADD_ITEM', item: product })}>
      Add to cart
    </button>
  )
}
```

```jsx
// CartIcon.jsx
import { useCart } from './CartContext'

export default function CartIcon() {
  const { state } = useCart()
  const count = state.items.reduce((sum, i) => sum + i.qty, 0)
  return <span>Cart ({count})</span>
}
```

No prop threading. No Redux store. No selectors library.

## Testing the reducer in isolation

Because the reducer is a pure function, you can test every state transition without mounting a single component:

```js
import { cartReducer } from './CartContext'

test('adds a new item with qty 1', () => {
  const state = { items: [] }
  const next = cartReducer(state, { type: 'ADD_ITEM', item: { id: 1, name: 'Widget' } })
  expect(next.items).toHaveLength(1)
  expect(next.items[0].qty).toBe(1)
})

test('increments qty for an existing item', () => {
  const state = { items: [{ id: 1, name: 'Widget', qty: 2 }] }
  const next = cartReducer(state, { type: 'ADD_ITEM', item: { id: 1, name: 'Widget' } })
  expect(next.items[0].qty).toBe(3)
})
```

This is a huge ergonomic win over testing Redux reducers through the full store setup.

## When Context + useReducer is the right choice

Use this pattern when:

- State is **shared across a subtree** but not truly global (a cart, a modal manager, a multi-step form).
- The update logic has **multiple distinct actions** that would be unwieldy as individual `setState` calls.
- You want **zero extra dependencies** — maybe you're building a library or keeping bundle size tight.

## When to reach for an external library instead

Context is synchronous and re-renders every subscriber when the value changes. For a small context like a cart that's fine, but if you put your entire application state in one context and dispatch actions frequently (e.g., an autocomplete search box updating on every keystroke), you'll hit unnecessary re-renders.

Signals to look for a different tool:

- **Frequent, fine-grained updates** where only some consumers should re-render — Zustand or Jotai handle subscriptions at the atom level and skip unrelated components.
- **Server state** (fetched data, caching, background refetching) — TanStack Query is purpose-built for this and much better than putting API responses in Context.
- **Time-travel debugging or Redux DevTools** — if your team relies on them heavily, Redux remains the right call.
- **Large teams where strict patterns matter** — Redux Toolkit reduces the boilerplate significantly and is worth considering at scale.

For anything in between — a mid-sized app, a feature-isolated slice of state, a side project — Context + `useReducer` is often enough, ships zero bytes of third-party code, and has a gentle learning curve for anyone who already knows React hooks.

## A quick checklist before you add a state library

1. Does the state need to be shared across components that aren't in a direct parent–child relationship? If not, local `useState` is right.
2. Does it get fetched from a server? Use TanStack Query, not Context.
3. Is the update logic complex enough that a reducer would be clearer than multiple `setState` calls? If yes, Context + `useReducer` is a good fit.
4. Are there performance concerns from high-frequency updates or a very large number of consumers? Consider Zustand.

Getting this decision right early saves a lot of refactoring later. The good news is that Context + `useReducer` can always be migrated to Zustand or Redux Toolkit with minimal changes — the reducer logic and action types are reusable as-is.
