---
title: 'Building a REST API with Node.js, Express, and PostgreSQL'
date: '2026-06-15'
image: cover.jpg
excerpt: A practical end-to-end walkthrough — spin up Express, connect to Postgres with parameterized queries, and build a solid set of CRUD routes.
isFeatured: true
belt: green
---

The Node.js + Express + PostgreSQL combination is a dependable choice for side projects and small services. It's boring in the best way: minimal magic, predictable performance, and a huge ecosystem of answers when something breaks.

This post walks through building a small `tasks` API from scratch. By the end you'll have working `GET`, `POST`, `PATCH`, and `DELETE` routes backed by a real Postgres table, with proper parameterized queries and basic error handling.

## Project Setup

```bash
mkdir tasks-api && cd tasks-api
npm init -y
npm install express pg
npm install --save-dev nodemon
```

Add a `dev` script to `package.json`:

```json
"scripts": {
  "dev": "nodemon index.js",
  "start": "node index.js"
}
```

## The Database

Run Postgres locally via Docker, with no installation required:

```bash
docker run -d \
  --name tasks-pg \
  -e POSTGRES_USER=dev \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=tasksdb \
  -p 5432:5432 \
  postgres:16-alpine
```

Then connect and create the table:

```bash
docker exec -it tasks-pg psql -U dev -d tasksdb
```

```sql
CREATE TABLE tasks (
  id         SERIAL PRIMARY KEY,
  title      TEXT        NOT NULL,
  done       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Database Connection

Create `db.js` — a simple pool you import wherever you need it:

```js
// db.js
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.PGHOST     || 'localhost',
  port:     process.env.PGPORT     || 5432,
  user:     process.env.PGUSER     || 'dev',
  password: process.env.PGPASSWORD || 'secret',
  database: process.env.PGDATABASE || 'tasksdb',
});

module.exports = pool;
```

`pg.Pool` manages a small pool of persistent connections so you're not paying TCP handshake overhead on every request.

## Building the Routes

```js
// index.js
const express = require('express');
const pool    = require('./db');

const app = express();
app.use(express.json());

// GET /tasks — list all
app.get('/tasks', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM tasks ORDER BY created_at DESC'
  );
  res.json(rows);
});

// GET /tasks/:id — single task
app.get('/tasks/:id', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM tasks WHERE id = $1',
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  res.json(rows[0]);
});

// POST /tasks — create
app.post('/tasks', async (req, res) => {
  const { title } = req.body;
  if (!title?.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  const { rows } = await pool.query(
    'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
    [title.trim()]
  );
  res.status(201).json(rows[0]);
});

// PATCH /tasks/:id — update title or done flag
app.patch('/tasks/:id', async (req, res) => {
  const { title, done } = req.body;
  const { rows } = await pool.query(
    `UPDATE tasks
        SET title = COALESCE($1, title),
            done  = COALESCE($2, done)
      WHERE id = $3
  RETURNING *`,
    [title ?? null, done ?? null, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  res.json(rows[0]);
});

// DELETE /tasks/:id
app.delete('/tasks/:id', async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM tasks WHERE id = $1',
    [req.params.id]
  );
  if (!rowCount) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
});

app.listen(3001, () => console.log('API on http://localhost:3001'));
```

A few things worth calling out:

- **`$1`, `$2`... placeholders** are what keeps you safe from SQL injection. Never interpolate user input directly into a query string.
- **`COALESCE`** in the PATCH lets you send only the fields you want to change — if `title` is `null` the column keeps its current value.
- **`RETURNING *`** saves a second round-trip; you get the updated row back immediately.

## Error Handling

`npm install express` now gives you Express 5, which automatically forwards a rejected promise from an async handler to the error middleware. By default, though, that means an HTML error page. Add a small middleware after your routes to return JSON instead:

```js
// at the bottom of index.js, after the routes and before app.listen
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'internal server error' });
});
```

On Express 4, async errors are not forwarded for you. A rejected promise goes unhandled and can crash the process, so you have to catch it and call `next(err)`. A small helper keeps that tidy:

```js
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get('/tasks', wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
  res.json(rows);
}));
```

## Trying It Out

```bash
npm run dev

# create a task
curl -X POST http://localhost:3001/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title": "write a blog post"}'

# mark it done
curl -X PATCH http://localhost:3001/tasks/1 \
  -H 'Content-Type: application/json' \
  -d '{"done": true}'

# list all
curl http://localhost:3001/tasks

# delete
curl -X DELETE http://localhost:3001/tasks/1
```

## What to Add Next

This gives you the skeleton. Before going to production, add:

- **Validation library** — `zod` or `joi` to validate input consistently instead of one-off `if` checks. Right now, for example, a non-numeric `:id` reaches Postgres and comes back as a 500 rather than a 400.
- **Auth middleware** — JWT verification via `express-jwt` or a session cookie.
- **Pagination** — `LIMIT $1 OFFSET $2` with a `?page=` query param before the table grows.
- **Migrations** — `node-pg-migrate` or `db-migrate` so schema changes are versioned and repeatable.
- **Environment management** — `dotenv` in development, real secrets (not hardcoded) in production.

The pattern here — Pool → parameterized query → return JSON — goes a long way, and it keeps the database connection count low and the query logic easy to audit.
