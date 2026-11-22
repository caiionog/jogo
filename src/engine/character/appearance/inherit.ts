/**
 * Herança de aparência (Etapa 7): a família manda mais que a região.
 * - Genes contínuos: mistura ponderada aleatória dos pais + ruído pequeno (o tom do filho fica entre os pais ± ruído).
 * - Genes categóricos: de um dos pais, com pequena chance de variação.
 * - Cor ou raça do filho: derivada dos pais e do tom resultante (pais de cores diferentes tendem a ter filhos pardos).
 */
import type { Rng } from '../../core/rng';
import { createRng } from '../../core/rng';
import type { GeoContent, Race, UfDef } from '../../geo/types';
import { RACES } from '../../geo/types';
import { EYE_COLORS, EYE_SHAPES, FACE_SHAPES, HAIR_TYPES } from './genes';
import type { Appearance, AppearanceGenes, FacialHair } from './genes';
import { RACE_PROFILES, genesForRace, pickWeighted } from './sample';

/**
 * RNG próprio para a aparência, separado do sorteio principal: consome sempre UM número do RNG do jogo,
 * não importa quantos a genética use. Assim a cor ou raça e os genes nunca mudam o rumo da vida (regra de não
 * discriminação: o resto da simulação é idêntico para qualquer aparência).
 */
export function lookRng(rng: Rng): Rng {
  return createRng(Math.floor(rng.next() * 4294967296));
}

/** Ruído máximo do tom de pele na herança (para os testes: o filho fica entre os pais ± isto). */
export const SKIN_NOISE = 0.04;
const MUTATION = 0.05;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function mix(rng: Rng, a: number, b: number, noise: number): number {
  const w = 0.25 + rng.next() * 0.5;
  return clamp01(a * w + b * (1 - w) + (rng.next() * 2 - 1) * noise);
}

function fromParents<T>(rng: Rng, a: T, b: T, all: readonly T[]): T {
  if (rng.chance(MUTATION)) return all[rng.int(0, all.length - 1)]!;
  return rng.chance(0.5) ? a : b;
}

const DARK_EYES = new Set(['castanho_escuro', 'castanho']);

export function inheritGenes(rng: Rng, father: AppearanceGenes, mother: AppearanceGenes): AppearanceGenes {
  // olhos escuros tendem a prevalecer
  let eyeColor = fromParents(rng, father.eyeColor, mother.eyeColor, EYE_COLORS);
  if (!DARK_EYES.has(eyeColor) && (DARK_EYES.has(father.eyeColor) || DARK_EYES.has(mother.eyeColor)) && rng.chance(0.4)) {
    eyeColor = DARK_EYES.has(father.eyeColor) ? father.eyeColor : mother.eyeColor;
  }
  const red = father.red && mother.red ? rng.chance(0.8) : father.red || mother.red ? rng.chance(0.25) : rng.chance(0.003);
  return {
    skinTone: mix(rng, father.skinTone, mother.skinTone, SKIN_NOISE),
    undertone: Math.max(-1, Math.min(1, (father.undertone + mother.undertone) / 2 + (rng.next() - 0.5) * 0.2)),
    hairType: fromParents(rng, father.hairType, mother.hairType, HAIR_TYPES),
    hairColor: mix(rng, father.hairColor, mother.hairColor, 0.08),
    red,
    eyeColor,
    eyeShape: fromParents(rng, father.eyeShape, mother.eyeShape, EYE_SHAPES),
    noseWidth: mix(rng, father.noseWidth, mother.noseWidth, 0.06),
    lipVolume: mix(rng, father.lipVolume, mother.lipVolume, 0.06),
    faceShape: fromParents(rng, father.faceShape, mother.faceShape, FACE_SHAPES),
    // calvície: herança mista das duas linhas
    baldness: mix(rng, father.baldness, mother.baldness, 0.15),
    weightGain: mix(rng, father.weightGain, mother.weightGain, 0.12),
    freckles: mix(rng, father.freckles ?? 0, mother.freckles ?? 0, 0.1),
    moles: mix(rng, father.moles ?? 0, mother.moles ?? 0, 0.1),
  };
}

/** Cor ou raça do filho: mesma dos pais quando iguais; pais diferentes tendem a ter filhos pardos. */
export function childRace(rng: Rng, father: Race, mother: Race, genes: AppearanceGenes): Race {
  if (father === mother) return father;
  const pair = new Set([father, mother]);
  if (pair.has('indigena') && rng.chance(0.5)) return 'indigena';
  if (pair.has('amarela') && genes.skinTone < 0.35 && rng.chance(0.5)) return 'amarela';
  if (pair.has('branca') && genes.skinTone < 0.25 && rng.chance(0.5)) return 'branca';
  if (pair.has('preta') && genes.skinTone > 0.7 && rng.chance(0.5)) return 'preta';
  return 'parda';
}

/** Filho de dois pais com aparência conhecida. */
export function inheritAppearance(rng: Rng, father: Appearance, mother: Appearance, sex: 'M' | 'F'): Appearance {
  const genes = inheritGenes(rng, father.genes, mother.genes);
  return { genes, race: childRace(rng, father.race, mother.race, genes), facialHair: randomFacialHair(rng, sex) };
}

/** Barba/bigode dos NPCs (o jogador escolhe a dele). */
export function randomFacialHair(rng: Rng, sex: 'M' | 'F'): FacialHair {
  if (sex === 'F') return 'nenhuma';
  return pickWeighted(rng, ['nenhuma', 'barba', 'bigode', 'cavanhaque'] as const, { nenhuma: 55, barba: 25, bigode: 8, cavanhaque: 12 });
}

/** Aparência de alguém sem família conhecida no jogo: cor ou raça pela UF onde nasceu, genes pela cor. */
export function randomAppearance(rng: Rng, uf: UfDef, sex: 'M' | 'F'): Appearance {
  const race = pickWeighted(rng, RACES, uf.corRaca);
  return { genes: genesForRace(rng, race), race, facialHair: randomFacialHair(rng, sex) };
}

/** Pares de cor ou raça dos pais compatíveis com a cor do filho (pesos). */
const PARENT_PAIRS: Record<Race, [Race, Race, number][]> = {
  branca: [['branca', 'branca', 85], ['branca', 'parda', 12], ['branca', 'amarela', 3]],
  preta: [['preta', 'preta', 80], ['preta', 'parda', 20]],
  parda: [['parda', 'parda', 50], ['branca', 'parda', 14], ['preta', 'parda', 12], ['branca', 'preta', 14], ['indigena', 'parda', 5], ['amarela', 'parda', 5]],
  amarela: [['amarela', 'amarela', 80], ['amarela', 'branca', 20]],
  indigena: [['indigena', 'indigena', 80], ['indigena', 'parda', 20]],
};

/**
 * Pais compatíveis com a aparência de um filho já definido (criação de personagem e migração de saves):
 * genes sorteados pela cor de cada um, com o tom de pele de um acima e o do outro abaixo do filho, e os traços
 * categóricos do filho vindos de um dos pais.
 */
export function parentsFor(rng: Rng, child: Appearance): { father: Appearance; mother: Appearance } {
  const pairs = PARENT_PAIRS[child.race];
  const idx = pickWeighted(rng, pairs.map((_, i) => String(i)), Object.fromEntries(pairs.map((p, i) => [String(i), p[2]])));
  const pair = pairs[Number(idx)]!;
  const [ra, rb] = rng.chance(0.5) ? [pair[0], pair[1]] : [pair[1], pair[0]];
  const father = { genes: genesForRace(rng, ra), race: ra, facialHair: randomFacialHair(rng, 'M') } as Appearance;
  const mother = { genes: genesForRace(rng, rb), race: rb, facialHair: 'nenhuma' } as Appearance;
  // tom: um genitor acima, outro abaixo do filho (o mais escuro pela média da cor)
  const t = child.genes.skinTone;
  const up = 0.02 + rng.next() * 0.12;
  const down = 0.02 + rng.next() * 0.12;
  const fatherDarker = RACE_PROFILES[ra].skin[0] > RACE_PROFILES[rb].skin[0] || (ra === rb && rng.chance(0.5));
  father.genes.skinTone = clamp01(fatherDarker ? t + up : t - down);
  mother.genes.skinTone = clamp01(fatherDarker ? t - down : t + up);
  // traços categóricos do filho vêm de algum dos pais
  for (const k of ['hairType', 'eyeColor', 'eyeShape', 'faceShape'] as const) {
    const target = rng.chance(0.5) ? father.genes : mother.genes;
    (target as unknown as Record<string, unknown>)[k] = child.genes[k];
  }
  // contínuos próximos do filho
  for (const k of ['hairColor', 'noseWidth', 'lipVolume', 'baldness', 'weightGain'] as const) {
    father.genes[k] = clamp01(child.genes[k] + (rng.next() - 0.5) * 0.25);
    mother.genes[k] = clamp01(child.genes[k] + (rng.next() - 0.5) * 0.25);
  }
  father.genes.undertone = Math.max(-1, Math.min(1, child.genes.undertone + (rng.next() - 0.5) * 0.4));
  mother.genes.undertone = Math.max(-1, Math.min(1, child.genes.undertone + (rng.next() - 0.5) * 0.4));
  return { father, mother };
}

/** UF ou, sem ela, a de maior população (fallback). */
export function ufOrDefault(geo: GeoContent, sigla: string | undefined): UfDef {
  return geo.ufs.find((u) => u.sigla === sigla) ?? geo.ufs.reduce((a, b) => (b.populacao > a.populacao ? b : a));
}
