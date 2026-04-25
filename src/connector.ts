import type { Anchor } from './anchor';
import type { Insert } from './insert';
import type Piece from './piece';
import { pivot } from './prelude';

/**
 * Predicate that decides whether two pieces are allowed to connect along a
 * connector axis, regardless of the geometric proximity check.
 *
 * @param {Piece} one - The forward piece.
 * @param {Piece} other - The backward piece.
 * @returns {boolean} `true` if the connection is allowed.
 */
export type ConnectionRequirement = (one: Piece, other: Piece) => boolean;

/**
 * The default {@link ConnectionRequirement}: always allows connections.
 *
 * @param {Piece} _one - Ignored.
 * @param {Piece} _other - Ignored.
 * @returns {boolean} Always `true`.
 */
export function noConnectionRequirements(_one: Piece, _other: Piece): boolean {
  return true;
}

type InsertKey = 'right' | 'down' | 'left' | 'up';
type AnchorKey = 'rightAnchor' | 'downAnchor' | 'leftAnchor' | 'upAnchor';
type ConnectionKey
  = | 'rightConnection'
    | 'downConnection'
    | 'leftConnection'
    | 'upConnection';

interface PieceAccessor {
  forward: InsertKey;
  backward: InsertKey;
  forwardAnchor: AnchorKey;
  backwardAnchor: AnchorKey;
  forwardConnection: ConnectionKey;
  backwardConnection: ConnectionKey;
}

/**
 * Implements connection logic between two pieces along a single axis.
 *
 * A {@link Connector} knows how to test proximity, match inserts, attract
 * pieces together and bookkeep mutual connection references in either the
 * horizontal (`right`/`left`) or vertical (`down`/`up`) orientation.
 */
export class Connector {
  /** The axis this connector operates on (`'x'` for horizontal, `'y'` for vertical). */
  axis: 'x' | 'y';
  private readonly accessor: PieceAccessor;
  /** Optional extra requirement evaluated on every connection attempt. */
  requirement: ConnectionRequirement;

  /**
   * @param {'x' | 'y'} axis - Axis along which this connector operates.
   * @param {'right' | 'down'} forward - Name of the forward side.
   * @param {'left' | 'up'} backward - Name of the backward side.
   */
  constructor(
    axis: 'x' | 'y',
    forward: 'right' | 'down',
    backward: 'left' | 'up',
  ) {
    this.axis = axis;
    this.accessor = {
      forward,
      backward,
      forwardAnchor: `${forward}Anchor` as AnchorKey,
      backwardAnchor: `${backward}Anchor` as AnchorKey,
      forwardConnection: `${forward}Connection` as ConnectionKey,
      backwardConnection: `${backward}Connection` as ConnectionKey,
    };
    this.requirement = noConnectionRequirements;
  }

  private getInsert(piece: Piece, key: InsertKey): Insert {
    return piece[key];
  }

  private getAnchor(piece: Piece, key: AnchorKey): Anchor {
    return piece[key];
  }

  private getConnection(piece: Piece, key: ConnectionKey): Piece | null {
    return piece[key];
  }

  private setConnection(
    piece: Piece,
    key: ConnectionKey,
    value: Piece | null,
  ): void {
    piece[key] = value;
  }

  /**
   * Pulls one of the two pieces so that their facing anchors coincide on the
   * configured axis.
   *
   * @param {Piece} one - First piece.
   * @param {Piece} other - Second piece.
   * @param {boolean} [back] - Reverses which piece moves; see {@link pivot}.
   * @returns {void}
   */
  attract(one: Piece, other: Piece, back: boolean = false): void {
    const [iron, magnet] = pivot(one, other, back);
    let dx: number, dy: number;
    if (magnet.centralAnchor![this.axis] > iron.centralAnchor![this.axis]) {
      [dx, dy] = this.getAnchor(magnet, this.accessor.backwardAnchor).diff(
        this.getAnchor(iron, this.accessor.forwardAnchor),
      );
    }
    else {
      [dx, dy] = this.getAnchor(magnet, this.accessor.forwardAnchor).diff(
        this.getAnchor(iron, this.accessor.backwardAnchor),
      );
    }
    iron.push(dx, dy);
  }

  /**
   * Whether moving `one` by `delta` on this axis is unobstructed by an
   * existing connection.
   *
   * @param {Piece} one - The piece being dragged.
   * @param {number} delta - Signed displacement on this axis.
   * @returns {boolean} `true` when `one` is free to move by `delta`.
   */
  openMovement(one: Piece, delta: number): boolean {
    return (
      (delta > 0
        && !this.getConnection(one, this.accessor.forwardConnection))
      || (delta < 0
        && !this.getConnection(one, this.accessor.backwardConnection))
      || delta === 0
    );
  }

  /**
   * Whether `one` can connect with `other`: they must be close enough,
   * have matching inserts, and satisfy {@link Connector#requirement}.
   *
   * @param {Piece} one - Forward piece.
   * @param {Piece} other - Backward piece.
   * @param {number} proximity - Maximum per-axis distance to consider close.
   * @returns {boolean} `true` if the pieces can connect.
   */
  canConnectWith(one: Piece, other: Piece, proximity: number): boolean {
    return (
      this.closeTo(one, other, proximity)
      && this.match(one, other)
      && this.requirement(one, other)
    );
  }

  /**
   * Whether the forward anchor of `one` is within `proximity` of the
   * backward anchor of `other`.
   *
   * @param {Piece} one - Forward piece.
   * @param {Piece} other - Backward piece.
   * @param {number} proximity - Maximum per-axis distance.
   * @returns {boolean} `true` when the anchors are close enough.
   */
  closeTo(one: Piece, other: Piece, proximity: number): boolean {
    return this.getAnchor(one, this.accessor.forwardAnchor).closeTo(
      this.getAnchor(other, this.accessor.backwardAnchor),
      proximity,
    );
  }

  /**
   * Whether the forward insert of `one` matches the backward insert of `other`.
   *
   * @param {Piece} one - Forward piece.
   * @param {Piece} other - Backward piece.
   * @returns {boolean} `true` when the inserts complement each other.
   */
  match(one: Piece, other: Piece): boolean {
    return this.getInsert(one, this.accessor.forward).match(
      this.getInsert(other, this.accessor.backward),
    );
  }

  /**
   * Connects `one` and `other`, attracting them together and storing the
   * mutual references. Throws when the pieces cannot connect.
   *
   * @param {Piece} one - Forward piece.
   * @param {Piece} other - Backward piece.
   * @param {number} proximity - Maximum per-axis distance to allow snapping.
   * @param {boolean} back - Reverses which piece moves during the attraction.
   * @returns {void}
   * @throws {Error} If {@link Connector#canConnectWith} is `false`.
   */
  connectWith(
    one: Piece,
    other: Piece,
    proximity: number,
    back: boolean,
  ): void {
    if (!this.canConnectWith(one, other, proximity)) {
      throw new Error(`can not connect ${this.accessor.forward}!`);
    }
    if (this.getConnection(one, this.accessor.forwardConnection) !== other) {
      const iron = other;
      const magnet = one;
      this.attract(iron, magnet, back);
      this.setConnection(one, this.accessor.forwardConnection, other);
      this.setConnection(other, this.accessor.backwardConnection, one);
      one.fireConnect(other);
    }
  }

  /**
   * Replaces the current {@link ConnectionRequirement}.
   *
   * @param {ConnectionRequirement} requirement - The new requirement.
   * @returns {void}
   */
  attachRequirement(requirement: ConnectionRequirement): void {
    this.requirement = requirement;
  }

  /**
   * Builds a horizontal connector (`right`/`left`).
   *
   * @returns {Connector} A new horizontal connector.
   */
  static horizontal(): Connector {
    return new Connector('x', 'right', 'left');
  }

  /**
   * Builds a vertical connector (`down`/`up`).
   *
   * @returns {Connector} A new vertical connector.
   */
  static vertical(): Connector {
    return new Connector('y', 'down', 'up');
  }
}
