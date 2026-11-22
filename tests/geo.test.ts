import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import { RACES, REGIOES, applyEffects, cityMultOf, createRng, moveBlockReason, moveTo, newGame, pickBirthplace, pickRace, ufDef } from '../src/engine';
import type { Race } from '../src/engine';
import { adult, ledgerOk } from './ecoHelpers';

const geo = GAME_CONTENT.geo;

describe('geografia do Brasil (Censo 2022)', () => {
  it('27 UFs com região, capital e pelo menos 5 cidades; cor ou raça soma 100%', () => {
    expect(geo.ufs).toHaveLength(27);
    expect(new Set(geo.ufs.map((u) => u.sigla)).size).toBe(27);
    for (const u of geo.ufs) {
      expect(REGIOES).toContain(u.regiao);
      expect(u.cities.length).toBeGreaterThanOrEqual(5);
      expect(u.cities.map((c) => c.name)).toContain(u.capital);
      const sum = RACES.reduce((t, r) => t + u.corRaca[r], 0);
      expect(Math.abs(sum - 100)).toBeLessThanOrEqual(0.2);
    }
    expect(geo.ufs.reduce((t, u) => t + u.populacao, 0)).toBeGreaterThan(200_000_000);
  });

  it('os dados refletem o Censo: amarela concentrada em SP/PR, indígenas no Norte (AM, RR), pardos no Norte', () => {
    const u = (s: string) => ufDef(geo, s)!;
    expect(u('SP').corRaca.amarela).toBeGreaterThan(1);
    expect(u('PR').corRaca.amarela).toBeGreaterThan(0.5);
    expect(u('RR').corRaca.indigena).toBeGreaterThan(10);
    expect(u('AM').corRaca.indigena).toBeGreaterThan(5);
    for (const s of ['AM', 'PA', 'AC', 'AP']) expect(u(s).corRaca.parda).toBeGreaterThan(60);
    expect(u('SC').corRaca.branca).toBeGreaterThan(70);
    expect(u('BA').corRaca.preta).toBeGreaterThan(20);
  });

  it('100 mil nascimentos: proporção por UF e cor ou raça por UF próximas dos dados', () => {
    const rng = createRng(2022);
    const N = 100_000;
    const byUf: Record<string, number> = {};
    const raceByUf: Record<string, Record<Race, number>> = {};
    for (let i = 0; i < N; i++) {
      const p = pickBirthplace(rng, geo);
      byUf[p.uf] = (byUf[p.uf] ?? 0) + 1;
      const r = pickRace(rng, ufDef(geo, p.uf)!);
      ((raceByUf[p.uf] ??= { branca: 0, preta: 0, parda: 0, amarela: 0, indigena: 0 })[r] += 1);
    }
    const total = geo.ufs.reduce((t, u) => t + u.populacao, 0);
    for (const u of geo.ufs) expect(Math.abs((byUf[u.sigla] ?? 0) / N - u.populacao / total) * 100).toBeLessThan(0.5);
    for (const s of ['SP', 'MG', 'RJ', 'BA', 'PR', 'AM', 'RR']) {
      const counts = raceByUf[s]!;
      const n = RACES.reduce((t, r) => t + counts[r], 0);
      // tolerância maior nas UFs pequenas (poucos nascimentos sorteados)
      const tol = n > 5000 ? 1.5 : 4;
      for (const r of RACES) expect(Math.abs((counts[r] / n) * 100 - ufDef(geo, s)!.corRaca[r])).toBeLessThan(tol);
    }
  });

  it('mesmo seed → mesma UF e cidade; o nascimento é só no Brasil', () => {
    const a = newGame({ seed: 'brasil', name: 'Ana', sex: 'F' }, GAME_CONTENT);
    const b = newGame({ seed: 'brasil', name: 'Ana', sex: 'F' }, GAME_CONTENT);
    expect([a.character.uf, a.character.city]).toEqual([b.character.uf, b.character.city]);
    expect(a.character.country).toBe('Brasil');
    expect(ufDef(geo, a.character.uf)!.cities.map((c) => c.name)).toContain(a.character.city);
    const chosen = newGame({ seed: 'x', name: 'Bia', sex: 'F', uf: 'RR', city: 'Boa Vista' }, GAME_CONTENT);
    expect([chosen.character.uf, chosen.character.city]).toEqual(['RR', 'Boa Vista']);
  });

  it('custo de vida pela cidade; mudança de cidade cobra pelo extrato', () => {
    const g = adult(30, 20000);
    expect(cityMultOf(g, GAME_CONTENT)).toBe(1);
    expect(cityMultOf({ ...g, character: { ...g.character, uf: 'SP', city: 'São Paulo' } }, GAME_CONTENT)).toBeGreaterThan(1);
    expect(moveBlockReason(g, GAME_CONTENT, 'GO', 'Goiânia')).toBe('same');
    const m = moveTo(g, GAME_CONTENT, 'BA', 'Salvador');
    expect([m.character.uf, m.character.city]).toEqual(['BA', 'Salvador']);
    expect(m.money).toBeLessThan(g.money);
    expect(ledgerOk(m)).toBe(true);
  });

  it('efeito de evento "move": outra capital ou cidade mais barata da UF, pelo extrato', () => {
    const s = adult(30, 10000);
    const ctx = { rng: createRng(4), content: GAME_CONTENT };
    const a = applyEffects(s, { move: { to: 'outra_capital' } }, ctx);
    expect(a.character.uf).not.toBe('GO');
    expect(a.character.city).toBe(ufDef(GAME_CONTENT.geo, a.character.uf)!.capital);
    expect(a.money).toBe(10000);
    const b = applyEffects(s, { move: { to: 'mesma_uf', cost: 1500 } }, ctx);
    expect(b.character.uf).toBe('GO');
    expect(b.character.city).not.toBe('Goiânia');
    expect(cityMultOf(b, GAME_CONTENT)).toBeLessThan(cityMultOf(s, GAME_CONTENT));
    expect(b.money).toBe(8500);
    expect(ledgerOk(b)).toBe(true);
  });
});
