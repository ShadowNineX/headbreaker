/**
 * @module size
 *
 * Helpers for representing piece sizes as a redundant `radius` + `diameter`
 * pair, so consumers can read whichever they need without recomputing.
 */

import type { Vector } from './vector';
import * as VectorModule from './vector';

/**
 * The size of a piece, expressed as both a `radius` (half the size from the
 * center to an edge) and a `diameter` (full size).
 */
export interface Size {
  /** Half the piece size on each axis. */
  radius: Vector;
  /** Full piece size on each axis. */
  diameter: Vector;
}

/**
 * Builds a {@link Size} from a `radius` value (vector or scalar). The
 * resulting diameter is twice the radius on each axis.
 *
 * @param {Vector | number} value - Radius as a vector, or as a scalar applied
 *   to both axes.
 * @returns {Size} The matching `Size`.
 *
 * @example
 * radius(50); // { radius: {x: 50, y: 50}, diameter: {x: 100, y: 100} }
 */
export function radius(value: Vector | number): Size {
  const v = VectorModule.cast(value);
  return {
    radius: v,
    diameter: VectorModule.multiply(v, 2),
  };
}

/**
 * Builds a {@link Size} from a `diameter` value (vector or scalar). The
 * resulting radius is half the diameter on each axis.
 *
 * @param {Vector | number} value - Diameter as a vector, or as a scalar
 *   applied to both axes.
 * @returns {Size} The matching `Size`.
 *
 * @example
 * diameter(100); // { radius: {x: 50, y: 50}, diameter: {x: 100, y: 100} }
 */
export function diameter(value: Vector | number): Size {
  const v = VectorModule.cast(value);
  return {
    radius: VectorModule.multiply(v, 0.5),
    diameter: v,
  };
}
