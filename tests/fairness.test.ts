/**
 * Regra de não discriminação (Etapa 7, obrigatória): cor ou raça é só demografia e aparência.
 * Nunca altera atributos, chances, salários, eventos ou qualquer mecânica.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import type { Appearance, GameState } from '../src/engine';
import { RACES, advanceYear, createRng, genesForRace, newGame, performAction } from '../src/engine';
import { resolveAllFirst } from './helpers';

const RACE_KEY = /ra[cç]a|race|etni|skin|pele|genes|appearance|apar[eê]ncia|undertone|hairType|eyeColor/i;
const RACE_TEXT = /\b(ra[cç]a|racial|étnic|etnia|cor da pele|tom de pele)/i;

function walkKeys(obj: unknown, path: string, out: string[]): void {
  if (Array.isArray(obj)) obj.forEach((v, i) => walkKeys(v, `${path}[${i}]`, out));
  else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (RACE_KEY.test(k)) out.push(`${path}.${k}`);
      walkKeys(v, `${path}.${k}`, out);
    }
  }
}

describe('não discriminação: conteúdo', () => {
  // tudo o que é mecânica no conteúdo (a geografia e as roupas são aparência/demografia e ficam de fora)
  const { geo: _geo, outfits: _outfits, names: _names, ...mechanics } = GAME_CONTENT;
  void _geo; void _outfits; void _names;

  it('nenhuma condição, efeito, requisito ou regra referencia cor/raça ou genes', () => {
    const hits: string[] = [];
    walkKeys(mechanics, 'content', hits);
    expect(hits).toEqual([]);
  });

  it('nenhum texto de evento, escolha ou ação fala de cor/raça', () => {
    const texts: string[] = [];
    for (const e of GAME_CONTENT.events) {
      texts.push(e.text);
      for (const c of e.choices) texts.push(c.label, c.resultText, c.risk?.resultText ?? '');
    }
    for (const a of GAME_CONTENT.actions) texts.push(JSON.stringify(a));
    expect(texts.filter((t) => RACE_TEXT.test(t))).toEqual([]);
  });
});

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

describe('não discriminação: código', () => {
  const engine = resolve(__dirname, '../src/engine');
  // módulos de mecânica: não podem importar a aparência nem ler cor/raça/genes
  const mechanicDirs = ['fighting', 'economy', 'events', 'health', 'lifeStages', 'assets', 'meta', 'legacy'];
  const mechanicFiles = [
    ...mechanicDirs.flatMap((d) => files(join(engine, d))),
    join(engine, 'core/stats.ts'),
    join(engine, 'core/effects.ts'),
    join(engine, 'relationships/actions.ts'),
    join(engine, 'relationships/social.ts'),
    join(engine, 'relationships/guards.ts'),
    join(engine, 'relationships/year.ts'),
  ].filter((f) => f.endsWith('.ts'));
  /**
   * Exceções explicadas: só criam pessoas (aparência herdada) ou validam os dados do IBGE.
   * - legacy/succession.ts: o herdeiro e os filhos dele herdam a aparência da família.
   * - events/validate.ts: confere que os percentuais do Censo somam 100%.
   */
  const ALLOWED = new Set(['legacy/succession.ts', 'events/validate.ts']);

  it.each(mechanicFiles.map((f) => relative(engine, f)))('%s não usa cor/raça nem genes', (rel) => {
    const src = readFileSync(join(engine, rel), 'utf8');
    if (ALLOWED.has(rel)) {
      // mesmo nas exceções, cor/raça não decide nada: só passa adiante para a herança ou valida a soma
      expect(src).not.toMatch(/\.race\s*(===|!==|==|!=)/);
      expect(src).not.toMatch(/\.genes\.\w+\s*[<>=!]/);
      return;
    }
    expect(src).not.toMatch(/character\/appearance|from '\.\/appearance|from '\.\.\/appearance/);
    expect(src).not.toMatch(/\.appearance\b|\.genes\b|\.race\b|corRaca|skinTone/);
  });

  it('a varredura cobre os módulos de mecânica', () => {
    expect(mechanicFiles.length).toBeGreaterThan(40);
  });
});

describe('não discriminação: simulação', () => {
  const look = (race: Appearance['race'], i: number): Appearance => ({ genes: genesForRace(createRng(100 + i), race), race, facialHair: 'nenhuma' });
  const start = (seed: string, sex: 'M' | 'F', appearance: Appearance) =>
    newGame({ seed, name: 'Alex', surnames: ['Souza', 'Lima'], sex, birthYear: 1995, uf: 'BA', city: 'Salvador', appearance }, GAME_CONTENT);

  /** 30 anos de vida com as mesmas escolhas; só muda a aparência inicial. */
  function life(seed: string, sex: 'M' | 'F', appearance: Appearance): GameState {
    let s = start(seed, sex, appearance);
    for (let y = 0; y < 30 && s.alive; y++) {
      s = resolveAllFirst(advanceYear(s, GAME_CONTENT));
      if (s.character.age >= 14 && !s.pendingEvents.length && !s.activeFight) s = resolveAllFirst(performAction(s, 'train', GAME_CONTENT));
    }
    return s;
  }
  /** Tira tudo o que é aparência (genes, cor ou raça) — o resto tem de ser idêntico. */
  const mechanics = (s: GameState): unknown => JSON.parse(JSON.stringify(s), (k, v) => (k === 'appearance' ? undefined : v));

  it('a genética nunca consome o RNG do jogo de forma diferente por cor/raça (300 nascimentos)', () => {
    for (let i = 0; i < 60; i++) {
      const states = RACES.map((race, j) => start(`rng-${i}`, i % 2 ? 'F' : 'M', look(race, i * 5 + j)));
      for (const s of states.slice(1)) expect(mechanics(s)).toEqual(mechanics(states[0]!));
    }
  });

  it.each([['justo', 'M'], ['justa', 'F'], ['igual', 'M'], ['mesma', 'F']] as const)('seed %s (%s): trocar só a cor/raça e os genes não muda nada mecânico em 30 anos', (seed, sex) => {
    const lives = RACES.map((race, i) => life(seed, sex, look(race, i)));
    const ref = mechanics(lives[0]!);
    for (const l of lives.slice(1)) expect(mechanics(l)).toEqual(ref);
    // a aparência de fato mudou
    expect(new Set(lives.map((l) => l.character.appearance.race)).size).toBe(5);
  });
});
