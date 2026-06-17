---
title: 'GitHub Actions CI/CD: Automate Tests, Lint, and Deploy for Your Next.js App'
date: '2026-06-17'
image: cover.jpg
excerpt: Set up a GitHub Actions workflow that runs your linter and tests on every push, blocks bad PRs automatically, and lets Vercel handle the deploy — zero manual steps from commit to production.
isFeatured: false
---

For a long time I manually pushed to `main` and watched Vercel's deploy log with one eye while doing something else. It worked until it didn't — a forgotten `console.log`, a type error I missed, a lint failure I'd have caught immediately if I'd run the linter locally. GitHub Actions fixed all of that with a file I can copy between projects in two minutes.

Here's exactly how I set it up for a Next.js app.

## What We're Building

A two-workflow setup:

1. **CI** — runs on every push and pull request: installs deps, lints, type-checks, and runs tests. If any step fails, the PR is blocked.
2. **Deploy** — Vercel handles this automatically once the CI workflow passes, so we just need to make sure nothing broken ever reaches `main`.

## Prerequisites

- Next.js project in a GitHub repo
- `eslint` configured (Next.js ships this by default)
- TypeScript (optional but recommended — add `tsc --noEmit` for free type checking)
- Any test runner (Jest, Vitest — even none; the pattern is the same)

## The CI Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-typecheck-test:
    name: Lint, type-check, and test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type-check
        run: npx tsc --noEmit

      - name: Test
        run: npm test -- --passWithNoTests
```

A few things worth noting:

**`actions/checkout@v4`** — always pin to a major version tag. Using `@main` would pull whatever the action author pushes, including breaking changes.

**`cache: npm`** — caches `~/.npm` based on `package-lock.json`. First run is cold; every subsequent run skips the network download. On a medium-size project this saves 30–60 seconds per run.

**`npm ci` instead of `npm install`** — `ci` does a clean install from the lockfile and fails if the lockfile is out of sync with `package.json`. This catches the "works on my machine" problem where a developer has a slightly different package installed locally.

**`--passWithNoTests`** — if you haven't written tests yet, this lets the job succeed instead of failing because there's nothing to run. Remove it once you have real tests.

## Enforcing the Check on PRs

Go to **Settings → Branches → Add rule** for `main`:

- Enable **"Require status checks to pass before merging"**
- Search for and add **"Lint, type-check, and test"** (the `name:` field from the `jobs` key)
- Enable **"Require branches to be up to date before merging"**

Now `main` is protected. Merging a PR with a lint error or failing test is physically impossible without a repo admin override.

## Caching Node Modules (Faster Runs)

The `cache: npm` option in `setup-node` handles most cases, but if your install is still slow you can cache `node_modules` directly:

```yaml
      - name: Cache node_modules
        uses: actions/cache@v4
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-
```

Put this step *before* `npm ci`. If the cache hits (same lockfile hash), `npm ci` sees `node_modules` already populated and runs in a few seconds instead of a minute.

## Checking Next.js Build

If you want to catch build errors — not just lint errors — add a build step:

```yaml
      - name: Build
        run: npm run build
        env:
          # Stub any required env vars so the build doesn't fail on missing values
          NEXT_PUBLIC_API_URL: https://example.com
```

Be careful with secrets here: any env var you inject is visible in the build log unless you load it from GitHub Secrets. For variables that aren't sensitive you can hardcode a dummy value like above. For real secrets, use `${{ secrets.MY_SECRET }}`.

## Secrets and Environment Variables

Actual API keys and tokens live in **Settings → Secrets and variables → Actions**. Reference them in your workflow like this:

```yaml
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

They're masked in logs automatically — GitHub replaces their value with `***`.

## The Deploy Side

Since this blog auto-deploys via Vercel, I don't need a separate deploy workflow. Vercel's GitHub integration watches `main` and triggers a production deploy when a push lands. The CI workflow above acts as the gate: the PR can't merge until CI passes, and the merge to `main` is what triggers the Vercel deploy.

If you're deploying somewhere else (Netlify, Fly.io, a VPS), you'd add a second job that runs `if: github.ref == 'refs/heads/main'` and only fires on direct pushes to `main` after CI passes.

## The Result

Every PR now gets a status check automatically. A green checkmark means: dependencies install cleanly, the linter is happy, TypeScript found no errors, and all tests pass. I can review the diff without also mentally re-running the linter in my head — the machine already did that.

The whole setup is one YAML file and two minutes of branch protection config. It's the cheapest reliability improvement I've made to any project.
