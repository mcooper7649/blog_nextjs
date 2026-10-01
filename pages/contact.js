import Head from 'next/head';

import ContactForm from '../components/contact/contact-form';
import { SITE } from '../lib/site';

function ContactPage() {
  return (
    <>
      <Head>
        <title key="title">{`Contact | ${SITE.name}`}</title>
        <meta
          name="description"
          content="Get in touch with Michael Cooper about a post, a project or a role."
          key="description"
        />
        <link rel="canonical" href={`${SITE.url}/contact`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`Contact | ${SITE.name}`} key="og-title" />
        <meta
          property="og:description"
          content="Get in touch with Michael Cooper about a post, a project or a role."
          key="og-description"
        />
        <meta property="og:url" content={`${SITE.url}/contact`} key="og-url" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Contact | ${SITE.name}`} />
        <meta
          name="twitter:description"
          content="Get in touch with Michael Cooper about a post, a project or a role."
        />
        <meta name="twitter:image" content={`${SITE.url}/images/site/og-default.png`} />
      </Head>
      <ContactForm />
    </>
  );
}

export default ContactPage;
