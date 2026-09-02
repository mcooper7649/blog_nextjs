---
title: 'Next.js Server Actions: Type-Safe Mutations Without the API Route Boilerplate'
date: '2026-09-02'
image: cover.jpg
excerpt: Server Actions let you write async server-side functions that forms and Client Components can call directly — no fetch, no API route, no hand-rolled serialization.
isFeatured: true
---

If you've been building with the Next.js App Router, you've probably hit a familiar pattern: you need to save a form, so you wire up a Route Handler at `app/api/something/route.ts`, write a `POST` handler, and then write a `fetch` call on the client side to hit it. For a simple mutation, that's a lot of moving parts.

**Server Actions** collapse that entire loop. You define a function, annotate it with `'use server'`, and call it — from a form's `action` prop, from a button's `onClick`, from anywhere. The framework handles the HTTP layer for you, and TypeScript types flow end-to-end because you're importing a real function, not building a URL string.

## The Simplest Possible Example

```ts
// app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const body  = formData.get('body')  as string;

  if (!title.trim()) throw new Error('Title is required');

  await db.query(
    'INSERT INTO posts (title, body) VALUES ($1, $2)',
    [title, body],
  );

  revalidatePath('/posts');
}
```

A file (or an async function inside a Server Component) can gain Server Action powers with `'use server'` at the top. Any `export`ed `async` function in that module becomes a server action — callable from the client.

## Using Server Actions in HTML Forms

The cleanest usage is a plain HTML `<form>` with the `action` prop:

```tsx
// app/posts/new/page.tsx  (Server Component — no 'use client')
import { createPost } from '@/app/actions';

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="Title" required />
      <textarea name="body" placeholder="Body" />
      <button type="submit">Publish</button>
    </form>
  );
}
```

This is **progressively enhanced**: the form works even without JavaScript (a full page reload submits to the action), and when JS is loaded it intercepts the submit, calls the action in the background, and React updates the UI without a navigation. That's a free win for resilience and accessibility.

## Pending State and Errors in Client Components

For a better UX — spinners, disabled buttons, inline errors — you'll move the form to a Client Component and use `useActionState` (React 19 / Next.js 15+) or `useFormState` (React 18 / Next.js 14):

```tsx
// app/posts/new/PostForm.tsx
'use client';

import { useActionState } from 'react'; // Next.js 15 / React 19
import { createPost } from '@/app/actions';

type State = { error?: string } | null;

export function PostForm() {
  const [state, action, isPending] = useActionState<State, FormData>(
    async (prev, formData) => {
      try {
        await createPost(formData);
        return null;
      } catch (e) {
        return { error: (e as Error).message };
      }
    },
    null,
  );

  return (
    <form action={action}>
      {state?.error && <p className="text-red-500">{state.error}</p>}
      <input name="title" placeholder="Title" required disabled={isPending} />
      <textarea name="body" placeholder="Body" disabled={isPending} />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Publishing…' : 'Publish'}
      </button>
    </form>
  );
}
```

> **Version note:** `useActionState` ships in React 19 (Next.js 15). On Next.js 14 / React 18, use `useFormState` from `react-dom` — the API is nearly identical, just missing the `isPending` third return value. Pair it with `useFormStatus` from `react-dom` to get pending state in a child component.

## Non-Form Mutations (Buttons, Optimistic Updates)

Server Actions aren't limited to forms. You can call them from any event handler:

```tsx
'use client';

import { deletePost } from '@/app/actions';
import { useOptimistic, useTransition } from 'react';

export function PostList({ posts }: { posts: Post[] }) {
  const [optimisticPosts, removeOptimistic] = useOptimistic(
    posts,
    (state, id: string) => state.filter(p => p.id !== id),
  );
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      removeOptimistic(id);
      await deletePost(id);
    });
  }

  return (
    <ul>
      {optimisticPosts.map(post => (
        <li key={post.id}>
          {post.title}
          <button onClick={() => handleDelete(post.id)} disabled={isPending}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
```

`useOptimistic` makes the UI update instantly while the actual server mutation runs in the background — the same pattern TanStack Query's `mutate` + `onMutate` provides, but built into React itself.

## Revalidating Cache After Mutations

After a write, you usually want Next.js to refetch any cached Server Component data. Two tools:

```ts
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

export async function updateUserProfile(formData: FormData) {
  // ... write to DB ...

  revalidatePath('/profile');         // invalidate a specific route
  revalidateTag('user-profile');      // invalidate by cache tag (more targeted)
}
```

Tag-based revalidation (`revalidateTag`) pairs well with `fetch` calls that set `next: { tags: ['user-profile'] }`, giving you surgical cache control without blowing away the whole page.

## When to Still Use a Route Handler

Server Actions cover most mutations, but Route Handlers (`app/api/*/route.ts`) still win in a few cases:

| Scenario | Use |
|---|---|
| Webhook receiver (Stripe, GitHub) | Route Handler — needs a raw `Request` |
| File uploads > a few MB | Route Handler — can stream the body |
| Third-party service calling your endpoint | Route Handler — needs a stable URL |
| Browser `fetch` from outside Next.js | Route Handler |
| Form + button mutations in your own UI | **Server Action** |

## My Take

Server Actions feel like the API route pattern finally grew up. The boilerplate collapse is real — I've replaced entire `api/` directories with a single `actions.ts` file. The progressive enhancement story is genuinely good: forms that work before hydration is something I care about for performance-sensitive pages.

The one place I'd caution: because Server Actions are callable by anyone who can POST to your Next.js app, **authentication and authorization belong inside the action itself**, not assumed from the calling component. Check the session at the top of every action that touches user data.

```ts
'use server';

import { getSession } from '@/lib/auth';

export async function sensitiveAction(formData: FormData) {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');
  // ...
}
```

That's the same discipline you'd apply to a Route Handler — just making sure you don't forget it when the indirection layer disappears.
