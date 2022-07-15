import { useState } from 'react';
import PostItem from './post-item';
import classes from './posts-grid.module.css';
import { AnimatePresence, motion } from 'framer-motion/dist/framer-motion';

function PostsGrid(props) {
  const { posts } = props;

  return (
    <ul className={classes.grid}>
      {posts.map((post) => (
        <motion.div
          transition={{
            duration: 1,
            type: 'ease-out',
          }}
          className={classes.image}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <PostItem className={classes.card} key={post.slug} post={post} />
        </motion.div>
      ))}
    </ul>
  );
}

export default PostsGrid;
