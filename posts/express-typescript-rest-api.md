---
title: 'Building a Type-Safe REST API with Express and TypeScript'
date: '2026-10-21'
image: cover.jpg
excerpt: Stop guessing what your request bodies look like. Here is how to wire up Express with TypeScript for fully typed routes, validated payloads, and sane error handling.
isFeatured: false
---

Every React or Next.js project eventually needs a backend. Sometimes Vercel serverless functions are enough, but when you need persistent connections, complex business logic, or a standalone service that multiple clients share, a dedicated Express API is hard to beat. Add TypeScript and you get autocomplete, compile-time safety, and the confidence to refactor without hunting down every `req.body.userId`.

This post walks through setting up a small but real Express + TypeScript API from scratch — typed request handlers, Zod input validation, a proper error middleware, and a CRUD example you can actually ship.

## Project Setup

```bash
mkdir express-ts-api && cd express-ts-api
npm init -y
npm install express zod
npm install -D typescript ts-node-dev @types/express @types/node
npx tsc --init
```

Adjust `tsconfig.json` to target modern Node:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

Add scripts to `package.json`:

```json
"scripts": {
  "dev": "ts-node-dev --respawn src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js"
}
```

## The Project Structure

```
src/
  index.ts         # server entry, middleware wiring
  routes/
    tasks.ts       # route handlers for /tasks
  middleware/
    errorHandler.ts
  schemas/
    task.ts        # Zod schemas + inferred types
```

Keeping schemas separate means your validation logic and your TypeScript types live in one place.

## Define Your Schemas First

Rather than writing interfaces and validators separately, define them once in Zod and infer the TypeScript type from the schema. This is the same pattern from my [Zod post](/posts/zod-runtime-validation), applied to the backend.

```ts
// src/schemas/task.ts
import { z } from 'zod';

export const TaskSchema = z.object({
  title: z.string().min(1).max(200),
  done: z.boolean().optional().default(false),
});

export type Task = z.infer<typeof TaskSchema> & { id: string };
export type NewTask = z.infer<typeof TaskSchema>;
```

## Typed Route Handlers

Express ships `RequestHandler` and the generic overload `Request<Params, ResBody, ReqBody, Query>`. Use them:

```ts
// src/routes/tasks.ts
import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { TaskSchema, Task } from '../schemas/task';

const router = Router();

// In-memory store for this example — swap for a DB call
const tasks: Task[] = [];

// GET /tasks
router.get('/', (_req: Request, res: Response<Task[]>) => {
  res.json(tasks);
});

// POST /tasks
router.post('/', (req: Request, res: Response<Task>, next: NextFunction) => {
  const parsed = TaskSchema.safeParse(req.body);
  if (!parsed.success) {
    // Pass a structured error to the error middleware
    const err = Object.assign(new Error('Validation failed'), {
      status: 400,
      details: parsed.error.flatten().fieldErrors,
    });
    return next(err);
  }
  const task: Task = { id: randomUUID(), ...parsed.data };
  tasks.push(task);
  res.status(201).json(task);
});

// GET /tasks/:id
router.get('/:id', (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return next(Object.assign(new Error('Not found'), { status: 404 }));
  res.json(task);
});

// PATCH /tasks/:id
router.patch('/:id', (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return next(Object.assign(new Error('Not found'), { status: 404 }));

  const parsed = TaskSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return next(Object.assign(new Error('Validation failed'), {
      status: 400,
      details: parsed.error.flatten().fieldErrors,
    }));
  }
  tasks[idx] = { ...tasks[idx], ...parsed.data };
  res.json(tasks[idx]);
});

// DELETE /tasks/:id
router.delete('/:id', (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return next(Object.assign(new Error('Not found'), { status: 404 }));
  tasks.splice(idx, 1);
  res.status(204).send();
});

export default router;
```

Notice `.partial()` on the PATCH schema — Zod makes all fields optional with one method call, so you don't maintain a separate `UpdateTaskSchema`.

## Error Middleware

Express error handlers take four arguments — TypeScript needs a type assertion to convince the compiler you're intentionally ignoring `_next`:

```ts
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  status?: number;
  details?: Record<string, string[]>;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const status = err.status ?? 500;
  res.status(status).json({
    error: err.message,
    ...(err.details ? { details: err.details } : {}),
  });
}
```

## Wire It All Together

```ts
// src/index.ts
import express from 'express';
import taskRouter from './routes/tasks';
import { errorHandler } from './middleware/errorHandler';

const app = express();
app.use(express.json());

app.use('/tasks', taskRouter);

// Error handler must be last
app.use(errorHandler);

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => console.log(`API running on :${PORT}`));
```

## Try It Out

```bash
npm run dev

# Create a task
curl -X POST http://localhost:3001/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title": "Write tests"}'

# Bad payload — watch the 400 with field errors
curl -X POST http://localhost:3001/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title": ""}'
```

The second request returns:

```json
{
  "error": "Validation failed",
  "details": { "title": ["String must contain at least 1 character(s)"] }
}
```

That's the kind of error message your frontend can actually display to a user.

## What to Add Next

This skeleton intentionally leaves out a few things that depend on your use case:

- **Database**: swap the in-memory array for a `pg` or `prisma` call — the route shape stays identical.
- **Auth**: a JWT middleware sits cleanly between `express.json()` and your routes, and you can type the decoded payload onto `res.locals` to propagate it through the call.
- **CORS**: add `cors` from npm before your routes for cross-origin browser requests.

The pattern here scales well — schemas stay honest at the boundary, types flow from the schema into the handlers, and the error middleware keeps every route tidy. Once you've felt the difference between `req.body: any` and `req.body: NewTask`, you won't want to go back.
