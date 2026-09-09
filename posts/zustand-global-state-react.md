---
title: 'Zustand: Simple Global State for React Without the Boilerplate'
date: '2026-09-09'
image: cover.jpg
excerpt: Zustand gives you a dead-simple global store in React — no reducers, no Providers, just a hook. Here is how I actually use it.
isFeatured: false
---

After years of wrestling with Redux and even the occasionally verbose React Context setup, I started reaching for [Zustand](https://github.com/pmndrs/zustand) for nearly every project that needs shared state. It is a small library (~1 kB gzipped) that stays out of your way and lets you write stores that feel like regular JavaScript objects.

If you already have TanStack Query handling your server state (which I covered in a [previous post](/posts/tanstack-query-server-state)), Zustand is the natural complement for the client-side global state that TanStack Query was never meant to manage: UI toggles, user preferences, multi-step wizard data, shopping carts — anything that lives entirely on the client.

## Installation

```bash
npm install zustand
```

That is it. No peer dependencies, no required Providers to wrap your app in, no DevTools plugin you need to wire up just to get started.

## Your First Store

A Zustand store is created with `create`. You pass it a function that receives `set` (and optionally `get`) and returns your initial state plus the actions that mutate it.

```ts
// store/useCartStore.ts
import { create } from 'zustand';

type CartItem = { id: string; name: string; price: number; qty: number };

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartStore>((set) => ({
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
}));
```

No reducer switch statement. No action types. No `dispatch`. Just call the function.

## Using the Store in Components

`useCartStore` is a regular React hook. Subscribe to only the slice you need so the component only re-renders when *that* slice changes:

```tsx
// components/CartIcon.tsx
import { useCartStore } from '@/store/useCartStore';

export function CartIcon() {
  const itemCount = useCartStore((state) =>
    state.items.reduce((sum, i) => sum + i.qty, 0)
  );

  return <button>Cart ({itemCount})</button>;
}
```

```tsx
// components/ProductCard.tsx
import { useCartStore } from '@/store/useCartStore';

export function ProductCard({ product }) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <div>
      <h3>{product.name}</h3>
      <button onClick={() => addItem(product)}>Add to Cart</button>
    </div>
  );
}
```

`CartIcon` only re-renders when the total count changes. `ProductCard` only grabs `addItem`, which is a stable reference, so it never re-renders from store changes at all. No `React.memo` gymnastics required.

## Async Actions

Zustand does not care whether your actions are synchronous or async — just call `set` when you are ready:

```ts
type AuthStore = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const user = await authApi.signIn(email, password);
      set({ user, loading: false });
    } catch {
      set({ loading: false });
      throw new Error('Login failed');
    }
  },

  logout: () => set({ user: null }),
}));
```

No `createAsyncThunk`. No extra middleware. You get the same clean ergonomics for async that you have for sync.

## Persisting State to localStorage

Zustand ships optional middleware. The `persist` middleware serializes your store to `localStorage` (or any storage adapter) with two extra lines:

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'dark' as 'dark' | 'light',
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'theme-preference' } // localStorage key
  )
);
```

On the next page load the store is rehydrated automatically. You can also pass `partialize` to persist only a subset of the state, which is useful for stores where you want to skip derived or transient values.

## Zustand vs Context vs TanStack Query

The three tools are not in competition — they solve different problems:

| | Zustand | React Context | TanStack Query |
|---|---|---|---|
| **Best for** | Shared client state (cart, auth, UI) | Prop drilling avoidance for stable values | Server/async state (API data) |
| **Re-render control** | Fine-grained with selectors | Coarse (all consumers re-render) | Smart — caches, deduplicates |
| **Async story** | Manual | Manual | First-class |
| **Boilerplate** | Minimal | Minimal–medium | Medium |
| **Bundle size** | ~1 kB | 0 (built-in) | ~13 kB |

My rule of thumb: use TanStack Query for anything that comes from a network, Zustand for anything that is entirely client-side and shared across the tree, and plain `useState`/`useReducer` for state that only one component cares about.

## Conclusion

Zustand earned its place in my toolkit by doing exactly what it says on the tin. The API is tiny enough to learn in 20 minutes, the TypeScript support is first-class, and the selector-based subscriptions give you fine-grained reactivity without any ceremony. If you have been putting off replacing that bloated Redux setup, give Zustand a weekend — you probably will not need the weekend.
