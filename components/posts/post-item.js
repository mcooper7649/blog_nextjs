import Link from 'next/link';
import Image from 'next/image';

import BeltChip from '../ui/belt-chip';
import { formatDate } from './format';
import classes from './post-item.module.css';

function PostItem(props) {
  const { title, image, excerpt, date, slug, readingTime, belt } = props.post;

  const imagePath = image ? `/images/posts/${slug}/${image}` : null;

  return (
    <li className={classes.post}>
      <Link href={`/posts/${slug}`} className={classes.link}>
        <div className={classes.image}>
          {imagePath ? (
            <Image
              src={imagePath}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 360px"
            />
          ) : (
            <span className={classes.placeholder} aria-hidden="true">
              道
            </span>
          )}
        </div>
        <div className={classes.content}>
          <div className={classes.meta}>
            <time dateTime={date}>{formatDate(date)}</time>
            <span aria-hidden="true">·</span>
            <span>{readingTime} min</span>
          </div>
          <h3>{title}</h3>
          <p>{excerpt}</p>
          <BeltChip belt={belt} />
        </div>
      </Link>
    </li>
  );
}

export default PostItem;
