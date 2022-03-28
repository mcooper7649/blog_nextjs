import Head from 'next/head';

import '../styles/globals.css';
import Layout from '../components/layout/layout';

function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="publish_date"
          property="og:publish_date"
          content="2022-03-27T00:00:00-0600"
        />
        <meta
          name="title"
          content="Mikes' Dev Blog | NextJS"
          property="og:title"
        />
        <meta
          name="description"
          property="og:description"
          content="A blog about Modern Frameworks and Elegant web design. Built using the Nextjs platform, We can store our content using markdown files and have our server render the content beautifully."
        />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta
          name="image"
          property="og:image"
          content="https://img001.prntscr.com/file/img001/CKeX-TwVRx63qFdG-jxsUg.png"
        />
        <meta
          name="url"
          property="og:url"
          content="blog-nextjs-fawn-chi.vercel.app"
        />
        <meta name="author" property="og:author" content="Michael Cooper" />
      </Head>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
