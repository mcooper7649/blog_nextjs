import { getAllPosts } from '../../lib/posts-util';
import { SITE } from '../../lib/site';

// Public, CORS-enabled feed of the newest posts. www.mycodedojo.com uses it for
// its "From the Dojo" section.
function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    res.status(405).json({ message: 'Method not allowed.' });
    return;
  }

  const requested = parseInt(req.query.limit, 10);
  const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 10) : 3;

  const posts = getAllPosts()
    .slice(0, limit)
    .map((post) => ({
      title: post.title,
      slug: post.slug,
      url: `${SITE.url}/posts/${post.slug}`,
      date: post.date,
      excerpt: post.excerpt,
      image: post.image ? `${SITE.url}/images/posts/${post.slug}/${post.image}` : null,
      belt: post.belt,
      readingTime: post.readingTime,
    }));

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).json(posts);
}

export default handler;
