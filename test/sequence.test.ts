import { describe, expect, it } from 'vitest';
import { None, Slot, Tab } from '../src/insert';
import { fixed, flipflop, InsertSequence, random, twoAndTwo } from '../src/sequence';

describe('insertSequence', () => {
  it('fixed', () => {
    const sequence = new InsertSequence(fixed);
    expect(sequence.next()).toBe(Tab);
    expect(sequence.previousComplement()).toBe(None);
    expect(sequence.next()).toBe(Tab);
    expect(sequence.previousComplement()).toBe(Slot);
    expect(sequence.next()).toBe(Tab);
    expect(sequence.previousComplement()).toBe(Slot);
    expect(sequence.next()).toBe(Tab);
    expect(sequence.previousComplement()).toBe(Slot);
  });

  it('flipflop', () => {
    const sequence = new InsertSequence(flipflop);
    expect(sequence.next()).toBe(Tab);
    expect(sequence.next()).toBe(Slot);
    expect(sequence.next()).toBe(Tab);
    expect(sequence.next()).toBe(Slot);
  });

  it('two-and-two', () => {
    const sequence = new InsertSequence(twoAndTwo);
    expect(sequence.next()).toBe(Tab);
    expect(sequence.next()).toBe(Tab);
    expect(sequence.next()).toBe(Slot);
    expect(sequence.next()).toBe(Slot);
    expect(sequence.next()).toBe(Tab);
    expect(sequence.next()).toBe(Tab);
    expect(sequence.next()).toBe(Slot);
    expect(sequence.next()).toBe(Slot);
  });

  it('current returns None when at max', () => {
    const sequence = new InsertSequence(fixed);
    sequence.next();
    expect(sequence.current(1)).toBe(None);
  });

  it('current returns current insert when not at max', () => {
    const sequence = new InsertSequence(fixed);
    sequence.next();
    expect(sequence.current(5)).toBe(Tab);
  });

  it('random yields only Tab or Slot, never None', () => {
    for (let i = 0; i < 50; i++) {
      const insert = random(i);
      expect([Tab, Slot]).toContain(insert);
      expect(insert).not.toBe(None);
    }
  });

  it('random yields both Tab and Slot across many calls', () => {
    const seen = new Set<unknown>();
    for (let i = 0; i < 200 && seen.size < 2; i++) {
      seen.add(random(i));
    }
    expect(seen.has(Tab)).toBe(true);
    expect(seen.has(Slot)).toBe(true);
  });
});
