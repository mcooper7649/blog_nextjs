import Link from 'next/link';

import { SITE } from '../../lib/site';
import classes from './hero.module.css';

function Hero({ postCount }) {
  return (
    <section className={classes.hero}>
      <div className={`page ${classes.inner}`}>
        <div className={classes.copy}>
          <p className="eyebrow">mycodedojo · est. 2020</p>
          <h1>
            Field notes from the <span>code dojo</span>.
          </h1>
          <p className={classes.lede}>
            Homelab, self-hosting, AI agents and full-stack craft. I'm Michael Cooper, a senior
            full-stack engineer who runs most of his stack on hardware in his own house. These
            are the notes I write while I train.
          </p>
          <div className={classes.actions}>
            <Link href="/posts" className="btn">
              Read the {postCount} posts <span aria-hidden="true">→</span>
            </Link>
            <a href="/feed.xml" className="btn btn--ghost">
              RSS feed
            </a>
          </div>
        </div>

        <div className={classes.art} aria-hidden="true">
          <svg viewBox="0 0 400 400" className={classes.enso}>
            <defs>
              <filter id="brush" x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
                <feDisplacementMap in="SourceGraphic" scale="9" />
              </filter>
            </defs>
            <path
              d="M262 70 C 180 30, 70 90, 72 205 C 74 315, 190 360, 270 318 C 340 280, 352 180, 312 128"
              fill="none"
              stroke="var(--ink)"
              strokeWidth="30"
              strokeLinecap="round"
              filter="url(#brush)"
              opacity="0.92"
            />
          </svg>
          <span className={classes.kanji} lang="ja">
            {SITE.kanji}
          </span>
          <span className={classes.stamp}>
            <svg viewBox="0 0 64 64" width="64" height="64">
              <rect x="3" y="3" width="58" height="58" rx="8" fill="var(--accent)" />
              <rect
                x="9"
                y="9"
                width="46"
                height="46"
                rx="4"
                fill="none"
                stroke="#f5f0e6"
                strokeWidth="2"
              />
              <path
                d="M41.5 17.5 A16 16 0 1 0 48.6 28"
                fill="none"
                stroke="#f5f0e6"
                strokeWidth="5"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </div>
      </div>
      <div className={classes.waves} aria-hidden="true" />
    </section>
  );
}

export default Hero;
