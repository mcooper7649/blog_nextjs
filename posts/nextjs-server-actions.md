---
title: 'React Server Actions: Simplifying Form Mutations in Next.js'
date: '2026-10-09'
image: cover.jpg
excerpt: Server Actions let you run async server-side logic directly from your components — no API route required. Here is how to use them correctly.
isFeatured: false
---

If you have been building with the Next.js App Router for a while, you have probably noticed that wiring up a form still feels like more steps than it should: create an API route, write a `fetch` call in your component, wire up loading state, handle errors, and invalidate your cache. It works, but it is a lot of boilerplate for something as common as submitting a form.

React Server Actions collapse most of that into a single async function. No separate route file, no manual fetch, and you get progressive enhancement for free.

## What a Server Action Is

A Server Action is an async function tagged with the `'use server'` directive that runs exclusively on the server. Next.js wires up a secure POST endpoint under the hood — you never see or call that URL directly.

You can define one in a dedicated file (so it can be shared) or inline inside a Server Component.

```ts
// app/actions/save-post.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

export async function savePost(formData: FormData) {
  const title = formData.get('title') as string;
  const body  = formData.get('body')  as string;

  if (!title || !body) {
    throw new Error('Title and body are required');
  }

  await db.post.create({ data: { title, body } });
  revalidatePath('/blog');
}
```

Three things to notice:
- `'use server'` at the top of the file marks every export as a server action.
- The function receives a `FormData` object when called from an HTML `<form>`.
- `revalidatePath` tells Next.js to invalidate the cache for that route so the next request sees fresh data.

## Using a Server Action in a Server Component

Because Server Components render on the server, you can pass the action directly to the form's `action` prop — no `onClick`, no `fetch`, no state.

```tsx
// app/new-post/page.tsx
import { savePost } from '@/actions/save-post';

export default function NewPostPage() {
  return (
    <form action={savePost}>
      <input  name="title" type="text"     placeholder="Post title" required />
      <textarea name="body"              placeholder="Post body"  required />
      <button type="submit">Save</button>
    </form>
  );
}
```

This form works even with JavaScript disabled — the browser posts to the server, the action runs, and Next.js redirects back. That is progressive enhancement with zero extra effort.

## Adding Pending State in a Client Component

For a richer UX — disabling the button while the action is in flight — you need `useFormStatus` from `react-dom`. It has to live in a **separate child component** because it reads the status of the nearest parent `<form>`.

```tsx
// components/submit-button.tsx
'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save'}
    </button>
  );
}
```

Drop it into your form:

```tsx
import { SubmitButton } from '@/components/submit-button';

export default function NewPostPage() {
  return (
    <form action={savePost}>
      <input name="title" type="text" placeholder="Post title" required />
      <textarea name="body" placeholder="Post body" required />
      <SubmitButton />
    </form>
  );
}
```

The parent page stays a Server Component; only the button is a Client Component. Granular hydration in practice.

## Returning Feedback with useActionState

Sometimes you want to show a validation error without throwing. React 19 ships `useActionState` (previously `useFormState`) for exactly this.

```ts
// app/actions/save-post.ts
'use server';

type State = { error?: string; success?: boolean };

export async function savePost(
  prevState: State,
  formData: FormData,
): Promise<State> {
  const title = formData.get('title') as string;

  if (title.length < 5) {
    return { error: 'Title must be at least 5 characters' };
  }

  await db.post.create({ data: { title } });
  revalidatePath('/blog');
  return { success: true };
}
```

The form component now needs `'use client'` because it manages state:

```tsx
'use client';

import { useActionState } from 'react';
import { savePost } from '@/actions/save-post';

const initialState = {};

export function NewPostForm() {
  const [state, formAction] = useActionState(savePost, initialState);

  return (
    <form action={formAction}>
      {state.error   && <p style={{ color: 'red' }}>{state.error}</p>}
      {state.success && <p>Post saved!</p>}
      <input name="title" type="text" required />
      <button type="submit">Save</button>
    </form>
  );
}
```

The action signature changes slightly: it receives `prevState` as its first argument followed by `formData`. Next.js and React handle threading that value through for you.

## Server Actions vs Route Handlers

A quick rule of thumb:

| Use case | Prefer |
|---|---|
| Form submission / mutation tied to a page | Server Action |
| Public API consumed by mobile apps or third parties | Route Handler |
| Programmatic mutation not tied to a form | Either (Server Action is fine) |
| Streaming or webhook endpoint | Route Handler |

Server Actions are not a wholesale replacement for Route Handlers — they are a better default for the form-submission case that makes up the majority of mutations in a typical web app.

## Wrapping Up

Server Actions let you delete the API route, the `fetch` call, and most of the loading-state boilerplate from the typical form flow. The trade-off is that they are tightly coupled to your Next.js app, so if you need a public API other clients will call, a Route Handler is still the right tool.

For everything else — contact forms, dashboard mutations, settings pages — give Server Actions a try. Once you stop writing `fetch('/api/...')` in every component, it is hard to go back.
