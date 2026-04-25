/**
 * @module outline
 *
 * Geometry strategies that produce the silhouette of a piece. Pluggable on
 * {@link Canvas} via the `outline` constructor option.
 */

import type { Insert } from './insert';
import type Piece from './piece';
import type { Vector } from './vector';
import * as VectorModule from './vector';

function select<T>(insert: Insert, t: T, s: T, n: T): T {
  if (insert.isTab())
    return t;
  if (insert.isSlot())
    return s;
  return n;
}

function sl(p: Piece, t: number[], s: number[], n: number[]): number[] {
  return select(p.left, t, s, n);
}
function sr(p: Piece, t: number[], s: number[], n: number[]): number[] {
  return select(p.right, t, s, n);
}
function su(p: Piece, t: number[], s: number[], n: number[]): number[] {
  return select(p.up, t, s, n);
}
function sd(p: Piece, t: number[], s: number[], n: number[]): number[] {
  return select(p.down, t, s, n);
}

/**
 * Strategy that produces the polyline of a piece's silhouette as a flat
 * `[x0, y0, x1, y1, ...]` array.
 *
 * Used by the rendering layer to draw piece shapes.
 */
export interface Outline {
  /**
   * Computes the silhouette of `piece` at the given size.
   *
   * @param {Piece} piece - The piece to draw.
   * @param {Vector | number} [size] - Piece size (vector or scalar).
   * @param {Vector | number} [borderFill] - Optional inset to apply to borders.
   * @returns {number[]} Flat list of coordinates.
   */
  draw: (
    piece: Piece,
    size?: Vector | number,
    borderFill?: Vector | number,
  ) => number[];
  /**
   * Whether the polyline produced by {@link Outline.draw} should be rendered
   * as a Bezier curve (`true`) or as a tensioned line (`false`).
   *
   * @returns {boolean}
   */
  isBezier: () => boolean;
}

/**
 * Squared (rectangular) outline with simple in/out tabs and slots.
 *
 * @implements {Outline}
 */
export class Squared implements Outline {
  /**
   * @param {Piece} piece - The piece to draw.
   * @param {Vector | number} [size] - Piece size; defaults to `50` per axis.
   * @param {Vector | number} [borderFill] - Border inset; defaults to `0`.
   * @returns {number[]} The silhouette polyline.
   */
  draw(
    piece: Piece,
    size: Vector | number = 50,
    borderFill: Vector | number = 0,
  ): number[] {
    const sizeVector = VectorModule.cast(size);
    const offset = VectorModule.divide(
      VectorModule.multiply(borderFill, 5),
      sizeVector,
    );
    const selNum = (insert: Insert, t: number, s: number, n: number) =>
      select(insert, t, s, n);
    return [
      0 - offset.x,
      0 - offset.y,
      1,
      0 - offset.y,
      2,
      selNum(piece.up, -1 - offset.y, 1 - offset.y, 0 - offset.y),
      3,
      0 - offset.y,
      4 + offset.x,
      0 - offset.y,
      4 + offset.x,
      1,
      selNum(piece.right, 5 + offset.x, 3 + offset.x, 4 + offset.x),
      2,
      4 + offset.x,
      3,
      4 + offset.x,
      4 + offset.y,
      3,
      4 + offset.y,
      2,
      selNum(piece.down, 5 + offset.y, 3 + offset.y, 4 + offset.y),
      1,
      4 + offset.y,
      0 - offset.x,
      4 + offset.y,
      0 - offset.x,
      3,
      selNum(piece.left, -1 - offset.x, 1 - offset.x, 0 - offset.x),
      2,
      0 - offset.x,
      1,
    ].map(
      (it, index) => (it * (index % 2 === 0 ? sizeVector.x : sizeVector.y)) / 5,
    );
  }

  /** @returns {boolean} Always `false` — the squared outline is rendered as a tensioned line. */
  isBezier(): boolean {
    return false;
  }
}

/**
 * Rounded outline with curved tabs/slots and optional bezels at corners.
 *
 * @implements {Outline}
 */
export class Rounded implements Outline {
  /** Whether to apply the corner bezel where two `None` borders meet. */
  bezelize: boolean;
  /** Depth of the corner bezel as a fraction of the inner reference axis. */
  bezelDepth: number;
  /** Depth of the tab/slot insert as a fraction of the reference axis. */
  insertDepth: number;
  /** Length of the flat border on each side as a fraction of the full size. */
  borderLength: number;
  /** Optional axis used to compute the insert reference length. */
  referenceInsertAxis: { atVector: (v: Vector) => number } | null;

  /**
   * @param {object} [options] - Outline tunables.
   * @param {boolean} [options.bezelize] - Whether to bezel external corners.
   * @param {number} [options.bezelDepth] - Bezel depth fraction. Defaults to `2/5`.
   * @param {number} [options.insertDepth] - Insert depth fraction. Defaults to `4/5`.
   * @param {number} [options.borderLength] - Border length fraction. Defaults to `1/3`.
   * @param {{ atVector: (v: Vector) => number } | null} [options.referenceInsertAxis] -
   *   Optional axis used to compute the insert reference length.
   */
  constructor({
    bezelize = false,
    bezelDepth = 2 / 5,
    insertDepth = 4 / 5,
    borderLength = 1 / 3,
    referenceInsertAxis = null,
  }: {
    bezelize?: boolean;
    bezelDepth?: number;
    insertDepth?: number;
    borderLength?: number;
    referenceInsertAxis?: { atVector: (v: Vector) => number } | null;
  } = {}) {
    this.bezelize = bezelize;
    this.bezelDepth = bezelDepth;
    this.insertDepth = insertDepth;
    this.borderLength = borderLength;
    this.referenceInsertAxis = referenceInsertAxis;
  }

  /**
   * Returns the length used to derive the insert reference, on the configured
   * axis (or the smaller side when no axis is configured).
   *
   * @param {Vector} fullSize - The full piece size.
   * @returns {number} The reference length.
   */
  referenceInsertAxisLength(fullSize: Vector): number {
    return this.referenceInsertAxis
      ? this.referenceInsertAxis.atVector(fullSize)
      : VectorModule.inner.min(fullSize);
  }

  /**
   * @param {Piece} p - The piece to draw.
   * @param {Vector | number} [size] - Piece size; defaults to `150` per axis.
   * @param {Vector | number} [_borderFill] - Unused for rounded outlines.
   * @returns {number[]} The silhouette polyline.
   */
  draw(
    p: Piece,
    size: Vector | number = 150,
    _borderFill: Vector | number = 0,
  ): number[] {
    const fullSize = VectorModule.cast(size);
    const r
      = Math.trunc(
        this.referenceInsertAxisLength(fullSize)
        * (1 - 2 * this.borderLength)
        * 100,
      ) / 100;
    const s = VectorModule.divide(VectorModule.minus(fullSize, r), 2);
    const o = VectorModule.multiply(r, this.insertDepth);
    const b = VectorModule.multiply(VectorModule.inner.min(s), this.bezelDepth);

    const [b0, b1, b2, b3] = this.bezels(p);

    const nx = (c: boolean) => (c ? b.x : 0);
    const ny = (c: boolean) => (c ? b.y : 0);

    const rsy = r + s.y;
    const rsx = r + s.x;
    const r2sy = r + 2 * s.y;
    const r2sx = r + 2 * s.x;

    return [
      nx(b0),
      0,
      ...(b0 ? [0, 0, 0, 0, 0, b.y] : []),
      0,
      ny(b0),
      0,
      s.y,
      0,
      s.y,
      ...sl(p, [-o.x, s.y, -o.x, rsy], [o.x, s.y, o.x, rsy], [0, s.y, 0, rsy]),
      0,
      rsy,
      0,
      rsy,
      0,
      r2sy,
      0,
      r2sy - ny(b1),
      ...(b1 ? [0, r2sy, 0, r2sy, b.x, r2sy] : []),
      nx(b1),
      r2sy,
      s.x,
      r2sy,
      s.x,
      r2sy,
      ...sd(
        p,
        [s.x, r2sy + o.y, rsx, r2sy + o.y],
        [s.x, r2sy - o.y, rsx, r2sy - o.y],
        [s.x, r2sy, rsx, r2sy],
      ),
      rsx,
      r2sy,
      rsx,
      r2sy,
      r2sx,
      r2sy,
      r2sx - nx(b2),
      r2sy,
      ...(b2 ? [r2sx, r2sy, r2sx, r2sy, r2sx, r2sy - b.y] : []),
      r2sx,
      r2sy - ny(b2),
      r2sx,
      rsy,
      r2sx,
      rsy,
      ...sr(
        p,
        [r2sx + o.x, rsy, r2sx + o.x, s.y],
        [r2sx - o.x, rsy, r2sx - o.x, s.y],
        [r2sx, rsy, r2sx, s.y],
      ),
      r2sx,
      s.y,
      r2sx,
      s.y,
      r2sx,
      0,
      r2sx,
      ny(b3),
      ...(b3 ? [r2sx, 0, r2sx, 0, r2sx - b.x, 0] : []),
      r2sx - nx(b3),
      0,
      rsx,
      0,
      rsx,
      0,
      ...su(p, [rsx, -o.y, s.x, -o.y], [rsx, o.y, s.x, o.y], [rsx, 0, s.x, 0]),
      s.x,
      0,
      s.x,
      0,
      0,
      0,
      b0 ? b.x : 0,
      0,
    ];
  }

  /**
   * Returns which of the four corners (in `[NW, SW, SE, NE]` order) should be
   * bezeled, given the piece's inserts.
   *
   * @param {Piece} p - The piece.
   * @returns {boolean[]} Four-element array of bezel flags.
   */
  bezels(p: Piece): boolean[] {
    if (this.bezelize) {
      return [
        p.left.isNone() && p.up.isNone(),
        p.left.isNone() && p.down.isNone(),
        p.right.isNone() && p.down.isNone(),
        p.right.isNone() && p.up.isNone(),
      ];
    }
    return [false, false, false, false];
  }

  /** @returns {boolean} Always `true` — the rounded outline uses Bezier curves. */
  isBezier(): boolean {
    return true;
  }
}

/**
 * The default {@link Squared} outline used when no other outline is specified.
 *
 * @type {Outline}
 */
export const Classic = new Squared();
