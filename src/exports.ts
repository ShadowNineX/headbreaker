import DummyPainter from './dummy-painter';
import KonvaPainter from './konva-painter';

export { anchor, Anchor } from './anchor';
export { Horizontal, Vertical } from './axis';
export type { Axis } from './axis';
export { default as Canvas } from './canvas';
export type { CanvasMetadata, Figure, LabelMetadata, Template } from './canvas';
export * as connector from './connector';
export * as dragMode from './drag-mode';
export { None, Slot, Tab } from './insert';
export type { Insert } from './insert';
export { default as Manufacturer } from './manufacturer';
export * as Metadata from './metadata';
export { Classic, Rounded, Squared } from './outline';
export * as Outline from './outline';
export * as outline from './outline';
export { default as Painter } from './painter';
export * as Pair from './pair';
export { default as Piece } from './piece';
export type {
  ConnectionListener,
  PieceConfig,
  PieceDump,
  TranslationListener,
} from './piece';
export { default as Puzzle } from './puzzle';
export type { PuzzleDump, Settings } from './puzzle';
export {
  fixed,
  flipflop,
  InsertSequence,
  random as randomSequence,
  twoAndTwo,
} from './sequence';
export type { InsertsGenerator } from './sequence';

export * as generators from './sequence';
export * as Shuffler from './shuffler';
export { diameter, radius } from './size';
export type { Size } from './size';
export * as SpatialMetadata from './spatial-metadata';
export * as Structure from './structure';
export { NullValidator, PieceValidator, PuzzleValidator } from './validator';
export { DummyPainter, KonvaPainter };
export type {
  PieceCondition,
  PuzzleCondition,
  ValidationListener,
  Validator,
} from './validator';
export const painters = {
  Dummy: DummyPainter,
  Konva: KonvaPainter,
} as const;

export {
  apply,
  cast,
  copy,
  diff,
  divide,
  equal,
  inner,
  max,
  min,
  minus,
  multiply,
  plus,
  update,
  vector,
  zero,
} from './vector';
export * as Vector from './vector';
