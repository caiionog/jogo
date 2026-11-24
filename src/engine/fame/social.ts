/**
 * Fama no dia a dia (release 0.0.4, fase 5): redes sociais, comerciais e os marcos de fama.
 * - Seguidores são só vitrine, calculados da fama (nada vai para o save).
 * - Postar (13+): sobe a fama com retorno decrescente no ano; opinião polêmica pode virar "cancelamento".
 * - Comercial (16+, fama 30+): uma vez por ano, cachê pela fama, com marca fictícia do conteúdo.
 * Os escândalos e os convites (talk show, paparazzi, fãs) são eventos com a condição `fame`.
 */
import type { GameContent } from '../core/content';
import { createRng } from '../core/rng';
import type { GameState } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { post, toMoney } from '../economy/ledger';
import { bumpUse, repeatMultiplier, usesThisYear } from '../lifeStages/sessions';
import { addFame, fameOf } from './fame';

export type PostKind = 'foto' | 'treino' | 'opiniao';

export interface FameContent {
  /** Marcas fictícias que contratam comerciais. */
  brands: readonly string[];
  /** Fama mínima para fazer comercial. */
  commercialMinFame: number;
}

/** Seguidores aproximados: 40 com fama 0, ~4 milhões com fama 100 (escala exponencial). */
export function followersOf(fame: number): number {
  const n = 40 * Math.pow(10, Math.max(0, Math.min(100, fame)) / 20);
  return n >= 1000 ? Math.round(n / 100) * 100 : Math.round(n);
}

/** Texto curto de fama para a UI (a fama é um atributo visível). */
export function fameLabel(fame: number, sex: 'M' | 'F' = 'M'): string {
  const o = sex === 'M' ? 'o' : 'a';
  if (fame >= 85) return 'Celebridade nacional';
  if (fame >= 65) return `Muito famos${o}`;
  if (fame >= 45) return `Conhecid${o} no país`;
  if (fame >= 25) return `Conhecid${o} na cidade`;
  if (fame >= 10) return 'Algumas pessoas te reconhecem';
  return `Anônim${o}`;
}

export type PostBlockReason = 'busy' | 'too-young' | 'prison';

export function postBlockReason(state: GameState): PostBlockReason | null {
  if (!state.alive || state.pendingEvents.length || state.activeFight) return 'busy';
  if (state.character.age < 13) return 'too-young';
  if (state.prison && state.prison.regime !== 'aberto') return 'prison';
  return null;
}

/** Postar nas redes: fama +1 a +3 (opinião: até +5, com 20% de chance de polêmica). Rende menos a cada post no ano. */
export function postOnSocial(state: GameState, kind: PostKind, content: GameContent): GameState {
  if (postBlockReason(state) !== null) return state;
  const rng = createRng(state.rngState);
  const mult = repeatMultiplier(state, 'redes:post', content);
  let s = bumpUse(state, 'redes:post');
  if (kind === 'opiniao' && rng.chance(0.2)) {
    const loss = rng.int(3, 7);
    s = addFame(s, rng.chance(0.4) ? rng.int(1, 3) : -loss);
    s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: -4 }) }, flags: { ...s.flags, polemica_redes: s.year } };
    s = appendLog(s, 'Sua opinião viralizou do jeito errado: chuva de comentários raivosos e um "cancelamento" de fim de semana.');
    return { ...s, rngState: rng.state };
  }
  const base = kind === 'opiniao' ? rng.int(2, 5) : kind === 'treino' && state.fighter.history.length ? rng.int(2, 4) : rng.int(1, 3);
  const gain = Math.max(0, Math.round(base * mult));
  s = addFame(s, gain);
  if (gain) s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: 1 }) } };
  const what = kind === 'foto' ? 'uma foto do dia' : kind === 'treino' ? 'um vídeo do treino' : 'sua opinião sobre o assunto do momento';
  s = appendLog(s, gain ? `Você postou ${what} e ganhou seguidores.` : `Você postou ${what}, mas quase ninguém viu.`);
  return { ...s, rngState: rng.state };
}

export type CommercialBlockReason = 'busy' | 'too-young' | 'fame' | 'done' | 'prison';

export function commercialBlockReason(state: GameState, content: GameContent): CommercialBlockReason | null {
  if (!state.alive || state.pendingEvents.length || state.activeFight) return 'busy';
  if (state.prison) return 'prison';
  if (state.character.age < 16) return 'too-young';
  if (fameOf(state) < content.fame.commercialMinFame) return 'fame';
  if (usesThisYear(state, 'fama:comercial')) return 'done';
  return null;
}

/** Cachê do comercial: cresce com o quadrado da fama (fama 30 ≈ R$ 18 mil; fama 80 ≈ R$ 128 mil). */
export function commercialFee(fame: number): number {
  return toMoney(fame * fame * 20);
}

export function doCommercial(state: GameState, content: GameContent): GameState {
  if (commercialBlockReason(state, content) !== null) return state;
  const rng = createRng(state.rngState);
  const brand = rng.pick(content.fame.brands);
  const fee = commercialFee(fameOf(state));
  let s = bumpUse(post(state, 'patrocinio', fee, `Comercial: ${brand}`), 'fama:comercial');
  s = addFame(s, 2);
  s = appendLog(s, `Você gravou um comercial para ${brand} e recebeu R$ ${fee.toLocaleString('pt-BR')}.`);
  return { ...s, rngState: rng.state };
}
