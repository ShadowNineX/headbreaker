import type Puzzle from '../src/puzzle';
import type { Validator } from '../src/validator';
import { beforeEach, describe, expect, it } from 'vitest';
import { anchor } from '../src/anchor';
import Manufacturer from '../src/manufacturer';
import * as SpatialMetadata from '../src/spatial-metadata';
import { PieceValidator, PuzzleValidator } from '../src/validator';

describe('validator', () => {
  let puzzle: Puzzle;
  let validator: Validator;

  beforeEach(() => {
    const manufacturer = new Manufacturer();
    manufacturer.withDimensions(2, 2);
    manufacturer.withStructure({ pieceRadius: 10, proximity: 1 });
    manufacturer.withHeadAt(anchor(0, 0));
    puzzle = manufacturer.build();
  });

  describe('puzzle', () => {
    beforeEach(() => {
      validator = new PuzzleValidator(p => p.head.isAt(10, 10));
    });

    it('passes with valid puzzle', () => {
      expect(validator.isValid(puzzle)).toBe(false);
      puzzle.translate(10, 10);
      expect(validator.isValid(puzzle)).toBe(true);
    });

    it('updates status', () => {
      validator.validate(puzzle);
      expect(validator.valid).toBe(false);
      puzzle.translate(10, 10);
      validator.validate(puzzle);
      expect(validator.valid).toBe(true);
      validator.validate(puzzle);
      expect(validator.valid).toBe(true);
    });

    it('connected validator', () => {
      puzzle.disconnect();
      const v = new PuzzleValidator(PuzzleValidator.connected);
      expect(v.isValid(puzzle)).toBe(false);
      puzzle.autoconnect();
      expect(v.isValid(puzzle)).toBe(true);
    });

    describe('relative refs validator', () => {
      it('without offset', () => {
        const v = new PuzzleValidator(
          PuzzleValidator.relativeRefs([
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 1],
          ]),
        );
        expect(v.isValid(puzzle)).toBe(true);
      });

      it('with offset in refs', () => {
        const v = new PuzzleValidator(
          PuzzleValidator.relativeRefs([
            [1, 1],
            [2, 1],
            [1, 2],
            [2, 2],
          ]),
        );
        expect(v.isValid(puzzle)).toBe(true);
      });

      it('with offset in pieces', () => {
        const v = new PuzzleValidator(
          PuzzleValidator.relativeRefs([
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 1],
          ]),
        );
        puzzle.translate(10, -10);
        expect(v.isValid(puzzle)).toBe(true);
      });

      it('with non integral offset in pieces', () => {
        const v = new PuzzleValidator(
          PuzzleValidator.relativeRefs([
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 1],
          ]),
        );
        puzzle.translate(2, -3);
        expect(v.isValid(puzzle)).toBe(true);
      });

      it('with invalid refs', () => {
        const v = new PuzzleValidator(
          PuzzleValidator.relativeRefs([
            [0, 0],
            [1, 1],
            [2, 2],
            [3, 3],
          ]),
        );
        expect(v.isValid(puzzle)).toBe(false);
      });
    });
  });

  describe('piece', () => {
    beforeEach(() => {
      validator = new PieceValidator(piece => piece.metadata.value === 1);
    });

    it('passes with valid puzzle', () => {
      expect(validator.isValid(puzzle)).toBe(false);
      puzzle.metadata.forEach(
        it => ((it as Record<string, unknown>).value = 1),
      );
      expect(validator.isValid(puzzle)).toBe(true);
    });

    it('is valid within onValid', () => {
      return new Promise<void>((resolve) => {
        validator.onValid(() => {
          expect(validator.valid).toBe(true);
          resolve();
        });
        puzzle.metadata.forEach(
          it => ((it as Record<string, unknown>).value = 1),
        );
        validator.validate(puzzle);
      });
    });

    it('validation status is initially undefined', () => {
      expect(validator.valid).toBe(undefined);
    });

    it('validation status can be updated without firing events', () => {
      validator.updateValidity(puzzle);
      expect(validator.valid).toBe(false);
    });
  });

  describe('nullValidator', () => {
    it('isNull returns true', () => {
      expect(puzzle.validator.isNull).toBe(true);
    });
  });
});

describe('spatialMetadata', () => {
  let puzzle: Puzzle;

  describe('standard validators', () => {
    beforeEach(() => {
      const manufacturer = new Manufacturer();
      manufacturer.withDimensions(2, 2);
      manufacturer.withStructure({ pieceRadius: 10, proximity: 1 });
      manufacturer.withHeadAt(anchor(0, 0));
      puzzle = manufacturer.build();

      puzzle.annotate(
        puzzle.pieces.map(it => ({
          targetPosition: it.centralAnchor?.asVector(),
        })),
      );
    });

    it('connected validator', () => {
      puzzle.disconnect();
      const v = new PuzzleValidator(PuzzleValidator.connected);
      expect(v.isValid(puzzle)).toBe(false);
      puzzle.autoconnect();
      expect(v.isValid(puzzle)).toBe(true);
    });

    describe('relative-position validator', () => {
      it('works when positions are exact', () => {
        const v = new PuzzleValidator(SpatialMetadata.relativePosition);
        expect(v.isValid(puzzle)).toBe(true);
        puzzle.translate(10, 23);
        expect(v.isValid(puzzle)).toBe(true);
        puzzle.shuffle(200, 200);
        expect(v.isValid(puzzle)).toBe(false);
      });

      it('works when positions not are exact', () => {
        const v = new PuzzleValidator(SpatialMetadata.relativePosition);
        expect(v.isValid(puzzle)).toBe(true);
        puzzle.translate(10.333333333333334, 23.333333333333332);
        expect(v.isValid(puzzle)).toBe(true);
        puzzle.shuffle(200, 200);
        expect(v.isValid(puzzle)).toBe(false);
      });
    });

    it('absolute-position validator', () => {
      const v = new PieceValidator(SpatialMetadata.absolutePosition);
      expect(v.isValid(puzzle)).toBe(true);
      puzzle.translate(10, 23);
      expect(v.isValid(puzzle)).toBe(false);
      puzzle.shuffle(200, 200);
      expect(v.isValid(puzzle)).toBe(false);
    });

    it('solved validator', () => {
      const v = new PuzzleValidator(SpatialMetadata.solved);
      puzzle.autoconnect();
      expect(v.isValid(puzzle)).toBe(true);
      puzzle.translate(10, 23);
      expect(v.isValid(puzzle)).toBe(true);
      puzzle.disconnect();
      expect(v.isValid(puzzle)).toBe(false);
      puzzle.autoconnect();
      puzzle.shuffle(200, 200);
      expect(v.isValid(puzzle)).toBe(false);
    });
  });
});
