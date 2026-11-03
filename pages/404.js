import Head from 'next/head';
import Link from 'next/link';

import { SITE } from '../lib/site';

export default function NotFoundPage() {
  return (
    <>
      <Head>
        <title key="title">{`404 — Page Not Found | ${SITE.name}`}</title>
        <meta
          name="description"
          content="This page doesn't exist. Find your way back to the dojo."
          key="description"
        />
        <meta name="robots" content="noindex" />
      </Head>
      <div style={{ textAlign: 'center', padding: '5rem var(--gutter) 6rem' }}>
        <p
          style={{
            fontFamily: 'var(--font-display), serif',
            fontSize: 'clamp(5rem, 20vw, 10rem)',
            fontWeight: 800,
            lineHeight: 1,
            color: 'var(--accent)',
            margin: '0 0 0.25rem',
            letterSpacing: '-0.04em',
          }}
          aria-hidden="true"
        >
          404
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display), serif',
            fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
            fontWeight: 700,
            color: 'var(--ink)',
            margin: '0 0 0.75rem',
          }}
        >
          This scroll doesn&apos;t exist.
        </h1>
        <p
          style={{
            color: 'var(--ink-soft)',
            fontSize: '1.0625rem',
            maxWidth: '38ch',
            margin: '0 auto 2.5rem',
          }}
        >
          The page you&apos;re looking for isn&apos;t on these shelves. It may
          have moved, or the link might be wrong.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '0.625rem 1.5rem',
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: 'var(--radius)',
              fontWeight: 600,
              fontSize: '0.9375rem',
              textDecoration: 'none',
              letterSpacing: '0.01em',
            }}
          >
            Back to the dojo
          </Link>
          <Link
            href="/posts"
            style={{
              display: 'inline-block',
              padding: '0.625rem 1.5rem',
              border: '1.5px solid var(--rule)',
              color: 'var(--ink)',
              borderRadius: 'var(--radius)',
              fontWeight: 600,
              fontSize: '0.9375rem',
              textDecoration: 'none',
              letterSpacing: '0.01em',
            }}
          >
            Browse all posts
          </Link>
        </div>
      </div>
    </>
  );
}
