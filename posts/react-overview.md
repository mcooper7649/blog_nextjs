---
title: React Overview
excerpt: A JavaScript library for building user interfaces
image: react-main.png
isFeatured: true
date: '2022-06-07'
belt: white
---

React is a JavaScript library for building user interfaces. It was created by Facebook and open-sourced in 2013. Today it powers some of the largest apps on the web and has one of the most active ecosystems in frontend development.

This guide covers the fundamentals you need to start building with React — components, JSX, state, props, hooks, and routing.

---

## What is React?

React is a **component-based UI library**. Rather than writing one large HTML file, you break your interface into small, reusable pieces and compose them together.

React uses a **virtual DOM**: a lightweight in-memory representation of the real DOM. When state changes, React calculates the minimum set of updates needed and applies only those to the browser DOM. This makes complex, dynamic UIs fast without manual DOM manipulation.

React handles the view layer only. It doesn't prescribe a router, a data-fetching strategy, or a state manager — you bring those yourself, or use a framework like Next.js that bundles them for you.

---

## Components

A component is a function (or class) that returns JSX describing what should appear on screen. Modern React uses **function components** almost exclusively.

```jsx
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>;
}
```

Components are composable — you use them exactly like HTML tags:

```jsx
function App() {
  return (
    <main>
      <Greeting name="Alice" />
      <Greeting name="Bob" />
    </main>
  );
}
```

A few rules apply:
- Component names must start with a capital letter so React can distinguish them from plain HTML elements.
- A component must return a single root element. If you need to return siblings without a wrapper `<div>`, use a **Fragment**: `<>…</>`.
- Keep components small. If a function is doing too much, split it.

---

## JSX

JSX is a syntax extension that lets you write HTML-like markup inside JavaScript. The build tool (Vite, Next.js, etc.) compiles it to `React.createElement()` calls before it reaches the browser.

```jsx
// JSX
const element = <p className="note">Hello</p>;

// What it compiles to
const element = React.createElement('p', { className: 'note' }, 'Hello');
```

A few JSX differences from HTML:
- Use `className` instead of `class`.
- Self-closing tags must be explicit: `<img />`, `<br />`.
- JavaScript expressions go inside `{}`: `<p>{user.name}</p>`.
- Event handlers are camelCase: `onClick`, `onChange`, `onSubmit`.

---

## Props

Props are how a parent component passes data to a child. They flow in one direction — from parent to child — and the child cannot modify them directly.

```jsx
function Card({ title, description, highlighted = false }) {
  return (
    <div style={{ border: highlighted ? '2px solid blue' : '1px solid gray' }}>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

// Usage
<Card
  title="Getting Started"
  description="Everything you need to know."
  highlighted={true}
/>
```

You can pass any JavaScript value as a prop: strings, numbers, booleans, objects, arrays, and even functions (callbacks). The `children` prop holds anything placed between the component's opening and closing tags:

```jsx
function Panel({ children }) {
  return <div className="panel">{children}</div>;
}

<Panel>
  <h2>Title</h2>
  <p>Content goes here.</p>
</Panel>
```

---

## State

While props represent data passed in from outside, **state** is data managed inside the component. When state changes, React re-renders the component and any children that depend on it.

The `useState` hook is the primary way to add state to a function component:

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}
```

`useState` returns a pair: the current value and a setter function. Always call the setter instead of mutating the value directly — React needs to know something changed so it can schedule a re-render.

For state derived from the previous value, use the functional update form to avoid stale closures:

```jsx
setCount((prev) => prev + 1);
```

---

## Hooks

Hooks are functions that let you "hook into" React features from function components. They always start with `use`.

### `useEffect`

`useEffect` lets you synchronise a component with an external system: fetching data, setting up subscriptions, updating the page title, etc.

```jsx
import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setUser(data);
      });

    return () => {
      cancelled = true; // cleanup on unmount or before next run
    };
  }, [userId]); // re-run whenever userId changes

  if (!user) return <p>Loading…</p>;
  return <h1>{user.name}</h1>;
}
```

The dependency array controls when the effect runs:
- **No array**: runs after every render.
- **Empty array `[]`**: runs once after the initial mount.
- **Array with values**: runs after the initial mount and whenever a listed value changes.

### `useRef`

`useRef` gives you a mutable container that persists across renders without triggering re-renders. It's most often used to access a DOM element directly:

```jsx
import { useRef } from 'react';

function FocusInput() {
  const inputRef = useRef(null);

  return (
    <>
      <input ref={inputRef} type="text" />
      <button onClick={() => inputRef.current.focus()}>Focus</button>
    </>
  );
}
```

### `useContext`

`useContext` reads a value from the nearest matching `Context.Provider` above the component in the tree — without having to pass props through every intermediate component.

```jsx
import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext('light');

function App() {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeContext.Provider value={theme}>
      <Toolbar />
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle theme
      </button>
    </ThemeContext.Provider>
  );
}

function Toolbar() {
  return <ThemedButton />;
}

function ThemedButton() {
  const theme = useContext(ThemeContext); // no prop drilling needed
  return <button className={theme}>Click me</button>;
}
```

Other common hooks you will use regularly: `useCallback`, `useMemo`, `useReducer`, `useId`, and `useTransition`. Each one is documented in depth in the [React docs](https://react.dev/reference/react).

---

## Component Lifecycle

Every component goes through three phases:

1. **Mount**: The component is created and inserted into the DOM.
2. **Update**: State or props change, causing a re-render.
3. **Unmount**: The component is removed from the DOM.

With `useEffect`, you can run code at any of these points:

```jsx
useEffect(() => {
  // 1. Mount: runs once after the initial render
  console.log('mounted');

  return () => {
    // 3. Unmount: cleanup function runs when the component is removed
    console.log('unmounted');
  };
}, []); // empty deps → mount only

useEffect(() => {
  // 2. Update: runs after the initial render and whenever `value` changes
  console.log('value changed:', value);
}, [value]);
```

The cleanup function also runs before the effect fires again on update — useful for cancelling requests, clearing timers, and unsubscribing from listeners.

---

## Conditional Rendering

React components are just JavaScript, so you use normal JavaScript conditionals to decide what to render.

```jsx
function Alert({ type, message }) {
  if (!message) return null; // render nothing

  return (
    <div className={`alert alert--${type}`}>
      {message}
    </div>
  );
}
```

For inline conditions the logical `&&` operator is common:

```jsx
{isLoggedIn && <UserMenu />}
```

When you need an if/else inline, use a ternary:

```jsx
{isLoggedIn ? <UserMenu /> : <LoginButton />}
```

Avoid complex nested ternaries — extract them into a variable or a helper component instead.

---

## Lists and Keys

Render arrays with `.map()`. React requires a stable `key` prop on each list item so it can track elements across re-renders:

```jsx
function TaskList({ tasks }) {
  return (
    <ul>
      {tasks.map((task) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  );
}
```

Use a unique, stable value for the key — typically a database ID. Avoid using the array index as a key when the list can be reordered or items can be inserted/removed.

---

## Event Handling

React event handlers are camelCase and receive a synthetic event object that wraps the native browser event:

```jsx
function Form() {
  function handleSubmit(e) {
    e.preventDefault(); // prevent full page reload
    console.log('submitted');
  }

  function handleChange(e) {
    console.log(e.target.value);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleChange} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## React Router

React itself doesn't include a router. The standard choice for client-side routing in React apps is [React Router](https://reactrouter.com/). Version 6 introduced a cleaner API:

```bash
npm install react-router-dom
```

```jsx
import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/posts/:slug" element={<Post />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

function Post() {
  const { slug } = useParams();
  return <h1>Post: {slug}</h1>;
}
```

If you're using **Next.js**, the router is built in and file-based — you don't install React Router.

---

## Global State Management

For data that many components need — the authenticated user, a shopping cart, a UI theme — prop drilling becomes unmanageable. The two most common solutions are:

**React Context** (built in) is good for low-frequency updates like themes and authentication state. Use `createContext` + `useContext` as shown in the hooks section above.

**Zustand** is the lightest external library for global state and handles high-frequency updates efficiently:

```bash
npm install zustand
```

```jsx
import { create } from 'zustand';

const useCartStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  clearCart: () => set({ items: [] }),
}));

function CartIcon() {
  const items = useCartStore((state) => state.items);
  return <span>Cart ({items.length})</span>;
}
```

For heavy server-state management (caching, background refetch, optimistic updates) reach for [TanStack Query](https://tanstack.com/query) rather than storing API responses in a global store.

---

## Virtual DOM

React keeps an in-memory description of what the UI should look like called the virtual DOM. When state or props change:

1. React builds a new virtual DOM tree.
2. It **diffs** the new tree against the previous one (reconciliation).
3. It applies only the minimal set of real DOM updates needed.

This is significantly faster than re-rendering the entire page, and it means you describe what the UI should look like for a given state rather than writing manual DOM update instructions.

---

## Getting Started

The fastest way to start a new React project today is **Vite**:

```bash
npm create vite@latest my-app -- --template react
cd my-app
npm install
npm run dev
```

For a production-ready React app with SSR, file-based routing, and built-in image optimisation, use **Next.js**:

```bash
npx create-next-app@latest my-app
cd my-app
npm run dev
```

---

## Further Reading

- [React Documentation](https://react.dev) — the official docs, with interactive examples
- [React Router v6](https://reactrouter.com/en/main)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [TanStack Query](https://tanstack.com/query/latest)
