# Content Log

| Date | Type | Summary |
|------|------|---------|
| 2026-05-30 | chore(seo) | Add dynamic sitemap.xml page and robots.txt |
| 2026-05-30 | chore(seo) | Add per-post OpenGraph and Twitter Card meta tags to post detail page |
| 2026-05-31 | docs | Replace generic create-next-app README with real project documentation |
| 2026-05-31 | post | New post "Self-Hosting a Homelab with Docker Compose" — declarative Compose patterns, healthchecks, named volumes, and self-running pg_dump backups. |
| 2026-05-31 | post | New post "Automating My Homelab with n8n" — self-hosted n8n in Docker, a webhook→Code node→notify workflow with accurate Code node API, and why it beats cron scripts. |
| 2026-05-31 | chore | bump Node engines to 22.x to unblock Vercel deploys |
| 2026-06-01 | post | New post "TypeScript in React: Practical Typing Patterns That Actually Help" — typed props, useState generics, event handler types, API responses, and generic custom hooks. |
| 2026-06-02 | chore(seo) | Add RSS 2.0 feed at /feed.xml with XML escaping, RFC 822 dates, atom:link self-ref, auto-discovery <link> in _app.js, and robots.txt reference. |
| 2026-06-03 | post | New post "Next.js App Router: What Changed and Why It Matters" — RSC default, file conventions, layouts, use client directive, Route Handlers vs API routes. |
| 2026-06-04 | chore(seo) | Fix duplicate viewport meta, replace fragile third-party OG image with self-hosted URL, fix apostrophe typo, improve home page title/description and canonical link, remove stale og:publish_date and unused Hero import. |
| 2026-06-05 | post | New post "Self-Hosting RustDesk: A Private Remote Desktop Server in Under 10 Minutes" — hbbs/hbbr Docker Compose setup, port table, public key extraction, ufw/firewalld rules, client config, and security notes. |
| 2026-06-06 | refactor(post) | Expand thin "Postgres Notes" stub into full "PostgreSQL for Node.js Developers" guide — Docker quickstart, CREATE/INSERT/SELECT/JOIN patterns, indexes, partial indexes, EXPLAIN ANALYZE, transactions, postgres npm package with parameterized queries, and sql.begin() transactions. |
| 2026-06-07 | refactor(post) | Expand stub "Mastering JavaScript" (23 lines, syntax error) into practical modern-JS reference — scoping, arrow functions, destructuring, template literals, map/filter/reduce, spread/rest, async/await with Promise.all, optional chaining, nullish coalescing, and ES modules. |
| 2026-06-08 | post | New post "Running Home Assistant in Docker: From Zero to Your First Automation" — Container mode Compose setup, host networking for mDNS, config layout, two real automations (presence-based lights, open-door alert with debounce), and keeping config in Git. |
| 2026-06-09 | chore(seo) | Add JSON-LD structured data (Schema.org BlogPosting on post pages, WebSite on home page) to improve Google rich-result eligibility and author attribution. |
| 2026-06-10 | post | New post "TanStack Query v5: Stop Managing Server State by Hand" — useQuery, useMutation, query invalidation, staleTime/gcTime/enabled config, and DevTools. |
| 2026-06-11 | feat(ux) | Add reading-time estimate (word count ÷ 200 wpm) to post cards and post header |
| 2026-06-12 | post | New post "useCallback and useMemo: When They Actually Help" — referential equality, stabilizing fn refs for useEffect deps and React.memo children, memoizing expensive computations, and when NOT to bother. |
| 2026-06-12 | fix(images) | Backfill 7 relevant AI cover illustrations (gpt-image-1) replacing gradient/missing covers; add scripts/gen-cover.mjs so future posts get real covers. |
| 2026-06-12 | post | New post "Docker Multi-Stage Builds: Smaller Images, Faster Deploys" — builder/runner pattern, Alpine bases, Next.js standalone output, layer caching tricks, and build-arg secret hygiene. |
| 2026-06-21 | refactor(post) | Expand thin "Bootstrap Framework" stub (34 lines, alpha install, typo) into full Bootstrap 5 React guide — grid, breakpoints table, utility classes, components, icons; fix broken inline image in react-helmet post (Flutter-main.png → react-helmet-main.png). |
| 2026-09-14 | post | New post "Zod: Stop Trusting Your API Responses at Runtime" — runtime schema validation, type inference with z.infer, API response parsing, env var validation, and Zod + React Hook Form. |
| 2026-09-22 | post | New TIL post "Object.groupBy() — JavaScript Finally Has a Native Group By" — ES2024 Object.groupBy and Map.groupBy, null-prototype result, React grouped-list example, and browser/Node support. |
| 2026-06-15 | post | New post "Building a REST API with Node.js, Express, and PostgreSQL" |
| 2026-06-20 | chore(perf) | Compress 17 oversized PNG images, saving about 7 MB |
| 2026-06-22 | post | New post "Kotlin + Jetpack Compose: Build Your First Android Screen Without XML" |
| 2026-06-27 | refactor(post) | Expand "MUI v5+: Styling with the sx Prop, styled(), and Custom Themes" |
| 2026-09-01 | post | New post "TIL: docker compose watch Syncs Code Without Restarting Containers" |
| 2026-09-10 | post | New post "TIL: Use React's key Prop to Reset Component State" |
| 2026-09-17 | post | New post "TIL: useDeferredValue — React's Built-in Way to Defer Expensive Renders" |
| 2026-09-23 | post | New post "Kotlin Coroutines: Async Android Without Callback Hell" |
| 2026-09-30 | post | New post "React Context + useReducer: Lightweight State Management Without Redux" |
| 2026-10-01 | chore(seo) | Add canonical, Open Graph and Twitter tags to /posts and /contact |
| 2026-10-10 | refactor(post) | Expand "Flutter Introduction" |
| 2026-10-12 | post | New post "Prisma ORM: Type-Safe Database Queries for Node.js" |
| 2026-10-14 | post | New post "Testing React with Vitest and React Testing Library" |
| 2026-10-15 | post | New post "TIL: TypeScript's satisfies Operator" |
| 2026-10-16 | post | New post "Zustand: Simple Global State Without the Boilerplate" |
| 2026-10-18 | refactor(post) | Expand "Webpack 5 and Module Bundling: A Practical Guide" |
| 2026-10-19 | post | New post "Next.js Server Actions: Forms Without the API Boilerplate" |
| 2026-10-21 | post | New post "Building a Type-Safe REST API with Express and TypeScript" |
| 2026-10-22 | post | New post "TIL: Promise.withResolvers() — A Cleaner Deferred Pattern" |
| 2026-10-23 | post | New post "React 19: The New APIs Worth Using Right Now" |
| 2026-10-24 | refactor(post) | Expand "SEO in React: Dynamic Meta Tags with react-helmet-async" |
| 2026-10-26 | post | New post "useReducer: Managing Complex State in React" |
| 2026-10-27 | post | New post "TIL: structuredClone() — JavaScript Has a Native Deep Clone" |
| 2026-10-28 | post | New post "GitHub Actions CI/CD for Your Next.js App" |
| 2026-10-29 | post | New post "TIL: toSorted(), toReversed(), toSpliced(), with() — Mutate-Free Array Methods" |
| 2026-10-30 | post | New post "Core Web Vitals in Next.js: Measuring and Fixing What Actually Matters" |
| 2026-11-01 | refactor(post) | Expand "REST APIs: A Practical Guide for Web Developers" |
| 2026-11-02 | post | New post "TypeScript Utility Types: The Ones You Will Actually Use" |
| 2026-11-03 | feat(ux) | Add an on-brand custom 404 page |
| 2026-11-04 | post | New post "Custom React Hooks: Extract, Reuse, and Actually Test Them" |
| 2026-11-04 | fix(images) | Replace covers on three older posts that shared an image with another post |
