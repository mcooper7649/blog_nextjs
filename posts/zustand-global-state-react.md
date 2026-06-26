---
title: 'Zustand: Lightweight Global State for React Without the Boilerplate'
date: '2026-06-26'
image: cover.jpg
excerpt: Zustand gives you a dead-simple global store with no providers, no reducers, and no ceremony — just a hook. Here is how I use it alongside TanStack Query.
isFeatured: false
---

If you have ever reached for Redux to share a piece of state between two sibling components, you know the tax: configure the store, write an action creator, write a reducer, wrap your app in a Provider, connect the component, and finally read the value. Zustand takes a different bet — what if global state was just a hook?

## What Zustand is (and isn't)

Zustand is a client-side state library. It is for state that lives in the browser and changes in response to user interaction: the currently logged-in user, a shopping cart, a sidebar open/closed flag, a list of selected items. It is not a data-fetching library — if the state lives on a server, reach for TanStack Query instead. The two pair well together: TanStack Query owns everything that comes from an API, Zustand owns everything that is purely local to the session.

```bash
npm install zustand
```

No peer dependencies, about 1 KB gzipped. Nothing to configure at the app level.

## Creating a store

```js
// store/useCartStore.js
import { create } from 'zustand'

const useCartStore = create((set) => ({
  items: [],
  addItem: (item) =>
    set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  clearCart: () => set({ items: [] }),
}))

export default useCartStore
```

`create` takes a function that receives `set` and returns your initial state plus any actions. `set` merges the object you pass into the current state — shallow merge, like `setState` in a class component. If you need the previous state (for arrays or derived values), pass a function to `set` as shown above.

## Reading state in a component

```jsx
import useCartStore from '../store/useCartStore'

function CartBadge() {
  const itemCount = useCartStore((state) => state.items.length)
  return <span>{itemCount}</span>
}

function CartPage() {
  const { items, removeItem, clearCart } = useCartStore()
  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>
          <span>{item.name}</span>
          <button onClick={() => removeItem(item.id)}>Remove</button>
        </div>
      ))}
      <button onClick={clearCart}>Clear all</button>
    </div>
  )
}
```

Notice there is no `Provider` anywhere. The store is a module-level singleton. Every component that calls `useCartStore` shares the same state automatically, and Zustand handles subscriptions and re-renders internally.

The selector pattern (`state => state.items.length`) is worth using when you only need part of the store. `CartBadge` re-renders only when `items.length` changes, not on every state update. Without a selector, the component subscribes to the whole store and re-renders whenever anything in it changes.

## Adding a simple auth slice

Real apps usually have more than one concern. You can split your store into multiple files — one hook per domain — or combine them using a slice pattern:

```js
// store/useAuthStore.js
import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}))

export default useAuthStore
```

Reading from two separate stores in one component is just two hook calls:

```jsx
function Header() {
  const user = useAuthStore((state) => state.user)
  const itemCount = useCartStore((state) => state.items.length)
  return (
    <header>
      <span>Hi, {user?.name ?? 'guest'}</span>
      <CartBadge count={itemCount} />
    </header>
  )
}
```

## Persisting state to localStorage

Zustand ships a `persist` middleware that serializes your store to `localStorage` (or any custom storage) and rehydrates it on page load. Useful for a cart, a user preference, or a theme setting that should survive a refresh.

```js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => ({ items: [...state.items, item] })),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-storage', // localStorage key
    }
  )
)
```

That is the entire change needed for persistence. Zustand serializes state to JSON on every `set` call and deserializes on first mount. If you need to exclude sensitive fields (like a token), use the `partialize` option:

```js
persist(fn, {
  name: 'app-storage',
  partialize: (state) => ({ theme: state.theme }), // only persist theme
})
```

## Devtools

Install the [Redux DevTools](https://github.com/reduxjs/redux-devtools) browser extension and wrap your store with the `devtools` middleware:

```js
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const useCartStore = create(
  devtools(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => ({ items: [...state.items, item] }), false, 'addItem'),
      clearCart: () => set({ items: [] }, false, 'clearCart'),
    }),
    { name: 'CartStore' }
  )
)
```

The third argument to `set` is the action name that shows up in the DevTools timeline. You get a full history of state changes, the ability to time-travel, and the current state snapshot — the same debugging experience as Redux without any of the Redux setup.

## When I reach for Zustand vs alternatives

**useState / useReducer** — good for state that lives in one component or a tight parent-child tree. Passing it through two levels of props is fine; lifting it to global state is premature.

**React Context** — reasonable for low-frequency updates like a theme or a locale that the whole tree needs. Context re-renders every consumer on change, so it gets painful for high-frequency state (form values, hover states, shopping cart mutations). Zustand handles high-frequency updates efficiently because components subscribe to slices with selectors.

**Redux Toolkit** — still the right call for very large teams or apps where the structured action/reducer/selector pattern pays off as a coordination mechanism. For solo projects or small teams, Zustand's lack of ceremony is a meaningful advantage.

**Jotai / Recoil** — atom-based models that are a better fit when you have many independent pieces of state that should each re-render independently. Zustand's store-per-domain model works well up to medium complexity; atom libraries shine at fine-grained subscriptions across large state graphs.

---

Zustand earns its place as my default global state tool because it is almost invisible — the API is tiny enough to hold in your head, the store is testable without mocking providers, and the devtools middleware gives you observability for free. Pair it with TanStack Query for server state and you have covered every real state management need in a React app without reaching for a framework.
