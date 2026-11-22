/**
 * Exporta o avatar em pixel art para PNG sem navegador (iteração rápida da arte):
 *   (funções png e sheet usadas por scripts/pixel-sheet.ts)
 */
import { deflateSync } from 'node:zlib';
import type { PixelImage } from '../src/ui/avatar/pixel/render';

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
export function png(w: number, h: number, rgba: Uint8ClampedArray): Buffer {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

/** Folha: várias imagens lado a lado, ampliadas por escala inteira, sobre um fundo. */
export function sheet(imgs: PixelImage[], scale: number, bg: [number, number, number] = [214, 208, 196], gap = 2): Buffer {
  const cw = imgs[0]!.w, ch = imgs[0]!.h;
  const W = (cw + gap) * imgs.length * scale + gap * scale, H = (ch + gap * 2) * scale;
  const out = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) out.set([...bg, 255], i * 4);
  imgs.forEach((img, n) => {
    const ox = (gap + n * (cw + gap)) * scale, oy = gap * scale;
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

// (uso como biblioteca: funções png/sheet)
