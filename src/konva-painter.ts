/**
 * @module konva-painter
 *
 * Concrete {@link Painter} backed by [Konva.js](https://konvajs.org). Drives
 * piece drawing, dragging, fills, labels, scaling and keyboard gestures.
 */

import type Canvas from './canvas';
import type { Figure, Group } from './canvas';
import type { Outline } from './outline';
import type { Action, VectorAction } from './painter';
import type Piece from './piece';
import type Puzzle from './puzzle';
import type { Vector } from './vector';
import Konva from 'konva';
import Painter from './painter';
import * as Pair from './pair';
import * as VectorModule from './vector';
import { vector } from './vector';

function currentPositionDiff(model: Piece, group: Group): Pair.Pair {
  return Pair.diff(
    group.x(),
    group.y(),
    model.metadata.currentPosition.x,
    model.metadata.currentPosition.y,
  );
}

/**
 * Concrete {@link Painter} backed by Konva.js. Draws pieces, supports
 * dragging, image filling, labels, scaling, and keyboard gestures.
 *
 * @extends {Painter}
 */
export default class KonvaPainter extends Painter {
  /**
   * Builds a Konva stage and primary layer on the DOM element identified by `id`.
   *
   * @override
   * @param {Canvas} canvas - The owning canvas.
   * @param {string} id - DOM container id.
   * @returns {void}
   */
  initialize(canvas: Canvas, id: string): void {
    const stage = new Konva.Stage({
      container: id,
      width: canvas.width,
      height: canvas.height,
      draggable: !canvas.fixed,
    });
    this._initializeLayer(stage, canvas);
  }

  private _initializeLayer(stage: Konva.Stage, canvas: Canvas): void {
    const layer = new Konva.Layer();
    stage.add(layer);
    canvas._konvaLayer = layer;
  }

  /**
   * Triggers a Konva layer redraw.
   *
   * @override
   * @param {Canvas} canvas - The owning canvas.
   * @returns {void}
   */
  draw(canvas: Canvas): void {
    canvas._konvaLayer!.draw();
  }

  /**
   * Destroys the current layer and creates a new empty one on the same stage.
   *
   * @override
   * @param {Canvas} canvas - The owning canvas.
   * @returns {void}
   */
  reinitialize(canvas: Canvas): void {
    const layer = canvas._konvaLayer!;
    const stage = layer.getStage();
    layer.destroy();
    this._initializeLayer(stage, canvas);
  }

  /**
   * Resizes the underlying Konva stage.
   *
   * @override
   * @param {Canvas} canvas - The owning canvas.
   * @param {number} width - New width in pixels.
   * @param {number} height - New height in pixels.
   * @returns {void}
   */
  resize(canvas: Canvas, width: number, height: number): void {
    const layer = canvas._konvaLayer!;
    const stage = layer.getStage();
    stage.width(width);
    stage.height(height);
  }

  /**
   * Applies a 2D scale to the Konva stage.
   *
   * @override
   * @param {Canvas} canvas - The owning canvas.
   * @param {Vector} factor - Scale factor on each axis.
   * @returns {void}
   */
  scale(canvas: Canvas, factor: Vector): void {
    canvas._konvaLayer!.getStage().scale(factor);
  }

  /**
   * Builds the Konva group + line shape that visually represents `piece` and
   * adds it to the layer.
   *
   * @override
   * @param {Canvas} canvas - The owning canvas.
   * @param {Piece} piece - The piece to render.
   * @param {Figure} figure - Output figure populated with `group` and `shape`.
   * @param {Outline} outline - Outline used to compute the piece geometry.
   * @returns {void}
   */
  sketch(canvas: Canvas, piece: Piece, figure: Figure, outline: Outline): void {
    figure.group = new Konva.Group({
      x: piece.metadata.currentPosition.x,
      y: piece.metadata.currentPosition.y,
      draggable: !piece.metadata.fixed,
      dragBoundFunc: canvas.preventOffstageDrag
        ? (position: Vector) => {
            const furthermost = VectorModule.minus(
              vector(canvas.width, canvas.height),
              piece.size.radius,
            );
            return VectorModule.max(
              VectorModule.min(position, furthermost),
              piece.size.radius,
            );
          }
        : undefined,
    });

    figure.shape = new Konva.Line({
      points: outline.draw(piece, piece.diameter, canvas.borderFill),
      bezier: outline.isBezier(),
      tension: outline.isBezier() ? undefined : canvas.lineSoftness,
      stroke: piece.metadata.strokeColor || canvas.strokeColor,
      strokeWidth: canvas.strokeWidth,
      closed: true,
      ...VectorModule.multiply(piece.radius, -1),
    });
    this.fill(canvas, piece, figure);
    figure.group.add(figure.shape);
    canvas._konvaLayer!.add(figure.group);
  }

  /**
   * Applies the configured fill (image pattern or color) to the piece's shape.
   *
   * @override
   * @param {Canvas} canvas - The owning canvas.
   * @param {Piece} piece - The piece whose figure to fill.
   * @param {Figure} figure - The figure to update.
   * @returns {void}
   */
  fill(canvas: Canvas, piece: Piece, figure: Figure): void {
    const image = canvas.imageMetadataFor(piece);
    figure.shape?.fill(image ? null : piece.metadata.color || 'black');
    figure.shape?.fillPatternImage(image?.content);
    figure.shape?.fillPatternScale(
      image?.scale ? { x: image.scale, y: image.scale } : undefined,
    );
    figure.shape?.fillPatternOffset(
      image ? VectorModule.divide(image.offset!, image.scale!) : undefined,
    );
  }

  /**
   * Adds a Konva text node to the piece's group, using the piece's label metadata.
   *
   * @override
   * @param {Canvas} _canvas - The owning canvas.
   * @param {Piece} piece - The piece whose label to render.
   * @param {Figure} figure - The figure to update.
   * @returns {void}
   */
  label(_canvas: Canvas, piece: Piece, figure: Figure): void {
    figure.label = new Konva.Text({
      ...VectorModule.minus(
        {
          x: piece.metadata.label.x || figure.group!.width() / 2,
          y: piece.metadata.label.y || figure.group!.height() / 2,
        },
        piece.radius,
      ),
      text: piece.metadata.label.text,
      fontSize: piece.metadata.label.fontSize,
      fontFamily: piece.metadata.label.fontFamily || 'Sans Serif',
      fill: piece.metadata.label.color || 'white',
    });
    figure.group!.add(figure.label);
  }

  /**
   * Moves the Konva group to the model's central anchor.
   *
   * @override
   * @param {Canvas} _canvas - The owning canvas.
   * @param {Group} group - The piece's visual group.
   * @param {Piece} piece - The piece model.
   * @returns {void}
   */
  physicalTranslate(_canvas: Canvas, group: Group, piece: Piece): void {
    group.x(piece.centralAnchor!.x);
    group.y(piece.centralAnchor!.y);
  }

  /**
   * Updates the piece's `currentPosition` metadata to match the Konva group.
   *
   * @override
   * @param {Canvas} _canvas - The owning canvas.
   * @param {Piece} piece - The piece model.
   * @param {Group} group - The piece's visual group.
   * @returns {void}
   */
  logicalTranslate(_canvas: Canvas, piece: Piece, group: Group): void {
    VectorModule.update(piece.metadata.currentPosition, group.x(), group.y());
  }

  /**
   * Wires up Konva drag-move and hover events for `piece`.
   *
   * @override
   * @param {Canvas} canvas - The owning canvas.
   * @param {Piece} piece - The piece model.
   * @param {Group} group - The piece's visual group.
   * @param {VectorAction} f - Listener invoked with the per-frame drag delta.
   * @returns {void}
   */
  onDrag(canvas: Canvas, piece: Piece, group: Group, f: VectorAction): void {
    group.on('mouseover', () => {
      document.body.style.cursor = 'pointer';
    });
    group.on('mouseout', () => {
      document.body.style.cursor = 'default';
    });
    group.on('dragmove', () => {
      const [dx, dy] = currentPositionDiff(piece, group);
      group.zIndex(canvas.figuresCount - 1);
      f(dx, dy);
    });
  }

  /**
   * Wires up the Konva drag-end event for `piece`.
   *
   * @override
   * @param {Canvas} _canvas - The owning canvas.
   * @param {Piece} _piece - The piece model.
   * @param {Group} group - The piece's visual group.
   * @param {Action} f - Listener invoked once when the drag ends.
   * @returns {void}
   */
  onDragEnd(_canvas: Canvas, _piece: Piece, group: Group, f: Action): void {
    group.on('dragend', () => {
      f();
    });
  }

  /**
   * Registers keydown/keyup gestures on the Konva container.
   *
   * @override
   * @param {Canvas} canvas - The owning canvas.
   * @param {Record<string, (puzzle: Puzzle) => void>} gestures - Map from
   *   keyboard key to a callback receiving the {@link Puzzle}.
   * @returns {void}
   */
  registerKeyboardGestures(
    canvas: Canvas,
    gestures: Record<string, (puzzle: Puzzle) => void>,
  ): void {
    const container = canvas._konvaLayer!.getStage().container();
    container.tabIndex = -1;
    this._registerKeyDown(canvas, container, gestures);
    this._registerKeyUp(canvas, container, gestures);
  }

  private _registerKeyDown(
    canvas: Canvas,
    container: HTMLDivElement,
    gestures: Record<string, (puzzle: Puzzle) => void>,
  ): void {
    container.addEventListener('keydown', (e: KeyboardEvent) => {
      for (const key in gestures) {
        if (e.key === key) {
          gestures[key](canvas.puzzle);
        }
      }
    });
  }

  private _registerKeyUp(
    canvas: Canvas,
    container: HTMLDivElement,
    gestures: Record<string, (puzzle: Puzzle) => void>,
  ): void {
    container.addEventListener('keyup', (e: KeyboardEvent) => {
      for (const key in gestures) {
        if (e.key === key) {
          canvas.puzzle.tryDisconnectionWhileDragging();
        }
      }
    });
  }
}
