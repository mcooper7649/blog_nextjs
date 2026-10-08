import Link from 'next/link';
import Image from 'next/image';

import BeltChip from '../ui/belt-chip';
import { formatDate } from '../posts/format';
import classes from './spotlight.module.css';

function Spotlight({ post }) {
  if (!post) return null;
  const imagePath = post.image ? `/images/posts/${post.slug}/${post.image}` : null;

  return (
    <section className={`page ${classes.section}`} aria-labelledby="spotlight-title">
      <p className="eyebrow">Featured note</p>
      <Link href={`/posts/${post.slug}`} className={classes.card}>
        {imagePath && (
          <div className={classes.image}>
            <Image
              src={imagePath}
              alt=""
              fill
              priority
              sizes="(max-width: 820px) 100vw, 620px"
            />
          </div>
        )}
        <div className={classes.body}>
          <div className={classes.meta}>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden="true">·</span>
            <span>{post.readingTime} min read</span>
          </div>
          <h2 id="spotlight-title">{post.title}</h2>
          <p>{post.excerpt}</p>
          <div className={classes.foot}>
            <BeltChip belt={post.belt} />
            <span className={classes.read}>
              Read it <span aria-hidden="true">→</span>
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}

export default Spotlight;
