import { getAllPosts } from '../lib/posts-util';

const BASE_URL = 'https://blog.mycodedojo.com';

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toRfc822(dateStr) {
  // dateStr is YYYY-MM-DD; treat as UTC midnight
  return new Date(`${dateStr}T00:00:00Z`).toUTCString();
}

function Feed() {
  return null;
}

export async function getServerSideProps({ res }) {
  const allPosts = getAllPosts();

  const lastBuildDate = allPosts.length > 0 ? toRfc822(allPosts[0].date) : new Date().toUTCString();

  const items = allPosts
    .map(({ slug, title, date, excerpt }) => {
      const postUrl = `${BASE_URL}/posts/${slug}`;
      return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${toRfc822(date)}</pubDate>
      <description>${escapeXml(excerpt)}</description>
    </item>`;
    })
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Mike's Dev Blog</title>
    <link>${BASE_URL}</link>
    <description>Practical posts on React, Next.js, TypeScript, Docker, homelab, and modern web development.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.write(rss);
  res.end();

  return { props: {} };
}

export default Feed;
