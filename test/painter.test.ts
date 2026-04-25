import { describe, expect, it } from 'vitest';
import Painter from '../src/painter';

describe('painter (base class)', () => {
  // Cast through unknown so we can pass arbitrary values to no-op methods
  // without depending on Canvas/Konva at all.
  const noop = undefined as unknown as never;

  it('does not throw on any of its no-op methods', () => {
    const painter = new Painter();
    expect(() => painter.initialize(noop, 'id')).not.toThrow();
    expect(() => painter.reinitialize(noop)).not.toThrow();
    expect(() => painter.draw(noop)).not.toThrow();
    expect(() => painter.resize(noop, 100, 200)).not.toThrow();
    expect(() => painter.scale(noop, { x: 1, y: 1 })).not.toThrow();
    expect(() => painter.sketch(noop, noop, noop, noop)).not.toThrow();
    expect(() => painter.fill(noop, noop, noop)).not.toThrow();
    expect(() => painter.label(noop, noop, noop)).not.toThrow();
    expect(() => painter.physicalTranslate(noop, noop, noop)).not.toThrow();
    expect(() => painter.logicalTranslate(noop, noop, noop)).not.toThrow();
    expect(() => painter.onDrag(noop, noop, noop, () => {})).not.toThrow();
    expect(() => painter.onDragEnd(noop, noop, noop, () => {})).not.toThrow();
    expect(() =>
      painter.registerKeyboardGestures(noop, { Shift: () => {} }),
    ).not.toThrow();
  });

  it('returns undefined from every method (they are no-ops)', () => {
    const painter = new Painter();
    expect(painter.initialize(noop, 'id')).toBeUndefined();
    expect(painter.draw(noop)).toBeUndefined();
    expect(painter.fill(noop, noop, noop)).toBeUndefined();
  });
});
