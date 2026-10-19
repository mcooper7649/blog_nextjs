---
title: 'Next.js Server Actions: Forms Without the API Boilerplate'
date: '2026-10-19'
image: cover.jpg
excerpt: Server Actions let you mutate data directly from a form without writing a separate API route. Here is how to use them confidently in production.
isFeatured: false
---

If you have been following Next.js since the App Router landed, you have probably seen **Server Actions** mentioned alongside React Server Components and the `'use server'` directive. They look a little magical at first — a function that runs on the server, called directly from a client form — but the mental model clicks quickly once you see a working example.

This post walks through the real shape of Server Actions: how to wire up a form, validate input, return feedback to the UI, and avoid the common pitfalls.

## What Problem Do Server Actions Solve?

Before Server Actions, a typical Next.js mutation flow looked like this:

1. Write a `POST /api/subscribe` route handler in `app/api/subscribe/route.ts`.
2. `fetch` from the client, managing loading and error state yourself.
3. Revalidate cached data with a second call or a manual router refresh.

That is three files minimum and a lot of glue. Server Actions collapse the whole pipeline into one async function annotated with `'use server'`. The framework handles the transport — you never write `fetch` at all.

## The Simplest Possible Server Action

```tsx
// app/actions.ts
'use server';

export async function subscribe(formData: FormData) {
  const email = formData.get('email') as string;
  // write to a DB, call an external API, send an email…
  await saveSubscriber(email);
}
```

```tsx
// app/subscribe/page.tsx
import { subscribe } from '../actions';

export default function SubscribePage() {
  return (
    <form action={subscribe}>
      <input type="email" name="email" required />
      <button type="submit">Subscribe</button>
    </form>
  );
}
```

When the form submits, Next.js POSTs to a framework-managed endpoint, invokes `subscribe` on the server, and refreshes the page. No `useState`, no `fetch`, no route handler. The form even works with JavaScript disabled — true progressive enhancement.

## Validating Input with Zod

You should never trust `FormData` values directly. Zod makes schema validation quick and gives you a typed result:

```ts
// app/actions.ts
'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';

const Schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

export async function subscribe(formData: FormData) {
  const parsed = Schema.safeParse({
    email: formData.get('email'),
    name: formData.get('name'),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await saveSubscriber(parsed.data);
  redirect('/thank-you');
}
```

## Showing Pending State with `useFormStatus`

The React `useFormStatus` hook tells a child component whether its parent form is submitting. This lets you disable the submit button without any extra state:

```tsx
// components/SubmitButton.tsx
'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Subscribe'}
    </button>
  );
}
```

Drop it inside any form that uses a Server Action:

```tsx
// app/subscribe/page.tsx
import { subscribe } from '../actions';
import { SubmitButton } from '@/components/SubmitButton';

export default function SubscribePage() {
  return (
    <form action={subscribe}>
      <input type="email" name="email" required />
      <SubmitButton />
    </form>
  );
}
```

`useFormStatus` must live in a component that is a child of the `<form>` — it reads state from the nearest parent form via React context. Trying to use it in the same component that renders the `<form>` will always show `pending: false`.

## Displaying Field Errors with `useActionState`

To show validation errors inline, reach for `useActionState` (previously called `useFormState`). It pairs a client component with a server action and threads the action's return value back into the component on each submission:

```tsx
// app/subscribe/SubscribeForm.tsx
'use client';

import { useActionState } from 'react';
import { subscribe } from '../actions';
import { SubmitButton } from '@/components/SubmitButton';

const initialState = { errors: {} };

export function SubscribeForm() {
  const [state, formAction] = useActionState(subscribe, initialState);

  return (
    <form action={formAction}>
      <div>
        <input type="email" name="email" required />
        {state.errors?.email && (
          <p className="field-error">{state.errors.email[0]}</p>
        )}
      </div>
      <div>
        <input type="text" name="name" required />
        {state.errors?.name && (
          <p className="field-error">{state.errors.name[0]}</p>
        )}
      </div>
      <SubmitButton />
    </form>
  );
}
```

When using `useActionState`, your action receives a `prevState` as the first argument before `formData`:

```ts
// app/actions.ts
'use server';

export async function subscribe(prevState: unknown, formData: FormData) {
  // same Zod validation as above…
}
```

The `prevState` value is whatever the action returned last time (or the initial state on the first render). You can use it to accumulate messages or just ignore it — it is there if you need it.

## Revalidating Cached Data After a Mutation

After writing to a database you almost always want to refresh the page data that reflects that change. Two helpers in `next/cache` cover most cases:

```ts
import { revalidatePath, revalidateTag } from 'next/cache';

// Purge all cached responses under /dashboard
await revalidatePath('/dashboard');

// Purge any fetch() calls tagged with 'subscribers'
await revalidateTag('subscribers');
```

Call these at the end of your action before returning or redirecting. The next request to that path will re-run the data fetch from scratch.

## Gotchas Worth Knowing

**Server Actions are POST-only.** The framework serializes arguments and return values using React's serialization protocol. Non-serializable values — class instances, Promises, DOM nodes — cannot cross the server/client boundary.

**`'use server'` does not make a module server-only.** It marks specific exported functions as server endpoints. If a module contains secrets it must not reach the browser at all; use the `server-only` package for that instead.

**Large file uploads belong elsewhere.** `FormData` file entries passed through a Server Action travel through Next.js's middleware layer, which is not designed for multi-megabyte payloads. Upload directly to object storage (S3, R2, Cloudflare Images) from the client, then pass only the resulting URL to the action.

---

Server Actions are not magic — they are a build-time transformation that replaces the `fetch` + route handler pair you were already writing. Start with a plain form action, add `useFormStatus` for pending UX, and reach for `useActionState` when you need field-level error display. That covers the vast majority of mutation patterns with far less boilerplate than the Pages Router approach.
