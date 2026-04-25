/**
 * @module puzzle
 *
 * The headless model of a jigsaw puzzle: a collection of {@link Piece}s plus
 * the connectors and validators that govern how they relate. Has no
 * rendering dependencies.
 */

import type { Anchor } from './anchor';
import type { ConnectionRequirement } from './connector';
import type { Pair } from './pair';
import type {
  ConnectionListener,
  PieceConfig,
  PieceDump,
  PieceMetadata,
  TranslationListener,
} from './piece';
import type { Size } from './size';
import type { Structure } from './structure';
import type { ValidationListener, Validator } from './validator';
import type { Vector } from './vector';
import {

  Connector,
  noConnectionRequirements,
} from './connector';
import * as dragMode from './drag-mode';
import Piece from './piece';
import * as Shuffler from './shuffler';
import { radius } from './size';
import {
  NullValidator,

} from './validator';

/**
 * Serialized form of a {@link Puzzle}, suitable for JSON storage.
 */
export interface PuzzleDump {
  pieceRadius: Vector;
  proximity: number;
  pieces: PieceDump[];
}

/**
 * Optional settings accepted by {@link Puzzle}'s constructor.
 */
export interface Settings {
  /** Default radius applied to pieces with no specific size. */
  pieceRadius?: Vector | number;
  /** Maximum per-axis distance considered "close" by connectors. */
  proximity?: number;
}

/**
 * The headless model of a jigsaw puzzle: a collection of {@link Piece}s
 * together with the connectors and validators that govern how they relate.
 *
 * `Puzzle` has zero rendering dependencies. The visual layer lives in
 * {@link Canvas}.
 */
export default class Puzzle {
  pieceSize: Size;
  proximity: number;
  pieces: Piece[];
  validator: Validator;
  dragMode: dragMode.DragMode;
  horizontalConnector: Connector;
  verticalConnector: Connector;

  /**
   * @param {Settings} [settings] - Initial puzzle settings.
   */
  constructor({ pieceRadius = 2, proximity = 1 }: Settings = {}) {
    this.pieceSize = radius(pieceRadius);
    this.proximity = proximity;
    this.pieces = [];
    this.validator = new NullValidator();
    this.dragMode = dragMode.TryDisconnection;
    this.horizontalConnector = Connector.horizontal();
    this.verticalConnector = Connector.vertical();
  }

  /**
   * Builds a new {@link Piece} and registers it with this puzzle.
   *
   * @param {Structure} [structure] - Inserts on each side.
   * @param {PieceConfig} [config] - Initial position, size and metadata.
   * @returns {Piece} The newly created piece.
   */
  newPiece(structure: Structure = {}, config: PieceConfig = {}): Piece {
    const piece = new Piece(structure, config);
    this.addPiece(piece);
    return piece;
  }

  /**
   * Adds an already-built piece to this puzzle.
   *
   * @param {Piece} piece - The piece to add.
   * @returns {void}
   */
  addPiece(piece: Piece): void {
    this.pieces.push(piece);
    piece.belongTo(this);
  }

  /**
   * Adds many pieces at once via {@link Puzzle#addPiece}.
   *
   * @param {Piece[]} pieces - The pieces to add.
   * @returns {void}
   */
  addPieces(pieces: Piece[]): void {
    pieces.forEach(it => this.addPiece(it));
  }

  /**
   * Annotates each piece with the corresponding entry in `metadata`.
   *
   * @param {Partial<PieceMetadata>[]} metadata - Per-piece metadata array.
   * @returns {void}
   */
  annotate(metadata: Partial<PieceMetadata>[]): void {
    this.pieces.forEach((piece, index) => piece.annotate(metadata[index]));
  }

  /**
   * Relocates each piece to the corresponding `[x, y]` entry in `points`.
   *
   * @param {Pair[]} points - Per-piece destination points.
   * @returns {void}
   */
  relocateTo(points: Pair[]): void {
    this.pieces.forEach((piece, index) => piece.relocateTo(...points[index]));
  }

  /**
   * Tries to connect every piece with every other piece.
   *
   * @returns {void}
   */
  autoconnect(): void {
    this.pieces.forEach(it => this.autoconnectWith(it));
  }

  /**
   * Disconnects every piece from its neighbours.
   *
   * @returns {void}
   */
  disconnect(): void {
    this.pieces.forEach(it => it.disconnect());
  }

  /**
   * Tries to connect `piece` with every other piece in the puzzle.
   *
   * @param {Piece} piece - The piece to autoconnect.
   * @returns {void}
   */
  autoconnectWith(piece: Piece): void {
    this.pieces
      .filter(it => it !== piece)
      .forEach((other) => {
        piece.tryConnectWith(other);
        other.tryConnectWith(piece, true);
      });
  }

  /**
   * Shuffles all pieces uniformly inside the rectangle `[0, maxX] × [0, maxY]`.
   *
   * @param {number} maxX - Upper bound on the x axis.
   * @param {number} maxY - Upper bound on the y axis.
   * @returns {void}
   */
  shuffle(maxX: number, maxY: number): void {
    this.shuffleWith(Shuffler.random(maxX, maxY));
  }

  /**
   * Shuffles all pieces using the given {@link Shuffler.Shuffler}, then
   * autoconnects them.
   *
   * @param {Shuffler.Shuffler} shuffler - The shuffler to apply.
   * @returns {void}
   */
  shuffleWith(shuffler: Shuffler.Shuffler): void {
    this.disconnect();
    shuffler(this.pieces).forEach(({ x, y }, index) => {
      this.pieces[index].relocateTo(x, y);
    });
    this.autoconnect();
  }

  /**
   * Translates every piece by `(dx, dy)`.
   *
   * @param {number} dx - Horizontal displacement.
   * @param {number} dy - Vertical displacement.
   * @returns {void}
   */
  translate(dx: number, dy: number): void {
    this.pieces.forEach(it => it.translate(dx, dy));
  }

  /**
   * Translates the puzzle so it fits inside the rectangle bounded by `min`
   * (top-left) and `max` (bottom-right) without changing its layout.
   *
   * @param {Vector} min - Top-left corner of the target rectangle.
   * @param {Vector} max - Bottom-right corner of the target rectangle.
   * @returns {void}
   */
  reframe(min: Vector, max: Vector): void {
    let dx: number;
    const leftOffstage
      = min.x - Math.min(...this.pieces.map(it => it.leftAnchor.x));
    if (leftOffstage > 0) {
      dx = leftOffstage;
    }
    else {
      const rightOffstage
        = max.x - Math.max(...this.pieces.map(it => it.rightAnchor.x));
      dx = Math.min(rightOffstage, 0);
    }

    let dy: number;
    const upOffstage
      = min.y - Math.min(...this.pieces.map(it => it.upAnchor.y));
    if (upOffstage > 0) {
      dy = upOffstage;
    }
    else {
      const downOffstage
        = max.y - Math.max(...this.pieces.map(it => it.downAnchor.y));
      dy = Math.min(downOffstage, 0);
    }

    this.translate(dx, dy);
  }

  /**
   * Subscribes `f` to translation events on every piece.
   *
   * @param {TranslationListener} f - Listener to register.
   * @returns {void}
   */
  onTranslate(f: TranslationListener): void {
    this.pieces.forEach(it => it.onTranslate(f));
  }

  /**
   * Subscribes `f` to connection events on every piece.
   *
   * @param {ConnectionListener} f - Listener to register.
   * @returns {void}
   */
  onConnect(f: ConnectionListener): void {
    this.pieces.forEach(it => it.onConnect(f));
  }

  /**
   * Subscribes `f` to disconnection events on every piece.
   *
   * @param {ConnectionListener} f - Listener to register.
   * @returns {void}
   */
  onDisconnect(f: ConnectionListener): void {
    this.pieces.forEach(it => it.onDisconnect(f));
  }

  /**
   * Subscribes `f` to the validator's invalid → valid transition.
   *
   * @param {ValidationListener} f - Listener to register.
   * @returns {void}
   */
  onValid(f: ValidationListener): void {
    this.validator.onValid(f);
  }

  /** @returns {Pair[]} The `[x, y]` central anchor of every piece. */
  get points(): Pair[] {
    return this.pieces.map(it => it.centralAnchor!.asPair());
  }

  /** @returns {Pair[]} The position of every piece, normalized by piece diameter. */
  get refs(): Pair[] {
    return this.points.map(([x, y], index) => {
      const d = this.pieces[index].diameter;
      return [x / d.x, y / d.y];
    });
  }

  /** @returns {PieceMetadata[]} The metadata of every piece, in order. */
  get metadata(): PieceMetadata[] {
    return this.pieces.map(it => it.metadata);
  }

  /** @returns {Piece} The first registered piece. */
  get head(): Piece {
    return this.pieces[0];
  }

  /** @returns {Anchor} The central anchor of {@link Puzzle#head}. */
  get headAnchor(): Anchor {
    return this.head.centralAnchor!;
  }

  /** @returns {ConnectionRequirement} The vertical connector's current requirement. */
  get verticalRequirement(): ConnectionRequirement {
    return this.verticalConnector.requirement;
  }

  /** @returns {ConnectionRequirement} The horizontal connector's current requirement. */
  get horizontalRequirement(): ConnectionRequirement {
    return this.horizontalConnector.requirement;
  }

  /**
   * Sets the requirement evaluated by the horizontal connector.
   *
   * @param {ConnectionRequirement} requirement - The new requirement.
   * @returns {void}
   */
  attachHorizontalConnectionRequirement(
    requirement: ConnectionRequirement,
  ): void {
    this.horizontalConnector.attachRequirement(requirement);
  }

  /**
   * Sets the requirement evaluated by the vertical connector.
   *
   * @param {ConnectionRequirement} requirement - The new requirement.
   * @returns {void}
   */
  attachVerticalConnectionRequirement(
    requirement: ConnectionRequirement,
  ): void {
    this.verticalConnector.attachRequirement(requirement);
  }

  /**
   * Sets the same requirement on both connectors.
   *
   * @param {ConnectionRequirement} requirement - The new requirement.
   * @returns {void}
   */
  attachConnectionRequirement(requirement: ConnectionRequirement): void {
    this.attachHorizontalConnectionRequirement(requirement);
    this.attachVerticalConnectionRequirement(requirement);
  }

  /**
   * Resets connection requirements to {@link noConnectionRequirements}.
   *
   * @returns {void}
   */
  clearConnectionRequirements(): void {
    this.attachConnectionRequirement(noConnectionRequirements);
  }

  /**
   * Replaces the current {@link Validator}.
   *
   * @param {Validator} validator - The new validator.
   * @returns {void}
   */
  attachValidator(validator: Validator): void {
    this.validator = validator;
  }

  /**
   * Computes whether the puzzle currently satisfies its validator.
   *
   * @returns {boolean}
   */
  isValid(): boolean {
    return this.validator.isValid(this);
  }

  /** @returns {boolean | undefined} The last cached validity, or `undefined`. */
  get valid(): boolean | undefined {
    return this.validator.valid;
  }

  /**
   * Recomputes validity and notifies {@link onValid} listeners as appropriate.
   *
   * @returns {void}
   */
  validate(): void {
    this.validator.validate(this);
  }

  /**
   * Same as {@link Puzzle#validate}; kept for naming clarity at call sites.
   *
   * @returns {void}
   */
  updateValidity(): void {
    this.validator.validate(this);
  }

  /** @returns {boolean} `true` when every piece has at least one connection. */
  get connected(): boolean {
    return this.pieces.every(it => it.connected);
  }

  /** @returns {Vector} The diameter of pieces with no specific size. */
  get pieceDiameter(): Vector {
    return this.pieceSize.diameter;
  }

  /** @returns {Vector} The radius of pieces with no specific size. */
  get pieceRadius(): Vector {
    return this.pieceSize.radius;
  }

  /**
   * Switches the drag mode to {@link dragMode.ForceConnection}.
   *
   * @returns {void}
   */
  forceConnectionWhileDragging(): void {
    this.dragMode = dragMode.ForceConnection;
  }

  /**
   * Switches the drag mode to {@link dragMode.ForceDisconnection}.
   *
   * @returns {void}
   */
  forceDisconnectionWhileDragging(): void {
    this.dragMode = dragMode.ForceDisconnection;
  }

  /**
   * Switches the drag mode back to the default {@link dragMode.TryDisconnection}.
   *
   * @returns {void}
   */
  tryDisconnectionWhileDragging(): void {
    this.dragMode = dragMode.TryDisconnection;
  }

  /**
   * Asks the current drag mode whether dragging `piece` by `(dx, dy)` should
   * disconnect it from neighbours.
   *
   * @param {Piece} piece - The piece being dragged.
   * @param {number} dx - Horizontal displacement.
   * @param {number} dy - Vertical displacement.
   * @returns {boolean}
   */
  dragShouldDisconnect(piece: Piece, dx: number, dy: number): boolean {
    return this.dragMode.dragShouldDisconnect(piece, dx, dy);
  }

  /**
   * Serializes the puzzle into a {@link PuzzleDump}.
   *
   * @param {{ compact?: boolean }} [options] - Forwarded to {@link Piece#export}.
   * @returns {PuzzleDump}
   */
  export(options: { compact?: boolean } = {}): PuzzleDump {
    return {
      pieceRadius: this.pieceRadius,
      proximity: this.proximity,
      pieces: this.pieces.map(it => it.export(options)),
    };
  }

  /**
   * Reconstructs a {@link Puzzle} from a {@link PuzzleDump}.
   *
   * @param {PuzzleDump} dump - The serialized puzzle.
   * @returns {Puzzle} The reconstructed puzzle.
   */
  static import(dump: PuzzleDump): Puzzle {
    const puzzle = new Puzzle({
      pieceRadius: dump.pieceRadius,
      proximity: dump.proximity,
    });
    puzzle.addPieces(dump.pieces.map(it => Piece.import(it)));
    puzzle.autoconnect();
    return puzzle;
  }
}
