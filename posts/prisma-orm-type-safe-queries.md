---
title: "Prisma ORM: Skip the SQL Boilerplate Without Losing Type Safety"
date: '2026-09-18'
image: cover.jpg
excerpt: Prisma generates a fully-typed database client from your schema — no hand-written types, no raw SQL for the common path. Here is how I use it in Next.js projects.
isFeatured: false
---

If you've read my [PostgreSQL for Node.js post](/posts/postgres) you know I like raw SQL for its clarity. But in practice, most of the queries in a real app are dead boring — find a user by id, list posts for a user, insert a row. Writing `pg` boilerplate for every one of those is noise, and the biggest cost is that you lose the TypeScript safety the moment the query returns `any`.

[Prisma](https://www.prisma.io) solves this cleanly. You write a schema, run one command, and get a fully-typed client where the compiler knows the exact shape of every query result. I've been using it in personal and homelab projects for the last year and the developer experience is hard to beat.

## Installing and Initializing

```bash
npm install prisma --save-dev
npm install @prisma/client
npx prisma init --datasource-provider postgresql
```

`prisma init` creates two things:
- `prisma/schema.prisma` — your data model
- `.env` with a `DATABASE_URL` placeholder

Point `DATABASE_URL` at your Postgres instance:

```
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
```

## Defining the Schema

The schema is Prisma's own DSL. It's straightforward and becomes your single source of truth for the database and TypeScript types:

```prisma
// prisma/schema.prisma
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
  createdAt DateTime @default(now())
  posts     Post[]
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

## Migrations

Once the schema is defined, create and apply the first migration:

```bash
npx prisma migrate dev --name init
```

This generates a SQL migration file in `prisma/migrations/`, runs it, and re-generates the typed client. In production you use `prisma migrate deploy` instead, which applies pending migrations without the interactive prompt.

I keep the `prisma/migrations/` folder committed. That way migrations are versioned alongside code — the same approach as [Flyway or Liquibase](https://flywaydb.org), but Prisma generates the SQL for you.

## Querying with Full Type Safety

Generate (or regenerate) the client any time you change the schema:

```bash
npx prisma generate
```

Then use it. The pattern I use in Next.js is a singleton to avoid creating a new connection pool on every hot-reload in development:

```ts
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['warn', 'error'] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

Now the common queries write themselves:

```ts
import { prisma } from '@/lib/prisma';

// Find a user — result is typed: User | null
const user = await prisma.user.findUnique({
  where: { email: 'alice@example.com' },
});

// Fetch posts with the author included
// result is Post & { author: User }[]
const posts = await prisma.post.findMany({
  where: { published: true },
  include: { author: true },
  orderBy: { createdAt: 'desc' },
  take: 10,
});

// Create a user and a post atomically
const newUser = await prisma.user.create({
  data: {
    email: 'bob@example.com',
    name: 'Bob',
    posts: {
      create: { title: 'Hello World', published: true },
    },
  },
});
```

The types on `posts` above aren't `any[]` — they're the exact inferred intersection. If you rename `author.email` to `author.emailAddress` in the schema and forget to update a template, the compiler tells you before the deploy.

## Filtering, Pagination, and Counts

```ts
// WHERE clause — all fields are typed, no raw string
const recentDrafts = await prisma.post.findMany({
  where: {
    published: false,
    createdAt: { gte: new Date('2026-01-01') },
  },
  select: {
    id: true,
    title: true,
    createdAt: true,
    // author.name only — not the whole author row
    author: { select: { name: true } },
  },
  skip: 0,
  take: 20,
});

// Count
const total = await prisma.post.count({ where: { published: true } });
```

`select` is the key ergonomic win: you describe exactly what you need, and the return type is narrowed to match — no `author.password` leaking into an API response because you forgot a field.

## When to Drop to Raw SQL

Prisma isn't a replacement for SQL knowledge. I reach for `prisma.$queryRaw` when I need:
- CTEs or recursive queries
- Window functions
- Bulk upserts with `ON CONFLICT DO UPDATE`

```ts
import { Prisma } from '@prisma/client';

const rows = await prisma.$queryRaw<{ title: string; rank: number }[]>`
  SELECT title, ts_rank(search_vector, plainto_tsquery(${query})) AS rank
  FROM posts
  WHERE search_vector @@ plainto_tsquery(${query})
  ORDER BY rank DESC
  LIMIT 10
`;
```

The template literal escapes parameters automatically — no SQL injection risk. The return type is whatever generic you pass, so you get TypeScript types back even here.

## Introspecting an Existing Database

If you have an existing Postgres database (homelab project, legacy app), you don't need to rewrite the schema by hand:

```bash
npx prisma db pull
```

Prisma reads the live schema and writes `schema.prisma` for you. From there you can generate the client and start querying with types immediately.

## Putting It Together

The workflow that works for me on Next.js projects:

1. Edit `schema.prisma`
2. `npx prisma migrate dev --name <description>` in development
3. `npx prisma generate` (the `migrate dev` command does this automatically)
4. Commit both the schema change and the generated migration SQL
5. CI/CD runs `npx prisma migrate deploy` before the app starts

Prisma doesn't try to replace SQL — complex analytical queries still belong in `.sql` files or `$queryRaw`. But for the 90% of CRUD that makes up most apps, having a generated typed client removes a whole category of runtime bugs that raw `pg` queries would let slip through. Combined with Zod at the API boundary, I rarely ship a database-related type error anymore.
