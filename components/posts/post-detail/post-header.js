import Image from 'next/image';

import classes from './post-header.module.css';

function PostHeader(props) {
  const { title, image, readingTime } = props;

  return (
    <header className={classes.header}>
      <div className={classes.titleGroup}>
        <h1>{title}</h1>
        {readingTime && (
          <p className={classes.meta}>{readingTime} min read</p>
        )}
      </div>
      <Image src={image} alt={title} width={200} height={150} />
    </header>
  );
}

export default PostHeader;
