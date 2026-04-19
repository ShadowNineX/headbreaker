import { describe, expect, it } from 'vitest';
import Canvas from '../src/canvas';
import DummyPainter from '../src/dummy-painter';
import { None, Slot, Tab } from '../src/insert';
import Puzzle from '../src/puzzle';
import { flipflop } from '../src/sequence';
import { diameter } from '../src/size';
import { vector } from '../src/vector';

describe('canvas', () => {
  const painter = new DummyPainter();

  it('can create a single-piece puzzle', () => {
    const canvas = new Canvas('canvas', {
      width: 800,
      height: 800,
      pieceSize: 100,
      proximity: 20,
      borderFill: 10,
      strokeWidth: 2,
      lineSoftness: 0.12,
      strokeColor: 'black',
      painter,
    });

    canvas.sketchPiece({
      structure: { right: Tab, down: Tab, left: Slot },
      metadata: {
        id: 'a',
        currentPosition: { x: 50, y: 50 },
        color: 'red',
      },
    });

    canvas.draw();

    expect(canvas._nullLayer?.figures).toBe(1);
    expect(canvas._nullLayer?.drawn).toBe(true);
    expect(!!canvas.figures[1]).toBe(false);
    expect(!!canvas.figures.a).toBe(true);
    expect(canvas.puzzle.pieces.length).toBe(1);
    expect(canvas.puzzle.head.centralAnchor).toEqual({ x: 50, y: 50 });
  });

  it('cannot draw a canvas twice', () => {
    const canvas = new Canvas('canvas', {
      width: 800,
      height: 800,
      painter,
    });

    canvas.sketchPiece({
      structure: { right: Tab, down: Tab, left: Slot },
      metadata: {},
    });

    canvas.draw();
    expect(() => canvas.draw()).toThrow();
  });

  it('can create a single-piece puzzle with size overridden', () => {
    const canvas = new Canvas('canvas', {
      width: 800,
      height: 800,
      pieceSize: 100,
      proximity: 20,
      painter,
    });

    canvas.sketchPiece({
      structure: { right: Tab, down: Tab, left: Slot },
      size: diameter({ x: 50, y: 40 }),
      metadata: {
        id: 'a',
        currentPosition: { x: 50, y: 50 },
        color: 'red',
      },
    });

    canvas.draw();
    expect(canvas.puzzle.head.size).toEqual(diameter({ x: 50, y: 40 }));
    expect(canvas.puzzle.head.centralAnchor).toEqual({ x: 50, y: 50 });
  });

  it('can create a non-homogenous two-pieces canvas', () => {
    const canvas = new Canvas('canvas', {
      width: 800,
      height: 800,
      pieceSize: 100,
      proximity: 20,
      borderFill: 10,
      strokeWidth: 2,
      lineSoftness: 0.12,
      strokeColor: 'black',
      painter,
    });

    canvas.sketchPiece({
      structure: '-T--',
      metadata: { id: 'a', currentPosition: { x: 50, y: 50 } },
    });

    canvas.sketchPiece({
      structure: '---S',
      metadata: { id: 'b', currentPosition: { x: 200, y: 200 } },
      size: diameter(vector(200, 100)),
    });

    canvas.draw();

    expect(canvas._nullLayer?.figures).toBe(2);
    expect(canvas._nullLayer?.drawn).toBe(true);
    expect(canvas.puzzle.pieces[0].diameter).toEqual(vector(100, 100));
    expect(canvas.puzzle.pieces[1].diameter).toEqual(vector(200, 100));
    expect(canvas.pieceDiameter.x).toBe(100);
    expect(canvas.pieceDiameter.y).toBe(100);
  });

  it('initializes the validity on draw', () => {
    const canvas = new Canvas('canvas', {
      width: 800,
      height: 800,
      pieceSize: 100,
      proximity: 20,
      borderFill: 10,
      strokeWidth: 2,
      lineSoftness: 0.12,
      strokeColor: 'black',
      painter,
    });

    canvas.sketchPiece({ structure: '----', metadata: { id: 'a' } });
    canvas.draw();
    expect(canvas.puzzle.valid).toBe(false);
  });

  it('can create a single-piece puzzle with no current nor target positions', () => {
    const canvas = new Canvas('canvas', {
      width: 800,
      height: 800,
      painter,
    });

    canvas.sketchPiece({ structure: '----', metadata: { id: 'a' } });
    canvas.draw();

    const head = canvas.puzzle.head;
    expect(head.metadata.targetPosition).toEqual({ x: 0, y: 0 });
    expect(head.metadata.currentPosition).toEqual(head.metadata.targetPosition);
    expect(head.metadata.currentPosition).not.toBe(
      head.metadata.targetPosition,
    );
  });

  it('can create a single-piece puzzle with no current but target positions', () => {
    const canvas = new Canvas('canvas', {
      width: 800,
      height: 800,
      painter,
    });

    canvas.sketchPiece({
      structure: '----',
      metadata: { id: 'a', targetPosition: { x: 10, y: 15 } },
    });
    canvas.draw();

    const head = canvas.puzzle.head;
    expect(head.metadata.targetPosition).toEqual({ x: 10, y: 15 });
    expect(head.metadata.currentPosition).toEqual(head.metadata.targetPosition);
    expect(head.metadata.currentPosition).not.toBe(
      head.metadata.targetPosition,
    );
  });

  it('can create a single-piece puzzle with strings', () => {
    const canvas = new Canvas('canvas', {
      width: 800,
      height: 800,
      pieceSize: 100,
      proximity: 20,
      borderFill: 10,
      strokeWidth: 2,
      lineSoftness: 0.12,
      strokeColor: 'black',
      painter,
    });

    canvas.sketchPiece({
      structure: 'STS-',
      metadata: {
        id: 'a',
        currentPosition: { x: 50, y: 50 },
        color: 'red',
      },
    });
    canvas.draw();

    expect(canvas._nullLayer?.figures).toBe(1);
    expect(!!canvas.figures.a).toBe(true);

    const [piece] = canvas.puzzle.pieces;
    expect(piece.right).toBe(Slot);
    expect(piece.down).toBe(Tab);
    expect(piece.left).toBe(Slot);
    expect(piece.up).toBe(None);
  });

  it('can create an autogenerated puzzle', () => {
    const canvas = new Canvas('canvas', {
      width: 800,
      height: 800,
      pieceSize: 100,
      proximity: 20,
      borderFill: 10,
      strokeWidth: 2,
      lineSoftness: 0.12,
      strokeColor: 'red',
      painter,
    });

    canvas.autogenerate({
      verticalPiecesCount: 4,
      horizontalPiecesCount: 4,
      insertsGenerator: flipflop,
    });
    canvas.draw();

    expect(canvas._nullLayer?.figures).toBe(16);
    expect(canvas._nullLayer?.drawn).toBe(true);
    expect(!!canvas.figures[0]).toBe(false);
    expect(!!canvas.figures['1']).toBe(true);
    expect(!!canvas.figures['16']).toBe(true);
    expect(!!canvas.figures['17']).toBe(false);
    expect(canvas.puzzle.pieces.length).toBe(16);
  });

  it('can shuffle a puzzle', () => {
    const canvas = new Canvas('canvas', {
      width: 800,
      height: 800,
      pieceSize: 100,
      proximity: 20,
      painter,
    });

    canvas.autogenerate();
    canvas.shuffle();
    expect(canvas.autoconnected).toBe(true);
  });

  it('can solve a puzzle', () => {
    const canvas = new Canvas('canvas', {
      width: 800,
      height: 800,
      pieceSize: 100,
      proximity: 20,
      painter,
    });

    canvas.autogenerate();
    canvas.shuffle();
    canvas.solve();

    canvas.puzzle.pieces.forEach((it) => {
      expect(it.metadata.currentPosition).toEqual(it.metadata.targetPosition);
      expect(it.metadata.currentPosition).not.toBe(it.metadata.targetPosition);
      expect(it.centralAnchor).toEqual(it.metadata.currentPosition);
    });
    expect(canvas.autoconnected).toBe(true);
  });

  it('can clear canvas', () => {
    const canvas = new Canvas('canvas', {
      width: 800,
      height: 800,
      pieceSize: 100,
      proximity: 20,
      borderFill: 10,
      strokeWidth: 2,
      lineSoftness: 0.12,
      strokeColor: 'red',
      painter,
    });

    canvas.autogenerate();
    canvas.draw();
    canvas.clear();

    expect(canvas._drawn).toBe(false);
    expect(canvas._painter).toBe(painter);
    expect(canvas._puzzle).toBeNull();
    expect(canvas.puzzle.pieces.length).toBe(0);
    expect(canvas.figures).toEqual({});
    expect(() => canvas.draw()).not.toThrow();
  });

  it('can sketch a whole puzzle', () => {
    const canvas = new Canvas('canvas', {
      width: 800,
      height: 800,
      painter,
    });
    const puzzle = new Puzzle({ pieceRadius: 13, proximity: 7 });
    puzzle.newPiece({ right: Tab }).locateAt(0, 0);
    puzzle.newPiece({ left: Slot, right: Tab }).locateAt(3, 0);

    canvas.renderPuzzle(puzzle);
    canvas.draw();

    expect(canvas._nullLayer?.figures).toBe(2);
    expect(canvas._nullLayer?.drawn).toBe(true);
    expect(canvas.pieceDiameter).toEqual({ x: 26, y: 26 });
    expect(canvas.proximity).toBe(14);
  });

  it('can create an autogenerated puzzle with metadata list', () => {
    const canvas = new Canvas('canvas', {
      width: 800,
      height: 800,
      pieceSize: 100,
      proximity: 20,
      borderFill: 10,
      strokeWidth: 2,
      lineSoftness: 0.12,
      strokeColor: 'red',
      painter,
    });

    canvas.autogenerate({
      verticalPiecesCount: 2,
      horizontalPiecesCount: 2,
      metadata: [
        { label: { text: 'a' } },
        { label: { text: 'b' } },
        { label: { text: 'c' } },
        { label: { text: 'd' } },
      ],
    });
    canvas.draw();

    expect(canvas.puzzle.pieces[0].metadata.label.text).toBe('a');
    expect(canvas.puzzle.pieces[1].metadata.label.text).toBe('b');
    expect(canvas.puzzle.pieces[2].metadata.label.text).toBe('c');
    expect(canvas.puzzle.pieces[3].metadata.label.text).toBe('d');
    expect(canvas.puzzleDiameter.x).toBe(204);
    expect(canvas.pieceDiameter.x).toBe(100);
    expect(canvas.puzzleDiameter.y).toBe(204);
    expect(canvas.pieceDiameter.y).toBe(100);
  });

  it('can create an autogenerated puzzle with rectangular pieces', () => {
    const canvas = new Canvas('canvas', {
      width: 800,
      height: 800,
      pieceSize: { x: 100, y: 50 },
      proximity: 20,
      borderFill: 10,
      strokeWidth: 2,
      lineSoftness: 0.12,
      strokeColor: 'red',
      painter,
    });

    canvas.autogenerate({
      verticalPiecesCount: 2,
      horizontalPiecesCount: 2,
    });
    canvas.draw();

    expect(canvas.puzzleDiameter.x).toBe(204);
    expect(canvas.pieceDiameter.x).toBe(100);
    expect(canvas.puzzleDiameter.y).toBe(104);
    expect(canvas.pieceDiameter.y).toBe(50);
  });

  it('can listen to connect events with figures', () => {
    return new Promise<void>((resolve) => {
      const canvas = new Canvas('canvas', {
        width: 800,
        height: 800,
        pieceSize: 100,
        proximity: 20,
        borderFill: 10,
        strokeWidth: 2,
        lineSoftness: 0.12,
        strokeColor: 'red',
        painter,
      });

      canvas.autogenerate({
        verticalPiecesCount: 2,
        horizontalPiecesCount: 2,
        insertsGenerator: flipflop,
      });
      canvas.draw();

      expect(canvas._nullLayer?.figures).toBe(4);

      const [first, second] = canvas.puzzle.pieces;

      canvas.onConnect((piece, figure, target, targetFigure) => {
        expect(canvas.getFigure(piece)).toBe(figure);
        expect(first).toBe(piece);
        expect(canvas.getFigure(target)).toBe(targetFigure);
        expect(second).toBe(target);
        resolve();
      });

      first.disconnect();
      first.connectHorizontallyWith(second);
    });
  });

  it('can listen to disconnect events with figures', () => {
    return new Promise<void>((resolve) => {
      const canvas = new Canvas('canvas', {
        width: 800,
        height: 800,
        pieceSize: 100,
        proximity: 20,
        borderFill: 10,
        strokeWidth: 2,
        lineSoftness: 0.12,
        strokeColor: 'red',
        painter,
      });

      canvas.autogenerate({
        verticalPiecesCount: 1,
        horizontalPiecesCount: 2,
        insertsGenerator: flipflop,
      });
      canvas.draw();

      const [first, second] = canvas.puzzle.pieces;

      canvas.onDisconnect((piece, figure) => {
        expect(canvas.getFigure(piece)).toBe(figure);
        expect(first).toBe(piece);
        resolve();
      });

      first.connectHorizontallyWith(second);
      first.disconnect();
    });
  });

  it('can listen to multiple disconnect events with figures', () => {
    return new Promise<void>((resolve) => {
      const canvas = new Canvas('canvas', {
        width: 800,
        height: 800,
        pieceSize: 100,
        proximity: 20,
        borderFill: 10,
        strokeWidth: 2,
        lineSoftness: 0.12,
        strokeColor: 'red',
        painter,
      });

      canvas.autogenerate({
        verticalPiecesCount: 3,
        horizontalPiecesCount: 3,
        insertsGenerator: flipflop,
      });
      canvas.draw();

      expect(canvas._nullLayer?.figures).toBe(9);

      const center = canvas.puzzle.pieces[4];

      let count = 0;
      canvas.onDisconnect(() => {
        count++;
        if (count === 4) {
          resolve();
        }
      });
      center.disconnect();
    });
  });

  it('valid property reflects puzzle validity', () => {
    const canvas = new Canvas('canvas', {
      width: 800,
      height: 800,
      pieceSize: 100,
      proximity: 20,
      painter,
    });
    canvas.sketchPiece({ structure: '----', metadata: { id: 'a' } });
    canvas.draw();
    expect(canvas.valid).toBe(false);
  });

  it('figuresCount returns correct count', () => {
    const canvas = new Canvas('canvas', {
      width: 800,
      height: 800,
      pieceSize: 100,
      proximity: 20,
      painter,
    });
    canvas.autogenerate({
      verticalPiecesCount: 2,
      horizontalPiecesCount: 2,
    });
    canvas.draw();
    expect(canvas.figuresCount).toBe(4);
  });

  it('puzzle settings match canvas settings', () => {
    const canvas = new Canvas('canvas', {
      width: 800,
      height: 800,
      pieceSize: 100,
      proximity: 20,
      painter,
    });
    expect(canvas.settings.pieceRadius).toEqual({ x: 50, y: 50 });
    expect(canvas.settings.proximity).toBe(20);
  });
});
