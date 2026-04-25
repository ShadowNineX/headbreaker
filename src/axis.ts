/**
 * @module axis
 *
 * Strategy objects that abstract over 1D axes (horizontal / vertical), used
 * for axis-agnostic image-fitting and layout helpers.
 */

import type { Vector } from './vector';

/**
 * Strategy describing how to extract a 1D coordinate from 2D vectors and sizes.
 *
 * Used by puzzle-fitting code that needs to operate generically over either
 * the horizontal or the vertical axis.
 */
export interface Axis {
  /**
   * Returns the coordinate of `vector` along this axis.
   *
   * @param {Vector} vector - The 2D vector to project.
   * @returns {number} The component on this axis.
   */
  atVector: (vector: Vector) => number;
  /**
   * Returns the size of `image` along this axis (its `width` or `height`).
   *
   * @param {{ width: number, height: number }} image - An image-like object.
   * @returns {number} The dimension on this axis.
   */
  atDimension: (image: { width: number; height: number }) => number;
}

/**
 * Vertical axis: reads `y` from vectors and `height` from image-like objects.
 *
 * @type {Axis}
 */
export const Vertical: Axis = {
  atVector(vector: Vector): number {
    return vector.y;
  },
  atDimension(image: { width: number; height: number }): number {
    return image.height;
  },
};

/**
 * Horizontal axis: reads `x` from vectors and `width` from image-like objects.
 *
 * @type {Axis}
 */
export const Horizontal: Axis = {
  atVector(vector: Vector): number {
    return vector.x;
  },
  atDimension(image: { width: number; height: number }): number {
    return image.width;
  },
};
