---
title: 'Docker Multi-Stage Builds: Smaller Images, Faster Deploys'
date: '2026-06-12'
image: cover.jpg
excerpt: Multi-stage builds let you compile and test inside a fat builder image, then ship only the final artifact in a tiny runtime image — the same Dockerfile, no extra scripts.
isFeatured: false
---

When I first containerized a Node.js app, the image came out at 1.4 GB. It worked, but deploying it meant pushing a gigabyte of bits every time I changed a line of code. The culprit was simple: I was building inside `node:20` and shipping the same fat image — dev dependencies, build toolchain, cached npm packages, and all.

Multi-stage builds fix this without any extra scripts or CI magic. The idea is to use multiple `FROM` instructions in one Dockerfile. Each stage can copy artifacts from a previous stage, and only the last stage ships. Everything else — compilers, test runners, node_modules for build — gets discarded automatically.

## A Minimal Node.js Example

Here is the pattern I now use for every Node service:

```dockerfile
# ── Stage 1: install & build ─────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build          # e.g. tsc, next build, vite build…


# ── Stage 2: production runtime ──────────────────────────────────────────────
FROM node:20-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

# Only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy only the compiled output from the builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

The `--from=builder` flag in the second stage is where the magic happens. Docker copies `/app/dist` out of the builder image — nothing else. TypeScript, ts-node, jest, the full `node_modules` for dev — gone. The resulting image is usually under 200 MB for a typical API server, compared to 1+ GB with a naive single-stage build.

## Why Alpine?

`node:20-alpine` is the Alpine Linux base, which clocks in around 7 MB versus ~170 MB for the Debian-based `node:20` image. I use Alpine for both stages because the build tools I need (npm, Node, shell) are already there. For stages that involve compiled native addons or glibc-specific binaries, `node:20-slim` (Debian slim) is a safer fallback — Alpine uses musl libc, which occasionally causes issues with native modules.

## A Next.js Standalone Example

Next.js has built-in support for a standalone output mode that bundles only the files needed to run the server. Paired with multi-stage builds, you get very lean images:

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci


FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build


FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Next.js standalone output bundles its own node_modules subset
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

Enable standalone mode in `next.config.js`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
}

module.exports = nextConfig
```

The standalone output copies only the minimal node_modules needed to run the server, which Next.js calculates with `nft` (Node File Trace). A medium-sized Next.js app often ends up under 300 MB — compared to 2+ GB if you just `COPY . .` into a standard image and ship it.

## Caching Layers Effectively

Docker builds each instruction as a layer and caches the result. A layer is only rebuilt when its inputs change. The single most impactful caching trick is to copy `package*.json` and run `npm ci` *before* copying the rest of your source:

```dockerfile
# Good — npm ci only reruns when package.json or package-lock.json changes
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
```

If you `COPY . .` first, changing any source file invalidates the npm install layer. On a team with frequent commits, that means your CI instance runs a full `npm ci` on every push — even when no dependency changed.

## Build Arguments and Secrets

Multi-stage builds work cleanly with `ARG` and `--secret`. A common pattern is passing a build-time token to pull from a private registry or private npm package:

```dockerfile
FROM node:20-alpine AS builder
ARG NPM_TOKEN
RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc
COPY package*.json ./
RUN npm ci
RUN rm -f .npmrc       # remove before the layer is cached to disk

COPY . .
RUN npm run build
```

Since `.npmrc` is deleted in the same `RUN` instruction that created it, it is never baked into a layer that ships. The final `runner` stage never sees the token at all because it only `COPY --from=builder`s the compiled output.

For more sensitive secrets (SSH keys, AWS credentials), use Docker's `--secret` mount instead — it doesn't persist in any layer:

```dockerfile
RUN --mount=type=secret,id=npmrc,dst=/root/.npmrc npm ci
```

## Checking Your Work

After building, check the final image size and layers:

```bash
docker build -t myapp:latest .
docker images myapp
docker history myapp:latest
```

`docker history` shows every layer and its size. If a layer is unexpectedly large, it usually means a cache wasn't invalidated where you expected, or a temp file wasn't cleaned up in the same `RUN` instruction.

For a detailed breakdown, `docker scout cves myapp:latest` (or `dive myapp:latest` if you have the `dive` tool) shows exactly which files live in each layer and flags any unused content.

---

Multi-stage builds are one of those Docker features where once you start using them, you can't imagine going back. Smaller images mean faster pushes, faster pulls, a smaller attack surface, and lower storage costs on your registry. The Dockerfile gets a bit longer, but the extra `FROM` line costs nothing at runtime — only the final stage ships.

If you're running containers in your homelab, on Fly.io, or anywhere that bills by storage or transfer, this is the first optimization worth making.
