import { describe, expect, it } from 'vitest';
import { FIGHT_TEXT } from '../src/content/fightText';
import { chooseCorner, playRound, simulateFight, startFight } from '../src/engine';
import type { FightState, FighterSnapshot, Skills, Strategy } from '../src/engine';

const mk = (id: string, s: Partial<Skills> = {}, base = 50): FighterSnapshot => ({
  id,
  name: id,
  fullName: id,
  strength: base,
  fitness: base,
  sizeEdge: 0,
  skills: { striking: base, wrestling: base, grappling: base, defense: base, cardio: base, chin: base, ...s },
});

const seedOf = (i: number) => (i * 2654435761) >>> 0;
const fight = (a: FighterSnapshot, b: FighterSnapshot, i: number, rounds = 3, policy?: (s: FightState) => Strategy) =>
  simulateFight(a, b, { rounds, rngState: seedOf(i) }, FIGHT_TEXT, policy);

const FINISH_KINDS = ['ko', 'tko', 'sub_win', 'doctor'];

describe('simulateFight', () => {
  it('é determinístico: mesmo seed + mesmos lutadores = luta idêntica', () => {
    const a = mk('Kauã', { striking: 62 });
    const b = mk('Trovão', { grappling: 60 });
    expect(fight(a, b, 42)).toEqual(fight(a, b, 42));
    const results = new Set(Array.from({ length: 30 }, (_, i) => JSON.stringify(fight(a, b, i).result)));
    expect(results.size).toBeGreaterThan(10);
  });

  it('o lutador claramente superior vence entre 75% e 95% em 1000 seeds', () => {
    const strong = mk('Forte', {}, 65);
    const weak = mk('Fraco', {}, 50);
    let wins = 0;
    for (let i = 0; i < 1000; i++) if (fight(strong, weak, i).result!.winner === 0) wins++;
    expect(wins / 1000).toBeGreaterThan(0.75);
    expect(wins / 1000).toBeLessThan(0.95);
  });

  it('nocautes, finalizações e decisões aparecem em proporções plausíveis', () => {
    const count = { KO: 0, SUB: 0, DEC: 0 };
    const N = 1000;
    for (let i = 0; i < N; i++) {
      const m = fight(mk('A', { striking: 58 }, 52), mk('B', { grappling: 60 }, 50), i).result!.method;
      if (m === 'KO' || m === 'TKO' || m === 'DOC') count.KO++;
      else if (m === 'SUB') count.SUB++;
      else count.DEC++;
    }
    expect(count.KO / N).toBeGreaterThan(0.12);
    expect(count.KO / N).toBeLessThan(0.55);
    expect(count.SUB / N).toBeGreaterThan(0.04);
    expect(count.SUB / N).toBeLessThan(0.4);
    expect(count.DEC / N).toBeGreaterThan(0.25);
    expect(count.DEC / N).toBeLessThan(0.8);
  });

  it('nunca passa do número de rounds; decisão só sem finalização; scorecards somam', () => {
    for (let i = 0; i < 300; i++) {
      const rounds = i % 2 ? 3 : 5;
      const f = fight(mk('A', {}, 40 + (i % 30)), mk('B', {}, 45 + (i % 17)), i, rounds);
      const r = f.result!;
      expect(f.phase).toBe('finished');
      expect(r.round).toBeGreaterThanOrEqual(1);
      expect(r.round).toBeLessThanOrEqual(rounds);
      expect(f.log.every((l) => l.round <= rounds)).toBe(true);
      const finished = f.log.some((l) => FINISH_KINDS.includes(l.kind));
      if (r.method === 'DEC') {
        expect(finished).toBe(false);
        expect(r.round).toBe(rounds);
        expect(r.decisionType).toBeDefined();
        expect(r.scorecards).toHaveLength(3);
        r.scorecards.forEach((card, j) => {
          expect(card).toHaveLength(rounds);
          for (const [x, y] of card) expect(Math.max(x, y)).toBe(10);
          const sum = card.reduce((t, [x, y]) => [t[0] + x, t[1] + y], [0, 0]);
          expect(r.totals[j]).toEqual(sum);
        });
        if (r.winner !== null) {
          const votes = r.totals.filter(([x, y]) => (r.winner === 0 ? x > y : y > x)).length;
          expect(votes).toBeGreaterThanOrEqual(2);
        }
      } else {
        expect(finished).toBe(true);
        expect(r.winner).not.toBeNull();
        expect(r.scorecards[0]).toHaveLength(r.method === 'DOC' ? r.round : r.round - 1);
      }
    }
  });

  it('a escolha do córner altera o resultado conforme o matchup', () => {
    const grappler = mk('G', { grappling: 80, wrestling: 75, striking: 40 });
    const striker = mk('S', { striking: 80, grappling: 35, wrestling: 40 });
    const rate = (a: FighterSnapshot, b: FighterSnapshot, st: Strategy) => {
      let w = 0;
      for (let i = 0; i < 800; i++) if (fight(a, b, i, 3, () => st).result!.winner === 0) w++;
      return w / 800;
    };
    // grappler: levar para o chão é melhor do que trocar em pé
    expect(rate(grappler, striker, 'ground')).toBeGreaterThan(rate(grappler, striker, 'pressure') + 0.04);
    // trocador: levar para o chão (onde o outro é melhor) é pior do que pressionar em pé
    expect(rate(striker, grappler, 'ground')).toBeLessThan(rate(striker, grappler, 'pressure') - 0.04);
  });
});

describe('máquina de estados', () => {
  it('round → break → escolha → round → … → finished', () => {
    // dois lutadores muito defensivos para chegar ao fim
    const a = mk('A', { striking: 30, grappling: 30, defense: 90, chin: 95 });
    const b = mk('B', { striking: 30, grappling: 30, defense: 90, chin: 95 });
    let s = startFight(a, b, { rounds: 3, rngState: 99 });
    expect(s.phase).toBe('round');
    expect(chooseCorner(s, 'pressure', FIGHT_TEXT)).toBe(s); // não pode escolher no meio do round
    s = playRound(s, FIGHT_TEXT);
    expect(s.phase).toBe('break');
    expect(s.round).toBe(1);
    expect(playRound(s, FIGHT_TEXT)).toBe(s); // precisa escolher antes
    s = chooseCorner(s, 'ground', FIGHT_TEXT);
    expect(s.round).toBe(2);
    expect(s.strategy[0]).toBe('ground');
    expect(s.log.some((l) => l.kind === 'corner' && l.round === 2)).toBe(true);
    s = chooseCorner(s, 'safe', FIGHT_TEXT);
    expect(s.phase).toBe('finished');
    expect(s.result!.method).toBe('DEC');
    expect(chooseCorner(s, 'safe', FIGHT_TEXT)).toBe(s);
  });

  it('o estado é JSON puro e retomável no meio da luta', () => {
    const a = mk('A', { defense: 85, chin: 90 });
    const b = mk('B', { defense: 85, chin: 90 });
    const s1 = playRound(startFight(a, b, { rounds: 3, rngState: 5 }), FIGHT_TEXT);
    const restored = JSON.parse(JSON.stringify(s1)) as FightState;
    expect(chooseCorner(restored, 'safe', FIGHT_TEXT)).toEqual(chooseCorner(s1, 'safe', FIGHT_TEXT));
  });

  it('narração em português com nomes, estamina e dano por lance', () => {
    const f = fight(mk('Kauã', { striking: 70 }), mk('Trovão'), 3);
    expect(f.log[0]!.text).toMatch(/round/);
    expect(f.log.some((l) => l.text.includes('Kauã'))).toBe(true);
    expect(f.log.every((l) => /^[A-Z0-9🔔ÁÉÍÓÚÂÊÔÃÕÇ]/u.test(l.text))).toBe(true);
    expect(f.log.every((l) => !l.text.includes('{'))).toBe(true);
    for (const l of f.log) {
      for (const v of [...l.stamina, ...l.damage]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    }
  });

  it('regra de grappling: sem golpes, termina por finalização ou pontos', () => {
    for (let i = 0; i < 100; i++) {
      const f = simulateFight(mk('A', { grappling: 60 }), mk('B', { grappling: 50 }), { rounds: 1, rngState: seedOf(i), rules: 'grappling' }, FIGHT_TEXT);
      expect(['SUB', 'DEC']).toContain(f.result!.method);
      expect(f.log.some((l) => ['strike_land', 'strike_heavy', 'knockdown', 'ko', 'tko', 'gnp'].includes(l.kind))).toBe(false);
    }
  });
});

describe('narração', () => {
  it('não repete a mesma variação de texto em lances seguidos do mesmo tipo', () => {
    for (let i = 0; i < 50; i++) {
      const f = simulateFight(mk('A', { grappling: 70 }), mk('B'), { rounds: 1, rngState: seedOf(i), rules: 'grappling' }, FIGHT_TEXT);
      for (let j = 1; j < f.log.length; j++) {
        const [a, b] = [f.log[j - 1]!, f.log[j]!];
        if (a.kind === b.kind && FIGHT_TEXT[a.kind].length > 1) expect(b.raw).not.toBe(a.raw);
      }
    }
  });
});
