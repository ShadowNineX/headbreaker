import * as Pair from './pair';

/**
 * A 2D point or vector with `x` and `y` coordinates.
 */
export interface Vector {
  x: number;
  y: number;
}

/**
 * Creates a {@link Vector} with the given coordinates.
 *
 * @param {number} x - The x coordinate.
 * @param {number} y - The y coordinate.
 * @returns {Vector} A new vector.
 */
export function vector(x: number, y: number): Vector {
  return { x, y };
}

/**
 * Coerces a vector-like value into a {@link Vector}.
 *
 * - `null`/`undefined` becomes `(0, 0)`.
 * - A number `n` becomes `(n, n)`.
 * - An existing vector is returned as-is (no copy).
 *
 * @param {Vector | number | null | undefined} value - The value to coerce.
 * @returns {Vector} The resulting vector.
 */
export function cast(value: Vector | number | null | undefined): Vector {
  if (value == null) {
    return vector(0, 0);
  }
  if (typeof value === 'number') {
    return vector(value, value);
  }
  return value;
}

/**
 * Returns a fresh zero vector `(0, 0)`.
 *
 * @returns {Vector} A new zero vector.
 */
export function zero(): Vector {
  return vector(0, 0);
}

/**
 * Returns whether two vectors have equal coordinates, optionally allowing a
 * tolerance `delta` on each axis.
 *
 * @param {Vector} one - First vector.
 * @param {Vector} other - Second vector.
 * @param {number} [delta] - Per-axis tolerance. Defaults to `0`.
 * @returns {boolean} `true` when both axes differ by at most `delta`.
 */
export function equal(one: Vector, other: Vector, delta: number = 0): boolean {
  return Pair.equal(one.x, one.y, other.x, other.y, delta);
}

/**
 * Returns a shallow copy of the given vector.
 *
 * @param {Vector} v - The vector to copy.
 * @returns {Vector} A new vector with the same coordinates.
 */
export function copy({ x, y }: Vector): Vector {
  return { x, y };
}

/**
 * Mutates `v` in place, setting its coordinates to `(x, y)`.
 *
 * @param {Vector} v - The vector to mutate.
 * @param {number} x - The new x coordinate.
 * @param {number} y - The new y coordinate.
 * @returns {void}
 */
export function update(v: Vector, x: number, y: number): void {
  v.x = x;
  v.y = y;
}

/**
 * Returns the component-wise difference `(one.x - other.x, one.y - other.y)`
 * as a {@link Pair.Pair}.
 *
 * @param {Vector} one - Minuend vector.
 * @param {Vector} other - Subtrahend vector.
 * @returns {Pair.Pair} The difference as a `[dx, dy]` pair.
 */
export function diff(one: Vector, other: Vector): Pair.Pair {
  return Pair.diff(one.x, one.y, other.x, other.y);
}

/**
 * Component-wise multiplication of two vector-like values.
 *
 * @param {Vector | number} one - First operand.
 * @param {Vector | number} other - Second operand.
 * @returns {Vector} Their component-wise product.
 */
export function multiply(one: Vector | number, other: Vector | number): Vector {
  return apply(one, other, (v1, v2) => v1 * v2);
}

/**
 * Component-wise division of two vector-like values.
 *
 * @param {Vector | number} one - Dividend.
 * @param {Vector | number} other - Divisor.
 * @returns {Vector} Their component-wise quotient.
 */
export function divide(one: Vector | number, other: Vector | number): Vector {
  return apply(one, other, (v1, v2) => v1 / v2);
}

/**
 * Component-wise addition of two vector-like values.
 *
 * @param {Vector | number} one - First operand.
 * @param {Vector | number} other - Second operand.
 * @returns {Vector} Their component-wise sum.
 */
export function plus(one: Vector | number, other: Vector | number): Vector {
  return apply(one, other, (v1, v2) => v1 + v2);
}

/**
 * Component-wise subtraction of two vector-like values.
 *
 * @param {Vector | number} one - Minuend.
 * @param {Vector | number} other - Subtrahend.
 * @returns {Vector} Their component-wise difference.
 */
export function minus(one: Vector | number, other: Vector | number): Vector {
  return apply(one, other, (v1, v2) => v1 - v2);
}

/**
 * Component-wise minimum of two vector-like values.
 *
 * @param {Vector | number} one - First operand.
 * @param {Vector | number} other - Second operand.
 * @returns {Vector} The component-wise minimum.
 */
export function min(one: Vector | number, other: Vector | number): Vector {
  return apply(one, other, Math.min);
}

/**
 * Component-wise maximum of two vector-like values.
 *
 * @param {Vector | number} one - First operand.
 * @param {Vector | number} other - Second operand.
 * @returns {Vector} The component-wise maximum.
 */
export function max(one: Vector | number, other: Vector | number): Vector {
  return apply(one, other, Math.max);
}

/**
 * Combines two vector-like values component-wise using the binary operator `f`.
 * Numbers are first coerced to vectors via {@link cast}.
 *
 * @param {Vector | number} one - First operand.
 * @param {Vector | number} other - Second operand.
 * @param {(a: number, b: number) => number} f - Binary operator applied per axis.
 * @returns {Vector} The combined vector.
 */
export function apply(one: Vector | number, other: Vector | number, f: (a: number, b: number) => number): Vector {
  const first = cast(one);
  const second = cast(other);
  return { x: f(first.x, second.x), y: f(first.y, second.y) };
}

/**
 * Helpers that combine the two coordinates of a single vector into a scalar.
 */
export const inner = {
  /**
   * Returns the smaller of `one.x` and `one.y`.
   *
   * @param {Vector} one - The vector.
   * @returns {number} `min(one.x, one.y)`.
   */
  min(one: Vector): number {
    return this.apply(one, Math.min);
  },

  /**
   * Returns the larger of `one.x` and `one.y`.
   *
   * @param {Vector} one - The vector.
   * @returns {number} `max(one.x, one.y)`.
   */
  max(one: Vector): number {
    return this.apply(one, Math.max);
  },

  /**
   * Combines `one.x` and `one.y` into a scalar using the binary operator `f`.
   *
   * @param {Vector} one - The vector.
   * @param {(a: number, b: number) => number} f - Binary operator.
   * @returns {number} `f(one.x, one.y)`.
   */
  apply(one: Vector, f: (a: number, b: number) => number): number {
    return f(one.x, one.y);
  },
};
