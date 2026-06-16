import Head from 'next/head';
import { Fragment } from 'react';

import NotFound from '../components/ui/not-found';

function NotFoundPage() {
  return (
    <Fragment>
      <Head>
        <title>Page Not Found | Mike&apos;s Dev Blog</title>
        <meta name='description' content='This page does not exist.' />
        <meta name='robots' content='noindex' />
      </Head>
      <NotFound />
    </Fragment>
  );
}

export default NotFoundPage;
