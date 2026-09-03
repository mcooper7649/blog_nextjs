import Head from 'next/head';
import Link from 'next/link';
import { Fragment } from 'react';

import classes from '../styles/404.module.css';

function NotFoundPage() {
  return (
    <Fragment>
      <Head>
        <title>404 — Page Not Found | Mike's Dev Blog</title>
        <meta name="description" content="The page you're looking for doesn't exist. Head back to the blog and find what you need." />
        <meta name="robots" content="noindex" />
      </Head>
      <div className={classes.container}>
        <div className={classes.code}>404</div>
        <h1 className={classes.heading}>Page not found</h1>
        <p className={classes.message}>
          Looks like that URL doesn't exist — it may have moved or been deleted.
        </p>
        <div className={classes.actions}>
          <Link href="/">
            <a className={classes.primaryBtn}>← Back to Home</a>
          </Link>
          <Link href="/posts">
            <a className={classes.secondaryBtn}>Browse All Posts</a>
          </Link>
        </div>
      </div>
    </Fragment>
  );
}

export default NotFoundPage;
