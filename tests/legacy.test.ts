import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import {
  advanceYear,
  continueAsChild,
  continuableHeirs,
  defaultShares,
  effectiveShares,
  getPerson,
  killCharacter,
  makeWill,
  netWorth,
  relationsOf,
  splitEstate,
  updatePerson,
} from '../src/engine';
import type { GameState, Person } from '../src/engine';
import { adult, ledgerOk } from './ecoHelpers';
import { resolveAllFirst } from './helpers';
import { withPerson } from './relHelpers';

const C = GAME_CONTENT;

/** Adulto sem a família de origem (só o que o teste adicionar). */
function bare(age = 60, money = 1_000_000, seed = 'legado'): GameState {
  const g = adult(age, money, seed);
  return { ...g, relationships: { ...g.relationships, people: [], relations: [] } };
}

function family(withSpouse = true, kids = 2): { g: GameState; spouse?: Person; children: Person[] } {
  let g = bare();
  let spouse: Person | undefined;
  if (withSpouse) [g, spouse] = withPerson(g, 'conjuge', 58, { sex: 'F', stage: 'casados' });
  const children: Person[] = [];
  for (let i = 0; i < kids; i++) {
    let p: Person;
    [g, p] = withPerson(g, 'filho', 30 - i * 3, { sex: i % 2 ? 'F' : 'M' });
    children.push(p);
  }
  return spouse ? { g, spouse, children } : { g, children };
}

describe('testamento e partilha', () => {
  it('divisão padrão (dados): cônjuge 50% + filhos dividem 50%', () => {
    const { g, spouse, children } = family();
    const sh = defaultShares(g, C);
    expect(sh[spouse!.id]).toBe(50);
    expect(sh[children[0]!.id]).toBe(25);
    expect(sh[children[1]!.id]).toBe(25);
  });

  it('padrão: só filhos → 100% entre eles; só cônjuge → 100%; ninguém → irmãos', () => {
    expect(Object.values(defaultShares(family(false, 2).g, C))).toEqual([50, 50]);
    const onlySpouse = family(true, 0);
    expect(defaultShares(onlySpouse.g, C)).toEqual({ [onlySpouse.spouse!.id]: 100 });
    const [g, sib] = withPerson(bare(), 'irmao', 55);
    expect(defaultShares(g, C)).toEqual({ [sib.id]: 100 });
  });

  it('testamento: porcentagens corretas, imposto de herança e valores', () => {
    const { g: g0, spouse, children } = family();
    const g = makeWill(g0, { [children[0]!.id]: 70, [children[1]!.id]: 20, [spouse!.id]: 10 });
    expect(g.economy.will).not.toBeNull();
    const est = splitEstate(g, C);
    expect(est.byWill).toBe(true);
    expect(est.gross).toBe(netWorth(g));
    expect(est.tax).toBe(Math.round(est.gross * C.legacy.inheritanceTax));
    const by = Object.fromEntries(est.heirs.map((h) => [h.personId, h.amount]));
    expect(by[children[0]!.id]).toBe(Math.round(est.net * 0.7));
    expect(by[children[1]!.id]).toBe(Math.round(est.net * 0.2));
    expect(by[spouse!.id]).toBe(Math.round(est.net * 0.1));
  });

  it('testamento inválido é recusado; herdeiro morto tem a parte redistribuída', () => {
    const { g: g0, children } = family(false, 2);
    expect(makeWill(g0, { [children[0]!.id]: 60 })).toBe(g0); // soma ≠ 100
    expect(makeWill(g0, { estranho: 100 })).toBe(g0); // não é herdeiro
    let g = makeWill(g0, { [children[0]!.id]: 50, [children[1]!.id]: 50 });
    g = updatePerson(g, children[1]!.id, (p) => ({ ...p, alive: false }));
    expect(effectiveShares(g, C).shares).toEqual({ [children[0]!.id]: 100 });
  });

  it('na morte, cada herdeiro NPC recebe a parte no patrimônio dele', () => {
    const { g, spouse } = family();
    const dead = killCharacter(g, 'causas naturais', C);
    expect(dead.alive).toBe(false);
    expect(dead.ending!.heirs.length).toBe(3);
    const sp = dead.ending!.heirs.find((h) => h.personId === spouse!.id)!;
    expect(getPerson(dead, spouse!.id)!.wealth).toBe(sp.amount);
    expect(dead.ending!.obituary.lines.join(' ')).toMatch(/Deixa/);
  });
});

describe('continuar como filho(a)', () => {
  function deadParent(): { dead: GameState; heir: Person; sibling: Person } {
    let { g, children } = family();
    // academia própria da família + casa + avó viva
    g = { ...g, feats: { ...g.feats, peakRep: 80, majorTitles: 1 } };
    let grandma: Person;
    [g, grandma] = withPerson(g, 'mae', 82, { sex: 'F' });
    void grandma;
    g = updatePerson(g, children[0]!.id, (p) => ({ ...p, flags: { ...p.flags, lutador_mirim: true, interesse_luta: true } }));
    const dead = killCharacter(g, 'causas naturais', C);
    return { dead, heir: children[0]!, sibling: children[1]! };
  }

  it('transfere herança, relações e mundo, e incrementa a geração', () => {
    const { dead, heir, sibling } = deadParent();
    expect(continuableHeirs(dead).map((h) => h.personId)).toContain(heir.id);
    const share = dead.ending!.heirs.find((h) => h.personId === heir.id)!.amount;
    const n = continueAsChild(dead, heir.id, C);
    expect(n.alive).toBe(true);
    expect(n.character.name).toBe(heir.name);
    expect(n.character.age).toBe(heir.age);
    expect(n.dynasty.generation).toBe(2);
    expect(n.dynasty.members[0]).toMatchObject({ name: dead.character.name, gen: 1, ageAtDeath: dead.character.age });
    // herança: dinheiro + bens recebidos = parte dele
    const assets = n.economy.assets.reduce((t, a) => t + a.value, 0) - n.economy.loans.reduce((t, l) => t + l.balance, 0);
    expect(n.money + assets).toBeGreaterThanOrEqual(share - 1);
    expect(ledgerOk(n)).toBe(true);
    // relações recriadas
    const parents = relationsOf(n, ['pai', 'mae'], false);
    const parent = parents.find((r) => !r.person.alive)!;
    expect(parent.person.name).toBe(dead.character.name);
    expect(parent.rel.type).toBe(dead.character.sex === 'M' ? 'pai' : 'mae');
    expect(relationsOf(n, ['irmao']).map((r) => r.person.id)).toContain(sibling.id);
    expect(relationsOf(n, ['pai', 'mae']).length).toBe(1); // o cônjuge vivo vira o outro genitor
    expect(relationsOf(n, ['avo']).length).toBe(1);
    // mundo e tempo continuam
    expect(n.year).toBe(dead.year);
    expect(n.seed).toBe(dead.seed);
    // legado: sobrenome famoso, flags do filho
    expect(n.fighter.reputation).toBe(Math.min(C.legacy.famousRepMax, Math.round(80 / C.legacy.famousRepDivisor)));
    expect(n.flags.lutador_mirim).toBe(true);
    expect(n.flags.filho_de_campeao).toBe(true);
    // vida nova: log, eventos e fim zerados
    expect(n.ending).toBeNull();
    expect(n.firedEvents).toEqual([]);
    expect(resolveAllFirst(advanceYear(n, C)).character.age).toBe(heir.age + 1);
  });

  it('não continua com quem não é filho vivo', () => {
    const { dead, sibling } = deadParent();
    const gone = updatePerson(dead, sibling.id, (p) => ({ ...p, alive: false }));
    expect(continueAsChild(gone, sibling.id, C)).toBe(gone);
    expect(continueAsChild(dead, 'p999', C)).toBe(dead);
  });

  it('herdar a academia da família dá bônus de treino por geração', async () => {
    const { openBusiness, ownGymBonus } = await import('../src/engine');
    let { g, children } = family(false, 1);
    g = openBusiness(g, 'academia', C);
    expect(g.economy.businesses).toHaveLength(1);
    const dead = killCharacter(g, 'causas naturais', C);
    const n = continueAsChild(dead, children[0]!.id, C);
    expect(n.economy.businesses.map((b) => b.defId)).toEqual(['academia']);
    expect(n.flags.academia_herdada).toBe(true);
    expect(ownGymBonus(n, C)).toBeCloseTo(0.1 + C.legacy.gymBonusPerGen);
  });
});

describe('dinastia', () => {
  it('5 gerações simuladas: o save fica pequeno e o extrato fecha', () => {
    let g = bare(20, 20000, 'dinastia');
    for (let gen = 1; gen <= 5; gen++) {
      // cada geração: um filho, alguns anos jogados, morte
      let kid: Person;
      [g, kid] = withPerson(g, 'filho', 2, { sex: gen % 2 ? 'M' : 'F' });
      for (let y = 0; y < 25 && g.alive; y++) g = resolveAllFirst(advanceYear(g, C));
      if (!g.alive && !getPerson(g, kid.id)?.alive) break;
      if (g.alive) g = killCharacter(g, 'causas naturais', C);
      if (!getPerson(g, kid.id)?.alive) break;
      g = continueAsChild(g, kid.id, C);
      expect(g.dynasty.generation).toBe(gen + 1);
      expect(ledgerOk(g)).toBe(true);
    }
    expect(g.dynasty.generation).toBeGreaterThanOrEqual(5);
    const kb = JSON.stringify(g).length / 1024;
    expect(kb).toBeLessThan(150);
    expect(g.dynasty.members.length).toBe(g.dynasty.generation - 1);
  });
});
