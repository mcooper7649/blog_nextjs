---
title: 'Self-Hosting RustDesk: A Private Remote Desktop Server in Under 10 Minutes'
date: '2026-06-05'
image: cover.png
excerpt: Replace TeamViewer and AnyDesk with your own RustDesk relay server — complete Docker Compose setup, firewall rules, and client configuration.
isFeatured: false
---

RustDesk is an open-source remote desktop application written in Rust. Out of the box it connects through RustDesk's public relay infrastructure — fine for getting started, but that means your screen data passes through someone else's servers. Self-hosting changes that: all traffic relays through hardware you control, nothing leaves your network without your permission, and you can drop the paid subscription entirely.

The server is two small stateless binaries you can run comfortably on the same VPS or LXC container that hosts anything else in your homelab.

## How the Server Works

RustDesk splits the server side into two roles:

- **`hbbs`** (the ID / rendezvous server) — handles peer discovery. Devices register here so they can find each other, and it coordinates the initial NAT-traversal handshake.
- **`hbbr`** (the relay server) — when a direct peer-to-peer connection fails (most NAT combinations), traffic flows through here.

Both are shipped in a single Docker image; you just pass a different command to each container.

## Port Requirements

Open these on your server's firewall before starting the containers:

| Port | Protocol | Service |
|------|----------|---------|
| 21115 | TCP | hbbs — NAT-type test |
| 21116 | TCP + UDP | hbbs — ID/rendezvous |
| 21117 | TCP | hbbr — relay traffic |
| 21118 | TCP | hbbs — WebSocket (web client only) |
| 21119 | TCP | hbbr — WebSocket (web client only) |

Ports 21118 and 21119 are only needed if you want browser-based access. The native desktop client needs only 21115–21117.

## Docker Compose Setup

Create a working directory and add a `docker-compose.yml`:

```bash
mkdir -p ~/rustdesk/data && cd ~/rustdesk
```

```yaml
services:
  hbbs:
    image: rustdesk/rustdesk-server:latest
    command: hbbs
    ports:
      - "21115:21115"
      - "21116:21116"
      - "21116:21116/udp"
      - "21118:21118"
    volumes:
      - ./data:/root
    restart: unless-stopped
    depends_on:
      - hbbr

  hbbr:
    image: rustdesk/rustdesk-server:latest
    command: hbbr
    ports:
      - "21117:21117"
      - "21119:21119"
    volumes:
      - ./data:/root
    restart: unless-stopped
```

Both services share the same `./data` volume so they read the same keypair. Bring it up:

```bash
docker compose up -d
docker compose logs -f
```

On first start, `hbbs` generates an Ed25519 keypair inside `./data/`. Watch the logs until both services print `Listening on` before configuring any clients.

## Grabbing the Public Key

Your clients need the server's public key to verify they're talking to *your* server and not a rogue relay.

```bash
cat ~/rustdesk/data/id_ed25519.pub
```

This prints a single line of base64 text — copy it. You'll paste it into each client's settings in a moment. Keep `id_ed25519` (the private key, no `.pub`) secret and backed up; losing it means all existing clients need to be re-keyed.

## Firewall Rules

If you're using `ufw`:

```bash
sudo ufw allow 21115/tcp
sudo ufw allow 21116/tcp
sudo ufw allow 21116/udp
sudo ufw allow 21117/tcp
# Only needed for browser-based access:
sudo ufw allow 21118/tcp
sudo ufw allow 21119/tcp
sudo ufw reload
```

For `firewalld` (Rocky Linux / Fedora):

```bash
sudo firewall-cmd --permanent --add-port=21115-21119/tcp
sudo firewall-cmd --permanent --add-port=21116/udp
sudo firewall-cmd --reload
```

If your server is behind a cloud provider (AWS, Hetzner, DigitalOcean), also open the same ports in the provider's security group or firewall panel — `ufw` alone isn't enough if the provider has its own layer.

## Configuring the RustDesk Client

Install the RustDesk desktop client on each machine you want to control or connect from. Then:

1. Open RustDesk → click the three-dot menu (top-right) → **Settings** → **Network**.
2. Unlock the panel if prompted.
3. Under **ID/Relay Server**, fill in:
   - **ID Server**: your server's IP address or hostname
   - **Relay Server**: same as above (can leave blank if identical to ID Server)
   - **Key**: paste the full contents of `id_ed25519.pub`
4. Click **OK**. RustDesk reconnects and registers a fresh ID against your server.

Both the machine you're controlling *from* and the remote machine need to point at the same server. On a LAN you can use the private IP; for internet access use the public IP or a DNS record you control.

## Verifying It Works

On the remote machine, note the RustDesk ID shown in the main window. On the controlling machine, type that ID into the Connect field and hit Enter. If the server is configured correctly the handshake completes in a second or two and you'll see the remote desktop.

Check relay logs if connections are slow or fail:

```bash
docker compose logs hbbr --since=5m
```

You should see `[relay] ...` lines appearing as connections negotiate. If you see nothing at all, the client is probably still hitting RustDesk's public servers — double-check the Key field was saved.

## A Note on Security

The **Key** field is the critical security control. Without it, anyone who discovers your server's IP can use your relay for free. With it, only clients that present the matching key are accepted.

Do not put these ports behind Nginx or Traefik — the RustDesk native client doesn't speak HTTP, so a reverse proxy can't terminate its connections. Direct port exposure on the server is the correct setup. If you want TLS, RustDesk Pro supports it; the open-source version does not.

## Wrapping Up

Two containers, a handful of firewall rules, a public key distributed to your clients — that's the entire setup. I run my RustDesk server on the same small VPS as my n8n instance; together they use less than 50 MB of RAM at idle. No monthly fee, no third-party relay, full control over who can connect and when.

For personal and homelab use the open-source version above covers everything. If you need centralized user management, audit logs, and a web console, RustDesk also offers a self-hosted Pro tier — but start here first and upgrade only if you actually hit a limit.
