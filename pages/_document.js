import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="icon" href="/icon.svg" type="image/svg+xml" />
          <link rel="alternate icon" href="/favicon.ico" />
          <meta name="theme-color" content="#f5f0e6" media="(prefers-color-scheme: light)" />
          <meta name="theme-color" content="#141210" media="(prefers-color-scheme: dark)" />
        </Head>
        <body>
          <Main />
          <NextScript />
          <div id="notifications"></div>
        </body>
      </Html>
    );
  }
}

export default MyDocument;
