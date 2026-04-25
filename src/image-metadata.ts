/**
 * @module image-metadata
 *
 * Helpers to coerce caller-supplied image values into a uniform
 * {@link ImageMetadata} shape used by the rendering layer.
 */

import type { Vector } from './vector';
import { vector } from './vector';

/**
 * A picture used to fill the body of a piece, plus optional positioning info.
 */
export interface ImageMetadata {
  /** The HTML image or canvas to render. */
  content: HTMLImageElement | HTMLCanvasElement;
  /** Optional positional offset within the piece. */
  offset?: Vector;
  /** Optional uniform scale factor. */
  scale?: number;
}

/**
 * Either a raw image element, a canvas, or a structured {@link ImageMetadata}.
 */
export type ImageLike = HTMLImageElement | HTMLCanvasElement | ImageMetadata;

/**
 * Coerces an {@link ImageLike} value into an {@link ImageMetadata} object.
 *
 * - Raw `HTMLImageElement`/`HTMLCanvasElement` values are wrapped with a
 *   default offset of `(1, 1)` and scale `1`.
 * - `null`/`undefined` values become `null`.
 * - Existing {@link ImageMetadata} values are returned as-is.
 *
 * @param {ImageLike | null | undefined} imageLike - Value to coerce.
 * @returns {ImageMetadata | null} The structured metadata, or `null`.
 */
export function asImageMetadata(
  imageLike: ImageLike | null | undefined,
): ImageMetadata | null {
  if (!imageLike)
    return null;
  if (
    typeof HTMLImageElement !== 'undefined'
    && imageLike instanceof HTMLImageElement
  ) {
    return { content: imageLike, offset: vector(1, 1), scale: 1 };
  }
  if (
    typeof HTMLCanvasElement !== 'undefined'
    && imageLike instanceof HTMLCanvasElement
  ) {
    return { content: imageLike, offset: vector(1, 1), scale: 1 };
  }
  // At this point, imageLike must be ImageMetadata
  return imageLike as ImageMetadata;
}
