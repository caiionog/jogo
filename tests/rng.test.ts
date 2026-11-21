import { describe, expect, it } from 'vitest';
import { createRng, seedToState } from '../src/engine';

const seq = (state: number, n = 20) => {
  const r = createRng(state);
  return Array.from({ length: n }, () => r.next());
};

describe('rng', () => {
  it('é determinístico: mesma seed → mesma sequência', () => {
    expect(seq(seedToState('abc'))).toEqual(seq(seedToState('abc')));
  });

  it('seeds diferentes geram sequências diferentes', () => {
    expect(seq(seedToState('abc'))).not.toEqual(seq(seedToState('abd')));
  });

  it('pode ser retomado a partir do estado salvo', () => {
    const a = createRng(123);
    a.next();
    a.next();
    const saved = a.state;
    const expected = [a.next(), a.next(), a.next()];
    const b = createRng(saved);
    expect([b.next(), b.next(), b.next()]).toEqual(expected);
  });

  it('next() fica em [0,1) e int() respeita limites inclusivos', () => {
    const r = createRng(42);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const f = r.next();
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
      const n = r.int(3, 6);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(6);
      seen.add(n);
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6]);
  });

  it('weightedIndex respeita pesos (zero nunca sai)', () => {
    const r = createRng(7);
    const counts = [0, 0, 0];
    for (let i = 0; i < 10000; i++) counts[r.weightedIndex([1, 0, 3])]!++;
    expect(counts[1]).toBe(0);
    expect(counts[2]! / counts[0]!).toBeGreaterThan(2.5);
    expect(counts[2]! / counts[0]!).toBeLessThan(3.5);
  });

  it('lança erro com entradas inválidas', () => {
    const r = createRng(1);
    expect(() => r.pick([])).toThrow();
    expect(() => r.weightedIndex([0, 0])).toThrow();
    expect(() => r.int(5, 1)).toThrow();
  });
});
