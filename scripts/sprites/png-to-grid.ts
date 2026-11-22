/**
 * Importa um corpo desenhado no Aseprite (PNG) para a grade de texto do jogo.
 *   npx tsx scripts/sprites/png-to-grid.ts caminho/corpo__adulto__F__atletico.png
 * O nome do arquivo segue `corpo__<fase>__<sexo>__<tipo>.png` (fases: bebe, crianca, adolescente, adulto, idoso).
 * Cada pixel usa uma COR-CHAVE da região (tabela KEY, documentada em ASSETS.md); transparente = vazio. As âncoras e a
 * caixa da cabeça vêm da grade gerada de mesmo id (ajuste à mão no arquivo de saída, se preciso). Grava
 * `src/content/sprites/body/<id>.ts`; registre o export em BODY_OVERRIDES (`body/index.ts`) para ter prioridade.
 * PNG aceito: 8 bits por canal, RGB ou RGBA, sem entrelaçamento, até 32×64 (alinhado pelos pés na linha 62).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { inflateSync } from 'node:zlib';
import { GENERATED_BODIES } from '../../src/content/sprites/body/generated';

export const KEY: Record<string, string> = {
  'ff0000': 'h', // cabeça
  'ff8000': 'e', // orelha
  'ffff00': 'n', // pescoço
  '00ff00': 't', // tronco
  '00ffff': 'a', // braço
  '0080ff': 'm', // mão
  '0000ff': 'c', // quadril
  'ff00ff': 'l', // perna esquerda (da tela)
  '8000ff': 'r', // perna direita
  '808080': 'p', // pé
};

export function decodePng(buf: Buffer): { w: number; h: number; rgba: Uint8Array } {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('não é PNG');
  let p = 8;
  let w = 0;
  let h = 0;
  let ch = 4;
  const idat: Buffer[] = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString('ascii', p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      const depth = data[8];
      const color = data[9];
      if (depth !== 8 || (color !== 2 && color !== 6) || data[12] !== 0) throw new Error('use PNG RGB/RGBA de 8 bits, sem entrelaçamento');
      ch = color === 6 ? 4 : 3;
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * ch;
  const out = new Uint8Array(w * h * 4);
  const prev = new Uint8Array(stride);
  const cur = new Uint8Array(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x] ?? 0;
      const a = x >= ch ? cur[x - ch]! : 0;
      const b = prev[x]!;
      const c = x >= ch ? prev[x - ch]! : 0;
      let r = v;
      if (f === 1) r = v + a;
      else if (f === 2) r = v + b;
      else if (f === 3) r = v + ((a + b) >> 1);
      else if (f === 4) {
        const pa = Math.abs(b - c);
        const pb = Math.abs(a - c);
        const pc = Math.abs(a + b - 2 * c);
        r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      }
      cur[x] = r & 255;
    }
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      out[o] = cur[x * ch]!;
      out[o + 1] = cur[x * ch + 1]!;
      out[o + 2] = cur[x * ch + 2]!;
      out[o + 3] = ch === 4 ? cur[x * ch + 3]! : 255;
    }
    prev.set(cur);
  }
  return { w, h, rgba: out };
}

export function pngToShape(img: { w: number; h: number; rgba: Uint8Array }, W = 32, H = 64): string[] {
  if (img.w > W || img.h > H) throw new Error(`PNG maior que ${W}×${H}`);
  const ox = Math.floor((W - img.w) / 2);
  const oy = H - 1 - img.h; // pés na linha 62 (a 63 é a sombra)
  const rows = Array.from({ length: H }, () => Array<string>(W).fill('.'));
  for (let y = 0; y < img.h; y++)
    for (let x = 0; x < img.w; x++) {
      const o = (y * img.w + x) * 4;
      if ((img.rgba[o + 3] ?? 0) < 128) continue;
      const hex = [0, 1, 2].map((i) => (img.rgba[o + i] ?? 0).toString(16).padStart(2, '0')).join('');
      const region = KEY[hex];
      if (!region) throw new Error(`cor ${hex} em (${x},${y}) não é uma cor-chave`);
      const row = rows[y + oy];
      if (row) row[x + ox] = region;
    }
  return rows.map((r) => r.join(''));
}

if (process.argv[1] && basename(process.argv[1]).startsWith('png-to-grid')) {
  const file = process.argv[2];
  if (!file) throw new Error('uso: npx tsx scripts/sprites/png-to-grid.ts corpo__adulto__F__atletico.png');
  const m = /^corpo__(\w+)__([MF])__(\w+)\.png$/.exec(basename(file));
  if (!m) throw new Error('nome esperado: corpo__<fase>__<sexo>__<tipo>.png');
  const id = `${m[1]}_${m[2]}_${m[3]}`;
  const base = GENERATED_BODIES[id];
  if (!base) throw new Error(`não há grade gerada ${id} para copiar as âncoras`);
  const shape = pngToShape(decodePng(readFileSync(file)));
  const name = id.toUpperCase();
  const src = `import type { BodySprite } from '../types';\n\n/** Importado de ${basename(file)} (scripts/sprites/png-to-grid.ts). */\nexport const ${name}: BodySprite = {\n  id: '${id}',\n  w: 32,\n  h: 64,\n  // prettier-ignore\n  shape: [\n${shape.map((r) => `    '${r}',`).join('\n')}\n  ],\n  anchors: ${JSON.stringify(base.anchors).replace(/"(\w+)":/g, '$1: ')},\n  headBox: ${JSON.stringify(base.headBox)},\n};\n`;
  writeFileSync(`src/content/sprites/body/${id}.ts`, src);
  console.log(`gravado src/content/sprites/body/${id}.ts — registre ${name} em BODY_OVERRIDES`);
}
