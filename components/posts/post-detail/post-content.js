import ReactMarkdown from 'react-markdown';

import Image from 'next/image';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import atomDark from 'react-syntax-highlighter/dist/cjs/styles/prism/tomorrow';
import js from 'react-syntax-highlighter/dist/cjs/languages/prism/javascript';
import css from 'react-syntax-highlighter/dist/cjs/languages/prism/css';
import sh from 'react-syntax-highlighter/dist/cjs/languages/prism/shell-session';
import jsx from 'react-syntax-highlighter/dist/cjs/languages/prism/jsx';
import html from 'react-syntax-highlighter/dist/cjs/languages/prism/markup';
import markdown from 'react-syntax-highlighter/dist/cjs/languages/prism/markdown';
import dart from 'react-syntax-highlighter/dist/cjs/languages/prism/dart';

import PostHeader from './post-header';
import classes from './post-content.module.css';

function PostContent(props) {
  const { post } = props;

  SyntaxHighlighter.registerLanguage('js', js);
  SyntaxHighlighter.registerLanguage('css', css);
  SyntaxHighlighter.registerLanguage('sh', sh);
  SyntaxHighlighter.registerLanguage('jsx', jsx);
  SyntaxHighlighter.registerLanguage('html', html);
  SyntaxHighlighter.registerLanguage('markdown', markdown);
  SyntaxHighlighter.registerLanguage('dart', dart);

  const imagePath = `/images/posts/${post.slug}/${post.image}`;

  const customRenderers = {
    // img(image) {
    //   return (
    //     <Image
    //       src={`/images/posts/${post.slug}/${image.src}`}
    //       alt={image.alt}
    //       width={600}
    //       height={300}
    //     />
    //   );
    // },
    p(paragraph) {
      const { node } = paragraph;

      if (node.children[0].tagName === 'img') {
        const image = node.children[0];

        return (
          <div className={classes.image}>
            <Image
              src={`/images/posts/${post.slug}/${image.properties.src}`}
              alt={image.alt}
              width={600}
              height={300}
            />
          </div>
        );
      }

      return <p>{paragraph.children}</p>;
    },

    code(code) {
      const { className, children } = code;
      console.log(className);
      var newlanguage;
      if (className === undefined) {
        newlanguage = 'markdown';
        console.log('none');
      } else {
        // newlanguage = 'jsx';
        newlanguage = className.split('-')[1];
        console.log('This is the newlanguage ' + newlanguage);
      }
      return (
        <pre>
          <SyntaxHighlighter
            showLineNumbers={true}
            style={atomDark}
            useInlineStyles={true}
            language={newlanguage}
            children={children}
          />
        </pre>
      );
    },
  };

  return (
    <article className={classes.content}>
      <PostHeader title={post.title} image={imagePath} />
      <ReactMarkdown components={customRenderers}>{post.content}</ReactMarkdown>
    </article>
  );
}

export default PostContent;
