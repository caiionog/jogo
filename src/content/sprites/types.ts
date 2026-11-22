/**
 * Formato das grades de sprite (Etapa 8). Cada pixel é um caractere: legível e editável num arquivo .ts.
 * Região do corpo: h cabeça · e orelha · n pescoço · t tronco · a braço · m mão · c quadril · l perna esq. ·
 * r perna dir. · p pé · '.' vazio. A sombra é calculada pelo renderizador (luz de cima à esquerda); a grade `shade`
 * opcional sobrescreve: '-' sombra · '=' contorno/sombra forte · '+' luz · '.' automático.
 */
export type Region = 'h' | 'e' | 'n' | 't' | 'a' | 'm' | 'c' | 'l' | 'r' | 'p';

export type AnchorName =
  | 'head' | 'eyeL' | 'eyeR' | 'mouth' | 'neck' | 'shoulderL' | 'shoulderR' | 'chest' | 'waist'
  | 'elbowL' | 'elbowR' | 'wristL' | 'wristR' | 'hipL' | 'hipR' | 'kneeL' | 'kneeR' | 'ankleL' | 'ankleR';

export interface BodySprite {
  id: string;
  w: number;
  h: number;
  shape: readonly string[];
  shade?: readonly string[];
  anchors: Record<AnchorName, readonly [number, number]>;
  /** Caixa da cabeça (para cabelo, rosto e o recorte do busto): x, y, largura, altura. */
  headBox: readonly [number, number, number, number];
}
