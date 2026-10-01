import Head from 'next/head';
import { Fragment } from 'react';

import AllPosts from '../../components/posts/all-posts';
import { getAllPosts } from '../../lib/posts-util';

const BASE_URL = 'https://blog.mycodedojo.com';
const PAGE_URL = `${BASE_URL}/posts`;
const OG_IMAGE = `${BASE_URL}/images/site/logo.png`;
const TITLE = "All Posts | Mike's Dev Blog";
const DESCRIPTION =
  'Browse every tutorial and article on React, Next.js, TypeScript, Docker, self-hosting, and more — written by Michael Cooper.';

function AllPostsPage(props) {
  return (
    <Fragment>
      <Head>
        <title>{TITLE}</title>
        <meta name='description' content={DESCRIPTION} />
        <link rel='canonical' href={PAGE_URL} />
        <meta property='og:type' content='website' />
        <meta property='og:title' content={TITLE} />
        <meta property='og:description' content={DESCRIPTION} />
        <meta property='og:url' content={PAGE_URL} />
        <meta property='og:image' content={OG_IMAGE} />
        <meta property='og:site_name' content="Mike's Dev Blog" />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={TITLE} />
        <meta name='twitter:description' content={DESCRIPTION} />
        <meta name='twitter:image' content={OG_IMAGE} />
      </Head>
      <AllPosts posts={props.posts} />
    </Fragment>
  );
}

export function getStaticProps() {
  const allPosts = getAllPosts();

  return {
    props: {
      posts: allPosts,
    },
  };
}

export default AllPostsPage;
