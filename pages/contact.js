import { Fragment } from 'react';
import Head from 'next/head';

import ContactForm from '../components/contact/contact-form';

const BASE_URL = 'https://blog.mycodedojo.com';
const PAGE_URL = `${BASE_URL}/contact`;
const TITLE = "Contact | Mike's Dev Blog";
const DESCRIPTION =
  'Get in touch with Michael Cooper — developer, homelab enthusiast, and author of practical React, Next.js, and Docker tutorials.';

function ContactPage() {
  return (
    <Fragment>
      <Head>
        <title>{TITLE}</title>
        <meta name='description' content={DESCRIPTION} />
        <link rel='canonical' href={PAGE_URL} />
        <meta property='og:type' content='website' />
        <meta property='og:title' content={TITLE} key='og-title' />
        <meta property='og:description' content={DESCRIPTION} key='og-description' />
        <meta property='og:url' content={PAGE_URL} key='og-url' />
        <meta
          property='og:image'
          content={`${BASE_URL}/images/site/logo.png`}
          key='og-image'
        />
        <meta property='og:site_name' content="Mike's Dev Blog" />
        <meta name='twitter:card' content='summary' />
        <meta name='twitter:title' content={TITLE} />
        <meta name='twitter:description' content={DESCRIPTION} />
      </Head>
      <ContactForm />
    </Fragment>
  );
}

export default ContactPage;
