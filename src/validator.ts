/**
 * @module validator
 *
 * Pluggable validation strategies attached to {@link Puzzle#validator}.
 * Concrete validators report whether the puzzle is currently "solved" under
 * some application-specific notion, and notify listeners on state transitions.
 */

import type Piece from './piece';
import type Puzzle from './puzzle';
import * as Pair from './pair';

/**
 * Listener invoked whenever a {@link Validator} transitions from invalid to
 * valid.
 *
 * @callback ValidationListener
 * @param {Puzzle} puzzle - The puzzle that became valid.
 * @returns {void}
 */
export type ValidationListener = (puzzle: Puzzle) => void;

/**
 * Predicate evaluated against a single {@link Piece}.
 *
 * @callback PieceCondition
 * @param {Piece} piece - The piece to test.
 * @returns {boolean} `true` if the piece satisfies the condition.
 */
export type PieceCondition = (piece: Piece) => boolean;

/**
 * Predicate evaluated against an entire {@link Puzzle}.
 *
 * @callback PuzzleCondition
 * @param {Puzzle} puzzle - The puzzle to test.
 * @returns {boolean} `true` if the puzzle satisfies the condition.
 */
export type PuzzleCondition = (puzzle: Puzzle) => boolean;

/**
 * Union of the concrete validator implementations bundled with headbreaker.
 */
export type Validator = PieceValidator | PuzzleValidator | NullValidator;

/**
 * Common base class for validators. Tracks validity state and notifies
 * listeners on the invalid → valid transition.
 */
abstract class AbstractValidator {
  /** Listeners notified on the invalid → valid transition. */
  validListeners: ValidationListener[];
  _valid: boolean | undefined;

  constructor() {
    this.validListeners = [];
    this._valid = undefined;
  }

  /**
   * Recomputes the validity state and fires {@link onValid} listeners when
   * the puzzle has just become valid.
   *
   * @param {Puzzle} puzzle - The puzzle to validate.
   * @returns {void}
   */
  validate(puzzle: Puzzle): void {
    const wasValid = this._valid;
    this.updateValidity(puzzle);
    if (this._valid && !wasValid) {
      this.fireValid(puzzle);
    }
  }

  /**
   * Recomputes and stores the validity state without firing listeners.
   *
   * @param {Puzzle} puzzle - The puzzle to evaluate.
   * @returns {void}
   */
  updateValidity(puzzle: Puzzle): void {
    this._valid = this.isValid(puzzle);
  }

  /**
   * Returns whether the puzzle currently satisfies this validator.
   *
   * @abstract
   * @param {Puzzle} puzzle - The puzzle to check.
   * @returns {boolean} `true` if the puzzle is valid.
   */
  abstract isValid(puzzle: Puzzle): boolean;

  /**
   * Fires every registered {@link ValidationListener}.
   *
   * @param {Puzzle} puzzle - The puzzle passed to each listener.
   * @returns {void}
   */
  fireValid(puzzle: Puzzle): void {
    this.validListeners.forEach(it => it(puzzle));
  }

  /**
   * Subscribes `f` to the invalid → valid transition.
   *
   * @param {ValidationListener} f - Listener to register.
   * @returns {void}
   */
  onValid(f: ValidationListener): void {
    this.validListeners.push(f);
  }

  /**
   * The last computed validity, or `undefined` before the first {@link validate}.
   *
   * @returns {boolean | undefined}
   */
  get valid(): boolean | undefined {
    return this._valid;
  }

  /**
   * Whether this validator is the {@link NullValidator}.
   *
   * @returns {boolean}
   */
  get isNull(): boolean {
    return false;
  }
}

/**
 * Validator that succeeds when **every** piece satisfies a {@link PieceCondition}.
 */
export class PieceValidator extends AbstractValidator {
  /** The per-piece predicate. */
  condition: PieceCondition;

  /**
   * @param {PieceCondition} f - Predicate evaluated against every piece.
   */
  constructor(f: PieceCondition) {
    super();
    this.condition = f;
  }

  /**
   * @override
   * @param {Puzzle} puzzle - The puzzle to check.
   * @returns {boolean} `true` when every piece satisfies {@link PieceValidator#condition}.
   */
  isValid(puzzle: Puzzle): boolean {
    return puzzle.pieces.every(it => this.condition(it));
  }
}

/**
 * Validator that succeeds when the puzzle satisfies a {@link PuzzleCondition}.
 */
export class PuzzleValidator extends AbstractValidator {
  /** The whole-puzzle predicate. */
  condition: PuzzleCondition;

  /**
   * @param {PuzzleCondition} f - Predicate evaluated against the whole puzzle.
   */
  constructor(f: PuzzleCondition) {
    super();
    this.condition = f;
  }

  /**
   * @override
   * @param {Puzzle} puzzle - The puzzle to check.
   * @returns {boolean} `true` when the puzzle satisfies {@link PuzzleValidator#condition}.
   */
  isValid(puzzle: Puzzle): boolean {
    return this.condition(puzzle);
  }

  /**
   * Default tolerance used when comparing piece offsets.
   *
   * @readonly
   * @default 0.01
   */
  static readonly DIFF_DELTA = 0.01;

  /**
   * Whether two `[dx, dy]` differences match within {@link PuzzleValidator.DIFF_DELTA}.
   *
   * @param {Pair.Pair} reference - Reference difference.
   * @param {Pair.Pair} other - Difference to compare.
   * @returns {boolean} `true` when the differences are close enough.
   */
  static equalDiffs([dx0, dy0]: Pair.Pair, [dx, dy]: Pair.Pair): boolean {
    return Pair.equal(dx0, dy0, dx, dy, PuzzleValidator.DIFF_DELTA);
  }

  /**
   * Built-in {@link PuzzleCondition} that succeeds when every piece is
   * connected to at least one neighbour.
   *
   * @type {PuzzleCondition}
   */
  static readonly connected: PuzzleCondition = (puzzle: Puzzle) =>
    puzzle.connected;

  /**
   * Builds a {@link PuzzleCondition} that succeeds when every piece's relative
   * reference position matches the corresponding entry in `expected`.
   *
   * @param {Pair.Pair[]} expected - Expected reference positions, one per piece.
   * @returns {PuzzleCondition} The matching condition.
   */
  static relativeRefs(expected: Pair.Pair[]): PuzzleCondition {
    function d(x: number, y: number, index: number): Pair.Pair {
      return Pair.diff(x, y, ...expected[index]);
    }
    return (puzzle: Puzzle) => {
      const refs = puzzle.refs;
      const [x0, y0] = refs[0];
      const diff0 = d(x0, y0, 0);
      return refs.every(([x, y], index) =>
        PuzzleValidator.equalDiffs(diff0, d(x, y, index)),
      );
    };
  }
}

/**
 * No-op validator. Always reports the puzzle as invalid and is identifiable
 * via {@link AbstractValidator#isNull}.
 */
export class NullValidator extends AbstractValidator {
  /**
   * @override
   * @param {Puzzle} _puzzle - Ignored.
   * @returns {boolean} Always `false`.
   */
  isValid(_puzzle: Puzzle): boolean {
    return false;
  }

  /**
   * @override
   * @returns {boolean} Always `true`.
   */
  get isNull(): boolean {
    return true;
  }
}
