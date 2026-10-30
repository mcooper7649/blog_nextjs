---
title: 'Core Web Vitals in Next.js: Measuring and Fixing What Actually Matters'
date: '2026-10-30'
image: cover.jpg
excerpt: LCP, INP, and CLS explained with concrete Next.js fixes — next/image, font optimization, lazy loading, and the useReportWebVitals hook.
isFeatured: false
belt: green
---

Core Web Vitals (CWV) are part of the page experience signals Google considers in search, but the better reason to care is that they measure how fast and stable a page feels to real users. Many of the fixes are mechanical once you know where to look.

This post covers the three metrics, why each one matters, and the exact changes you make in a Next.js app to move the needle.

## The Three Metrics

**LCP — Largest Contentful Paint** measures how long the largest visible element (usually a hero image or h1) takes to render. Target: under 2.5 seconds.

**INP — Interaction to Next Paint** measures how quickly the page responds after a user interaction (click, tap, keypress). It replaced FID in 2024 and is harder to game — it samples *all* interactions, not just the first. Target: under 200 ms.

**CLS — Cumulative Layout Shift** measures unexpected layout movement. Every time an image loads without reserved space and shoves text down, CLS goes up. Target: under 0.1.

## Measuring First

Next.js has a built-in reporting hook, so there's nothing extra to install. In the Pages Router, call it from `pages/_app.js`. In the App Router, put it in a small `'use client'` component and render that from `app/layout.js`.

```js
// pages/_app.js
import { useReportWebVitals } from 'next/web-vitals';

function reportWebVitals(metric) {
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

`useReportWebVitals` reports LCP, INP, CLS, FCP, and TTFB automatically. The callback is defined outside the component so it stays stable across renders.

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

The `priority` prop injects a `<link rel="preload" as="image">` into the document head, telling the browser to fetch it as early as possible. Use it only on the image likely to be the LCP element, which usually means one per page. (Next.js 16 deprecates `priority` in favor of a `preload` prop, so check which your version uses.)

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

// This bundle loads when the modal first renders, not with the initial page
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

This helps when `onResults` updates React state: the input stays responsive and React can interrupt the expensive re-render if the user keeps typing.

## Fixing CLS

The most reliable CLS fix is reserving space for every element whose dimensions you know ahead of time. `next/image` helps here when you provide explicit `width` and `height`: they're rendered as attributes on the `<img>`, so the browser can reserve the right space before the image downloads.

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

Before shipping a Next.js page, run through this list:

- [ ] Hero image uses `<Image priority>` — not a plain `<img>` tag
- [ ] Fonts loaded via `next/font` (no `@import` from Google CDN)
- [ ] Heavy components below the fold are `dynamic()` imported
- [ ] All `<Image>` tags have explicit `width` and `height`
- [ ] No layout-shifting elements (ads, embeds) without reserved containers
- [ ] `useReportWebVitals` is wired up to capture real-user data

Lighthouse in Chrome DevTools gives you quick lab results without deploying. Test a production build (`next build && next start`), since dev mode is much slower. Lab tools can't measure INP directly because no real user is interacting, so use the data from `useReportWebVitals` or Chrome's field data to confirm the result.

Core Web Vitals optimization isn't magic. A lot of the gains come from a handful of repeatable fixes applied consistently.
