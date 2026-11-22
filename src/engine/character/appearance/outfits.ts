/** Roupas do busto e guarda-roupa (Etapa 7). Catálogo em `src/content/outfits/`. */
import type { GameContent } from '../../core/content';
import type { GameState } from '../../core/state';
import { appendLog } from '../../core/stats';
import { post } from '../../economy/ledger';
import type { FacialHair } from './genes';

/** Malha usada pelo renderizador para a parte de cima. */
export type OutfitMesh =
  | 'body'
  | 'camiseta'
  | 'regata'
  | 'moletom'
  | 'polo'
  | 'social'
  | 'jaqueta'
  | 'vestido'
  | 'blusa'
  | 'uniforme'
  | 'kimono'
  | 'rashguard'
  | 'roupao'
  | 'terno'
  | 'festa';

export type OutfitContext = 'bebe' | 'dia' | 'escola' | 'luta' | 'ocasiao' | 'luxo';

export interface OutfitDef {
  id: string;
  name: string;
  minAge: number;
  maxAge: number;
  context: OutfitContext;
  mesh: OutfitMesh;
  /** Variações de cor (hex). */
  colors: readonly string[];
  /** Preço (R$) para desbloquear — roupas de luxo (gancho da Etapa 5). */
  price?: number;
  /** Já vem desbloqueada no guarda-roupa. */
  unlockedByDefault: boolean;
}

export interface Wardrobe {
  unlocked: string[];
  outfit: { id: string; color: number };
  facialHair: FacialHair;
}

export function outfitDef(content: GameContent, id: string | undefined): OutfitDef | undefined {
  return content.outfits.find((o) => o.id === id);
}

export function defaultWardrobe(content: GameContent): Wardrobe {
  return { unlocked: content.outfits.filter((o) => o.unlockedByDefault).map((o) => o.id), outfit: { id: 'camiseta', color: 0 }, facialHair: 'nenhuma' };
}

export function outfitFitsAge(o: OutfitDef, age: number): boolean {
  return age >= o.minAge && age <= o.maxAge;
}

/** Peças que o jogador pode escolher agora (desbloqueadas, da idade, fora do contexto automático). */
export function wardrobeOptions(state: GameState, content: GameContent): OutfitDef[] {
  return content.outfits.filter((o) => state.wardrobe.unlocked.includes(o.id) && outfitFitsAge(o, state.character.age) && (o.context === 'dia' || o.context === 'luxo' || o.context === 'bebe'));
}

export function selectOutfit(state: GameState, content: GameContent, id: string, color = 0): GameState {
  const o = outfitDef(content, id);
  if (!o || !state.wardrobe.unlocked.includes(id) || !outfitFitsAge(o, state.character.age)) return state;
  return { ...state, wardrobe: { ...state.wardrobe, outfit: { id, color: Math.max(0, Math.min(o.colors.length - 1, color)) } } };
}

export function setFacialHair(state: GameState, facialHair: FacialHair): GameState {
  if (state.character.age < 16) return state;
  return { ...state, wardrobe: { ...state.wardrobe, facialHair } };
}

export type BuyOutfitBlock = 'not-found' | 'owned' | 'busy' | 'no-money' | 'too-young';

export function buyOutfitBlock(state: GameState, content: GameContent, id: string): BuyOutfitBlock | null {
  const o = outfitDef(content, id);
  if (!o || !o.price) return 'not-found';
  if (state.wardrobe.unlocked.includes(id)) return 'owned';
  if (!state.alive || state.pendingEvents.length || state.activeFight) return 'busy';
  if (state.character.age < 16) return 'too-young';
  if (state.money < o.price) return 'no-money';
  return null;
}

/** Compra uma peça de luxo (pelo extrato, categoria "compras"). */
export function buyOutfit(state: GameState, content: GameContent, id: string): GameState {
  if (buyOutfitBlock(state, content, id) !== null) return state;
  const o = outfitDef(content, id)!;
  let s = post(state, 'compras', -o.price!, `Roupa: ${o.name}`);
  s = { ...s, wardrobe: { ...s.wardrobe, unlocked: [...s.wardrobe.unlocked, id] } };
  s = selectOutfit(s, content, id, 0);
  return appendLog(s, `Você comprou ${o.name}.`);
}

/** Desbloqueia uma peça (efeito de evento, presente, cosmético). */
export function unlockOutfit(state: GameState, id: string): GameState {
  if (state.wardrobe.unlocked.includes(id)) return state;
  return { ...state, wardrobe: { ...state.wardrobe, unlocked: [...state.wardrobe.unlocked, id] } };
}
