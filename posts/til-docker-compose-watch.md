---
title: 'TIL: docker compose watch Syncs Code Without Restarting Containers'
date: '2026-09-01'
image: cover.jpg
excerpt: Docker Compose 2.22 added a watch mode that hot-syncs your source files into running containers — no manual volume hacks or full restarts needed.
isFeatured: false
belt: yellow
---

Getting live-reload working in Docker often means mounting entire source trees as volumes and fighting permission issues. Compose has had a proper alternative since v2.22: **`docker compose watch`**.

## What it does

`docker compose watch` monitors your local files and reacts to changes with one of these actions:

- **sync** — copies changed files into the running container (no restart)
- **sync+restart** — copies the files, then restarts the container (handy for config files)
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
| Bind mount | Can be slow on macOS/Windows | No | No |
| `docker compose watch` | Native file access | Yes | Yes |

Bind mounts on macOS and Windows can be slow because file access crosses a VM boundary. `watch` copies changed files into the container instead, so it only pushes what changed — and it works with a remote Docker context. The container's user needs write access to the `target` path.

## Practical tip

Pair `sync` with your framework's built-in hot-module reloader. For a Next.js app, changes to `src/` sync into the container and Next's dev server picks them up through HMR, with no container restart.

If you run containers on a headless homelab server, this also works over an SSH Docker context, with no SSHFS or rsync job: `DOCKER_HOST=ssh://user@server docker compose watch`.

> **Requires**: Docker Compose plugin v2.22+ (ships with Docker Desktop 4.24+ or standalone `docker-compose-plugin` on Linux).
