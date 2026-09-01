---
title: 'TIL: docker compose watch Syncs Code Without Restarting Containers'
date: '2026-09-01'
image: cover.jpg
excerpt: Docker Compose 2.22 added a watch mode that hot-syncs your source files into running containers — no manual volume hacks or full restarts needed.
isFeatured: false
---

I spent way too long mounting entire source trees as volumes and fighting permission issues just to get live-reload working in Docker. Turns out Compose has had a proper solution since v2.22: **`docker compose watch`**.

## What it does

`docker compose watch` monitors your local files and reacts to changes in one of two ways:

- **sync** — copies changed files into the running container instantly (no restart)
- **rebuild** — triggers a full image rebuild and container replacement when a critical file changes (like `package.json` or `go.mod`)

This gives you a workflow that feels like local development while keeping everything inside Docker.

## Minimal setup

Add a `develop.watch` block to the service in your `compose.yml`:

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
          ignore:
            - node_modules/
        - action: rebuild
          path: package.json
```

Then run:

```bash
docker compose watch
```

Compose prints a summary of the watch rules and starts streaming events as files change.

## Why this beats bind mounts

| Approach | Cross-OS perf | Works on remote Docker | Selective syncing |
|---|---|---|---|
| Bind mount (`:z`) | Slow on macOS/Windows | No | No |
| `docker compose watch` | Fast everywhere | Yes | Yes |

Bind mounts on macOS are notoriously slow because every file access crosses a VM boundary. `watch` uses a diff-and-copy approach instead, so it only pushes what changed — and it works over SSH or a remote Docker context.

## Practical tip

Pair `sync` with your framework's built-in hot-module reloader. For a Next.js app, changes to `src/` sync into the container in milliseconds and Next's HMR picks them up immediately — no page reload, no restart, no lost state.

If you run containers on a headless homelab server (as I do), `docker compose watch` over an SSH Docker context is genuinely the cleanest live-dev workflow I've found. No SSHFS, no rsync cron job — just `DOCKER_HOST=ssh://pi docker compose watch`.

> **Requires**: Docker Compose plugin v2.22+ (ships with Docker Desktop 4.24+ or standalone `docker-compose-plugin` on Linux).
