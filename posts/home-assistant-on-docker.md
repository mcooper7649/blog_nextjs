---
title: 'Running Home Assistant in Docker: From Zero to Your First Automation'
date: '2026-06-08'
image: cover.png
excerpt: How I run Home Assistant in a single Docker container, keep the config in Git, and build automations that actually make life easier.
isFeatured: false
---

Home Assistant is the kind of project that sounds like a weekend toy until you've lived with it for a month. Now it controls my lights, monitors my NAS disk temps, sends me alerts when a door is left open, and does a dozen other things I've completely stopped thinking about. The best part: it runs on a $35 Raspberry Pi (or a VM, or a plain Docker container), and every bit of the config is plain YAML I keep in version control.

In this post I'll show you the exact Docker Compose setup I use, explain the config file layout, and walk through two real automations so you can see how the pieces fit together.

## Why Docker Container mode

Home Assistant ships in four flavors: **Home Assistant OS** (full VM image), **Supervised** (OS-managed), **Container** (a single Docker image), and **Core** (bare Python). I use Container mode because it integrates cleanly into my existing Docker Compose homelab — same tooling, same restart policies, same backup approach as everything else I run.

The trade-off is that add-ons (HA's curated app store) don't work in Container mode. In practice I've never needed them: anything an add-on provides I can spin up as its own service in the same Compose file.

## The Compose file

```yaml
services:
  homeassistant:
    image: ghcr.io/home-assistant/home-assistant:stable
    container_name: homeassistant
    restart: unless-stopped
    network_mode: host
    environment:
      - TZ=America/New_York
    volumes:
      - ./ha-config:/config
    privileged: true
```

A few things worth calling out:

**`network_mode: host`** is the single most important line. Home Assistant uses mDNS and SSDP to discover devices on your local network. With bridge networking, those multicast packets never reach the container. Host mode sidesteps the problem entirely.

**`privileged: true`** is only required if you're passing through USB devices (Zigbee sticks, Z-Wave adapters, etc.). If you're purely using Wi-Fi or cloud integrations you can drop it and use `devices:` entries instead for a narrower surface.

**`./ha-config:/config`** mounts a local directory as the config root. This is where all YAML files, the SQLite database, and logs live. Keeping it on the host means I can `git init` it, back it up with rsync, or snapshot it before upgrades.

Bring it up:

```bash
docker compose up -d
```

Then browse to `http://<host-ip>:8123`. The onboarding wizard walks you through creating your admin account and detecting devices — it's genuinely good.

## Config file layout

After onboarding, `ha-config/` will contain:

```
ha-config/
├── configuration.yaml   # main entry point
├── automations.yaml     # automations list (HA manages this)
├── scripts.yaml         # scripts
├── scenes.yaml          # scenes
├── .storage/            # entity registry, device registry, UI state
└── home-assistant.log
```

`configuration.yaml` starts nearly empty. Over time you add integrations and customizations here. For example, to enable the history graph and set your home coordinates:

```yaml
homeassistant:
  name: Home
  latitude: 40.7128
  longitude: -74.0060
  unit_system: imperial
  time_zone: America/New_York

history:

recorder:
  purge_keep_days: 30
```

Most integrations are configured through the UI these days (`Settings → Devices & Services → Add Integration`), not in YAML. I only drop to YAML for things the UI doesn't expose.

## A real automation: lights off when everyone leaves

Automations live in `automations.yaml` and have a dead-simple structure: a **trigger** fires the automation, optional **conditions** gate it, and **actions** do the work.

```yaml
- id: "lights_off_on_away"
  alias: "Turn off all lights when everyone leaves"
  trigger:
    - platform: state
      entity_id: group.all_people
      to: "not_home"
  action:
    - service: light.turn_off
      target:
        area_id: all
```

`group.all_people` is a person group I created under `Settings → People`. When everyone transitions to `not_home`, every light turns off. No cron, no script, no cloud subscription.

## A real automation: alert if a door is left open

This one uses a **time** trigger and a **state condition** together:

```yaml
- id: "front_door_left_open"
  alias: "Alert if front door open for 5 minutes"
  trigger:
    - platform: state
      entity_id: binary_sensor.front_door_contact
      to: "on"
      for:
        minutes: 5
  action:
    - service: notify.mobile_app_my_phone
      data:
        title: "Door Alert"
        message: "Front door has been open for 5 minutes."
```

The `for:` key on a state trigger is the cleanest way to add a debounce — the trigger only fires if the door has been open continuously for five minutes. No timer entity needed, no extra condition.

## Keeping config in Git

Because everything under `ha-config/` is plain files, version control is trivial:

```bash
cd ha-config
git init
echo ".storage/" >> .gitignore   # internal HA state, not useful to track
echo "home-assistant.log" >> .gitignore
echo "*.db" >> .gitignore
git add .
git commit -m "initial HA config"
```

Now I can diff every automation change, roll back a bad edit, and see exactly when I introduced a regression. Upgrades become low-stakes: tag the current commit, pull the new image, bring it up, and if anything breaks I still have a clean rollback path.

## What's next

I've been slowly wiring in more sensors: a Zigbee motion sensor in the garage (via a Sonoff Zigbee 3.0 USB dongle passed through with `devices:`), a template sensor that derives "is anyone watching TV" from the TV's power draw, and a few REST sensors polling my NAS API. Each one follows the same pattern — add the integration, watch the entity appear in the UI, write a simple automation against it.

That's the thing about Home Assistant. The initial setup takes an afternoon. Then you keep finding one more thing to automate.
