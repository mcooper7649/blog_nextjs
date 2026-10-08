// Belt levels mark a post's difficulty, from beginner (white) to advanced (black).
export const BELTS = {
  white: { label: 'White belt', rank: 'Beginner', color: '#f2ede2', edge: '#b9b1a1' },
  yellow: { label: 'Yellow belt', rank: 'Novice', color: '#e2b23a', edge: '#b28a22' },
  green: { label: 'Green belt', rank: 'Intermediate', color: '#3f8a5a', edge: '#2c6642' },
  brown: { label: 'Brown belt', rank: 'Advanced', color: '#7b4b2a', edge: '#5a361d' },
  black: { label: 'Black belt', rank: 'Expert', color: '#16130f', edge: '#000000' },
};

export const BELT_ORDER = ['white', 'yellow', 'green', 'brown', 'black'];

export function normalizeBelt(value) {
  const belt = String(value || '').toLowerCase().trim();
  return BELTS[belt] ? belt : null;
}
