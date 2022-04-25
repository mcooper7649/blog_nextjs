import classes from './logo.module.css';
import Image from 'next/image';

function Logo() {
  return (
    <div className={classes.logo}>
      <div className={classes.image}>
        <Image
          src="/images/site/logo.png"
          alt="An image showing Mike"
          width={150}
          height={90}
        />
      </div>
    </div>
  );
}

export default Logo;
