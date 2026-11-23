/**
 * Facções e tráfico (release 0.0.2, fase 5). Tudo fictício e abstrato. Facção e tráfico só a partir dos 18
 * (`crimeAllowed`). Entrar dá dinheiro e proteção, mas traz obrigações (missões), guerras com rivais, dívidas e risco
 * de morte; sair é difícil. O tráfico é um "negócio" abstrato com lucro anual e risco anual — sem nenhum detalhe.
 */
import type { GameContent } from '../core/content';
import { createRng } from '../core/rng';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { luckFactor } from '../character/talents';
import { post } from '../economy/ledger';
import { addInjury, pickInjury } from '../fighting/injuries';
import { killCharacter } from '../legacy/finalize';
import { changeAffection, relationsOf, updatePerson } from '../relationships/people';
import { arrest } from './arrest';
import { clamp100, crimeAllowed } from './crimes';
import type { FactionDef, TraffickingLevel } from './types';

export function factionDef(content: GameContent, id: string | undefined): FactionDef | undefined {
  return id ? content.crime.factions.find((f) => f.id === id) : undefined;
}

/** Facções com território na cidade/UF atual (a primeira é a dona do pedaço). */
export function factionsHere(state: GameState, content: GameContent): FactionDef[] {
  const { uf, city } = state.character;
  return content.crime.factions.filter((f) => f.territory.cities?.includes(city) || f.territory.ufs.includes(uf));
}

/** A facção do personagem tem rival no território atual (guerra possível). */
export function factionAtWar(state: GameState, content: GameContent): boolean {
  const mine = factionDef(content, state.crime.faction?.id);
  return !!mine && factionsHere(state, content).some((f) => mine.rivals.includes(f.id));
}

export function factionRankTitle(state: GameState, content: GameContent): string {
  const f = state.crime.faction;
  return f ? (content.crime.factionRanks[f.rank] ?? '') : '';
}

/** Entrar numa facção (por convite de evento). `'local'` = a dona do território. Só 18+. */
export function joinFaction(state: GameState, which: string, rng: Rng, content: GameContent): GameState {
  if (!crimeAllowed(state, 'faccao') || state.crime.faction) return state;
  const def = which === 'local' ? (factionsHere(state, content)[0] ?? rng.pick(content.crime.factions)) : factionDef(content, which);
  if (!def) return state;
  let s: GameState = { ...state, crime: { ...state.crime, faction: { id: def.id, rank: 0, years: 0, debt: 0 }, rep: clamp100(state.crime.rep + 10) }, flags: { ...state.flags, ex_faccao: true } };
  s = appendLog(s, `Você entrou para ${def.short} (${def.name}). A primeira regra: "${def.rules[0]}"`);
  // família se afasta; amigos reagem — alguns entram junto
  for (const { person } of relationsOf(s, ['pai', 'mae', 'irmao', 'conjuge', 'parceiro'])) s = changeAffection(s, person.id, -12, 'Ficou sabendo da facção');
  for (const { person } of relationsOf(s, ['amigo'])) {
    if (person.age >= 18 && rng.chance(0.12)) {
      s = updatePerson(s, person.id, (p) => ({ ...p, flags: { ...p.flags, faccao: def.id } }));
      s = appendLog(s, `${person.name.split(' ')[0]} entrou junto com você.`);
    } else s = changeAffection(s, person.id, -8, 'Ficou com medo da facção');
  }
  return s;
}

/** Tentar sair: abre o evento de saída (pagar, fugir, se converter — todos com risco). */
export function tryLeaveFaction(state: GameState, content: GameContent): GameState {
  if (!state.crime.faction || !state.alive || state.pendingEvents.length || state.activeFight) return state;
  return { ...state, pendingEvents: [...state.pendingEvents, { eventId: content.crime.factionEvents.leave, source: 'action' }] };
}

/** Sair da facção: o evento de saída decide o caminho; a engine só limpa o estado. */
export function leaveFaction(state: GameState): GameState {
  if (!state.crime.faction) return state;
  return { ...state, crime: { ...state.crime, faction: null } };
}

const RANK_INCOME = [8000, 18000, 45000, 100000, 220000];
const RANK_WAR_DEATH = [0.012, 0.018, 0.02, 0.025, 0.03];

/** Virada do ano na facção: renda, promoção, missão, guerra, dívida e traição. */
export function factionYear(state: GameState, rng: Rng, content: GameContent): GameState {
  const f = state.crime.faction;
  const def = factionDef(content, f?.id);
  if (!f || !def || state.prison) return state;
  let s: GameState = { ...state, crime: { ...state.crime, faction: { ...f, years: f.years + 1 }, wanted: clamp100(state.crime.wanted + 6 + f.rank * 3) } };
  s = post(s, 'crime', Math.round((RANK_INCOME[f.rank] ?? 8000) * (0.7 + rng.next() * 0.6)), `Parte da ${def.name}`);
  // guerra com rivais no território
  if (factionAtWar(s, content) && rng.chance(0.35)) {
    s = appendLog(s, `Guerra entre ${def.short} e uma facção rival. A cidade ficou tensa por meses.`);
    if (rng.chance((RANK_WAR_DEATH[f.rank] ?? 0.02) * 4 * (1 - luckFactor(s) * 0.2))) return killCharacter(s, 'Guerra entre facções', content);
    if (rng.chance(0.2)) {
      const inj = pickInjury(rng, content, 'evento');
      if (inj) s = addInjury(s, rng, content, inj, 'evento');
    }
  }
  // dívida não paga: a facção cobra
  const debt = s.crime.faction!.debt;
  if (debt > 0) {
    if (s.money >= debt) {
      s = post(s, 'crime', -debt, 'Dívida com a facção');
      s = { ...s, crime: { ...s.crime, faction: { ...s.crime.faction!, debt: 0 } } };
      s = appendLog(s, 'Você pagou a dívida com a facção. Por enquanto, está tudo certo.');
    } else if (rng.chance(0.25)) return killCharacter(appendLog(s, `"${def.rules[0]}" — a dívida não foi perdoada.`), 'Cobrança de dívida da facção', content);
    else s = appendLog(s, 'A dívida com a facção cresceu. Você recebeu um último aviso.');
  }
  // promoção por tempo e reputação
  const cur = s.crime.faction!;
  if (cur.rank < content.crime.factionRanks.length - 1 && cur.years >= (cur.rank + 1) * 2 && s.crime.rep >= 30 + cur.rank * 15 && rng.chance(0.35)) {
    s = { ...s, crime: { ...s.crime, faction: { ...cur, rank: cur.rank + 1 } } };
    s = appendLog(s, `Você subiu na hierarquia: agora é ${factionRankTitle(s, content).toLowerCase()}.`);
  }
  // missão do ano (evento)
  s = { ...s, scheduledEvents: [...s.scheduledEvents, { eventId: content.crime.factionEvents.mission, dueAge: s.character.age + 1 }] };
  return s;
}

// ---------------------------------------------------------------------------
// tráfico (abstrato)
// ---------------------------------------------------------------------------

export const TRAFFICKING: Record<TraffickingLevel, { profit: number; minRep: number; seize: number; arrest: number; injury: number; death: number; wanted: number }> = {
  pequeno: { profit: 22000, minRep: 5, seize: 0.12, arrest: 0.12, injury: 0.06, death: 0.012, wanted: 10 },
  medio: { profit: 80000, minRep: 25, seize: 0.18, arrest: 0.17, injury: 0.1, death: 0.025, wanted: 18 },
  grande: { profit: 260000, minRep: 50, seize: 0.25, arrest: 0.24, injury: 0.14, death: 0.05, wanted: 30 },
};

export type TraffickingBlockReason = 'busy' | 'age' | 'prison' | 'rep' | 'already';

export function traffickingBlockReason(state: GameState, level: TraffickingLevel): TraffickingBlockReason | null {
  if (!state.alive || state.pendingEvents.length || state.activeFight) return 'busy';
  if (!crimeAllowed(state, 'trafico')) return 'age';
  if (state.prison) return 'prison';
  if (state.crime.trafficking?.level === level) return 'already';
  if (state.crime.rep < TRAFFICKING[level].minRep && !state.crime.faction) return 'rep';
  return null;
}

/** Entrar no tráfico (ou mudar de nível). */
export function startTrafficking(state: GameState, level: TraffickingLevel): GameState {
  if (traffickingBlockReason(state, level) !== null) return state;
  const s: GameState = { ...state, crime: { ...state.crime, trafficking: { level, years: state.crime.trafficking?.years ?? 0 } } };
  const txt = { pequeno: 'Você começou a vender drogas em pequena escala.', medio: 'Você passou a cuidar de um ponto de venda de drogas.', grande: 'Você assumiu um esquema grande de tráfico de drogas.' }[level];
  return appendLog({ ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: -2 }) } }, txt);
}

export function stopTrafficking(state: GameState): GameState {
  if (!state.crime.trafficking || state.pendingEvents.length) return state;
  return appendLog({ ...state, crime: { ...state.crime, trafficking: null } }, 'Você largou o tráfico.');
}

/** Ano do tráfico: lucro (a facção fica com 30%), apreensão, prisão, conflito e morte. */
export function traffickingYear(state: GameState, rng: Rng, content: GameContent): GameState {
  const t = state.crime.trafficking;
  if (!t || state.prison || !crimeAllowed(state, 'trafico')) return state;
  const cfg = TRAFFICKING[t.level];
  let s: GameState = { ...state, crime: { ...state.crime, trafficking: { ...t, years: t.years + 1 }, wanted: clamp100(state.crime.wanted + cfg.wanted), rep: clamp100(state.crime.rep + 3) } };
  const bad = 1 - luckFactor(s) * 0.2;
  if (rng.chance(cfg.death * bad)) return killCharacter(appendLog(s, 'O conflito por um ponto de venda terminou da pior forma.'), 'Conflito do tráfico', content);
  if (rng.chance(cfg.seize * bad)) {
    s = appendLog(s, 'A polícia apreendeu a mercadoria e o dinheiro do ano. Prejuízo total.');
    s = { ...s, crime: { ...s.crime, dirty: Math.round(s.crime.dirty * 0.7) } };
  } else {
    const profit = Math.round(cfg.profit * (0.7 + rng.next() * 0.6) * (s.crime.faction ? 0.7 : 1));
    s = post(s, 'crime', profit, 'Tráfico');
  }
  if (rng.chance(cfg.injury * bad)) {
    const inj = pickInjury(rng, content, 'evento');
    if (inj) s = addInjury(s, rng, content, inj, 'evento');
  }
  if (rng.chance(cfg.arrest * (1 + s.crime.wanted / 200) * bad)) {
    s = arrest(s, 'trafico', rng, content, 'investigacao');
    s = { ...s, crime: { ...s.crime, trafficking: null } };
  }
  return s;
}

/** Sem RNG externo (ações da UI). */
export function startTraffickingAction(state: GameState, level: TraffickingLevel): GameState {
  const rng = createRng(state.rngState);
  return { ...startTrafficking(state, level), rngState: rng.state };
}
