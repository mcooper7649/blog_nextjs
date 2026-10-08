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
