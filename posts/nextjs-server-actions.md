---
title: 'Next.js Server Actions: Forms and Mutations Without an API Route'
date: '2026-10-07'
image: cover.jpg
excerpt: Server Actions let you call server-side code directly from your components — no API route, no fetch boilerplate. Here is how they work and when to use them.
isFeatured: false
---

Server Actions are one of the most practical additions to Next.js in recent memory. They let you define an async function that runs *on the server*, then call it directly from a React component — no API route, no `fetch`, no endpoint to wire up. The framework handles the network boundary for you.

If you are already on the App Router (Next.js 13.4+), Server Actions are available today with no extra config.

## What a Server Action looks like

The minimal case is a `<form>` whose `action` prop points to an async function marked `"use server"`.

```tsx
// app/contact/page.tsx
export default function ContactPage() {
  async function submitContact(formData: FormData) {
    'use server';

    const email = formData.get('email') as string;
    const message = formData.get('message') as string;

    // runs on the server — you can call your DB, send email, etc.
    await db.insertContact({ email, message });
  }

  return (
    <form action={submitContact}>
      <input name="email" type="email" required />
      <textarea name="message" required />
      <button type="submit">Send</button>
    </form>
  );
}
```

No `useState` for form values, no `fetch('/api/contact')`, no route handler. The `'use server'` directive tells the bundler to extract this function into a server entry point; the client receives a reference to it and the framework takes care of the POST under the hood.

## Moving actions to their own file

Inlining `'use server'` inside a Server Component is convenient for small cases, but if you call the same action from multiple places, or if you are in a Client Component, move the action to a dedicated file.

```ts
// app/_actions/contact.ts
'use server';

import { db } from '@/lib/db';

export async function submitContact(formData: FormData) {
  const email = formData.get('email') as string;
  const message = formData.get('message') as string;

  if (!email || !message) {
    throw new Error('Both fields are required');
  }

  await db.insertContact({ email, message });
}
```

A top-level `'use server'` marks every export in the file as a Server Action.

## Showing pending state with `useFormStatus`

The native `<form action={…}>` integration is progressive-enhancement-friendly — it works even before JavaScript hydrates. But you usually want to show a loading indicator. React 19 ships `useFormStatus` for exactly this.

```tsx
// app/contact/_components/SubmitButton.tsx
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

`useFormStatus` must live in a *child* of the form, not in the component that renders the form itself. That constraint sounds odd at first, but it means you can drop `<SubmitButton />` into any form and it wires itself up automatically.

## Handling errors and return values with `useActionState`

To surface errors back to the UI — without throwing past the error boundary — use `useActionState` (formerly `useFormState` before React 19).

```tsx
// app/contact/page.tsx
'use client';

import { useActionState } from 'react';
import { submitContact } from '@/app/_actions/contact';
import { SubmitButton } from './_components/SubmitButton';

type State = { error?: string; success?: boolean };

const initialState: State = {};

export default function ContactPage() {
  const [state, formAction] = useActionState(submitContact, initialState);

  return (
    <form action={formAction}>
      {state.error && <p className="text-red-500">{state.error}</p>}
      {state.success && <p className="text-green-500">Message sent!</p>}
      <input name="email" type="email" required />
      <textarea name="message" required />
      <SubmitButton />
    </form>
  );
}
```

Now update the action signature to accept `prevState`:

```ts
// app/_actions/contact.ts
'use server';

type State = { error?: string; success?: boolean };

export async function submitContact(
  prevState: State,
  formData: FormData,
): Promise<State> {
  const email = formData.get('email') as string;
  const message = formData.get('message') as string;

  if (!email || !message) {
    return { error: 'Both fields are required.' };
  }

  try {
    await db.insertContact({ email, message });
    return { success: true };
  } catch {
    return { error: 'Something went wrong. Please try again.' };
  }
}
```

The action now returns a typed state object instead of throwing, and `useActionState` keeps the last returned value in `state` for your component to render.

## Revalidating cached data after a mutation

Server Actions are not just for forms. A common pattern is invalidating a cached data source so the UI reflects the latest state immediately after a write.

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

export async function deletePost(id: string) {
  await db.deletePost(id);
  revalidatePath('/blog');       // re-fetch the blog list page
  revalidatePath(`/blog/${id}`); // also revalidate the deleted post's URL
}
```

`revalidatePath` tells Next.js to purge the cached page data for a given route so the next visitor — or an immediate redirect — sees fresh content. You can also use `revalidateTag` if you tagged your `fetch` calls.

## Calling a Server Action from a button (no form)

Server Actions do not require a `<form>`. You can call them imperatively from a Client Component:

```tsx
'use client';

import { deletePost } from '@/app/_actions/posts';

export function DeleteButton({ id }: { id: string }) {
  return (
    <button onClick={() => deletePost(id)}>
      Delete
    </button>
  );
}
```

This works, but you lose the progressive-enhancement story and you will need to manage pending state yourself (a `useState` or `useTransition`).

## When to use Server Actions vs Route Handlers

| | Server Action | Route Handler |
|---|---|---|
| Called from | React components | Any HTTP client |
| Auth/session access | Easy (cookies, headers) | Same |
| Returns | Typed value or state | HTTP response |
| Streaming / SSE | No | Yes |
| Third-party webhooks | No | Yes |
| Revalidation built-in | Yes | Manual |

Use Route Handlers (`app/api/**/route.ts`) when you need a public-facing HTTP endpoint — webhooks, mobile apps, other services consuming your API. Use Server Actions for mutations initiated by your own UI.

## A note on security

Server Actions are real server functions. That means:

- Always **validate and sanitize** inputs. `formData.get()` returns a string or null — validate with Zod or similar before touching the database.
- Always **check authorization** at the start of each action. Do not rely on the UI hiding a button to protect a write. Anyone who knows the action's reference can call it.
- Actions are automatically protected against CSRF because the framework only accepts calls from the same origin over a POST with the `Next-Action` header.

A quick auth guard looks like this:

```ts
'use server';

import { getSession } from '@/lib/auth';

export async function updateProfile(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  // safe to proceed
}
```

## Wrapping up

Server Actions close the gap between writing a React component and writing a full server-side mutation. For the majority of form submissions and button-triggered writes in a Next.js app, they are now the right default — less boilerplate, better progressive enhancement, and type-safe end-to-end when you keep your action signatures clean. Save Route Handlers for the cases that genuinely need a public HTTP surface.
