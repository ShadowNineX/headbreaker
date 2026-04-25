import type Canvas from './canvas';
import type { Figure, Group } from './canvas';
import type { Outline } from './outline';
import type Piece from './piece';
import type Puzzle from './puzzle';
import type { Vector } from './vector';

/**
 * Callback invoked when a piece is dragged on the canvas.
 *
 * @param {number} dx - Drag delta on the x axis.
 * @param {number} dy - Drag delta on the y axis.
 * @returns {void}
 */
export type VectorAction = (dx: number, dy: number) => void;

/**
 * Generic no-argument callback (used for example for drag-end handlers).
 *
 * @returns {void}
 */
export type Action = () => void;

/**
 * Abstract rendering backend used by {@link Canvas}.
 *
 * The default `Painter` is a no-op base class. Concrete subclasses such as
 * {@link KonvaPainter} or {@link DummyPainter} override the relevant methods
 * to draw and react to user input.
 */
export default class Painter {
  /**
   * Resizes the underlying drawing surface.
   *
   * @param {Canvas} _canvas - The owning canvas.
   * @param {number} _width - New width in pixels.
   * @param {number} _height - New height in pixels.
   * @returns {void}
   */
  resize(_canvas: Canvas, _width: number, _height: number): void {
    // No-op: Override in subclass
  }

  /**
   * Initializes the renderer for a canvas, attaching it to the DOM element
   * with the given id.
   *
   * @param {Canvas} _canvas - The owning canvas.
   * @param {string} _id - DOM element id.
   * @returns {void}
   */
  initialize(_canvas: Canvas, _id: string): void {
    // No-op: Override in subclass
  }

  /**
   * Tears down and re-initializes the rendering surface in place.
   *
   * @param {Canvas} _canvas - The owning canvas.
   * @returns {void}
   */
  reinitialize(_canvas: Canvas): void {
    // No-op: Override in subclass
  }

  /**
   * Forces a redraw of the canvas.
   *
   * @param {Canvas} _canvas - The owning canvas.
   * @returns {void}
   */
  draw(_canvas: Canvas): void {
    // No-op: Override in subclass
  }

  /**
   * Applies a uniform scale factor to the canvas.
   *
   * @param {Canvas} _canvas - The owning canvas.
   * @param {Vector} _factor - Scale factor on each axis.
   * @returns {void}
   */
  scale(_canvas: Canvas, _factor: Vector): void {
    // No-op: Override in subclass
  }

  /**
   * Renders the geometry of a piece, populating its {@link Figure}.
   *
   * @param {Canvas} _canvas - The owning canvas.
   * @param {Piece} _piece - The piece to sketch.
   * @param {Figure} _figure - Output: the figure to populate.
   * @param {Outline} _outline - Outline used to compute the piece shape.
   * @returns {void}
   */
  sketch(
    _canvas: Canvas,
    _piece: Piece,
    _figure: Figure,
    _outline: Outline,
  ): void {
    // No-op: Override in subclass
  }

  /**
   * (Re)applies fill (color or image pattern) to a piece's figure.
   *
   * @param {Canvas} _canvas - The owning canvas.
   * @param {Piece} _piece - The piece whose figure to fill.
   * @param {Figure} _figure - The figure to update.
   * @returns {void}
   */
  fill(_canvas: Canvas, _piece: Piece, _figure: Figure): void {
    // No-op: Override in subclass
  }

  /**
   * Renders the optional text label of a piece.
   *
   * @param {Canvas} _canvas - The owning canvas.
   * @param {Piece} _piece - The piece whose label to render.
   * @param {Figure} _figure - The figure to update.
   * @returns {void}
   */
  label(_canvas: Canvas, _piece: Piece, _figure: Figure): void {
    // No-op: Override in subclass
  }

  /**
   * Translates the piece's visual group to match its model position.
   *
   * @param {Canvas} _canvas - The owning canvas.
   * @param {Group} _group - The piece's visual group.
   * @param {Piece} _piece - The piece model.
   * @returns {void}
   */
  physicalTranslate(_canvas: Canvas, _group: Group, _piece: Piece): void {
    // No-op: Override in subclass
  }

  /**
   * Updates the piece's model position to match its visual group.
   *
   * @param {Canvas} _canvas - The owning canvas.
   * @param {Piece} _piece - The piece model.
   * @param {Group} _group - The piece's visual group.
   * @returns {void}
   */
  logicalTranslate(_canvas: Canvas, _piece: Piece, _group: Group): void {
    // No-op: Override in subclass
  }

  /**
   * Subscribes `f` to drag-move events of `piece`'s visual group.
   *
   * @param {Canvas} _canvas - The owning canvas.
   * @param {Piece} _piece - The piece model.
   * @param {Group} _group - The piece's visual group.
   * @param {VectorAction} _f - The drag listener.
   * @returns {void}
   */
  onDrag(
    _canvas: Canvas,
    _piece: Piece,
    _group: Group,
    _f: VectorAction,
  ): void {
    // No-op: Override in subclass
  }

  /**
   * Subscribes `f` to drag-end events of `piece`'s visual group.
   *
   * @param {Canvas} _canvas - The owning canvas.
   * @param {Piece} _piece - The piece model.
   * @param {Group} _group - The piece's visual group.
   * @param {Action} _f - The drag-end listener.
   * @returns {void}
   */
  onDragEnd(_canvas: Canvas, _piece: Piece, _group: Group, _f: Action): void {
    // No-op: Override in subclass
  }

  /**
   * Registers keyboard gestures bound to puzzle-level actions.
   *
   * @param {Canvas} _canvas - The owning canvas.
   * @param {Record<string, (puzzle: Puzzle) => void>} _gestures - Map from
   *   keyboard key to a callback receiving the {@link Puzzle}.
   * @returns {void}
   */
  registerKeyboardGestures(
    _canvas: Canvas,
    _gestures: Record<string, (puzzle: Puzzle) => void>,
  ): void {
    // No-op: Override in subclass
  }
}
