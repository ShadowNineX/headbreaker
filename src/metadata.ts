/**
 * @module metadata
 *
 * Helpers for working with free-form piece/canvas metadata bags.
 */

/**
 * Creates a deep, structured copy of any metadata object.
 *
 * Uses `structuredClone`, so it preserves nested objects, arrays, and most
 * built-in types, while breaking shared references with the original.
 *
 * @template T
 * @param {T} metadata - The value to copy.
 * @returns {T} A deep clone of `metadata`.
 *
 * @example
 * const original = { id: 1, label: { text: 'A' } };
 * const cloned = copy(original);
 * cloned.label.text = 'B';
 * // original.label.text is still 'A'
 */
export function copy<T>(metadata: T): T {
  return structuredClone(metadata);
}
