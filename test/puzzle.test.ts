import type Piece from '../src/piece';
import { beforeEach, describe, expect, it } from 'vitest';
import { noConnectionRequirements } from '../src/connector';
import { Slot, Tab } from '../src/insert';
import Puzzle from '../src/puzzle';
import * as Shuffler from '../src/shuffler';
import { PuzzleValidator } from '../src/validator';
import * as Vector from '../src/vector';
import { vector } from '../src/vector';

describe('puzzle', () => {
  let puzzle: Puzzle;

  beforeEach(() => {
    puzzle = new Puzzle();
    puzzle.newPiece({ right: Tab }).locateAt(0, 0);
    puzzle.newPiece({ left: Slot, right: Tab }).locateAt(3, 0);
    puzzle.newPiece({ left: Slot, right: Tab, down: Slot }).locateAt(6, 0);
    puzzle.newPiece({ up: Tab }).locateAt(6, 3);
  });

  it('has head', () => {
    expect(puzzle.head).toBe(puzzle.pieces[0]);
  });

  it('has points', () => {
    expect(puzzle.points).toEqual([
      [0, 0],
      [3, 0],
      [6, 0],
      [6, 3],
    ]);
  });

  it('has refs', () => {
    expect(puzzle.refs).toEqual([
      [0, 0],
      [0.75, 0],
      [1.5, 0],
      [1.5, 0.75],
    ]);
  });

  describe('can register requirements', () => {
    it('has initially no requirements', () => {
      expect(puzzle.horizontalRequirement).toBe(noConnectionRequirements);
      expect(puzzle.verticalRequirement).toBe(noConnectionRequirements);
    });

    it('can register a general connection requirement', () => {
      const requirement = (_one: Piece, _other: Piece) => true;
      puzzle.attachConnectionRequirement(requirement);
      expect(puzzle.horizontalRequirement).toBe(requirement);
      expect(puzzle.verticalRequirement).toBe(requirement);
    });

    it('can deregister connection requirements', () => {
      const requirement = (_one: Piece, _other: Piece) => true;
      puzzle.attachConnectionRequirement(requirement);
      puzzle.clearConnectionRequirements();
      expect(puzzle.horizontalRequirement).toBe(noConnectionRequirements);
      expect(puzzle.verticalRequirement).toBe(noConnectionRequirements);
    });
  });

  it('autoconnects puzzle', () => {
    puzzle.autoconnect();
    const [a, b, c, d] = puzzle.pieces;
    expect(a.rightConnection).toBe(b);
    expect(b.rightConnection).toBe(c);
    expect(c.downConnection).toBe(d);
  });

  it('shuffles connected puzzle', () => {
    puzzle.autoconnect();
    puzzle.shuffle(100, 100);
    expect(puzzle.pieces.length).toBe(4);
  });

  it('shuffles disconnected puzzle', () => {
    puzzle.shuffle(100, 100);
    expect(puzzle.pieces.length).toBe(4);
  });

  it('connects connected puzzle after shuffle', () => {
    puzzle.autoconnect();
    expect(puzzle.connected).toBe(true);
    puzzle.shuffleWith(Shuffler.noop);
    expect(puzzle.pieces.length).toBe(4);
    expect(puzzle.connected).toBe(true);
  });

  it('connects disconnected puzzle after shuffle', () => {
    expect(puzzle.connected).toBe(false);
    puzzle.shuffleWith(Shuffler.noop);
    expect(puzzle.pieces.length).toBe(4);
    expect(puzzle.connected).toBe(true);
  });

  it('translates connected puzzle', () => {
    puzzle.autoconnect();
    puzzle.translate(10, 10);
    const [a, b, c, d] = puzzle.pieces;
    expect(puzzle.pieces.length).toBe(4);
    expect(a.rightConnection).toBe(b);
    expect(b.rightConnection).toBe(c);
    expect(c.downConnection).toBe(d);
  });

  it('translates disconnected puzzle', () => {
    puzzle.translate(10, 10);
    expect(puzzle.pieces.length).toBe(4);
    const [a, b, c] = puzzle.pieces;
    expect(a.rightConnection).toBeNull();
    expect(b.rightConnection).toBeNull();
    expect(c.downConnection).toBeNull();
  });

  describe('reframing', () => {
    it('reframes single offstage piece', () => {
      puzzle = new Puzzle();
      const piece = puzzle.newPiece({ right: Tab, up: Tab });
      piece.locateAt(-10, -10);
      puzzle.reframe(Vector.zero(), vector(10, 10));
      expect(piece.centralAnchor?.asPair()).toEqual([2, 2]);
    });

    it('reframes single offstage piece - to the right', () => {
      puzzle = new Puzzle();
      const piece = puzzle.newPiece({ right: Tab, up: Tab });
      piece.locateAt(10, 15);
      puzzle.reframe(Vector.zero(), vector(8, 12));
      expect(piece.centralAnchor?.asPair()).toEqual([6, 10]);
    });

    it('reframes multiple offstage pieces, preserving distances', () => {
      puzzle = new Puzzle();
      const one = puzzle.newPiece({ right: Tab, up: Tab });
      one.locateAt(-10, -10);
      const other = puzzle.newPiece({ right: Tab, up: Tab });
      other.locateAt(-8, -6);
      puzzle.reframe(Vector.zero(), vector(10, 10));
      expect(one.centralAnchor?.asPair()).toEqual([2, 2]);
      expect(other.centralAnchor?.asPair()).toEqual([4, 6]);
    });

    it('honors min bound when full reframing is impossible', () => {
      puzzle = new Puzzle();
      const one = puzzle.newPiece({ right: Tab, up: Tab });
      one.locateAt(0, 0);
      const other = puzzle.newPiece({ right: Tab, up: Tab });
      other.locateAt(12, 12);
      puzzle.reframe(Vector.zero(), vector(10, 10));
      expect(one.centralAnchor?.asPair()).toEqual([2, 2]);
      expect(other.centralAnchor?.asPair()).toEqual([14, 14]);
    });

    it('reframes does nothing when pieces are already within bounds', () => {
      puzzle = new Puzzle();
      const one = puzzle.newPiece({ right: Tab, up: Tab });
      one.locateAt(3, 3);
      const other = puzzle.newPiece({ right: Tab, up: Tab });
      other.locateAt(5, 9);
      puzzle.reframe(Vector.zero(), vector(20, 20));
      expect(one.centralAnchor?.asPair()).toEqual([3, 3]);
      expect(other.centralAnchor?.asPair()).toEqual([5, 9]);
    });
  });

  describe('validation', () => {
    it('is invalid by default', () => {
      expect(puzzle.isValid()).toBe(false);
    });

    describe('with attached validator', () => {
      beforeEach(() => {
        puzzle.attachValidator(
          new PuzzleValidator(it => it.head.isAt(10, 10)),
        );
      });

      it('can be valid using a validator', () => {
        expect(puzzle.isValid()).toBe(false);
        puzzle.head.drag(10, 10);
        expect(puzzle.isValid()).toBe(true);
      });

      it('can be validated using a validator', () => {
        return new Promise<void>((resolve) => {
          puzzle.onValid(() => resolve());
          puzzle.validate();
          puzzle.head.drag(10, 10);
          puzzle.validate();
          puzzle.validate();
          puzzle.validate();
        });
      });
    });

    describe('with connected validator', () => {
      beforeEach(() => {
        puzzle.attachValidator(new PuzzleValidator(PuzzleValidator.connected));
      });

      it('fires onValid again after disconnect and reconnect', () => {
        let validCount = 0;
        puzzle.onValid(() => validCount++);

        // Initially connect all pieces and validate - onValid fires (1st time)
        puzzle.autoconnect();
        puzzle.validate();
        expect(validCount).toBe(1);
        expect(puzzle.valid).toBe(true);

        // Simulate mid-drag disconnect (no validate during drag, matching real behavior)
        const [a] = puzzle.pieces;
        a.disconnect();
        expect(puzzle.connected).toBe(false);

        // Simulate fixed drag-end: validate (records invalid), drop (reconnects), validate (fires onValid)
        puzzle.validate();
        expect(puzzle.valid).toBe(false);
        a.drop();
        puzzle.validate();
        expect(validCount).toBe(2);
        expect(puzzle.valid).toBe(true);
      });

      it('does not fire extra onValid when puzzle stays connected', () => {
        let validCount = 0;
        puzzle.onValid(() => validCount++);

        // Connect and validate - onValid fires once
        puzzle.autoconnect();
        puzzle.validate();
        expect(validCount).toBe(1);

        // Simulate drag-end without disconnect: validate, drop, validate
        // Puzzle was never invalid, so onValid should NOT fire again
        puzzle.validate();
        puzzle.pieces[0].drop();
        puzzle.validate();
        expect(validCount).toBe(1);
      });
    });
  });

  describe('exports', () => {
    it('exports with connections data', () => {
      expect(puzzle.export()).toEqual({
        pieceRadius: { x: 2, y: 2 },
        proximity: 1,
        pieces: [
          {
            centralAnchor: { x: 0, y: 0 },
            connections: { down: null, left: null, right: null, up: null },
            metadata: {},
            structure: 'T---',
          },
          {
            centralAnchor: { x: 3, y: 0 },
            connections: { down: null, left: null, right: null, up: null },
            metadata: {},
            structure: 'T-S-',
          },
          {
            centralAnchor: { x: 6, y: 0 },
            connections: { down: null, left: null, right: null, up: null },
            metadata: {},
            structure: 'TSS-',
          },
          {
            centralAnchor: { x: 6, y: 3 },
            connections: { down: null, left: null, right: null, up: null },
            metadata: {},
            structure: '---T',
          },
        ],
      });
    });

    it('exports without connections data', () => {
      expect(puzzle.export({ compact: true })).toEqual({
        pieceRadius: { x: 2, y: 2 },
        proximity: 1,
        pieces: [
          { centralAnchor: { x: 0, y: 0 }, metadata: {}, structure: 'T---' },
          { centralAnchor: { x: 3, y: 0 }, metadata: {}, structure: 'T-S-' },
          { centralAnchor: { x: 6, y: 0 }, metadata: {}, structure: 'TSS-' },
          { centralAnchor: { x: 6, y: 3 }, metadata: {}, structure: '---T' },
        ],
      });
    });
  });

  it('imports', () => {
    const imported = Puzzle.import(puzzle.export());
    expect(imported.pieces.length).toBe(puzzle.pieces.length);
    expect(imported.pieceDiameter).toEqual(puzzle.pieceDiameter);
    expect(imported.proximity).toBe(puzzle.proximity);
    expect(imported.metadata).toEqual(puzzle.metadata);
  });

  it('has metadata', () => {
    puzzle.pieces[0].annotate({ name: 'test' });
    expect(puzzle.metadata[0].name).toBe('test');
  });

  it('has headAnchor', () => {
    expect(puzzle.headAnchor.x).toBe(0);
    expect(puzzle.headAnchor.y).toBe(0);
  });

  it('can disconnect all', () => {
    puzzle.autoconnect();
    expect(puzzle.connected).toBe(true);
    puzzle.disconnect();
    expect(puzzle.connected).toBe(false);
  });

  it('can annotate pieces', () => {
    puzzle.annotate([{ v: 1 }, { v: 2 }, { v: 3 }, { v: 4 }]);
    expect(puzzle.pieces[0].metadata.v).toBe(1);
    expect(puzzle.pieces[3].metadata.v).toBe(4);
  });

  it('can relocate every piece via relocateTo', () => {
    puzzle.relocateTo([
      [10, 20],
      [30, 40],
      [50, 60],
      [70, 80],
    ]);
    expect(puzzle.pieces[0].centralAnchor?.asPair()).toEqual([10, 20]);
    expect(puzzle.pieces[1].centralAnchor?.asPair()).toEqual([30, 40]);
    expect(puzzle.pieces[2].centralAnchor?.asPair()).toEqual([50, 60]);
    expect(puzzle.pieces[3].centralAnchor?.asPair()).toEqual([70, 80]);
  });

  it('fires onTranslate listeners for every piece', () => {
    const events: [Piece, number, number][] = [];
    puzzle.onTranslate((piece, dx, dy) => events.push([piece, dx, dy]));
    puzzle.translate(5, 7);
    expect(events.length).toBe(puzzle.pieces.length);
    expect(events.every(([, dx, dy]) => dx === 5 && dy === 7)).toBe(true);
  });

  it('can switch drag modes', () => {
    const piece = puzzle.pieces[0];

    puzzle.forceConnectionWhileDragging();
    expect(puzzle.dragShouldDisconnect(piece, 1, 0)).toBe(false);

    puzzle.forceDisconnectionWhileDragging();
    expect(puzzle.dragShouldDisconnect(piece, 1, 0)).toBe(true);

    // tryDisconnectionWhileDragging restores the default behaviour: a piece
    // with no connection to its right is free to be disconnected.
    puzzle.tryDisconnectionWhileDragging();
    expect(puzzle.dragShouldDisconnect(piece, 1, 0)).toBe(true);
  });
});
