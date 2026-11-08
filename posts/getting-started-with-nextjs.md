---
title: 'NextJS: Core Feature Overview'
date: '2022-03-01'
image: getting-started-nextjs.png
excerpt: NextJS is the React framework for production — it ships file-based routing, server-side rendering, static generation, and smart data fetching out of the box.
isFeatured: false
belt: yellow
---

Next.js is a **framework built on top of React** that solves three problems that plain React leaves to you: routing, server-side rendering, and data fetching. This guide covers the Pages Router — the original Next.js model that is still widely used in production apps today.

For the newer App Router (introduced in Next.js 13), see [Next.js App Router: What Changed and Why It Matters](/posts/nextjs-app-router).

---

## File-based Routing

![Create routes via your file + folder structure](nextjs-file-based-routing.png)

In a standard React app you install a router package, import components, and define routes manually. Next.js takes a different approach: **every file you create in `pages/` becomes a route automatically.**

```
pages/
  index.js          → /
  about.js          → /about
  blog/
    index.js        → /blog
    [slug].js       → /blog/:slug   (dynamic segment)
  posts/
    [id]/
      comments.js   → /posts/:id/comments
```

### Dynamic Routes

Square brackets mark a dynamic segment. The value is available inside the page via `useRouter()` or `getServerSideProps`/`getStaticProps`:

```jsx
// pages/blog/[slug].js
import { useRouter } from 'next/router';

export default function BlogPost() {
  const router = useRouter();
  const { slug } = router.query; // "my-first-post"

  return <h1>Post: {slug}</h1>;
}
```

### Linking Between Pages

Use the built-in `<Link>` component instead of plain `<a>` tags — it handles client-side navigation and prefetches linked pages in the background:

```jsx
import Link from 'next/link';

export default function Nav() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/blog/hello-world">First Post</Link>
    </nav>
  );
}
```

---

## Classic React Rendering vs. Next.js Pre-rendering

![No-rendering Example](No-rendering.png)

In a plain React (Create React App) setup, the server sends a nearly empty `index.html` and all rendering happens in the browser. The user sees a blank page until JavaScript downloads, parses, and executes. Search engines may not see the full content because their crawlers have limited time to wait for JavaScript.

![Pre-rendering Example](Pre-rendering.png)

Next.js **pre-renders every page by default** — it generates HTML on the server so the browser receives ready-to-display markup immediately. After the HTML loads, React "hydrates" it: attaching event handlers and making the page interactive. The result is faster first paint and full SEO visibility.

---

## Two Types of Pre-rendering

### Static Site Generation (SSG)

![Static-Gen](static-gen.png)

HTML is generated **once at build time** and served from a CDN on every subsequent request. This is the fastest option because there is no server computation per request.

Use SSG when the page content does not change between deploys — marketing pages, blog posts, documentation.

```jsx
// pages/blog/[slug].js
export async function getStaticPaths() {
  // Tell Next.js which slugs to pre-build
  const slugs = ['hello-world', 'second-post'];

  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: false, // 404 for any slug not listed above
  };
}

export async function getStaticProps({ params }) {
  // This runs at build time — fetch from a CMS, file system, DB, etc.
  const post = await fetchPostBySlug(params.slug);

  return {
    props: { post },
    revalidate: 60, // regenerate at most once per minute (ISR)
  };
}

export default function BlogPost({ post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
    </article>
  );
}
```

`revalidate` turns SSG into **Incremental Static Regeneration (ISR)**: pages are still served statically but Next.js rebuilds them in the background when they go stale. You get CDN speed with fresh data.

### Server-Side Rendering (SSR)

![SSR](SSR.png)

HTML is generated **on each request**. The server fetches fresh data, renders the page, and sends it to the browser. Use SSR when the page must reflect the latest data on every load — user dashboards, search results, personalised pages.

```jsx
// pages/dashboard.js
export async function getServerSideProps(context) {
  const { req } = context;
  const user = getUserFromCookie(req); // read the session cookie

  if (!user) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  const stats = await fetchUserStats(user.id);

  return { props: { user, stats } };
}

export default function Dashboard({ user, stats }) {
  return (
    <main>
      <h1>Welcome, {user.name}</h1>
      <p>Total posts: {stats.postCount}</p>
    </main>
  );
}
```

---

## Per-Page Rendering Strategy

![Per Page Basis](per-page-basis.png)

One of Next.js's strengths is that **you pick the strategy page by page**. A single app can have:

- `/` — SSG (marketing landing page, rebuilt at deploy)
- `/blog/[slug]` — SSG + ISR (blog posts, rebuilt on demand)
- `/dashboard` — SSR (always fresh, auth-protected)
- `/settings` — SSG shell + client-side fetch (static layout, user data loaded in the browser)

---

## Rich Data Fetching Capabilities

### Static Pages Without Data

![Static without data](static-wo-data.png)

A page with no `getStaticProps` or `getServerSideProps` export is fully static — Next.js pre-renders it at build time with no external data:

```jsx
// pages/about.js — no data fetching needed
export default function About() {
  return <main><h1>About Us</h1><p>We build things.</p></main>;
}
```

### Static Pages With Data

![Static with data](static-with-data.png)

Export `getStaticProps` to supply build-time data to the component. The function only ever runs on the server (or during the build) — it never ships to the browser bundle:

```jsx
// pages/index.js
export async function getStaticProps() {
  const res = await fetch('https://api.example.com/featured-posts');
  const posts = await res.json();

  return {
    props: { posts },
    revalidate: 300, // regenerate every 5 minutes
  };
}

export default function Home({ posts }) {
  return (
    <ul>
      {posts.map((p) => (
        <li key={p.id}>{p.title}</li>
      ))}
    </ul>
  );
}
```

### Client-Side Fetching

For data that is user-specific or should not be included in the initial HTML, fetch it in the browser with `useEffect` or a library like TanStack Query:

```jsx
import { useEffect, useState } from 'react';

export default function Notifications() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then(setItems);
  }, []);

  return <ul>{items.map((n) => <li key={n.id}>{n.message}</li>)}</ul>;
}
```

---

## API Routes

The `pages/api/` directory lets you write serverless functions alongside your pages — no separate backend needed:

```js
// pages/api/hello.js
// Accessible at GET /api/hello
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.status(200).json({ message: 'Hello from Next.js!' });
}
```

API routes run only on the server and are excluded from the client bundle. Use them for form submissions, webhooks, or proxying third-party APIs to keep credentials out of the browser.

---

## When to Choose What

| Scenario | Strategy |
|---|---|
| Marketing page, docs | SSG (no `getStaticProps`) |
| Blog or product pages (content changes infrequently) | SSG + ISR (`revalidate`) |
| News feed, search results (always fresh) | SSR (`getServerSideProps`) |
| User-specific data (after auth) | SSG shell + client-side fetch |
| Form submission, webhook endpoint | API Route |

The [Next.js docs](https://nextjs.org/docs) are the best reference as the framework evolves, but these fundamentals remain consistent across versions.
