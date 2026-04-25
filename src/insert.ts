/**
 * @module insert
 *
 * The three possible shapes of a piece's side: {@link Tab}, {@link Slot} and
 * {@link None}. Inserts are immutable singletons; never mutate them.
 */

/**
 * The shape of a single side of a {@link Piece}.
 *
 * Implementations are immutable singletons (see {@link Tab}, {@link Slot},
 * {@link None}). A piece side fits into another only when their inserts are
 * complementary.
 *
 * @example
 * Tab.match(Slot);   // true
 * Tab.match(Tab);    // false
 * None.match(None);  // false  (borders never match)
 */
export interface Insert {
  /** @returns {boolean} `true` when this insert is a slot (concave). */
  isSlot: () => boolean;
  /** @returns {boolean} `true` when this insert is a tab (convex). */
  isTab: () => boolean;
  /** @returns {boolean} `true` when this insert is a flat border (no insert). */
  isNone: () => boolean;
  /**
   * @param {Insert} other - Insert from the opposing side.
   * @returns {boolean} Whether this insert can connect to `other`.
   */
  match: (other: Insert) => boolean;
  /** @returns {string} Human-readable name of this insert. */
  toString: () => string;
  /** @returns {Insert} The complementary insert (Tab ↔ Slot, None ↔ None). */
  complement: () => Insert;
  /** @returns {string} Single-character serialization of this insert. */
  serialize: () => string;
}

/**
 * Convex (outwards) insert. Matches against {@link Slot}.
 *
 * @type {Insert}
 */
export const Tab: Insert = {
  isSlot: () => false,
  isTab: () => true,
  isNone: () => false,
  match: (other: Insert) => other.isSlot(),
  toString: () => 'Tab',
  complement: () => Slot,
  serialize: () => 'T',
};

/**
 * Concave (inwards) insert. Matches against {@link Tab}.
 *
 * @type {Insert}
 */
export const Slot: Insert = {
  isSlot: () => true,
  isTab: () => false,
  isNone: () => false,
  match: (other: Insert) => other.isTab(),
  toString: () => 'Slot',
  complement: () => Tab,
  serialize: () => 'S',
};

/**
 * Flat border insert (no tab and no slot). Cannot match against anything.
 *
 * @type {Insert}
 */
export const None: Insert = {
  isSlot: () => false,
  isTab: () => false,
  isNone: () => true,
  match: (_other: Insert) => false,
  toString: () => 'None',
  complement: () => None,
  serialize: () => '-',
};
