/**
 * Genética da aparência (Etapa 7). Genes fixos ao nascer; a aparência do momento é derivada (`deriveAvatar`).
 * REGRA: cor ou raça e genes são só demografia e aparência — nunca entram em mecânica (atributos, chances,
 * salários, eventos). Só este módulo, a criação/herança de pessoas, o save e a UI os leem (tests/fairness.test.ts).
 */
import type { Race } from '../../geo/types';

export const HAIR_TYPES = ['liso', 'ondulado', 'cacheado', 'crespo'] as const;
export type HairType = (typeof HAIR_TYPES)[number];
export const EYE_COLORS = ['castanho_escuro', 'castanho', 'mel', 'verde', 'azul', 'cinza'] as const;
export type EyeColor = (typeof EYE_COLORS)[number];
export const EYE_SHAPES = ['amendoado', 'redondo', 'alongado', 'palpebra_lisa'] as const;
export type EyeShape = (typeof EYE_SHAPES)[number];
export const FACE_SHAPES = ['oval', 'redondo', 'quadrado', 'coracao', 'longo'] as const;
export type FaceShape = (typeof FACE_SHAPES)[number];
export const FACIAL_HAIR = ['nenhuma', 'barba', 'bigode', 'cavanhaque'] as const;
export type FacialHair = (typeof FACIAL_HAIR)[number];

export interface AppearanceGenes {
  /** Tom de pele contínuo: 0 = mais clara … 1 = mais escura. */
  skinTone: number;
  /** Subtom: −1 frio (rosado) … 0 neutro … 1 quente/oliva (dourado). */
  undertone: number;
  hairType: HairType;
  /** 0 = preto … 1 = loiro claro. */
  hairColor: number;
  red: boolean;
  eyeColor: EyeColor;
  eyeShape: EyeShape;
  /** 0–1. */
  noseWidth: number;
  /** 0–1. */
  lipVolume: number;
  faceShape: FaceShape;
  /** Propensão à calvície (0–1). */
  baldness: number;
  /** Propensão a ganhar peso (0–1). */
  weightGain: number;
}

/** Aparência guardada no personagem e nas pessoas (`Person.appearance`). */
export interface Appearance {
  genes: AppearanceGenes;
  /** Cor ou raça (IBGE) — demografia e aparência apenas. */
  race: Race;
  facialHair: FacialHair;
}

export const HAIR_TYPE_LABEL: Record<HairType, string> = { liso: 'Liso', ondulado: 'Ondulado', cacheado: 'Cacheado', crespo: 'Crespo' };
export const EYE_COLOR_LABEL: Record<EyeColor, string> = { castanho_escuro: 'Castanho-escuro', castanho: 'Castanho', mel: 'Mel', verde: 'Verde', azul: 'Azul', cinza: 'Cinza' };
export const EYE_SHAPE_LABEL: Record<EyeShape, string> = { amendoado: 'Amendoado', redondo: 'Redondo', alongado: 'Alongado', palpebra_lisa: 'Pálpebra lisa' };
export const FACE_SHAPE_LABEL: Record<FaceShape, string> = { oval: 'Oval', redondo: 'Redondo', quadrado: 'Quadrado', coracao: 'Coração', longo: 'Longo' };
export const FACIAL_HAIR_LABEL: Record<FacialHair, string> = { nenhuma: 'Sem barba', barba: 'Barba', bigode: 'Bigode', cavanhaque: 'Cavanhaque' };

// ---------------------------------------------------------------------------
// Cores (paleta ampla e realista; matemática pura, sem DOM)
// ---------------------------------------------------------------------------

type RGB = [number, number, number];
const SKIN_STOPS: [number, RGB][] = [
  [0.0, [247, 226, 213]],
  [0.15, [239, 204, 178]],
  [0.3, [224, 174, 138]],
  [0.45, [204, 145, 104]],
  [0.6, [171, 115, 77]],
  [0.75, [134, 87, 55]],
  [0.88, [96, 60, 37]],
  [1.0, [62, 38, 24]],
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function ramp(stops: [number, RGB][], t: number): RGB {
  const x = Math.max(0, Math.min(1, t));
  for (let i = 1; i < stops.length; i++) {
    const [t1, c1] = stops[i]!;
    const [t0, c0] = stops[i - 1]!;
    if (x <= t1) {
      const k = (x - t0) / (t1 - t0);
      return [lerp(c0[0], c1[0], k), lerp(c0[1], c1[1], k), lerp(c0[2], c1[2], k)];
    }
  }
  return stops[stops.length - 1]![1];
}

export function rgbHex([r, g, b]: RGB): string {
  const h = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Cor da pele a partir do tom e do subtom (frio → mais rosado; quente/oliva → mais dourado). */
export function skinRgb(tone: number, undertone: number): RGB {
  const [r, g, b] = ramp(SKIN_STOPS, tone);
  const u = Math.max(-1, Math.min(1, undertone)) * (1 - tone * 0.5);
  return [r + (u < 0 ? -u * 6 : u * 2), g + u * 7, b + (u < 0 ? -u * 9 : -u * 10)];
}

const HAIR_STOPS: [number, RGB][] = [
  [0.0, [24, 20, 18]],
  [0.25, [52, 36, 26]],
  [0.5, [96, 66, 42]],
  [0.75, [166, 128, 82]],
  [1.0, [222, 196, 140]],
];

/** Cor do cabelo (com ruivo e grisalho de 0 a 1). */
export function hairRgb(hairColor: number, red: boolean, grey = 0): RGB {
  let c = ramp(HAIR_STOPS, hairColor);
  if (red) c = [lerp(150, 200, hairColor), lerp(62, 104, hairColor), lerp(30, 56, hairColor)];
  const g: RGB = [196, 196, 200];
  return [lerp(c[0], g[0], grey), lerp(c[1], g[1], grey), lerp(c[2], g[2], grey)];
}

export const EYE_RGB: Record<EyeColor, RGB> = {
  castanho_escuro: [52, 32, 22],
  castanho: [94, 60, 34],
  mel: [150, 104, 46],
  verde: [86, 120, 74],
  azul: [80, 118, 168],
  cinza: [120, 132, 140],
};
