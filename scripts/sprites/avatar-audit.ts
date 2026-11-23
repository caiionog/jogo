/**
 * Auditoria visual do avatar (release 0.0.1, fase 8): grades PNG para comparar antes × depois.
 *   npx tsx scripts/sprites/avatar-audit.ts <prefixo>     → <prefixo>-npcs.png, -fases.png, -pele.png, -cabelos.png
 * - npcs: 48 pessoas aleatórias (seed fixa), sexo e idade variados, roupa do dia a dia;
 * - fases: 5 fases × 2 sexos (linha M e linha F) com a mesma genética, para checar se o sexo é legível;
 * - pele: a rampa completa (20 tons) em M e F adultos;
 * - cabelos: todos os estilos em M e F adultos.
 * Escala 4× (cada pixel = 4×4), fundo neutro.
 */
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { GAME_CONTENT as C } from '../../src/content';
import { createRng, previewAvatar, randomAppearance } from '../../src/engine';
import type { Appearance, AvatarDescriptor } from '../../src/engine';
import { HAIR_STYLES } from '../../src/engine/character/appearance/genes';
import { renderAvatar } from '../../src/ui/avatar/pixel/render';
import type { PixelImage } from '../../src/ui/avatar/pixel/render';

function crc32(buf: Buffer): number {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w: number, h: number, rgba: Uint8ClampedArray): Buffer {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

/** Grade de imagens (cols por linha), escala inteira. */
export function grid(imgs: PixelImage[], cols: number, scale = 4, bg: [number, number, number] = [214, 208, 196], gap = 3): Buffer {
  const cw = imgs[0]!.w;
  const ch = imgs[0]!.h;
  const rows = Math.ceil(imgs.length / cols);
  const W = (gap + cols * (cw + gap)) * scale;
  const H = (gap + rows * (ch + gap)) * scale;
  const out = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) out.set([...bg, 255], i * 4);
  imgs.forEach((img, n) => {
    const ox = (gap + (n % cols) * (cw + gap)) * scale;
    const oy = (gap + Math.floor(n / cols) * (ch + gap)) * scale;
    for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
      const s = (y * img.w + x) * 4;
      const a = img.data[s + 3]! / 255;
      if (!a) continue;
      for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
        const d = ((oy + y * scale + dy) * W + ox + x * scale + dx) * 4;
        for (let k = 0; k < 3; k++) out[d + k] = Math.round(img.data[s + k]! * a + out[d + k]! * (1 - a));
      }
    }
  });
  return png(W, H, out);
}

const ufs = C.geo.ufs;
const render = (d: AvatarDescriptor) => renderAvatar(d);

export function npcSample(n = 48, seed = 4242): AvatarDescriptor[] {
  const rng = createRng(seed);
  const out: AvatarDescriptor[] = [];
  for (let i = 0; i < n; i++) {
    const sex = i % 2 ? 'F' : 'M';
    const uf = ufs[rng.int(0, ufs.length - 1)]!;
    const look = randomAppearance(rng, uf, sex);
    const age = [1, 5, 9, 14, 17, 22, 30, 38, 45, 55, 68, 80][i % 12]!;
    out.push(previewAvatar(look, sex, age, C, { fat: rng.next() * 0.7, muscle: rng.next() * 0.8 }));
  }
  return out;
}

if (process.argv[1]?.endsWith('avatar-audit.ts')) {
  const prefix = process.argv[2] ?? 'tmp/avatar';
  writeFileSync(`${prefix}-npcs.png`, grid(npcSample().map(render), 12));
  // fases × sexo, mesma genética (por linha: M em cima, F embaixo)
  const rng = createRng(77);
  const fases: PixelImage[] = [];
  for (const sex of ['M', 'F'] as const) {
    const look: Appearance = randomAppearance(createRng(sex === 'M' ? 11 : 12), ufs[24]!, sex);
    for (const age of [1, 7, 15, 30, 72]) fases.push(render(previewAvatar(look, sex, age, C)));
    void rng;
  }
  writeFileSync(`${prefix}-fases.png`, grid(fases, 5));
  // rampa de pele (20 tons), M e F adultos
  const pele: PixelImage[] = [];
  for (const sex of ['M', 'F'] as const) {
    for (let k = 0; k < 10; k++) {
      const base = randomAppearance(createRng(300 + k), ufs[0]!, sex);
      const look: Appearance = { ...base, genes: { ...base.genes, skinTone: k / 9 } };
      pele.push(render(previewAvatar(look, sex, 28, C)));
    }
  }
  writeFileSync(`${prefix}-pele.png`, grid(pele, 10));
  // todos os cabelos em M e F adultos
  const cab: PixelImage[] = [];
  for (const sex of ['M', 'F'] as const) {
    for (const style of HAIR_STYLES) {
      const base = randomAppearance(createRng(900), ufs[0]!, sex);
      const d = previewAvatar(base, sex, 26, C);
      cab.push(render({ ...d, hair: { ...d.hair, style } }));
    }
  }
  writeFileSync(`${prefix}-cabelos.png`, grid(cab, HAIR_STYLES.length));
  console.log(`${prefix}-{npcs,fases,pele,cabelos}.png`);
}
