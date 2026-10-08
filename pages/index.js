import Head from 'next/head';

import Hero from '../components/home-page/hero';
import Spotlight from '../components/home-page/spotlight';
import LatestPosts from '../components/home-page/featured-posts';
import { getAllPosts, toSummary } from '../lib/posts-util';
import { SITE } from '../lib/site';

const TITLE = `${SITE.name}: homelab, self-hosting & full-stack craft`;

function HomePage({ spotlight, latest, postCount }) {
  return (
    <>
      <Head>
        <title key="title">{TITLE}</title>
        <meta name="description" content={SITE.description} key="description" />
        <link rel="canonical" href={`${SITE.url}/`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={TITLE} key="og-title" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={SITE.description} />
        <meta name="twitter:image" content={`${SITE.url}/images/site/og-default.png`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Blog',
              name: SITE.name,
              url: SITE.url,
              description: SITE.description,
              author: {
                '@type': 'Person',
                name: SITE.author,
                url: SITE.portfolio,
              },
            }),
          }}
        />
      </Head>
      <Hero postCount={postCount} />
      <Spotlight post={spotlight} />
      <LatestPosts posts={latest} />
    </>
  );
}

export function getStaticProps() {
  const allPosts = getAllPosts().map(toSummary);
  const spotlight = allPosts.find((post) => post.isFeatured) || allPosts[0] || null;
  const latest = allPosts.filter((post) => post !== spotlight).slice(0, 6);

  return {
    props: {
      spotlight,
      latest,
      postCount: allPosts.length,
    },
  };
}

export default HomePage;
