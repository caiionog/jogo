// Teste manual automatizado da release (Playwright): cria uma vida pela tela, joga até os 30 anos resolvendo os
// pop-ups e visita as telas novas com estados de cenário. Falha se houver erro no console ou "energia"/contador.
//   node scripts/e2e/release-check.mjs <largura> <altura> <pasta-capturas> [estados.json]
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');

const [w = '375', h = '667', out = 'tmp', statesFile = 'tmp/e2e-states.json'] = process.argv.slice(2);
const url = process.env.URL ?? 'http://localhost:5173/';
const states = JSON.parse(readFileSync(statesFile, 'utf8'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
const shot = (name) => page.screenshot({ path: `${out}/${name}-${w}x${h}.png` });
const visible = async (id) => (await page.getByTestId(id).count()) > 0;
const click = async (id) => { await page.getByTestId(id).first().click(); await page.waitForTimeout(150); };
const report = [];
const check = (ok, msg) => report.push(`${ok ? 'ok ' : 'FALHOU'} ${msg}`);

async function inject(state) {
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
    });
  }, state);
  await page.reload();
  await page.waitForTimeout(700);
}
async function back() {
  await page.goBack();
  await page.waitForTimeout(150);
}
async function home() {
  for (let i = 0; i < 8 && (await page.locator('[role=dialog][data-testid^="screen-"]').count()) > 0; i++) await back();
}
async function resolvePopups() {
  for (let k = 0; k < 8; k++) {
    if (await visible('event-choice')) { await click('event-choice'); continue; }
    if (await visible('result-ok')) { await click('result-ok'); continue; }
    break;
  }
}
const bodyText = () => page.evaluate(() => document.body.innerText);

// 1) criar personagem pela tela e jogar até os 30
await page.goto(url);
await page.evaluate(() => new Promise((r) => { const d = indexedDB.deleteDatabase('keyval-store'); d.onsuccess = d.onerror = d.onblocked = () => r(); }));
await page.reload();
await page.waitForTimeout(600);
if (await visible('random-all')) await click('random-all');
for (let i = 0; i < 3 && (await visible('next-step')); i++) await click('next-step');
await click('start-life');
let age = 0;
for (let y = 0; y < 30; y++) {
  await resolvePopups();
  await click('age-button');
  await resolvePopups();
  age = Number((await page.getByTestId('char-age').textContent())?.match(/\d+/)?.[0] ?? age);
  if (age === 8) {
    await click('nav-atividades');
    if (await visible('act-treino')) {
      await click('act-treino');
      let n = 0;
      for (let k = 0; k < 13; k++) if (await page.getByTestId('train-fisico').first().isEnabled()) { await click('train-fisico'); n++; }
      const reason = await page.getByTestId('train-fisico').first().textContent();
      check(n === 10 && /Sem sessões/.test(reason ?? ''), `limite de 10 treinos por ano (${n} treinos; depois: "${(reason ?? '').match(/Sem sessões[^.]*/)?.[0] ?? '?'}")`);
    }
    await home();
  }
}
check(age >= 30, `vida criada pela tela e jogada até os ${age}`);
const t1 = await bodyText();
check(!/[Ee]nergia|⚡/.test(t1), 'nenhuma menção a energia');
await shot('vida-30');

// 2) cenários injetados
for (const [name, state] of Object.entries(states)) {
  await inject(state);
  if (name === 'faixas') {
    await click('shortcut-luta');
    const t = await bodyText();
    check(/faixa (azul|laranja|verde|amarela)/i.test(t), `faixas de jiu-jitsu visíveis na tela central (${(t.match(/faixa [a-z ]+/i) ?? [''])[0]})`);
    await shot('carreira-luta');
  }
  if (name === 'muaythai') {
    await click('shortcut-luta');
    check(/prajied/i.test(await bodyText()), 'prajied do muay thai na tela central (avatar de treino)');
    await shot('prajied');
  }
  if (name === 'faculdade') {
    await click('nav-ocupacao');
    await click('occ-careers');
    await click('career-studies');
    check(await visible('diplomas'), 'diploma aparece em Estudos e faculdade');
    await shot('faculdade');
  }
  if (name === 'clube') {
    await click('nav-atividades');
    await click('act-clube');
    check(await visible('club-current'), 'clube esportivo ativo');
    await back();
    await click('act-intercambio');
    check(await visible('exchange-tailandia'), 'tela de intercâmbio');
    await shot('intercambio');
  }
  if (name === 'noite_off' || name === 'noite_on') {
    await click('nav-atividades');
    await click('act-lazer');
    await click('act-noite');
    const strip = await visible('venue-casa_strip');
    check(name === 'noite_off' ? !strip : strip, `casa de strip ${name === 'noite_off' ? 'oculta com "Conteúdo adulto" desligado' : 'visível com a opção ligada'}`);
    if (name === 'noite_off') await shot('vida-noturna');
    await click('venue-bar');
    await resolvePopups();
  }
  if (name === 'mercado') {
    await click('nav-bens');
    await click('assets-market');
    await page.getByText('Empreendimentos').first().click();
    await page.waitForTimeout(200);
    check((await page.locator('canvas').count()) > 3, 'Mercado de empreendimentos com ícones');
    await shot('mercado');
  }
}
check(errors.length === 0, `console sem erros${errors.length ? `: ${errors.slice(0, 3).join(' | ')}` : ''}`);
console.log(report.join('\n'));
await browser.close();
