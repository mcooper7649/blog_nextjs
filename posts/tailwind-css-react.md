---
title: 'Tailwind CSS in React: Utility-First Styling That Actually Scales'
date: '2026-11-11'
image: cover.jpg
excerpt: Skip the stylesheet ping-pong. Tailwind puts your styles next to your markup, keeps bundles small, and makes responsive and dark-mode design mechanical rather than creative.
isFeatured: false
belt: green
coverPending: true
coverPrompt: 'A painter arranging dozens of small color swatches in precise rows on a wooden workbench, one swatch painted vermilion, the rest forming a gradient of blues and grays'
---

Tailwind CSS is a utility-first CSS framework. Instead of writing classes like `.card-header` and then filling a stylesheet with the rules behind them, you compose small single-purpose classes—`flex`, `p-4`, `text-sm`, `bg-white`—directly in your JSX. The idea sounds messy until you try it; then it starts to feel obvious.

## Installing Tailwind in a Vite + React project

Tailwind v3 integrates through PostCSS, so the installation is two packages and a config file:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

`tailwind.config.js` controls which files Tailwind scans for class names. Set `content` to every file that might contain Tailwind classes:

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Then add the three Tailwind directives to your global CSS entry-point (usually `src/index.css`):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

That is the entire setup. Run `npm run dev` and Tailwind is active.

## The core mental model: spacing and sizing

Tailwind uses a base-4 scale. `p-1` is `0.25rem`, `p-4` is `1rem`, `p-8` is `2rem`, and so on. The same scale applies to margins (`m-*`), widths (`w-*`), heights (`h-*`), gaps (`gap-*`), and border-radius (`rounded-*`). Once the scale is in your muscle memory, sizing decisions become fast and consistent.

A typical card component:

```tsx
function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-600">{body}</p>
    </div>
  );
}
```

No separate CSS file. No class-name collisions. The styles live with the component that uses them.

## Responsive design with breakpoint prefixes

Tailwind ships with five breakpoints: `sm` (640 px), `md` (768 px), `lg` (1024 px), `xl` (1280 px), and `2xl` (1536 px). Prefix any utility with a breakpoint to apply it only at that width and above:

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {items.map((item) => <Card key={item.id} {...item} />)}
</div>
```

One column on mobile, two columns from 640 px, three columns from 1024 px—entirely in the className, no media queries in a stylesheet.

## Dark mode

Tailwind's `dark` variant activates when the `prefers-color-scheme` media query matches or when a parent element has the `dark` class (switch between the two with `darkMode: 'media'` or `darkMode: 'class'` in `tailwind.config.js`).

Class-based dark mode lets you toggle themes manually:

```js
// tailwind.config.js
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // …
}
```

Then prefix any utility with `dark:` to apply it in dark mode:

```tsx
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
  <p className="text-sm text-gray-600 dark:text-gray-400">
    This text adapts to the theme.
  </p>
</div>
```

Toggle the `dark` class on `<html>` to switch themes:

```ts
function toggleDark() {
  document.documentElement.classList.toggle('dark');
}
```

## Conditional classes with `clsx`

JSX string concatenation gets ugly fast. The `clsx` library (or its typed twin `clsx`) solves it cleanly:

```bash
npm install clsx
```

```tsx
import clsx from 'clsx';

type ButtonProps = {
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
};

function Button({ variant = 'primary', disabled, children, onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2',
        {
          'bg-indigo-600 text-white hover:bg-indigo-700': variant === 'primary',
          'border border-gray-300 text-gray-700 hover:bg-gray-50': variant === 'ghost',
          'opacity-50 cursor-not-allowed': disabled,
        }
      )}
    >
      {children}
    </button>
  );
}
```

A common pattern in larger projects is a `cn()` helper that combines `clsx` with `tailwind-merge` to prevent conflicting utilities (`p-4` and `p-6` on the same element) from both appearing in the output:

```bash
npm install clsx tailwind-merge
```

```ts
// src/lib/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Use `cn()` everywhere you'd use `clsx()`. The merge step ensures that when a consumer overrides `px-4` with `px-6`, only `px-6` ends up in the DOM.

## When to use `@apply`

The `@apply` directive lets you extract repeated utility patterns into a named CSS class:

```css
/* src/index.css */
@layer components {
  .btn-primary {
    @apply rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700;
  }
}
```

Reach for it only when the same combination appears across many files and a component abstraction is not the right tool (global button resets, prose typography). Inside React, a component is almost always the better choice—`@apply` moves your styles back into a stylesheet and breaks the colocation benefit.

## Production bundle size

Tailwind's JIT compiler (on by default since v3) scans your `content` paths and generates only the utility classes that actually appear in your code. A typical production stylesheet is 5–20 kB before gzip—far smaller than a hand-rolled stylesheet that has accumulated unused rules over years of development.

The only requirement is that class names be statically detectable: write complete strings like `text-red-500`, not assembled strings like `` `text-${color}-500` ``. Dynamic lookups like that are invisible to the scanner, so the class will be missing in production.

## Summary

- Install via PostCSS; add three `@tailwind` directives to your global CSS.
- Compose utilities directly in JSX—spacing, colors, typography, borders all share the same scale.
- Prefix any utility with a breakpoint (`sm:`, `md:`, `lg:`) for responsive layouts.
- Use the `dark:` prefix with `darkMode: 'class'` for a toggleable theme.
- Use `clsx` or the `cn()` helper (`clsx` + `tailwind-merge`) for conditional and overrideable class names.
- Avoid `@apply` inside React; a component is usually the right abstraction.
