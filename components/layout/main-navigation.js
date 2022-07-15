import Link from 'next/link';

import Logo from './logo';
import classes from './main-navigation.module.css';

import { AnimatePresence, motion } from 'framer-motion/dist/framer-motion';

function MainNavigation() {
  return (
    <header className={classes.header}>
      <motion.div
        className={classes.image}
        animate={{
          scale: [0.4, 1.1, 0.9, 0.6, 1],
          rotate: [0, 0, 270, 270, 0],
          borderRadius: ['20%', '20%', '50%', '50%', '20%'],
        }}
      >
        <Link href="/">
          <a>
            <Logo />
          </a>
        </Link>
      </motion.div>
      <nav className="menu open_menu">
        <ul>
          <motion.li
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={classes.menu}
          >
            <Link href="/posts">Posts</Link>
          </motion.li>
          <motion.li whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Link href="/contact">Contact</Link>
          </motion.li>
        </ul>
      </nav>
    </header>
  );
}

export default MainNavigation;
