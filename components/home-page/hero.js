import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion/dist/framer-motion";

import classes from "./hero.module.css";

function Hero() {
  return (
    <section className={classes.hero}>
      <Image
        src="/images/site/myimage.png"
        alt="An image showing Mike"
        width={300}
        height={300}
      />
      Find your inner ninja 🥷
    </section>
  );
}

export default Hero;
