---
title: 'Core Web Vitals in Next.js: Measuring and Fixing What Actually Matters'
date: '2026-10-30'
image: cover.jpg
excerpt: LCP, INP, and CLS explained with concrete Next.js fixes — next/image, font optimization, lazy loading, and the useReportWebVitals hook.
isFeatured: false
---

Google uses Core Web Vitals (CWV) as a real ranking signal, and more importantly, they correlate directly with users staying on your page or leaving. I've spent time tuning these on my own Next.js sites, and the improvements are almost always mechanical once you know where to look.

This post covers the three metrics, why each one matters, and the exact changes you make in a Next.js app to move the needle.

## The Three Metrics

**LCP — Largest Contentful Paint** measures how long the largest visible element (usually a hero image or h1) takes to render. Target: under 2.5 seconds.

**INP — Interaction to Next Paint** measures how quickly the page responds after a user interaction (click, tap, keypress). It replaced FID in 2024 and is harder to game — it samples *all* interactions, not just the first. Target: under 200 ms.

**CLS — Cumulative Layout Shift** measures unexpected layout movement. Every time an image loads without reserved space and shoves text down, CLS goes up. Target: under 0.1.

## Measuring First

Install the `web-vitals` package and wire it into Next.js's built-in reporting hook:

```bash
npm install web-vitals
```

In `pages/_app.js` (or `app/layout.js` with `'use client'`):

```js
// pages/_app.js
import { useReportWebVitals } from 'next/web-vitals';

export function reportWebVitals(metric) {
  // Log to console during development
  console.log(metric.name, metric.value.toFixed(1));

  // In production, send to your analytics endpoint
  if (process.env.NODE_ENV === 'production') {
    navigator.sendBeacon('/api/vitals', JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
    }));
  }
}

export default function App({ Component, pageProps }) {
  useReportWebVitals(reportWebVitals);
  return <Component {...pageProps} />;
}
```

`useReportWebVitals` fires for LCP, INP, CLS, FCP, and TTFB automatically — no extra setup needed.

## Fixing LCP

The most common LCP killer is an above-the-fold image that loads late. `next/image` handles lazy loading by default, but for hero images you want the opposite — eager loading with a fetch priority hint:

```jsx
import Image from 'next/image';

export default function Hero() {
  return (
    <Image
      src="/images/hero.jpg"
      alt="Hero"
      width={1200}
      height={630}
      priority          // disables lazy load, adds <link rel="preload">
      sizes="100vw"
      quality={85}
    />
  );
}
```

The `priority` prop injects a `<link rel="preload" as="image">` into the document head, telling the browser to fetch it as early as possible. Use it on exactly one image per page — the one that will be the LCP element.

For Google Fonts, swap `@import` inside a stylesheet (which blocks render) for Next.js's built-in font loader:

```js
// app/layout.js  or  pages/_app.js
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',   // show fallback font while Inter loads
});
```

Next.js downloads the font files at build time and self-hosts them, eliminating the DNS lookup and connection to `fonts.googleapis.com`.

## Fixing INP

INP is about long tasks blocking the main thread. The most direct fix in a React app is splitting heavy components so they don't all parse and execute on first load:

```js
import dynamic from 'next/dynamic';

// This bundle only loads when the modal is opened, not on page load
const HeavyModal = dynamic(() => import('../components/HeavyModal'), {
  loading: () => <p>Loading…</p>,
});
```

For event handlers that do expensive work, use `startTransition` to tell React the update is non-urgent:

```js
import { startTransition, useState } from 'react';

function SearchInput({ onResults }) {
  const [query, setQuery] = useState('');

  function handleChange(e) {
    const value = e.target.value;
    setQuery(value);

    // Mark the results update as non-urgent — input stays responsive
    startTransition(() => {
      onResults(value);
    });
  }

  return <input value={query} onChange={handleChange} />;
}
```

Wrapping the results update in `startTransition` keeps the input snappy even if the filtering computation takes a few milliseconds.

## Fixing CLS

The most reliable CLS fix is reserving space for every element whose dimensions you know ahead of time. `next/image` does this automatically when you provide explicit `width` and `height` — it injects an inline `aspect-ratio` style so the slot exists before the image downloads.

For dynamic content like embeds or ads, use a wrapper with a fixed aspect ratio:

```css
.embed-wrapper {
  position: relative;
  aspect-ratio: 16 / 9;
  width: 100%;
}

.embed-wrapper iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
```

For skeleton screens (placeholder shimmer while data loads), render the skeleton at the same dimensions as the real content so the layout never shifts when the real data arrives.

## Putting It Together: A Quick Audit Checklist

Before shipping any Next.js page, I run through this list:

- [ ] Hero image uses `<Image priority>` — not a plain `<img>` tag
- [ ] Fonts loaded via `next/font` (no `@import` from Google CDN)
- [ ] Heavy components below the fold are `dynamic()` imported
- [ ] All `<Image>` tags have explicit `width` and `height`
- [ ] No layout-shifting elements (ads, embeds) without reserved containers
- [ ] `useReportWebVitals` is wired up to capture real-user data

Running `npx @unlighthouse/cli` against your local dev server gives a full CWV simulation report without needing to deploy, which makes iteration much faster.

Core Web Vitals optimization isn't magic — most of the gains come from a handful of repeatable fixes applied consistently. The checklist above takes maybe 30 minutes on a fresh Next.js app and moves all three metrics into the green zone on most content sites.
