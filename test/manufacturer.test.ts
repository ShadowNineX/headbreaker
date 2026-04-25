import { describe, expect, it } from 'vitest';
import { anchor } from '../src/anchor';
import { None, Slot, Tab } from '../src/insert';
import Manufacturer from '../src/manufacturer';
import { flipflop } from '../src/sequence';

describe('manufacturer', () => {
  it('create 1 x 1', () => {
    const manufacturer = new Manufacturer();
    manufacturer.withDimensions(1, 1);
    manufacturer.withStructure({ pieceRadius: 10, proximity: 1 });
    const puzzle = manufacturer.build();
    const first = puzzle.pieces[0];

    expect(puzzle.pieces.length).toBe(1);
    expect(first.up).toBe(None);
    expect(first.right).toBe(None);
    expect(first.down).toBe(None);
    expect(first.left).toBe(None);
    expect(first.radius.x).toBe(10);
    expect(first.radius.y).toBe(10);
    expect(first.proximity).toBe(1);
    expect(first.centralAnchor).toEqual(anchor(20, 20));
  });

  it('create 1 x 1 with central anchor', () => {
    const manufacturer = new Manufacturer();
    manufacturer.withDimensions(1, 1);
    manufacturer.withStructure({ pieceRadius: 10, proximity: 1 });
    manufacturer.withHeadAt(anchor(-3, 5));
    const puzzle = manufacturer.build();

    expect(puzzle.pieces.length).toBe(1);
    expect(puzzle.head.centralAnchor).toEqual(anchor(-3, 5));
  });

  it('create 2 x 1', () => {
    const manufacturer = new Manufacturer();
    manufacturer.withDimensions(2, 1);
    manufacturer.withStructure({ pieceRadius: 10, proximity: 1 });
    const puzzle = manufacturer.build();

    const first = puzzle.pieces[0];
    const second = puzzle.pieces[1];

    expect(puzzle.pieces.length).toBe(2);
    expect(first.up).toBe(None);
    expect(first.right).toBe(Tab);
    expect(first.down).toBe(None);
    expect(first.left).toBe(None);
    expect(second.up).toBe(None);
    expect(second.right).toBe(None);
    expect(second.down).toBe(None);
    expect(second.left).toBe(Slot);
    expect(first.centralAnchor).toEqual(anchor(20, 20));
    expect(second.centralAnchor).toEqual(anchor(40, 20));
  });

  it('create 3 x 1', () => {
    const manufacturer = new Manufacturer();
    manufacturer.withDimensions(3, 1);
    const puzzle = manufacturer.build();

    const [first, second, third] = puzzle.pieces;
    expect(puzzle.pieces.length).toBe(3);

    expect(first.up).toBe(None);
    expect(first.right).toBe(Tab);
    expect(first.down).toBe(None);
    expect(first.left).toBe(None);

    expect(second.up).toBe(None);
    expect(second.right).toBe(Tab);
    expect(second.down).toBe(None);
    expect(second.left).toBe(Slot);

    expect(third.up).toBe(None);
    expect(third.right).toBe(None);
    expect(third.down).toBe(None);
    expect(third.left).toBe(Slot);

    expect(first.centralAnchor).toEqual(anchor(4, 4));
    expect(second.centralAnchor).toEqual(anchor(8, 4));
    expect(third.centralAnchor).toEqual(anchor(12, 4));
  });

  it('create 1 x 2', () => {
    const manufacturer = new Manufacturer();
    manufacturer.withDimensions(1, 2);
    const puzzle = manufacturer.build();

    const [first, second] = puzzle.pieces;
    expect(puzzle.pieces.length).toBe(2);

    expect(first.up).toBe(None);
    expect(first.right).toBe(None);
    expect(first.down).toBe(Tab);
    expect(first.left).toBe(None);

    expect(second.up).toBe(Slot);
    expect(second.right).toBe(None);
    expect(second.down).toBe(None);
    expect(second.left).toBe(None);

    expect(first.centralAnchor).toEqual(anchor(4, 4));
    expect(second.centralAnchor).toEqual(anchor(4, 8));
  });

  it('create 3 x 2', () => {
    const manufacturer = new Manufacturer();
    manufacturer.withDimensions(3, 2);
    const puzzle = manufacturer.build();

    const [a, b, c, d, e, f] = puzzle.pieces;
    expect(puzzle.pieces.length).toBe(6);

    expect(a.up).toBe(None);
    expect(a.right).toBe(Tab);
    expect(a.down).toBe(Tab);
    expect(a.left).toBe(None);

    expect(b.up).toBe(None);
    expect(b.right).toBe(Tab);
    expect(b.down).toBe(Tab);
    expect(b.left).toBe(Slot);

    expect(c.up).toBe(None);
    expect(c.right).toBe(None);
    expect(c.down).toBe(Tab);
    expect(c.left).toBe(Slot);

    expect(d.up).toBe(Slot);
    expect(d.right).toBe(Tab);
    expect(d.down).toBe(None);
    expect(d.left).toBe(None);

    expect(e.up).toBe(Slot);
    expect(e.right).toBe(Tab);
    expect(e.down).toBe(None);
    expect(e.left).toBe(Slot);

    expect(f.up).toBe(Slot);
    expect(f.right).toBe(None);
    expect(f.down).toBe(None);
    expect(f.left).toBe(Slot);
  });

  it('create 2 x 2 with rectangular pieces', () => {
    const manufacturer = new Manufacturer();
    manufacturer.withDimensions(2, 2);
    manufacturer.withStructure({ pieceRadius: { x: 2, y: 3 } });
    const puzzle = manufacturer.build();
    const [a, b, c, d] = puzzle.pieces;

    expect(puzzle.pieces.length).toBe(4);

    expect(a.up).toBe(None);
    expect(a.right).toBe(Tab);
    expect(a.down).toBe(Tab);
    expect(a.left).toBe(None);

    expect(b.up).toBe(None);
    expect(b.right).toBe(None);
    expect(b.down).toBe(Tab);
    expect(b.left).toBe(Slot);

    expect(c.up).toBe(Slot);
    expect(c.right).toBe(Tab);
    expect(c.down).toBe(None);
    expect(c.left).toBe(None);

    expect(d.up).toBe(Slot);
    expect(d.right).toBe(None);
    expect(d.down).toBe(None);
    expect(d.left).toBe(Slot);

    expect(a.centralAnchor).toEqual(anchor(4, 6));
    expect(b.centralAnchor).toEqual(anchor(8, 6));
    expect(c.centralAnchor).toEqual(anchor(4, 12));
    expect(d.centralAnchor).toEqual(anchor(8, 12));
  });

  it('create 6 x 1 with flip flop', () => {
    const manufacturer = new Manufacturer();
    manufacturer.withDimensions(6, 1);
    manufacturer.withInsertsGenerator(flipflop);
    const puzzle = manufacturer.build();
    const [a, b, c, d, e, f] = puzzle.pieces;

    expect(puzzle.pieces.length).toBe(6);
    expect(a.right).toBe(Tab);
    expect(b.right).toBe(Slot);
    expect(c.right).toBe(Tab);
    expect(d.right).toBe(Slot);
    expect(e.right).toBe(Tab);
    expect(f.right).toBe(None);
    expect(a.left).toBe(None);
    expect(b.left).toBe(Slot);
    expect(c.left).toBe(Tab);
    expect(d.left).toBe(Slot);
    expect(e.left).toBe(Tab);
    expect(f.left).toBe(Slot);
  });

  it('create 2 x 2 without metadata', () => {
    const manufacturer = new Manufacturer();
    manufacturer.withDimensions(2, 2);
    const puzzle = manufacturer.build();
    const [a, b, c, d] = puzzle.pieces;

    expect(a.metadata.id).toBe('1');
    expect(b.metadata.id).toBe('2');
    expect(c.metadata.id).toBe('3');
    expect(d.metadata.id).toBe('4');
  });

  it('create 2 x 2 with metadata', () => {
    const manufacturer = new Manufacturer();
    manufacturer.withDimensions(2, 2);
    manufacturer.withMetadata([
      { foo: 'a' },
      { foo: 'b' },
      { foo: 'c' },
      { id: 'X' },
    ]);
    const puzzle = manufacturer.build();
    const [a, b, c, d] = puzzle.pieces;

    expect(a.metadata.id).toBe('1');
    expect(a.metadata.foo).toBe('a');
    expect(b.metadata.id).toBe('2');
    expect(b.metadata.foo).toBe('b');
    expect(c.metadata.id).toBe('3');
    expect(c.metadata.foo).toBe('c');
    expect(d.metadata.id).toBe('X');
    expect(d.metadata.foo).toBeUndefined();
  });

  it('withInsertsGenerator keeps the previous generator when given a falsy value', () => {
    const manufacturer = new Manufacturer();
    manufacturer.withDimensions(2, 1);
    manufacturer.withStructure({ pieceRadius: 10, proximity: 1 });
    manufacturer.withInsertsGenerator(flipflop);
    // Passing null/undefined is a no-op: the previously configured generator
    // (`flipflop`) is preserved.
    manufacturer.withInsertsGenerator(null as unknown as typeof flipflop);
    const puzzle = manufacturer.build();
    expect(puzzle.pieces[0].right).toBe(Tab);
    expect(puzzle.pieces[1].left).toBe(Slot);
  });
});
