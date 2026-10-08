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
      </Head>
      <ContactForm />
    </>
  );
}

export default ContactPage;
