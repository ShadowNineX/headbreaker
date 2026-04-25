/**
 * @module spatial-metadata
 *
 * Built-in spatial validators (relative position, absolute position, solved)
 * plus helpers for initializing piece spatial fields.
 */

import type Piece from './piece';
import type { PieceCondition, PuzzleCondition } from './validator';
import type { Vector } from './vector';
import { PuzzleValidator } from './validator';
import * as VectorModule from './vector';

/**
 * Subset of a piece's metadata used for spatial validation:
 * the target (final) position and the current (live) position.
 */
export interface SpatialMetadataFields {
  /** Where the piece is supposed to end up to be considered "solved". */
  targetPosition?: Vector;
  /** Where the piece currently is on the canvas. */
  currentPosition?: Vector;
}

/**
 * Returns the `(target - current)` difference for a piece.
 *
 * @param {Piece} piece - The piece to measure.
 * @returns {[number, number]} The difference as `[dx, dy]`.
 */
function diffToTarget(piece: Piece): [number, number] {
  return VectorModule.diff(
    piece.metadata.targetPosition,
    piece.centralAnchor!.asVector(),
  );
}

/**
 * Built-in {@link PuzzleCondition} that succeeds when every piece has the
 * same offset to its target — i.e. the puzzle is laid out correctly except,
 * possibly, for a global translation.
 *
 * @type {PuzzleCondition}
 */
export const relativePosition: PuzzleCondition = (puzzle) => {
  const diff0 = diffToTarget(puzzle.head);
  return puzzle.pieces.every(piece =>
    PuzzleValidator.equalDiffs(diff0, diffToTarget(piece)),
  );
};

/**
 * {@link PuzzleCondition} satisfied when the puzzle is in {@link relativePosition}
 * **and** every piece is connected.
 *
 * @type {PuzzleCondition}
 */
export const solved: PuzzleCondition = puzzle =>
  relativePosition(puzzle) && PuzzleValidator.connected(puzzle);

/**
 * {@link PieceCondition} satisfied when a piece sits exactly at its target
 * position.
 *
 * @type {PieceCondition}
 */
export const absolutePosition: PieceCondition = piece =>
  VectorModule.equal(
    piece.centralAnchor!.asVector(),
    piece.metadata.targetPosition,
  );

/**
 * Initializes the spatial fields of `metadata` if they are missing:
 * `targetPosition` defaults to `target`, and `currentPosition` defaults to
 * `current` (or a copy of the resolved target).
 *
 * @param {SpatialMetadataFields} metadata - The metadata object to populate.
 * @param {Vector} target - Default target position.
 * @param {Vector} [current] - Default current position.
 * @returns {void}
 */
export function initialize(
  metadata: SpatialMetadataFields,
  target: Vector,
  current?: Vector,
): void {
  metadata.targetPosition = metadata.targetPosition || target;
  metadata.currentPosition
    = metadata.currentPosition
      || current
      || VectorModule.copy(metadata.targetPosition);
}
