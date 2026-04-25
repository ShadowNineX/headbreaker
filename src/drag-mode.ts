/**
 * @module drag-mode
 *
 * Strategies that decide whether dragging a piece should disconnect it from
 * its neighbours. Pluggable on {@link Puzzle#dragMode}.
 */

import type Piece from './piece';

/**
 * Strategy that decides whether dragging a piece should disconnect it from
 * its neighbours.
 */
export interface DragMode {
  /**
   * @param {Piece} piece - The piece being dragged.
   * @param {number} dx - Drag delta on the x axis.
   * @param {number} dy - Drag delta on the y axis.
   * @returns {boolean} `true` if the piece should disconnect for this drag.
   */
  dragShouldDisconnect: (piece: Piece, dx: number, dy: number) => boolean;
}

/**
 * Default drag mode: disconnect only if the drag direction is unobstructed by
 * existing connections on both axes.
 *
 * @type {DragMode}
 */
export const TryDisconnection: DragMode = {
  dragShouldDisconnect(piece: Piece, dx: number, dy: number): boolean {
    return piece.horizontalConnector.openMovement(piece, dx)
      && piece.verticalConnector.openMovement(piece, dy);
  },
};

/**
 * Drag mode that always disconnects the piece on drag.
 *
 * @type {DragMode}
 */
export const ForceDisconnection: DragMode = {
  dragShouldDisconnect(_piece: Piece, _dx: number, _dy: number): boolean {
    return true;
  },
};

/**
 * Drag mode that never disconnects the piece on drag, dragging connected
 * pieces along instead.
 *
 * @type {DragMode}
 */
export const ForceConnection: DragMode = {
  dragShouldDisconnect(_piece: Piece, _dx: number, _dy: number): boolean {
    return false;
  },
};
