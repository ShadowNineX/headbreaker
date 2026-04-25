/**
 * @module piece
 *
 * The {@link Piece} model and its associated types. A piece is one cell of a
 * jigsaw puzzle, with four sides ({@link Insert}s), an optional central
 * anchor (its position), and free-form metadata.
 */

import type { ImageLike } from './image-metadata';
import type { Insert } from './insert';
import type { Orthogonal } from './prelude';
import type Puzzle from './puzzle';
import type { Size } from './size';
import type { Vector } from './vector';
import { anchor, Anchor } from './anchor';
import { Connector } from './connector';
import { None } from './insert';
import * as Pair from './pair';
import { itself, orthogonalTransform } from './prelude';
import * as Structure from './structure';

/**
 * Listener invoked whenever a piece is translated.
 *
 * @callback TranslationListener
 * @param {Piece} piece - The piece that moved.
 * @param {number} dx - Horizontal displacement.
 * @param {number} dy - Vertical displacement.
 * @returns {void}
 */
export type TranslationListener = (
  piece: Piece,
  dx: number,
  dy: number,
) => void;

/**
 * Listener invoked when two pieces connect or disconnect.
 *
 * @callback ConnectionListener
 * @param {Piece} piece - The piece raising the event.
 * @param {Piece} target - The connected (or just-disconnected) neighbour.
 * @returns {void}
 */
export type ConnectionListener = (piece: Piece, target: Piece) => void;

/**
 * Optional text label rendered on a piece.
 */
export interface LabelMetadata {
  text?: string;
  fontSize?: number;
  x?: number;
  y?: number;
  fontFamily?: string;
  color?: string;
}

/**
 * Free-form metadata attached to a {@link Piece}.
 */
export interface PieceMetadata {
  /** Stable identifier used for figure lookups and serialization. */
  id: string | number;
  /** Position the piece should occupy when the puzzle is solved. */
  targetPosition: Vector;
  /** Current logical position of the piece. */
  currentPosition: Vector;
  color?: string;
  fixed?: boolean;
  strokeColor?: string;
  image?: ImageLike;
  label: LabelMetadata;
  scale?: number;
  [key: string]: unknown;
}

/**
 * Optional configuration accepted by {@link Piece}'s constructor.
 */
export interface PieceConfig {
  centralAnchor?: Vector;
  size?: Size;
  metadata?: Partial<PieceMetadata>;
}

/**
 * Compact reference to a connected piece used in {@link PieceDump}.
 */
export interface PieceConnectionDump {
  id: string | number | undefined;
}

/**
 * Serialized form of a {@link Piece}, suitable for JSON storage.
 */
export interface PieceDump {
  centralAnchor: Vector | null;
  size?: { radius: Vector };
  metadata: Partial<PieceMetadata>;
  connections?: Orthogonal<PieceConnectionDump | null | undefined>;
  structure: string;
}

/**
 * A single piece of a {@link Puzzle}.
 *
 * A piece is defined by its four-sided {@link Structure}, an optional
 * {@link Anchor} marking its center, an optional {@link Size}, and a metadata
 * bag that tooling and the rendering layer can read from.
 */
export default class Piece {
  up: Insert;
  down: Insert;
  left: Insert;
  right: Insert;
  metadata: PieceMetadata;
  centralAnchor!: Anchor | null;
  _size: Size | null;
  puzzle!: Puzzle;

  upConnection: Piece | null = null;
  downConnection: Piece | null = null;
  leftConnection: Piece | null = null;
  rightConnection: Piece | null = null;

  private _horizontalConnector: Connector | null = null;
  private _verticalConnector: Connector | null = null;

  translateListeners: TranslationListener[] = [];
  connectListeners: ConnectionListener[] = [];
  disconnectListeners: ConnectionListener[] = [];

  /**
   * @param {Structure.Structure} [structure] - Inserts on each side. Defaults to all {@link None}.
   * @param {PieceConfig} [config] - Initial position, size and metadata.
   */
  constructor(
    {
      up = None,
      down = None,
      left = None,
      right = None,
    }: Structure.Structure = {},
    config: PieceConfig = {},
  ) {
    this.up = up;
    this.down = down;
    this.left = left;
    this.right = right;
    this.metadata = {} as PieceMetadata;
    this.centralAnchor = null;
    this._size = null;
    this.configure(config);
  }

  /**
   * Applies a {@link PieceConfig} to the piece, optionally setting its
   * position, metadata and size.
   *
   * @param {PieceConfig} config - The configuration to apply.
   * @returns {void}
   */
  configure(config: PieceConfig): void {
    if (config.centralAnchor) {
      this.centerAround(Anchor.import(config.centralAnchor));
    }
    if (config.metadata) {
      this.annotate(config.metadata);
    }
    if (config.size) {
      this.resize(config.size);
    }
  }

  /**
   * Merges `metadata` into this piece's current metadata.
   *
   * @param {Partial<PieceMetadata> | null | undefined} metadata - Metadata to merge.
   * @returns {void}
   */
  annotate(metadata: Partial<PieceMetadata> | null | undefined): void {
    Object.assign(this.metadata, metadata);
  }

  /**
   * Replaces the entire metadata of this piece with `metadata`.
   *
   * @param {Partial<PieceMetadata>} metadata - The new metadata.
   * @returns {void}
   */
  reannotate(metadata: Partial<PieceMetadata>): void {
    this.metadata = metadata as PieceMetadata;
  }

  /**
   * Records the puzzle that owns this piece.
   *
   * @param {Puzzle} puzzle - The owning puzzle.
   * @returns {void}
   */
  belongTo(puzzle: Puzzle): void {
    this.puzzle = puzzle;
  }

  /** @returns {Piece[]} Currently connected neighbours, with nulls filtered out. */
  get presentConnections(): Piece[] {
    return this.connections.filter(itself) as Piece[];
  }

  /**
   * @returns {(Piece | null)[]} Direct neighbours in the order
   * `[right, down, left, up]`. Disconnected sides are `null`.
   */
  get connections(): (Piece | null)[] {
    return [
      this.rightConnection,
      this.downConnection,
      this.leftConnection,
      this.upConnection,
    ];
  }

  /** @returns {Insert[]} The four inserts in the order `[right, down, left, up]`. */
  get inserts(): Insert[] {
    return [this.right, this.down, this.left, this.up];
  }

  /**
   * Subscribes to translations of this piece.
   *
   * @param {TranslationListener} f - Listener to register.
   * @returns {void}
   */
  onTranslate(f: TranslationListener): void {
    this.translateListeners.push(f);
  }

  /**
   * Subscribes to connection events of this piece.
   *
   * @param {ConnectionListener} f - Listener to register.
   * @returns {void}
   */
  onConnect(f: ConnectionListener): void {
    this.connectListeners.push(f);
  }

  /**
   * Subscribes to disconnection events of this piece.
   *
   * @param {ConnectionListener} f - Listener to register.
   * @returns {void}
   */
  onDisconnect(f: ConnectionListener): void {
    this.disconnectListeners.push(f);
  }

  /**
   * Notifies every registered {@link TranslationListener}.
   *
   * @param {number} dx - Displacement on the x axis.
   * @param {number} dy - Displacement on the y axis.
   * @returns {void}
   */
  fireTranslate(dx: number, dy: number): void {
    this.translateListeners.forEach(it => it(this, dx, dy));
  }

  /**
   * Notifies every registered {@link ConnectionListener} of a new connection.
   *
   * @param {Piece} other - The newly connected neighbour.
   * @returns {void}
   */
  fireConnect(other: Piece): void {
    this.connectListeners.forEach(it => it(this, other));
  }

  /**
   * Notifies every registered {@link ConnectionListener} of disconnections.
   *
   * @param {Piece[]} others - The neighbours that were just disconnected.
   * @returns {void}
   */
  fireDisconnect(others: Piece[]): void {
    others.forEach((other) => {
      this.disconnectListeners.forEach(it => it(this, other));
    });
  }

  /**
   * Connects this piece vertically with `other`.
   *
   * @param {Piece} other - The neighbour piece.
   * @param {boolean} [back] - See {@link Connector#connectWith}.
   * @returns {void}
   */
  connectVerticallyWith(other: Piece, back: boolean = false): void {
    this.verticalConnector.connectWith(this, other, this.proximity, back);
  }

  /**
   * Pulls `other` into vertical alignment with this piece.
   *
   * @param {Piece} other - The neighbour piece.
   * @param {boolean} [back] - See {@link Connector#attract}.
   * @returns {void}
   */
  attractVertically(other: Piece, back: boolean = false): void {
    this.verticalConnector.attract(this, other, back);
  }

  /**
   * Connects this piece horizontally with `other`.
   *
   * @param {Piece} other - The neighbour piece.
   * @param {boolean} [back] - See {@link Connector#connectWith}.
   * @returns {void}
   */
  connectHorizontallyWith(other: Piece, back: boolean = false): void {
    this.horizontalConnector.connectWith(this, other, this.proximity, back);
  }

  /**
   * Pulls `other` into horizontal alignment with this piece.
   *
   * @param {Piece} other - The neighbour piece.
   * @param {boolean} [back] - See {@link Connector#attract}.
   * @returns {void}
   */
  attractHorizontally(other: Piece, back: boolean = false): void {
    this.horizontalConnector.attract(this, other, back);
  }

  /**
   * Tries to connect this piece with `other` on both axes, ignoring failures.
   *
   * @param {Piece} other - The neighbour piece.
   * @param {boolean} [back] - See {@link Connector#connectWith}.
   * @returns {void}
   */
  tryConnectWith(other: Piece, back: boolean = false): void {
    this.tryConnectHorizontallyWith(other, back);
    this.tryConnectVerticallyWith(other, back);
  }

  /**
   * Connects horizontally with `other` if and only if it is allowed.
   *
   * @param {Piece} other - The neighbour piece.
   * @param {boolean} [back] - See {@link Connector#connectWith}.
   * @returns {void}
   */
  tryConnectHorizontallyWith(other: Piece, back: boolean = false): void {
    if (this.canConnectHorizontallyWith(other)) {
      this.connectHorizontallyWith(other, back);
    }
  }

  /**
   * Connects vertically with `other` if and only if it is allowed.
   *
   * @param {Piece} other - The neighbour piece.
   * @param {boolean} [back] - See {@link Connector#connectWith}.
   * @returns {void}
   */
  tryConnectVerticallyWith(other: Piece, back: boolean = false): void {
    if (this.canConnectVerticallyWith(other)) {
      this.connectVerticallyWith(other, back);
    }
  }

  /**
   * Removes every existing connection and notifies disconnection listeners.
   *
   * @returns {void}
   */
  disconnect(): void {
    if (!this.connected)
      return;
    const connections = this.presentConnections;

    if (this.upConnection) {
      this.upConnection.downConnection = null;
      this.upConnection = null;
    }
    if (this.downConnection) {
      this.downConnection.upConnection = null;
      this.downConnection = null;
    }
    if (this.leftConnection) {
      this.leftConnection.rightConnection = null;
      this.leftConnection = null;
    }
    if (this.rightConnection) {
      this.rightConnection.leftConnection = null;
      this.rightConnection = null;
    }
    this.fireDisconnect(connections);
  }

  /**
   * Sets the central anchor of this piece. Must be called only once.
   *
   * @param {Anchor} a - The new central anchor.
   * @returns {void}
   * @throws {Error} If the piece has already been centered.
   */
  centerAround(a: Anchor): void {
    if (this.centralAnchor) {
      throw new Error(
        'this pieces has already being centered. Use recenterAround instead',
      );
    }
    this.centralAnchor = a;
  }

  /**
   * Convenience around {@link Piece#centerAround} that builds an anchor at `(x, y)`.
   *
   * @param {number} x - Center x coordinate.
   * @param {number} y - Center y coordinate.
   * @returns {void}
   */
  locateAt(x: number, y: number): void {
    this.centerAround(anchor(x, y));
  }

  /**
   * Whether the piece's center is exactly at `(x, y)`.
   *
   * @param {number} x - Target x coordinate.
   * @param {number} y - Target y coordinate.
   * @returns {boolean} Whether this piece is positioned at the given coordinates.
   */
  isAt(x: number, y: number): boolean {
    return this.centralAnchor!.isAt(x, y);
  }

  /**
   * Moves the central anchor to `a`, translating the piece accordingly.
   *
   * @param {Anchor} a - The new center.
   * @param {boolean} [quiet] - When `true`, listeners are not notified.
   * @returns {void}
   */
  recenterAround(a: Anchor, quiet: boolean = false): void {
    const [dx, dy] = a.diff(this.centralAnchor!);
    this.translate(dx, dy, quiet);
  }

  /**
   * Convenience around {@link Piece#recenterAround} that builds an anchor at `(x, y)`.
   *
   * @param {number} x - New center x coordinate.
   * @param {number} y - New center y coordinate.
   * @param {boolean} [quiet] - When `true`, listeners are not notified.
   * @returns {void}
   */
  relocateTo(x: number, y: number, quiet: boolean = false): void {
    this.recenterAround(anchor(x, y), quiet);
  }

  /**
   * Translates this piece by `(dx, dy)` and notifies listeners.
   *
   * @param {number} dx - Horizontal displacement.
   * @param {number} dy - Vertical displacement.
   * @param {boolean} [quiet] - When `true`, listeners are not notified.
   * @returns {void}
   */
  translate(dx: number, dy: number, quiet: boolean = false): void {
    if (!Pair.isNull(dx, dy)) {
      this.centralAnchor!.translate(dx, dy);
      if (!quiet) {
        this.fireTranslate(dx, dy);
      }
    }
  }

  /**
   * Translates this piece and recursively pushes every connected neighbour
   * along by the same displacement.
   *
   * @param {number} dx - Horizontal displacement.
   * @param {number} dy - Vertical displacement.
   * @param {boolean} [quiet] - When `true`, listeners are not notified.
   * @param {Piece[]} [pushedPieces] - Pieces already pushed in this cascade. Internal.
   * @returns {void}
   */
  push(
    dx: number,
    dy: number,
    quiet: boolean = false,
    pushedPieces: Piece[] = [this],
  ): void {
    this.translate(dx, dy, quiet);
    const stationaries = this.presentConnections.filter(
      it => !pushedPieces.includes(it),
    );
    pushedPieces.push(...stationaries);
    stationaries.forEach(it => it.push(dx, dy, false, pushedPieces));
  }

  /**
   * Drags this piece by `(dx, dy)`, disconnecting from neighbours when the
   * configured drag mode allows it.
   *
   * @param {number} dx - Horizontal displacement.
   * @param {number} dy - Vertical displacement.
   * @param {boolean} [quiet] - When `true`, listeners are not notified.
   * @returns {void}
   */
  drag(dx: number, dy: number, quiet: boolean = false): void {
    if (Pair.isNull(dx, dy))
      return;
    if (this.dragShouldDisconnect(dx, dy)) {
      this.disconnect();
      this.translate(dx, dy, quiet);
    }
    else {
      this.push(dx, dy, quiet);
    }
  }

  /**
   * Asks the owning puzzle's drag mode whether dragging by `(dx, dy)` should
   * cause this piece to disconnect.
   *
   * @param {number} dx - Horizontal displacement.
   * @param {number} dy - Vertical displacement.
   * @returns {boolean} Whether the drag motion should disconnect this piece.
   */
  dragShouldDisconnect(dx: number, dy: number): boolean {
    return this.puzzle.dragShouldDisconnect(this, dx, dy);
  }

  /**
   * Notifies the owning puzzle that the user has dropped the piece, allowing
   * autoconnection with neighbours.
   *
   * @returns {void}
   */
  drop(): void {
    this.puzzle.autoconnectWith(this);
  }

  /**
   * Performs {@link Piece#drag} immediately followed by {@link Piece#drop}.
   *
   * @param {number} dx - Horizontal displacement.
   * @param {number} dy - Vertical displacement.
   * @returns {void}
   */
  dragAndDrop(dx: number, dy: number): void {
    this.drag(dx, dy);
    this.drop();
  }

  /**
   * Whether this piece can connect horizontally with `other`.
   *
   * @param {Piece} other - The neighbour piece.
   * @returns {boolean} Whether a horizontal connection is possible.
   */
  canConnectHorizontallyWith(other: Piece): boolean {
    return this.horizontalConnector.canConnectWith(this, other, this.proximity);
  }

  /**
   * Whether this piece can connect vertically with `other`.
   *
   * @param {Piece} other - The neighbour piece.
   * @returns {boolean} Whether a vertical connection is possible.
   */
  canConnectVerticallyWith(other: Piece): boolean {
    return this.verticalConnector.canConnectWith(this, other, this.proximity);
  }

  /**
   * Whether `other` is within vertical proximity of this piece.
   *
   * @param {Piece} other - The neighbour piece.
   * @returns {boolean} Whether `other` is close enough vertically to snap.
   */
  verticallyCloseTo(other: Piece): boolean {
    return this.verticalConnector.closeTo(this, other, this.proximity);
  }

  /**
   * Whether `other` is within horizontal proximity of this piece.
   *
   * @param {Piece} other - The neighbour piece.
   * @returns {boolean} Whether `other` is close enough horizontally to snap.
   */
  horizontallyCloseTo(other: Piece): boolean {
    return this.horizontalConnector.closeTo(this, other, this.proximity);
  }

  /**
   * Whether the vertical inserts of this piece and `other` match.
   *
   * @param {Piece} other - The neighbour piece.
   * @returns {boolean} Whether the vertical inserts are complementary.
   */
  verticallyMatch(other: Piece): boolean {
    return this.verticalConnector.match(this, other);
  }

  /**
   * Whether the horizontal inserts of this piece and `other` match.
   *
   * @param {Piece} other - The neighbour piece.
   * @returns {boolean} Whether the horizontal inserts are complementary.
   */
  horizontallyMatch(other: Piece): boolean {
    return this.horizontalConnector.match(this, other);
  }

  /** @returns {boolean} `true` when at least one side is connected to a neighbour. */
  get connected(): boolean {
    return !!(
      this.upConnection
      || this.downConnection
      || this.leftConnection
      || this.rightConnection
    );
  }

  /** @returns {Anchor} The anchor at the center of the piece's bottom edge. */
  get downAnchor(): Anchor {
    return this.centralAnchor!.translated(0, this.radius.y);
  }

  /** @returns {Anchor} The anchor at the center of the piece's right edge. */
  get rightAnchor(): Anchor {
    return this.centralAnchor!.translated(this.radius.x, 0);
  }

  /** @returns {Anchor} The anchor at the center of the piece's top edge. */
  get upAnchor(): Anchor {
    return this.centralAnchor!.translated(0, -this.radius.y);
  }

  /** @returns {Anchor} The anchor at the center of the piece's left edge. */
  get leftAnchor(): Anchor {
    return this.centralAnchor!.translated(-this.radius.x, 0);
  }

  /**
   * Overrides the size of this piece. When unset, the piece falls back to the
   * size declared on the owning puzzle.
   *
   * @param {Size} size - The new size.
   * @returns {void}
   */
  resize(size: Size): void {
    this._size = size;
  }

  /** @returns {Vector} Half the diameter on each axis. */
  get radius(): Vector {
    return this.size.radius;
  }

  /** @returns {Vector} The full size of the piece on each axis. */
  get diameter(): Vector {
    return this.size.diameter;
  }

  /** @returns {Size} The piece-specific size, or the puzzle's piece size as fallback. */
  get size(): Size {
    return this._size || this.puzzle.pieceSize;
  }

  /** @returns {number} Maximum per-axis distance considered "close" by connectors. */
  get proximity(): number {
    return this.puzzle.proximity;
  }

  /** @returns {string | number} Convenience accessor for `metadata.id`. */
  get id(): string | number {
    return this.metadata.id;
  }

  /** @returns {Connector} The horizontal connector this piece uses. */
  get horizontalConnector(): Connector {
    return this.getConnector('horizontal');
  }

  /** @returns {Connector} The vertical connector this piece uses. */
  get verticalConnector(): Connector {
    return this.getConnector('vertical');
  }

  /**
   * Returns the connector for the given orientation, falling back to the
   * one provided by the owning puzzle when there is no piece-specific one.
   *
   * @param {'vertical' | 'horizontal'} kind - Which connector to return.
   * @returns {Connector} The connector for the given axis.
   */
  getConnector(kind: 'vertical' | 'horizontal'): Connector {
    if (kind === 'horizontal') {
      if (this.puzzle && !this._horizontalConnector) {
        return this.puzzle.horizontalConnector;
      }
      this._horizontalConnector ??= Connector.horizontal();
      return this._horizontalConnector;
    }
    else {
      if (this.puzzle && !this._verticalConnector) {
        return this.puzzle.verticalConnector;
      }
      this._verticalConnector ??= Connector.vertical();
      return this._verticalConnector;
    }
  }

  /**
   * Serializes this piece into a {@link PieceDump}.
   *
   * @param {{ compact?: boolean }} [options] - When `compact` is true, the
   *   `connections` field is omitted.
   * @returns {PieceDump} The serialized piece.
   */
  export({ compact = false } = {}): PieceDump {
    const base: PieceDump = {
      centralAnchor: this.centralAnchor ? this.centralAnchor.export() : null,
      structure: Structure.serialize(this),
      metadata: this.metadata,
    };
    if (this._size) {
      base.size = { radius: this._size.radius };
    }
    return compact
      ? base
      : Object.assign(base, {
          connections: orthogonalTransform(this.connections, (it: Piece) => ({
            id: it.id,
          })),
        });
  }

  /**
   * Reconstructs a {@link Piece} from a {@link PieceDump}.
   *
   * @param {PieceDump} dump - The serialized piece.
   * @returns {Piece} The reconstructed piece.
   */
  static import(dump: PieceDump): Piece {
    return new Piece(Structure.deserialize(dump.structure), {
      centralAnchor: dump.centralAnchor ?? undefined,
      metadata: dump.metadata,
      size: dump.size as Size | undefined,
    });
  }
}
