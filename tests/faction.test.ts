/** Facções e tráfico (release 0.0.2, fase 5). */
import { describe, expect, it } from 'vitest';
import { GAME_CONTENT as C } from '../src/content';
import {
  advanceYear,
  applyCrimeEffects,
  createRng,
  factionAtWar,
  factionsHere,
  joinFaction,
  newGame,
  resolveEvent,
  startTrafficking,
  traffickingYear,
  tryLeaveFaction,
  factionYear,
} from '../src/engine';
import type { GameState } from '../src/engine';

function at(age: number, uf = 'SP', city = 'São Paulo', seed = 'fac', patch: Partial<GameState['crime']> = {}): GameState {
  const g = newGame({ seed, name: 'Teste', sex: 'M', birthYear: 2000, uf, city }, C);
  return { ...g, year: 2000 + age, money: 1000, character: { ...g.character, age }, crime: { ...g.crime, ...patch }, economy: { ...g.economy, ledger: { year: 2000 + age, opening: 1000, entries: [] } } };
}

describe('facções em dados', () => {
  it('pelo menos 4, com território, rivais existentes e regras', () => {
    expect(C.crime.factions.length).toBeGreaterThanOrEqual(4);
    const ids = new Set(C.crime.factions.map((f) => f.id));
    for (const f of C.crime.factions) {
      expect(f.territory.ufs.length).toBeGreaterThan(0);
      expect(f.rules.length).toBeGreaterThan(0);
      for (const r of f.rivals) expect(ids.has(r)).toBe(true);
    }
    expect(C.crime.factionRanks).toEqual(['Membro', 'Soldado', 'Gerente', 'Liderança regional', 'Cúpula']);
  });
});

describe('entrada', () => {
  it('só por convite e só com 18+', () => {
    expect(joinFaction(at(17), 'local', createRng(1), C).crime.faction).toBeNull();
    expect(joinFaction(at(18), 'local', createRng(1), C).crime.faction?.id).toBe(factionsHere(at(18), C)[0]!.id);
    // o convite (evento) exige reputação e 18+
    const inv = C.events.find((e) => e.id === 'crime_faccao_convite')!;
    expect(inv.conditions.minAge).toBe(18);
    expect(inv.conditions.crime?.rep?.min).toBeGreaterThan(0);
  });

  it('a família se afasta ao entrar', () => {
    const s = at(25);
    const mom = s.relationships.relations.find((r) => r.type === 'mae');
    const j = joinFaction(s, 'local', createRng(2), C);
    if (mom) expect(j.relationships.relations.find((r) => r.personId === mom.personId)!.affection).toBeLessThan(mom.affection);
  });
});

describe('vida na facção', () => {
  it('rivalidade no território gera guerra (condição e evento)', () => {
    // a Liga manda em SP; o Clã também está em SP e é rival da Maré, não da Liga → sem guerra para a Liga
    const sp = joinFaction(at(25), 'liga', createRng(1), C);
    expect(factionAtWar(sp, C)).toBe(false);
    // membro da Maré em SP: Liga e Clã são rivais da Maré
    const mare = joinFaction(at(25), 'mare', createRng(1), C);
    expect(factionAtWar(mare, C)).toBe(true);
    const ev = C.events.find((e) => e.id === 'crime_faccao_guerra')!;
    expect(ev.conditions.crime?.factionWar).toBe(true);
  });

  it('o ano na facção paga, agenda a missão e aumenta o procurado', () => {
    const s = joinFaction(at(25), 'liga', createRng(1), C);
    const y = factionYear(s, createRng(3), C);
    expect(y.economy.ledger.entries.some((e) => e.cat === 'crime')).toBe(true);
    expect(y.scheduledEvents.some((e) => e.eventId === C.crime.factionEvents.mission)).toBe(true);
    expect(y.crime.wanted).toBeGreaterThan(s.crime.wanted);
  });

  it('recusar a missão vira dívida', () => {
    const s = joinFaction(at(25), 'liga', createRng(1), C);
    const d = applyCrimeEffects(s, { factionDebt: 15000 }, createRng(1), C);
    expect(d.crime.faction!.debt).toBe(15000);
  });

  it('sair é possível, mas arriscado (algumas tentativas terminam em morte)', () => {
    let out = 0;
    let dead = 0;
    for (let i = 0; i < 300; i++) {
      let s = joinFaction({ ...at(30, 'SP', 'São Paulo', `l${i}`), money: 100000 }, 'liga', createRng(i), C);
      s = { ...s, economy: { ...s.economy, ledger: { ...s.economy.ledger, opening: s.money - s.economy.ledger.entries.reduce((t, e) => t + e.amount, 0) } } };
      s = tryLeaveFaction(s, C);
      expect(s.pendingEvents[0]!.eventId).toBe('crime_faccao_saida');
      s = resolveEvent(s, 'crime_faccao_saida', ['pagar', 'fugir', 'igreja'][i % 3]!, C);
      if (!s.alive) dead++;
      else if (!s.crime.faction) out++;
    }
    expect(out).toBeGreaterThan(150);
    expect(dead).toBeGreaterThan(10);
  });
});

describe('tráfico', () => {
  it('só 18+, com reputação; lucro anual e risco', () => {
    expect(startTrafficking(at(17, 'SP', 'São Paulo', 't', { rep: 90 }), 'pequeno').crime.trafficking).toBeNull();
    expect(startTrafficking(at(20, 'SP', 'São Paulo', 't', { rep: 0 }), 'pequeno').crime.trafficking).toBeNull();
    const s = startTrafficking(at(20, 'SP', 'São Paulo', 't', { rep: 10 }), 'pequeno');
    expect(s.crime.trafficking?.level).toBe('pequeno');
    let profit = 0;
    let arrested = 0;
    let dead = 0;
    for (let i = 0; i < 300; i++) {
      const y = traffickingYear(s, createRng(i), C);
      if (!y.alive) dead++;
      if (y.crime.record.length) arrested++;
      profit += y.economy.ledger.entries.filter((e) => e.cat === 'crime').reduce((t, e) => t + e.amount, 0);
    }
    expect(profit / 300).toBeGreaterThan(10000);
    expect(arrested).toBeGreaterThan(15);
    expect(dead).toBeGreaterThan(0);
  });

  it('em vidas longas no tráfico, quase sempre termina mal', () => {
    let bad = 0;
    for (let i = 0; i < 100; i++) {
      let s = startTrafficking(at(20, 'SP', 'São Paulo', `tl${i}`, { rep: 30 }), 'medio');
      for (let y = 0; y < 10 && s.alive && s.crime.record.length === 0; y++) s = advanceYear(s, { ...C, events: [] });
      if (!s.alive || s.crime.record.length) bad++;
    }
    expect(bad).toBeGreaterThan(80);
  });
});
