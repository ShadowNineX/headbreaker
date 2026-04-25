/**
 * @module shuffler
 *
 * Pluggable layout strategies that move pieces around the canvas. Used by
 * {@link Puzzle#shuffleWith} and the various `shuffle*` methods on {@link Canvas}.
 */

import type Piece from './piece';
import type { Vector } from './vector';
import { Anchor } from './anchor';

/**
 * A function that maps a list of pieces to a list of destination positions
 * of the same length.
 *
 * @callback Shuffler
 * @param {Piece[]} pieces - The pieces to shuffle.
 * @returns {Vector[]} New positions, one per piece.
 *
 * @example
 * // A shuffler that stacks every piece at the origin
 * const stack: Shuffler = pieces => pieces.map(() => ({ x: 0, y: 0 }));
 */
export type Shuffler = (pieces: Piece[]) => Vector[];

/**
 * Picks a uniformly random index of `list`.
 *
 * @param {unknown[]} list - The list to sample.
 * @returns {number} A valid index in `[0, list.length - 1]`.
 */
function sampleIndex(list: unknown[]): number {
  return Math.round(Math.random() * (list.length - 1));
}

/**
 * Builds a {@link Shuffler} that places every piece at a random point inside
 * the rectangle `[0, maxX] × [0, maxY]`.
 *
 * @param {number} maxX - Upper bound on the x axis.
 * @param {number} maxY - Upper bound on the y axis.
 * @returns {Shuffler} The shuffler.
 */
export function random(maxX: number, maxY: number): Shuffler {
  return pieces => pieces.map(_it => Anchor.atRandom(maxX, maxY));
}

/**
 * Permutes the pieces' positions uniformly at random while keeping the set
 * of grid cells unchanged.
 *
 * @type {Shuffler}
 */
export const grid: Shuffler = (pieces) => {
  const destinations = pieces.map(it => it.centralAnchor!.asVector());
  for (let i = 0; i < destinations.length; i++) {
    const j = sampleIndex(destinations);
    const temp = destinations[j];
    destinations[j] = destinations[i];
    destinations[i] = temp;
  }
  return destinations;
};

/**
 * Permutes pieces inside each column independently, leaving columns intact.
 *
 * @type {Shuffler}
 */
export const columns: Shuffler = (pieces) => {
  const destinations = pieces.map(it => it.centralAnchor!.asVector());
  const columnsMap = new Map<number, Vector[]>();

  for (const destination of destinations) {
    if (!columnsMap.get(destination.x)) {
      columnsMap.set(
        destination.x,
        destinations.filter(it => it.x === destination.x),
      );
    }
    const column = columnsMap.get(destination.x)!;
    const j = sampleIndex(column);
    const temp = column[j].y;
    column[j].y = destination.y;
    destination.y = temp;
  }
  return destinations;
};

/**
 * Lays out the pieces along a single horizontal line, splitting the puzzle
 * roughly in half around its horizontal pivot.
 *
 * @type {Shuffler}
 */
export const line: Shuffler = (pieces) => {
  const destinations = pieces.map(it => it.centralAnchor!.asVector());
  const cols = new Set(destinations.map(it => it.x));
  const maxX = Math.max(...cols);
  const minX = Math.min(...cols);
  const width = (maxX - minX) / (cols.size - 1);
  const pivotX = minX + width / 2;

  const lineLength = destinations.length * width;
  const linePivot = destinations.filter(it => it.x < pivotX).length * width;

  const init: number[] = [];
  const tail: number[] = [];

  for (let i = 0; i < linePivot; i += width) {
    init.push(i);
  }
  for (let i = init[init.length - 1] + width; i < lineLength; i += width) {
    tail.push(i);
  }

  for (const destination of destinations) {
    const source = destination.x < pivotX ? init : tail;
    const index = sampleIndex(source);
    destination.y = 0;
    destination.x = source[index];
    source.splice(index, 1);
  }
  return destinations;
};

/**
 * Builds a {@link Shuffler} that adds horizontal and vertical padding between
 * the pieces of an `width × height` grid.
 *
 * @param {number} padding - Padding added per step.
 * @param {number} width - Number of columns in the grid.
 * @param {number} height - Number of rows in the grid.
 * @returns {Shuffler} The padding shuffler.
 */
export function padder(
  padding: number,
  width: number,
  height: number,
): Shuffler {
  return (pieces) => {
    const destinations = pieces.map(it => it.centralAnchor!.asVector());
    let dx = 0;
    let dy = 0;
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        const destination = destinations[i + width * j];
        destination.x += dx;
        destination.y += dy;
        dx += padding;
      }
      dx = 0;
      dy += padding;
    }
    return destinations;
  };
}

/**
 * Builds a {@link Shuffler} that adds bounded random noise to each piece
 * position. Each axis is perturbed by up to `±maxDistance` on that axis.
 *
 * @param {Vector} maxDistance - Maximum displacement per axis.
 * @returns {Shuffler} The noise shuffler.
 */
export function noise(maxDistance: Vector): Shuffler {
  return (pieces) => {
    return pieces.map(it =>
      Anchor.atRandom(2 * maxDistance.x, 2 * maxDistance.y)
        .translate(-maxDistance.x, -maxDistance.y)
        .translate(it.centralAnchor!.x, it.centralAnchor!.y)
        .asVector(),
    );
  };
}

/**
 * Identity {@link Shuffler}: returns each piece's current position unchanged.
 *
 * @type {Shuffler}
 */
export const noop: Shuffler = pieces => pieces.map(it => it.centralAnchor!);
