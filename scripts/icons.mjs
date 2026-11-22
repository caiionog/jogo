// Gera os PNGs do PWA a partir de public/icons/icon.svg (Chromium do Playwright já instalado).
// Uso: node scripts/icons.mjs  — os PNGs gerados são versionados.
import { createRequire } from 'node:module';
// playwright vem instalado globalmente no ambiente (require resolve pelo NODE_PATH)
const { chromium } = createRequire(import.meta.url)('playwright');
import { readFileSync } from 'node:fs';

const svg = readFileSync('public/icons/icon.svg', 'utf8');
const targets = [
  { file: 'icon-192.png', size: 192, pad: 0 },
  { file: 'icon-512.png', size: 512, pad: 0 },
  { file: 'apple-touch-icon.png', size: 180, pad: 0 },
  // maskable: área segura (80%) com fundo cheio
  { file: 'icon-maskable-512.png', size: 512, pad: 0.12 },
];
const browser = await chromium.launch();
const page = await browser.newPage();
for (const t of targets) {
  const inner = Math.round(t.size * (1 - t.pad * 2));
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(`<html><body style="margin:0;background:#020617;display:grid;place-items:center;width:${t.size}px;height:${t.size}px">
    <div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body></html>`);
  await page.screenshot({ path: `public/icons/${t.file}`, omitBackground: false });
  console.log('gerado', t.file);
}
await browser.close();
