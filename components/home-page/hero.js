import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion/dist/framer-motion';

import classes from './hero.module.css';

function Hero() {
  return (
    <section className={classes.hero}>
      <motion.div
        className={classes.image}
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,

          borderRadius: ['20%', '20%', '50%', '50%', '20%'],
        }}
      >
        <Image
          src="/images/site/myimage.png"
          alt="An image showing Mike"
          width={300}
          height={300}
        />
      </motion.div>

      <motion.h1 initial={{ x: 100 }} animate={{ x: 10 }} className="hero">
        Find your inner ninja 🥷
      </motion.h1>
    </section>
  );
}

export default Hero;
