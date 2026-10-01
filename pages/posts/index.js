import Head from 'next/head';

import AllPosts from '../../components/posts/all-posts';
import { getAllPosts, toSummary } from '../../lib/posts-util';
import { SITE } from '../../lib/site';

function AllPostsPage(props) {
  return (
    <>
      <Head>
        <title key="title">{`All posts | ${SITE.name}`}</title>
        <meta
          name="description"
          content="Every Dojo Notes post on homelab, self-hosting, AI agents, React, Next.js and TypeScript, searchable and filterable by belt level."
          key="description"
        />
        <link rel="canonical" href={`${SITE.url}/posts`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`All posts | ${SITE.name}`} key="og-title" />
        <meta
          property="og:description"
          content="Every Dojo Notes post on homelab, self-hosting, AI agents, React, Next.js and TypeScript."
          key="og-description"
        />
        <meta property="og:url" content={`${SITE.url}/posts`} key="og-url" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`All posts | ${SITE.name}`} />
        <meta
          name="twitter:description"
          content="Every Dojo Notes post on homelab, self-hosting, AI agents, React, Next.js and TypeScript."
        />
        <meta name="twitter:image" content={`${SITE.url}/images/site/og-default.png`} />
      </Head>
      <AllPosts posts={props.posts} />
    </>
  );
}

export function getStaticProps() {
  return {
    props: {
      posts: getAllPosts().map(toSummary),
    },
  };
}

export default AllPostsPage;
