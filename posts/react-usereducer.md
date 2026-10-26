---
title: 'useReducer: Managing Complex State in React'
date: '2026-10-26'
image: cover.jpg
excerpt: When useState starts to feel like juggling — multiple flags that must stay in sync, actions that update several pieces of state at once — useReducer brings order back.
isFeatured: false
---

There's a moment in most React projects where a single component accumulates one `useState` call too many. You've got `isLoading`, `isError`, `data`, `formValues`, and `submitCount` all living side by side, and every event handler updates two or three of them at once. It's not wrong, exactly — it just doesn't scale.

`useReducer` is React's answer to that problem. It's a core hook, no extra dependencies, and it gives you a Redux-style pattern at the component (or subtree) level.

## The basic shape

```jsx
const [state, dispatch] = useReducer(reducer, initialState)
```

- **`reducer`** is a pure function with the signature `(state, action) => newState`. It takes the current state and an action object and returns the next state.
- **`initialState`** is your starting state — usually a plain object.
- **`dispatch`** is a stable function (like `setState`, it never changes identity) that you call with an action to trigger a state update.

That's it. Compare it to `useState`:

```jsx
// useState
const [count, setCount] = useState(0)
setCount(count + 1)

// useReducer
const [state, dispatch] = useReducer(reducer, { count: 0 })
dispatch({ type: 'INCREMENT' })
```

For a single counter, `useState` wins on brevity. `useReducer` pays off as soon as you have multiple related values or logic that belongs together.

## A real example: async form submission

Here's a form that handles loading, success, and error states. Watch how the reducer enforces that these flags can never get out of sync:

```jsx
const initialState = {
  status: 'idle',  // 'idle' | 'loading' | 'success' | 'error'
  errorMessage: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SUBMIT':
      return { ...state, status: 'loading', errorMessage: null }
    case 'SUCCESS':
      return { ...state, status: 'success' }
    case 'ERROR':
      return { ...state, status: 'error', errorMessage: action.payload }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

function ContactForm() {
  const [state, dispatch] = useReducer(reducer, initialState)

  async function handleSubmit(e) {
    e.preventDefault()
    dispatch({ type: 'SUBMIT' })

    try {
      await submitForm(new FormData(e.target))
      dispatch({ type: 'SUCCESS' })
    } catch (err) {
      dispatch({ type: 'ERROR', payload: err.message })
    }
  }

  if (state.status === 'success') {
    return (
      <div>
        <p>Message sent! Thanks for reaching out.</p>
        <button onClick={() => dispatch({ type: 'RESET' })}>Send another</button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea name="message" required />
      <button type="submit" disabled={state.status === 'loading'}>
        {state.status === 'loading' ? 'Sending…' : 'Send'}
      </button>
      {state.status === 'error' && (
        <p className="error">{state.errorMessage}</p>
      )}
    </form>
  )
}
```

With `useState` you'd need at least three separate calls, and every handler would have to remember to update all three consistently. With `useReducer`, you dispatch a single action and the reducer handles every implication — there is no code path that sets `status: 'error'` without also clearing a stale `errorMessage`, or forgets to reset `isLoading` on success.

## TypeScript types

`useReducer` pairs very naturally with TypeScript because discriminated union types make the switch exhaustive:

```tsx
type Status = 'idle' | 'loading' | 'success' | 'error'

interface FormState {
  status: Status
  errorMessage: string | null
}

type FormAction =
  | { type: 'SUBMIT' }
  | { type: 'SUCCESS' }
  | { type: 'ERROR'; payload: string }
  | { type: 'RESET' }

function reducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SUBMIT':
      return { status: 'loading', errorMessage: null }
    case 'SUCCESS':
      return { status: 'success', errorMessage: null }
    case 'ERROR':
      return { status: 'error', errorMessage: action.payload }
    case 'RESET':
      return initialState
  }
}
```

TypeScript will now tell you if you dispatch `{ type: 'ERORR' }` (typo) or access `action.payload` in a branch where the action type has no payload. The switch also becomes exhaustive — the compiler warns if you add a new action type but forget to handle it.

## Pairing with useContext for shared state

This is the pattern I reach for when I want global-ish state without installing Redux or Zustand. It works well for things like an auth session, a shopping cart, or a notification queue.

```tsx
const CartContext = React.createContext(null)

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      }
    case 'CLEAR':
      return { items: [] }
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return React.useContext(CartContext)
}
```

Any component that calls `useCart()` gets both the current cart state and a stable `dispatch` to mutate it. The reducer lives in one file, the logic is testable in isolation (pure functions take nothing but args), and there's no subscription setup or global store to configure.

When does this start to creak? Once you need middleware (logging, analytics, side effects that don't fit in handlers), or you're coordinating between completely unrelated subtrees of the component tree. At that point, a dedicated state library earns its place. For most apps I build, though, `useReducer` + `useContext` handles 80% of the cases.

## When to choose useReducer over useState

Reach for `useReducer` when:

- **State has multiple sub-values that update together.** If you find yourself writing `setX`, `setY`, `setZ` in the same event handler, that's a sign they belong in a single object with a reducer managing transitions.
- **The next state depends on the previous state in complex ways.** Reducers make this explicit — the current state is always the first argument, so race conditions from stale closures are much harder to hit.
- **You want the state transitions to be testable and readable.** A reducer is just a function — `reducer(state, action)` returns the new state, full stop. No mocks, no `act()`, no component setup needed to test your state logic.

Keep `useState` when you have a single primitive — a boolean toggle, a string input value, a number counter. The overhead of a reducer isn't worth it there.

---

`useReducer` is one of those hooks that feels like extra ceremony the first time and then becomes a reflex. Once you've debugged a form where `isLoading` was `true` and `isError` was also `true`, the appeal of explicit, exhaustive state transitions is hard to argue with.
