---
title: 'Next.js Middleware: Auth Guards, Redirects, and Edge Logic'
date: '2026-11-09'
image: cover.jpg
excerpt: Middleware runs before every matched request at the Edge, making it the right place for auth gating, locale detection, and fast redirects without touching your page code.
isFeatured: false
belt: green
coverPending: true
coverPrompt: 'A tollbooth painted vermilion on a wide highway at dawn, with a row of vehicles waiting to pass through the gate before the open road beyond'
---

Next.js **middleware** is a single file — `middleware.ts` at the project root — that runs on every matched request before it reaches a page, API route, or static asset. It executes on the **Edge Runtime**, meaning it starts up nearly instantly, runs close to the user, and completes in milliseconds before Next.js decides what to serve.

That placement makes it the right tool for a narrow class of problems: decisions that need to happen on every request before the page renders, without spinning up a full Node.js environment. Auth gating, locale redirects, A/B test cookie assignment, and bot-blocking all fit naturally here. Business logic, database queries, and anything that imports large Node.js modules do not.

## The File and the Matcher

Create `middleware.ts` (or `.js`) at the root of your project, alongside `app/` or `pages/`.

```ts
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return NextResponse.next(); // pass through, do nothing
}
```

By default, middleware runs on every route. That is almost never what you want. Use the `config` export to restrict it:

```ts
export const config = {
  matcher: ['/dashboard/:path*', '/account/:path*'],
};
```

The matcher accepts an array of glob-style path patterns. Next.js skips middleware entirely for paths that do not match, so keep it targeted — there is no point checking an auth cookie on `/_next/static` assets.

## Auth Gating

The most common use case: redirect unauthenticated users away from protected routes. Here the session lives in a signed cookie called `token`.

```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

A few things to notice:

- `request.cookies` is a `RequestCookies` object — call `.get('name')?.value` to read a cookie.
- `NextResponse.redirect(url)` returns a `307 Temporary Redirect` by default. Pass `{ status: 308 }` for a permanent redirect.
- Appending `?from=` to the login URL lets the login page redirect back after a successful sign-in — a standard UX pattern.
- **This only checks that the cookie exists**, not that it is a valid JWT. Edge Runtime cannot run most Node.js crypto libraries. For real signature verification, use the Web Crypto API (`crypto.subtle`) which is available on the Edge, or lean on a lightweight library like `jose` that is built for it.

### Verifying a JWT at the Edge with `jose`

```ts
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    // token is missing, expired, or tampered
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.cookies.delete('token'); // clear the bad cookie
    return res;
  }
}
```

`jose` is a pure-JavaScript JOSE implementation that works on any JavaScript runtime. It tree-shakes well and adds minimal weight to the Edge bundle.

## Locale Detection and Redirects

If you are building a multi-locale site without Next.js's built-in `i18n` config (or if you are on the App Router where that config is removed), middleware is the natural place to detect a preferred locale and redirect.

```ts
const SUPPORTED_LOCALES = ['en', 'es', 'fr'];
const DEFAULT_LOCALE = 'en';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip if the path already has a locale prefix
  const hasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  if (hasLocale) return NextResponse.next();

  // Parse Accept-Language header
  const acceptLanguage = request.headers.get('accept-language') ?? '';
  const preferred = acceptLanguage.split(',')[0]?.split('-')[0] ?? DEFAULT_LOCALE;
  const locale = SUPPORTED_LOCALES.includes(preferred) ? preferred : DEFAULT_LOCALE;

  return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
}
```

## Rewriting vs Redirecting

- **`NextResponse.redirect(url)`** — sends a `3xx` response back to the browser. The URL in the browser's address bar changes. Use for auth redirects and permanent URL migrations.
- **`NextResponse.rewrite(url)`** — serves a *different* URL internally but keeps the original URL in the address bar. Use for A/B testing, feature flags, or serving content from `/v2/page` while the user sees `/page`.

```ts
export function middleware(request: NextRequest) {
  const bucket = request.cookies.get('ab-bucket')?.value;

  if (bucket === 'b') {
    return NextResponse.rewrite(new URL('/landing-v2', request.url));
  }

  return NextResponse.next();
}
```

## Modifying Request and Response Headers

Middleware can add or modify headers before passing the request on. This is useful for forwarding user identity to server components or API routes without re-reading the cookie.

```ts
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', getUserIdFromCookie(request));

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}
```

Inside a Route Handler or Server Component you can then read `headers().get('x-user-id')` from `next/headers`, which avoids verifying the JWT a second time.

## Edge Runtime Constraints

Middleware runs on the Edge, which means:

| Available | Not available |
|---|---|
| `fetch` | Node.js built-ins (`fs`, `path`, `crypto`) |
| Web Crypto API (`crypto.subtle`) | Most npm packages that import Node.js internals |
| `Headers`, `Request`, `Response` | Full ORM clients (Prisma, Drizzle) |
| Cookies, URL | `child_process`, `net` |

If you try to import something that uses Node.js internals, the build will fail with an error like `Module not found: Can't resolve 'node:crypto'`. Either find an Edge-compatible alternative or move that logic into a Route Handler or Server Component that runs in the full Node.js runtime.

## Keeping Middleware Small

Middleware runs on every matched request, so its bundle size matters. Next.js caps the Edge middleware bundle at **1 MB** (compressed). Import only what you need, check that your dependencies do not silently pull in heavy transitive packages, and profile with `next build --debug` if the bundle warning appears.

The rule of thumb: if you are doing more than reading a cookie, calling one lightweight utility, and returning a redirect or `next()` — you are probably solving the problem in the wrong layer. Move heavier logic into the page, a Server Component, or an API route and let middleware stay thin.

---

Middleware is a sharp tool with a small footprint: auth gating, locale redirection, and header injection are where it earns its place. Keep it focused, keep it fast, and your Next.js app gets a low-latency security and routing layer that runs before the page ever loads.
