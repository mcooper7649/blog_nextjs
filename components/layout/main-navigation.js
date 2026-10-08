import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import Logo from './logo';
import { SITE } from '../../lib/site';
import classes from './main-navigation.module.css';

const LINKS = [
  { href: '/posts', label: 'Posts' },
  { href: SITE.portfolio, label: 'About', external: true },
  { href: '/contact', label: 'Contact' },
  { href: '/feed.xml', label: 'RSS', external: true },
];

function MainNavigation() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = () => setOpen(false);
    router.events.on('routeChangeStart', close);
    return () => router.events.off('routeChangeStart', close);
  }, [router.events]);

  const isActive = (href) => href !== '/' && router.pathname.startsWith(href);

  return (
    <header className={classes.header}>
      <div className={`page ${classes.bar}`}>
        <Link href="/" className={classes.brand} aria-label={`${SITE.name} home`}>
          <Logo />
        </Link>
        <button
          type="button"
          className={classes.toggle}
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="visually-hidden">Menu</span>
          <span className={classes.bars} data-open={open} aria-hidden="true" />
        </button>
        <nav id="site-menu" className={classes.menu} data-open={open} aria-label="Main">
          <ul>
            {LINKS.map((link) => (
              <li key={link.label}>
                {link.external ? (
                  <a href={link.href}>{link.label}</a>
                ) : (
                  <Link
                    href={link.href}
                    aria-current={isActive(link.href) ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default MainNavigation;
