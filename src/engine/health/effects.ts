/** Efeitos `health` de eventos e ações (Etapa 6). */
import type { GameContent } from '../core/content';
import type { Rng } from '../core/rng';
import type { EventVars, GameState } from '../core/state';
import { appendLog } from '../core/stats';
import { addBrainDamage, addInjury, applySequela, injuryDef, pickInjury } from '../fighting/injuries';
import { controlCondition } from './aging';

export interface HealthEffects {
  /** Lesão do catálogo (id) ou 'random' (sorteada entre as de origem 'evento'). */
  injury?: string;
  /** Sara todas as lesões ativas (ex.: tratamento milagroso). */
  heal?: boolean;
  brainDamage?: number;
  /** Diagnostica uma doença (id). */
  condition?: string;
  /** Trata/controla uma doença; 'var' usa a variável `doenca_id` do evento. */
  controlCondition?: string;
  sequela?: string;
  /** Morte por evento (causa). Aplicada pelo motor depois da escolha. */
  die?: string;
}

export function applyHealthEffects(state: GameState, fx: HealthEffects, rng: Rng, content: GameContent, vars?: EventVars): GameState {
  let s = state;
  if (fx.injury) {
    const def = fx.injury === 'random' ? pickInjury(rng, content, 'evento') : injuryDef(content, fx.injury);
    if (def) s = addInjury(s, rng, content, def, 'evento');
  }
  if (fx.heal && s.health.injuries.length) {
    s = appendLog({ ...s, health: { ...s.health, injuries: [] } }, 'Você se recuperou de todas as lesões.');
  }
  if (fx.brainDamage) s = addBrainDamage(s, fx.brainDamage);
  if (fx.condition && !s.health.conditions.some((c) => c.defId === fx.condition) && content.health.conditions.some((c) => c.id === fx.condition)) {
    s = { ...s, health: { ...s.health, conditions: [...s.health.conditions, { defId: fx.condition, sinceAge: s.character.age, controlled: false }] } };
  }
  if (fx.controlCondition) {
    const id = fx.controlCondition === 'var' ? vars?.doenca_id : fx.controlCondition;
    if (id) s = controlCondition(s, id);
  }
  if (fx.sequela) s = applySequela(s, fx.sequela, content);
  if (fx.die) s = { ...s, flags: { ...s.flags, morte_evento: fx.die } };
  return s;
}
