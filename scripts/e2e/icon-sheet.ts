/** Gera tmp/icon-sheet.html: todos os ícones cartoon (SVG) ao lado dos pixel (rects). Uso: npx tsx scripts/e2e/icon-sheet.ts */
import { mkdirSync, writeFileSync } from 'node:fs';
import { CRIME_ICONS, UNIFORM_ICONS, factionIcon } from '../../src/content/sprites/crimeIcons';
import { MARKET_ICONS, type IconSprite } from '../../src/content/sprites/market';
import { GAME_CONTENT as C } from '../../src/content';
import { crimeIconSvg, factionIconSvg, marketIconSvg, uniformIconSvg } from '../../src/ui/icons/vector';

function pixel(s: IconSprite | undefined): string {
  if (!s) return '';
  const rects = s.grid.flatMap((row, y) => [...row].map((ch, x) => (s.palette[ch] ? `<rect x="${x}" y="${y}" width="1" height="1" fill="${s.palette[ch]}"/>` : ''))).join('');
  return `<svg viewBox="0 0 16 16" shape-rendering="crispEdges">${rects}</svg>`;
}

const cell = (id: string, v: string, p: string) => `<figure><div class="pair"><div class="big">${v}</div><div class="px">${p}</div><div class="sm">${v}</div></div><figcaption>${id}</figcaption></figure>`;
const section = (t: string, cells: string[]) => `<h2>${t}</h2><div class="grid">${cells.join('')}</div>`;

const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:16px;background:#f4efe6;font:12px system-ui;color:#3a2f3f;width:1100px}
h2{margin:14px 0 6px;font-size:14px}.grid{display:flex;flex-wrap:wrap;gap:8px}
figure{margin:0;background:#fff;border-radius:10px;padding:6px;width:150px}
.pair{display:flex;align-items:flex-end;gap:4px}.big svg{width:64px;height:64px;display:block}.px svg{width:32px;height:32px;display:block}.sm svg{width:32px;height:32px;display:block}
figcaption{margin-top:4px;font-size:10px;word-break:break-all}</style>
${section('Mercado', Object.keys(MARKET_ICONS).map((k) => cell(k, marketIconSvg(k), pixel(MARKET_ICONS[k]))))}
${section('Crime', [...C.crime.crimes.map((c) => c.id), 'trafico'].map((k) => cell(k, crimeIconSvg(k), pixel(CRIME_ICONS[k]))))}
${section('Fardas', Object.keys(UNIFORM_ICONS).map((k) => cell(k, uniformIconSvg(k), pixel(UNIFORM_ICONS[k]))))}
${section('Facções', C.crime.factions.map((f) => cell(f.id, factionIconSvg(f.id, f.colors), pixel(factionIcon(f.id, f.colors)))))}`;

mkdirSync('tmp', { recursive: true });
writeFileSync('tmp/icon-sheet.html', html);
console.log('tmp/icon-sheet.html');
