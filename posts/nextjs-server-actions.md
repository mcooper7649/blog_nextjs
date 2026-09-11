---
title: 'Next.js Server Actions: Forms Without the API Boilerplate'
date: '2026-09-11'
image: cover.jpg
excerpt: Server Actions let you handle form submissions and data mutations directly in server components—no API route required.
isFeatured: true
---

If you have written a form in Next.js before the App Router era, you know the routine: a client component, a `useState` for every field, `fetch` wired to an API route, loading state, error state, and a pile of boilerplate before you even touch the actual business logic. Server Actions collapse most of that.

## What Is a Server Action?

A Server Action is an `async` function that runs **on the server** but can be called directly from a client component or a plain HTML form. Next.js serialises the arguments, makes a POST to a generated endpoint under the hood, and hands the result back. From your code's perspective it looks like a regular function call—no route to create, no `fetch` to write.

```ts
// app/actions.ts
'use server';

export async function createContact(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  // validate…
  if (!name || !email) {
    return { error: 'Name and email are required.' };
  }

  // write to DB, send email, whatever you need
  await saveToDatabase({ name, email });
  return { success: true };
}
```

The `'use server'` directive at the top of the file marks every exported function in it as a Server Action. You can also put the directive inside a single async function if you only need one.

## A Basic Form

Because Server Actions accept a `FormData` argument, you can wire them to a plain `<form>` element via the `action` prop:

```tsx
// app/contact/page.tsx
import { createContact } from '../actions';

export default function ContactPage() {
  return (
    <form action={createContact}>
      <label>
        Name
        <input type="text" name="name" required />
      </label>
      <label>
        Email
        <input type="email" name="email" required />
      </label>
      <button type="submit">Send</button>
    </form>
  );
}
```

This works even with JavaScript disabled—the browser falls back to a standard form POST. That progressive-enhancement guarantee is one of the things that makes Server Actions compelling.

## Pending State with `useFormStatus`

The vanilla form above has no loading indicator. Add `useFormStatus` from `react-dom` inside a **separate** client component (the hook must live in a component that is a *descendant* of the form):

```tsx
// app/contact/SubmitButton.tsx
'use client';
import { useFormStatus } from 'react-dom';

export function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Sending…' : 'Send'}
    </button>
  );
}
```

Swap your `<button>` for `<SubmitButton />` in the parent form. No extra state variable required.

## Returning Errors with `useFormState`

For user-facing feedback—validation errors, success messages—use the `useFormState` hook from `react-dom` (renamed to `useActionState` in React 19 / Next.js 15). It threads a "previous state" value through your action so the UI can react to what happened:

```ts
// app/actions.ts  (updated signature)
'use server';

type State = { error?: string; success?: boolean };

export async function createContact(
  _prevState: State,
  formData: FormData
): Promise<State> {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  if (!name || !email) {
    return { error: 'Both fields are required.' };
  }

  await saveToDatabase({ name, email });
  return { success: true };
}
```

```tsx
// app/contact/ContactForm.tsx
'use client';
import { useFormState } from 'react-dom';
import { createContact } from '../actions';
import { SubmitButton } from './SubmitButton';

const initialState = {};

export function ContactForm() {
  const [state, formAction] = useFormState(createContact, initialState);

  return (
    <form action={formAction}>
      {state.error && <p className="error">{state.error}</p>}
      {state.success && <p className="success">Message sent!</p>}

      <label>
        Name
        <input type="text" name="name" required />
      </label>
      <label>
        Email
        <input type="email" name="email" required />
      </label>
      <SubmitButton />
    </form>
  );
}
```

The server function now takes `_prevState` as its first argument—`useActionState` handles that automatically. The client component never calls `fetch`. The round-trip is handled by the framework.

## Revalidating After a Mutation

After a successful write you usually want the UI to reflect the new data. Call `revalidatePath` or `revalidateTag` from inside the action:

```ts
import { revalidatePath } from 'next/cache';

export async function createContact(_prevState: State, formData: FormData): Promise<State> {
  // … validation and DB write …
  revalidatePath('/contacts'); // Next.js re-fetches this page's data on next visit
  return { success: true };
}
```

For redirects after a successful mutation, use `redirect` from `next/navigation` (call it *outside* a try/catch—it throws internally):

```ts
import { redirect } from 'next/navigation';

// at the end of a successful action:
redirect('/contacts/thank-you');
```

## When to Use Server Actions vs Route Handlers

Server Actions are great for **form submissions and simple mutations** tied to a specific UI. Reach for Route Handlers (`app/api/*/route.ts`) when you need:

- A publicly documented REST or JSON API that other services call
- Non-POST HTTP verbs triggered by client code (GET with query params, DELETE, PATCH)
- Streaming responses

For everything that comes from a `<form>` or a button click inside your own app, a Server Action is almost always the simpler path.

## Putting It Together

Here's what I like most about Server Actions: **the boundary between the component and the database disappears without becoming a security hole.** The `'use server'` directive ensures the code never ships to the browser; the serialised function call is validated by Next.js on the server. You still need to sanitise inputs and authenticate the user, but the networking layer is no longer your problem.

I've replaced several API routes on this blog with Server Actions—the contact form, a small feedback widget, newsletter signup—and each time the diff was a net deletion. The pattern clicks once you internalise that `action={someServerFunction}` is just a form submission that happens to be type-safe.

If you haven't tried them yet, grab Next.js 14+ and give the pattern a spin. The official [Next.js docs on Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) are thorough and worth a read once you have the basics down.
