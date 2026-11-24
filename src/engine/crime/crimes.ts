/**
 * Delitos (release 0.0.2, fase 4): guarda única de idade, chance, ganho, procurado (oculto), reputação no crime
 * (oculta), dinheiro sujo, consequências socioeducativas para 12–17 e planejamento abstrato dos graves.
 * Nenhum detalhe real: só escolhas, chances e consequências.
 */
import { addFame } from '../fame/fame';
import { factionYear, traffickingYear } from './faction';
import type { GameContent } from '../core/content';
import { createRng } from '../core/rng';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { luckFactor } from '../character/talents';
import { post } from '../economy/ledger';
import { addInjury, pickInjury } from '../fighting/injuries';
import { killCharacter } from '../legacy/finalize';
import { arrest } from './arrest';
import type { CrimeDef, CrimePlan, CrimeState } from './types';

export const ADULT_CRIME_AGE = 18;

export function crimeDef(content: GameContent, id: string | undefined): CrimeDef | undefined {
  return id ? content.crime.crimes.find((c) => c.id === id) : undefined;
}

/**
 * GUARDA ÚNICA de idade para o crime: delitos médios e graves, facção e tráfico só a partir dos 18; leves a partir
 * dos 12. Toda ação, evento ou efeito criminal passa por aqui.
 */
export function crimeAllowed(state: GameState, what: CrimeDef | 'faccao' | 'trafico'): boolean {
  const age = state.character.age;
  if (what === 'faccao' || what === 'trafico') return age >= ADULT_CRIME_AGE;
  if (age < what.minAge) return false;
  return what.tier === 'leve' || age >= ADULT_CRIME_AGE;
}

export type CrimeBlockReason = 'dead' | 'busy' | 'age' | 'prison' | 'rep' | 'planning' | 'tried';

export function crimeBlockReason(state: GameState, id: string, content: GameContent): CrimeBlockReason | null {
  const def = crimeDef(content, id);
  if (!def || !state.alive) return 'dead';
  if (state.pendingEvents.length || state.activeFight) return 'busy';
  if (!crimeAllowed(state, def)) return 'age';
  if (state.prison) return 'prison';
  if ((def.minCrimeRep ?? 0) > state.crime.rep) return 'rep';
  if (def.plan && state.crime.plan) return 'planning';
  // no máximo 2 vezes o mesmo delito por ano
  if ((state.yearUses[`crime:${id}`] ?? 0) >= 2) return 'tried';
  return null;
}

/** Risco em palavras para a UI ("Risco: alto"). */
export function crimeRiskLabel(def: CrimeDef): 'baixo' | 'médio' | 'alto' | 'muito alto' {
  const r = (1 - def.baseSuccess) * (def.risk.caught + def.risk.injury * 0.6 + def.risk.death * 15);
  if (r < 0.15) return 'baixo';
  if (r < 0.3) return 'médio';
  if (r < 0.45) return 'alto';
  return 'muito alto';
}

const TEAM_CUT: Record<NonNullable<CrimePlan['team']>, number> = { amigos: 0.5, conhecidos: 0.4, profissionais: 0.55 };
const TARGET_MULT: Record<NonNullable<CrimePlan['target']>, { gain: number; diff: number }> = { pequeno: { gain: 0.5, diff: 0.1 }, medio: { gain: 1, diff: 0 }, grande: { gain: 1.8, diff: -0.12 } };

/** Chance de dar certo: base + atlética, inteligência, reputação no crime, plano e sorte (limitada); procurado atrapalha. */
export function crimeSuccessChance(state: GameState, def: CrimeDef, plan?: CrimePlan | null): number {
  const st = state.character.stats;
  let p = def.baseSuccess + (st.athletic - 50) / 400 + (st.intelligence - 50) / 500 + state.crime.rep / 400 - state.crime.wanted / 300 + luckFactor(state) * 0.04;
  if (plan) {
    p += ((plan.teamQuality ?? 40) - 50) / 250;
    p += plan.target ? TARGET_MULT[plan.target].diff : 0;
    p += plan.time === 'noite' ? 0.04 : 0;
  }
  return Math.max(0.05, Math.min(0.9, p));
}

function patchCrime(state: GameState, fn: (c: CrimeState) => CrimeState): GameState {
  return { ...state, crime: fn(state.crime) };
}

export const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Executa o delito (plano opcional para os graves). Estado inalterado se bloqueado. */
export function commitCrime(state: GameState, id: string, content: GameContent, plan?: CrimePlan | null): GameState {
  const def = crimeDef(content, id);
  if (!def || !crimeAllowed(state, def) || !state.alive || state.prison) return state;
  const rng = createRng(state.rngState);
  const s = runCrime(state, def, rng, content, plan);
  return { ...s, rngState: rng.state };
}

/** Núcleo do delito, com o RNG do chamador (ações e eventos do planejamento). */
export function runCrime(state: GameState, def: CrimeDef, rng: Rng, content: GameContent, plan?: CrimePlan | null): GameState {
  const o = state.character.sex === 'M' ? 'o' : 'a';
  let s: GameState = { ...state, yearUses: { ...state.yearUses, [`crime:${def.id}`]: (state.yearUses[`crime:${def.id}`] ?? 0) + 1 } };
  s = patchCrime(s, (c) => ({ ...c, committed: (c.committed ?? 0) + 1, plan: def.plan ? null : c.plan }));
  // testemunhas: de noite, menos
  const witnesses = rng.chance(plan?.time === 'noite' ? 0.25 : 0.45) ? 1.5 : 1;
  const wanted = def.wantedGain * witnesses;
  if (rng.chance(crimeSuccessChance(state, def, plan))) {
    s = appendLog(s, def.text.ok.replaceAll('{o/a}', o));
    let gain = def.gain[1] > 0 ? rng.int(def.gain[0], def.gain[1]) : 0;
    if (plan?.target) gain = Math.round(gain * TARGET_MULT[plan.target].gain);
    if (plan?.team) gain = Math.round(gain * (1 - TEAM_CUT[plan.team]));
    if (gain > 0) {
      s = post(s, 'crime', gain, def.label);
    }
    s = patchCrime(s, (c) => ({ ...c, wanted: clamp100(c.wanted + wanted * 0.6), rep: clamp100(c.rep + def.repGain) }));
    s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: def.tier === 'grave' ? -1 : 1 }) } };
    // lutador profissional brigando na rua: a imagem sofre (fase 8)
    if ((def.id === 'briga_rua' || def.id === 'agressao') && s.fighter.pro.wins + s.fighter.pro.losses > 0) {
      s = appendLog(addFame({ ...s, fighter: { ...s.fighter, reputation: Math.max(0, s.fighter.reputation - 3) } }, -3), 'O vídeo da briga circulou: "lutador profissional briga na rua". Sua imagem no esporte sofreu.');
    }
    return s;
  }
  // deu errado
  s = appendLog(s, def.text.fail.replaceAll('{o/a}', o));
  s = patchCrime(s, (c) => ({ ...c, wanted: clamp100(c.wanted + wanted), rep: clamp100(c.rep + Math.round(def.repGain / 3)) }));
  if (rng.chance(def.risk.death * (1 - luckFactor(state) * 0.2))) {
    return killCharacter(appendLog(s, 'A fuga terminou da pior forma possível.'), def.tier === 'leve' ? 'Briga de rua' : 'Morte durante um crime', content);
  }
  if (rng.chance(def.risk.injury)) {
    const inj = pickInjury(rng, content, 'evento');
    if (inj) s = addInjury(s, rng, content, inj, 'evento');
  }
  if (rng.chance(def.risk.caught * (1 + state.crime.wanted / 200))) s = arrest(s, def.id, rng, content, 'flagrante');
  else s = appendLog(s, 'Você conseguiu escapar, mas por pouco.');
  return s;
}

/** Pistas do nível de procurado (oculto). */
export function wantedHint(w: number, sex: 'M' | 'F' = 'M'): string | null {
  return wantedHintRaw(w)?.replace('@', sex === 'M' ? 'o' : 'a') ?? null;
}

function wantedHintRaw(w: number): string | null {
  if (w < 15) return null;
  if (w < 35) return 'Você sente que está sendo observad@.';
  if (w < 60) return 'Seu nome anda circulando na delegacia.';
  return 'A polícia está atrás de você.';
}

/** Pista da reputação no crime (oculta). */
export function crimeRepHint(r: number, sex: 'M' | 'F' = 'M'): string | null {
  return crimeRepHintRaw(r)?.replace('@', sex === 'M' ? 'o' : 'a') ?? null;
}

function crimeRepHintRaw(r: number): string | null {
  if (r < 10) return null;
  if (r < 30) return 'Alguns na rua já sabem quem você é.';
  if (r < 60) return 'Seu nome tem peso no mundo do crime.';
  return 'Você é respeitad@ no crime.';
}

/** Virada do ano do crime (antes do fechamento econômico): procurado cai, investigação, suspeita do dinheiro sujo. */
export function crimeYear(state: GameState, rng: Rng, content: GameContent): GameState {
  let s = state;
  // facção e tráfico (fase 5)
  s = factionYear(s, rng, content);
  if (!s.alive) return s;
  s = traffickingYear(s, rng, content);
  if (!s.alive) return s;
  // investigação: quanto mais procurado, maior a chance de a polícia bater na porta
  const c = s.crime;
  if (!s.prison && c.wanted >= 20 && rng.chance(c.wanted / 250)) s = arrest(s, 'investigacao', rng, content, 'investigacao');
  // dinheiro sujo: gastar muito de uma vez chama atenção
  const spent = -s.economy.ledger.entries.filter((e) => e.amount < 0 && (e.cat === 'compras' || e.cat === 'padrao_vida')).reduce((t, e) => t + e.amount, 0);
  const legit = s.economy.ledger.entries.filter((e) => e.amount > 0 && e.cat !== 'crime').reduce((t, e) => t + e.amount, 0);
  if (s.crime.dirty >= 10000 && spent > legit + 20000 && rng.chance(0.6)) {
    s = { ...s, scheduledEvents: [...s.scheduledEvents, { eventId: content.crime.suspicionEventId, dueAge: s.character.age + 1 }] };
  }
  const usedCrime = Object.keys(s.yearUses).some((k) => k.startsWith('crime:'));
  return patchCrime(s, (x) => ({
    ...x,
    wanted: clamp100(x.wanted - 15),
    rep: clamp100(x.rep - (usedCrime || x.faction ? 0 : 2)),
    // o dinheiro sujo nunca passa do saldo (o que foi gasto já saiu)
    dirty: Math.max(0, Math.min(x.dirty, s.money)),
  }));
}

// ---------------------------------------------------------------------------
// lavagem de dinheiro por um empreendimento do Mercado
// ---------------------------------------------------------------------------

export type LaunderBlockReason = 'busy' | 'no-business' | 'no-dirty' | 'tried';

export function launderBlockReason(state: GameState): LaunderBlockReason | null {
  if (!state.alive || state.pendingEvents.length || state.activeFight || state.prison) return 'busy';
  if (!state.economy.businesses.length) return 'no-business';
  if (state.crime.dirty < 1000) return 'no-dirty';
  if (state.flags.lavou_ano === state.year) return 'tried';
  return null;
}

/** Lavar pelo negócio: até 60% do sujo vira limpo, pagando 20% de "taxa"; risco de chamar atenção. */
export function launderMoney(state: GameState, content: GameContent): GameState {
  if (launderBlockReason(state) !== null) return state;
  const rng = createRng(state.rngState);
  const amount = Math.round(Math.min(state.crime.dirty, state.money) * 0.6);
  const fee = Math.round(amount * 0.2);
  let s: GameState = { ...state, flags: { ...state.flags, lavou_ano: state.year } };
  s = post(s, 'eventos', -fee, 'Custos de "consultoria" do negócio');
  s = patchCrime(s, (c) => ({ ...c, dirty: Math.max(0, c.dirty - amount) }));
  if (rng.chance(0.15 + state.crime.wanted / 400)) {
    s = patchCrime(s, (c) => ({ ...c, wanted: clamp100(c.wanted + 25) }));
    s = appendLog(s, 'O dinheiro passou pelo negócio, mas o contador estranhou os números. Alguém pode estar de olho.');
  } else s = appendLog(s, 'O dinheiro passou pelo negócio e saiu limpo do outro lado.');
  void content;
  return { ...s, rngState: rng.state };
}
