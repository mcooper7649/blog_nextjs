---
title: 'Next.js App Router: What Changed and Why It Matters'
date: '2026-06-03'
image: nextjs-app-router.png
excerpt: The App Router rewrites how Next.js handles routing, layouts, and data fetching. Here is a practical breakdown of what changed and how to use it today.
isFeatured: false
---

The Next.js Pages Router has served the community well since the beginning — file-based routing, `getServerSideProps`, `getStaticProps`, and a simple `pages/api/` folder for backend logic. But since Next.js 13, the framework has been moving toward a new paradigm: the **App Router**.

If you're still on the Pages Router (or just starting out), this post breaks down what actually changed, why it matters, and how to start using the new patterns today.

## The Core Shift: React Server Components

The App Router is built on **React Server Components (RSC)**. Every component in the `app/` directory is a Server Component by default, which means:

- It renders on the server and ships **no JavaScript to the browser**
- It can `async/await` directly — no `useEffect` + `useState` dance to load data
- It can safely import Node.js modules, access databases, and read the filesystem

This flips the old model on its head. Instead of fetching at the page level with `getServerSideProps` and threading props down through every layer, you fetch right where the data is consumed.

### Pages Router (old)

```typescript
// pages/posts/[slug].tsx
export async function getServerSideProps(context) {
  const { slug } = context.params;
  const post = await fetchPostFromDB(slug);
  return { props: { post } };
}

export default function PostPage({ post }) {
  return <article><h1>{post.title}</h1></article>;
}
```

### App Router (new)

```typescript
// app/posts/[slug]/page.tsx
async function getPost(slug: string) {
  const post = await fetchPostFromDB(slug);
  return post;
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  return <article><h1>{post.title}</h1></article>;
}
```

No export ceremony, no props threading — just `async/await` directly in the component.

## New File Conventions

The `app/` directory introduces special filenames that map to specific behaviors:

| File | Purpose |
|------|---------|
| `page.tsx` | The UI for a route (replaces `pages/foo.tsx`) |
| `layout.tsx` | Persistent wrapper for a segment and its children |
| `loading.tsx` | Automatic Suspense fallback while the page loads |
| `error.tsx` | Error boundary for the segment |
| `not-found.tsx` | 404 UI for the segment |
| `route.ts` | API endpoint (replaces `pages/api/foo.ts`) |

A typical blog structure looks like this:

```
app/
  layout.tsx          ← root layout, wraps every page
  page.tsx            ← home page (/)
  posts/
    page.tsx          ← posts list (/posts)
    [slug]/
      page.tsx        ← individual post (/posts/my-post)
      loading.tsx     ← shown while post data fetches
```

## Layouts: No More `_app.js`

In the Pages Router, `_app.js` was the place to wrap every page with a shared shell. The App Router replaces this with **nested `layout.tsx` files**.

```typescript
// app/layout.tsx
export const metadata = {
  title: 'My Blog',
  description: 'Writing about React and beyond.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav>My Site</nav>
        <main>{children}</main>
        <footer>© 2026</footer>
      </body>
    </html>
  );
}
```

Layouts are **persistent** — they don't remount when you navigate between pages in the same segment. This is great for sidebar state, scroll position, or any component that's expensive to re-initialize.

You can also nest layouts: `app/dashboard/layout.tsx` wraps only the `/dashboard/*` routes without affecting anything outside.

## When to Use `"use client"`

Server Components can't use browser APIs, React hooks (`useState`, `useEffect`, `useRef`), or event listeners. When you need any of those, add `"use client"` as the first line of the file:

```typescript
'use client';

import { useState } from 'react';

export function LikeButton({ postId }: { postId: string }) {
  const [liked, setLiked] = useState(false);

  return (
    <button onClick={() => setLiked(!liked)}>
      {liked ? 'Liked' : 'Like'}
    </button>
  );
}
```

The pattern that works best: keep the page itself a Server Component for data fetching, then pass data down to small Client Components that handle interactivity. Push `"use client"` as far down the tree as possible — this keeps the client bundle small.

## Route Handlers Replace API Routes

`pages/api/hello.ts` becomes `app/api/hello/route.ts` with named HTTP method exports:

```typescript
// app/api/hello/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Hello from the App Router' });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ received: body });
}
```

Named exports per method make the intent clear and remove the `if (req.method === 'POST')` branching that cluttered old API routes.

## Should You Migrate?

If you're starting a new project today, use the App Router — it's the default when you run `create-next-app`. For existing apps, migration can be **incremental**: the `app/` and `pages/` directories can coexist in the same project while you transition route by route.

Start with the routes that benefit most:

- Pages with heavy server-side data fetching (RSC eliminates the `getServerSideProps` + props threading)
- Any shared chrome currently in `_app.js` (move it to `app/layout.tsx`)
- Pages where you want streaming — `loading.tsx` gives you a Suspense boundary for free

The App Router has a steeper learning curve than the Pages Router, but once the Server Component mental model clicks — *the server is where data lives, the client is where interaction lives* — the code becomes noticeably simpler and the bundle stays lean.
