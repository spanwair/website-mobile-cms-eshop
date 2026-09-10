// Integer haléře (Kč x 100) arithmetic -- convert at the I/O boundary only, do chained
// add/subtract/multiply in haléře so float rounding never compounds across a calculation.

export function kcToHaleru(kc: number): number {
  return Math.round(kc * 100);
}

export function haleruToKc(haleru: number): number {
  return haleru / 100;
}
