---
title: 'SEO in React: Dynamic Meta Tags with react-helmet-async'
excerpt: Single-page apps skip server-rendered head tags by default — react-helmet-async fixes that by letting you set title, description, and Open Graph tags from any component.
image: react-helmet-main.png
isFeatured: true
date: '2026-10-24'
---

React apps are great for building interactive UIs, but they have a classic SEO problem: the HTML shell served to crawlers is nearly empty. The `<title>` and `<meta>` tags that search engines and social-media scrapers rely on live inside your JavaScript, not in the HTML response.

`react-helmet-async` solves this by giving you a declarative way to manage `<head>` from any component. It works on the client, and — crucially — it supports server-side rendering so you can pre-render populated head tags with Next.js or a custom SSR setup.

## Installation

```bash
npm install react-helmet-async
```

## Wrap your app in HelmetProvider

`HelmetProvider` maintains a context that gathers every `<Helmet>` declaration in the tree and merges them into a single `<head>`. You add it once at the root of your app.

```jsx
// src/index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
```

## Set default meta tags in App

Put a `<Helmet>` in your top-level `App` component to define site-wide defaults. Any page that renders its own `<Helmet>` will override these fields.

```jsx
// src/App.jsx
import { Helmet } from 'react-helmet-async';

export default function App() {
  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>My Site</title>
        <meta name="description" content="Practical articles on React and web development." />
        <meta property="og:site_name" content="My Site" />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* rest of the app */}
    </>
  );
}
```

## Per-page meta tags

Each route or page component adds its own `<Helmet>`. Children override parents when the same tag type appears in both — so your blog post's `<title>` wins over the default, and the defaults fill in anything the page doesn't specify.

```jsx
// src/pages/BlogPost.jsx
import { Helmet } from 'react-helmet-async';

export default function BlogPost({ post }) {
  const { title, excerpt, slug, coverUrl } = post;
  const pageUrl = `https://example.com/posts/${slug}`;

  return (
    <>
      <Helmet>
        <title>{title} — My Site</title>
        <meta name="description" content={excerpt} />
        <link rel="canonical" href={pageUrl} />

        {/* Open Graph (Facebook, LinkedIn, etc.) */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={excerpt} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="article" />
        {coverUrl && <meta property="og:image" content={coverUrl} />}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={excerpt} />
        {coverUrl && <meta name="twitter:image" content={coverUrl} />}
      </Helmet>
      <article>
        <h1>{title}</h1>
        <p>{excerpt}</p>
      </article>
    </>
  );
}
```

The canonical `<link>` tag is worth including on every page — it tells search engines the authoritative URL and prevents duplicate-content issues if the same page is ever reachable via multiple URLs.

## A reusable SEO component

Once you find yourself repeating the same set of tags across pages, extract it:

```jsx
// src/components/Seo.jsx
import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'My Site';
const SITE_URL = 'https://example.com';
const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`;

export default function Seo({ title, description, path, image }) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
  const url = `${SITE_URL}${path ?? ''}`;
  const ogImage = image ?? DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
```

Usage is now a one-liner per page:

```jsx
<Seo
  title="Getting Started with React Hooks"
  description="A practical introduction to useState, useEffect, and custom hooks."
  path="/posts/react-hooks"
  image="https://example.com/images/react-hooks.png"
/>
```

## Server-side rendering

If you use an SSR framework, you need to extract the helmet state on the server and inject it into the HTML response. The `HelmetProvider` accepts a `context` object that gets populated after the render:

```jsx
// server entry point (Express example)
import { renderToString } from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';

app.get('*', (req, res) => {
  const helmetContext = {};

  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <App url={req.url} />
    </HelmetProvider>
  );

  const { helmet } = helmetContext;

  res.send(`<!doctype html>
<html ${helmet.htmlAttributes.toString()}>
  <head>
    ${helmet.title.toString()}
    ${helmet.meta.toString()}
    ${helmet.link.toString()}
  </head>
  <body>
    <div id="root">${html}</div>
  </body>
</html>`);
});
```

This is exactly what frameworks like Next.js (Pages Router) do under the hood when you use `next/head` — and it's why react-helmet-async exists as a fork of the original react-helmet: the original wasn't safe for concurrent SSR.

## What to actually check

After you deploy, validate your tags with:

- **Google Rich Results Test** (`search.google.com/test/rich-results`) for structured data
- **OpenGraph debugger** (`developers.facebook.com/tools/debug`) for OG tags — note that Facebook caches aggressively; use the "Scrape Again" button
- **Twitter Card Validator** (`cards-dev.twitter.com/validator`)
- **curl -A Googlebot** to confirm the tags appear in the static HTML response if you're doing SSR

The tags need to be in the initial HTML served to the crawler, not added only after JavaScript runs. If your app is purely client-side (no SSR, no static generation), search engines that execute JavaScript (like Googlebot) will usually pick up the tags — but social-media scrapers generally won't, which means no preview images or descriptions when your links are shared.

For public-facing React apps, consider Next.js or Vite SSR to get pre-rendered meta tags out of the box. react-helmet-async is the right tool for managing those tags dynamically regardless of the rendering strategy you choose.
