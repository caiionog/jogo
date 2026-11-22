import { cityMultOf } from '../geo';
/** Envelhecimento, doenças da velhice, dano cerebral na velhice e hábitos de saúde (Etapa 6). */
import type { GameContent } from '../core/content';
import { createRng } from '../core/rng';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { post, toMoney } from '../economy/ledger';
import type { ConditionDef } from './types';

export function conditionDef(content: GameContent, id: string): ConditionDef | undefined {
  return content.health.conditions.find((c) => c.id === id);
}

/** Fator de risco de uma doença para o estado atual (1 = pessoa média). */
export function conditionRisk(state: GameState, def: ConditionDef): number {
  const h = state.health;
  const st = state.character.stats;
  let f = 1;
  if (st.health < 50) f += 0.5;
  if (st.health < 30) f += 0.7;
  f += (h.brainDamage / 100) * (def.risk.brainDamage ?? 0);
  f += h.sequelae.length * (def.risk.injuries ?? 0) + Math.min(10, h.history.length) * (def.risk.injuries ?? 0) * 0.2;
  if (state.economy.standard === 'simples' && state.character.age >= 18) f += def.risk.lowStandard ?? 0;
  if (state.economy.standard === 'luxo') f -= 0.15;
  if (st.athletic < 30) f += def.risk.lowFitness ?? 0;
  if (h.habits.dietYear >= state.year - 1) f *= 0.7;
  if (h.habits.gymYear >= state.year - 1) f *= 0.8;
  return Math.max(0.2, f);
}

/**
 * Ano de saúde (depois de envelhecer):
 * - doenças ativas tiram saúde (controladas: metade) e cobram tratamento;
 * - novas doenças surgem pela idade × fatores de risco (check-up recente → já diagnosticada e controlada);
 * - dano cerebral cobra na velhice (inteligência e saúde) e dá pistas indiretas;
 * - hábitos e padrão de vida amortecem a queda.
 */
export function healthYear(state: GameState, rng: Rng, content: GameContent): GameState {
  let s = state;
  const age = s.character.age;
  const city = cityMultOf(s, content);
  // doenças ativas
  for (const c of s.health.conditions) {
    const def = conditionDef(content, c.defId);
    if (!def) continue;
    const loss = c.controlled ? Math.floor(def.healthPerYear / 2) : def.healthPerYear;
    s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { health: -loss }) } };
    if (c.controlled && age >= 18) {
      const cost = toMoney(def.treatmentCost * city);
      if (s.money >= cost) s = post(s, 'saude', -cost, `Tratamento: ${def.name}`);
      else {
        s = { ...s, health: { ...s.health, conditions: s.health.conditions.map((x) => (x.defId === c.defId ? { ...x, controlled: false } : x)) } };
        s = appendLog(s, `Sem dinheiro para o tratamento, ${def.name} ficou sem controle.`);
      }
    }
  }
  // novas doenças
  for (const def of content.health.conditions) {
    if (age < def.minAge || s.health.conditions.some((c) => c.defId === def.id)) continue;
    const ageFactor = 1 + Math.max(0, age - def.minAge) / 20;
    if (!rng.chance(Math.min(0.5, def.baseChance * ageFactor * conditionRisk(s, def)))) continue;
    const early = s.health.habits.checkupYear >= s.year - 2;
    s = { ...s, health: { ...s.health, conditions: [...s.health.conditions, { defId: def.id, sinceAge: age, controlled: early }] } };
    s = appendLog(s, early ? `O check-up pegou cedo: ${def.name}. Tratamento iniciado.` : `Diagnóstico: ${def.name}.`);
    if (!early && content.health.diagnosisEventId) {
      s = { ...s, pendingEvents: [...s.pendingEvents, { eventId: content.health.diagnosisEventId, source: 'auto', vars: { doenca: def.name, doenca_id: def.id } }] };
    }
  }
  // dano cerebral na velhice
  const brain = s.health.brainDamage;
  if (age >= 55 && brain >= 20) {
    const k = brain / 100;
    s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { intelligence: -Math.round(k * 3 * rng.next() + k), health: -Math.round(k * 3) }) } };
  }
  if (brain >= 30 && age >= 30 && rng.chance(Math.min(0.4, brain / 200))) s = appendLog(s, rng.pick(BRAIN_HINTS));
  // hábitos e padrão de vida
  const d: { health: number; athletic: number } = { health: 0, athletic: 0 };
  if (s.health.habits.gymYear === s.year) {
    d.athletic += 2;
    d.health += 1;
  }
  if (s.health.habits.dietYear === s.year) d.health += 2;
  if (age >= 40 && s.economy.standard === 'luxo') d.health += 1;
  if (age >= 40 && s.economy.standard === 'simples' && s.character.stats.health > 40 && rng.chance(0.3)) d.health -= 1;
  if (d.health || d.athletic) s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, d) } };
  return s;
}

/** Pistas indiretas do dano cerebral (o número nunca aparece). */
export const BRAIN_HINTS: readonly string[] = [
  'Você esqueceu o nome de um velho amigo no meio da conversa.',
  'Às vezes a sala gira um pouco quando você levanta rápido.',
  'Sua família comenta que você anda repetindo as mesmas histórias.',
  'As dores de cabeça estão mais frequentes.',
  'Você entrou na cozinha e não lembrava o que tinha ido buscar.',
];

/** Pista textual para a UI (sem números). */
export function brainHint(state: GameState): string | null {
  const b = state.health.brainDamage;
  if (b >= 70) return 'Os médicos estão preocupados com a quantidade de pancadas que você já levou.';
  if (b >= 45) return 'Você anda esquecendo coisas e as dores de cabeça são frequentes.';
  if (b >= 25) return 'Às vezes você sente tontura depois dos treinos.';
  return null;
}

// ---------------------------------------------------------------------------
// Ações de saúde
// ---------------------------------------------------------------------------

export type HealthActionId = 'checkup' | 'gym' | 'diet';
export const HEALTH_ACTION_ENERGY = 1;

export function healthActionCost(state: GameState, content: GameContent, id: HealthActionId): number {
  return toMoney(content.health.actionCosts[id] * cityMultOf(state, content));
}

export function healthActionBlock(state: GameState, content: GameContent, id: HealthActionId): 'busy' | 'too-young' | 'done' | 'no-energy' | 'no-money' | null {
  if (!state.alive || state.pendingEvents.length || state.activeFight) return 'busy';
  if (state.character.age < 14) return 'too-young';
  const h = state.health.habits;
  if ((id === 'checkup' && h.checkupYear === state.year) || (id === 'gym' && h.gymYear === state.year) || (id === 'diet' && h.dietYear === state.year)) return 'done';
  if (state.energy.current < HEALTH_ACTION_ENERGY) return 'no-energy';
  const cost = state.character.age >= 18 ? healthActionCost(state, content, id) : 0;
  if (state.money < cost) return 'no-money';
  return null;
}

/** Check-up, academia comum ou dieta (⚡1 e R$; até os 18 a família paga). */
export function healthAction(state: GameState, content: GameContent, id: HealthActionId): GameState {
  if (healthActionBlock(state, content, id) !== null) return state;
  const cost = state.character.age >= 18 ? healthActionCost(state, content, id) : 0;
  const label = id === 'checkup' ? 'Check-up' : id === 'gym' ? 'Academia comum' : 'Dieta com nutricionista';
  let s: GameState = { ...state, energy: { ...state.energy, current: state.energy.current - HEALTH_ACTION_ENERGY } };
  if (cost > 0) s = post(s, 'saude', -cost, label);
  const key = id === 'checkup' ? 'checkupYear' : id === 'gym' ? 'gymYear' : 'dietYear';
  s = { ...s, health: { ...s.health, habits: { ...s.health.habits, [key]: s.year } } };
  if (id === 'checkup') {
    // doenças já existentes passam a ser tratadas
    const untreated = s.health.conditions.filter((c) => !c.controlled);
    s = { ...s, health: { ...s.health, conditions: s.health.conditions.map((c) => ({ ...c, controlled: true })) } };
    const hint = brainHint(s);
    const parts = [untreated.length ? `O médico ajustou o tratamento de ${untreated.map((c) => conditionDef(content, c.defId)?.name ?? c.defId).join(', ')}.` : 'Check-up feito: nada de novo.'];
    if (hint) parts.push(`O neurologista pergunta quantos nocautes você já sofreu.`);
    return appendLog(s, parts.join(' '));
  }
  const rng = createRng(s.rngState);
  s = { ...s, rngState: rng.state, character: { ...s.character, stats: addStats(s.character.stats, id === 'gym' ? { athletic: rng.int(1, 3), health: 1 } : { health: rng.int(1, 2) }) } };
  return appendLog(s, id === 'gym' ? 'Você entrou numa rotina de academia.' : 'Você começou uma dieta equilibrada.');
}

/** Controla (trata) uma doença — efeito de evento ou ação. */
export function controlCondition(state: GameState, defId: string): GameState {
  return { ...state, health: { ...state.health, conditions: state.health.conditions.map((c) => (c.defId === defId ? { ...c, controlled: true } : c)) } };
}
