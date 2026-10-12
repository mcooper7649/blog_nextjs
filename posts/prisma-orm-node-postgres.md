---
title: "Prisma ORM: Type-Safe Database Queries for Node.js"
date: '2026-10-12'
image: cover.jpg
excerpt: Prisma turns your Postgres schema into a fully-typed TypeScript client — no hand-rolled SQL strings, no manual type definitions. Here's how to go from zero to productive queries in minutes.
isFeatured: true
---

If you've built a Node.js app with a Postgres database you know the friction: write raw SQL, manually type the result rows, and hope nothing drifts out of sync between your schema and your TypeScript types. Prisma removes that friction with a single source of truth — a `schema.prisma` file that drives both your migrations and a fully-typed client.

## Setup

Start with a fresh Node.js + TypeScript project and install Prisma:

```bash
npm install prisma --save-dev
npm install @prisma/client
npx prisma init
```

`prisma init` creates two things: a `prisma/schema.prisma` file and a `.env` with a `DATABASE_URL` placeholder. Fill in your Postgres connection string:

```
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
```

## Define Your Schema

Everything flows from `schema.prisma`. Here's a simple blog-style model:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  createdAt DateTime @default(now())
}
```

The schema is declarative and readable. Prisma uses it to generate a type-safe client AND to manage migrations — you never write a migration file by hand.

## Run Your First Migration

```bash
npx prisma migrate dev --name init
```

Prisma diffs your schema against the current database state, generates a SQL migration file in `prisma/migrations/`, and applies it. Commit those migration files alongside your code so the team stays in sync.

## CRUD with the Prisma Client

Generate (or regenerate) the client after any schema change:

```bash
npx prisma generate
```

Then import and use it:

```ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a user
const user = await prisma.user.create({
  data: { email: 'alex@example.com', name: 'Alex' },
});

// Create a related post
const post = await prisma.post.create({
  data: {
    title: 'Hello Prisma',
    content: 'Type-safe queries are great.',
    author: { connect: { id: user.id } },
  },
});

// Read with a filter
const publishedPosts = await prisma.post.findMany({
  where: { published: true },
  orderBy: { createdAt: 'desc' },
  take: 10,
});

// Update
await prisma.post.update({
  where: { id: post.id },
  data: { published: true },
});

// Delete
await prisma.user.delete({ where: { id: user.id } });
```

Every method is fully typed. TypeScript knows the shape of `user`, `post`, and `publishedPosts` based on the schema — no manual interface definitions required.

## Fetching Relations with `include`

One of Prisma's best features is eager loading. Pass `include` to pull in related records in a single query:

```ts
const userWithPosts = await prisma.user.findUnique({
  where: { email: 'alex@example.com' },
  include: { posts: true },
});

// userWithPosts.posts is typed as Post[]
```

Need only specific fields? Use `select` instead of `include`:

```ts
const titles = await prisma.post.findMany({
  select: { id: true, title: true, author: { select: { name: true } } },
});
// titles is { id: number; title: string; author: { name: string | null } }[]
```

The return type narrows automatically based on exactly what you select — a killer DX win.

## Transactions

For operations that must succeed or fail together, use `prisma.$transaction`:

```ts
const [newUser, newPost] = await prisma.$transaction([
  prisma.user.create({ data: { email: 'bob@example.com' } }),
  prisma.post.create({
    data: { title: 'First post', authorId: 1 },
  }),
]);
```

For complex conditional logic inside a transaction, pass an async callback:

```ts
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: { email: 'carol@example.com' } });
  await tx.post.create({ data: { title: 'Hi', authorId: user.id } });
});
```

## When to Drop Down to Raw SQL

Prisma covers 95% of app-level queries cleanly, but for analytics or heavy aggregations it can get awkward. For those cases, use `prisma.$queryRaw`:

```ts
const stats = await prisma.$queryRaw<{ month: string; count: bigint }[]>`
  SELECT to_char(created_at, 'YYYY-MM') AS month, COUNT(*) AS count
  FROM "Post"
  WHERE published = true
  GROUP BY month
  ORDER BY month DESC
`;
```

Note the tagged template literal — Prisma parameterises values automatically, so you're protected from SQL injection.

## Wrapping Up

Prisma's main strengths are:

- **One schema, two artefacts** — migrations AND a typed client from the same definition.
- **Zero drift** — if you change the schema and run `prisma generate`, your TypeScript compiler catches every call site that no longer matches.
- **Readable queries** — `findMany`, `include`, `select` are far easier to scan than hand-written SQL strings buried in template literals.

For a new Node.js project on Postgres I reach for Prisma by default. I keep raw SQL in my back pocket for the queries that genuinely need it — but those are rare.

If you're already using Postgres directly (the `postgres` npm package or `pg`), Prisma can introspect your existing schema with `npx prisma db pull` and generate the schema file for you, so the migration path isn't painful either.
