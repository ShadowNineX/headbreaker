import { describe, expect, it } from 'vitest';
import headbreaker, { anchor, Canvas, Manufacturer, Piece, Puzzle } from '../src/index';

describe('index exports', () => {
  it('supports named imports', () => {
    expect(anchor).toBeDefined();
    expect(Canvas).toBeDefined();
    expect(Manufacturer).toBeDefined();
    expect(Piece).toBeDefined();
    expect(Puzzle).toBeDefined();
  });

  it('supports default namespace import', () => {
    expect(headbreaker).toBeDefined();
    expect(headbreaker.anchor).toBeDefined();
    expect(headbreaker.Canvas).toBeDefined();
    expect(headbreaker.Manufacturer).toBeDefined();
    expect(headbreaker.Piece).toBeDefined();
    expect(headbreaker.Puzzle).toBeDefined();
  });

  it('named and default exports reference the same values', () => {
    expect(headbreaker.anchor).toBe(anchor);
    expect(headbreaker.Canvas).toBe(Canvas);
    expect(headbreaker.Piece).toBe(Piece);
    expect(headbreaker.Puzzle).toBe(Puzzle);
  });
});
