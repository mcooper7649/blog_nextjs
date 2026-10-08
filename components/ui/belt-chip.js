import { BELTS } from '../../lib/belts';
import classes from './belt-chip.module.css';

function BeltChip({ belt }) {
  const meta = BELTS[belt];
  if (!meta) return null;

  return (
    <span className={classes.chip} title={`${meta.label}: ${meta.rank}`}>
      <span
        className={classes.belt}
        data-belt={belt}
        style={{ '--belt': meta.color, '--belt-edge': meta.edge }}
        aria-hidden="true"
      />
      {meta.label}
    </span>
  );
}

export default BeltChip;
