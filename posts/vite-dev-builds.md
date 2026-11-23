---
title: 'Vite: A Dev Server That Does Not Keep You Waiting'
date: '2026-11-23'
image: cover.jpg
excerpt: Replace CRA or a webpack-based setup with Vite for near-instant dev starts, fast HMR, and a Rollup-powered production build — no ejecting required.
isFeatured: false
belt: green
---

Create React App shipped in 2016 and taught a generation of developers to reach for `npx create-react-app`. Its time has passed. The repo is in maintenance mode, its webpack bundle takes seconds to cold-start even on fast machines, and each HMR reload sends megabytes of re-bundled code to the browser. **Vite** solves all three problems with a different architectural bet: skip bundling in development entirely.

## How Vite Is Different

A traditional webpack dev server bundles your entire application before serving a single file. As your project grows, that upfront work grows with it.

Vite skips that step. It serves source files directly as native ES modules and lets the browser ask for each import on demand. Only the modules the browser requests get transformed — which means startup time stays flat no matter how many files the project has. When you edit a file, Vite invalidates just that module and its narrow set of dependents, so hot module replacement lands in milliseconds instead of seconds.

For production, Vite hands off to **Rollup**, which produces small, well-code-split bundles. You get the best of both worlds: a lightning fast development loop and an optimized shipping artifact.

## Starting a New Project

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm run dev
```

The `--template` flag accepts `react`, `react-ts`, `vue`, `svelte`, and several others. The resulting scaffold is minimal — no hidden config, no ejecting ever needed.

## Config Basics

The config lives in `vite.config.ts` at the project root:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

`defineConfig` is just a typed identity function — it gives you autocompletion without committing you to any specific shape. The React plugin wires up JSX transforms and Fast Refresh (Vite's HMR for React components).

### Path Aliases

Relative imports like `../../../components/Button` get messy fast. Register an alias once:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Add a matching path in `tsconfig.json` so TypeScript knows about it too:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Now `import Button from '@/components/Button'` works anywhere in the project.

## Environment Variables

Vite reads `.env` files and exposes variables that start with `VITE_` to your code. Variables without that prefix are intentionally hidden from the browser bundle.

```
# .env.local
VITE_API_URL=http://localhost:3001
```

Access them through `import.meta.env`:

```ts
const BASE = import.meta.env.VITE_API_URL
```

TypeScript will warn about unknown keys by default. Add a `src/vite-env.d.ts` (the scaffold creates this for you) and extend the `ImportMetaEnv` interface to get proper types:

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}
```

## Migrating from CRA

If you have an existing CRA project the migration is mostly mechanical. The major differences:

| CRA | Vite |
|-----|------|
| `process.env.REACT_APP_FOO` | `import.meta.env.VITE_FOO` |
| `index.html` inside `public/` | `index.html` at the **project root** |
| `%PUBLIC_URL%` in HTML | Not needed — just use `/` paths |
| `react-scripts start` | `vite` |
| `react-scripts build` | `vite build` |
| `react-scripts test` | Use Vitest or Jest directly |

Steps:
1. Install Vite and the React plugin: `npm install -D vite @vitejs/plugin-react`
2. Create `vite.config.ts` with the React plugin.
3. Move `index.html` from `public/` to the project root and change `%PUBLIC_URL%` to `/`.
4. Add `<script type="module" src="/src/index.tsx"></script>` to `index.html`.
5. Add a `src/vite-env.d.ts` reference triple-slash directive.
6. Rename all `REACT_APP_` env vars to `VITE_` and update references to use `import.meta.env`.
7. Remove `react-scripts` from `package.json` and update the `scripts` block.

## Building for Production

```bash
npm run build      # outputs to dist/
npm run preview    # locally preview the production build
```

`vite build` runs Rollup under the hood and produces a `dist/` folder with hashed asset filenames, code-split chunks, and tree-shaken output. `vite preview` serves that folder locally so you can verify the production artifact before deploying — a step CRA never offered.

## When You Still Need webpack

Vite covers the vast majority of React projects. A few cases still reach for webpack:

- **Very old browsers** that need polyfilled module loading (though `@vitejs/plugin-legacy` covers most of these)
- **Module federation** for micro-frontend architectures (the `vite-plugin-federation` community plugin exists but webpack's support is more mature)
- **Custom loaders** deeply tied to webpack's specific loader API

For anything else — single-page apps, component libraries, Next.js alternatives, monorepo packages — Vite is the right default today.

## Summary

Vite replaces the bundle-on-startup model with on-demand ES module serving, cutting cold-start times from several seconds to under a second for most projects. The config is minimal, path aliases are trivial to wire up, and env vars follow a clear naming convention. If you are still running `react-scripts`, the migration checklist above will get you there in an afternoon.
