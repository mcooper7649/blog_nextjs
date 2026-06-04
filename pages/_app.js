import Head from 'next/head';

import '../styles/globals.css';
import Layout from '../components/layout/layout';

function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="title"
          content="Mike's Dev Blog"
          property="og:title"
          key="og-title"
        />
        <meta
          name="description"
          property="og:description"
          content="Practical tutorials on React, Next.js, TypeScript, Kotlin, Docker, and self-hosting — written by Michael Cooper."
          key="og-description"
        />
        <meta
          name="image"
          property="og:image"
          content="https://blog.mycodedojo.com/images/site/logo.png"
          key="og-image"
        />
        <meta
          name="url"
          property="og:url"
          content="https://blog.mycodedojo.com"
          key="og-url"
        />
        <meta name="author" property="og:author" content="Michael Cooper" />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Mike's Dev Blog RSS Feed"
          href="https://blog.mycodedojo.com/feed.xml"
        />
      </Head>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
