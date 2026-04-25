/**
 * @module manufacturer
 *
 * Builder that produces a fully-laid-out {@link Puzzle} from a grid
 * configuration: dimensions, an {@link InsertsGenerator}, optional metadata
 * and an optional head anchor.
 */

import type { Anchor } from './anchor';
import type { PieceMetadata } from './piece';
import type Piece from './piece';
import type { Settings } from './puzzle';
import type { InsertsGenerator } from './sequence';
import type { Vector } from './vector';
import { anchor } from './anchor';
import * as Metadata from './metadata';
import Puzzle from './puzzle';
import { fixed, InsertSequence } from './sequence';

/**
 * Builder that produces a {@link Puzzle} from a grid configuration:
 * dimensions, an {@link InsertsGenerator}, optional metadata and an optional
 * head anchor.
 *
 * @example
 * const m = new Manufacturer();
 * m.withDimensions(3, 2);
 * m.withInsertsGenerator(twoAndTwo);
 * const puzzle = m.build(); // 3×2 puzzle
 */
export default class Manufacturer {
  /** Strategy used to pick inserts for each row/column step. */
  insertsGenerator: InsertsGenerator;
  /** Per-piece metadata, indexed in row-major order. */
  metadata: Partial<PieceMetadata>[];
  /** Anchor used as the position of the first piece. `null` defaults to one piece-diameter. */
  headAnchor: Anchor | null;
  /** Settings forwarded to the resulting {@link Puzzle}. */
  structure: Settings;
  /** Number of columns. Set via {@link Manufacturer#withDimensions}. */
  width!: number;
  /** Number of rows. Set via {@link Manufacturer#withDimensions}. */
  height!: number;

  constructor() {
    this.insertsGenerator = fixed;
    this.metadata = [];
    this.headAnchor = null;
    this.structure = {};
  }

  /**
   * Sets the per-piece metadata array.
   *
   * @param {Partial<PieceMetadata>[]} metadata - Metadata in row-major order.
   * @returns {void}
   */
  withMetadata(metadata: Partial<PieceMetadata>[]): void {
    this.metadata = metadata;
  }

  /**
   * Sets the {@link InsertsGenerator} used to build piece structures.
   *
   * @param {InsertsGenerator} generator - The generator. Falsy values are ignored.
   * @returns {void}
   */
  withInsertsGenerator(generator: InsertsGenerator): void {
    this.insertsGenerator = generator || this.insertsGenerator;
  }

  /**
   * Forces the position of the first piece (the "head").
   *
   * @param {Anchor} a - The anchor to use as the head.
   * @returns {void}
   */
  withHeadAt(a: Anchor): void {
    this.headAnchor = a;
  }

  /**
   * Sets the {@link Settings} forwarded to the produced {@link Puzzle}.
   *
   * @param {Settings} structure - The puzzle settings.
   * @returns {void}
   */
  withStructure(structure: Settings): void {
    this.structure = structure;
  }

  /**
   * Sets the puzzle's grid size.
   *
   * @param {number} width - Number of columns.
   * @param {number} height - Number of rows.
   * @returns {void}
   */
  withDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  /**
   * Builds the {@link Puzzle}, populating it with pieces laid out on a
   * regular `width × height` grid.
   *
   * @returns {Puzzle} The newly built puzzle.
   */
  build(): Puzzle {
    const puzzle = new Puzzle(this.structure);
    const positioner = new Positioner(puzzle, this.headAnchor);

    const verticalSequence = this._newSequence();
    let horizontalSequence: InsertSequence;

    for (let y = 0; y < this.height; y++) {
      horizontalSequence = this._newSequence();
      verticalSequence.next();

      for (let x = 0; x < this.width; x++) {
        horizontalSequence.next();
        const piece = this._buildPiece(
          puzzle,
          horizontalSequence,
          verticalSequence,
        );
        piece.centerAround(positioner.naturalAnchor(x, y));
      }
    }
    this._annotateAll(puzzle.pieces);
    return puzzle;
  }

  private _annotateAll(pieces: Piece[]): void {
    pieces.forEach((piece, index) => this._annotate(piece, index));
  }

  private _annotate(piece: Piece, index: number): void {
    const baseMetadata = this.metadata[index];
    const metadata: Partial<PieceMetadata> = baseMetadata
      ? Metadata.copy(baseMetadata)
      : {};
    metadata.id = metadata.id || String(index + 1);
    piece.annotate(metadata);
  }

  private _newSequence(): InsertSequence {
    return new InsertSequence(this.insertsGenerator);
  }

  private _buildPiece(
    puzzle: Puzzle,
    horizontalSequence: InsertSequence,
    verticalSequence: InsertSequence,
  ): Piece {
    return puzzle.newPiece({
      left: horizontalSequence.previousComplement(),
      up: verticalSequence.previousComplement(),
      right: horizontalSequence.current(this.width),
      down: verticalSequence.current(this.height),
    });
  }
}

/**
 * Helper that converts logical grid coordinates `(x, y)` into world-space
 * anchors based on the puzzle's piece diameter and the configured head anchor.
 */
class Positioner {
  /** Owning puzzle, used for piece diameter. */
  puzzle: Puzzle;
  /** Offset applied to every produced anchor. */
  offset: Vector;

  /**
   * @param {Puzzle} puzzle - The owning puzzle.
   * @param {Anchor | null} headAnchor - Anchor of the first piece, or `null`
   *   for a default offset of one piece-diameter.
   */
  constructor(puzzle: Puzzle, headAnchor: Anchor | null) {
    this.puzzle = puzzle;
    if (headAnchor) {
      this.offset = headAnchor.asVector();
    }
    else {
      this.offset = this.pieceDiameter;
    }
  }

  /** @returns {Vector} The owning puzzle's piece diameter. */
  get pieceDiameter(): Vector {
    return this.puzzle.pieceDiameter;
  }

  /**
   * Returns the world-space anchor of the piece at grid coordinates `(x, y)`.
   *
   * @param {number} x - Column index.
   * @param {number} y - Row index.
   * @returns {Anchor}
   */
  naturalAnchor(x: number, y: number): Anchor {
    return anchor(
      x * this.pieceDiameter.x + this.offset.x,
      y * this.pieceDiameter.y + this.offset.y,
    );
  }
}
