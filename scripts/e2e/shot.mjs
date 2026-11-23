// Abre o jogo com um save injetado e tira capturas. Uso:
//   node scripts/e2e/shot.mjs <state.json> <prefixo-saída> [largura] [altura] [passos separados por vírgula: testids para clicar]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { readFileSync } from 'node:fs';
const [file, prefix, w = '375', h = '667', steps = ''] = process.argv.slice(2);
const state = JSON.parse(readFileSync(file, 'utf8'));
const url = process.env.URL ?? 'http://localhost:5173/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url);
await page.evaluate(async (s) => {
  await new Promise((res, rej) => {
    const req = indexedDB.open('keyval-store');
    req.onupgradeneeded = () => req.result.createObjectStore('keyval');
    req.onsuccess = () => {
      const tx = req.result.transaction('keyval', 'readwrite');
      tx.objectStore('keyval').put(s, 'save:slot1');
      tx.objectStore('keyval').put(1, 'slot:active');
      tx.oncomplete = res;
      tx.onerror = rej;
    };
    req.onerror = rej;
  });
}, state);
await page.reload();
await page.waitForTimeout(800);
await page.screenshot({ path: `${prefix}-0.png` });
let i = 1;
for (const id of steps.split(',').filter(Boolean)) {
  await page.getByTestId(id).first().click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${prefix}-${i++}.png` });
}
const text = await page.evaluate(() => document.body.innerText);
console.log(JSON.stringify({ errors, energia: /⚡|[Ee]nergia/.test(text) }));
await browser.close();
