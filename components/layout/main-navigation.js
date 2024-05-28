import Link from "next/link";
import Logo from "./logo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faNewspaper,
  faEnvelope,
} from "@fortawesome/free-solid-svg-icons";
import classes from "./main-navigation.module.css";
import { motion } from "framer-motion/dist/framer-motion";

function MainNavigation() {
  return (
    <header className={classes.header}>
      <Link href="https://www.mycodedojo.com">
        <a>
          <Logo />
        </a>
      </Link>
      <nav className={classes.menu}>
        <ul>
          <motion.li
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={classes.menuItem}
          >
            <Link href="/posts">
              <a>
                <FontAwesomeIcon icon={faNewspaper} />
                Posts
              </a>
            </Link>
          </motion.li>
          <motion.li whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Link href="/contact">
              <a>
                <FontAwesomeIcon icon={faEnvelope} />
                Contact
              </a>
            </Link>
          </motion.li>
        </ul>
      </nav>
    </header>
  );
}

export default MainNavigation;
