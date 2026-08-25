---
title: 'TIL: docker compose watch — Hot Reload Without Bind Mounts'
date: '2026-08-25'
image: cover.jpg
excerpt: Docker Compose v2.22 added a watch command that syncs files into containers automatically, giving you dev-server-style hot reload without the performance hit of bind mounts.
isFeatured: false
---

I've been using bind mounts for development containers for years — mounting the whole project directory into the container so file changes are reflected immediately. It works, but on macOS and Windows the host filesystem sync through Docker Desktop can be noticeably slow for large projects.

Today I learned `docker compose watch` exists, and it's a cleaner solution.

## What It Does

Added in Docker Compose v2.22 (Docker Desktop 4.24+), the `watch` command monitors your source files and reacts to changes in one of two ways:

- **`sync`** — copies changed files into the running container without rebuilding (ideal for interpreted code, static assets, config)
- **`rebuild`** — triggers a full `docker compose up --build` for that service (necessary when you change `package.json`, `go.mod`, or a `Dockerfile`)

## Config

You declare the watch rules directly in your `compose.yml` under each service:

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    develop:
      watch:
        - action: sync
          path: ./src
          target: /app/src
        - action: sync
          path: ./public
          target: /app/public
        - action: rebuild
          path: package.json
```

Then, instead of `docker compose up`, run:

```sh
docker compose watch
```

Compose starts your services and then watches for file changes in the background. Edit a file in `./src` and it syncs instantly. Touch `package.json` and Compose rebuilds just that service.

## Why It's Better Than Bind Mounts for Some Workflows

Bind mounts put your whole project directory into the container's filesystem namespace, which works but means every `node_modules` lookup, every file stat, every hot-reload check goes through the Docker-to-host filesystem bridge. On Linux this is fine (native performance), but on macOS or Windows it adds latency you can feel.

`watch` is selective. Only the files you name are synced, and they're synced as copies rather than as a live overlay. The container's filesystem (and its `node_modules` inside `/app/node_modules`) stays fully in Docker's layer — fast — and your source changes are pushed in on top when they happen.

## A Practical Note

This doesn't replace bind mounts for every case. If your dev server needs to hot-reload *from inside the container* (e.g. Vite's HMR), you still need the container process to see the file change. `sync` handles that — the file lands in the container's filesystem and the watcher inside the process sees it just like a local edit.

One thing to watch out for: `develop.watch` is a Compose-level feature, not available in standalone `docker run`. You need a `compose.yml` and Docker Desktop 4.24+ or Docker Engine with Compose v2.22+.

Quick version check:

```sh
docker compose version
# Docker Compose version v2.22.0
```

If you're on an older version, `docker compose` (not `docker-compose`) and update Docker Desktop or upgrade the Compose plugin.
