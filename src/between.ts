/**
 * Returns whether `value` falls within the inclusive range `[min, max]`.
 *
 * @param {number} value - The value to test.
 * @param {number} min - Lower bound (inclusive).
 * @param {number} max - Upper bound (inclusive).
 * @returns {boolean} `true` if `min <= value <= max`.
 */
export function between(value: number, min: number, max: number): boolean {
  return min <= value && value <= max;
}
