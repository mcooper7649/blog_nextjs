---
title: 'tRPC: End-to-End Type Safety Without a Schema'
date: '2026-11-13'
image: cover.jpg
excerpt: Share TypeScript types between your Next.js server and client without code generation, OpenAPI, or a separate schema file.
isFeatured: false
belt: green
---

REST APIs and GraphQL both require you to describe your contract twice: once on the server as actual code, and again somewhere else as documentation, a spec, or a schema file. tRPC skips that entirely by treating your TypeScript types as the contract. If the server compiles, the client is in sync.

This post covers setting up tRPC in a Next.js App Router project, writing procedures, and calling them from a React component — no codegen, no schema, no extra tooling.

## What tRPC Is (and Isn't)

tRPC is not a new transport protocol. It still sends HTTP requests under the hood. What it does is wrap your router functions with TypeScript generics so the **input and output types flow from server to client** through the same import, all inferred automatically.

It's a great fit for full-stack TypeScript monorepos where the frontend and backend live in the same repo. If you need a public API consumed by third-party clients, REST or GraphQL is a better choice.

## Installation

```bash
npm install @trpc/server @trpc/client @trpc/react-query @tanstack/react-query zod
```

tRPC uses TanStack Query for client-side data fetching, so both are required.

## Project Structure

```
src/
  server/
    trpc.ts         # core t object
    routers/
      post.ts       # a router for post-related procedures
    index.ts        # root router export
  app/
    _trpc/
      client.ts     # browser client
      Provider.tsx  # TanStack Query + tRPC provider
      server.ts     # server-side caller (RSC usage)
    api/
      trpc/
        [trpc]/
          route.ts  # Next.js route handler
```

## 1. Create the Core `t` Object

```ts
// src/server/trpc.ts
import { initTRPC } from '@trpc/server';
import { ZodError } from 'zod';

const t = initTRPC.create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
```

`initTRPC.create()` returns `t`, the foundation for all routers and procedures. The `errorFormatter` above surfaces Zod validation errors in a structured way on the client.

## 2. Write a Router

```ts
// src/server/routers/post.ts
import { z } from 'zod';
import { publicProcedure, router } from '../trpc';

const posts = [
  { id: 1, title: 'Hello tRPC', published: true },
  { id: 2, title: 'Draft Post', published: false },
];

export const postRouter = router({
  list: publicProcedure
    .input(z.object({ publishedOnly: z.boolean().default(true) }))
    .query(({ input }) => {
      return input.publishedOnly
        ? posts.filter((p) => p.published)
        : posts;
    }),

  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => {
      const post = posts.find((p) => p.id === input.id);
      if (!post) throw new Error('Post not found');
      return post;
    }),

  create: publicProcedure
    .input(z.object({ title: z.string().min(1) }))
    .mutation(({ input }) => {
      const newPost = { id: posts.length + 1, title: input.title, published: false };
      posts.push(newPost);
      return newPost;
    }),
});
```

Procedures come in two flavors: **query** for reading data (GET-like), **mutation** for writing data (POST-like). The `.input()` call attaches a Zod schema — tRPC validates the input before your handler runs, and the inferred type becomes the `input` parameter's type automatically.

## 3. Create the Root Router and Export the Type

```ts
// src/server/index.ts
import { router } from './trpc';
import { postRouter } from './routers/post';

export const appRouter = router({
  post: postRouter,
});

export type AppRouter = typeof appRouter;
```

`AppRouter` is the type you share with the client. It carries the full type information for every procedure without shipping any implementation code to the browser.

## 4. Add the Next.js Route Handler

```ts
// src/app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({}),
  });

export { handler as GET, handler as POST };
```

This wires tRPC into the App Router's route handler system. All tRPC calls are routed through `/api/trpc/[procedure path]`.

## 5. Set Up the Client Provider

```tsx
// src/app/_trpc/Provider.tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from './client';
import { useState } from 'react';

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({ url: '/api/trpc' })],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

```ts
// src/app/_trpc/client.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server';

export const trpc = createTRPCReact<AppRouter>();
```

Note that `AppRouter` is imported as a **type** — no server code ends up in the client bundle.

Wrap your root layout in `TRPCProvider`:

```tsx
// src/app/layout.tsx
import { TRPCProvider } from './_trpc/Provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
```

## 6. Call Procedures from a Component

```tsx
'use client';
import { trpc } from '@/app/_trpc/client';

export function PostList() {
  const { data, isLoading } = trpc.post.list.useQuery({ publishedOnly: true });
  const createPost = trpc.post.create.useMutation({
    onSuccess: () => utils.post.list.invalidate(),
  });
  const utils = trpc.useUtils();

  if (isLoading) return <p>Loading…</p>;

  return (
    <div>
      <ul>
        {data?.map((post) => <li key={post.id}>{post.title}</li>)}
      </ul>
      <button onClick={() => createPost.mutate({ title: 'New Post' })}>
        Add Post
      </button>
    </div>
  );
}
```

`trpc.post.list.useQuery` is fully typed — TypeScript knows `data` is `Array<{ id: number; title: string; published: boolean }>` without you writing a single interface. Rename a field on the server and the client shows a type error immediately.

## Calling Procedures on the Server (RSC)

For React Server Components or route handlers, skip the React hooks and use a direct caller:

```ts
// src/app/_trpc/server.ts
import { appRouter } from '@/server';

export const serverClient = appRouter.createCaller({});
```

```tsx
// src/app/posts/page.tsx  (Server Component)
import { serverClient } from '@/app/_trpc/server';

export default async function PostsPage() {
  const posts = await serverClient.post.list({ publishedOnly: true });
  return <ul>{posts.map((p) => <li key={p.id}>{p.title}</li>)}</ul>;
}
```

No `fetch`, no `JSON.parse`, no manual type annotation.

## Adding Authentication Context

Production procedures usually need a user. Pass context through `createContext`:

```ts
// In your route handler:
createContext: async ({ req }) => {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const user = token ? await verifyToken(token) : null;
  return { user };
},
```

Then protect procedures with a middleware:

```ts
const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

## When to Reach for tRPC

tRPC is at its best in a monorepo where the client and server are TypeScript and both live in the same repository. It eliminates a whole class of bugs — the ones where the API returns a field the client doesn't know about, or the client sends a shape the server doesn't expect. The type contract is live, enforced at compile time, and requires no extra build step.

If you're building a public API, need non-TypeScript consumers, or the frontend and backend deploy from separate repos, the overhead isn't worth it. For everything else — especially internal tools and full-stack Next.js apps — tRPC removes friction in exactly the right place.
