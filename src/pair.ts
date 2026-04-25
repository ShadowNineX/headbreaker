/**
 * @module pair
 *
 * Lightweight tuple-based 2D arithmetic helpers. Used throughout the model
 * to avoid allocating {@link Vector} objects when passing transient deltas.
 */

/**
 * A pair of numbers, typically representing a 2D delta or coordinate.
 *
 * @example
 * const p: Pair = [3, 4];
 */
export type Pair = [number, number];

/**
 * Returns whether the pair `(x, y)` is the zero pair `(0, 0)`.
 *
 * @param {number} x - First component.
 * @param {number} y - Second component.
 * @returns {boolean} `true` when both components are zero.
 */
export function isNull(x: number, y: number): boolean {
  return equal(x, y, 0, 0);
}

/**
 * Returns whether two pairs are equal, optionally allowing a tolerance `delta`
 * on each coordinate.
 *
 * @param {number} x1 - First component of pair A.
 * @param {number} y1 - Second component of pair A.
 * @param {number} x2 - First component of pair B.
 * @param {number} y2 - Second component of pair B.
 * @param {number} [delta] - Per-coordinate tolerance. Defaults to `0`.
 * @returns {boolean} `true` when both components differ by at most `delta`.
 */
export function equal(x1: number, y1: number, x2: number, y2: number, delta: number = 0): boolean {
  return Math.abs(x1 - x2) <= delta && Math.abs(y1 - y2) <= delta;
}

/**
 * Computes the component-wise difference `(x1 - x2, y1 - y2)`.
 *
 * @param {number} x1 - First component of pair A.
 * @param {number} y1 - Second component of pair A.
 * @param {number} x2 - First component of pair B.
 * @param {number} y2 - Second component of pair B.
 * @returns {Pair} A new pair containing the differences.
 */
export function diff(x1: number, y1: number, x2: number, y2: number): Pair {
  return [x1 - x2, y1 - y2];
}
