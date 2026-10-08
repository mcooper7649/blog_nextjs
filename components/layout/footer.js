import Link from 'next/link';

import { Seal } from './logo';
import { SITE } from '../../lib/site';
import classes from './footer.module.css';

function Footer() {
  return (
    <footer className={classes.footer}>
      <div className={`page ${classes.inner}`}>
        <div className={classes.brand}>
          <Seal size={44} />
          <div>
            <p className={classes.name}>{SITE.name}</p>
            <p className={classes.tagline}>{SITE.tagline} Practice daily. Ship often.</p>
          </div>
        </div>
        <nav aria-label="Footer">
          <ul className={classes.links}>
            <li>
              <Link href="/posts">All posts</Link>
            </li>
            <li>
              <a href={SITE.portfolio}>Portfolio</a>
            </li>
            <li>
              <a href={SITE.github}>GitHub</a>
            </li>
            <li>
              <a href="/feed.xml">RSS</a>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className={`page ${classes.legal}`}>
        <span>© {new Date().getFullYear()} {SITE.author}</span>
        <span lang="ja" aria-hidden="true" className={classes.kanji}>
          {SITE.kanji}
        </span>
      </div>
    </footer>
  );
}

export default Footer;
