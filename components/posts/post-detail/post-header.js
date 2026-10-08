import Image from 'next/image';
import Link from 'next/link';

import BeltChip from '../../ui/belt-chip';
import { formatDate } from '../format';
import classes from './post-header.module.css';

function PostHeader({ post }) {
  const imagePath = post.image ? `/images/posts/${post.slug}/${post.image}` : null;

  return (
    <header className={classes.header}>
      <Link href="/posts" className={classes.back}>
        ← All posts
      </Link>
      <h1>{post.title}</h1>
      {post.excerpt && <p className={classes.excerpt}>{post.excerpt}</p>}
      <div className={classes.meta}>
        <span className={classes.author}>Michael Cooper</span>
        <span aria-hidden="true">·</span>
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span aria-hidden="true">·</span>
        <span>{post.readingTime} min read</span>
        {post.belt && (
          <>
            <span aria-hidden="true">·</span>
            <BeltChip belt={post.belt} />
          </>
        )}
      </div>
      {imagePath && (
        <div className={classes.cover}>
          <Image src={imagePath} alt="" fill priority sizes="(max-width: 900px) 100vw, 860px" />
        </div>
      )}
    </header>
  );
}

export default PostHeader;
