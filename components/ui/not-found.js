import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faNewspaper } from '@fortawesome/free-solid-svg-icons';

import classes from './not-found.module.css';

function NotFound() {
  return (
    <div className={classes.container}>
      <p className={classes.code}>404</p>
      <hr className={classes.divider} />
      <h1 className={classes.heading}>Page Not Found</h1>
      <p className={classes.message}>
        The page you&apos;re looking for doesn&apos;t exist or may have been
        moved. Head back home or browse the latest posts.
      </p>
      <div className={classes.actions}>
        <Link href='/'>
          <a className={`${classes.btn} ${classes.btnPrimary}`}>
            <FontAwesomeIcon icon={faHouse} />
            Home
          </a>
        </Link>
        <Link href='/posts'>
          <a className={`${classes.btn} ${classes.btnSecondary}`}>
            <FontAwesomeIcon icon={faNewspaper} />
            All Posts
          </a>
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
