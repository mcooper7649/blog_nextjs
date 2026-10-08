# Dojo Notes: the MyCodeDojo blog

A personal technical blog built with **Next.js 14**, live at **[blog.mycodedojo.com](https://blog.mycodedojo.com)**.

Topics covered: React, Next.js, JavaScript/TypeScript, Kotlin/Android, PostgreSQL, Docker, self-hosting, homelab, and web development fundamentals.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (Pages Router) |
| Styling | CSS Modules |
| Post parsing | gray-matter + react-markdown |
| Syntax highlighting | react-syntax-highlighter |
| Fonts | Shippori Mincho / Inter / JetBrains Mono via `next/font` |
| Contact storage | MongoDB |
| Deployment | Vercel (auto-deploys from `main`) |
| SEO | Dynamic sitemap at `/sitemap.xml`, `robots.txt`, per-post OpenGraph + Twitter Card meta |

## Brand guide

The blog is branded **Dojo Notes** (道場), tagline *"Field notes from the code dojo."* The look is ink and washi paper with a single vermilion accent.

| Token (`styles/globals.css`) | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#f5f0e6` | `#141210` | page background |
| `--ink` | `#1b1813` | `#eee7d8` | text, headings |
| `--accent` | `#b3122c` | `#e0384f` | links, highlights, the seal |
| `--gold` | `#9a7b2f` | `#c9a95a` | rare secondary accent |

- **Type:** Shippori Mincho for headings, Inter for body, JetBrains Mono for code and meta. All are loaded with `next/font` in `pages/_app.js`.
- **Mark:** a red hanko seal with an enso (`components/layout/logo.js`, `public/icon.svg`).
- **Dark mode** follows `prefers-color-scheme`. Every color is a token, so don't hard-code hex values in components.

### Post frontmatter

```yaml
---
title: 'Docker Multi-Stage Builds'
date: '2026-06-12'          # YYYY-MM-DD
image: cover.jpg            # file in public/images/posts/<slug>/
excerpt: One or two sentences shown on cards and in meta tags.
isFeatured: false           # newest featured post is the home-page spotlight
belt: brown                 # white | yellow | green | brown | black
---
```

`belt` is the difficulty level, shown as a belt chip on cards and post headers: **white** = beginner/intro, **yellow** = novice, **green** = intermediate how-to, **brown** = advanced, **black** = expert deep dive. It's optional, but every new post should set it.

### Latest-posts API

`GET /api/latest-posts?limit=3` (max 10) returns the newest posts as JSON with CORS open. The portfolio at www.mycodedojo.com uses it for its "From the Dojo" section. The RSS feed at `/feed.xml` is also CORS-enabled.

## Local Development

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variable (contact form only)

```
MONGODB_CONNECTION_STRING=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>
```

Only needed if you want the contact form to save messages. The rest of the site works without it.

## Project Structure

```
blog_nextjs/
├── components/
│   ├── home-page/      # Hero + FeaturedPosts
│   ├── posts/          # PostsGrid, PostItem, PostDetail (renders markdown)
│   ├── contact/        # Contact form
│   ├── layout/         # MainNavigation, Layout wrapper
│   └── ui/             # Notification component
├── lib/
│   └── posts-util.js   # getAllPosts, getFeaturedPosts, getPostData
├── pages/
│   ├── index.js        # Home — featured posts
│   ├── posts/
│   │   ├── index.js    # All posts
│   │   └── [slug].js   # Individual post
│   ├── contact.js
│   ├── sitemap.xml.js  # Dynamic XML sitemap (SSR)
│   └── api/
│       └── contact.js  # Contact form API route → MongoDB
├── posts/              # Markdown blog posts (one file = one post)
└── public/
    ├── images/posts/   # Post cover images, grouped by slug
    └── robots.txt
```

## Writing a New Post

1. Create `posts/<slug>.md`. The filename (without `.md`) becomes the URL path (`/posts/<slug>`).

2. Add frontmatter at the top:

```markdown
---
title: 'Your Post Title'
date: 'YYYY-MM-DD'
image: cover-image.png
excerpt: One-sentence summary shown on the post card.
isFeatured: false
---

Post body in Markdown…
```

3. Put the cover image in `public/images/posts/<slug>/cover-image.png`. Reference it in the frontmatter by filename only.

4. Set `isFeatured: true` to show the post in the hero section on the home page (keep featured posts to ≤ 3–4).

5. Code blocks render with syntax highlighting — use fenced blocks with a language hint:

   ````markdown
   ```javascript
   const greeting = 'Hello, world!';
   ```
   ````

## Building for Production

```bash
npm run build
npm run start
```

Vercel runs the same build automatically on every push to `main`.

## Content Log

Recent changes are tracked in [`CONTENT_LOG.md`](./CONTENT_LOG.md).
