---
title: 'Helper Files and Utility Functions in React'
excerpt: Keep components clean and logic reusable by extracting it into focused utility modules.
image: helper-main.png
isFeatured: true
date: '2022-06-12'
belt: white
---

Well-organized React projects almost always have a `helpers/` or `utils/` folder. These files hold the logic that doesn't belong inside a component: data transformations, API calls, validation rules, database access. Keeping that logic in separate modules makes it easier to test, reuse, and change without touching your UI.

## Why break logic out of components

A component's job is to render UI and respond to user events. When you mix data fetching, string formatting, and business rules into the same file, every change becomes risky — you might accidentally break rendering while fixing a data bug, or vice versa.

Utility files solve this by giving non-UI logic its own home. The benefits stack up quickly:

- **Testability** — a pure function is trivial to unit-test; a function tangled with JSX is not.
- **Reuse** — two components can import the same helper instead of duplicating code.
- **Readability** — the component shows *what* happens, the helper shows *how*.

## Basic utility module

Start with a plain ES module that exports named functions. Keep each function focused on one task.

```js
// utils/math-util.js
export function addTwoNumbers(a, b) {
  return a + b;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function formatCurrency(amount, locale = 'en-US', currency = 'USD') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}
```

```jsx
// SomePriceDisplay.jsx
import { formatCurrency } from '../utils/math-util';

function PriceTag({ amount }) {
  return <span>{formatCurrency(amount)}</span>;
}
```

## TypeScript helper files

Adding types makes helpers self-documenting and catches misuse at compile time.

```ts
// utils/string-util.ts
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
```

```ts
// utils/array-util.ts
export function groupBy<T>(
  items: T[],
  key: keyof T
): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const group = String(item[key]);
    acc[group] = acc[group] ?? [];
    acc[group].push(item);
    return acc;
  }, {});
}

export function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, i * size + size)
  );
}
```

## API helper module

Centralizing fetch calls in one file means you change the base URL or add an auth header in exactly one place.

```ts
// helpers/api-util.ts
const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function getAllEvents(): Promise<Event[]> {
  const res = await fetch(`${BASE}/events.json`);
  if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`);
  const data: Record<string, Omit<Event, 'id'>> = await res.json();

  return Object.entries(data).map(([id, event]) => ({ id, ...event }));
}

export async function getFeaturedEvents(): Promise<Event[]> {
  const events = await getAllEvents();
  return events.filter((e) => e.isFeatured);
}

export async function getEventById(id: string): Promise<Event | undefined> {
  const events = await getAllEvents();
  return events.find((e) => e.id === id);
}
```

Usage from a Next.js page:

```ts
// pages/events/index.tsx
import { getAllEvents } from '../../helpers/api-util';

export async function getStaticProps() {
  const events = await getAllEvents();
  return { props: { events }, revalidate: 60 };
}
```

## Database helper module

For server-side code, a `db-util` file keeps connection logic in one place and prevents opening multiple connections across route handlers.

```ts
// helpers/db-util.ts
import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI!;
let cachedClient: MongoClient | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient) {
    return { client: cachedClient, db: cachedClient.db() };
  }
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return { client, db: client.db() };
}

export async function insertDocument<T>(
  db: Db,
  collection: string,
  document: T
) {
  return db.collection<T>(collection).insertOne(document as any);
}

export async function getAllDocuments<T>(
  db: Db,
  collection: string,
  sort: Record<string, 1 | -1> = {},
  filter: Record<string, unknown> = {}
): Promise<T[]> {
  return db.collection<T>(collection).find(filter).sort(sort).toArray();
}
```

The connection is cached at module level so repeated calls within the same Node.js process reuse the existing connection instead of opening a new one on every request.

## Where to put helper files

There is no enforced convention, but most codebases follow one of two patterns:

```
# Option 1 — flat utils folder
src/
  utils/
    string-util.ts
    array-util.ts
    date-util.ts
  helpers/
    api-util.ts
    db-util.ts
```

```
# Option 2 — colocate with the feature that owns them
src/
  features/
    events/
      events-util.ts
      EventList.tsx
  shared/
    utils/
      string-util.ts
```

Shared, general-purpose functions go in `utils/`. Helpers tied to a specific feature stay next to that feature. Generic data-access helpers (db connections, API base calls) often live in a top-level `helpers/` or `lib/` folder.

## Noteables

- Extract a function into a helper as soon as you see it used in two or more places.
- Pure functions (no side effects, same output for same input) are easiest to test and reason about.
- Name files after what they do: `date-util.ts`, `api-util.ts`, not `helpers.ts`.

Learn more in the [MDN JavaScript modules guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules).
