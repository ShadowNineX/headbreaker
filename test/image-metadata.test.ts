// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { asImageMetadata } from '../src/image-metadata';

describe('image-metadata (jsdom)', () => {
  it('returns null for null input', () => {
    expect(asImageMetadata(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(asImageMetadata(undefined)).toBeNull();
  });

  it('wraps an HTMLImageElement with default offset and scale', () => {
    const img = document.createElement('img');
    const meta = asImageMetadata(img);
    expect(meta).not.toBeNull();
    expect(meta!.content).toBe(img);
    expect(meta!.offset).toEqual({ x: 1, y: 1 });
    expect(meta!.scale).toBe(1);
  });

  it('wraps an HTMLCanvasElement with default offset and scale', () => {
    const canvas = document.createElement('canvas');
    const meta = asImageMetadata(canvas);
    expect(meta).not.toBeNull();
    expect(meta!.content).toBe(canvas);
    expect(meta!.offset).toEqual({ x: 1, y: 1 });
    expect(meta!.scale).toBe(1);
  });

  it('returns existing ImageMetadata as-is', () => {
    const img = document.createElement('img');
    const original = { content: img, offset: { x: 5, y: 7 }, scale: 2 };
    const meta = asImageMetadata(original);
    expect(meta).toBe(original);
    expect(meta!.offset).toEqual({ x: 5, y: 7 });
    expect(meta!.scale).toBe(2);
  });
});
