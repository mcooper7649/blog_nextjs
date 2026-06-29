---
title: 'Building a REST API with Express and TypeScript'
date: '2026-06-29'
image: cover.jpg
excerpt: Express and TypeScript pair surprisingly well — typed request bodies, strongly-typed route handlers, and a clean project layout that scales beyond "hello world."
isFeatured: false
---

I've been writing Node.js APIs for years, and for a long time I wrote them in plain JavaScript. It worked fine until it didn't — mistyped body fields, unexpected `undefined` values, and runtime crashes from wrong property names all started costing real time. Adding TypeScript to an Express project takes about ten minutes and pays back immediately.

This post walks through a complete, working setup: project scaffolding, typed request/response handlers, a simple router, and one piece of middleware — everything you need to start a real API.

## Project setup

Start with an empty directory and initialise both npm and TypeScript:

```bash
mkdir my-api && cd my-api
npm init -y
npm install express
npm install -D typescript @types/express @types/node ts-node nodemon
npx tsc --init
```

Open `tsconfig.json` and set these options (the rest can stay at defaults):

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true
  }
}
```

Add dev and build scripts to `package.json`:

```json
"scripts": {
  "dev": "nodemon --exec ts-node src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js"
}
```

## Project structure

Keep it flat to start — you can always split later:

```
src/
  index.ts       ← Express app entry point
  routes/
    users.ts     ← /users resource router
  middleware/
    errorHandler.ts
```

## The entry point

`src/index.ts` wires up Express and mounts routers:

```ts
import express from 'express';
import { usersRouter } from './routes/users';
import { errorHandler } from './middleware/errorHandler';

const app = express();
app.use(express.json());

app.use('/users', usersRouter);
app.use(errorHandler);

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
```

`express.json()` parses incoming JSON bodies so `req.body` is always a plain object, never a string.

## Typing request bodies

This is where TypeScript earns its keep. Define an interface for each request shape, then assert it on `req.body`:

```ts
// src/routes/users.ts
import { Router, Request, Response, NextFunction } from 'express';

export const usersRouter = Router();

interface CreateUserBody {
  name: string;
  email: string;
}

// In-memory store for the example
const users: Array<{ id: number } & CreateUserBody> = [];
let nextId = 1;

usersRouter.get('/', (_req: Request, res: Response) => {
  res.json(users);
});

usersRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  const { name, email } = req.body as CreateUserBody;

  if (!name || !email) {
    res.status(400).json({ error: 'name and email are required' });
    return;
  }

  const user = { id: nextId++, name, email };
  users.push(user);
  res.status(201).json(user);
});

usersRouter.get('/:id', (req: Request, res: Response) => {
  const user = users.find(u => u.id === Number(req.params.id));
  if (!user) {
    res.status(404).json({ error: 'user not found' });
    return;
  }
  res.json(user);
});
```

The `as CreateUserBody` cast tells TypeScript what shape to expect. For production you'd validate this at runtime too — Zod is excellent for that — but even the cast alone surfaces mismatches while you're writing handler code.

## A typed error-handler middleware

Express identifies error-handling middleware by its four-argument signature `(err, req, res, next)`. TypeScript needs explicit types on all four or the compiler complains:

```ts
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(err.stack);
  res.status(500).json({ error: 'internal server error' });
}
```

Pass any unhandled error to `next(err)` in your routes and this handler catches it.

## Run it

```bash
npm run dev
```

Then from a second terminal:

```bash
# create a user
curl -s -X POST http://localhost:3001/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alice","email":"alice@example.com"}' | jq

# list users
curl -s http://localhost:3001/users | jq

# fetch by id
curl -s http://localhost:3001/users/1 | jq
```

## Building for production

```bash
npm run build
node dist/index.js
```

`tsc` compiles everything in `src/` to plain JavaScript in `dist/`. The output runs on any Node 18+ server without `ts-node` or any TypeScript tooling installed.

## What to add next

This skeleton handles the boilerplate; real APIs need a few more things:

- **Runtime validation** — use [Zod](https://zod.dev) to parse `req.body` instead of casting. You get a type-safe parsed value and a descriptive error message when the shape is wrong.
- **Database** — swap the in-memory array for a `pg` pool or Prisma client. TypeScript makes the repository layer much easier to maintain.
- **Authentication** — JWT middleware is straightforward: verify the token in a middleware function, attach the decoded payload to `req.user` (you'll need to extend Express's `Request` type with a [declaration merge](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)), then read it in handlers.
- **Testing** — [supertest](https://github.com/ladjs/supertest) lets you fire requests at your Express app in Jest without starting a real server.

The nice thing about this setup is that TypeScript's `strict` mode catches most mistakes before you ever run a request — wrong property names, missing return statements in handlers, incompatible types between layers. It's not more work; it's fewer debugging sessions.
