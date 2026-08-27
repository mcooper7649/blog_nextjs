import Head from 'next/head';
import Link from 'next/link';
import { Fragment } from 'react';
import classes from '../styles/404.module.css';

function NotFoundPage() {
  return (
    <Fragment>
      <Head>
        <title>404 — Page Not Found | Mike's Dev Blog</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="This page doesn't exist. Head back to the blog for React, Next.js, Docker, and homelab tutorials." />
      </Head>
      <div className={classes.container}>
        <div className={classes.code}>404</div>
        <h1 className={classes.heading}>Page Not Found</h1>
        <p className={classes.message}>
          Looks like this URL doesn&apos;t exist — maybe a typo, a moved post,
          or a stale bookmark.
        </p>
        <nav className={classes.links}>
          <Link href="/">
            <a className={classes.primaryLink}>← Back to Home</a>
          </Link>
          <Link href="/posts">
            <a className={classes.secondaryLink}>Browse All Posts</a>
          </Link>
        </nav>
      </div>
    </Fragment>
  );
}

export default NotFoundPage;
