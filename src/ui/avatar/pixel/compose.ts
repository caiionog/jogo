/**
 * Compositor do avatar em pixel art (Etapa 8). Sem DOM: gera um buffer RGBA (testável no Node); o canvas só exibe.
 *
 * Passos: mapa de material por pixel (corpo → roupas por regra → cabelo) → tom por pixel (sombra automática com luz
 * de cima à esquerda + dobras + sombra projetada) → contorno seletivo (sel-out, tom mais escuro do próprio material)
 * → rosto → sombra no chão.
 */
import type { BodySprite, Region } from '../../../content/sprites/types';
import { makeRamp } from './color';
import type { Ramp, Rgb } from './color';

export interface PixelImage {
  w: number;
  h: number;
  data: Uint8ClampedArray;
}

/** Tons da rampa: 0 contorno · 1 sombra · 2 base · 3 luz. */
type Tone = 0 | 1 | 2 | 3;

export interface ClothingLayer {
  /** Material (cada um tem a própria rampa). */
  id: string;
  color: string;
  /** Quais regiões cobre e de que linha a que linha (inclusive). */
  cover: { regions: readonly Region[]; fromY?: number; toY?: number }[];
  /** Dobras extras (sombra) em pixels absolutos. */
  folds?: readonly (readonly [number, number])[];
  /** Detalhes: pixels com tom fixo (gola, costura, cadarço…). */
  details?: readonly { x: number; y: number; tone: Tone }[];
  pattern?: 'liso' | 'listrado';
}

export interface HairLayer {
  color: string;
  /** Grade de cabelo: 'f' frente, 'b' trás (atrás da cabeça), '.' vazio. */
  grid: readonly string[];
  origin: readonly [number, number];
}

export interface FaceSpec {
  eyeColor: string;
  lip: string;
}

export interface AvatarSpec {
  body: BodySprite;
  skin: string;
  clothes: readonly ClothingLayer[];
  hair?: HairLayer;
  face: FaceSpec;
}

const SKIN = 'skin';
const HAIR = 'hair';

export function composeAvatar(spec: AvatarSpec): PixelImage {
  const { body } = spec;
  const W = body.w;
  const H = body.h;
  const idx = (x: number, y: number) => y * W + x;
  const region: (Region | null)[] = new Array(W * H).fill(null);
  const mat: (string | null)[] = new Array(W * H).fill(null);
  const tone: Tone[] = new Array(W * H).fill(2);
  const fixed: boolean[] = new Array(W * H).fill(false);

  for (let y = 0; y < H; y++) {
    const row = body.shape[y] ?? '';
    for (let x = 0; x < W; x++) {
      const c = row[x];
      if (c && c !== '.') {
        region[idx(x, y)] = c as Region;
        mat[idx(x, y)] = SKIN;
      }
    }
  }
  const ramps = new Map<string, Ramp>([[SKIN, makeRamp(spec.skin, { shadowShift: 9, lightShift: 7, satCap: 0.5 })]]);

  // roupas, na ordem das camadas
  for (const layer of spec.clothes) {
    ramps.set(layer.id, makeRamp(layer.color));
    for (const c of layer.cover) {
      for (let y = c.fromY ?? 0; y <= (c.toY ?? H - 1); y++) {
        for (let x = 0; x < W; x++) {
          const r = region[idx(x, y)];
          if (r && c.regions.includes(r)) mat[idx(x, y)] = layer.id;
        }
      }
    }
  }

  // cabelo: pixels de frente pintam por cima; os de trás só onde não há corpo
  if (spec.hair) {
    ramps.set(HAIR, makeRamp(spec.hair.color, { shadowShift: 16, lightShift: 12 }));
    const [ox, oy] = spec.hair.origin;
    spec.hair.grid.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const c = row[i];
        const x = ox + i;
        const y = oy + j;
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        if (c === 'f' || (c === 'b' && !region[idx(x, y)])) {
          mat[idx(x, y)] = HAIR;
          if (!region[idx(x, y)]) region[idx(x, y)] = 'h';
        }
      }
    });
  }

  const m = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? null : mat[idx(x, y)]);
  const reg = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? null : region[idx(x, y)]);

  // ---- sombreamento automático (luz de cima à esquerda) ----
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const me = m(x, y);
      if (!me) continue;
      const r = reg(x, y)!;
      // extensão horizontal do mesmo material+região nesta linha
      let xl = x, xr = x;
      while (m(xl - 1, y) === me && reg(xl - 1, y) === r) xl--;
      while (m(xr + 1, y) === me && reg(xr + 1, y) === r) xr++;
      const width = xr - xl + 1;
      let t: Tone = 2;
      // lado direito na sombra (2 px em volumes largos)
      if (x === xr || (width >= 8 && x === xr - 1)) t = 1;
      // luz no lado esquerdo, só na parte de cima dos volumes
      if (width >= 4 && x === xl + 1 && t === 2) {
        // na cabeça, a luz fica só na testa e na maçã do rosto (não vira uma faixa)
        const top = body.headBox[1];
        t = r !== 'h' || (y - top >= 4 && y - top <= 9) ? 3 : 2;
      }
      if (me === HAIR) {
        // cabelo: brilho em mechas no topo esquerdo, mechas de sombra, base escura embaixo
        const below = m(x, y + 1);
        const above = m(x, y - 1);
        if (below !== HAIR) t = 1;
        else if (above !== HAIR && x < xl + width * 0.7) t = 3;
        else if (above === HAIR && m(x, y - 2) !== HAIR && (x + y) % 3 === 0 && x < xl + width * 0.55) t = 3;
        else if (x > xl + width * 0.6 && (x + 2 * y) % 4 === 0) t = 1;
      }
      // mão: um tom acima do braço (volume) 
      if (r === 'm' && t === 2) t = 3;
      // braço encostado no tronco: separação
      if ((r === 'a' || r === 'm') && (reg(x + 1, y) === 't' || reg(x - 1, y) === 't')) t = 1;
      // perna direita encostada na esquerda
      if (r === 'r' && reg(x - 1, y) === 'l') t = 1;
      // sombra projetada: logo abaixo de outro material (barra da manga, gola, cabelo na testa, queixo no pescoço)
      const up = m(x, y - 1);
      if (up && up !== me && t > 1) t = 1;
      if (r === 'n' && reg(x, y - 1) === 'h') t = 1;
      tone[idx(x, y)] = t;
    }
  }
  // dobras das roupas e detalhes
  for (const layer of spec.clothes) {
    for (const [x, y] of layer.folds ?? []) if (m(x, y) === layer.id) tone[idx(x, y)] = 1;
    if (layer.pattern === 'listrado') {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (m(x, y) === layer.id && y % 3 === 0 && tone[idx(x, y)] === 2) tone[idx(x, y)] = 3;
    }
    for (const d of layer.details ?? []) if (m(d.x, d.y) === layer.id) { tone[idx(d.x, d.y)] = d.tone; fixed[idx(d.x, d.y)] = true; }
  }

  // ---- contorno seletivo: borda externa no tom mais escuro do próprio material ----
  const out = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const me = m(x, y);
      if (!me) continue;
      let t = tone[idx(x, y)]!;
      const edge = !m(x - 1, y) || !m(x + 1, y) || !m(x, y - 1) || !m(x, y + 1);
      if (edge && !fixed[idx(x, y)]) {
        // sel-out: o lado iluminado (só vizinho vazio à esquerda/cima) fica com a sombra; o resto, contorno
        const lit = (!m(x - 1, y) || !m(x, y - 1)) && m(x + 1, y) && m(x, y + 1);
        t = lit ? 1 : 0;
      }
      paint(out, W, x, y, ramps.get(me)![t]);
    }
  }

  // ---- rosto ----
  const skin = ramps.get(SKIN)!;
  const [elx, ely] = body.anchors.eyeL;
  const [erx, ery] = body.anchors.eyeR;
  // pálpebra/cílios: tom escuro neutro do cabelo (nunca o contorno avermelhado da pele clara)
  const lash = spec.hair ? makeRamp(spec.hair.color)[0] : skin[0];
  const sclera: Rgb = [236, 232, 224];
  const eye = makeRamp(spec.face.eyeColor);
  // olhos: pálpebra (linha) + esclera + íris olhando para frente
  for (const [x, y, inner] of [[elx, ely, 1], [erx, ery, -1]] as const) {
    paint(out, W, x, y - 1, lash);
    paint(out, W, x + inner, y - 1, lash);
    paint(out, W, x, y, inner > 0 ? sclera : eye[1]);
    paint(out, W, x + inner, y, inner > 0 ? eye[1] : sclera);
  }
  // sobrancelhas
  const brow = spec.hair ? ramps.get(HAIR)![1] : skin[0];
  for (const x of [elx - 1, elx, elx + 1]) paint(out, W, x, ely - 3, brow);
  for (const x of [erx - 1, erx, erx + 1]) paint(out, W, x, ery - 3, brow);
  // nariz: sombra embaixo e à direita (luz da esquerda)
  const [mx, my] = body.anchors.mouth;
  paint(out, W, mx + 1, my - 3, skin[1]);
  paint(out, W, mx, my - 2, skin[1]);
  paint(out, W, mx + 1, my - 2, skin[0]);
  // boca
  const lip = makeRamp(spec.face.lip);
  for (const x of [mx - 1, mx, mx + 1, mx + 2]) paint(out, W, x, my, lip[1]);
  paint(out, W, mx, my + 1, lip[2]);
  paint(out, W, mx + 1, my + 1, lip[2]);
  // bochecha iluminada
  paint(out, W, elx - 1, ely + 2, skin[3]);

  // ---- sombra no chão ----
  const groundY = H - 1;
  for (let x = 8; x <= 23; x++) if (!m(x, groundY)) paintA(out, W, x, groundY, [20, 16, 30], x < 10 || x > 21 ? 70 : 110);
  return { w: W, h: H, data: out };
}

function paint(buf: Uint8ClampedArray, W: number, x: number, y: number, [r, g, b]: Rgb): void {
  const i = (y * W + x) * 4;
  buf[i] = r;
  buf[i + 1] = g;
  buf[i + 2] = b;
  buf[i + 3] = 255;
}

function paintA(buf: Uint8ClampedArray, W: number, x: number, y: number, [r, g, b]: Rgb, a: number): void {
  const i = (y * W + x) * 4;
  buf[i] = r;
  buf[i + 1] = g;
  buf[i + 2] = b;
  buf[i + 3] = a;
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
