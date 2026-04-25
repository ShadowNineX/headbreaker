/**
 * @module headbreaker
 *
 * Default entry point of the headbreaker library. Re-exports every named
 * export from {@link exports} and additionally exposes them as a single
 * `headbreaker` namespace as the module's default export.
 *
 * @example
 * // Named imports
 * import { Canvas, Puzzle } from 'headbreaker';
 *
 * @example
 * // Default (namespaced) import
 * import headbreaker from 'headbreaker';
 * const canvas = new headbreaker.Canvas('id', { width: 800, height: 600 });
 */
import * as headbreaker from './exports';

export * from './exports';
export type * from './exports';
export default headbreaker;
