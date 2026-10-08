import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import Link from 'next/link';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import codeTheme from 'react-syntax-highlighter/dist/cjs/styles/prism/a11y-dark';
import js from 'react-syntax-highlighter/dist/cjs/languages/prism/javascript';
import jsx from 'react-syntax-highlighter/dist/cjs/languages/prism/jsx';
import ts from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript';
import tsx from 'react-syntax-highlighter/dist/cjs/languages/prism/tsx';
import css from 'react-syntax-highlighter/dist/cjs/languages/prism/css';
import sass from 'react-syntax-highlighter/dist/cjs/languages/prism/sass';
import scss from 'react-syntax-highlighter/dist/cjs/languages/prism/scss';
import bash from 'react-syntax-highlighter/dist/cjs/languages/prism/bash';
import html from 'react-syntax-highlighter/dist/cjs/languages/prism/markup';
import markdown from 'react-syntax-highlighter/dist/cjs/languages/prism/markdown';
import json from 'react-syntax-highlighter/dist/cjs/languages/prism/json';
import yaml from 'react-syntax-highlighter/dist/cjs/languages/prism/yaml';
import docker from 'react-syntax-highlighter/dist/cjs/languages/prism/docker';
import python from 'react-syntax-highlighter/dist/cjs/languages/prism/python';
import kotlin from 'react-syntax-highlighter/dist/cjs/languages/prism/kotlin';
import dart from 'react-syntax-highlighter/dist/cjs/languages/prism/dart';
import sql from 'react-syntax-highlighter/dist/cjs/languages/prism/sql';
import go from 'react-syntax-highlighter/dist/cjs/languages/prism/go';

import PostHeader from './post-header';
import classes from './post-content.module.css';

const LANGUAGES = {
  js,
  javascript: js,
  jsx,
  ts,
  typescript: ts,
  tsx,
  css,
  sass,
  scss,
  sh: bash,
  bash,
  shell: bash,
  html,
  markdown,
  json,
  yaml,
  yml: yaml,
  docker,
  dockerfile: docker,
  python,
  kotlin,
  dart,
  sql,
  go,
};

Object.entries(LANGUAGES).forEach(([name, grammar]) => SyntaxHighlighter.registerLanguage(name, grammar));

const CODE_STYLE = {
  margin: 0,
  padding: '1.25rem',
  background: 'transparent',
  fontSize: '0.875rem',
  lineHeight: 1.6,
};

// Highlighting runs after mount: the Prism grammars tokenize slightly differently in
// the server bundle, which caused hydration mismatches on every post with code.
function CodeBlock({ language, code }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className={classes.codeBlock}>
      {language !== 'text' && <span className={classes.lang}>{language}</span>}
      {mounted && language !== 'text' ? (
        <SyntaxHighlighter
          style={codeTheme}
          language={language}
          PreTag="div"
          customStyle={CODE_STYLE}
          codeTagProps={{ style: { fontFamily: 'var(--font-mono), monospace' } }}
        >
          {code}
        </SyntaxHighlighter>
      ) : (
        <pre className={classes.plain} style={CODE_STYLE}>
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

function resolveSrc(slug, src) {
  if (/^(https?:)?\/\//.test(src) || src.startsWith('/')) return src;
  return `/images/posts/${slug}/${src}`;
}

function PostContent(props) {
  const { post, adjacent } = props;

  const customRenderers = {
    p(paragraph) {
      const { node } = paragraph;
      const first = node.children && node.children[0];

      if (node.children.length === 1 && first && first.tagName === 'img') {
        return (
          <figure className={classes.figure}>
            <Image
              src={resolveSrc(post.slug, first.properties.src)}
              alt={first.properties.alt || ''}
              width={1200}
              height={675}
              sizes="(max-width: 760px) 100vw, 720px"
            />
            {first.properties.alt && <figcaption>{first.properties.alt}</figcaption>}
          </figure>
        );
      }

      return <p>{paragraph.children}</p>;
    },

    code({ inline, className, children }) {
      if (inline) {
        return <code className={classes.inlineCode}>{children}</code>;
      }

      const match = /language-(\w+)/.exec(className || '');
      const language = match && LANGUAGES[match[1].toLowerCase()] ? match[1].toLowerCase() : 'text';

      return <CodeBlock language={language} code={String(children).replace(/\n$/, '')} />;
    },

    pre({ children }) {
      return <>{children}</>;
    },

    a({ href, children }) {
      const external = /^https?:\/\//.test(href || '');
      return (
        <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          {children}
        </a>
      );
    },
  };

  return (
    <article className={classes.article}>
      <PostHeader post={post} />
      <div className={classes.prose}>
        <ReactMarkdown components={customRenderers}>{post.content}</ReactMarkdown>
      </div>

      <div className={classes.signoff} aria-hidden="true">
        <span />
        <svg viewBox="0 0 64 64" width="28" height="28">
          <rect x="3" y="3" width="58" height="58" rx="12" fill="var(--accent)" />
          <path d="M41.5 15.5 A18 18 0 1 0 49.6 27" fill="none" stroke="#f5f0e6" strokeWidth="6" strokeLinecap="round" />
        </svg>
        <span />
      </div>

      {adjacent && (adjacent.newer || adjacent.older) && (
        <nav className={classes.adjacent} aria-label="More posts">
          {adjacent.older ? (
            <Link href={`/posts/${adjacent.older.slug}`} className={classes.prev}>
              <span>← Older</span>
              {adjacent.older.title}
            </Link>
          ) : (
            <span />
          )}
          {adjacent.newer && (
            <Link href={`/posts/${adjacent.newer.slug}`} className={classes.next}>
              <span>Newer →</span>
              {adjacent.newer.title}
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}

export default PostContent;
