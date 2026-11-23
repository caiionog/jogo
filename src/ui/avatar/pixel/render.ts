/**
 * Renderizador do avatar em pixel art (Etapa 8). Entrada: o `AvatarDescriptor` da engine; saída: buffer RGBA 32×64
 * (testável no Node; o canvas só exibe). Ordem das camadas: sombra no chão → cabelo de trás → corpo → calçado →
 * parte de baixo → inteira → parte de cima → agasalho → mãos → rosto → barba → cabelo da frente → acessórios →
 * marcas → rugas. Luz sempre de cima à esquerda; contorno seletivo (tom escuro da própria cor, nunca preto puro).
 */
import { bodySprite } from '../../../content/sprites/body';
import { CLOTHING_RULES, LAYER_ORDER } from '../../../content/sprites/clothes';
import type { AnchorY, ClothingRule } from '../../../content/sprites/clothes';
import type { BodySprite, Region } from '../../../content/sprites/types';
import type { AvatarDescriptor, OutfitPiece } from '../../../engine';
import { hexToRgb, makeRamp, rgbToHex } from './color';
import type { Ramp, Rgb } from './color';

export interface PixelImage {
  w: number;
  h: number;
  data: Uint8ClampedArray;
}

export interface RenderOptions {
  /** Quadro da respiração (0 ou 1): o tronco e a cabeça descem 1 px no quadro 1. */
  frame?: 0 | 1;
  /** Olhos fechados (piscar). */
  blink?: boolean;
  /** Testes: recebe o material de cada pixel do corpo/roupa/cabelo (antes do rosto e acessórios). */
  inspect?: (material: string, x: number, y: number) => void;
}

type Tone = 0 | 1 | 2 | 3;
const W = 32;
const H = 64;
const SCLERA: Rgb = [236, 232, 224];

/** Hash estável por pixel (texturas de cabelo, grisalho, sardas) — sem aleatoriedade. */
function h01(x: number, y: number, k = 0): number {
  let v = (x * 374761393 + y * 668265263 + k * 2246822519) | 0;
  v = Math.imul(v ^ (v >>> 13), 1274126177);
  return ((v ^ (v >>> 16)) >>> 0) / 4294967296;
}

function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex([0, 1, 2].map((i) => Math.round(A[i]! + (B[i]! - A[i]!) * t)) as Rgb);
}

class Canvas {
  mat: (string | null)[] = new Array(W * H).fill(null);
  region: (Region | null)[] = new Array(W * H).fill(null);
  tone: Tone[] = new Array(W * H).fill(2);
  fixed: boolean[] = new Array(W * H).fill(false);
  ramps = new Map<string, Ramp>();
  idx = (x: number, y: number) => y * W + x;
  inside = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H;
  m = (x: number, y: number) => (this.inside(x, y) ? this.mat[this.idx(x, y)] : null);
  r = (x: number, y: number) => (this.inside(x, y) ? this.region[this.idx(x, y)] : null);
  set(x: number, y: number, mat: string, region?: Region, tone?: Tone) {
    if (!this.inside(x, y)) return;
    const i = this.idx(x, y);
    this.mat[i] = mat;
    if (region) this.region[i] = region;
    if (tone !== undefined) {
      this.tone[i] = tone;
      this.fixed[i] = true;
    }
  }
  ramp(id: string, hex: string, opts?: Parameters<typeof makeRamp>[1]) {
    if (!this.ramps.has(id)) this.ramps.set(id, makeRamp(hex, opts));
  }
}

const ay = (b: BodySprite, a: AnchorY | undefined, fallback: number) => (a ? b.anchors[a.a][1] + (a.dy ?? 0) : fallback);

// ---------------------------------------------------------------------------
// roupas
// ---------------------------------------------------------------------------

function applyClothing(cv: Canvas, b: BodySprite, layer: string, p: OutfitPiece, rule: ClothingRule) {
  const id = `roupa_${layer}`;
  const shiny = rule.details?.includes('brilho');
  cv.ramp(id, p.color, shiny ? { lightShift: 14 } : undefined);
  const covered: [number, number][] = [];
  for (const c of rule.cover) {
    const y0 = ay(b, c.from, 0);
    const y1 = ay(b, c.to, H - 1);
    for (let y = y0; y <= y1; y++) for (let x = 0; x < W; x++) {
      const r = cv.r(x, y);
      if (r && c.regions.includes(r) && r !== 'm') {
        // "aberto": o agasalho não cobre as 2 colunas do meio do tronco
        if (rule.details?.includes('aberto') && (r === 't' || r === 'c') && (x === 15 || x === 16)) continue;
        cv.set(x, y, id);
        covered.push([x, y]);
      }
    }
  }
  if (!covered.length && !rule.details?.length) return;
  const A = b.anchors;
  const shoulderY = A.shoulderL[1];
  const waistY = A.waist[1];
  const det = new Set(rule.details ?? []);
  const own = (x: number, y: number) => cv.m(x, y) === id;
  // padrões
  if (p.pattern !== 'liso') {
    for (const [x, y] of covered) {
      const i = cv.idx(x, y);
      if (p.pattern === 'listrado' && (y - shoulderY) % 3 === 0) { cv.tone[i] = 3; cv.fixed[i] = true; }
      if (p.pattern === 'xadrez' && ((x >> 1) + (y >> 1)) % 2 === 0) { cv.tone[i] = 1; cv.fixed[i] = true; }
    }
    if (p.pattern === 'estampa') {
      const cy = A.chest[1] + 1;
      for (const [dx, dy, t] of [[0, 0, 3], [1, 0, 0], [0, 1, 0], [1, 1, 3], [-1, 1, 3], [2, 1, 3]] as const) if (own(15 + dx, cy + dy)) cv.set(15 + dx, cy + dy, id, undefined, t);
    }
  }
  const topY = covered.reduce((m, [, y]) => Math.min(m, y), H);
  if (det.has('gola')) for (let x = 13; x <= 18; x++) if (own(x, topY)) cv.set(x, topY, id, undefined, 1);
  if (det.has('decote')) for (let k = 0; k < 3; k++) for (let x = 15 - (2 - k); x <= 16 + (2 - k); x++) if (own(x, topY + k)) cv.set(x, topY + k, 'skin', undefined, k === 2 ? 1 : 2);
  if (det.has('alcas')) for (let y = topY; y <= topY + 1; y++) for (let x = 0; x < W; x++) if (own(x, y) && cv.r(x, y) === 't' && !(Math.abs(x - 12) <= 0 || Math.abs(x - 19) <= 0)) cv.set(x, y, 'skin');
  if (det.has('botoes')) for (let y = topY + 2; y < waistY; y += 3) if (own(15, y)) cv.set(15, y, id, undefined, 3);
  if (det.has('ziper')) for (let y = topY + 1; y < waistY + 2; y++) { if (own(14, y)) cv.set(14, y, id, undefined, 0); if (own(17, y)) cv.set(17, y, id, undefined, 0); }
  if (det.has('bolso')) for (const [dx, dy] of [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1]] as const) if (own(17 + dx, waistY - 4 + dy)) cv.set(17 + dx, waistY - 4 + dy, id, undefined, 1);
  if (det.has('emblema') && own(18, A.chest[1])) { cv.set(18, A.chest[1], 'emblema', undefined, 2); cv.ramp('emblema', '#2f5fb3'); }
  if (det.has('cordao')) for (const x of [14, 17]) for (let k = 0; k < 2; k++) if (own(x, (det.has('capuz') ? topY + 1 : waistY) + k)) cv.set(x, (det.has('capuz') ? topY + 1 : waistY) + k, id, undefined, 3);
  if (det.has('capuz')) for (let x = 11; x <= 20; x++) { const y = topY - 1; if (cv.inside(x, y) && !cv.m(x, y)) cv.set(x, y, id, 't', x === 11 || x === 20 ? 0 : 1); }
  if (det.has('cos')) for (const [x, y] of covered) if (y === topY && cv.r(x, y) === 'c') cv.set(x, y, id, undefined, 1);
  if (det.has('vinco')) for (const [x, y] of covered) if (y > A.hipL[1] && (x === A.kneeL[0] || x === A.kneeR[0])) cv.set(x, y, id, undefined, 1);
  if (det.has('barra') || det.has('manga')) {
    const bottom = new Map<number, number>();
    for (const [x, y] of covered) if (cv.r(x, y) !== 'a' || det.has('manga')) bottom.set(x, Math.max(bottom.get(x) ?? 0, y));
    for (const [x, y] of bottom) if (y > topY + 1 && own(x, y) && cv.m(x, y + 1) !== id) cv.set(x, y, id, undefined, 1);
  }
  if (det.has('lapela')) for (let k = 0; k < 6; k++) { const y = topY + k; for (const x of [14 - Math.floor(k / 2), 17 + Math.floor(k / 2)]) if (own(x, y)) cv.set(x, y, id, undefined, det.has('aberto') ? 0 : 3); }
  if (det.has('gravata')) { cv.ramp('gravata', '#8e2430'); for (let y = topY + 1; y < waistY - 2; y++) for (const x of [15, 16]) if (!own(x, y) && cv.r(x, y) === 't') cv.set(x, y, 'gravata', undefined, x === 16 ? 1 : 2); }
  if (det.has('saia')) {
    // preenche o vão entre as pernas na altura coberta
    for (let y = A.hipL[1]; y < H; y++) {
      const row: number[] = [];
      for (let x = 0; x < W; x++) if (own(x, y)) row.push(x);
      if (row.length < 2) continue;
      const a = Math.min(...row);
      const z = Math.max(...row);
      for (let x = a; x <= z; x++) if (!cv.m(x, y) || cv.r(x, y) === 'l' || cv.r(x, y) === 'r') cv.set(x, y, id, cv.r(x, y) ?? 'c');
    }
  }
  if (det.has('sola')) for (const [x, y] of covered) if (cv.r(x, y) === 'p' && cv.r(x, y + 1) !== 'p') { cv.ramp('sola', '#ece6da'); cv.set(x, y, 'sola', undefined, 2); }
  if (det.has('tira')) for (const x of [A.ankleL[0], A.ankleR[0]]) { const y = A.ankleL[1] + 1; if (cv.r(x, y) === 'p') cv.set(x, y, id, undefined, 2); }
}

function drawBelt(cv: Canvas, b: BodySprite, color: string, accent?: string) {
  cv.ramp('faixa', color, { satCap: 0.6 });
  // faixa infantil de duas cores: a linha de baixo leva a listra (branca ou preta)
  if (accent) cv.ramp('faixa_listra', accent, { satCap: 0.6 });
  const y0 = b.anchors.waist[1] - 1;
  // faixa infantil de duas cores: 3 linhas (cor / listra / cor) para a listra não sumir no kimono branco
  const top = accent ? y0 - 1 : y0;
  for (let y = top; y <= y0 + 1; y++) for (let x = 0; x < W; x++) if (cv.r(x, y) === 't' || cv.r(x, y) === 'c') cv.set(x, y, accent && y === y0 ? 'faixa_listra' : 'faixa', undefined, y === top ? 2 : 1);
  // nó e pontas
  for (const [x, y] of [[13, y0 + 2], [13, y0 + 3], [12, y0 + 3]] as const) if (cv.inside(x, y)) cv.set(x, y, 'faixa', 'c', 1);
}

/** Prajied: uma braçadeira de 2 px no alto de cada braço (cor da graduação) com a ponta pendurada no braço da frente. */
function drawPrajied(cv: Canvas, b: BodySprite, color: string, tip?: string) {
  cv.ramp('prajied', color, { satCap: 0.75 });
  cv.ramp('prajied_ponta', tip ?? color, { satCap: 0.75 });
  for (const [sh, el] of [[b.anchors.shoulderL, b.anchors.elbowL], [b.anchors.shoulderR, b.anchors.elbowR]] as const) {
    const y0 = Math.round(sh[1] + (el[1] - sh[1]) * 0.35);
    for (let y = y0; y <= y0 + 1; y++) for (let x = 0; x < W; x++) if (cv.r(x, y) === 'a') cv.set(x, y, 'prajied', undefined, y === y0 ? 2 : 1);
  }
  const [ex, ey] = b.anchors.shoulderL;
  const ty = Math.round(ey + (b.anchors.elbowL[1] - ey) * 0.35) + 2;
  for (const [x, y] of [[ex - 1, ty], [ex - 1, ty + 1]] as const) if (cv.inside(x, y)) cv.set(x, y, 'prajied_ponta', 'a', 1);
}

// ---------------------------------------------------------------------------
// cabelo
// ---------------------------------------------------------------------------

type HairCell = 'f' | 'b';

function hairMask(d: AvatarDescriptor, b: BodySprite): Map<number, HairCell> {
  const [hx, hy, hw, hh] = b.headBox;
  const out = new Map<number, HairCell>();
  const put = (x: number, y: number, c: HairCell) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    if (c === 'b' && out.get(y * W + x) === 'f') return;
    out.set(y * W + x, c);
  };
  const style = d.stage === 'bebe' ? (d.hair.style === 'careca' ? 'careca' : 'bebe') : d.hair.style;
  const hairline = hy + Math.round(hh * 0.25);
  const L = hx - 1;
  const R = hx + hw;
  const capRows = (thin: boolean, fringe: boolean) => {
    for (let y = hy - (thin ? 0 : 1); y <= hairline; y++) {
      const k = y - hy;
      const inset = k <= -1 ? 4 : k === 0 ? (thin ? 2 : 1) : 0;
      for (let x = L + inset; x <= R - inset; x++) put(x, y, 'f');
    }
    // franja irregular e costeletas
    if (fringe) for (let x = hx + 1; x < hx + hw - 1; x++) if (h01(x, hairline, 3) < 0.35) put(x, hairline + 1, 'f');
    for (let y = hairline + 1; y <= hairline + 2; y++) { put(L, y, 'f'); put(R, y, 'f'); }
    put(L + 1, hairline + 1, 'f');
    put(R - 1, hairline + 1, 'f');
  };
  // laterais afinando para baixo, com pontas irregulares (fios), nunca uma barra reta
  const sides = (toY: number, layer: HairCell, width = 1) => {
    for (let y = hairline; y <= toY; y++) {
      const left = toY - y;
      for (let k = 0; k < width; k++) {
        // a coluna de fora termina antes (afina); as pontas variam por coluna
        const end = k > 0 ? 2 + Math.round(h01(k, toY, 7) * 2) : Math.round(h01(L, toY, 5) * 1.5);
        if (left < end) continue;
        put(L - k, y, layer);
        put(R + k, y, layer);
      }
    }
  };
  // volume de trás arredondado: cantos de cima recolhidos e ponta de baixo em "V" suave
  const back = (toY: number, extra = 1) => {
    for (let y = hy; y <= toY; y++) {
      const top = y - hy;
      const left = toY - y;
      const inset = top === 0 ? extra + 2 : top === 1 ? extra : 0;
      const tail = left === 0 ? 2 : left === 1 ? 1 : 0;
      for (let x = L - extra + inset + tail; x <= R + extra - inset - tail; x++) put(x, y, 'b');
    }
  };
  switch (style) {
    case 'careca':
      break;
    case 'bebe':
      for (let x = hx + 3; x < hx + hw - 3; x++) put(x, hy - 1 + (h01(x, 1) < 0.5 ? 1 : 0), 'f');
      for (let x = hx + 1; x < hx + hw - 1; x++) put(x, hy, 'f');
      break;
    case 'raspado':
      capRows(true, false);
      break;
    case 'curto':
      capRows(false, true);
      break;
    case 'franja':
      capRows(false, false);
      // franja de lado (diagonal), não "cuia": cobre a testa de um lado e sobe do outro
      for (let y = hairline + 1; y <= b.anchors.eyeL[1] - 3; y++) {
        const k = y - hairline;
        for (let x = hx; x < hx + hw - 1 - k * 2; x++) put(x, y, 'f');
      }
      sides(hy + Math.round(hh * 0.55), 'f');
      back(hy + Math.round(hh * 0.7));
      break;
    case 'medio':
      capRows(false, true);
      sides(hy + Math.round(hh * 0.75), 'f');
      back(hy + Math.round(hh * 0.85));
      break;
    case 'longo':
      capRows(false, false);
      sides(hy + hh + 5, 'f', 2);
      back(hy + hh + 7, 2);
      break;
    case 'black_power': {
      const cx = 15.5;
      const cy = hy + hh * 0.28;
      const rx = hw / 2 + 3.2;
      const ry = hh / 2 + 1.5;
      for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const e = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
        if (e > 1 || (e > 0.86 && h01(x, y, 9) < 0.45)) continue;
        put(x, y, y <= hairline || x < hx || x >= hx + hw ? 'f' : 'b');
      }
      break;
    }
    case 'trancas':
      capRows(true, false);
      for (let y = hairline; y <= hy + hh + 6; y++) for (const x of [L - 1, L, R, R + 1]) put(x, y, (x === L - 1 || x === R + 1) ? 'b' : 'f');
      back(hy + hh + 6, 1);
      break;
    case 'dreads':
      capRows(false, false);
      for (let y = hairline; y <= hy + hh + 5; y++) for (const x of [L - 1, L, R, R + 1]) if ((x + (y >> 1)) % 3 !== 0) put(x, y, 'f');
      back(hy + hh + 6, 2);
      break;
    case 'coque':
      capRows(true, false);
      for (let y = hy - 4; y <= hy - 1; y++) for (let x = 13; x <= 18; x++) if (!((y === hy - 4 || y === hy - 1) && (x === 13 || x === 18))) put(x, y, 'f');
      break;
    case 'rabo':
      capRows(true, false);
      for (let y = hy + 2; y <= hy + hh + 4; y++) for (let k = 0; k < 2; k++) put(R + 1 + k - (y > hy + hh ? 1 : 0), y, 'b');
      for (let y = hy + 1; y <= hy + 3; y++) put(R + 1, y, 'f');
      break;
    case 'moicano':
      capRows(true, false);
      for (let y = hy - 3; y <= hairline; y++) for (let x = 14; x <= 17; x++) put(x, y, 'f');
      break;
  }
  // calvície: abre o topo (coroa) e as entradas; muito careca fica só a "ferradura"
  const bald = d.hair.baldness;
  if (bald > 0.15 && style !== 'careca') {
    const rows = Math.round(bald * (hairline - hy + 3));
    const half = Math.round(bald * hw * 0.55);
    for (const k of [...out.keys()]) {
      const x = k % W;
      const y = Math.floor(k / W);
      if (out.get(k) !== 'f') continue;
      if (y < hy + rows - 1 && Math.abs(x - 15.5) < half + 1) out.delete(k);
      else if (bald > 0.5 && y <= hairline + 1 && y >= hairline - 1 && Math.abs(x - 15.5) < hw / 2 - 1) out.delete(k);
    }
  }
  return out;
}

function hairTone(d: AvatarDescriptor, x: number, y: number, cv: Canvas): Tone {
  const above = cv.m(x, y - 1) === 'cabelo';
  const below = cv.m(x, y + 1) === 'cabelo';
  const left = cv.m(x - 1, y) === 'cabelo';
  const right = cv.m(x + 1, y) === 'cabelo';
  // borda de baixo e borda direita na sombra (luz de cima à esquerda)
  if (!below || !right) return 1;
  // brilho: faixa logo abaixo do topo, do lado esquerdo
  if (!above) return x < 18 ? 3 : 2;
  if (!cv.m(x, y - 2) || cv.m(x, y - 2) !== 'cabelo') if (x < 16 && left) return 3;
  const t = d.hair.type;
  // textura pelo tipo, discreta: fios verticais (liso), ondas (ondulado), cachos em blocos (cacheado), pontos (crespo)
  if (t === 'liso') return x > 18 ? 1 : (x % 4 === 1 && y % 3 !== 0 ? 1 : 2);
  if (t === 'ondulado') return (x + (y % 4 < 2 ? 0 : 2)) % 4 === 0 ? 1 : (x + (y % 4 < 2 ? 2 : 0)) % 4 === 0 && x < 17 ? 3 : 2;
  if (t === 'cacheado') return ((x >> 1) + (y >> 1)) % 2 === 0 ? (x < 16 && h01(x, y, 2) < 0.4 ? 3 : 2) : 1;
  return h01(x, y, 4) < 0.25 ? 1 : x < 15 && h01(x, y, 6) < 0.2 ? 3 : 2;
}

// ---------------------------------------------------------------------------
// render
// ---------------------------------------------------------------------------

export function renderAvatar(d: AvatarDescriptor, opts: RenderOptions = {}): PixelImage {
  const b = bodySprite(d.stage, d.sex, d.build);
  const cv = new Canvas();
  const A = b.anchors;
  const [hx, hy, hw, hh] = b.headBox;
  // 1) corpo (pele), com o formato do rosto
  for (let y = 0; y < H; y++) {
    const row = b.shape[y] ?? '';
    for (let x = 0; x < W; x++) {
      const c = row[x];
      if (c && c !== '.') cv.set(x, y, 'pele', c as Region);
    }
  }
  const jaw = hy + hh - 1;
  if (d.faceShape === 'quadrado') for (const y of [jaw - 1, jaw]) { const xs = [...Array(W).keys()].filter((x) => cv.r(x, y) === 'h'); if (xs.length) { cv.set(Math.min(...xs) - 1, y, 'pele', 'h'); cv.set(Math.max(...xs) + 1, y, 'pele', 'h'); } }
  if (d.faceShape === 'coracao') { const xs = [...Array(W).keys()].filter((x) => cv.r(x, jaw) === 'h'); if (xs.length > 4) { cv.mat[cv.idx(Math.min(...xs), jaw)] = null; cv.region[cv.idx(Math.min(...xs), jaw)] = null; cv.mat[cv.idx(Math.max(...xs), jaw)] = null; cv.region[cv.idx(Math.max(...xs), jaw)] = null; } }
  if (d.faceShape === 'redondo') for (const y of [hy + Math.round(hh * 0.62), hy + Math.round(hh * 0.7)]) { const xs = [...Array(W).keys()].filter((x) => cv.r(x, y) === 'h'); if (xs.length) { cv.set(Math.min(...xs) - 1, y, 'pele', 'h'); cv.set(Math.max(...xs) + 1, y, 'pele', 'h'); } }
  cv.ramp('pele', d.skin, { shadowShift: 9, lightShift: 7, satCap: 0.5 });

  // 2) cabelo de trás (só onde não há corpo)
  const hair = d.hair.style === 'careca' ? new Map<number, HairCell>() : hairMask(d, b);
  const hairHex = d.hair.color;
  const stubble = d.hair.style === 'raspado' || d.hair.style === 'moicano';
  cv.ramp('cabelo', hairHex, { shadowShift: 16, lightShift: 12 });
  cv.ramp('cabelo_raspado', mix(hairHex, d.skin, 0.45), { shadowShift: 10 });
  cv.ramp('grisalho', mix('#d9d6d0', hairHex, 0.15), { shadowShift: 10 });
  for (const [k, c] of hair) if (c === 'b' && !cv.mat[k]) { cv.mat[k] = 'cabelo'; cv.region[k] = 'h'; }

  // 3) roupas por camada
  const o = d.outfit;
  for (const layer of LAYER_ORDER) {
    const p = o[layer];
    if (!p) continue;
    const rule = CLOTHING_RULES[p.id];
    if (rule) applyClothing(cv, b, layer, p, rule);
  }

  // 4) cabelo da frente (por cima da pele e da gola)
  for (const [k, c] of hair) {
    if (c !== 'f') continue;
    const x = k % W;
    const y = Math.floor(k / W);
    const onFaceBelowHairline = cv.r(x, y) === 'h' && y > hy + Math.round(hh * 0.25) + 2 && x > hx && x < hx + hw - 1 && d.hair.style !== 'franja';
    if (onFaceBelowHairline) continue;
    const moicanoSide = d.hair.style === 'moicano' && (x < 14 || x > 17);
    cv.mat[k] = stubble && (d.hair.style === 'raspado' || moicanoSide) ? 'cabelo_raspado' : 'cabelo';
    if (!cv.region[k]) cv.region[k] = 'h';
  }
  // grisalho: pixels brancos progressivos e estáveis
  if (d.hair.grey > 0) for (let i = 0; i < W * H; i++) if (cv.mat[i] === 'cabelo' && h01(i % W, Math.floor(i / W), 7) < d.hair.grey) cv.mat[i] = 'grisalho';

  // ---- sombreamento automático (luz de cima à esquerda) ----
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const me = cv.m(x, y);
    if (!me || cv.fixed[cv.idx(x, y)]) continue;
    const r = cv.r(x, y)!;
    if (me === 'cabelo' || me === 'grisalho' || me === 'cabelo_raspado') {
      cv.tone[cv.idx(x, y)] = hairTone(d, x, y, { ...cv, m: (a: number, c: number) => (['cabelo', 'grisalho', 'cabelo_raspado'].includes(cv.m(a, c) ?? '') ? 'cabelo' : cv.m(a, c)) } as Canvas);
      continue;
    }
    let xl = x;
    let xr = x;
    while (cv.m(xl - 1, y) === me && cv.r(xl - 1, y) === r) xl--;
    while (cv.m(xr + 1, y) === me && cv.r(xr + 1, y) === r) xr++;
    const width = xr - xl + 1;
    let t: Tone = 2;
    if (x === xr || (width >= 8 && x === xr - 1)) t = 1;
    if (width >= 4 && x === xl + 1 && t === 2) t = r !== 'h' || (y - hy >= 4 && y - hy <= 9) ? 3 : 2;
    if (r === 'm' && t === 2) t = 3;
    if ((r === 'a' || r === 'm') && (cv.r(x + 1, y) === 't' || cv.r(x - 1, y) === 't')) t = 1;
    if (r === 'r' && cv.r(x - 1, y) === 'l') t = 1;
    const up = cv.m(x, y - 1);
    if (up && up !== me && t > 1 && !(up === 'pele' && me.startsWith('roupa'))) t = 1;
    if (r === 'n' && cv.r(x, y - 1) === 'h') t = 1;
    // dobras das roupas: axila, cintura, joelho, cotovelo
    if (me.startsWith('roupa')) {
      if (r === 't' && (cv.r(x - 1, y) === 'a' || cv.r(x + 1, y) === 'a') && y >= A.shoulderL[1] + 1 && y <= A.shoulderL[1] + 3) t = 1;
      if ((r === 'l' || r === 'r') && y === A.kneeL[1] && (x === A.kneeL[0] || x === A.kneeR[0])) t = 1;
      if (r === 'a' && y === A.elbowL[1] && h01(x, y) < 0.5) t = 1;
      if (y === A.waist[1] - 1 && r === 't' && (x === 12 || x === 19)) t = 1;
    }
    cv.tone[cv.idx(x, y)] = t;
  }

  if (opts.inspect) for (let i = 0; i < W * H; i++) if (cv.mat[i]) opts.inspect(cv.mat[i]!, i % W, Math.floor(i / W));

  // ---- contorno seletivo ----
  const out = new Uint8ClampedArray(W * H * 4);
  const paint = (x: number, y: number, c: Rgb, a = 255) => {
    if (!cv.inside(x, y)) return;
    const i = (y * W + x) * 4;
    out[i] = c[0];
    out[i + 1] = c[1];
    out[i + 2] = c[2];
    out[i + 3] = a;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const me = cv.m(x, y);
    if (!me) continue;
    const i = cv.idx(x, y);
    let t = cv.tone[i]!;
    const edge = !cv.m(x - 1, y) || !cv.m(x + 1, y) || !cv.m(x, y - 1) || !cv.m(x, y + 1);
    if (edge && !cv.fixed[i]) {
      const lit = (!cv.m(x - 1, y) || !cv.m(x, y - 1)) && cv.m(x + 1, y) && cv.m(x, y + 1);
      t = lit ? 1 : 0;
    }
    const ramp = cv.ramps.get(me) ?? cv.ramps.get('pele')!;
    paint(x, y, ramp[t]);
  }

  // ---- rosto ----
  const skin = cv.ramps.get('pele')!;
  const hairR = cv.ramps.get(d.hair.grey > 0.6 ? 'grisalho' : 'cabelo')!;
  const lash = makeRamp(mix(hairHex, '#2a1d16', 0.5))[0];
  const eye = makeRamp(d.eyes.color);
  const [elx, ely] = A.eyeL;
  const [erx] = A.eyeR;
  const baby = d.stage === 'bebe';
  const shape = d.eyes.shape;
  const tired = d.expression === 'cansado';
  for (const [x, inner] of [[elx, 1], [erx, -1]] as const) {
    const y = ely;
    const ix = inner > 0 ? x + 1 : x;
    const sx = inner > 0 ? x : x + 1;
    if (opts.blink) {
      paint(x, y, lash);
      paint(x + 1, y, lash);
      continue;
    }
    // pálpebra (cílios) acima; monolid e cansado cobrem mais
    paint(x, y - 1, lash);
    paint(x + 1, y - 1, lash);
    if (shape === 'alongado' || shape === 'palpebra_lisa') paint(inner > 0 ? x - 1 : x + 2, y - 1, lash);
    // cílios marcados no canto de fora (mulheres, da adolescência em diante): sinal de sexo legível em 2×
    if (d.sex === 'F' && !baby && d.stage !== 'crianca') paint(inner > 0 ? x - 1 : x + 2, y - 2, lash);
    paint(sx, y, tired || shape === 'palpebra_lisa' ? skin[1] : SCLERA);
    paint(ix, y, baby ? eye[0] : eye[1]);
    if (shape === 'alongado' && !tired) paint(inner > 0 ? x - 1 : x + 2, y, skin[1]);
    if (shape === 'redondo' && !baby) paint(ix, y + 1, skin[1]);
    if (tired) paint(ix, y + 1, skin[1]);
    // olho roxo (esquerdo)
    if (d.marks.blackEye && inner > 0) {
      const bruise = makeRamp(mix(d.skin, '#5a2a5e', 0.55));
      for (const [bx, by] of [[x - 1, y - 1], [x - 1, y], [x - 1, y + 1], [x, y + 1], [x + 1, y + 1], [x + 2, y + 1]] as const) paint(bx, by, bruise[1]);
    }
  }
  // sobrancelhas (expressão)
  if (!baby) {
    const by = ely - 3 + (hh <= 13 ? 1 : 0);
    const browC = hairR[0];
    const slope = d.expression === 'bravo' || d.expression === 'machucado' ? 1 : d.expression === 'triste' ? -1 : 0;
    for (const [x0, dir] of [[elx - 1, 1], [erx - 1, -1]] as const) {
      for (let k = 0; k < 3; k++) {
        const x = x0 + k;
        // canto de dentro do olho esquerdo = k=2; do direito = k=0
        const innerK = dir > 0 ? 2 : 0;
        const dy = slope === 0 ? 0 : k === innerK ? slope : 0;
        paint(x, by + dy, browC);
        // homens: sobrancelha mais grossa no meio
        if (d.sex === 'M' && d.stage !== 'crianca' && k === 1) paint(x, by + dy + 1, browC);
      }
    }
  }
  // nariz pela largura (3 larguras); nariz torto desloca a sombra
  const [mx, my] = A.mouth;
  const nb = d.marks.brokenNose ? -1 : 0;
  const nw = d.noseWidth < 0.34 ? 1 : d.noseWidth < 0.67 ? 2 : 3;
  if (!baby) {
    paint(mx + 1 + nb, my - 3, skin[1]);
    if (nw >= 2) paint(mx + nb, my - 2, skin[1]);
    paint(mx + 1 + nb, my - 2, skin[0]);
    if (nw >= 3) { paint(mx - 1 + nb, my - 2, skin[1]); paint(mx + 2 + nb, my - 2, skin[1]); }
  } else paint(mx + 1, my - 2, skin[1]);
  // boca: expressão e volume dos lábios
  // lábios: rosados nas mulheres; discretos (tom da pele mais escuro) nos homens e nas crianças
  const grownF = d.sex === 'F' && !baby && d.stage !== 'crianca';
  const lipHex = grownF ? mix(d.skin, '#b3404f', 0.4) : mix(d.skin, '#7d3b3b', d.stage === 'crianca' || baby ? 0.22 : 0.2);
  const lip = makeRamp(lipHex, { satCap: grownF ? 0.55 : 0.35 });
  const lw = baby ? 2 : d.sex === 'M' ? 3 : d.lipVolume < 0.34 ? 3 : 4;
  const lx0 = mx - (lw === 4 ? 1 : lw === 3 ? 0 : 0);
  const ex = d.expression;
  const curve = (k: number) => (ex === 'feliz' ? (k === 0 || k === lw - 1 ? -1 : 0) : ex === 'triste' ? (k === 0 || k === lw - 1 ? 1 : 0) : ex === 'machucado' ? (k === lw - 1 ? 1 : 0) : 0);
  for (let k = 0; k < lw; k++) paint(lx0 + k, my + curve(k), ex === 'bravo' ? lip[0] : lip[1]);
  if (d.lipVolume >= 0.34 && !baby && (grownF || d.lipVolume >= 0.67)) for (let k = 1; k < lw - 1; k++) paint(lx0 + k, my + 1, lip[2]);
  // homem adulto sem barba: maxilar marcado (sombra nos cantos de baixo do rosto)
  if (d.sex === 'M' && (d.stage === 'adulto' || d.stage === 'idoso') && d.facialHair === 'nenhuma') {
    const [hx0, hy0, hw0, hh0] = b.headBox;
    const jawY = hy0 + hh0 - 1;
    for (const jx of [hx0, hx0 + 1, hx0 + hw0 - 2, hx0 + hw0 - 1]) if (cv.m(jx, jawY) === 'pele') paint(jx, jawY, skin[1]);
  }
  if (d.lipVolume >= 0.67 && !baby) paint(lx0, my + 1, lip[1]);
  // bochecha iluminada
  if (!baby) paint(elx - 1, ely + 2, skin[3]);
  // sardas e pintas
  if (d.freckles > 0.05) {
    const fr = makeRamp(mix(d.skin, '#8a4a2a', 0.35))[2];
    const n = Math.round(d.freckles * 6) + 1;
    for (let i = 0; i < n; i++) { const fx = (i % 2 ? erx + 1 : elx - 1) + ((i >> 1) % 3) - 1; paint(fx, ely + 2 + (i % 3 === 0 ? 1 : 0), fr); }
  }
  if (d.moles > 0.3 && !baby) paint(erx + 2, my - 1, skin[0]);

  // ---- barba (adulto) ----
  const fh = d.facialHair;
  if (fh !== 'nenhuma' && d.age >= 16) {
    const beard = makeRamp(d.hair.grey > 0.5 ? mix('#d9d6d0', hairHex, 0.2) : mix(hairHex, '#2a1d16', 0.15), { shadowShift: 14 });
    const stub = makeRamp(mix(hairHex, d.skin, 0.55))[1];
    const jawTop = my - 2;
    for (let y = jawTop; y <= jaw; y++) for (let x = hx; x < hx + hw; x++) {
      if (cv.r(x, y) !== 'h') continue;
      const nearMouth = y >= my && y <= my + 1 && x >= lx0 && x < lx0 + lw;
      if (nearMouth) continue;
      const cheek = x <= hx + 1 || x >= hx + hw - 2;
      const chin = Math.abs(x - 15.5) <= 2 && y > my;
      const lipLine = y === my - 1 && x >= lx0 - 1 && x <= lx0 + lw;
      if (fh === 'bigode' || fh === 'cavanhaque') {
        if (lipLine || (fh === 'cavanhaque' && chin)) paint(x, y, beard[y === jaw ? 0 : 1]);
        continue;
      }
      if (y < my - 1 && !cheek) continue;
      if (fh === 'por_fazer') { if (h01(x, y, 5) < 0.5) paint(x, y, stub); continue; }
      if (fh === 'rala' && h01(x, y, 6) < 0.4) continue;
      paint(x, y, beard[cv.m(x + 1, y) && x < hx + hw - 1 ? (h01(x, y, 8) < 0.25 ? 3 : 2) : 1]);
    }
  }

  // ---- acessórios ----
  if (o.acessorio?.id === 'faixa' || o.acessorio?.id === 'prajied') {
    if (o.acessorio.id === 'faixa') drawBelt(cv, b, o.acessorio.color, o.acessorio.accent);
    else drawPrajied(cv, b, o.acessorio.color, o.acessorio.accent);
    for (const mat of ['faixa', 'faixa_listra', 'prajied', 'prajied_ponta']) {
      const fr = cv.ramps.get(mat);
      if (!fr) continue;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (cv.m(x, y) === mat) paint(x, y, fr[cv.tone[cv.idx(x, y)]!]);
    }
  }
  if (o.acessorio?.id === 'bone') {
    const cap = makeRamp(o.acessorio.color);
    for (let y = hy - 1; y <= hy + 2; y++) for (let x = hx; x < hx + hw; x++) paint(x, y, cap[y === hy - 1 ? 0 : x > 18 ? 1 : 2]);
    for (let x = hx + hw - 1; x <= hx + hw + 2; x++) paint(x, hy + 3, cap[0]);
  }
  if (o.acessorio?.id === 'oculos') {
    const fr = makeRamp(o.acessorio.color)[0];
    for (let x = elx - 1; x <= erx + 2; x++) paint(x, ely - 1, fr);
    for (const x of [elx - 1, elx + 2, erx - 1, erx + 2]) paint(x, ely, fr);
  }

  // ---- marcas da luta ----
  if (d.marks.scar) { const sc = makeRamp(mix(d.skin, '#f2c7c0', 0.5))[3]; paint(erx + 1, ely - 4, sc); paint(erx + 2, ely - 3, sc); }
  if (d.marks.cauliflowerEar) { const ex2 = hx - 1; const ey = hy + Math.round(hh * 0.45); paint(ex2 - 1, ey + 1, skin[1]); paint(ex2, ey, skin[3]); paint(ex2, ey + 2, skin[3]); }
  // ---- rugas (idoso) ----
  if (d.wrinkles > 0.35 && !baby) {
    const wr = skin[1];
    const fy = hy + Math.round(hh * 0.3);
    for (let x = hx + 3; x < hx + hw - 3; x += 2) paint(x, fy, wr);
    paint(elx - 2, ely, wr);
    paint(erx + 3, ely, wr);
    if (d.wrinkles > 0.6) { paint(lx0 - 1, my - 1, wr); paint(lx0 + lw, my - 1, wr); }
  }

  // ---- sombra no chão ----
  let fx0 = W;
  let fx1 = 0;
  for (let x = 0; x < W; x++) if (cv.r(x, H - 2) === 'p' || cv.r(x, H - 3) === 'p') { fx0 = Math.min(fx0, x); fx1 = Math.max(fx1, x); }
  if (fx0 <= fx1) for (let x = fx0 - 2; x <= fx1 + 2; x++) if (!cv.m(x, H - 1)) paint(x, H - 1, [20, 16, 30], x < fx0 || x > fx1 ? 70 : 110);

  // ---- respiração: no quadro 1, cabeça e tronco descem 1 px ----
  if (opts.frame === 1) {
    const wy = A.waist[1];
    for (let y = wy; y > 0; y--) out.copyWithin(y * W * 4, (y - 1) * W * 4, y * W * 4);
    out.fill(0, 0, W * 4);
  }
  return { w: W, h: H, data: out };
}

/** Recorte do busto (cabeça e ombros) para a tela principal e as miniaturas. */
export function bustCrop(d: AvatarDescriptor): { x: number; y: number; w: number; h: number } {
  const b = bodySprite(d.stage, d.sex, d.build);
  const top = Math.max(0, b.headBox[1] - (d.hair.style === 'black_power' || d.hair.style === 'coque' || d.hair.style === 'moicano' ? 5 : 2));
  const size = 28;
  return { x: 2, y: Math.min(top, H - size), w: size, h: size };
}

/** Hash estável do buffer (testes de determinismo). */
export function pixelHash(img: PixelImage): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < img.data.length; i++) {
    h ^= img.data[i]!;
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}
