/**
 * @module canvas
 *
 * The visual layer of a puzzle. {@link Canvas} owns a {@link Puzzle},
 * a {@link Painter} and the set of {@link Figure}s rendered for each piece,
 * and exposes a friendly API to draw, shuffle and validate the puzzle.
 */

import type Konva from 'konva';
import type { Axis } from './axis';
import type { ConnectionRequirement } from './connector';
import type {
  ImageLike,
  ImageMetadata as ImageMetadataType,
} from './image-metadata';
import type { Outline } from './outline';
import type { LabelMetadata, PieceMetadata } from './piece';
import type Piece from './piece';
import type { InsertsGenerator } from './sequence';
import type { Size } from './size';
import type { ValidationListener, Validator } from './validator';
import type { Vector } from './vector';
import { Horizontal, Vertical } from './axis';
import * as ImageMetadata from './image-metadata';
import Manufacturer from './manufacturer';
import * as Metadata from './metadata';
import { Classic } from './outline';
import Painter from './painter';
import * as Pair from './pair';
import { itself } from './prelude';
import Puzzle from './puzzle';
import { twoAndTwo } from './sequence';
import * as Shuffler from './shuffler';
import { diameter } from './size';
import * as SpatialMetadata from './spatial-metadata';
import * as Structure from './structure';
import {
  PieceValidator,
  PuzzleValidator,

} from './validator';

import * as VectorModule from './vector';
import { vector } from './vector';

interface HeadbreakerGlobal {
  headbreaker?: {
    painters?: {
      Konva?: new () => Painter;
    };
  };
}

/** A Konva visual group representing a piece. */
export type Group = Konva.Group;

export type { LabelMetadata } from './piece';

/**
 * Visual artifacts associated with a single piece on the canvas:
 * its line `shape`, its containing `group`, and an optional text `label`.
 */
export interface Figure {
  shape?: Konva.Line;
  group?: Konva.Group;
  label?: Konva.Text;
}

/**
 * Listener invoked when two pieces (and their figures) connect or disconnect.
 *
 * @callback CanvasConnectionListener
 * @param {Piece} piece - The piece raising the event.
 * @param {Figure} figure - The figure of `piece`.
 * @param {Piece} targetPiece - The neighbour piece.
 * @param {Figure} targetFigure - The figure of `targetPiece`.
 * @returns {void}
 */
export type CanvasConnectionListener = (
  piece: Piece,
  figure: Figure,
  targetPiece: Piece,
  targetFigure: Figure,
) => void;

/**
 * Listener invoked when a piece is translated on the canvas.
 *
 * @callback CanvasTranslationListener
 * @param {Piece} piece - The piece that moved.
 * @param {Figure} figure - The figure of `piece`.
 * @param {number} dx - Horizontal displacement.
 * @param {number} dy - Vertical displacement.
 * @returns {void}
 */
export type CanvasTranslationListener = (
  piece: Piece,
  figure: Figure,
  dx: number,
  dy: number,
) => void;

/**
 * Free-form metadata accepted by canvas-level templates and pieces.
 */
export interface CanvasMetadata {
  id?: string;
  targetPosition?: Vector;
  currentPosition?: Vector;
  color?: string;
  fixed?: boolean;
  strokeColor?: string;
  image?: ImageLike;
  label?: LabelMetadata;
  scale?: number;
  [key: string]: unknown;
}

/**
 * Reusable description of a piece, combining a {@link Structure}, an optional
 * {@link Size} and free-form {@link CanvasMetadata}.
 */
export interface Template {
  structure: Structure.StructureLike;
  size?: Size;
  metadata: CanvasMetadata;
}

/**
 * The visual layer of a puzzle. Owns a {@link Puzzle}, a {@link Painter} and
 * the set of {@link Figure}s rendered for each piece, and exposes a friendly
 * API to draw, shuffle and validate the puzzle.
 *
 * @example
 * const canvas = new Canvas('mount-point', {
 *   width: 800,
 *   height: 600,
 *   pieceSize: 100,
 *   proximity: 20,
 * });
 * canvas.autogenerate({ horizontalPiecesCount: 4, verticalPiecesCount: 3 });
 * canvas.shuffle();
 * canvas.draw();
 */
export default class Canvas {
  width: number;
  height: number;
  pieceSize: Size;
  borderFill: Vector;
  imageMetadata: ImageMetadataType | null;
  strokeWidth: number;
  strokeColor: string;
  lineSoftness: number;
  preventOffstageDrag: boolean;
  proximity: number;
  fixed: boolean;
  _painter: Painter;
  _maxPiecesCount: Vector | null;
  _puzzleDiameter: Vector | null;
  _imageAdjuster: (image: ImageMetadataType) => ImageMetadataType;
  _outline: Outline;
  _puzzle: Puzzle | null = null;
  figures: Record<string, Figure> = {};
  templates: Record<string, Template> = {};
  _konvaLayer?: Konva.Layer;
  _nullLayer?: { drawn: boolean; figures: number };
  _figurePadding: Vector | null = null;
  _drawn: boolean = false;
  autoconnected: boolean = false;

  /**
   * @param {string} id - Id of the DOM element where the canvas is mounted.
   * @param {object} options - Configuration object.
   * @param {number} options.width - Canvas width in pixels.
   * @param {number} options.height - Canvas height in pixels.
   * @param {Vector | number} [options.pieceSize] - Default piece diameter. Defaults to `50`.
   * @param {number} [options.proximity] - Maximum per-axis distance considered "close" by connectors. Defaults to `10`.
   * @param {Vector | number} [options.borderFill] - Inset applied to piece borders. Defaults to `0`.
   * @param {number} [options.strokeWidth] - Stroke width in pixels. Defaults to `3`.
   * @param {string} [options.strokeColor] - Stroke color. Defaults to `'black'`.
   * @param {number} [options.lineSoftness] - Tension applied to non-Bezier outlines. Defaults to `0`.
   * @param {boolean} [options.preventOffstageDrag] - When `true`, prevents pieces from being dragged off-canvas.
   * @param {ImageLike | null} [options.image] - Optional canvas-wide image fill.
   * @param {boolean} [options.fixed] - When `true`, the puzzle is treated as fixed-size for reframing.
   * @param {Painter | null} [options.painter] - Custom painter; defaults to the registered KonvaPainter, or a no-op.
   * @param {Vector | number | null} [options.puzzleDiameter] - Optional explicit puzzle diameter.
   * @param {Vector | number | null} [options.maxPiecesCount] - Optional explicit max grid size.
   * @param {Outline | null} [options.outline] - Custom outline; defaults to {@link Classic}.
   */
  constructor(
    id: string,
    {
      width,
      height,
      pieceSize = 50,
      proximity = 10,
      borderFill = 0,
      strokeWidth = 3,
      strokeColor = 'black',
      lineSoftness = 0,
      preventOffstageDrag = false,
      image = null,
      fixed = false,
      painter = null,
      puzzleDiameter = null,
      maxPiecesCount = null,
      outline = null,
    }: {
      width: number;
      height: number;
      pieceSize?: Vector | number;
      proximity?: number;
      borderFill?: Vector | number;
      strokeWidth?: number;
      strokeColor?: string;
      lineSoftness?: number;
      preventOffstageDrag?: boolean;
      image?: ImageLike | null;
      fixed?: boolean;
      painter?: Painter | null;
      puzzleDiameter?: Vector | number | null;
      maxPiecesCount?: Vector | number | null;
      outline?: Outline | null;
    },
  ) {
    this.width = width;
    this.height = height;
    this.pieceSize = diameter(pieceSize);
    this.borderFill = VectorModule.cast(borderFill);
    this.imageMetadata = ImageMetadata.asImageMetadata(image);
    this.strokeWidth = strokeWidth;
    this.strokeColor = strokeColor;
    this.lineSoftness = lineSoftness;
    this.preventOffstageDrag = preventOffstageDrag;
    this.proximity = proximity;
    this.fixed = fixed;

    const global = globalThis as HeadbreakerGlobal;
    const KonvaPainter = global.headbreaker?.painters?.Konva ?? Painter;
    this._painter = painter || new KonvaPainter();
    this._painter.initialize(this, id);

    this._maxPiecesCount = maxPiecesCount
      ? VectorModule.cast(maxPiecesCount)
      : null;
    this._puzzleDiameter = puzzleDiameter
      ? VectorModule.cast(puzzleDiameter)
      : null;
    this._imageAdjuster = itself;
    this._outline = outline || Classic;
  }

  /**
   * Renders a single piece described by `template` and adds it to the puzzle.
   *
   * @param {Template} template - The piece template.
   * @returns {void}
   */
  sketchPiece({ structure, size = undefined, metadata }: Template): void {
    SpatialMetadata.initialize(metadata, VectorModule.zero());
    this.renderPiece(this._newPiece(structure, size ?? null, metadata));
  }

  /**
   * Renders the figure of an already-built piece.
   *
   * @param {Piece} piece - The piece to render.
   * @returns {void}
   */
  renderPiece(piece: Piece): void {
    const figure: Figure = {
      label: undefined,
      group: undefined,
      shape: undefined,
    };
    this.figures[piece.metadata.id] = figure;
    this._painter.sketch(this, piece, figure, this._outline);

    const label = piece.metadata.label as LabelMetadata | undefined;
    if (label?.text) {
      label.fontSize = label.fontSize || piece.diameter.y * 0.55;
      label.y = label.y || (piece.diameter.y - label.fontSize) / 2;
      this._painter.label(this, piece, figure);
    }

    this._bindGroupToPiece(figure.group!, piece);
    this._bindPieceToGroup(piece, figure.group!);
  }

  /**
   * Renders the figures of every piece in `pieces`.
   *
   * @param {Piece[]} pieces - Pieces to render.
   * @returns {void}
   */
  renderPieces(pieces: Piece[]): void {
    pieces.forEach((it) => {
      this._annotatePiecePosition(it);
      this.renderPiece(it);
    });
  }

  /**
   * Adopts a {@link Puzzle} as this canvas's model and renders all its pieces.
   *
   * @param {Puzzle} puzzle - The puzzle to render.
   * @returns {void}
   */
  renderPuzzle(puzzle: Puzzle): void {
    this.pieceSize = puzzle.pieceSize;
    this.proximity = puzzle.proximity * 2;
    this._puzzle = puzzle;
    this.renderPieces(puzzle.pieces);
  }

  /**
   * Builds a puzzle of the given grid size using a {@link Manufacturer} and
   * renders it on the canvas.
   *
   * @param {object} [options] - Generation options.
   * @param {number} [options.horizontalPiecesCount] - Number of columns. Defaults to `5`.
   * @param {number} [options.verticalPiecesCount] - Number of rows. Defaults to `5`.
   * @param {InsertsGenerator} [options.insertsGenerator] - Inserts generator. Defaults to {@link twoAndTwo}.
   * @param {CanvasMetadata[]} [options.metadata] - Per-piece metadata.
   * @returns {void}
   */
  autogenerate({
    horizontalPiecesCount = 5,
    verticalPiecesCount = 5,
    insertsGenerator = twoAndTwo,
    metadata = [],
  }: {
    horizontalPiecesCount?: number;
    verticalPiecesCount?: number;
    insertsGenerator?: InsertsGenerator;
    metadata?: CanvasMetadata[];
  } = {}): void {
    const manufacturer = new Manufacturer();
    manufacturer.withDimensions(horizontalPiecesCount, verticalPiecesCount);
    manufacturer.withInsertsGenerator(insertsGenerator);
    manufacturer.withMetadata(metadata);
    this.autogenerateWithManufacturer(manufacturer);
  }

  /**
   * Builds the puzzle from a configured {@link Manufacturer} and renders it.
   *
   * @param {Manufacturer} manufacturer - The configured manufacturer.
   * @returns {void}
   */
  autogenerateWithManufacturer(manufacturer: Manufacturer): void {
    manufacturer.withStructure(this.settings);
    this._puzzle = manufacturer.build();
    this._maxPiecesCount = vector(manufacturer.width, manufacturer.height);
    this.renderPieces(this.puzzle.pieces);
  }

  /**
   * Registers `template` under `name` so it can be reused via
   * {@link Canvas#sketchPieceUsingTemplate}.
   *
   * @param {string} name - The template name.
   * @param {Template} template - The template to register.
   * @returns {void}
   */
  defineTemplate(name: string, template: Template): void {
    this.templates[name] = template;
  }

  /**
   * Sketches a piece using a previously registered template.
   *
   * @param {string} id - The id assigned to the new piece.
   * @param {string} templateName - The name of the registered template.
   * @returns {void}
   * @throws {Error} If no template with that name has been registered.
   */
  sketchPieceUsingTemplate(id: string, templateName: string): void {
    const options = this.templates[templateName];
    if (!options) {
      throw new Error(`Unknown template ${id}`);
    }
    const metadata: CanvasMetadata = { ...Metadata.copy(options.metadata), id };
    this.sketchPiece({ structure: options.structure, metadata });
  }

  /**
   * Shuffles every piece uniformly inside the canvas, scaled by `farness`.
   *
   * @param {number} [farness] - Fraction of the canvas to shuffle within. Defaults to `1`.
   * @returns {void}
   */
  shuffle(farness: number = 1): void {
    const offset = this.pieceRadius;
    this.puzzle.shuffle(
      farness * (this.width - offset.x),
      farness * (this.height - offset.y),
    );
    this.puzzle.translate(offset.x, offset.y);
    this.autoconnected = true;
  }

  /**
   * Shuffles columns independently using {@link Shuffler.columns}.
   *
   * @param {number} [farness] - Noise factor. Defaults to `1`.
   * @returns {void}
   */
  shuffleColumns(farness: number = 1): void {
    this.shuffleWith(farness, Shuffler.columns);
  }

  /**
   * Shuffles every piece on the grid using {@link Shuffler.grid}.
   *
   * @param {number} [farness] - Noise factor. Defaults to `1`.
   * @returns {void}
   */
  shuffleGrid(farness: number = 1): void {
    this.shuffleWith(farness, Shuffler.grid);
  }

  /**
   * Lays the puzzle out along a single line using {@link Shuffler.line}.
   *
   * @param {number} [farness] - Noise factor. Defaults to `1`.
   * @returns {void}
   */
  shuffleLine(farness: number = 1): void {
    this.shuffleWith(farness, Shuffler.line);
  }

  /**
   * Solves the puzzle, applies the given {@link Shuffler.Shuffler}, then adds
   * a small amount of noise.
   *
   * @param {number} farness - Noise factor.
   * @param {Shuffler.Shuffler} shuffler - The shuffler to apply.
   * @returns {void}
   */
  shuffleWith(farness: number, shuffler: Shuffler.Shuffler): void {
    this.solve();
    this.puzzle.shuffleWith(
      Shuffler.padder(
        this.proximity * 3,
        this.maxPiecesCount.x,
        this.maxPiecesCount.y,
      ),
    );
    this.puzzle.shuffleWith(shuffler);
    this.puzzle.shuffleWith(
      Shuffler.noise(VectorModule.cast((this.proximity * farness) / 2)),
    );
    this.autoconnected = true;
  }

  /**
   * Moves every piece to its target position and autoconnects the puzzle.
   *
   * @returns {void}
   */
  solve(): void {
    this.puzzle.pieces.forEach((it) => {
      const { x, y } = it.metadata.targetPosition;
      it.relocateTo(x, y);
    });
    this.autoconnect();
  }

  /**
   * Tries to connect every piece with every other piece.
   *
   * @returns {void}
   */
  autoconnect(): void {
    this.puzzle.autoconnect();
    this.autoconnected = true;
  }

  /**
   * Wires keyboard gestures into the painter. By default, Shift forces
   * connection while dragging and Control forces disconnection.
   *
   * @param {Record<string, (puzzle: Puzzle) => void>} [gestures] - Optional
   *   custom gesture map.
   * @returns {void}
   */
  registerKeyboardGestures(
    gestures?: Record<string, (puzzle: Puzzle) => void>,
  ): void {
    const defaultGestures = {
      Shift: (puzzle: Puzzle) => puzzle.forceConnectionWhileDragging(),
      Control: (puzzle: Puzzle) => puzzle.forceDisconnectionWhileDragging(),
    };
    this._painter.registerKeyboardGestures(this, gestures ?? defaultGestures);
  }

  /**
   * Draws the puzzle for the first time. Subsequent draws should use
   * {@link Canvas#redraw}.
   *
   * @returns {void}
   * @throws {Error} If `draw` has already been called.
   */
  draw(): void {
    if (this._drawn) {
      throw new Error(
        'This canvas has already been drawn. Call redraw instead',
      );
    }
    if (!this.autoconnected) {
      this.autoconnect();
    }
    this.puzzle.updateValidity();
    this.autoconnected = false;
    this.redraw();
    this._drawn = true;
  }

  /**
   * Forces a redraw of the underlying painter.
   *
   * @returns {void}
   */
  redraw(): void {
    this._painter.draw(this);
  }

  /**
   * Reapplies the configured fill (image or color) to every piece.
   *
   * @returns {void}
   */
  refill(): void {
    this.puzzle.pieces.forEach((piece) => {
      this._painter.fill(this, piece, this.getFigure(piece));
    });
  }

  /**
   * Wipes the canvas state (puzzle, figures, templates) and re-initializes
   * the painter.
   *
   * @returns {void}
   */
  clear(): void {
    this._puzzle = null;
    this.figures = {};
    this.templates = {};
    this._figurePadding = null;
    this._drawn = false;
    this._painter.reinitialize(this);
  }

  /**
   * Attaches a {@link ConnectionRequirement} to both connectors.
   *
   * @param {ConnectionRequirement} requirement - The new requirement.
   * @returns {void}
   */
  attachConnectionRequirement(requirement: ConnectionRequirement): void {
    this.puzzle.attachConnectionRequirement(requirement);
  }

  /**
   * Removes any active {@link ConnectionRequirement}.
   *
   * @returns {void}
   */
  clearConnectionRequirements(): void {
    this.puzzle.clearConnectionRequirements();
  }

  /**
   * Replaces the puzzle's {@link Validator}.
   *
   * @param {Validator} validator - The new validator.
   * @returns {void}
   */
  attachValidator(validator: Validator): void {
    this.puzzle.attachValidator(validator);
  }

  /**
   * Attaches the built-in {@link SpatialMetadata.solved} validator.
   *
   * @returns {void}
   */
  attachSolvedValidator(): void {
    this.puzzle.attachValidator(new PuzzleValidator(SpatialMetadata.solved));
  }

  /**
   * Attaches the built-in {@link SpatialMetadata.relativePosition} validator.
   *
   * @returns {void}
   */
  attachRelativePositionValidator(): void {
    this.puzzle.attachValidator(
      new PuzzleValidator(SpatialMetadata.relativePosition),
    );
  }

  /**
   * Attaches a {@link PuzzleValidator.relativeRefs} validator with the given
   * expected reference positions.
   *
   * @param {[number, number][]} expected - One reference per piece.
   * @returns {void}
   */
  attachRelativeRefsValidator(expected: [number, number][]): void {
    this.puzzle.attachValidator(
      new PuzzleValidator(PuzzleValidator.relativeRefs(expected)),
    );
  }

  /**
   * Attaches the built-in {@link SpatialMetadata.absolutePosition} validator.
   *
   * @returns {void}
   */
  attachAbsolutePositionValidator(): void {
    this.puzzle.attachValidator(
      new PieceValidator(SpatialMetadata.absolutePosition),
    );
  }

  /**
   * Subscribes `f` to canvas-level connection events.
   *
   * @param {CanvasConnectionListener} f - Listener to register.
   * @returns {void}
   */
  onConnect(f: CanvasConnectionListener): void {
    this.puzzle.onConnect((piece, target) => {
      f(piece, this.getFigure(piece), target, this.getFigure(target));
    });
  }

  /**
   * Subscribes `f` to canvas-level disconnection events.
   *
   * @param {CanvasConnectionListener} f - Listener to register.
   * @returns {void}
   */
  onDisconnect(f: CanvasConnectionListener): void {
    this.puzzle.onDisconnect((piece, target) => {
      f(piece, this.getFigure(piece), target, this.getFigure(target));
    });
  }

  /**
   * Subscribes `f` to canvas-level translation events.
   *
   * @param {CanvasTranslationListener} f - Listener to register.
   * @returns {void}
   */
  onTranslate(f: CanvasTranslationListener): void {
    this.puzzle.onTranslate((piece, dx, dy) => {
      f(piece, this.getFigure(piece), dx, dy);
    });
  }

  /**
   * Reframes a fixed-size puzzle so it fits entirely within the canvas.
   *
   * @returns {void}
   * @throws {Error} If the canvas is not fixed-size.
   */
  reframeWithinDimensions(): void {
    if (!this.fixed)
      throw new Error('Only fixed canvas can be reframed');
    this.puzzle.reframe(
      this.figurePadding,
      VectorModule.minus(vector(this.width, this.height), this.figurePadding),
    );
  }

  /**
   * Subscribes `f` to the puzzle's invalid → valid transition.
   *
   * @param {ValidationListener} f - Listener to register.
   * @returns {void}
   */
  onValid(f: ValidationListener): void {
    this.puzzle.onValid(f);
  }

  /** @returns {boolean | undefined} The puzzle's last cached validity. */
  get valid(): boolean | undefined {
    return this.puzzle.valid;
  }

  /**
   * Returns the {@link Figure} of `piece`, looked up by metadata id.
   *
   * @param {Piece} piece - The piece.
   * @returns {Figure} The figure.
   */
  getFigure(piece: Piece): Figure {
    return this.getFigureById(piece.metadata.id);
  }

  /**
   * Returns the {@link Figure} registered under `id`.
   *
   * @param {string | number} id - The figure id.
   * @returns {Figure} The figure.
   */
  getFigureById(id: string | number): Figure {
    return this.figures[id];
  }

  /**
   * Resizes the canvas surface.
   *
   * @param {number} width - New width in pixels.
   * @param {number} height - New height in pixels.
   * @returns {void}
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this._painter.resize(this, width, height);
  }

  /**
   * Applies a uniform scale factor to the canvas.
   *
   * @param {Vector | number} factor - Scale factor on each axis.
   * @returns {void}
   */
  scale(factor: Vector | number): void {
    this._painter.scale(this, VectorModule.cast(factor));
  }

  private _annotatePiecePosition(piece: Piece): void {
    const p = piece.centralAnchor!.asVector();
    SpatialMetadata.initialize(piece.metadata, p, VectorModule.copy(p));
  }

  private _bindGroupToPiece(group: Group, piece: Piece): void {
    piece.onTranslate((_piece, _dx, _dy) => {
      this._painter.physicalTranslate(this, group, piece);
      this._painter.logicalTranslate(this, piece, group);
    });
  }

  private _bindPieceToGroup(piece: Piece, group: Group): void {
    this._painter.onDrag(this, piece, group, (dx: number, dy: number) => {
      if (!Pair.isNull(dx, dy)) {
        piece.drag(dx, dy, true);
        this._painter.logicalTranslate(this, piece, group);
        this.redraw();
      }
    });
    this._painter.onDragEnd(this, piece, group, () => {
      this.puzzle.validate();
      piece.drop();
      this.puzzle.validate();
      this.redraw();
    });
  }

  /**
   * Returns the resolved {@link ImageMetadata} for `piece`, before the
   * {@link Canvas#_imageAdjuster} is applied.
   *
   * @param {Piece} piece - The piece.
   * @returns {ImageMetadataType | null} The base image metadata.
   */
  _baseImageMetadataFor(piece: Piece): ImageMetadataType | null {
    if (this.imageMetadata) {
      const s = piece.metadata.scale || this.imageMetadata.scale || 1;
      const offset = VectorModule.plus(
        piece.metadata.targetPosition || VectorModule.zero(),
        this.imageMetadata.offset || VectorModule.zero(),
      );
      return { content: this.imageMetadata.content, offset, scale: s };
    }
    return ImageMetadata.asImageMetadata(piece.metadata.image);
  }

  /**
   * Returns the {@link ImageMetadata} for `piece`, after applying the active
   * image adjuster.
   *
   * @param {Piece} piece - The piece.
   * @returns {ImageMetadataType | null} The adjusted image metadata.
   */
  imageMetadataFor(piece: Piece): ImageMetadataType | null {
    const base = this._baseImageMetadataFor(piece);
    if (!base)
      return null;
    return this._imageAdjuster(base);
  }

  /**
   * Configures the active image adjuster so the canvas-wide image fits the
   * puzzle along the given {@link Axis}.
   *
   * @param {Axis} axis - The axis to fit along.
   * @returns {void}
   */
  adjustImagesToPuzzle(axis: Axis): void {
    this._imageAdjuster = (image) => {
      const s
        = axis.atVector(this.puzzleDiameter) / axis.atDimension(image.content);
      const offset = VectorModule.plus(
        image.offset!,
        VectorModule.minus(this.borderFill, this.pieceDiameter),
      );
      return { content: image.content, scale: s, offset };
    };
  }

  /**
   * Convenience around {@link Canvas#adjustImagesToPuzzle} on the horizontal axis.
   *
   * @returns {void}
   */
  adjustImagesToPuzzleWidth(): void {
    this.adjustImagesToPuzzle(Horizontal);
  }

  /**
   * Convenience around {@link Canvas#adjustImagesToPuzzle} on the vertical axis.
   *
   * @returns {void}
   */
  adjustImagesToPuzzleHeight(): void {
    this.adjustImagesToPuzzle(Vertical);
  }

  /**
   * Configures the active image adjuster so the per-piece image fits a single
   * piece along the given {@link Axis}.
   *
   * @param {Axis} axis - The axis to fit along.
   * @returns {void}
   */
  adjustImagesToPiece(axis: Axis): void {
    this._imageAdjuster = (image) => {
      const s
        = axis.atVector(this.pieceDiameter) / axis.atDimension(image.content);
      const offset = VectorModule.plus(image.offset!, this.borderFill);
      return { content: image.content, scale: s, offset };
    };
  }

  /**
   * Convenience around {@link Canvas#adjustImagesToPiece} on the horizontal axis.
   *
   * @returns {void}
   */
  adjustImagesToPieceWidth(): void {
    this.adjustImagesToPiece(Horizontal);
  }

  /**
   * Convenience around {@link Canvas#adjustImagesToPiece} on the vertical axis.
   *
   * @returns {void}
   */
  adjustImagesToPieceHeight(): void {
    this.adjustImagesToPiece(Vertical);
  }

  private _initializeEmptyPuzzle(): void {
    this._puzzle = new Puzzle(this.settings);
  }

  private _newPiece(
    structureLike: Structure.StructureLike,
    size: Size | null,
    metadata: Partial<PieceMetadata>,
  ): Piece {
    return this.puzzle.newPiece(Structure.asStructure(structureLike), {
      centralAnchor: vector(
        metadata.currentPosition!.x,
        metadata.currentPosition!.y,
      ),
      metadata,
      size: size ?? undefined,
    });
  }

  /** @returns {Vector} The puzzle diameter, either explicit or estimated from the grid. */
  get puzzleDiameter(): Vector {
    return this._puzzleDiameter || this.estimatedPuzzleDiameter;
  }

  /** @returns {Vector} The puzzle diameter estimated from {@link Canvas#maxPiecesCount} and the piece diameter. */
  get estimatedPuzzleDiameter(): Vector {
    return VectorModule.plus(
      VectorModule.multiply(this.pieceDiameter, this.maxPiecesCount),
      this.strokeWidth * 2,
    );
  }

  /**
   * @returns {Vector} The configured maximum grid size.
   * @throws {Error} If `maxPiecesCount` was not specified.
   */
  get maxPiecesCount(): Vector {
    if (!this._maxPiecesCount) {
      throw new Error('max pieces count was not specified');
    }
    return this._maxPiecesCount;
  }

  /** @returns {Vector} Half of the default piece diameter. */
  get pieceRadius(): Vector {
    return this.pieceSize.radius;
  }

  /** @returns {Vector} The default piece diameter. */
  get pieceDiameter(): Vector {
    return this.pieceSize.diameter;
  }

  /** @returns {Vector} The cumulative offset that figures need around them (stroke + border fill). */
  get figurePadding(): Vector {
    this._figurePadding ??= VectorModule.plus(
      this.strokeWidth,
      this.borderFill,
    );
    return this._figurePadding;
  }

  /** @returns {number} The number of figures currently rendered. */
  get figuresCount(): number {
    return Object.values(this.figures).length;
  }

  /** @returns {Puzzle} The owned puzzle, lazily initialized. */
  get puzzle(): Puzzle {
    if (!this._puzzle) {
      this._initializeEmptyPuzzle();
    }
    return this._puzzle!;
  }

  /** @returns {{ pieceRadius: Vector, proximity: number }} Settings forwarded to the puzzle. */
  get settings() {
    return { pieceRadius: this.pieceRadius, proximity: this.proximity };
  }
}
