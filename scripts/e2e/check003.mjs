import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const [w, h, outDir] = process.argv.slice(2);
const D = outDir;
const errors = [];
const browser = await chromium.launch();
async function page(stateFile, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage();
  p.on('console', (m) => m.type() === 'error' && errors.push(`${stateFile}: ${m.text()}`));
  p.on('pageerror', (e) => errors.push(`${stateFile}: ${e}`));
  await p.goto('http://localhost:5173/');
  const s = JSON.parse(readFileSync(stateFile, 'utf8'));
  await p.evaluate(async (s) => {
    await new Promise((res, rej) => {
      const req = indexedDB.open('keyval-store');
      req.onupgradeneeded = () => req.result.createObjectStore('keyval');
      req.onsuccess = () => { const tx = req.result.transaction('keyval', 'readwrite'); tx.objectStore('keyval').put(s, 'save:slot1'); tx.objectStore('keyval').put(1, 'slot:active'); tx.objectStore('keyval').delete('meta'); tx.oncomplete = res; tx.onerror = rej; };
      req.onerror = rej;
    });
  }, s);
  await p.reload();
  await p.waitForTimeout(700);
  return p;
}
const res = {};
// 1) amigos em 3 idades + evento de grupo
for (const who of ['crianca', 'teen', 'adulto']) {
  const p = await page(`tmp/s003/${who}-amigos.json`);
  await p.getByTestId('nav-relacoes').click(); await p.waitForTimeout(300);
  await p.getByTestId('group-hangout').first().click(); await p.waitForTimeout(300);
  await p.screenshot({ path: `${D}/amigos-${who}-${w}.png` });
  const acts = await p.locator('[data-testid^="group-activity-"]:not([disabled])').all();
  let ev = false;
  for (let i = 0; i < 6 && !ev; i++) {
    if (i > 0) { await p.getByTestId('group-hangout').first().click(); await p.waitForTimeout(250); }
    const a = (await p.locator('[data-testid^="group-activity-"]:not([disabled])').all())[i % Math.max(1, acts.length)];
    if (!a) break;
    await a.click(); await p.waitForTimeout(500);
    ev = await p.getByTestId('event-modal').count() > 0;
  }
  res[who] = { activities: acts.length, groupEvent: ev };
  if (ev) await p.screenshot({ path: `${D}/evento-grupo-${who}-${w}.png` });
  await p.close();
}
// 2) visual: troca nas Configurações
{
  const p = await page('tmp/s003/adulto-amigos.json');
  const svg1 = await p.getByTestId('avatar-button').locator('svg').count();
  await p.getByTestId('menu-button').click(); await p.waitForTimeout(200);
  await p.getByTestId('menu-settings').click(); await p.waitForTimeout(300);
  await p.getByTestId('style-pixel').click(); await p.waitForTimeout(300);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  const canvas = await p.getByTestId('avatar-button').locator('canvas').count();
  res.visual = { cartoonDefault: svg1 > 0, pixelAfter: canvas > 0 };
  await p.reload(); await p.waitForTimeout(700);
  res.visual.persisted = (await p.getByTestId('avatar-button').locator('canvas').count()) > 0;
  await p.close();
}
// 3) animação da cama
for (const mode of ['on', 'off']) {
  const p = await page(`tmp/s003/intimo-${mode}.json`);
  await p.getByTestId('event-choice').first().click();
  await p.waitForTimeout(450);
  const anim = await p.getByTestId('intimacy-anim').count();
  if (mode === 'on') await p.screenshot({ path: `${D}/cama-animacao-${w}.png` });
  await p.waitForTimeout(1000);
  if (mode === 'on') await p.screenshot({ path: `${D}/cama-coracao-${w}.png` });
  await p.waitForTimeout(1200);
  const after = await p.getByTestId('intimacy-anim').count();
  res[`cama_${mode}`] = { shown: anim > 0, goneAfter: after === 0 };
  await p.close();
}
{
  const p = await page('tmp/s003/intimo-on.json', { reduced: true });
  await p.getByTestId('event-choice').first().click(); await p.waitForTimeout(300);
  res.cama_reduced = { static: (await p.getByTestId('intimacy-static').count()) > 0 };
  await p.screenshot({ path: `${D}/cama-estatica-${w}.png` });
  await p.close();
}
console.log(JSON.stringify({ res, errors }, null, 1));
await browser.close();
