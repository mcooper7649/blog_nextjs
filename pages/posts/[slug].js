import Head from 'next/head';
import { Fragment } from 'react';

import PostContent from '../../components/posts/post-detail/post-content';
import { getAdjacentPosts, getPostData, getPostsFiles } from '../../lib/posts-util';
import { SITE } from '../../lib/site';

const BASE_URL = SITE.url;

function PostDetailPage(props) {
  const { post } = props;
  const imageUrl = post.image
    ? `${BASE_URL}/images/posts/${post.slug}/${post.image}`
    : `${BASE_URL}/images/site/og-default.png`;
  const postUrl = `${BASE_URL}/posts/${post.slug}`;

  return (
    <Fragment>
      <Head>
        <title key='title'>{`${post.title} | ${SITE.name}`}</title>
        <meta name='description' content={post.excerpt} key='description' />
        <link rel='canonical' href={postUrl} />
        <meta property='og:type' content='article' />
        <meta property='og:title' content={post.title} key='og-title' />
        <meta property='og:description' content={post.excerpt} key='og-description' />
        <meta property='og:image' content={imageUrl} key='og-image' />
        <meta property='og:url' content={postUrl} key='og-url' />
        <meta property='og:site_name' content={SITE.name} key='og-site-name' />
        <meta property='article:published_time' content={post.date} />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={post.title} />
        <meta name='twitter:description' content={post.excerpt} />
        <meta name='twitter:image' content={imageUrl} />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              headline: post.title,
              description: post.excerpt,
              image: imageUrl,
              datePublished: post.date,
              author: {
                '@type': 'Person',
                name: 'Michael Cooper',
                url: 'https://www.mycodedojo.com',
              },
              publisher: {
                '@type': 'Person',
                name: 'Michael Cooper',
                url: 'https://www.mycodedojo.com',
              },
              url: postUrl,
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': postUrl,
              },
            }),
          }}
        />
      </Head>
      <PostContent post={props.post} adjacent={props.adjacent} />
    </Fragment>
  );
}

export function getStaticProps(context) {
  const { params } = context;
  const { slug } = params;

  const postData = getPostData(slug);

  return {
    props: {
      post: postData,
      adjacent: getAdjacentPosts(slug),
    },
    revalidate: 600,
  };
}

export function getStaticPaths() {
  const postFilenames = getPostsFiles();

  const slugs = postFilenames.map((fileName) => fileName.replace(/\.md$/, ''));

  return {
    paths: slugs.map((slug) => ({ params: { slug: slug } })),
    fallback: false,
  };
}

export default PostDetailPage;
