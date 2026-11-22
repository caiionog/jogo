/** Contadores de façanhas (`GameState.feats`) usados pelas conquistas (Etapa 6). */
import type { GameState } from '../core/state';

export function bumpFeat(state: GameState, key: string, n = 1): GameState {
  return { ...state, feats: { ...state.feats, [key]: (state.feats[key] ?? 0) + n } };
}

export function maxFeat(state: GameState, key: string, value: number): GameState {
  if ((state.feats[key] ?? 0) >= value) return state;
  return { ...state, feats: { ...state.feats, [key]: value } };
}
