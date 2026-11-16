---
title: 'Drizzle ORM: SQL-First Type Safety for TypeScript'
date: '2026-11-16'
image: cover.jpg
excerpt: Drizzle brings full TypeScript inference to your Postgres queries by writing the schema in TypeScript — no separate DSL, no code generator, just typed SQL that never drifts from your types.
isFeatured: false
belt: green
---

Prisma is excellent, but it comes with a learning curve: you write your schema in a custom `.prisma` DSL, run a code generator, and work with a client whose type signatures are several layers removed from SQL. Drizzle ORM takes a different stance — you define your tables as TypeScript objects, the library infers the types at compile time, and the queries you write look close enough to SQL that the mental model never drifts far.

This guide walks through a Postgres setup: schema definition, migrations with drizzle-kit, and the CRUD patterns you'll reach for every day.

## Installation

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

`drizzle-orm` is the query builder. `postgres` (the `postgres` npm package) is the Postgres client driver Drizzle will use. `drizzle-kit` is the CLI for generating and applying migrations.

Create a `src/db/schema.ts` for your table definitions and a `src/db/index.ts` for the connection.

## Defining the Schema

The schema is plain TypeScript — no code generation step, no separate file format.

```ts
// src/db/schema.ts
import { pgTable, serial, text, varchar, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  body: text('body').notNull(),
  published: boolean('published').default(false).notNull(),
  authorId: integer('author_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

Drizzle infers the TypeScript type for each column directly from this definition. `users.$inferSelect` gives you the full row type; `users.$inferInsert` gives the insert type (with optional defaulted fields).

## Connecting to Postgres

```ts
// src/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

## Migrations with drizzle-kit

Add a `drizzle.config.ts` at the project root:

```ts
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

Then generate and apply migrations:

```bash
# generate SQL migration files from your schema
npx drizzle-kit generate

# push changes directly to the database (great for local dev)
npx drizzle-kit push

# apply migrations in production
npx drizzle-kit migrate
```

The `generate` command creates timestamped `.sql` files in `./drizzle/` that you can commit alongside your schema changes. `push` skips the SQL files and applies changes directly — fast for local iteration.

## Querying

### Selecting rows

```ts
import { db } from './db';
import { users, posts } from './db/schema';
import { eq, and, desc } from 'drizzle-orm';

// all published posts, newest first
const allPosts = await db
  .select()
  .from(posts)
  .where(eq(posts.published, true))
  .orderBy(desc(posts.createdAt));

// single user by email
const [user] = await db
  .select()
  .from(users)
  .where(eq(users.email, 'ada@example.com'))
  .limit(1);
```

The `eq`, `and`, `desc` helpers are type-checked against the column definitions. Passing the wrong column type to `eq` is a compile-time error, not a runtime surprise.

### Inserting

```ts
const [newUser] = await db
  .insert(users)
  .values({ name: 'Ada', email: 'ada@example.com' })
  .returning();

// newUser is typed as typeof users.$inferSelect
console.log(newUser.id);
```

`.returning()` with no arguments returns all columns. You can pass a subset: `.returning({ id: users.id })`.

### Updating

```ts
await db
  .update(posts)
  .set({ published: true })
  .where(eq(posts.id, 42));
```

### Deleting

```ts
await db.delete(users).where(eq(users.id, 7));
```

## Joins

```ts
const postsWithAuthor = await db
  .select({
    postId: posts.id,
    title: posts.title,
    authorName: users.name,
  })
  .from(posts)
  .innerJoin(users, eq(posts.authorId, users.id))
  .where(eq(posts.published, true));
```

This returns a typed array where each row has exactly the three columns you specified — no extra fields, no `author: { name: string } | null` surprises.

## Relations (the relational query API)

For nested queries you can define relations separately and use `db.query.*`:

```ts
// src/db/schema.ts (additions)
import { relations } from 'drizzle-orm';

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
}));
```

Then query with eager loading:

```ts
const usersWithPosts = await db.query.users.findMany({
  with: {
    posts: {
      where: eq(posts.published, true),
      columns: { id: true, title: true },
    },
  },
});
```

The result is fully typed — `usersWithPosts[0].posts` is `Array<{ id: number; title: string }>`.

## Raw SQL escape hatch

When you need something the builder doesn't express, Drizzle exposes `sql` tagged template literals:

```ts
import { sql } from 'drizzle-orm';

const result = await db.execute(
  sql`SELECT pg_size_pretty(pg_database_size(current_database())) AS size`
);
```

## Drizzle vs Prisma

| | Drizzle | Prisma |
|---|---|---|
| Schema language | TypeScript | Custom `.prisma` DSL |
| Code generation | None | Required (`prisma generate`) |
| Query style | SQL-close builder | Prisma Client API |
| Bundle size | Lightweight | Larger (generated client) |
| Edge runtimes | Yes (HTTP drivers) | Limited |
| Migrations | drizzle-kit | Prisma Migrate |

Pick Drizzle when you want queries that map closely to SQL, need a small bundle for edge deployments, or dislike the code-generation step. Pick Prisma when you prefer its polished GUI (Prisma Studio), richer documentation, or the schema DSL feels more natural to your team.

Both are production-ready — the right choice is whichever mental model fits how you think about your data.
