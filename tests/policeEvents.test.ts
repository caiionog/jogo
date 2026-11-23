/** Eventos policiais (release 0.0.2, fase 3): troca de tiro, investigação, força especial, NPCs presos, dilemas. */
import { describe, expect, it } from 'vitest';
import { GAME_CONTENT as C } from '../src/content';
import { POLICE_EVENTS } from '../src/content/events/police';
import {
  applyPoliceEffects,
  caseSolveChance,
  createRng,
  newGame,
  relationsOf,
  resolveEvent,
  rollShootout,
  shootoutOdds,
  SHOOTOUT_LUCK,
  specialBlockReason,
  trySpecialCourse,
} from '../src/engine';
import type { GameState, PoliceCareer, PoliceForce, ShootoutTactic } from '../src/engine';

function cop(force: PoliceForce = 'pm', patch: Partial<PoliceCareer> = {}, seed = 'cop', extra: Partial<GameState> = {}): GameState {
  const g = newGame({ seed, name: 'Teste', sex: 'M', birthYear: 1995, uf: 'SP', city: 'São Paulo' }, C);
  const career: PoliceCareer = { force, track: force === 'pm' ? 'pm_praca' : 'civil_investigador', rank: 0, stage: 'efetivo', stageYears: 0, serviceYears: 5, rankYears: 2, merit: 20, unit: 'regular', posting: '3º Batalhão', notable: [], corregedoria: 0, specialTries: 0, startAge: 22 };
  return {
    ...g,
    year: 2025,
    character: { ...g.character, age: 30, stats: { ...g.character.stats, athletic: 75, health: 90, intelligence: 60 } },
    police: { ...g.police, shooting: 70, career: { ...career, ...patch } },
    economy: { ...g.economy, job: { jobId: force === 'pm' ? 'policia_militar' : 'policia_civil', level: 1, performance: 50, years: 5 } },
    ...extra,
  };
}

const withLuck = (s: GameState, luck: number): GameState => ({ ...s, character: { ...s.character, luck } });

describe('conteúdo', () => {
  it('pelo menos 25 eventos policiais, ids "pol_"', () => {
    expect(POLICE_EVENTS.length).toBeGreaterThanOrEqual(25);
    for (const e of POLICE_EVENTS) expect(e.id.startsWith('pol_')).toBe(true);
  });

  it('nenhum texto gráfico: sem sangue, tripas ou detalhes de ferimento', () => {
    const txt = JSON.stringify({ e: POLICE_EVENTS, t: C.police.shootoutText }).toLowerCase();
    for (const w of ['sangue', 'sangr', 'tripa', 'miolo', 'cadáver', 'decapit', 'esquartej']) expect(txt).not.toContain(w);
  });
});

describe('troca de tiro', () => {
  const tactics: ShootoutTactic[] = ['avancar', 'abrigar', 'negociar', 'recuar'];

  it('probabilidades somam 1 e são determinísticas pela seed', () => {
    const s = cop();
    for (const t of tactics) {
      const o = shootoutOdds(s, t);
      expect(Object.values(o).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
      expect(rollShootout(s, t, createRng(42))).toBe(rollShootout(s, t, createRng(42)));
    }
    const a = applyPoliceEffects(s, { shootout: 'avancar' }, createRng(7), C);
    const b = applyPoliceEffects(s, { shootout: 'avancar' }, createRng(7), C);
    expect(a).toEqual(b);
  });

  it('a sorte inclina sem decidir sozinha (no máximo ±20% em cada resultado)', () => {
    const azar = shootoutOdds(withLuck(cop(), 0), 'avancar');
    const sorte = shootoutOdds(withLuck(cop(), 100), 'avancar');
    const media = shootoutOdds(withLuck(cop(), 50), 'avancar');
    expect(sorte.preso).toBeGreaterThan(azar.preso);
    expect(sorte.morte).toBeLessThan(azar.morte);
    expect(sorte.preso / media.preso).toBeLessThanOrEqual(1 + SHOOTOUT_LUCK + 1e-9);
    expect(azar.morte / media.morte).toBeLessThanOrEqual(1 + SHOOTOUT_LUCK + 1e-9);
    // a mesma sorte com Tiro baixo prende menos que Tiro alto
    const ruim = shootoutOdds(withLuck({ ...cop(), police: { ...cop().police, shooting: 5 } }, 100), 'avancar');
    expect(ruim.preso).toBeLessThan(media.preso);
  });

  it('recuar é mais seguro; a força especial corre mais risco; morte é rara', () => {
    const s = cop();
    expect(shootoutOdds(s, 'recuar').morte).toBeLessThan(shootoutOdds(s, 'avancar').morte);
    const esp = cop('pm', { unit: 'especial' });
    expect(shootoutOdds(esp, 'avancar').morte).toBeGreaterThan(shootoutOdds(s, 'avancar').morte);
    expect(shootoutOdds(s, 'avancar').morte).toBeLessThan(0.02);
  });

  it('morte em serviço passa por killCharacter (resolveEvent)', () => {
    let died = 0;
    for (let i = 0; i < 400 && !died; i++) {
      const s = { ...cop('pm', { unit: 'especial' }, `m${i}`), police: { ...cop().police, shooting: 0, career: { ...cop().police.career!, unit: 'especial' as const } }, pendingEvents: [{ eventId: 'pol_especial_missao', source: 'random' as const }] };
      const r = resolveEvent(s, 'pol_especial_missao', 'avancar', C);
      if (!r.alive) {
        died++;
        expect(r.character.death?.cause).toContain('Morte em serviço');
      }
    }
    expect(died).toBeGreaterThan(0);
  });
});

describe('investigação encadeada', () => {
  const play = (seed: string, choices: string[]): GameState => {
    let s: GameState = { ...cop('civil', {}, seed), pendingEvents: [{ eventId: 'pol_caso_carga_1', source: 'random' }] };
    for (const ch of choices) {
      const ev = s.pendingEvents[0]!;
      s = resolveEvent(s, ev.eventId, ch, C);
    }
    return s;
  };

  it('abre o caso, soma pistas e fecha (sem caso aberto no fim); determinístico', () => {
    const a = play('inv', ['cameras', 'campana', 'provas']);
    expect(a.police.case).toBeNull();
    expect(a.pendingEvents).toHaveLength(0);
    expect(a).toEqual(play('inv', ['cameras', 'campana', 'provas']));
  });

  it('boas escolhas resolvem muito mais que más escolhas', () => {
    let good = 0;
    let bad = 0;
    for (let i = 0; i < 300; i++) {
      if ((play(`g${i}`, ['cameras', 'campana', 'provas']).feats.casesSolved ?? 0) > 0) good++;
      if ((play(`g${i}`, ['esperar', 'pressionar', 'agora']).feats.casesSolved ?? 0) > 0) bad++;
    }
    expect(good).toBeGreaterThan(bad * 3);
  });

  it('a sorte inclina pouco a chance de resolver', () => {
    const s = cop('civil');
    expect(caseSolveChance(withLuck(s, 100), 3) - caseSolveChance(withLuck(s, 0), 3)).toBeLessThanOrEqual(0.1 + 1e-9);
  });
});

describe('força especial', () => {
  it('exige anos de serviço, atlética, Tiro e saúde', () => {
    expect(specialBlockReason(cop('pm', { serviceYears: 1 }), C)).toBe('service');
    expect(specialBlockReason({ ...cop(), police: { ...cop().police, shooting: 30 } }, C)).toBe('shooting');
    expect(specialBlockReason(cop('pm', { stage: 'probatorio' }), C)).toBe('stage');
    expect(specialBlockReason(cop(), C)).toBeNull();
  });

  it('taxa de aprovação dos candidatos entre 10% e 25%', () => {
    let passed = 0;
    const N = 1500;
    for (let i = 0; i < N; i++) {
      const r = createRng(9000 + i);
      const base = cop('pm', {}, `sp${i}`);
      let s: GameState = withLuck({ ...base, rngState: 77 + i, police: { ...base.police, shooting: r.int(65, 88) }, character: { ...base.character, stats: { ...base.character.stats, athletic: r.int(68, 92), health: r.int(70, 100) } } }, r.int(0, 100));
      s = trySpecialCourse(s, C);
      for (let step = 0; step < 3 && s.pendingEvents.length; step++) s = resolveEvent(s, s.pendingEvents[0]!.eventId, 'seguir', C);
      if (s.police.career?.unit === 'especial') passed++;
    }
    expect(passed / N).toBeGreaterThan(0.1);
    expect(passed / N).toBeLessThan(0.25);
  });
});

describe('NPCs presos e dilemas', () => {
  it('prender cria um conhecido marcado que pode voltar', () => {
    const s = applyPoliceEffects(cop(), { arrest: true }, createRng(1), C);
    const p = relationsOf(s, ['conhecido']);
    expect(p).toHaveLength(1);
    expect(p[0]!.person.flags.preso_por_voce).toBe(true);
    expect(s.feats.arrests).toBe(1);
  });

  it('propina entra no extrato como dinheiro ilícito e vira dinheiro sujo', () => {
    const s = { ...cop(), pendingEvents: [{ eventId: 'pol_propina', source: 'random' as const }] };
    const r = resolveEvent(s, 'pol_propina', 'aceitar', C);
    expect(r.economy.ledger.entries.some((e) => e.cat === 'crime' && e.amount === 1500)).toBe(true);
    expect(r.crime.dirty).toBe(1500);
  });

  it('exoneração pela corregedoria encerra a carreira', () => {
    const r = applyPoliceEffects(cop(), { exonerate: true }, createRng(1), C);
    expect(r.police.career).toBeNull();
    expect(r.police.past.at(-1)?.reason).toBe('exoneracao');
  });
});
