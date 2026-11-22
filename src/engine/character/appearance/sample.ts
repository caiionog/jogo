/**
 * Sorteio de genes a partir da cor ou raça (Etapa 7). Cada categoria gera faixas AMPLAS e SOBREPOSTAS: todos os
 * tipos de cabelo, cores de olhos e formatos aparecem em todos os grupos, só com pesos diferentes, e o tom de pele
 * de grupos vizinhos se cruza. Não existe "rosto padrão" por grupo.
 */
import type { Rng } from '../../core/rng';
import type { Race } from '../../geo/types';
import { EYE_COLORS, EYE_SHAPES, FACE_SHAPES, HAIR_TYPES } from './genes';
import type { AppearanceGenes, EyeColor, EyeShape, FaceShape, HairType } from './genes';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Aproximação de normal (soma de 3 uniformes), limitada a [0,1]. */
export function around(rng: Rng, mean: number, sd: number): number {
  const z = (rng.next() + rng.next() + rng.next() - 1.5) * 2; // ~N(0,1) truncada em ±3
  return clamp01(mean + z * sd);
}

export function pickWeighted<T extends string>(rng: Rng, options: readonly T[], weights: Readonly<Record<T, number>>): T {
  const total = options.reduce((t, o) => t + weights[o], 0);
  let r = rng.next() * total;
  for (const o of options) {
    r -= weights[o];
    if (r <= 0) return o;
  }
  return options[options.length - 1]!;
}

interface RaceProfile {
  skin: [number, number];
  undertone: [number, number];
  hair: Record<HairType, number>;
  hairColor: [number, number];
  red: number;
  eyes: Record<EyeColor, number>;
  eyeShape: Record<EyeShape, number>;
  nose: [number, number];
  lips: [number, number];
}

/** Perfis por categoria: médias e desvios largos (faixas sobrepostas). Pesos > 0 em todas as opções. */
export const RACE_PROFILES: Record<Race, RaceProfile> = {
  branca: {
    skin: [0.2, 0.11], undertone: [0, 0.5],
    hair: { liso: 40, ondulado: 34, cacheado: 18, crespo: 8 },
    hairColor: [0.38, 0.26], red: 0.04,
    eyes: { castanho_escuro: 22, castanho: 34, mel: 12, verde: 12, azul: 15, cinza: 5 },
    eyeShape: { amendoado: 40, redondo: 32, alongado: 20, palpebra_lisa: 8 },
    nose: [0.4, 0.16], lips: [0.42, 0.16],
  },
  parda: {
    skin: [0.48, 0.15], undertone: [0.25, 0.45],
    hair: { liso: 22, ondulado: 30, cacheado: 29, crespo: 19 },
    hairColor: [0.14, 0.13], red: 0.01,
    eyes: { castanho_escuro: 46, castanho: 34, mel: 12, verde: 5, azul: 2, cinza: 1 },
    eyeShape: { amendoado: 42, redondo: 28, alongado: 20, palpebra_lisa: 10 },
    nose: [0.52, 0.16], lips: [0.52, 0.16],
  },
  preta: {
    skin: [0.76, 0.12], undertone: [0.15, 0.45],
    hair: { liso: 6, ondulado: 16, cacheado: 34, crespo: 44 },
    hairColor: [0.06, 0.07], red: 0.005,
    eyes: { castanho_escuro: 62, castanho: 28, mel: 7, verde: 2, azul: 0.5, cinza: 0.5 },
    eyeShape: { amendoado: 44, redondo: 32, alongado: 18, palpebra_lisa: 6 },
    nose: [0.62, 0.16], lips: [0.63, 0.15],
  },
  amarela: {
    skin: [0.25, 0.11], undertone: [0.35, 0.4],
    hair: { liso: 66, ondulado: 24, cacheado: 7, crespo: 3 },
    hairColor: [0.06, 0.08], red: 0.003,
    eyes: { castanho_escuro: 56, castanho: 34, mel: 6, verde: 2, azul: 1, cinza: 1 },
    eyeShape: { amendoado: 30, redondo: 10, alongado: 20, palpebra_lisa: 40 },
    nose: [0.45, 0.15], lips: [0.42, 0.15],
  },
  indigena: {
    skin: [0.5, 0.12], undertone: [0.4, 0.4],
    hair: { liso: 64, ondulado: 24, cacheado: 8, crespo: 4 },
    hairColor: [0.05, 0.06], red: 0.003,
    eyes: { castanho_escuro: 62, castanho: 30, mel: 6, verde: 1, azul: 0.5, cinza: 0.5 },
    eyeShape: { amendoado: 40, redondo: 14, alongado: 22, palpebra_lisa: 24 },
    nose: [0.5, 0.15], lips: [0.47, 0.15],
  },
};

const FACE_W: Record<FaceShape, number> = { oval: 30, redondo: 22, quadrado: 18, coracao: 14, longo: 16 };

/** Genes sorteados a partir da cor ou raça (faixas amplas e sobrepostas). */
export function genesForRace(rng: Rng, race: Race): AppearanceGenes {
  const p = RACE_PROFILES[race];
  const undertone = Math.max(-1, Math.min(1, p.undertone[0] + (rng.next() + rng.next() - 1) * p.undertone[1] * 1.7));
  return {
    skinTone: around(rng, p.skin[0], p.skin[1]),
    undertone,
    hairType: pickWeighted(rng, HAIR_TYPES, p.hair),
    hairColor: around(rng, p.hairColor[0], p.hairColor[1]),
    red: rng.chance(p.red),
    eyeColor: pickWeighted(rng, EYE_COLORS, p.eyes),
    eyeShape: pickWeighted(rng, EYE_SHAPES, p.eyeShape),
    noseWidth: around(rng, p.nose[0], p.nose[1]),
    lipVolume: around(rng, p.lips[0], p.lips[1]),
    faceShape: pickWeighted(rng, FACE_SHAPES, FACE_W),
    baldness: rng.next(),
    weightGain: rng.next(),
  };
}
