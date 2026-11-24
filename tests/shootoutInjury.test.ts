/** Pós-0.0.3: lesão própria da troca de tiro e o flag de foragido limpo ao ser pego. */
import { describe, expect, it } from 'vitest';
import { GAME_CONTENT as C } from '../src/content';
import { applyPoliceEffects, arrest, createRng, newGame, pickInjury } from '../src/engine';
import type { GameState, PoliceCareer } from '../src/engine';

function cop(seed: string): GameState {
  const g = newGame({ seed, name: 'Teste', sex: 'M', birthYear: 1995, uf: 'SP', city: 'São Paulo' }, C);
  const career: PoliceCareer = { force: 'pm', track: 'pm_praca', rank: 0, stage: 'efetivo', stageYears: 0, serviceYears: 5, rankYears: 2, merit: 20, unit: 'especial', posting: 'x', notable: [], corregedoria: 0, specialTries: 0, startAge: 22 };
  return { ...g, year: 2025, character: { ...g.character, age: 30 }, police: { ...g.police, shooting: 0, career } };
}

describe('troca de tiro', () => {
  it('ferimento vem só das lesões de tiro (nunca distensão, orelha etc.)', () => {
    const ids = new Set(C.health.injuries.filter((d) => d.sources.includes('tiro')).map((d) => d.id));
    expect([...ids].sort()).toEqual(['tiro_grave', 'tiro_raspao']);
    let wounded = 0;
    for (let i = 0; i < 400; i++) {
      const s = cop(`t${i}`);
      const r = applyPoliceEffects(s, { shootout: 'avancar' }, createRng(i), C);
      const added = r.health.injuries.slice(s.health.injuries.length);
      for (const inj of added) {
        wounded++;
        expect(ids.has(inj.defId)).toBe(true);
        expect(inj.source).toBe('tiro');
      }
    }
    expect(wounded).toBeGreaterThan(0);
  });

  it('lesões de tiro nunca saem em luta, treino ou eventos comuns', () => {
    for (const src of ['luta', 'sparring', 'treino', 'evento'] as const) {
      for (let i = 0; i < 200; i++) expect(pickInjury(createRng(i), C, src)?.id.startsWith('tiro_')).toBe(false);
    }
  });
});

describe('foragido', () => {
  it('ser pego limpa o flag de foragido', () => {
    const g = newGame({ seed: 'fug', name: 'Teste', sex: 'F', birthYear: 1995, uf: 'SP', city: 'São Paulo' }, C);
    const s: GameState = { ...g, year: 2025, character: { ...g.character, age: 30 }, flags: { ...g.flags, foragido: true } };
    const r = arrest(s, 'fuga', createRng(1), C, 'investigacao');
    expect(r.flags.foragido).toBeUndefined();
    expect(r.crime.case?.crimeId).toBe('fuga');
  });
});
