---
title: 'Zustand: Lightweight React State Management Without the Boilerplate'
date: '2026-08-24'
image: cover.jpg
excerpt: Drop Redux and Context boilerplate. Zustand gives you global state in a single hook — here is how I actually use it in production.
isFeatured: true
---

I have been using Zustand in production for over a year now, and it has quietly become one of my favourite libraries in the React ecosystem. If you have ever felt like Redux was solving a problem you did not actually have, or found yourself drilling `useState` through five component layers because you did not want to set up a full Context + reducer, Zustand is the answer.

## What is Zustand?

Zustand (German for "state") is a tiny (~1 KB gzipped) state-management library from the same team behind Jotai and React Spring. It exposes global state through a single custom hook and gets out of your way completely. No actions, no reducers, no providers wrapping your tree — just a store and a hook.

## Creating a Store

```bash
npm install zustand
```

```ts
// store/useCartStore.ts
import { create } from 'zustand';

type CartItem = { id: string; name: string; price: number; qty: number };

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  total: () => number;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { ...item, qty: 1 }] };
    }),

  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

  clearCart: () => set({ items: [] }),

  // Derived value — computed on every call, not stored
  total: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
}));
```

Two things to notice:

1. `set` works like `setState` in a class component — it shallowly merges the object you return.
2. `get` lets you read the **current** state inside actions without closing over a stale value — really useful for derived calculations like `total()`.

## Using the Store in Components

```tsx
// components/CartBadge.tsx
import { useCartStore } from '../store/useCartStore';

export function CartBadge() {
  const count = useCartStore((state) => state.items.length);
  return <span className="badge">{count}</span>;
}
```

The selector `(state) => state.items.length` is the key pattern. Zustand runs this on every state change and re-renders the component **only** when the selected value changes. `CartBadge` will not re-render when prices change, only when items are added or removed. This is referential equality by default — for more complex selections, pass a shallow-equality checker from `zustand/shallow`.

```tsx
// components/ProductCard.tsx
import { useCartStore } from '../store/useCartStore';

export function ProductCard({ product }) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <div>
      <h3>{product.name}</h3>
      <button onClick={() => addItem(product)}>Add to cart</button>
    </div>
  );
}
```

Notice: actions are stable references, so selecting `addItem` does not cause re-renders — no `useCallback` needed.

## Async Actions

Zustand stores are plain JavaScript objects, so async actions are just async functions:

```ts
type ProductState = {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
};

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  loading: false,
  error: null,

  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch');
      const products = await res.json();
      set({ products, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
}));
```

No `redux-thunk`, no saga, no observable — just `async/await`.

## Persisting State to localStorage

The `persist` middleware serialises your store to `localStorage` (or any storage adapter) automatically:

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // ... same store as above
    }),
    {
      name: 'cart-storage', // key in localStorage
      partialize: (state) => ({ items: state.items }), // only persist items, not actions
    }
  )
);
```

When the page reloads, `items` is hydrated from `localStorage` before the first render. The `partialize` option is important — it prevents functions from being serialised (they are not JSON-serialisable anyway).

## Redux DevTools

```ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useCartStore = create<CartState>()(
  devtools(
    (set, get) => ({
      // ... store
    }),
    { name: 'CartStore' }
  )
);
```

With this in place, every `set()` call shows up in the Redux DevTools browser extension with a labelled action and a state diff. You can even time-travel. No extra setup required.

## When to Use Zustand vs Context vs TanStack Query

This is the question I get asked most:

| Scenario | Tool |
|---|---|
| Shared UI state (modals, sidebar open/closed, theme) | **Zustand** |
| Server data (fetching, caching, syncing with the backend) | **TanStack Query** |
| Config that rarely changes (locale, feature flags) | **React Context** |
| Per-component state (form inputs, toggle) | **useState / useReducer** |
| Heavy app with many developers and strict state flow | Redux Toolkit |

The rule I follow: if the state comes from a server, TanStack Query owns it. If the state is purely client-side and needs to be shared across the tree, Zustand owns it. Everything else stays local with `useState`.

## Putting It Together in a Next.js App

One gotcha in Next.js: if you use `persist` middleware, you need to handle SSR hydration carefully because `localStorage` does not exist on the server. Zustand's `persist` middleware handles this for you when you use the `skipHydration` option and call `rehydrate()` manually on mount, or simply use the store's `onFinishHydration` callback to delay rendering until the store is ready.

```tsx
// app/layout.tsx — avoid flash of empty cart on first load
'use client';
import { useEffect, useState } from 'react';
import { useCartStore } from '../store/useCartStore';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // persist middleware sets this flag once localStorage is loaded
    useCartStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useCartStore.persist.hasHydrated());
  }, []);

  if (!hydrated) return null;
  return <>{children}</>;
}
```

## Final Thoughts

Zustand has replaced both `useReducer`-with-Context and Redux in every project I have started in the past year. The API is small enough that I can teach it to a junior developer in ten minutes, and the middleware ecosystem (`persist`, `devtools`, `immer`) covers almost every production need I have run into. If you are still reaching for Redux for a medium-sized React app, give Zustand a try on your next one — I think you will not go back.
