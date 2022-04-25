import Image from 'next/image';

import classes from './hero.module.css';

function Hero() {
  return (
    <section className={classes.hero}>
      <div className={classes.image}>
        <Image
          src="/images/site/myimage.png"
          alt="An image showing Mike"
          width={300}
          height={300}
        />
      </div>
      <h1>🥷 MyCodeDojo</h1>
      <p>Find your inner ninja</p>
    </section>
  );
}

export default Hero;
