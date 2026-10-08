import Link from 'next/link';

import PostsGrid from '../posts/posts-grid';
import classes from './featured-posts.module.css';

function LatestPosts(props) {
  return (
    <section className={`page ${classes.latest}`} aria-labelledby="latest-title">
      <div className={classes.head}>
        <div>
          <p className="eyebrow">Fresh off the mat</p>
          <h2 id="latest-title">Latest notes</h2>
        </div>
        <Link href="/posts" className={classes.all}>
          View all posts <span aria-hidden="true">→</span>
        </Link>
      </div>
      <PostsGrid posts={props.posts} />
    </section>
  );
}

export default LatestPosts;
