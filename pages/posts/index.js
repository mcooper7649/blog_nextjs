import Head from 'next/head';
import { Fragment } from 'react';

import AllPosts from '../../components/posts/all-posts';
import { getAllPosts } from '../../lib/posts-util';

const BLOG_URL = 'https://blog.mycodedojo.com';
const OG_IMAGE = `${BLOG_URL}/images/site/logo.png`;

function AllPostsPage(props) {
  return (
    <Fragment>
      <Head>
        <title>All Posts — Mike&apos;s Dev Blog</title>
        <meta
          name='description'
          content='Browse all tutorials and articles on React, Next.js, TypeScript, Kotlin, Docker, self-hosting, and homelab engineering by Michael Cooper.'
        />
        <link rel='canonical' href={`${BLOG_URL}/posts`} />
        <meta property='og:type' content='website' />
        <meta property='og:site_name' content="Mike's Dev Blog" />
        <meta property='og:url' content={`${BLOG_URL}/posts`} />
        <meta property='og:title' content="All Posts — Mike's Dev Blog" />
        <meta
          property='og:description'
          content='Browse all tutorials and articles on React, Next.js, TypeScript, Kotlin, Docker, self-hosting, and homelab engineering by Michael Cooper.'
        />
        <meta property='og:image' content={OG_IMAGE} />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content="All Posts — Mike's Dev Blog" />
        <meta
          name='twitter:description'
          content='Browse all tutorials and articles on React, Next.js, TypeScript, Kotlin, Docker, self-hosting, and homelab engineering by Michael Cooper.'
        />
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
