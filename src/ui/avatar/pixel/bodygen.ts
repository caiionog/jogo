/**
 * Gerador das silhuetas (Etapa 8): proporções por fase × sexo × tipo físico → grade de regiões + âncoras.
 * Usado por `scripts/sprites/gen-bodies.ts`, que grava as grades em `src/content/sprites/body/generated.ts`
 * (arquivo legível e editável; grades feitas à mão em `body/` têm prioridade). Moldura comum de 32×64, pés na
 * linha 62 (a 63 é a sombra no chão).
 */
import type { AnchorName, BodySprite } from '../../../content/sprites/types';
import type { AgeStage, Build } from '../../../engine';

export const FRAME_W = 32;
export const FRAME_H = 64;
const FEET_Y = 62;

export interface BodyParams {
  head: { w: number; h: number };
  neck: number;
  /** Meias-larguras (px) do tronco: ombro, peito, cintura, quadril. */
  shoulder: number;
  chest: number;
  waist: number;
  hip: number;
  /** Linhas: tronco (ombro → cintura), quadril, pernas, pés. */
  torsoRows: number;
  hipRows: number;
  legRows: number;
  feetRows: number;
  /** Braço: largura do braço e do antebraço, linhas do braço, antebraço e mão. */
  armW: number;
  forearmW: number;
  upperArmRows: number;
  forearmRows: number;
  handRows: number;
  legW: number;
  /** Ombro caído (idoso): a primeira linha do ombro fica mais estreita. */
  slope: number;
}

const BASE: Record<AgeStage, BodyParams> = {
  bebe: { head: { w: 12, h: 11 }, neck: 0, shoulder: 4, chest: 4, waist: 4, hip: 4, torsoRows: 5, hipRows: 2, legRows: 4, feetRows: 2, armW: 2, forearmW: 2, upperArmRows: 2, forearmRows: 2, handRows: 1, legW: 3, slope: 1 },
  crianca: { head: { w: 14, h: 13 }, neck: 1, shoulder: 5, chest: 5, waist: 5, hip: 5, torsoRows: 9, hipRows: 3, legRows: 12, feetRows: 2, armW: 3, forearmW: 2, upperArmRows: 5, forearmRows: 3, handRows: 2, legW: 4, slope: 1 },
  adolescente: { head: { w: 14, h: 15 }, neck: 2, shoulder: 7, chest: 6, waist: 5, hip: 5, torsoRows: 13, hipRows: 4, legRows: 18, feetRows: 2, armW: 3, forearmW: 3, upperArmRows: 7, forearmRows: 5, handRows: 3, legW: 5, slope: 1 },
  adulto: { head: { w: 14, h: 16 }, neck: 2, shoulder: 8, chest: 7, waist: 6, hip: 6, torsoRows: 15, hipRows: 5, legRows: 20, feetRows: 2, armW: 4, forearmW: 3, upperArmRows: 8, forearmRows: 6, handRows: 3, legW: 5, slope: 2 },
  idoso: { head: { w: 14, h: 16 }, neck: 1, shoulder: 7, chest: 7, waist: 6, hip: 6, torsoRows: 15, hipRows: 5, legRows: 19, feetRows: 2, armW: 4, forearmW: 3, upperArmRows: 8, forearmRows: 6, handRows: 3, legW: 5, slope: 3 },
};

/** Ajustes por tipo físico (em px) — a diferença precisa aparecer na silhueta. */
const BUILD_DELTA: Record<Build, Partial<Record<'shoulder' | 'chest' | 'waist' | 'hip' | 'armW' | 'forearmW' | 'legW' | 'neckW' | 'cheek', number>>> = {
  magro: { shoulder: -1, chest: -1, waist: -1, hip: -1, armW: -1, forearmW: -1, legW: -1 },
  medio: {},
  atletico: { shoulder: 1, chest: 1, armW: 0, legW: 0 },
  musculoso: { shoulder: 2, chest: 2, waist: 0, armW: 1, forearmW: 1, legW: 1, neckW: 1 },
  acima: { shoulder: 1, chest: 2, waist: 3, hip: 2, armW: 1, forearmW: 1, legW: 1, cheek: 1 },
};

export function bodyParams(stage: AgeStage, sex: 'M' | 'F', build: Build): BodyParams & { neckW: number; cheek: number } {
  const p = { ...BASE[stage], head: { ...BASE[stage].head } };
  // bebê e criança: tipos físicos mais suaves (metade do ajuste)
  const k = stage === 'bebe' ? 0.5 : stage === 'crianca' ? 0.6 : 1;
  const d = BUILD_DELTA[build];
  const adj = (v: number | undefined) => Math.round((v ?? 0) * k);
  p.shoulder += adj(d.shoulder);
  p.chest += adj(d.chest);
  p.waist += adj(d.waist);
  p.hip += adj(d.hip);
  p.armW = Math.max(2, p.armW + adj(d.armW));
  p.forearmW = Math.max(2, p.forearmW + adj(d.forearmW));
  p.legW = Math.max(3, p.legW + adj(d.legW));
  if (sex === 'F' && stage !== 'bebe' && stage !== 'crianca') {
    p.shoulder -= 1;
    p.waist -= 1;
    p.hip += 1;
    p.armW = Math.max(2, p.armW - 1);
  }
  return { ...p, neckW: (stage === 'bebe' ? 2 : stage === 'crianca' ? 2 : 3) + adj(d.neckW), cheek: adj(d.cheek) };
}

/** Gera a silhueta (grade de regiões) e as âncoras. */
export function generateBody(stage: AgeStage, sex: 'M' | 'F', build: Build): BodySprite {
  const p = bodyParams(stage, sex, build);
  const g: string[][] = Array.from({ length: FRAME_H }, () => Array(FRAME_W).fill('.'));
  // x à esquerda do centro para uma meia-largura hw (centro entre as colunas 15 e 16)
  const L = (hw: number) => 16 - hw;
  const R = (hw: number) => 15 + hw;
  const span = (y: number, x0: number, x1: number, c: string, onlyEmpty = false) => {
    if (y < 0 || y >= FRAME_H) return;
    for (let x = Math.max(0, x0); x <= Math.min(FRAME_W - 1, x1); x++) if (!onlyEmpty || g[y]![x] === '.') g[y]![x] = c;
  };
  const total = p.head.h + p.neck + p.torsoRows + p.hipRows + p.legRows + p.feetRows;
  const top = FEET_Y - total + 1;
  // ---- cabeça ----
  const hw = p.head.w / 2;
  const headRows: number[] = [];
  for (let i = 0; i < p.head.h; i++) {
    const t = i / (p.head.h - 1);
    let w = hw;
    if (i === 0) w = hw - 3;
    else if (i === 1) w = hw - 1;
    if (t > 0.72) w = hw - 1 + (p.cheek > 0 && t < 0.9 ? p.cheek : 0);
    if (t > 0.86) w = hw - 2 + (p.cheek > 0 ? p.cheek : 0);
    if (i === p.head.h - 1) w = hw - 3 + (p.cheek > 0 ? 1 : 0);
    headRows.push(w);
    span(top + i, L(w), R(w), 'h');
  }
  const headTop = top;
  const earY = top + Math.round(p.head.h * 0.45);
  for (let y = earY; y < earY + (stage === 'bebe' ? 2 : 3); y++) {
    g[y]![L(hw) - 1] = 'e';
    g[y]![R(hw) + 1] = 'e';
  }
  let y = top + p.head.h;
  // ---- pescoço ----
  for (let i = 0; i < p.neck; i++) span(y++, L(p.neckW), R(p.neckW), 'n');
  // ---- tronco: ombros (caída), peito, afinando até a cintura ----
  const shoulderY = y;
  const torsoTop = y;
  for (let i = 0; i < p.torsoRows; i++) {
    let w: number;
    if (i === 0) w = p.shoulder - p.slope;
    else if (i === 1) w = p.shoulder;
    else {
      const t = (i - 2) / Math.max(1, p.torsoRows - 3);
      w = Math.round(p.chest + (p.waist - p.chest) * Math.max(0, (t - 0.35) / 0.65));
    }
    span(y++, L(w), R(w), 't');
  }
  const waistY = y;
  // ---- quadril ----
  for (let i = 0; i < p.hipRows; i++) span(y++, L(p.hip), R(p.hip), 'c');
  const crotchY = y;
  // ---- braços: do ombro para baixo, encostados no tronco na altura do peito ----
  const armTop = shoulderY + 1;
  // o braço encosta no peito; a linha do ombro cobre o topo do braço e o deltoide arredonda a ponta
  const outer = p.chest;
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? L(outer) - p.armW : R(outer) + 1;
    const delt = side < 0 ? L(p.shoulder) - 1 : R(p.shoulder) + 1;
    if (delt >= x0 && delt <= x0 + p.armW - 1) span(shoulderY + 1, delt, delt, 'a', true);
    let ay = armTop + 1;
    for (let i = 0; i < p.upperArmRows; i++) span(ay++, x0, x0 + p.armW - 1, 'a');
    const fx0 = side < 0 ? x0 : x0 + p.armW - p.forearmW;
    for (let i = 0; i < p.forearmRows; i++) span(ay++, fx0, fx0 + p.forearmW - 1, 'a');
    for (let i = 0; i < p.handRows; i++) {
      const last = i === p.handRows - 1 && p.handRows > 1;
      span(ay++, fx0 + (last ? 1 : 0), fx0 + p.forearmW - 1 - (last && p.forearmW > 2 ? 1 : 0), 'm');
    }
  }
  // ---- pernas ----
  const legTop = y;
  for (let i = 0; i < p.legRows; i++) {
    const thighRows = Math.round(p.legRows * 0.25);
    const gap = i < thighRows ? 0 : stage === 'bebe' ? 1 : 2;
    const half = gap / 2;
    // coxas saem do quadril (mesma largura) e afinam até a largura da perna
    const thigh = Math.max(p.legW, p.hip);
    const lw = i < thighRows ? thigh : i < thighRows + 3 ? Math.max(p.legW, thigh - 1) : p.legW - (i >= p.legRows - 2 ? 1 : 0);
    const lx1 = Math.floor(15.5 - half);
    const rx0 = Math.ceil(15.5 + half);
    span(y, lx1 - lw + 1, lx1, 'l');
    span(y, rx0, rx0 + lw - 1, 'r');
    y++;
  }
  const ankleY = y - 1;
  // ---- pés (apontando um pouco para fora) ----
  for (let i = 0; i < p.feetRows; i++) {
    const out = i === p.feetRows - 1 ? 1 : 0;
    const lw = p.legW - 1;
    const lx1 = Math.floor(15.5 - (stage === 'bebe' ? 0.5 : 1));
    const rx0 = Math.ceil(15.5 + (stage === 'bebe' ? 0.5 : 1));
    span(y, lx1 - lw - out, lx1, 'p');
    span(y, rx0, rx0 + lw + out, 'p');
    y++;
  }
  // ---- âncoras ----
  const eyeDX = Math.max(2, Math.round(p.head.w * 0.22));
  const eyeY = headTop + Math.round(p.head.h * (stage === 'bebe' ? 0.55 : 0.5));
  const armX = (side: number) => (side < 0 ? L(outer) - Math.ceil(p.armW / 2) : R(outer) + Math.ceil(p.armW / 2));
  const legX = (side: number) => (side < 0 ? 15 - Math.floor(p.legW / 2) : 16 + Math.floor(p.legW / 2));
  const anchors: Record<AnchorName, readonly [number, number]> = {
    head: [15, headTop + Math.floor(p.head.h / 2)],
    eyeL: [15 - eyeDX, eyeY],
    eyeR: [16 + eyeDX - 1, eyeY],
    mouth: [15, headTop + Math.round(p.head.h * 0.76)],
    neck: [15, headTop + p.head.h],
    shoulderL: [L(p.shoulder), shoulderY + 1],
    shoulderR: [R(p.shoulder), shoulderY + 1],
    chest: [15, torsoTop + Math.round(p.torsoRows * 0.3)],
    waist: [15, waistY],
    elbowL: [armX(-1), armTop + p.upperArmRows],
    elbowR: [armX(1), armTop + p.upperArmRows],
    wristL: [armX(-1), armTop + p.upperArmRows + p.forearmRows],
    wristR: [armX(1), armTop + p.upperArmRows + p.forearmRows],
    hipL: [legX(-1), crotchY - 1],
    hipR: [legX(1), crotchY - 1],
    kneeL: [legX(-1), legTop + Math.round(p.legRows * 0.48)],
    kneeR: [legX(1), legTop + Math.round(p.legRows * 0.48)],
    ankleL: [legX(-1), ankleY],
    ankleR: [legX(1), ankleY],
  };
  return {
    id: `${stage}_${sex}_${build}`,
    w: FRAME_W,
    h: FRAME_H,
    shape: g.map((r) => r.join('')),
    anchors,
    headBox: [L(hw), headTop, p.head.w, p.head.h],
  };
}
