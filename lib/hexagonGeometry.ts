export interface Point {
  x: number;
  y: number;
}

/** Unit-circle direction for hexagon vertex `index`, starting at the top and going clockwise. */
export function hexagonUnitVector(index: number, sides = 6): Point {
  const angle = (Math.PI / 180) * (index * (360 / sides) - 90);
  return { x: Math.cos(angle), y: Math.sin(angle) };
}
