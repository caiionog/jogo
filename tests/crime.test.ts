/** Delitos (release 0.0.2, fase 4): idade mínima, procurado sobe e desce, dinheiro sujo, lavagem, plano, menores. */
import { describe, expect, it } from 'vitest';
import { GAME_CONTENT as C } from '../src/content';
import {
  advanceYear,
  commitCrime,
  crimeAllowed,
  crimeBlockReason,
  crimeDef,
  crimeYear,
  createRng,
  launderMoney,
  newGame,
  post,
  resolveEvent,
  startPlan,
  wantedHint,
} from '../src/engine';
import type { GameState } from '../src/engine';

const NO_EV = { ...C, events: [] };

function at(age: number, seed = 'crime', patch: Partial<GameState['crime']> = {}): GameState {
  const g = newGame({ seed, name: 'Teste', sex: 'M', birthYear: 2000, uf: 'SP', city: 'São Paulo' }, C);
  return { ...g, year: 2000 + age, money: 1000, character: { ...g.character, age }, crime: { ...g.crime, ...patch }, economy: { ...g.economy, ledger: { year: 2000 + age, opening: 1000, entries: [] } } };
}

const invariant = (s: GameState) => expect(s.money - s.economy.ledger.opening).toBe(s.economy.ledger.entries.reduce((t, e) => t + e.amount, 0));

describe('idade mínima por categoria (guarda única)', () => {
  it('leves a partir dos 12; médios e graves só com 18+', () => {
    const leve = crimeDef(C, 'furto_loja')!;
    const medio = crimeDef(C, 'furto_carro')!;
    const grave = crimeDef(C, 'assalto_pedestre')!;
    expect(crimeAllowed(at(11), leve)).toBe(false);
    expect(crimeAllowed(at(12), leve)).toBe(true);
    expect(crimeAllowed(at(17), medio)).toBe(false);
    expect(crimeAllowed(at(17), grave)).toBe(false);
    expect(crimeAllowed(at(17), 'faccao')).toBe(false);
    expect(crimeAllowed(at(17), 'trafico')).toBe(false);
    expect(crimeAllowed(at(18), grave)).toBe(true);
    expect(crimeBlockReason(at(16, 'x', { rep: 90 }), 'assalto_banco', C)).toBe('age');
    // menor tentando um grave: nada muda
    const kid = at(16, 'k', { rep: 90 });
    expect(commitCrime(kid, 'assalto_pedestre', C)).toBe(kid);
    expect(startPlan(kid, 'assalto_banco', C)).toBe(kid);
  });

  it('todo delito médio/grave tem minAge 18; leve, 12', () => {
    for (const c of C.crime.crimes) expect(c.minAge).toBe(c.tier === 'leve' ? 12 : 18);
  });
});

describe('procurado e reputação', () => {
  it('o procurado sobe com o delito e cai 15 por ano', () => {
    let s = at(25);
    for (let i = 0; i < 2; i++) s = commitCrime({ ...s, rngState: 10 + i }, 'estelionato', C);
    expect(s.crime.wanted).toBeGreaterThan(0);
    const w = s.crime.wanted;
    const next = crimeYear({ ...s, crime: { ...s.crime, wanted: Math.min(w, 19) } }, createRng(1), C);
    expect(next.crime.wanted).toBe(Math.max(0, Math.min(w, 19) - 15));
  });

  it('procurado alto leva a investigação e prisão (passagem na ficha)', () => {
    let presos = 0;
    for (let i = 0; i < 200; i++) if (crimeYear(at(25, `w${i}`, { wanted: 90 }), createRng(i), C).crime.record.length) presos++;
    expect(presos).toBeGreaterThan(50);
    expect(presos).toBeLessThan(150);
  });

  it('pistas só em palavras', () => {
    expect(wantedHint(5)).toBeNull();
    expect(wantedHint(25, 'F')).toBe('Você sente que está sendo observada.');
  });
});

describe('dinheiro sujo', () => {
  it('o ganho do crime entra como "crime" no extrato e soma no sujo', () => {
    let found = false;
    for (let i = 0; i < 40 && !found; i++) {
      const s = commitCrime({ ...at(25, `d${i}`), rngState: i }, 'receptacao', C);
      const gain = s.economy.ledger.entries.find((e) => e.cat === 'crime');
      if (gain) {
        found = true;
        expect(s.crime.dirty).toBe(gain.amount);
        invariant(s);
      }
    }
    expect(found).toBe(true);
  });

  it('gastar muito com dinheiro sujo agenda o evento de suspeita', () => {
    let hits = 0;
    for (let i = 0; i < 50; i++) {
      let s = post(at(30, `s${i}`), 'crime', 80000, 'Golpe');
      s = post(s, 'compras', -60000, 'Carro');
      const n = crimeYear(s, createRng(i), C);
      if (n.scheduledEvents.some((e) => e.eventId === C.crime.suspicionEventId)) hits++;
    }
    expect(hits).toBeGreaterThan(15);
  });

  it('lavar pelo negócio reduz o sujo, cobra taxa e mantém a invariante do extrato', () => {
    let s = post(at(30), 'crime', 50000, 'Golpe');
    s = { ...s, economy: { ...s.economy, businesses: [{ id: 'b1' } as never] } };
    const l = launderMoney(s, C);
    expect(l.crime.dirty).toBeLessThan(s.crime.dirty);
    expect(l.money).toBeLessThan(s.money);
    invariant(l);
    expect(launderMoney(l, C)).toBe(l);
  });
});

describe('planejamento dos graves', () => {
  it('etapas abstratas: equipe → alvo → momento → hora H (seguir executa; abortar cancela)', () => {
    let s = startPlan(at(30, 'p', { rep: 20 }), 'assalto_comercio', C);
    expect(s.crime.plan?.crimeId).toBe('assalto_comercio');
    for (const ch of ['amigos', 'medio', 'noite']) s = resolveEvent(s, s.pendingEvents[0]!.eventId, ch, C);
    expect(s.pendingEvents[0]!.eventId).toBe('crime_plano_hora');
    const abort = resolveEvent(s, 'crime_plano_hora', 'abortar', C);
    expect(abort.crime.plan).toBeNull();
    expect(abort.crime.committed ?? 0).toBe(0);
    const go = resolveEvent(s, 'crime_plano_hora', 'seguir', C);
    expect(go.crime.plan).toBeNull();
    expect(go.crime.committed).toBe(1);
  });
});

describe('menores: só medida socioeducativa', () => {
  it('ser pego aos 15 vai para a ficha juvenil, não para a ficha de adulto', () => {
    let caught: GameState | null = null;
    for (let i = 0; i < 80 && !caught; i++) {
      const s = commitCrime({ ...at(15, `j${i}`), rngState: i }, 'furto_loja', C);
      if (s.crime.juvenile.length) caught = s;
    }
    expect(caught).not.toBeNull();
    expect(caught!.crime.record).toHaveLength(0);
  });

  it('a ficha juvenil não bloqueia o concurso depois dos 18', async () => {
    const { policeExamGaps, trackDef } = await import('../src/engine');
    const s = at(20, 'jj', { juvenile: [{ age: 15, year: 2015, crime: 'pichacao', kind: 'passagem' }] });
    const adult = { ...s, education: { ...s.education, graduated: true, current: null } };
    expect(policeExamGaps(adult, trackDef(C, 'pm_praca')!)).toEqual([]);
  });

  it('vidas simuladas: o procurado volta a zero com o tempo', () => {
    let s = at(25, 'tempo', { wanted: 60 });
    s = { ...s, crime: { ...s.crime, wanted: 60 } };
    for (let i = 0; i < 6; i++) s = advanceYear(s, NO_EV);
    expect(s.crime.wanted).toBe(0);
  });
});
