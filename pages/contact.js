import { Fragment } from 'react';
import Head from 'next/head';

import ContactForm from '../components/contact/contact-form';

const BLOG_URL = 'https://blog.mycodedojo.com';
const OG_IMAGE = `${BLOG_URL}/images/site/logo.png`;

function ContactPage() {
  return (
    <Fragment>
      <Head>
        <title>Contact — Mike&apos;s Dev Blog</title>
        <meta
          name='description'
          content='Get in touch with Michael Cooper — send a message about web development, homelab projects, or collaboration opportunities.'
        />
        <link rel='canonical' href={`${BLOG_URL}/contact`} />
        <meta property='og:type' content='website' />
        <meta property='og:site_name' content="Mike's Dev Blog" />
        <meta property='og:url' content={`${BLOG_URL}/contact`} />
        <meta property='og:title' content="Contact — Mike's Dev Blog" />
        <meta
          property='og:description'
          content='Get in touch with Michael Cooper — send a message about web development, homelab projects, or collaboration opportunities.'
        />
        <meta property='og:image' content={OG_IMAGE} />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content="Contact — Mike's Dev Blog" />
        <meta
          name='twitter:description'
          content='Get in touch with Michael Cooper — send a message about web development, homelab projects, or collaboration opportunities.'
        />
        <meta name='twitter:image' content={OG_IMAGE} />
      </Head>
      <ContactForm />
    </Fragment>
  );
}

export default ContactPage;
