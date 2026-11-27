---
title: 'Nginx as a Reverse Proxy with Docker: Route All Your Services Through One Port'
date: '2026-11-27'
image: cover.jpg
excerpt: Run multiple Docker containers on a single server and expose them all on port 443 with subdomain routing, Let's Encrypt SSL, and clean nginx config.
isFeatured: false
belt: green
---

If you self-host services — a blog, an n8n workflow engine, Home Assistant, Netdata, Gitea — you eventually hit a wall: each container wants its own port, and remembering `:8080`, `:5678`, `:8123` for every service is a maintenance tax. A **reverse proxy** solves this by sitting in front of all your containers, accepting every request on port 443, and routing by subdomain or path to the right service.

Nginx is the workhorse choice: lightweight, well-documented, and easy to configure in Docker Compose alongside everything else.

## What a Reverse Proxy Does

```
Browser → nginx:443 → n8n container:5678
                    → home-assistant container:8123
                    → gitea container:3000
```

Nginx terminates the TLS connection (one SSL certificate covers all subdomains with a wildcard), reads the `Host` header, and forwards the request upstream. Services never need to handle SSL themselves, and you only open ports 80 and 443 on your firewall.

## Project Structure

```
homelab/
├── docker-compose.yml
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
│       ├── n8n.conf
│       └── ha.conf
└── certbot/
    ├── conf/      # Let's Encrypt certs live here
    └── www/       # ACME challenge webroot
```

## docker-compose.yml

```yaml
version: "3.9"

services:
  nginx:
    image: nginx:stable-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - n8n
      - homeassistant

  certbot:
    image: certbot/certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    # Run manually: docker compose run certbot certonly ...

  n8n:
    image: n8nio/n8n:1.68.0
    restart: unless-stopped
    environment:
      - N8N_HOST=n8n.yourdomain.com
      - N8N_PROTOCOL=https
    volumes:
      - n8n_data:/home/node/.n8n
    # No ports: nginx is the only entry point

  homeassistant:
    image: ghcr.io/home-assistant/home-assistant:stable
    restart: unless-stopped
    network_mode: host   # HA needs host network for mDNS
    volumes:
      - ha_config:/config

volumes:
  n8n_data:
  ha_config:
```

Notice that neither n8n nor Home Assistant exposes ports — only nginx does. The services communicate over the Docker bridge network, which means nginx can reach them by container name.

## nginx.conf (base config)

```nginx
user  nginx;
worker_processes  auto;
error_log  /var/log/nginx/error.log warn;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    # Let's Encrypt challenge handler — required before certs exist
    server {
        listen 80;
        server_name _;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    include /etc/nginx/conf.d/*.conf;
}
```

The base config does two things: serves the ACME challenge directory (needed to issue and renew certs) and redirects all HTTP to HTTPS.

## Per-service config: nginx/conf.d/n8n.conf

```nginx
server {
    listen 443 ssl;
    server_name n8n.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # n8n uses WebSockets for the editor UI
    location / {
        proxy_pass         http://n8n:5678;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

The `Upgrade` / `Connection` headers enable WebSocket proxying. Without them, n8n's live editor connection will drop after the proxy read timeout.

For Home Assistant, which also uses WebSockets:

```nginx
server {
    listen 443 ssl;
    server_name ha.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    location / {
        proxy_pass         http://172.17.0.1:8123;  # host IP — HA uses host networking
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

Because Home Assistant uses `network_mode: host`, it isn't on the Docker bridge. Use `172.17.0.1` (the Docker host's bridge address, visible from every container) to reach it.

## Issuing the Certificate

There is a classic chicken-and-egg problem here: nginx fails to start if the SSL cert files referenced in `conf.d/*.conf` don't exist yet. The fix is to keep the `conf.d/` directory empty during first run, issue the cert using the HTTP server block, then add the SSL config files and reload.

```bash
# 1. Keep conf.d/ empty, start nginx (HTTP only)
docker compose up -d nginx

# 2. Issue the cert with the ACME webroot challenge
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  -d yourdomain.com \
  -d n8n.yourdomain.com \
  -d ha.yourdomain.com \
  --email you@example.com \
  --agree-tos \
  --non-interactive

# 3. Copy your per-service conf files into conf.d/ and reload
docker compose exec nginx nginx -s reload
```

Certbot writes the certificate into `./certbot/conf/`, which is bind-mounted into nginx. The reload picks up the new SSL server blocks immediately.

**Auto-renewal:** Certbot renews certs that expire within 30 days. Add a cron entry on the host:

```
0 3 * * * docker compose -f /path/to/homelab/docker-compose.yml run --rm certbot renew --quiet && docker compose -f /path/to/homelab/docker-compose.yml exec nginx nginx -s reload
```

## Rate Limiting (Optional but Recommended)

Add this in the `http {}` block of `nginx.conf` to protect login pages from brute-force:

```nginx
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
```

Then in any `location` that handles authentication (e.g., n8n's login endpoint):

```nginx
location /rest/login {
    limit_req zone=login burst=3 nodelay;
    proxy_pass http://n8n:5678;
    # ... rest of proxy config
}
```

This caps login attempts at 5 per minute per IP, with a burst allowance of 3.

## Testing the Config Before Reloading

Always validate before a live reload:

```bash
docker compose exec nginx nginx -t
# nginx: configuration file /etc/nginx/nginx.conf test is successful
docker compose exec nginx nginx -s reload
```

A failed test leaves the running config untouched, so a typo in a conf file never takes down your services.

## Wrapping Up

With nginx as the single entry point to your homelab, you get:
- **One SSL cert** covering all subdomains.
- **No ports** exposed per-service — only 80 and 443 on the firewall.
- **WebSocket support** for real-time UIs like n8n and Home Assistant.
- **Easy onboarding** for new services: add a `conf.d/newservice.conf`, reload, done.

The pattern scales to as many services as you want to run on a single VPS or home server.
