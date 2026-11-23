/** Cruzamentos (release 0.0.2, fase 8): polícia × crime × luta × família. */
import { describe, expect, it } from 'vitest';
import { GAME_CONTENT as C } from '../src/content';
import { commitCrime, createRng, imprison, newGame, policeYear, resolveEvent } from '../src/engine';
import type { GameState, PoliceCareer } from '../src/engine';

function base(seed = 'x'): GameState {
  const g = newGame({ seed, name: 'Teste', sex: 'M', birthYear: 2000, uf: 'SP', city: 'São Paulo' }, C);
  return { ...g, year: 2030, money: 1000, character: { ...g.character, age: 30 }, economy: { ...g.economy, ledger: { year: 2030, opening: 1000, entries: [] } } };
}

const career: PoliceCareer = { force: 'pm', track: 'pm_praca', rank: 0, stage: 'efetivo', stageYears: 0, serviceYears: 6, rankYears: 2, merit: 10, unit: 'regular', posting: 'x', notable: [], corregedoria: 5, specialTries: 0, startAge: 22 };

describe('lutador', () => {
  it('ser preso cancela contrato, empresário e patrocínios', () => {
    const b = base();
    const s = { ...b, fighter: { ...b.fighter, orgId: 'titan', reputation: 50 }, economy: { ...b.economy, sponsors: [{ sponsorId: 'energetico_choque', yearsLeft: 2, amount: 40000 }], contract: { orgId: 'titan' } as never } };
    const p = imprison(s, 10, C);
    expect(p.fighter.orgId).toBeNull();
    expect(p.economy.sponsors).toEqual([]);
    expect(p.economy.contract).toBeNull();
    expect(p.fighter.reputation).toBe(40);
  });

  it('lutador profissional que briga na rua perde reputação', () => {
    let hit = false;
    for (let i = 0; i < 40 && !hit; i++) {
      const b = base(`b${i}`);
      const s = { ...b, rngState: i, fighter: { ...b.fighter, reputation: 30, pro: { ...b.fighter.pro, wins: 3 } } };
      const r = commitCrime(s, 'briga_rua', C);
      if (r.crime.wanted > 0 && r.crime.record.length === 0 && r.fighter.reputation < 30) hit = true;
    }
    expect(hit).toBe(true);
  });

  it('o egresso pode recomeçar na luta (evento de redenção)', () => {
    const b = base();
    const s: GameState = { ...b, flags: { recomecou: true }, crime: { ...b.crime, record: [{ age: 25, year: 2025, crime: 'furto_carro', kind: 'condenacao', years: 2 }] }, pendingEvents: [{ eventId: 'cruz_redencao_luta', source: 'random' }] };
    const r = resolveEvent(s, 'cruz_redencao_luta', 'aceitar', C);
    expect(r.fighter.gymId).not.toBeNull();
    expect(r.flags.redencao_luta).toBe(true);
  });
});

describe('policial', () => {
  it('corregedoria demais leva à prisão por corrupção e ao processo (ala especial)', () => {
    let opened = 0;
    for (let i = 0; i < 100; i++) {
      const b = base(`c${i}`);
      const s = policeYear({ ...b, police: { ...b.police, career } }, createRng(i), C);
      if (s.crime.case) {
        opened++;
        expect(s.crime.case.crimeId).toBe('corrupcao');
        expect(s.crime.case.wasPolice).toBe(true);
      }
    }
    expect(opened).toBeGreaterThan(15);
  });
});
