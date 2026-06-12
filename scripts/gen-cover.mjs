#!/usr/bin/env node
// Generate a relevant AI cover illustration for a blog post using OpenAI gpt-image-1.
// Saves a PNG to public/images/posts/<slug>/<out> (default cover.png), sized for social/OG cards.
//
// Usage:
//   OPENAI_API_KEY=sk-... node scripts/gen-cover.mjs <slug> --prompt "<concept>" [--out cover.png] [--quality medium]
//
// No browser, no extra npm deps — uses Node 18+ global fetch. The model output is base64 PNG.
// A fixed house style is appended so every cover is on-brand and consistent; we explicitly forbid
// text/words because diffusion models render garbled lettering.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const args = process.argv.slice(2);
const slug = args[0];
const get = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
if (!slug || slug.startsWith('--')) { console.error('first arg must be the post slug'); process.exit(1); }

const concept = get('prompt', null);
const out = get('out', 'cover.jpg');
const quality = get('quality', 'medium'); // low | medium | high
if (!concept) { console.error('--prompt "<concept>" is required'); process.exit(1); }
const key = process.env.OPENAI_API_KEY;
if (!key) { console.error('OPENAI_API_KEY env var is required'); process.exit(1); }

// House style — keep every cover cohesive with the blog's dark, modern, tech-editorial look.
const STYLE = [
  'Modern minimal tech editorial illustration',
  'clean flat-vector and subtle isometric style',
  'deep navy background (#0b1020) with soft neon glow accents',
  'gentle depth and rim light, premium and uncluttered',
  'cinematic 3:2 landscape composition',
  'absolutely no text, no words, no letters, no logos, no UI labels',
].join(', ');

const prompt = `${concept}. ${STYLE}.`;

const res = await fetch('https://api.openai.com/v1/images/generations', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-image-1',
    prompt,
    n: 1,
    size: '1536x1024',         // 3:2, crops cleanly to the 1.91:1 OG card
    quality,
    output_format: 'jpeg',     // JPEG keeps covers ~10x smaller than the default PNG and is OG/social-safe
    output_compression: 85,
  }),
});

if (!res.ok) {
  const t = await res.text();
  console.error(`OpenAI error ${res.status}: ${t.slice(0, 500)}`);
  process.exit(1);
}
const data = await res.json();
const b64 = data?.data?.[0]?.b64_json;
if (!b64) { console.error('no image in response'); process.exit(1); }

const outPath = join('public', 'images', 'posts', slug, out);
mkdirSync(dirname(outPath), { recursive: true });
const buf = Buffer.from(b64, 'base64');
writeFileSync(outPath, buf);
if (buf.length < 12000) { console.error(`suspiciously small image (${buf.length} bytes) — aborting`); process.exit(1); }
console.log(`wrote ${outPath} (${(buf.length / 1024).toFixed(0)} KB)`);
