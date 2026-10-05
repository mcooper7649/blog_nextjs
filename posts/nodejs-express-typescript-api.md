---
title: 'Building a Type-Safe REST API with Node.js, Express, and TypeScript'
date: '2026-10-05'
image: cover.jpg
excerpt: Express and TypeScript are a natural fit — typed route handlers, Zod-validated request bodies, and a clean folder structure that scales beyond a single file.
isFeatured: true
---

TypeScript types disappear at compile time, but API requests arrive at runtime with whatever shape the caller decided to send. If you are building a REST API with Node.js and Express, combining TypeScript for development-time safety with [Zod](https://zod.dev) for runtime validation gives you a genuinely bulletproof server. Here is the setup I reach for on new projects.

## Project setup

Start with a minimal TypeScript + Express scaffold:

```bash
mkdir my-api && cd my-api
npm init -y
npm install express
npm install -D typescript @types/node @types/express ts-node-dev
npx tsc --init
```

Edit `tsconfig.json` to taste — the important bits:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true
  }
}
```

Add dev and build scripts to `package.json`:

```json
"scripts": {
  "dev": "ts-node-dev --respawn src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js"
}
```

## Typed request handlers

Express ships generic types for `Request` and `Response`. Use them — they catch mismatches before your code ever runs.

```ts
// src/types.ts
export interface CreateUserBody {
  name: string;
  email: string;
}

export interface UserParams {
  id: string;
}
```

```ts
// src/routes/users.ts
import { Router, Request, Response } from 'express';
import type { CreateUserBody, UserParams } from '../types';

const router = Router();

router.post(
  '/',
  async (req: Request<{}, {}, CreateUserBody>, res: Response) => {
    const { name, email } = req.body; // fully typed
    // ... create user in DB
    res.status(201).json({ name, email });
  }
);

router.get('/:id', async (req: Request<UserParams>, res: Response) => {
  const { id } = req.params; // string, TypeScript-known
  // ... fetch from DB
  res.json({ id });
});

export default router;
```

This alone catches a whole class of bugs — accessing `req.body.naem` instead of `name` is a compile error, not a silent undefined at runtime.

## Runtime validation with Zod

TypeScript types are erased by the compiler. A caller can still POST `{ name: 42, email: null }` and your type assertion won't stop it. Zod validates the actual payload:

```bash
npm install zod
```

```ts
// src/schemas/user.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
```

Write a reusable validation middleware so you don't repeat the try/catch in every handler:

```ts
// src/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }
    req.body = result.data; // replace with coerced/trimmed values
    next();
  };
}
```

Apply it per route:

```ts
import { validate } from '../middleware/validate';
import { createUserSchema } from '../schemas/user';

router.post('/', validate(createUserSchema), async (req, res) => {
  const { name, email } = req.body as CreateUserInput; // safe — Zod already checked
  res.status(201).json({ name, email });
});
```

Now a bad payload short-circuits cleanly before your handler runs, and you get structured field-level errors back to the caller for free.

## Wiring it together

```ts
// src/index.ts
import express from 'express';
import userRouter from './routes/users';

const app = express();
app.use(express.json());

app.use('/users', userRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => console.log(`API listening on :${PORT}`));
```

## Connecting to PostgreSQL

If you followed the [PostgreSQL for Node.js Developers](/posts/postgres) post, drop in `pg` and wire up a typed helper:

```ts
// src/db.ts
import { Pool } from 'pg';

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const { rows } = await pool.query<T>(text, params);
  return rows;
}
```

```ts
// in your handler
import { query } from '../db';

interface UserRow { id: number; name: string; email: string }

const users = await query<UserRow>(
  'SELECT id, name, email FROM users WHERE id = $1',
  [req.params.id]
);
if (!users.length) return res.status(404).json({ error: 'Not found' });
res.json(users[0]);
```

The generic parameter on `query<UserRow>` gives you typed rows without any ORM overhead.

## Folder structure that scales

```
src/
  index.ts          — app bootstrap
  db.ts             — pool + query helper
  middleware/
    validate.ts
  routes/
    users.ts
    posts.ts
  schemas/
    user.ts
    post.ts
  types.ts
```

Keeping schemas next to routes keeps validation co-located with the handlers that use it. When the API grows, each domain (users, posts, auth) gets its own routes + schemas directory and the entry point just mounts them.

## What you get

This stack — Express + TypeScript + Zod — is deliberately minimal. No heavy ORM to learn, no magic decorators, no framework lock-in. The types guide you at development time, Zod catches bad data at runtime, and the structure is predictable enough that a new contributor can navigate it in minutes. For most Node REST APIs, that is exactly the right tradeoff.
