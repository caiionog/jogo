/** Economia × relacionamentos: patrimônio dos pais, herança, regime de bens, divórcio e pensão. */
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { appendLog } from '../core/stats';
import { childrenOf, firstName, getPerson, relationsOf, updatePerson } from '../relationships/people';
import type { Person } from '../relationships/types';
import { post, toMoney } from './ledger';
import { INHERITANCE_TAX_RATE } from './taxes';
import type { Regime } from './types';
import { netWorth } from './worth';

export const ALIMONY_SHARE = 0.15;
export const ALIMONY_MIN = 6000;

/** Patrimônio dos pais coerente com a renda da família. */
export function parentWealth(rng: Rng, familyWealth: number): number {
  // patrimônio de CADA genitor (o casal soma os dois)
  if (familyWealth < 35) return toMoney(rng.int(3, 20) * 1000);
  if (familyWealth < 70) return toMoney(rng.int(25, 120) * 1000);
  if (familyWealth < 92) return toMoney(rng.int(150, 500) * 1000);
  return toMoney(rng.int(600, 1500) * 1000);
}

/** Pais guardam/gastam um pouco a cada ano. */
export function parentsWealthYear(state: GameState, rng: Rng): GameState {
  let s = state;
  for (const { person } of relationsOf(s, ['pai', 'mae'])) {
    if (person.wealth === undefined) continue;
    const g = person.age >= 65 ? -0.03 : 0.01;
    s = updatePerson(s, person.id, (p) => ({ ...p, wealth: Math.max(0, toMoney((p.wealth ?? 0) * (1 + g + (rng.next() - 0.5) * 0.02))) }));
  }
  return s;
}

/** Herança: quando pai/mãe morre, o patrimônio é dividido entre os herdeiros vivos (personagem + irmãos). */
export function inheritFrom(state: GameState, deceased: Person): GameState {
  const total = deceased.wealth ?? 0;
  if (total <= 0) return state;
  const otherParentAlive = relationsOf(state, ['pai', 'mae']).some((x) => x.person.id !== deceased.id);
  const pool = otherParentAlive ? total / 2 : total;
  const heirs = 1 + relationsOf(state, ['irmao']).length;
  const gross = toMoney(pool / heirs);
  const share = toMoney(gross * (1 - INHERITANCE_TAX_RATE));
  let s = updatePerson(state, deceased.id, (p) => ({ ...p, wealth: 0 }));
  if (otherParentAlive) {
    const other = relationsOf(s, ['pai', 'mae']).find((x) => x.person.id !== deceased.id)!.person;
    s = updatePerson(s, other.id, (p) => ({ ...p, wealth: (p.wealth ?? 0) + toMoney(total / 2) }));
  }
  if (share <= 0) return s;
  s = post(s, 'heranca', share, `Herança de ${firstName(deceased.name)}`);
  return appendLog(s, `Você herdou R$ ${share.toLocaleString('pt-BR')} de ${firstName(deceased.name)}${heirs > 1 ? ` (dividido entre ${heirs} herdeiros)` : ''}.`);
}

/** Registra o casamento (regime padrão: comunhão parcial) e o patrimônio na data. */
export function recordMarriage(state: GameState, personId: string, regime: Regime = 'parcial'): GameState {
  return { ...state, economy: { ...state.economy, marriage: { personId, regime, netWorthAtMarriage: netWorth(state) } } };
}

export function setRegime(state: GameState, regime: Regime): GameState {
  const m = state.economy.marriage;
  if (!m) return state;
  return { ...state, economy: { ...state.economy, marriage: { ...m, regime } } };
}

export const REGIME_LABEL: Record<Regime, string> = { parcial: 'Comunhão parcial de bens', separacao: 'Separação total de bens' };

/**
 * Divisão de bens no divórcio:
 * - comunhão parcial: paga ao ex metade do patrimônio construído durante o casamento;
 * - separação total: nada é dividido.
 * Também cria a pensão dos filhos menores de 18. Sem dinheiro, vira dívida no fechamento.
 * Sem registro de casamento (saves antigos), assume comunhão parcial de todo o patrimônio.
 */
export function divorceSettlement(state: GameState, exId: string): { state: GameState; paid: number } {
  const m = state.economy.marriage;
  const regime: Regime = m && m.personId === exId ? m.regime : 'parcial';
  const built = m && m.personId === exId ? netWorth(state) - m.netWorthAtMarriage : netWorth(state);
  let paid = 0;
  let s = state;
  if (regime === 'parcial' && built > 0) {
    // divisão simples: metade do que foi construído, saindo do dinheiro (pode virar dívida)
    paid = toMoney(Math.min(built, Math.max(netWorth(state), 0)) / 2);
    if (paid > 0) s = post(s, 'familia', -paid, 'Divisão de bens do divórcio');
  }
  const kids = childrenOf(s).filter((k) => k.person.age < 18);
  const perChild = Math.max(ALIMONY_MIN, toMoney(s.economy.lastIncome * ALIMONY_SHARE));
  s = {
    ...s,
    economy: {
      ...s.economy,
      marriage: null,
      alimony: [...s.economy.alimony, ...kids.map((k) => ({ childId: k.person.id, amount: perChild }))],
    },
  };
  return { state: s, paid };
}

/** Pensão anual até cada filho fazer 18. */
export function alimonyYear(state: GameState): GameState {
  let s = state;
  const keep = [];
  for (const a of s.economy.alimony) {
    const child = getPerson(s, a.childId);
    if (!child || !child.alive || child.age >= 18) continue;
    s = post(s, 'pensao', -a.amount, `Pensão: ${firstName(child.name)}`);
    keep.push(a);
  }
  return { ...s, economy: { ...s.economy, alimony: keep } };
}

/** Pedir dinheiro aos pais: sai do patrimônio real deles. */
export function moneyFromParent(state: GameState, parentId: string, rng: Rng): { state: GameState; amount: number } {
  const p = getPerson(state, parentId);
  const wealth = p?.wealth ?? 0;
  const amount = Math.min(20000, Math.max(0, toMoney((wealth * (0.01 + rng.next() * 0.02)) / 50) * 50));
  if (!p || amount <= 0) return { state, amount: 0 };
  let s = updatePerson(state, p.id, (x) => ({ ...x, wealth: (x.wealth ?? 0) - amount }));
  s = post(s, 'familia', amount, `Ajuda de ${firstName(p.name)}`);
  return { state: s, amount };
}

