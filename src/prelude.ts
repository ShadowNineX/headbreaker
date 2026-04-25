/**
 * @module prelude
 *
 * Tiny utility helpers reused across the library. These are intentionally
 * dependency-free.
 */

/**
 * A value organized along the four orthogonal directions of a piece:
 * `up`, `down`, `left`, `right`.
 *
 * @template A - Type stored at each direction.
 */
export interface Orthogonal<A> {
  up: A;
  down: A;
  left: A;
  right: A;
}

/**
 * Generic mapper from an input of type `A` to an output of type `B`.
 *
 * @template A - Input type.
 * @template B - Output type.
 */
export type Mapper<A, B> = (value: A) => B;

/**
 * Returns the pair `[one, other]` ordered according to the `back` flag:
 * if `back` is false (default) the order is swapped to `[other, one]`.
 *
 * Used by connection logic to choose which of two pieces should move.
 *
 * @template T
 * @param {T} one - First element.
 * @param {T} other - Second element.
 * @param {boolean} [back] - Whether to keep the natural order. Defaults to `false`.
 * @returns {[T, T]} The (possibly swapped) pair.
 */
export function pivot<T>(one: T, other: T, back: boolean = false): [T, T] {
  return back ? [one, other] : [other, one];
}

/**
 * Maps each value of an array, substituting null/undefined entries with
 * `replacement` before mapping. Entries that remain null/undefined after
 * substitution are passed through unchanged.
 *
 * @template A - Input element type.
 * @template B - Output element type.
 * @param {(A | null | undefined)[]} values - The array to map.
 * @param {Mapper<A, B>} mapper - Function applied to each non-null value.
 * @param {A | null} [replacement] - Default value for null/undefined entries. Defaults to `null`.
 * @returns {(B | null | undefined)[]} The mapped array.
 */
export function orthogonalMap<A, B>(
  values: (A | null | undefined)[],
  mapper: Mapper<A, B>,
  replacement: A | null = null,
): (B | null | undefined)[] {
  return values.map((it) => {
    const value = it ?? replacement;
    return value ? mapper(value as A) : (value as null | undefined);
  });
}

/**
 * Maps a 4-element array `[right, down, left, up]` into an
 * {@link Orthogonal} object using {@link orthogonalMap}.
 *
 * @template A - Input element type.
 * @template B - Output element type.
 * @param {(A | null | undefined)[]} values - The 4-element input array.
 * @param {Mapper<A, B>} mapper - Function applied to each non-null value.
 * @param {A | null} [replacement] - Default value for null/undefined entries. Defaults to `null`.
 * @returns {Orthogonal<B | null | undefined>} The orthogonal record of mapped values.
 */
export function orthogonalTransform<A, B>(
  values: (A | null | undefined)[],
  mapper: Mapper<A, B>,
  replacement: A | null = null,
): Orthogonal<B | null | undefined> {
  const [right, down, left, up] = orthogonalMap(values, mapper, replacement);
  return { right, down, left, up };
}

/**
 * The identity function: returns its argument unchanged.
 *
 * @template A
 * @param {A} arg - The value to return.
 * @returns {A} The unchanged argument.
 */
export function itself<A>(arg: A): A {
  return arg;
}
