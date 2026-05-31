---
title: 'Self-Hosting a Homelab with Docker Compose'
date: '2026-05-31'
image: cover.png
excerpt: How I run my entire homelab from a single, version-controlled Docker Compose file — with healthchecks, named volumes, and backups that I never have to think about.
isFeatured: true
---

Everything in my homelab runs in Docker, and the whole thing is described by a handful of `docker-compose.yml` files I keep in a private Git repo. That one decision — treating my infrastructure as code instead of a pile of hand-installed packages — is the single biggest reason the lab has stayed reliable. When a disk dies or I rebuild a host, I'm back online in minutes because the *definition* of the stack lives in version control, not in my head.

In this post I'll walk through the patterns I actually use: a real Compose file, healthchecks that keep things honest, named volumes for persistence, and a backup approach that runs itself.

## Why Compose instead of `docker run`

You *can* start a container with a long `docker run` command. The problem is that the command is ephemeral — six months later you won't remember the exact flags, ports, and env vars you used. Compose turns all of that into a declarative file you can read, diff, and roll back.

A small, real example: Postgres plus a lightweight admin UI.

```yaml
services:
  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: app
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U app -d app']
      interval: 10s
      timeout: 5s
      retries: 5

  adminer:
    image: adminer:4
    restart: unless-stopped
    ports:
      - '8080:8080'
    depends_on:
      db:
        condition: service_healthy

volumes:
  db_data:
```

A few things I want to call out, because they're the parts people skip:

- **`restart: unless-stopped`** means the container comes back after a reboot or a crash, but stays down if I deliberately stopped it. It's the sane default for a homelab.
- **The named volume `db_data`** is where the actual database lives. Containers are disposable; the volume is not. I can `docker compose down`, pull a new image, and `up` again without losing a row.
- **The healthcheck** makes `depends_on ... condition: service_healthy` meaningful. Adminer won't start hammering Postgres until `pg_isready` actually succeeds, which avoids a noisy race on cold boot.

## Keep secrets out of the file

Notice `${DB_PASSWORD}` above. Compose reads variables from a `.env` file sitting next to the Compose file:

```bash
# .env  — never committed
DB_PASSWORD=correct-horse-battery-staple
```

I commit the `docker-compose.yml` and a `.env.example` with placeholder values, but the real `.env` is gitignored. That way the repo is safe to clone and nothing sensitive ever lands in history.

## Running it

The commands I use day to day are boring, which is exactly what you want from infrastructure:

```bash
# start everything in the background
docker compose up -d

# see what's running and whether healthchecks pass
docker compose ps

# tail logs for one service
docker compose logs -f db

# pull newer images and recreate changed containers
docker compose pull && docker compose up -d
```

That `pull && up -d` line is my entire update routine. Compose only recreates containers whose image actually changed, so updates are fast and low-drama.

## Backups that run themselves

A homelab without backups is just a countdown. For Postgres I run a nightly `pg_dump` straight into the same volume layout, then sync the dump offsite. The trick is to exec into the *already running* container so you don't need a second Postgres install:

```bash
#!/usr/bin/env bash
set -euo pipefail
stamp=$(date -u +%F)
docker compose exec -T db \
  pg_dump -U app -d app | gzip > "/srv/backups/app-${stamp}.sql.gz"

# keep the last 14 days, delete the rest
find /srv/backups -name 'app-*.sql.gz' -mtime +14 -delete
```

Drop that in `/etc/cron.daily` (or a systemd timer) and you have point-in-time recovery you never have to remember to run. I test a restore every few months by piping a dump into a throwaway container — an untested backup isn't a backup.

## What this buys you

The payoff is repeatability. My hosts are essentially cattle: a fresh Debian install, Docker, `git clone`, drop in the `.env`, and `docker compose up -d`. Everything that makes the machine *mine* is in those files. Adding a new service is a pull request to myself; removing one is deleting a block of YAML.

If you're starting your own lab, resist the urge to install things directly on the host. Put it in Compose, commit it, give it a healthcheck and a named volume, and let your future self thank you the next time hardware fails.
