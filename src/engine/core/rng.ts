/**
 * RNG determinístico (mulberry32). Todo sorteio da engine passa por aqui.
 * O estado interno é um único inteiro de 32 bits, que é salvo no GameState
 * (`rngState`), tornando o jogo serializável e reproduzível.
 */

export interface Rng {
  /** Float em [0, 1). */
  next(): number;
  /** Inteiro em [min, max] (inclusivo). */
  int(min: number, max: number): number;
  /** true com probabilidade p. */
  chance(p: number): boolean;
  /** Elemento aleatório do array (lança erro se vazio). */
  pick<T>(items: readonly T[]): T;
  /** Índice sorteado proporcionalmente aos pesos (lança erro se soma <= 0). */
  weightedIndex(weights: readonly number[]): number;
  /** Estado atual, para gravar de volta no GameState. */
  readonly state: number;
}

/** Converte uma seed qualquer (número ou string) em estado inicial de 32 bits. */
export function seedToState(seed: number | string): number {
  const str = String(seed);
  // hash FNV-1a 32 bits
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function createRng(initialState: number): Rng {
  let s = initialState >>> 0;

  const next = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int(min, max) {
      if (max < min) throw new Error(`rng.int: max (${max}) < min (${min})`);
      return min + Math.floor(next() * (max - min + 1));
    },
    chance(p) {
      return next() < p;
    },
    pick(items) {
      if (items.length === 0) throw new Error('rng.pick: array vazio');
      return items[Math.floor(next() * items.length)] as (typeof items)[number];
    },
    weightedIndex(weights) {
      const total = weights.reduce((a, w) => a + Math.max(0, w), 0);
      if (total <= 0) throw new Error('rng.weightedIndex: soma de pesos <= 0');
      let roll = next() * total;
      for (let i = 0; i < weights.length; i++) {
        roll -= Math.max(0, weights[i] ?? 0);
        if (roll < 0) return i;
      }
      return weights.length - 1;
    },
    get state() {
      return s;
    },
  };
}
