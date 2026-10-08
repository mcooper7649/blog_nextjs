import classes from './logo.module.css';

// Hanko-style seal with a brushed enso: the Dojo Notes mark.
export function Seal({ size = 40, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="3" width="58" height="58" rx="12" fill="var(--accent)" />
      <path
        d="M41.5 15.5 A18 18 0 1 0 49.6 27"
        fill="none"
        stroke="#f5f0e6"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="32" cy="32" r="4" fill="#f5f0e6" />
    </svg>
  );
}

function Logo() {
  return (
    <span className={classes.logo}>
      <Seal size={36} />
      <span className={classes.wordmark}>
        Dojo <em>Notes</em>
      </span>
    </span>
  );
}

export default Logo;
