import { Fragment } from "react";
import Head from "next/head";

import FeaturedPosts from "../components/home-page/featured-posts";
import { getFeaturedPosts } from "../lib/posts-util";

function HomePage(props) {
  return (
    <Fragment>
      <Head>
        <title>Mike's Dev Blog — React, Next.js, TypeScript & Homelab</title>
        <meta
          name="description"
          content="Practical tutorials on React, Next.js, TypeScript, Kotlin, Docker, and self-hosting — written by Michael Cooper."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://blog.mycodedojo.com/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Mike's Dev Blog — React, Next.js, TypeScript & Homelab" />
        <meta name="twitter:description" content="Practical tutorials on React, Next.js, TypeScript, Kotlin, Docker, and self-hosting — written by Michael Cooper." />
        <meta name="twitter:image" content="https://blog.mycodedojo.com/images/site/logo.png" />
      </Head>
      <FeaturedPosts posts={props.posts} />
    </Fragment>
  );
}

export function getStaticProps() {
  const featuredPosts = getFeaturedPosts();

  return {
    props: {
      posts: featuredPosts,
    },
  };
}

export default HomePage;
