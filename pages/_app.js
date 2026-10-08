import Head from 'next/head';
import { Inter, JetBrains_Mono, Shippori_Mincho } from 'next/font/google';

import '../styles/globals.css';
import Layout from '../components/layout/layout';
import { SITE } from '../lib/site';

const display = Shippori_Mincho({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
  display: 'swap',
});
const body = Inter({ subsets: ['latin'], display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap' });

function MyApp({ Component, pageProps }) {
  return (
    <>
      <style jsx global>{`
        :root {
          --font-display: ${display.style.fontFamily};
          --font-body: ${body.style.fontFamily};
          --font-mono: ${mono.style.fontFamily};
        }
      `}</style>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title key="title">{`${SITE.name} | Michael Cooper`}</title>
        <meta name="description" content={SITE.description} key="description" />
        <meta property="og:site_name" content={SITE.name} key="og-site-name" />
        <meta property="og:title" content={SITE.name} key="og-title" />
        <meta property="og:description" content={SITE.description} key="og-description" />
        <meta property="og:image" content={`${SITE.url}/images/site/og-default.png`} key="og-image" />
        <meta property="og:url" content={SITE.url} key="og-url" />
        <meta name="author" content={SITE.author} />
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${SITE.name} RSS Feed`}
          href={`${SITE.url}/feed.xml`}
        />
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}

export default MyApp;
