---
title: "React 19: The New APIs Worth Using Right Now"
date: '2026-10-23'
image: cover.jpg
excerpt: React 19 shipped the most significant API additions in years. Here is a practical tour of the ones that actually change how I write components day-to-day.
isFeatured: true
belt: blue
---

React 19 landed in December 2024 and it is the biggest release since Hooks. A lot of the coverage focused on the React Compiler and Server Actions, but there are a handful of smaller API additions that quietly made my day-to-day code cleaner. Let me walk through the ones I reach for most.

## `use()` — Reading a Promise Inside a Component

The new `use()` hook can read the value of a Promise or a Context, and unlike every other hook it can be called conditionally or inside a loop.

```jsx
import { use, Suspense } from 'react';

function UserName({ userPromise }) {
  // suspends until the promise resolves
  const user = use(userPromise);
  return <span>{user.name}</span>;
}

export default function Profile({ userPromise }) {
  return (
    <Suspense fallback={<span>Loading…</span>}>
      <UserName userPromise={userPromise} />
    </Suspense>
  );
}
```

The parent creates or fetches the promise (often in a Server Component) and passes it down. `use()` suspends the component while it waits, and the nearest `<Suspense>` boundary shows the fallback. No `useEffect`, no `useState`, no loading boolean to track.

For Context it replaces the verbose `useContext` call: `const theme = use(ThemeContext)` — same result, shorter.

## `ref` as a Plain Prop — Goodbye `forwardRef`

Before React 19, passing a ref to a function component required wrapping it in `forwardRef`, which was always a bit of a ceremony:

```jsx
// old
const Input = forwardRef(({ label }, ref) => (
  <input ref={ref} aria-label={label} />
));
```

React 19 makes `ref` a regular prop on function components:

```jsx
// React 19
function Input({ label, ref }) {
  return <input ref={ref} aria-label={label} />;
}
```

That's the entire change. `forwardRef` still works and won't be removed any time soon, so existing code is fine, but new components can skip it entirely.

## `useActionState` — Form State Without Boilerplate

Forms that call a server action used to require local state for the pending flag, the error, and the returned data. `useActionState` rolls all of that into one:

```jsx
import { useActionState } from 'react';
import { submitContactForm } from './actions';

export default function ContactForm() {
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    { error: null, message: null }
  );

  return (
    <form action={formAction}>
      <input name="email" type="email" required />
      <textarea name="body" required />
      {state.error && <p className="error">{state.error}</p>}
      {state.message && <p className="success">{state.message}</p>}
      <button disabled={isPending}>
        {isPending ? 'Sending…' : 'Send'}
      </button>
    </form>
  );
}
```

```js
// app/actions.js
'use server';

export async function submitContactForm(prevState, formData) {
  const email = formData.get('email');
  if (!email.includes('@')) return { error: 'Invalid email', message: null };
  await sendEmail(email, formData.get('body'));
  return { error: null, message: 'Message sent!' };
}
```

The action receives the previous state as its first argument, which lets you accumulate messages or track retry counts without any extra state on the client.

## `useFormStatus` — Pending State Anywhere in the Form

`useFormStatus` solves a different problem: you want a *child* component (like a standalone `<SubmitButton>`) to know whether its parent form is submitting, without threading a prop down to it.

```jsx
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save'}
    </button>
  );
}

// Use it inside any <form> and it just works:
export default function SettingsForm() {
  return (
    <form action={saveSettings}>
      <input name="username" />
      <SubmitButton />
    </form>
  );
}
```

Two notes: the component calling `useFormStatus` must be *inside* the `<form>` — not the same component that renders the form. And it comes from `react-dom`, not `react`.

## `useOptimistic` — Instant Feedback on Mutations

Optimistic UI means showing the expected outcome immediately and rolling back if the server disagrees. `useOptimistic` makes the pattern first-class:

```jsx
import { useOptimistic } from 'react';

export default function MessageList({ messages, sendMessage }) {
  const [optimisticMessages, addOptimistic] = useOptimistic(
    messages,
    (current, newText) => [
      ...current,
      { id: crypto.randomUUID(), text: newText, pending: true },
    ]
  );

  async function handleSend(formData) {
    const text = formData.get('text');
    addOptimistic(text);          // instant UI update
    await sendMessage(text);      // real network call
  }

  return (
    <>
      <ul>
        {optimisticMessages.map(m => (
          <li key={m.id} style={{ opacity: m.pending ? 0.5 : 1 }}>
            {m.text}
          </li>
        ))}
      </ul>
      <form action={handleSend}>
        <input name="text" autoComplete="off" />
        <button>Send</button>
      </form>
    </>
  );
}
```

React automatically snaps `optimisticMessages` back to the real `messages` prop once the server responds. If the request fails, the optimistic entry disappears — no cleanup needed.

## Putting It Together

These five APIs cover most of the friction points in the old pattern: data loading, ref forwarding, form state, submit-button pending UI, and optimistic updates. None of them require the React Compiler or full Server Components adoption — you can use `use()` in a client app with any data-fetching library, and `useOptimistic` works with a plain `fetch` call.

The biggest shift is how forms feel to write now. `useActionState` + `useFormStatus` replace what used to be a dozen lines of `useState` + `useEffect` + prop-threading with a handful of clean, composable primitives. Worth upgrading for those two alone.
