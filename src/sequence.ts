import type { Insert } from './insert';
import { None, Slot, Tab } from './insert';

/**
 * A function that produces the {@link Insert} at the given step `n` of a
 * sequence. Used to build the structure of a puzzle row or column.
 *
 * @param {number} n - Zero-based step index.
 * @returns {Insert} The insert at step `n`.
 */
export type InsertsGenerator = (index: number) => Insert;

/**
 * Generator that always yields {@link Tab}.
 *
 * @param {number} _n - Unused step index.
 * @returns {Insert} Always {@link Tab}.
 */
export function fixed(_n: number): Insert {
  return Tab;
}

/**
 * Generator that alternates {@link Tab} and {@link Slot} on every step.
 *
 * @param {number} n - Zero-based step index.
 * @returns {Insert} {@link Tab} for even indices, {@link Slot} for odd ones.
 */
export function flipflop(n: number): Insert {
  return n % 2 === 0 ? Tab : Slot;
}

/**
 * Generator that produces two tabs followed by two slots, repeating.
 *
 * @param {number} n - Zero-based step index.
 * @returns {Insert} {@link Tab} or {@link Slot} according to `n mod 4`.
 */
export function twoAndTwo(n: number): Insert {
  return n % 4 < 2 ? Tab : Slot;
}

/**
 * Generator that picks {@link Tab} or {@link Slot} uniformly at random.
 *
 * @param {number} _ - Unused step index.
 * @returns {Insert} A randomly chosen {@link Tab} or {@link Slot}.
 */
export function random(_: number): Insert {
  return Math.random() < 0.5 ? Tab : Slot;
}

/**
 * Stateful iterator over an {@link InsertsGenerator}.
 *
 * It tracks the previous and current insert so that {@link previousComplement}
 * can be used to make the entering side of a piece complementary to the
 * outgoing side of the piece before it.
 */
export class InsertSequence {
  /** The underlying generator. */
  generator: InsertsGenerator;
  /** Number of steps already consumed. */
  n: number;
  private _previous!: Insert;
  private _current: Insert;

  /**
   * @param {InsertsGenerator} generator - The generator to iterate over.
   */
  constructor(generator: InsertsGenerator) {
    this.generator = generator;
    this.n = 0;
    this._current = None;
  }

  /**
   * Returns the {@link Insert} that complements the previously yielded one.
   *
   * @returns {Insert} Complement of the previous insert.
   */
  previousComplement(): Insert {
    return this._previous.complement();
  }

  /**
   * Returns the current insert, or {@link None} when the sequence has reached
   * its last step.
   *
   * @param {number} max - Number of steps in the sequence.
   * @returns {Insert} The current insert, or {@link None} at the boundary.
   */
  current(max: number): Insert {
    if (this.n === max) {
      return None;
    }
    return this._current;
  }

  /**
   * Advances the sequence by one step and returns the new current insert.
   *
   * @returns {Insert} The newly produced insert.
   */
  next(): Insert {
    this._previous = this._current;
    this._current = this.generator(this.n++);
    return this._current;
  }
}
