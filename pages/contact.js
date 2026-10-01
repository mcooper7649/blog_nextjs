import { Fragment } from 'react';
import Head from 'next/head';

import ContactForm from '../components/contact/contact-form';

const BASE_URL = 'https://blog.mycodedojo.com';
const PAGE_URL = `${BASE_URL}/contact`;
const OG_IMAGE = `${BASE_URL}/images/site/logo.png`;
const TITLE = "Contact | Mike's Dev Blog";
const DESCRIPTION =
  'Get in touch with Michael Cooper — questions, feedback, collaboration ideas, or just to say hi.';

function ContactPage() {
  return (
    <Fragment>
      <Head>
        <title>{TITLE}</title>
        <meta name='description' content={DESCRIPTION} />
        <link rel='canonical' href={PAGE_URL} />
        <meta property='og:type' content='website' />
        <meta property='og:title' content={TITLE} />
        <meta property='og:description' content={DESCRIPTION} />
        <meta property='og:url' content={PAGE_URL} />
        <meta property='og:image' content={OG_IMAGE} />
        <meta property='og:site_name' content="Mike's Dev Blog" />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={TITLE} />
        <meta name='twitter:description' content={DESCRIPTION} />
        <meta name='twitter:image' content={OG_IMAGE} />
      </Head>
      <ContactForm />
    </Fragment>
  );
}

export default ContactPage;
