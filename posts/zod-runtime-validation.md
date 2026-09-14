---
title: "Zod: Stop Trusting Your API Responses at Runtime"
date: '2026-09-14'
image: cover.jpg
excerpt: TypeScript types vanish at runtime. Zod gives you a single source of truth for shape validation *and* your TS types — here is how I use it in real projects.
isFeatured: true
---

TypeScript is great right up until the moment your app actually runs. Types are erased by the compiler, so when a REST endpoint returns an unexpected shape or an environment variable is missing, TypeScript can't save you — a runtime crash or silent bug will. That's the gap Zod fills.

## What Zod Is (and Isn't)

[Zod](https://zod.dev) is a TypeScript-first schema declaration and validation library. You define the *shape* of your data once, and Zod gives you:

1. **Runtime parsing** — it throws (or returns an error) if the data doesn't match.
2. **Static TypeScript types** — inferred automatically from the same schema, so you have one source of truth.

It has no runtime dependencies and works in Node, Deno, Bun, and every browser.

```bash
npm install zod
```

## Basic Shapes

```ts
import { z } from 'zod';

// Primitives
const nameSchema = z.string().min(1).max(100);
const ageSchema  = z.number().int().positive();
const flagSchema = z.boolean();

// Object
const userSchema = z.object({
  id:    z.string().uuid(),
  name:  z.string().min(1),
  email: z.string().email(),
  age:   z.number().int().min(0).optional(),
});

// Array of objects
const usersSchema = z.array(userSchema);
```

Types are inferred with `z.infer`:

```ts
type User = z.infer<typeof userSchema>;
// { id: string; name: string; email: string; age?: number }
```

You define the schema, TypeScript follows along — no duplication, no drift.

## `.parse()` vs `.safeParse()`

`parse` throws a `ZodError` on failure; `safeParse` returns a discriminated union so you can handle errors without try/catch:

```ts
// Throws if invalid
const user = userSchema.parse(rawData);

// Returns { success: true, data } or { success: false, error }
const result = userSchema.safeParse(rawData);

if (!result.success) {
  console.error(result.error.flatten());
  // { fieldErrors: { email: ['Invalid email'] }, formErrors: [] }
} else {
  console.log(result.data.name); // fully typed
}
```

I reach for `safeParse` in production code and `parse` in scripts where I want hard failures.

## Validating API Responses

This is where Zod earns its keep. Here's a pattern I use in every Next.js project:

```ts
// lib/schemas.ts
import { z } from 'zod';

export const postSchema = z.object({
  id:        z.number(),
  title:     z.string(),
  body:      z.string(),
  userId:    z.number(),
});

export const postsSchema = z.array(postSchema);
export type Post = z.infer<typeof postSchema>;
```

```ts
// lib/api.ts
import { postsSchema } from './schemas';

export async function fetchPosts() {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const raw = await res.json();
  const result = postsSchema.safeParse(raw);

  if (!result.success) {
    // Log schema mismatch, alert Sentry, whatever you do
    console.error('Unexpected API shape:', result.error.flatten());
    throw new Error('API response did not match expected shape');
  }

  return result.data; // Post[] — fully typed, validated
}
```

If the API team renames `userId` to `user_id` in a deploy on Friday at 4 PM, your code catches it at the boundary instead of silently passing `undefined` ten levels deep.

## Validating Environment Variables

Another pattern I rely on constantly — especially for homelab projects with `.env` files. Put this in a dedicated module that you import early:

```ts
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL:   z.string().url(),
  API_SECRET:     z.string().min(16),
  PORT:           z.coerce.number().int().positive().default(3000),
  NODE_ENV:       z.enum(['development', 'test', 'production']).default('development'),
});

// parse() throws at startup with a clear error if something is missing
export const env = envSchema.parse(process.env);
```

`z.coerce.number()` converts the string `"3000"` to `3000` automatically — env vars are always strings, so this is the right tool. If `DATABASE_URL` is missing you get:

```
ZodError: [
  { path: ['DATABASE_URL'], message: 'Invalid url' }
]
```

…at startup, not hours into a debugging session.

## Transforms and Refinements

Zod can reshape data as it validates:

```ts
const dateSchema = z
  .string()
  .datetime()
  .transform((s) => new Date(s));

// result.data is a Date, not a string
```

And add custom validation logic:

```ts
const passwordSchema = z
  .string()
  .min(8)
  .refine((val) => /[A-Z]/.test(val), {
    message: 'Must contain at least one uppercase letter',
  });
```

## Zod + React Hook Form

If you use [React Hook Form](https://react-hook-form.com) you get a clean pair via the official resolver:

```bash
npm install @hookform/resolvers
```

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <input {...register('email')} />
      {errors.email && <p>{errors.email.message}</p>}

      <input type="password" {...register('password')} />
      {errors.password && <p>{errors.password.message}</p>}

      <button type="submit">Login</button>
    </form>
  );
}
```

One schema drives client-side form validation *and* the types — no duplication between your form state and your API handler.

## When I Reach for Zod

- **Any data crossing a trust boundary** — external APIs, form submissions, URL params, webhooks, database rows via raw queries.
- **Environment configuration** — validate at startup, not at usage.
- **tRPC or a typed API layer** — Zod is the native input/output validator, so if you're using tRPC you're already using Zod.

I don't Zod-ify every internal function call — that would be noise. But anything that arrives from outside your code is fair game, and the cost is a few lines of schema definition that also give you your TypeScript types for free.

## Wrapping Up

Zod solves a real gap: TypeScript can tell you a variable *should* be a string, but only Zod can tell you it *is* one at runtime. Defining schemas at API and config boundaries has caught real bugs before they hit production for me, and the free type inference means I'm not maintaining types and validators separately. If you're already using TypeScript, Zod is one of the easiest wins you can add to any project today.
