import { cityMultOf } from '../../geo';
/**
 * Lesões (Etapa 6): catálogo injetado por `content.health`, origem em lutas/sparring/treino/eventos,
 * tratamento (repouso, fisioterapia, cirurgia), agravamento ao voltar cedo e sequelas permanentes.
 * Substitui a flag `fighter.injury` da Etapa 3.
 */
import type { GameContent } from '../../core/content';
import { createRng } from '../../core/rng';
import type { Rng } from '../../core/rng';
import type { GameState } from '../../core/state';
import { addStats, appendLog } from '../../core/stats';
import { post, toMoney } from '../../economy/ledger';
import type { ActiveInjury, InjuryDef, InjurySource, InjuryZone, SequelaDef, Treatment } from '../../health/types';
import type { FightRules, SkillDelta } from '../types';
import { applySkillDelta } from '../profile';

export const MONTHS_PER_YEAR = 12;
/** Chance de agravar cada lesão ativa ao lutar antes de sarar. */
export const AGGRAVATE_FIGHT_CHANCE = 0.35;
/** Chance de agravar ao fazer sparring lesionado. */
export const AGGRAVATE_SPARRING_CHANCE = 0.15;
/** Lesões com gravidade ≥ 3 e mais de 6 meses pela frente impedem lutar (ninguém luta com o LCA rompido). */
export const VETO_SEVERITY = 3;
/** Multiplicador da chance de sequela por tratamento. */
export const SEQUELA_TREATMENT_MULT: Record<Treatment, number> = { none: 1, repouso: 0.8, fisio: 0.45, cirurgia: 0.3 };
export const TREATMENT_MONTHS_MULT: Record<Exclude<Treatment, 'cirurgia'>, number> = { none: 1, repouso: 1, fisio: 0.75 };

export function injuryDef(content: GameContent, id: string): InjuryDef | undefined {
  return content.health.injuries.find((d) => d.id === id);
}

export function sequelaDef(content: GameContent, id: string): SequelaDef | undefined {
  return content.health.sequelae.find((d) => d.id === id);
}

export function isInjured(state: GameState): boolean {
  return state.health.injuries.length > 0;
}

/** A lesão mais grave (a que aparece em destaque). */
export function worstInjury(state: GameState, content: GameContent): { injury: ActiveInjury; def: InjuryDef } | null {
  let best: { injury: ActiveInjury; def: InjuryDef } | null = null;
  for (const injury of state.health.injuries) {
    const def = injuryDef(content, injury.defId);
    if (!def) continue;
    if (!best || def.severity > best.def.severity || (def.severity === best.def.severity && injury.months > best.injury.months)) best = { injury, def };
  }
  return best;
}

/** Lesão que impede lutar agora (grave e longe de sarar). */
export function injuryVeto(state: GameState): ActiveInjury | null {
  return state.health.injuries.find((i) => i.severity >= VETO_SEVERITY && i.months > 6) ?? null;
}

/** Penalidade nas habilidades durante a luta por lesões ativas (somada, negativa). */
export function injuryFightPenalty(state: GameState, content: GameContent): SkillDelta {
  const out: SkillDelta = {};
  for (const i of state.health.injuries) {
    const def = injuryDef(content, i.defId);
    for (const [k, v] of Object.entries(def?.effects.skills ?? {}) as [keyof SkillDelta, number][]) out[k] = (out[k] ?? 0) + v * (i.aggravated ? 1.5 : 1);
  }
  return out;
}

/** Sorteia uma lesão do catálogo para a origem dada (com peso por zona). */
export function pickInjury(rng: Rng, content: GameContent, source: InjurySource, zones?: Partial<Record<InjuryZone, number>>): InjuryDef | undefined {
  const pool = content.health.injuries.filter((d) => d.sources.includes(source));
  if (!pool.length) return undefined;
  const weights = pool.map((d) => (d.weight ?? 1) * (zones ? (zones[d.zone] ?? 0.3) : 1));
  const total = weights.reduce((t, w) => t + w, 0);
  let r = rng.next() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/** Adiciona uma lesão (tempo sorteado, efeito imediato na saúde, dano cerebral de concussão, histórico, log). */
export function addInjury(state: GameState, rng: Rng, _content: GameContent, def: InjuryDef, source: InjurySource, monthsOverride?: number): GameState {
  const h = state.health;
  const months = monthsOverride ?? rng.int(def.months[0], def.months[1]);
  const injury: ActiveInjury = { id: `i${h.nextId}`, defId: def.id, severity: def.severity, months, treatment: 'none', aggravated: false, age: state.character.age, source };
  let s: GameState = {
    ...state,
    health: {
      ...h,
      injuries: [...h.injuries, injury],
      nextId: h.nextId + 1,
      brainDamage: Math.min(100, h.brainDamage + (def.brainDamage ?? 0)),
      history: [...h.history, { age: state.character.age, defId: def.id, source }].slice(-30),
    },
    character: { ...state.character, stats: addStats(state.character.stats, { health: -def.severity * 3, ...def.effects.stats }) },
  };
  s = appendLog(s, `🩹 Lesão: ${def.name} (${monthsText(months)} de recuperação).`);
  return s;
}

export function monthsText(m: number): string {
  if (m >= 12) {
    const y = Math.round((m / 12) * 10) / 10;
    return `${y.toLocaleString('pt-BR')} ano${y >= 2 ? 's' : ''}`;
  }
  return `${m} ${m === 1 ? 'mês' : 'meses'}`;
}

/** Zonas mais atingidas por regra (trocação: cabeça e mãos; grappling: articulações). */
const ZONES: Record<FightRules, Partial<Record<InjuryZone, number>>> = {
  mma: { cabeca: 1.6, mao: 1.2, pele: 1.4, tronco: 1, joelho: 0.6, ombro: 0.6, coluna: 0.4, perna: 0.8 },
  grappling: { joelho: 1.6, ombro: 1.6, coluna: 1, tronco: 0.8, perna: 0.8, mao: 0.4, cabeca: 0.15, pele: 0.4 },
};

export interface FightInjuryInput {
  /** Dano recebido na luta (0–100). */
  damage: number;
  /** Perdeu por nocaute (KO/TKO). */
  koLoss: boolean;
  rules: FightRules;
  /** Knockdowns sofridos. */
  knockdowns: number;
  result: 'W' | 'L' | 'D';
  method: string;
}

/** Chance de lesão numa luta: cresce com o dano recebido; nocaute sofrido pesa muito. */
export function fightInjuryChance(input: FightInjuryInput): number {
  let p = 0.03 + (input.damage / 100) * 0.22 + (input.koLoss ? 0.2 : 0);
  if (input.rules === 'grappling') p *= 0.45;
  return Math.min(0.85, p);
}

/**
 * Consequências físicas da luta: dano cerebral (KO, TKO, knockdowns), agravamento de lesões ativas
 * (lutou machucado) e lesão nova (proporcional ao dano). Determinístico pelo `rng`.
 */
export function applyFightInjuries(state: GameState, rng: Rng, content: GameContent, input: FightInjuryInput): { state: GameState; text: string } {
  let s = state;
  const texts: string[] = [];
  // dano cerebral (oculto)
  const brain = (input.result === 'L' && input.method === 'KO' ? 6 : 0) + (input.result === 'L' && input.method === 'TKO' ? 3 : 0) + input.knockdowns * 0.5;
  if (brain > 0 && input.rules !== 'grappling') s = addBrainDamage(s, brain);
  // lutou lesionado: chance de agravar cada lesão
  for (const inj of state.health.injuries) {
    if (inj.aggravated || !rng.chance(AGGRAVATE_FIGHT_CHANCE)) continue;
    s = aggravate(s, inj.id, content);
    texts.push(`a lesão (${injuryDef(content, inj.defId)?.name ?? inj.defId}) piorou`);
  }
  if (rng.chance(fightInjuryChance(input))) {
    const def = pickInjury(rng, content, 'luta', ZONES[input.rules]);
    if (def) {
      s = addInjury(s, rng, content, def, 'luta');
      texts.push(`lesão: ${def.name}`);
    }
  }
  return { state: s, text: texts.length ? ` ${capitalize(texts.join('; '))}.` : '' };
}

function capitalize(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function addBrainDamage(state: GameState, amount: number): GameState {
  if (amount <= 0) return state;
  return { ...state, health: { ...state.health, brainDamage: Math.min(100, Math.round((state.health.brainDamage + amount) * 10) / 10) } };
}

/** Agrava uma lesão: dobra o tempo restante (mínimo +3 meses), marca e pesa na sequela. */
export function aggravate(state: GameState, injuryId: string, content: GameContent): GameState {
  const inj = state.health.injuries.find((i) => i.id === injuryId);
  if (!inj) return state;
  const months = Math.max(inj.months + 3, inj.months * 2);
  const s = updateInjury(state, injuryId, (i) => ({ ...i, months, aggravated: true }));
  return appendLog(s, `Voltar antes da hora cobrou o preço: ${injuryDef(content, inj.defId)?.name ?? 'a lesão'} agravou (${monthsText(months)}).`);
}

function updateInjury(state: GameState, id: string, fn: (i: ActiveInjury) => ActiveInjury): GameState {
  return { ...state, health: { ...state.health, injuries: state.health.injuries.map((i) => (i.id === id ? fn(i) : i)) } };
}

/** Sparring lesionado também pode agravar. */
export function sparringAggravation(state: GameState, rng: Rng, content: GameContent): GameState {
  let s = state;
  for (const inj of state.health.injuries) if (!inj.aggravated && rng.chance(AGGRAVATE_SPARRING_CHANCE)) s = aggravate(s, inj.id, content);
  return s;
}

// ---------------------------------------------------------------------------
// Tratamento
// ---------------------------------------------------------------------------

export type TreatBlockReason = 'not-found' | 'busy' | 'already' | 'no-money' | 'no-surgery';

export function treatmentCost(state: GameState, content: GameContent, def: InjuryDef, t: Treatment): number {
  const city = cityMultOf(state, content);
  if (t === 'fisio') return toMoney(def.cost.fisio * city);
  if (t === 'cirurgia') return toMoney((def.cost.cirurgia ?? 0) * city);
  return 0;
}

export function treatBlockReason(state: GameState, injuryId: string, t: Treatment, content: GameContent): TreatBlockReason | null {
  const inj = state.health.injuries.find((i) => i.id === injuryId);
  const def = inj ? injuryDef(content, inj.defId) : undefined;
  if (!inj || !def || t === 'none') return 'not-found';
  if (!state.alive || state.pendingEvents.length || state.activeFight) return 'busy';
  if (inj.treatment !== 'none') return 'already';
  if (t === 'cirurgia' && !def.surgery) return 'no-surgery';
  if (state.money < treatmentCost(state, content, def, t)) return 'no-money';
  return null;
}

/** Escolhe o tratamento de uma lesão (uma vez por lesão). Cirurgia pode falhar (sequela garantida). */
export function treatInjury(state: GameState, injuryId: string, t: Treatment, content: GameContent): GameState {
  if (treatBlockReason(state, injuryId, t, content) !== null) return state;
  const inj = state.health.injuries.find((i) => i.id === injuryId)!;
  const def = injuryDef(content, inj.defId)!;
  const cost = treatmentCost(state, content, def, t);
  let s = cost > 0 ? post(state, 'saude', -cost, `Tratamento: ${def.name}`) : state;
  if (t === 'repouso') {
    s = updateInjury(s, injuryId, (i) => ({ ...i, treatment: 'repouso' }));
    return appendLog(s, `Você decidiu tratar ${def.name} com repouso.`);
  }
  if (t === 'fisio') {
    s = updateInjury(s, injuryId, (i) => ({ ...i, treatment: 'fisio', months: Math.max(1, Math.round(i.months * TREATMENT_MONTHS_MULT.fisio)) }));
    return appendLog(s, `Fisioterapia para ${def.name}: a recuperação vai ser mais rápida.`);
  }
  // cirurgia
  const rng = createRng(s.rngState);
  const ok = rng.chance(def.surgery!.successChance);
  s = { ...s, rngState: rng.state, feats: { ...s.feats, surgeries: (s.feats.surgeries ?? 0) + 1 } };
  s = {
    ...s,
    health: { ...s.health, history: s.health.history.map((h, k, arr) => (k === arr.length - 1 && h.defId === def.id ? { ...h, surgery: true } : h)) },
  };
  if (ok) {
    s = updateInjury(s, injuryId, (i) => ({ ...i, treatment: 'cirurgia', months: Math.max(1, Math.round(i.months * def.surgery!.monthsFactor)) }));
    return appendLog(s, `A cirurgia (${def.name}) foi um sucesso.`);
  }
  s = updateInjury(s, injuryId, (i) => ({ ...i, treatment: 'cirurgia' }));
  if (def.sequelaId) s = applySequela(s, def.sequelaId, content);
  return appendLog(s, `A cirurgia (${def.name}) não saiu como esperado. Ficou uma sequela.`);
}

/** Sequela permanente: perda definitiva em habilidades/atributos (uma vez por tipo). */
export function applySequela(state: GameState, sequelaId: string, content: GameContent): GameState {
  const def = sequelaDef(content, sequelaId);
  if (!def || state.health.sequelae.includes(sequelaId)) return state;
  const base = applySkillDelta(state, def.skills ?? {});
  const s: GameState = {
    ...base,
    character: { ...base.character, stats: addStats(base.character.stats, def.stats ?? {}) },
    health: { ...state.health, sequelae: [...state.health.sequelae, sequelaId] },
  };
  return appendLog(s, `Sequela permanente: ${def.name}.`);
}

/** Virada do ano: 12 meses de recuperação; quem sara pode ficar com sequela (gravidade, tratamento, agravamento). */
export function injuriesYear(state: GameState, rng: Rng, content: GameContent): GameState {
  let s = state;
  const remaining: ActiveInjury[] = [];
  const healed: ActiveInjury[] = [];
  for (const inj of state.health.injuries) {
    const months = inj.months - MONTHS_PER_YEAR;
    if (months > 0) remaining.push({ ...inj, months });
    else healed.push(inj);
  }
  s = { ...s, health: { ...s.health, injuries: remaining } };
  for (const inj of healed) {
    const def = injuryDef(content, inj.defId);
    if (!def) continue;
    const p = Math.min(0.95, def.sequelaChance * SEQUELA_TREATMENT_MULT[inj.treatment] * (inj.aggravated ? 2 : 1));
    if (def.sequelaId && rng.chance(p)) s = applySequela(s, def.sequelaId, content);
    s = appendLog(s, `Você se recuperou da lesão (${def.name}).`);
  }
  return s;
}

/** Converte o efeito antigo `fighter.injury: { name, years }` (eventos da Etapa 3) em lesão do catálogo. */
export function legacyInjury(state: GameState, rng: Rng, content: GameContent, name: string | undefined, years: number): GameState {
  const mapped = name ? content.health.legacyNames[name] : undefined;
  const def = (mapped && injuryDef(content, mapped)) || pickInjury(rng, content, 'evento') || content.health.injuries[0];
  if (!def) return state;
  return addInjury(state, rng, content, def, 'evento', Math.max(def.months[0], Math.round(years * MONTHS_PER_YEAR)));
}
