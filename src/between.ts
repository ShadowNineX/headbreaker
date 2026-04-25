/**
 * @module between
 *
 * Tiny range-check helper kept separate from larger math modules so it can be
 * imported with no side effects.
 */

/**
 * Returns whether `value` falls within the inclusive range `[min, max]`.
 *
 * @param {number} value - The value to test.
 * @param {number} min - Lower bound (inclusive).
 * @param {number} max - Upper bound (inclusive).
 * @returns {boolean} `true` if `min <= value <= max`.
 *
 * @example
 * between(5, 0, 10); // true
 * between(15, 0, 10); // false
 */
export function between(value: number, min: number, max: number): boolean {
  return min <= value && value <= max;
}
