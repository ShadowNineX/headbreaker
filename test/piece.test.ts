import { beforeEach, describe, expect, it } from 'vitest';
import { anchor } from '../src/anchor';
import { None, Slot, Tab } from '../src/insert';
import Piece from '../src/piece';
import Puzzle from '../src/puzzle';
import { diameter, radius } from '../src/size';
import { vector } from '../src/vector';

describe('piece', () => {
  describe('can annotate a piece', () => {
    it('can annotate with undefined or null', () => {
      const piece = new Piece();
      piece.annotate(null);
      piece.annotate(undefined);
      expect(piece.metadata).toEqual({});
    });

    it('can annotate with right values', () => {
      const piece = new Piece();
      piece.annotate({ foo: 1 });
      piece.annotate({ bar: 2 });
      expect(piece.metadata).toEqual({ foo: 1, bar: 2 });
    });
  });

  it('can create a piece and place it', () => {
    const piece = new Piece();
    piece.locateAt(0, 0);
    expect(piece.centralAnchor).toEqual(anchor(0, 0));
  });

  it('there are no inserts by default', () => {
    const piece = new Piece();
    expect(piece.up.isNone()).toBe(true);
    expect(piece.down.isNone()).toBe(true);
    expect(piece.left.isNone()).toBe(true);
    expect(piece.right.isNone()).toBe(true);
  });

  it('can specify there is an upper tab', () => {
    const piece = new Piece({ up: Tab });
    expect(piece.up.isTab()).toBe(true);
    expect(piece.up.isSlot()).toBe(false);
  });

  it('can specify there is a lower slot', () => {
    const piece = new Piece({ down: Slot });
    expect(piece.down.isTab()).toBe(false);
    expect(piece.down.isSlot()).toBe(true);
  });

  it('can specify lateral Slots and Tabs and implicit upper and bottom None', () => {
    const piece = new Piece({ left: Slot, right: Tab });
    expect(piece.left.isSlot()).toBe(true);
    expect(piece.right.isTab()).toBe(true);
    expect(piece.up.isNone()).toBe(true);
    expect(piece.down.isNone()).toBe(true);
  });

  it('can validate potential vertical matches between two matching pieces', () => {
    const a = new Piece({ up: Slot, down: Tab });
    const b = new Piece({ up: Slot, down: Tab });
    expect(a.verticallyMatch(b)).toBe(true);
    expect(b.verticallyMatch(a)).toBe(true);
  });

  it('can validate potential vertical matches between two partially matching pieces', () => {
    const a = new Piece({ up: Slot, down: Tab });
    const b = new Piece({ up: Slot, down: Slot });
    expect(a.verticallyMatch(b)).toBe(true);
    expect(b.verticallyMatch(a)).toBe(false);
  });

  it('can validate potential horizontal matches between two matching pieces', () => {
    const a = new Piece({ left: Slot, right: Tab });
    const b = new Piece({ left: Slot, right: Tab });
    expect(a.horizontallyMatch(b)).toBe(true);
    expect(b.horizontallyMatch(a)).toBe(true);
  });

  it('can validate potential horizontal matches between two partially matching pieces', () => {
    const a = new Piece({ left: Slot, right: Tab });
    const b = new Piece({ left: Slot, right: Slot });
    expect(a.horizontallyMatch(b)).toBe(true);
    expect(b.horizontallyMatch(a)).toBe(false);
  });

  it('can validate potential vertical matches between non matching pieces', () => {
    const a = new Piece({ up: Slot, down: Tab });
    const b = new Piece({ up: None, down: Slot });
    expect(a.verticallyMatch(b)).toBe(false);
    expect(b.verticallyMatch(a)).toBe(false);
  });

  it('can validate potential horizontal matches between non matching pieces', () => {
    const a = new Piece({ left: Slot, right: Tab });
    const b = new Piece({ left: Tab, right: None });
    expect(a.horizontallyMatch(b)).toBe(false);
    expect(b.horizontallyMatch(a)).toBe(false);
  });

  it('can configure a piece', () => {
    const piece = new Piece({ up: Slot, left: Tab });
    piece.configure({ centralAnchor: anchor(10, 0), size: diameter(4) });
    expect(piece.radius).toEqual(vector(2, 2));
    expect(piece.centralAnchor).toEqual(anchor(10, 0));
    expect(piece.metadata).toEqual({});
  });

  it('can create a piece with config', () => {
    const piece = new Piece(
      { up: Slot, left: Tab },
      { metadata: { foo: 2 }, centralAnchor: vector(10, 0), size: radius(4) },
    );
    expect(piece.radius).toEqual(vector(4, 4));
    expect(piece.centralAnchor).toEqual(anchor(10, 0));
    expect(piece.metadata).toEqual({ foo: 2 });
  });

  it('can create a piece from a puzzle', () => {
    const puzzle = new Puzzle();
    const piece = puzzle.newPiece();
    expect(piece.puzzle).toBe(puzzle);
  });

  it('can compute diameter multiple times', () => {
    const puzzle = new Puzzle({ pieceRadius: vector(3, 2) });
    const piece = puzzle.newPiece();
    expect(piece.diameter).toEqual(vector(6, 4));
    expect(piece.diameter).toEqual(vector(6, 4));
  });

  it('can override piece size with scalar', () => {
    const puzzle = new Puzzle();
    const piece = puzzle.newPiece();
    expect(piece.radius).toEqual(vector(2, 2));
    expect(piece.diameter).toEqual(vector(4, 4));
    piece.resize(radius(5));
    expect(piece.radius).toEqual(vector(5, 5));
    expect(piece.diameter).toEqual(vector(10, 10));
  });

  it('can override piece size with vector', () => {
    const puzzle = new Puzzle();
    const piece = puzzle.newPiece();
    expect(piece.radius).toEqual(vector(2, 2));
    expect(piece.diameter).toEqual(vector(4, 4));
    piece.resize(radius(vector(5, 2)));
    expect(piece.radius).toEqual(vector(5, 2));
    expect(piece.diameter).toEqual(vector(10, 4));
  });

  it('can create a rectangular, wide piece from a puzzle', () => {
    const puzzle = new Puzzle({ pieceRadius: vector(6, 4) });
    const piece = puzzle.newPiece();
    piece.locateAt(0, 0);
    expect(piece.puzzle).toBe(puzzle);
    expect(piece.radius).toEqual(vector(6, 4));
    expect(piece.rightAnchor).toEqual(anchor(6, 0));
    expect(piece.leftAnchor).toEqual(anchor(-6, 0));
    expect(piece.upAnchor).toEqual(anchor(0, -4));
    expect(piece.downAnchor).toEqual(anchor(0, 4));
  });

  it('can create a rectangular, tall piece from a puzzle', () => {
    const puzzle = new Puzzle({ pieceRadius: { x: 3, y: 5 } });
    const piece = puzzle.newPiece();
    piece.locateAt(0, 0);
    expect(piece.puzzle).toBe(puzzle);
    expect(piece.radius).toEqual({ x: 3, y: 5 });
    expect(piece.rightAnchor).toEqual(anchor(3, 0));
    expect(piece.leftAnchor).toEqual(anchor(-3, 0));
    expect(piece.upAnchor).toEqual(anchor(0, -5));
    expect(piece.downAnchor).toEqual(anchor(0, 5));
  });

  it('can check whether pieces are vertically close when overlapped', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece(); a.locateAt(0, 0);
    const b = puzzle.newPiece(); b.locateAt(0, 0);
    expect(a.verticallyCloseTo(b)).toBe(false);
    expect(b.verticallyCloseTo(a)).toBe(false);
  });

  it('can check whether rectangular pieces are vertically close when overlapped', () => {
    const puzzle = new Puzzle({ pieceRadius: { x: 4, y: 10 } });
    const a = puzzle.newPiece(); a.locateAt(0, 0);
    const b = puzzle.newPiece(); b.locateAt(0, 0);
    expect(a.verticallyCloseTo(b)).toBe(false);
    expect(b.verticallyCloseTo(a)).toBe(false);
  });

  it('can check whether pieces are horizontally close when overlapped', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece(); a.locateAt(0, 0);
    const b = puzzle.newPiece(); b.locateAt(0, 0);
    expect(a.horizontallyCloseTo(b)).toBe(false);
    expect(b.horizontallyCloseTo(a)).toBe(false);
  });

  it('can check whether pieces are vertically close when far away', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece(); a.locateAt(0, 0);
    const b = puzzle.newPiece(); b.locateAt(0, 20);
    expect(a.verticallyCloseTo(b)).toBe(false);
    expect(b.verticallyCloseTo(a)).toBe(false);
  });

  it('can check whether pieces are horizontally close when far away', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece(); a.locateAt(0, 0);
    const b = puzzle.newPiece(); b.locateAt(20, 0);
    expect(a.horizontallyCloseTo(b)).toBe(false);
    expect(b.horizontallyCloseTo(a)).toBe(false);
  });

  it('can check whether pieces are vertically close when partially overlapped', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece(); a.locateAt(0, 0);
    const b = puzzle.newPiece(); b.locateAt(0, 2);
    expect(a.verticallyCloseTo(b)).toBe(false);
    expect(b.verticallyCloseTo(a)).toBe(false);
  });

  it('can check whether pieces are horizontally close when partially overlapped', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece(); a.locateAt(0, 0);
    const b = puzzle.newPiece(); b.locateAt(2, 0);
    expect(a.horizontallyCloseTo(b)).toBe(false);
    expect(b.horizontallyCloseTo(a)).toBe(false);
  });

  it('can check whether pieces are vertically close when close', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece(); a.locateAt(0, 0);
    const b = puzzle.newPiece(); b.locateAt(0, 3);
    expect(a.verticallyCloseTo(b)).toBe(true);
    expect(b.verticallyCloseTo(a)).toBe(false);
  });

  it('can check whether pieces are horizontally close when close', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece(); a.locateAt(0, 0);
    const b = puzzle.newPiece(); b.locateAt(3, 0);
    expect(a.horizontallyCloseTo(b)).toBe(true);
    expect(b.horizontallyCloseTo(a)).toBe(false);
  });

  it('knows its positive inserts positions', () => {
    const puzzle = new Puzzle();
    const piece = puzzle.newPiece(); piece.locateAt(0, 0);
    expect(piece.downAnchor).toEqual(anchor(0, 2));
    expect(piece.rightAnchor).toEqual(anchor(2, 0));
  });

  it('knows its negative inserts positions', () => {
    const puzzle = new Puzzle();
    const piece = puzzle.newPiece(); piece.locateAt(0, 0);
    expect(piece.upAnchor).toEqual(anchor(0, -2));
    expect(piece.leftAnchor).toEqual(anchor(-2, 0));
  });

  it('has native connectors', () => {
    const piece = new Piece();
    expect(piece.verticalConnector).not.toBeNull();
    expect(piece.horizontalConnector).not.toBeNull();
    expect(piece.horizontalConnector).not.toBe(piece.verticalConnector);
  });

  describe('connection of regular pieces', () => {
    let puzzle: Puzzle;
    let a: Piece, b: Piece, c: Piece;

    beforeEach(() => {
      puzzle = new Puzzle();
      a = puzzle.newPiece({ down: Tab });
      b = puzzle.newPiece({ up: Slot, right: Tab });
      c = puzzle.newPiece({ left: Slot });
      a.locateAt(0, 0);
      b.locateAt(0, 3);
      c.locateAt(3, 3);
    });

    it('checks if can connect horizontally', () => {
      expect(b.canConnectHorizontallyWith(c)).toBe(true);
      expect(a.canConnectHorizontallyWith(b)).toBe(false);
      expect(b.canConnectHorizontallyWith(a)).toBe(false);
      expect(c.canConnectHorizontallyWith(b)).toBe(false);
    });

    it('can try to connect close pieces horizontally', () => {
      expect(b.rightConnection).not.toBe(c);
      b.tryConnectHorizontallyWith(c);
      expect(b.rightConnection).toBe(c);
    });

    it('can try to connect distant pieces horizontally', () => {
      expect(a.rightConnection).not.toBe(b);
      a.tryConnectHorizontallyWith(b);
      expect(a.rightConnection).not.toBe(b);
      expect(b.rightConnection).not.toBe(a);
    });

    it('checks if can connect horizontally with requirement that accepts all', () => {
      puzzle.attachHorizontalConnectionRequirement((_one, _other) => true);
      expect(b.canConnectHorizontallyWith(c)).toBe(true);
      expect(a.canConnectHorizontallyWith(b)).toBe(false);
    });

    it('checks if can connect horizontally with requirement that prevents all', () => {
      puzzle.attachHorizontalConnectionRequirement((_one, _other) => false);
      expect(b.canConnectHorizontallyWith(c)).toBe(false);
    });

    it('checks if can connect vertically', () => {
      expect(a.canConnectVerticallyWith(b)).toBe(true);
      expect(b.canConnectVerticallyWith(a)).toBe(false);
      expect(b.canConnectVerticallyWith(c)).toBe(false);
      expect(c.canConnectVerticallyWith(b)).toBe(false);
    });

    it('can try to connect close pieces vertically', () => {
      expect(a.downConnection).not.toBe(b);
      a.tryConnectVerticallyWith(b);
      expect(a.downConnection).toBe(b);
    });

    it('can try to connect distant pieces vertically', () => {
      expect(b.downConnection).not.toBe(c);
      b.tryConnectVerticallyWith(c);
      expect(b.downConnection).not.toBe(c);
    });

    it('checks if can connect vertically with requirement that accepts all', () => {
      puzzle.attachVerticalConnectionRequirement((_one, _other) => true);
      expect(a.canConnectVerticallyWith(b)).toBe(true);
    });

    it('checks if can connect vertically with requirement that prevents all', () => {
      puzzle.attachVerticalConnectionRequirement((_one, _other) => false);
      expect(a.canConnectVerticallyWith(b)).toBe(false);
    });

    it('checks if rectangular pieces can connect vertically', () => {
      const puzzle2 = new Puzzle({ pieceRadius: { x: 2, y: 3 } });
      const a2 = puzzle2.newPiece({ down: Tab });
      const b2 = puzzle2.newPiece({ up: Slot, right: Tab });
      const c2 = puzzle2.newPiece({ left: Slot });
      a2.locateAt(0, 0);
      b2.locateAt(0, 5);
      c2.locateAt(3, 5);
      expect(a2.canConnectVerticallyWith(b2)).toBe(true);
      expect(b2.canConnectVerticallyWith(a2)).toBe(false);
    });

    it('connects vertically', () => {
      a.connectVerticallyWith(b);
      expect(a.downConnection).toBe(b);
      expect(a.connected).toBe(true);
      expect(b.connected).toBe(true);
    });
  });

  it('connects vertically irregular pieces', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece({ right: Tab }, { size: diameter(10) });
    const b = puzzle.newPiece({ left: Slot }, { size: diameter({ x: 20, y: 10 }) });
    a.locateAt(0, 0);
    b.locateAt(15, 0);
    a.connectHorizontallyWith(b);
    expect(a.rightConnection).toBe(b);
    expect(a.connected).toBe(true);
    expect(b.connected).toBe(true);
  });

  it('does not connect vertically when too away', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece({ down: Tab });
    const b = puzzle.newPiece({ up: Slot, right: Tab });
    a.locateAt(0, 0);
    b.locateAt(10, 30);
    expect(() => a.connectVerticallyWith(b)).toThrow(/can not connect down!/);
  });

  it('connects vertically with attracts', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece({ down: Tab });
    const b = puzzle.newPiece({ up: Slot, right: Tab });
    a.locateAt(0, 0);
    b.locateAt(0, 3);
    a.connectVerticallyWith(b);
    expect(a.centralAnchor).toEqual(anchor(0, -1));
    expect(b.centralAnchor).toEqual(anchor(0, 3));
  });

  it('connects vertically with attracts back', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece({ down: Tab });
    const b = puzzle.newPiece({ up: Slot, right: Tab });
    a.locateAt(0, 0);
    b.locateAt(0, 3);
    a.connectVerticallyWith(b, true);
    expect(a.centralAnchor).toEqual(anchor(0, 0));
    expect(b.centralAnchor).toEqual(anchor(0, 4));
  });

  it('connects vertically with attracts, twice', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece({ down: Tab });
    const b = puzzle.newPiece({ up: Slot, down: Tab });
    const c = puzzle.newPiece({ up: Slot, down: Tab });
    a.locateAt(0, 0);
    b.locateAt(0, 3);
    c.locateAt(0, 6);
    a.connectVerticallyWith(b);
    b.connectVerticallyWith(c);
    expect(a.centralAnchor).toEqual(anchor(0, -2));
    expect(b.centralAnchor).toEqual(anchor(0, 2));
    expect(c.centralAnchor).toEqual(anchor(0, 6));
  });

  it('connects horizontally', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece({ down: Tab });
    const b = puzzle.newPiece({ up: Slot, right: Tab });
    const c = puzzle.newPiece({ left: Slot });
    a.locateAt(0, 0);
    b.locateAt(0, 3);
    c.locateAt(3, 3);
    b.connectHorizontallyWith(c);
    expect(b.rightConnection).toBe(c);
    expect(b.connected).toBe(true);
    expect(c.connected).toBe(true);
  });

  it('does not connect horizontally when too away', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece({ down: Tab });
    const b = puzzle.newPiece({ up: Slot, right: Tab });
    a.locateAt(0, 0);
    b.locateAt(10, 30);
    expect(() => a.connectHorizontallyWith(b)).toThrow(/can not connect right!/);
  });

  it('connects horizontally with attracts', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece({ right: Tab });
    const b = puzzle.newPiece({ left: Slot, right: Tab });
    a.locateAt(0, 0);
    b.locateAt(3, 0);
    a.connectHorizontallyWith(b);
    expect(a.centralAnchor).toEqual(anchor(-1, 0));
    expect(b.centralAnchor).toEqual(anchor(3, 0));
  });

  it('attracts right to left', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece({ right: Tab });
    const b = puzzle.newPiece({ left: Slot });
    a.locateAt(0, 0);
    b.locateAt(5, 1);
    a.attractHorizontally(b);
    expect(a.centralAnchor).toEqual(anchor(0, 0));
    expect(b.centralAnchor).toEqual(anchor(4, 0));
  });

  it('attracts left to right', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece({ right: Tab });
    const b = puzzle.newPiece({ left: Slot });
    a.locateAt(0, 0);
    b.locateAt(5, 1);
    b.attractHorizontally(a);
    expect(a.centralAnchor).toEqual(anchor(1, 1));
    expect(b.centralAnchor).toEqual(anchor(5, 1));
  });

  it('attracts down to up', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece({ down: Tab });
    const b = puzzle.newPiece({ up: Slot });
    a.locateAt(0, 0);
    b.locateAt(1, 5);
    a.attractVertically(b);
    expect(a.centralAnchor).toEqual(anchor(0, 0));
    expect(b.centralAnchor).toEqual(anchor(0, 4));
  });

  it('attracts up to down', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece({ down: Tab });
    const b = puzzle.newPiece({ up: Slot });
    a.locateAt(0, 0);
    b.locateAt(1, 5);
    b.attractVertically(a);
    expect(a.centralAnchor).toEqual(anchor(1, 1));
    expect(b.centralAnchor).toEqual(anchor(1, 5));
  });

  it('translates', () => {
    const puzzle = new Puzzle();
    const piece = puzzle.newPiece({ down: Tab });
    piece.locateAt(0, 0);
    piece.translate(10, 5);
    expect(piece.centralAnchor).toEqual(anchor(10, 5));
  });

  describe('relocates to', () => {
    let piece: Piece;
    beforeEach(() => {
      const puzzle = new Puzzle();
      piece = puzzle.newPiece({ down: Tab });
    });

    it('starting at origin', () => {
      piece.locateAt(0, 0);
      piece.relocateTo(10, 5);
      expect(piece.centralAnchor).toEqual(anchor(10, 5));
    });

    it('starting at other point', () => {
      piece.locateAt(12, -12);
      piece.relocateTo(10, 5);
      expect(piece.centralAnchor).toEqual(anchor(10, 5));
    });
  });

  it('pushes when no connections', () => {
    const puzzle = new Puzzle();
    const piece = puzzle.newPiece({ down: Tab });
    piece.locateAt(0, 0);
    piece.push(10, 5);
    expect(piece.centralAnchor).toEqual(anchor(10, 5));
  });

  it('pushes when has connections', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece({ right: Tab });
    const b = puzzle.newPiece({ left: Slot, right: Tab });
    const c = puzzle.newPiece({ left: Slot, right: Tab, down: Slot });
    const d = puzzle.newPiece({ up: Tab });
    a.locateAt(0, 0);
    b.locateAt(4, 0);
    c.locateAt(8, 0);
    d.locateAt(8, 4);
    a.connectHorizontallyWith(b);
    b.connectHorizontallyWith(c);
    c.connectVerticallyWith(d);
    a.push(1, 1);
    expect(a.centralAnchor).toEqual(anchor(1, 1));
    expect(b.centralAnchor).toEqual(anchor(5, 1));
    expect(c.centralAnchor).toEqual(anchor(9, 1));
    expect(d.centralAnchor).toEqual(anchor(9, 5));
  });

  it('pushes when has connections and attracts', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece({ right: Tab });
    const b = puzzle.newPiece({ left: Slot, right: Tab });
    const c = puzzle.newPiece({ left: Slot, right: Tab, down: Slot });
    const d = puzzle.newPiece({ up: Tab });
    a.locateAt(0, 0);
    b.locateAt(3, 0);
    c.locateAt(6, 0);
    d.locateAt(6, 3);
    a.connectHorizontallyWith(b);
    b.connectHorizontallyWith(c);
    c.connectVerticallyWith(d);
    a.push(1, 1);
    expect(a.centralAnchor).toEqual(anchor(-1, 0));
    expect(b.centralAnchor).toEqual(anchor(3, 0));
    expect(c.centralAnchor).toEqual(anchor(7, 0));
    expect(d.centralAnchor).toEqual(anchor(7, 4));
  });

  it('pushes rectangular pieces when has connections and attracts', () => {
    const puzzle = new Puzzle({ pieceRadius: { x: 2, y: 3 } });
    const a = puzzle.newPiece({ right: Tab });
    const b = puzzle.newPiece({ left: Slot, right: Tab });
    const c = puzzle.newPiece({ left: Slot, right: Tab, down: Slot });
    const d = puzzle.newPiece({ up: Tab });
    a.locateAt(0, 0);
    b.locateAt(3, 0);
    c.locateAt(6, 0);
    d.locateAt(6, 5);
    a.connectHorizontallyWith(b);
    b.connectHorizontallyWith(c);
    c.connectVerticallyWith(d);
    a.push(1, 1);
    expect(a.centralAnchor).toEqual(anchor(-1, 0));
    expect(b.centralAnchor).toEqual(anchor(3, 0));
    expect(c.centralAnchor).toEqual(anchor(7, 0));
    expect(d.centralAnchor).toEqual(anchor(7, 6));
  });

  it('pushes with double connections', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece({ up: Slot, right: Slot, down: Tab, left: Tab });
    const b = puzzle.newPiece({ up: Slot, right: Slot, down: Tab, left: Tab });
    const c = puzzle.newPiece({ up: Slot, right: Slot, down: Tab, left: Tab });
    const d = puzzle.newPiece({ up: Slot, right: Slot, down: Tab, left: Tab });
    a.locateAt(0, 0);
    b.locateAt(4, 0);
    c.locateAt(0, 4);
    d.locateAt(4, 4);
    a.connectHorizontallyWith(b);
    c.connectHorizontallyWith(d);
    a.connectVerticallyWith(c);
    b.connectVerticallyWith(d);
    a.push(1, 1);
    expect(a.centralAnchor).toEqual(anchor(1, 1));
    expect(b.centralAnchor).toEqual(anchor(5, 1));
    expect(c.centralAnchor).toEqual(anchor(1, 5));
    expect(d.centralAnchor).toEqual(anchor(5, 5));
  });

  it('drags when no connections', () => {
    const puzzle = new Puzzle();
    const piece = puzzle.newPiece({ down: Tab });
    piece.locateAt(0, 0);
    piece.drag(10, 5);
    piece.drag(-1, 0);
    piece.drag(0, -2);
    expect(piece.centralAnchor).toEqual(anchor(9, 3));
  });

  describe('drags when there are connections', () => {
    let puzzle: Puzzle;
    let a: Piece, b: Piece, c: Piece, d: Piece;

    beforeEach(() => {
      puzzle = new Puzzle();
      a = puzzle.newPiece({ right: Tab });
      b = puzzle.newPiece({ left: Slot, right: Tab });
      c = puzzle.newPiece({ left: Slot, right: Tab, down: Slot });
      d = puzzle.newPiece({ up: Tab });
      a.locateAt(0, 0);
      b.locateAt(4, 0);
      c.locateAt(8, 0);
      d.locateAt(8, 4);
      a.connectHorizontallyWith(b);
      b.connectHorizontallyWith(c);
      c.connectVerticallyWith(d);
    });

    it('drags single-connection-piece to right pushing', () => {
      a.drag(10, 0);
      expect(a.centralAnchor).toEqual(anchor(10, 0));
      expect(b.centralAnchor).toEqual(anchor(14, 0));
      expect(a.rightConnection).toBe(b);
      expect(a.leftConnection).toBeNull();
      expect(a.upConnection).toBeNull();
      expect(a.downConnection).toBeNull();
    });

    it('drags single-connection-piece to right forcing disconnection', () => {
      puzzle.forceDisconnectionWhileDragging();
      a.drag(10, 0);
      expect(a.centralAnchor).toEqual(anchor(10, 0));
      expect(b.centralAnchor).toEqual(anchor(4, 0));
      expect(a.rightConnection).toBeNull();
    });

    it('drags single-connection-piece to left releasing', () => {
      a.drag(-10, 0);
      expect(a.centralAnchor).toEqual(anchor(-10, 0));
      expect(b.centralAnchor).toEqual(anchor(4, 0));
      expect(a.rightConnection).toBeNull();
    });

    it('drags single-connection-piece up releasing', () => {
      a.drag(0, -10);
      expect(a.centralAnchor).toEqual(anchor(0, -10));
      expect(b.centralAnchor).toEqual(anchor(4, 0));
      expect(a.rightConnection).toBeNull();
    });

    it('drags single-connection-piece down releasing', () => {
      a.drag(0, 10);
      expect(a.centralAnchor).toEqual(anchor(0, 10));
      expect(b.centralAnchor).toEqual(anchor(4, 0));
      expect(a.rightConnection).toBeNull();
    });

    it('drags multi-connection-piece to right releasing', () => {
      c.drag(10, 0);
      expect(c.centralAnchor).toEqual(anchor(18, 0));
      expect(b.centralAnchor).toEqual(anchor(4, 0));
      expect(d.centralAnchor).toEqual(anchor(8, 4));
      expect(c.rightConnection).toBeNull();
      expect(c.leftConnection).toBeNull();
      expect(c.upConnection).toBeNull();
      expect(c.downConnection).toBeNull();
    });

    it('drags multi-connection-piece to left pushing', () => {
      c.drag(-10, 0);
      expect(c.centralAnchor).toEqual(anchor(-2, 0));
      expect(b.centralAnchor).toEqual(anchor(-6, 0));
      expect(d.centralAnchor).toEqual(anchor(-2, 4));
      expect(c.rightConnection).toBeNull();
      expect(c.leftConnection).toBe(b);
      expect(c.downConnection).toBe(d);
    });

    it('drags multi-connection-piece up releasing', () => {
      c.drag(0, -10);
      expect(c.centralAnchor).toEqual(anchor(8, -10));
      expect(b.centralAnchor).toEqual(anchor(4, 0));
      expect(d.centralAnchor).toEqual(anchor(8, 4));
      expect(c.rightConnection).toBeNull();
      expect(c.leftConnection).toBeNull();
    });

    it('drags multi-connection-piece up, forcing connection', () => {
      puzzle.forceConnectionWhileDragging();
      c.drag(0, -10);
      expect(c.centralAnchor).toEqual(anchor(8, -10));
      expect(b.centralAnchor).toEqual(anchor(4, -10));
      expect(d.centralAnchor).toEqual(anchor(8, -6));
      expect(c.leftConnection).toBe(b);
      expect(c.downConnection).toBe(d);
    });

    it('drags multi-connection-piece down pushing', () => {
      c.drag(0, 10);
      expect(c.centralAnchor).toEqual(anchor(8, 10));
      expect(b.centralAnchor).toEqual(anchor(4, 10));
      expect(d.centralAnchor).toEqual(anchor(8, 14));
      expect(c.leftConnection).toBe(b);
      expect(c.downConnection).toBe(d);
    });
  });

  describe('import', () => {
    it('can import piece without anchor', () => {
      const piece = Piece.import({
        centralAnchor: null,
        structure: '--TS',
        connections: { right: null, down: null, left: null, up: null },
        metadata: {},
      });
      expect(piece.centralAnchor).toBeNull();
      expect(piece.inserts).toEqual([None, None, Tab, Slot]);
      expect(piece.metadata).toEqual({});
      expect(piece.presentConnections).toEqual([]);
    });

    it('can import piece with anchor', () => {
      const piece = Piece.import({
        centralAnchor: { x: 2, y: 3 },
        structure: 'TTST',
        connections: { right: null, down: null, left: null, up: null },
        metadata: {},
      });
      expect(piece.centralAnchor).toEqual(anchor(2, 3));
      expect(piece.inserts).toEqual([Tab, Tab, Slot, Tab]);
    });

    it('can import piece with connections - which are ignored', () => {
      const piece = Piece.import({
        centralAnchor: { x: 2, y: 3 },
        structure: 'TTST',
        connections: { right: { id: 2 }, down: null, left: null, up: { id: 4 } },
        metadata: {},
      });
      expect(piece.centralAnchor).toEqual(anchor(2, 3));
      expect(piece.presentConnections).toEqual([]);
    });
  });

  describe('export', () => {
    it('can export piece without anchor', () => {
      const piece = new Piece({ up: Slot, left: Tab });
      expect(piece.export()).toEqual({
        centralAnchor: null,
        structure: '--TS',
        connections: { right: null, down: null, left: null, up: null },
        metadata: {},
      });
    });

    it('can export piece without metadata', () => {
      const piece = new Piece({ up: Slot, left: Tab });
      piece.locateAt(10, 0);
      expect(piece.export()).toEqual({
        centralAnchor: { x: 10, y: 0 },
        structure: '--TS',
        connections: { right: null, down: null, left: null, up: null },
        metadata: {},
      });
    });

    it('can export piece with metadata and anchor', () => {
      const piece = new Piece({ up: Slot, left: Tab });
      piece.locateAt(10, 0);
      piece.annotate({ foo: 2 });
      expect(piece.export()).toEqual({
        centralAnchor: { x: 10, y: 0 },
        structure: '--TS',
        connections: { right: null, down: null, left: null, up: null },
        metadata: { foo: 2 },
      });
    });

    it('can export piece with metadata, anchor and size', () => {
      const piece = new Piece({ up: Slot, left: Tab });
      piece.locateAt(10, 0);
      piece.annotate({ foo: 2 });
      piece.resize(radius(4));
      expect(piece.export()).toEqual({
        centralAnchor: { x: 10, y: 0 },
        structure: '--TS',
        connections: { right: null, down: null, left: null, up: null },
        metadata: { foo: 2 },
        size: { radius: { x: 4, y: 4 } },
      });
    });

    it('can export a piece with connections without metadata', () => {
      const puzzle = new Puzzle();
      const a = puzzle.newPiece({ right: Tab });
      const b = puzzle.newPiece({ left: Slot, right: Tab });
      a.locateAt(0, 0);
      b.locateAt(4, 0);
      a.connectHorizontallyWith(b);
      expect(a.export()).toEqual({
        centralAnchor: { x: 0, y: 0 },
        structure: 'T---',
        connections: { right: { id: undefined }, down: null, left: null, up: null },
        metadata: {},
      });
    });

    it('can export a piece with connections with metadata', () => {
      const puzzle = new Puzzle();
      const a = puzzle.newPiece({ right: Tab });
      a.annotate({ id: 1 });
      const b = puzzle.newPiece({ left: Slot, right: Tab });
      b.annotate({ id: 2 });
      a.locateAt(0, 0);
      b.locateAt(4, 0);
      a.connectHorizontallyWith(b);
      expect(a.export()).toEqual({
        centralAnchor: { x: 0, y: 0 },
        structure: 'T---',
        connections: { right: { id: 2 }, down: null, left: null, up: null },
        metadata: { id: 1 },
      });
    });
  });

  it('can reannotate', () => {
    const piece = new Piece();
    piece.annotate({ foo: 1 });
    piece.reannotate({ bar: 2 });
    expect(piece.metadata).toEqual({ bar: 2 });
  });

  it('throws when centering twice', () => {
    const piece = new Piece();
    piece.locateAt(0, 0);
    expect(() => piece.locateAt(1, 1)).toThrow(/already being centered/);
  });

  it('has id from metadata', () => {
    const piece = new Piece();
    piece.annotate({ id: 'test-id' });
    expect(piece.id).toBe('test-id');
  });

  it('fires translate listeners', () => {
    const puzzle = new Puzzle();
    const piece = puzzle.newPiece({ down: Tab });
    piece.locateAt(0, 0);
    let fired = false;
    piece.onTranslate((_p, dx, dy) => {
      fired = true;
      expect(dx).toBe(5);
      expect(dy).toBe(3);
    });
    piece.translate(5, 3);
    expect(fired).toBe(true);
  });

  it('fires connect listeners', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece({ right: Tab });
    const b = puzzle.newPiece({ left: Slot });
    a.locateAt(0, 0);
    b.locateAt(4, 0);
    let fired = false;
    a.onConnect((_piece, other) => {
      fired = true;
      expect(other).toBe(b);
    });
    a.connectHorizontallyWith(b);
    expect(fired).toBe(true);
  });

  it('fires disconnect listeners', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece({ right: Tab });
    const b = puzzle.newPiece({ left: Slot });
    a.locateAt(0, 0);
    b.locateAt(4, 0);
    a.connectHorizontallyWith(b);
    let fired = false;
    a.onDisconnect((_piece, other) => {
      fired = true;
      expect(other).toBe(b);
    });
    a.disconnect();
    expect(fired).toBe(true);
  });

  it('dragAndDrop triggers both drag and drop', () => {
    const puzzle = new Puzzle();
    const a = puzzle.newPiece({ right: Tab });
    const b = puzzle.newPiece({ left: Slot });
    a.locateAt(0, 0);
    b.locateAt(4, 0);
    a.dragAndDrop(5, 0);
    // After dragAndDrop, piece should have been dragged
    expect(a.centralAnchor).toEqual(anchor(5, 0));
  });

  it('does not translate when dx and dy are zero', () => {
    const puzzle = new Puzzle();
    const piece = puzzle.newPiece({ down: Tab });
    piece.locateAt(0, 0);
    let fired = false;
    piece.onTranslate(() => { fired = true; });
    piece.translate(0, 0);
    expect(fired).toBe(false);
  });

  it('does not drag when dx and dy are zero', () => {
    const puzzle = new Puzzle();
    const piece = puzzle.newPiece({ down: Tab });
    piece.locateAt(5, 5);
    piece.drag(0, 0);
    expect(piece.centralAnchor).toEqual(anchor(5, 5));
  });

  it('translate with quiet=true moves the piece without firing listeners', () => {
    const puzzle = new Puzzle();
    const piece = puzzle.newPiece({ down: Tab });
    piece.locateAt(0, 0);
    let fired = false;
    piece.onTranslate(() => { fired = true; });
    piece.translate(4, 6, true);
    expect(piece.centralAnchor).toEqual(anchor(4, 6));
    expect(fired).toBe(false);
  });
});
