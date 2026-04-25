/**
 * @module anchor
 *
 * Mutable 2D point used to express piece positions.
 */

import type { Vector } from './vector';
import { between } from './between';
import * as Pair from './pair';
import { vector } from './vector';

/**
 * A 2D point used to identify the position of a piece corner or its center.
 *
 * Anchors are mutable: methods like {@link Anchor#translate} update the point
 * in place, while methods like {@link Anchor#translated} return a new copy.
 */
export class Anchor {
  /** The x coordinate of the anchor. */
  x: number;
  /** The y coordinate of the anchor. */
  y: number;

  /**
   * @param {number} x - Initial x coordinate.
   * @param {number} y - Initial y coordinate.
   */
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /**
   * Whether this anchor has the same coordinates as `other`.
   *
   * @param {Anchor} other - Anchor to compare against.
   * @returns {boolean} `true` when both anchors share `x` and `y`.
   */
  equal(other: Anchor): boolean {
    return this.isAt(other.x, other.y);
  }

  /**
   * Whether this anchor is exactly at the point `(x, y)`.
   *
   * @param {number} x - Target x.
   * @param {number} y - Target y.
   * @returns {boolean} `true` when the anchor is at `(x, y)`.
   */
  isAt(x: number, y: number): boolean {
    return Pair.equal(this.x, this.y, x, y);
  }

  /**
   * Returns a new anchor offset from this one by `(dx, dy)`.
   *
   * @param {number} dx - Offset on the x axis.
   * @param {number} dy - Offset on the y axis.
   * @returns {Anchor} The new translated anchor.
   */
  translated(dx: number, dy: number): Anchor {
    return this.copy().translate(dx, dy);
  }

  /**
   * Mutates this anchor in place by `(dx, dy)` and returns it.
   *
   * @param {number} dx - Offset on the x axis.
   * @param {number} dy - Offset on the y axis.
   * @returns {this} This anchor, for chaining.
   */
  translate(dx: number, dy: number): this {
    this.x += dx;
    this.y += dy;
    return this;
  }

  /**
   * Whether this anchor is within `tolerance` (in each axis) of `other`.
   * Used by connectors to decide whether two pieces are close enough to snap.
   *
   * @param {Anchor} other - Anchor to compare against.
   * @param {number} tolerance - Maximum allowed per-axis distance.
   * @returns {boolean} `true` when the anchors are close enough.
   */
  closeTo(other: Anchor, tolerance: number): boolean {
    return between(this.x, other.x - tolerance, other.x + tolerance)
      && between(this.y, other.y - tolerance, other.y + tolerance);
  }

  /**
   * Returns an independent copy of this anchor.
   *
   * @returns {Anchor} A new anchor with the same coordinates.
   */
  copy(): Anchor {
    return new Anchor(this.x, this.y);
  }

  /**
   * Returns the component-wise difference `(this - other)` as a pair.
   *
   * @param {Anchor} other - The anchor to subtract.
   * @returns {Pair.Pair} The `[dx, dy]` difference.
   */
  diff(other: Anchor): Pair.Pair {
    return Pair.diff(this.x, this.y, other.x, other.y);
  }

  /**
   * Returns this anchor as a `[x, y]` pair.
   *
   * @returns {Pair.Pair} The coordinates as a tuple.
   */
  asPair(): Pair.Pair {
    return [this.x, this.y];
  }

  /**
   * Returns this anchor as a {@link Vector}.
   *
   * @returns {Vector} A new vector with the same coordinates.
   */
  asVector(): Vector {
    return vector(this.x, this.y);
  }

  /**
   * Serializes this anchor into a plain {@link Vector} object.
   *
   * @returns {Vector} A serializable copy.
   */
  export(): Vector {
    return this.asVector();
  }

  /**
   * Builds a new anchor at a random point inside `[0, maxX] × [0, maxY]`.
   *
   * @param {number} maxX - Upper bound on the x axis.
   * @param {number} maxY - Upper bound on the y axis.
   * @returns {Anchor} A randomly placed anchor.
   */
  static atRandom(maxX: number, maxY: number): Anchor {
    return new Anchor(Math.random() * maxX, Math.random() * maxY);
  }

  /**
   * Reconstructs an anchor from a serialized {@link Vector}.
   *
   * @param {Vector} v - The vector to import.
   * @returns {Anchor} The reconstructed anchor.
   */
  static import(v: Vector): Anchor {
    return anchor(v.x, v.y);
  }
}

/**
 * Convenience factory that builds a new {@link Anchor} at `(x, y)`.
 *
 * @param {number} x - The x coordinate.
 * @param {number} y - The y coordinate.
 * @returns {Anchor} A new anchor.
 */
export function anchor(x: number, y: number): Anchor {
  return new Anchor(x, y);
}
