import type Canvas from './canvas';
import type { Figure } from './canvas';
import type { Outline } from './outline';
import type Piece from './piece';
import Painter from './painter';

/**
 * Headless {@link Painter} used in tests and non-DOM environments.
 *
 * It does not actually render anything; it just records on the canvas a tiny
 * accounting of how many figures were sketched and whether `draw` was called.
 */
export default class DummyPainter extends Painter {
  /**
   * Initializes the canvas's bookkeeping layer.
   *
   * @param {Canvas} canvas - The owning canvas.
   * @param {string} _id - Ignored.
   * @returns {void}
   */
  initialize(canvas: Canvas, _id: string): void {
    canvas._nullLayer = { drawn: false, figures: 0 };
  }

  /**
   * Marks the canvas as drawn.
   *
   * @param {Canvas} canvas - The owning canvas.
   * @returns {void}
   */
  draw(canvas: Canvas): void {
    canvas._nullLayer!.drawn = true;
  }

  /**
   * Increments the count of sketched figures.
   *
   * @param {Canvas} canvas - The owning canvas.
   * @param {Piece} _piece - Ignored.
   * @param {Figure} _figure - Ignored.
   * @param {Outline} _outline - Ignored.
   * @returns {void}
   */
  sketch(
    canvas: Canvas,
    _piece: Piece,
    _figure: Figure,
    _outline: Outline,
  ): void {
    canvas._nullLayer!.figures++;
  }
}
