import { describe, expect, it } from 'vitest';
import { withInjury } from './healthHelpers';
import { GAME_CONTENT } from '../src/content';
import { TITLE_SHOT_STREAK, createRng, emptyRecord, findMatches, isOrgEligible, meetsOrgRequirements, orgRequirementGap, rankOf, recentProWinRate, signWith } from '../src/engine';
import type { FightHistoryEntry } from '../src/engine';
import { fighterGame, roster } from './fightHelpers';

const org = (id: string) => GAME_CONTENT.fighting.orgs.find((o) => o.id === id)!;
const rec = (wins: number, losses = 0) => ({ ...emptyRecord(), wins, losses });
const hist = (results: ('W' | 'L')[]): FightHistoryEntry[] =>
  results.map((r, i) => ({ age: 20 + i, year: 2020 + i, orgId: 'arc', opponent: 'X', result: r, method: 'DEC', round: 3, title: false, pro: true }));

describe('requisitos de entrada', () => {
  it('idade mínima e máxima (kids 6–14, regional 18+)', () => {
    expect(meetsOrgRequirements(fighterGame(10), org('kids_dente_de_leao'))).toBe(true);
    expect(orgRequirementGap(fighterGame(15), org('kids_dente_de_leao'))).toBe('age');
    expect(orgRequirementGap(fighterGame(17, {}, { amateur: rec(10), reputation: 50 }), org('arc'))).toBe('age');
  });

  it('regional exige vitórias amadoras e reputação', () => {
    expect(orgRequirementGap(fighterGame(19, {}, { amateur: rec(1), reputation: 40 }), org('arc'))).toBe('amateur-wins');
    expect(orgRequirementGap(fighterGame(19, {}, { amateur: rec(5), reputation: 5 }), org('arc'))).toBe('reputation');
    expect(meetsOrgRequirements(fighterGame(19, {}, { amateur: rec(5), reputation: 20 }), org('arc'))).toBe(true);
  });

  it('liga principal exige vitórias pro, reputação, boa fase recente e idade de assinatura', () => {
    const good = { pro: rec(11, 2), reputation: 60, history: hist(['W', 'W', 'L', 'W', 'W', 'W', 'W', 'W', 'L', 'W']) };
    expect(meetsOrgRequirements(fighterGame(25, {}, good), org('titan'))).toBe(true);
    expect(orgRequirementGap(fighterGame(25, {}, { ...good, pro: rec(8) }), org('titan'))).toBe('pro-wins');
    // as vitórias antigas não contam: só as últimas 10 lutas
    const slump = { ...good, history: hist(['W', 'W', 'W', 'W', 'W', 'W', 'L', 'L', 'L', 'W', 'L', 'L', 'W', 'L', 'W']) };
    expect(recentProWinRate(fighterGame(25, {}, slump))).toBeLessThan(0.6);
    expect(orgRequirementGap(fighterGame(25, {}, slump), org('titan'))).toBe('win-rate');
    expect(orgRequirementGap(fighterGame(34, {}, good), org('titan'))).toBe('signing-age');
  });

  it('propostas só para organizações de nível acima do contrato atual', () => {
    const g = fighterGame(20, {}, { amateur: rec(5), reputation: 30 });
    expect(isOrgEligible(g, org('arc'), GAME_CONTENT)).toBe(true);
    const signed = signWith(g, 'lfm', GAME_CONTENT);
    expect(signed.fighter.orgId).toBe('lfm');
    expect(isOrgEligible(signed, org('arc'), GAME_CONTENT)).toBe(false); // mesmo nível
    expect(isOrgEligible(g, org('amador_punho_de_ferro'), GAME_CONTENT)).toBe(false); // sem contrato
    expect(isOrgEligible(withInjury(g, 'lca', 12), org('arc'), GAME_CONTENT)).toBe(false);
  });

  it('assinar materializa o elenco da categoria e deixa o jogador fora do ranking', () => {
    const g = signWith(fighterGame(20, {}, { amateur: rec(5), reputation: 30 }), 'arc', GAME_CONTENT);
    const keys = Object.keys(g.world.rosters);
    expect(keys).toHaveLength(1);
    const r = g.world.rosters[keys[0]!]!;
    expect(r.ranking).toHaveLength(10);
    expect(r.champion).toBeTruthy();
    expect(rankOf(r, 'player')).toBeNull();
    expect(g.log.at(-1)!.entries.at(-1)).toMatch(/Arena Regional de Combate/);
  });
});

describe('matchmaking', () => {
  const ids = Array.from({ length: 10 }, (_, i) => `r${i + 1}`);

  it('sem ranking: enfrenta não ranqueados ou os últimos do ranking', () => {
    const r = roster(ids, 'champ', ['u1', 'u2', 'u3']);
    for (let i = 0; i < 20; i++) {
      for (const m of findMatches(r, 0, 2, createRng(i))) {
        expect(m.title).toBe(false);
        expect(['u1', 'u2', 'u3', 'r8', 'r9', 'r10']).toContain(m.npcId);
      }
    }
  });

  it('ranqueado: adversários próximos (r−3 a r+3)', () => {
    const r = roster([...ids.slice(0, 5), 'player', ...ids.slice(5, 9)], 'champ');
    for (let i = 0; i < 20; i++) {
      for (const m of findMatches(r, 0, 2, createRng(i))) {
        const pos = rankOf(r, m.npcId)!;
        expect(Math.abs(pos - 6)).toBeLessThanOrEqual(4);
        expect(m.title).toBe(false);
      }
    }
  });

  it('top 3 com sequência de vitórias ganha disputa de cinturão', () => {
    const r = roster(['r1', 'player', ...ids.slice(2)], 'champ');
    expect(findMatches(r, TITLE_SHOT_STREAK, 2, createRng(1))[0]).toEqual({ npcId: 'champ', title: true });
    expect(findMatches(r, TITLE_SHOT_STREAK - 1, 2, createRng(1)).some((m) => m.title)).toBe(false);
    const far = roster([...ids.slice(0, 5), 'player'], 'champ');
    expect(findMatches(far, 10, 2, createRng(1)).some((m) => m.title)).toBe(false);
  });

  it('campeão: defesa contra o top 3', () => {
    const r = roster(ids, 'player');
    const m = findMatches(r, 0, 2, createRng(3));
    expect(m).toHaveLength(1);
    expect(m[0]!.title).toBe(true);
    expect(['r1', 'r2', 'r3']).toContain(m[0]!.npcId);
  });
});

describe('estreia profissional', () => {
  it('estreantes (< 3 lutas pro) enfrentam só não ranqueados', () => {
    const ids = Array.from({ length: 10 }, (_, i) => `r${i + 1}`);
    const r = roster(ids, 'champ', ['u1', 'u2']);
    for (let i = 0; i < 20; i++) for (const m of findMatches(r, 0, 2, createRng(i), 0)) expect(['u1', 'u2']).toContain(m.npcId);
  });
});
