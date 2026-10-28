---
title: 'GitHub Actions CI/CD for Your Next.js App'
date: '2026-10-28'
image: cover.jpg
excerpt: Automate linting, type checking, tests, and Vercel previews on every pull request with a practical GitHub Actions workflow.
isFeatured: false
---

Every time I pushed to a side project and thought "I'll check if it builds later," I eventually broke something in production. GitHub Actions fixed that habit for me. In this post I'll walk through a complete, practical CI/CD pipeline for a Next.js app — the same kind I now put on every project from day one.

## What we're building

A workflow that runs on every push and pull request, doing four things:

1. **Lint & format check** — catch style regressions before review
2. **Type check** — TypeScript errors fail the build before merging
3. **Unit tests** — confidence that logic still works
4. **Preview deploy** — Vercel previews so reviewers can click through the change

## Workflow basics

Workflows live in `.github/workflows/`. Each file is YAML and maps event triggers to jobs. A job is a list of steps that run sequentially on a fresh runner.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

This triggers on pushes to `main` and on any PR that targets `main`. The two `on` events are independent — a PR gets two runs: one when the branch is pushed, one when the PR is opened.

## The jobs

```yaml
jobs:
  quality:
    name: Lint, Types & Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Tests
        run: npm test -- --passWithNoTests
```

A few things worth noting here:

- `actions/checkout@v4` and `actions/setup-node@v4` are the standard first steps. Always pin to a major version tag so you get patch fixes automatically but aren't surprised by breaking changes.
- `cache: 'npm'` on the setup-node action caches `~/.npm` (the global npm cache) keyed to `package-lock.json`. This alone cuts install time from ~60s to ~10s on a warm cache.
- `npm ci` instead of `npm install` — it respects the lockfile exactly and errors if the lockfile is out of date. It's the right command for CI.
- `--passWithNoTests` lets the pipeline succeed on a fresh project with zero test files. Remove it once you actually have tests.

## Type checking isn't the same as building

One mistake I made early: relying on `npm run build` to catch type errors. The Next.js build pipeline does run TypeScript, but it skips some checks to stay fast. Running `tsc --noEmit` directly is stricter and faster for CI since it produces no output files.

If you use path aliases in `tsconfig.json`, make sure `paths` are defined there and not only in `next.config.js` — `tsc` doesn't know about Next.js's alias resolution.

## Caching goes further with actions/cache

For monorepos or large install graphs, you may want more control than `cache: 'npm'` gives you:

```yaml
- name: Cache node_modules
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
```

The `restore-keys` fallback lets you use a stale cache when the lockfile changed (say, you added one package). A stale hit is still faster than a cold install.

## Secrets and environment variables

For deployment or any service that requires a key, add it in **Settings → Secrets and variables → Actions** in your GitHub repo. Then reference it in the workflow:

```yaml
env:
  NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
```

Never hardcode secrets or commit `.env` files. If you accidentally commit one, rotate the key immediately — git history is public and bots scrape it.

## Preview deploys with Vercel

If you deploy to Vercel, the [Vercel GitHub App](https://vercel.com/docs/deployments/git) creates preview deployments automatically for every push to a PR branch with zero workflow YAML needed — it hooks in at the GitHub deployment API level. The preview URL appears as a status check on the PR.

If you need to trigger a deploy from a workflow (e.g. a staging environment outside Vercel), use the Vercel CLI:

```yaml
- name: Deploy preview
  run: npx vercel --token ${{ secrets.VERCEL_TOKEN }} --yes
  env:
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Putting it all together

Here's the complete `ci.yml` I reach for as a starting point:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    name: Lint, Types & Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Tests
        run: npm test -- --passWithNoTests

      - name: Build
        run: npm run build
```

I add the final build step so a green CI badge actually means the project builds, not just that the linter is happy. It costs another 30–60 seconds per run but has saved me from silent build failures more than once.

## Branch protection

CI is most valuable when you enforce it. Go to **Settings → Branches → Add rule**, target `main`, and check **Require status checks to pass before merging**, then select the `quality` job. Now you physically can't merge a PR with failing checks, which removes the "I'll fix it after" temptation entirely.

Once this is in place, `main` is always green, and you can deploy from it with confidence any time.
