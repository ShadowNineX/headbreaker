/**
 * @module structure
 *
 * Helpers to describe the four-sided structure of a piece, plus its
 * compact 4-character serialization (right, down, left, up).
 */

import type { Insert } from './insert';
import { None, Slot, Tab } from './insert';
import { orthogonalMap } from './prelude';

/**
 * The four-sided structure of a piece, describing its tabs, slots and borders.
 *
 * Any side that is omitted is treated as {@link None}.
 */
export interface Structure {
  up?: Insert;
  down?: Insert;
  left?: Insert;
  right?: Insert;
}

/**
 * Either a full {@link Structure} object or its serialized string form.
 *
 * @see {@link asStructure} for the conversion.
 *
 * @example
 * const a: StructureLike = { up: Tab, down: Slot };
 * const b: StructureLike = 'TS--'; // right=Tab, down=Slot, left=None, up=None
 */
export type StructureLike = Structure | string;

/**
 * Parses a single character produced by {@link Insert.serialize}.
 *
 * @param {string} insert - One of `'S'`, `'T'`, or anything else for `None`.
 * @returns {Insert} The matching {@link Insert}.
 */
function parseInsert(insert: string): Insert {
  if (insert === 'S')
    return Slot;
  if (insert === 'T')
    return Tab;
  return None;
}

/**
 * Encodes a {@link Structure} into a 4-character string in the order
 * `right, down, left, up`. Missing sides are encoded as {@link None}.
 *
 * @param {Structure} structure - The structure to serialize.
 * @returns {string} The 4-character serialization.
 */
export function serialize(structure: Structure): string {
  return orthogonalMap(
    [structure.right, structure.down, structure.left, structure.up],
    (it: Insert) => it.serialize(),
    None,
  ).join('');
}

/**
 * Decodes a 4-character string (produced by {@link serialize}) back into a
 * {@link Structure}.
 *
 * @param {string} str - The 4-character serialization to decode.
 * @returns {Structure} The decoded structure.
 * @throws {Error} If `str.length !== 4`.
 */
export function deserialize(str: string): Structure {
  if (str.length !== 4) {
    throw new Error('structure string must be 4-chars long');
  }
  return {
    right: parseInsert(str[0]),
    down: parseInsert(str[1]),
    left: parseInsert(str[2]),
    up: parseInsert(str[3]),
  };
}

/**
 * Coerces a {@link StructureLike} value into a {@link Structure}: strings are
 * parsed via {@link deserialize}, structures are returned as-is.
 *
 * @param {StructureLike} structureLike - The value to coerce.
 * @returns {Structure} The resulting structure.
 */
export function asStructure(structureLike: StructureLike): Structure {
  if (typeof structureLike === 'string') {
    return deserialize(structureLike);
  }
  return structureLike;
}
