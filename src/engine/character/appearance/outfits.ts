/**
 * Roupas e guarda-roupa por camadas (Etapa 8). Catálogo em `src/content/outfits/`; como cada peça cobre o corpo
 * (regras de pixel art) fica em `src/content/sprites/clothes.ts` — a engine só sabe a camada, a idade e o contexto.
 */
import type { GameContent } from '../../core/content';
import type { GameState } from '../../core/state';
import { appendLog } from '../../core/stats';
import { post } from '../../economy/ledger';
import type { FacialHair, HairStyle } from './genes';

/** Camadas do corpo. `inteira` (vestido, body, kimono) substitui `cima` + `baixo`. */
export const OUTFIT_LAYERS = ['cima', 'baixo', 'calcado', 'agasalho', 'inteira', 'acessorio'] as const;
export type OutfitLayer = (typeof OUTFIT_LAYERS)[number];

export type OutfitContext = 'bebe' | 'dia' | 'escola' | 'luta' | 'ocasiao' | 'luxo';
export type OutfitPattern = 'liso' | 'listrado' | 'xadrez' | 'estampa';

export interface OutfitDef {
  id: string;
  name: string;
  layer: OutfitLayer;
  minAge: number;
  maxAge: number;
  context: OutfitContext;
  /** Variações de cor (hex). */
  colors: readonly string[];
  pattern?: OutfitPattern;
  /** Preço (R$) para desbloquear — grifes fictícias (gancho da Etapa 5). */
  price?: number;
  /** Já vem desbloqueada no guarda-roupa. */
  unlockedByDefault: boolean;
}

export interface WornPiece {
  id: string;
  color: number;
}

/** Peças escolhidas por camada (o contexto — escola, luta, casamento — pode sobrepor). */
export type Worn = Partial<Record<OutfitLayer, WornPiece>>;

export interface Wardrobe {
  unlocked: string[];
  worn: Worn;
  facialHair: FacialHair;
  /** Estilo de cabelo escolhido pelo jogador. */
  hairStyle?: HairStyle;
}

export function outfitDef(content: GameContent, id: string | undefined): OutfitDef | undefined {
  return content.outfits.find((o) => o.id === id);
}

export function defaultWardrobe(content: GameContent): Wardrobe {
  return {
    unlocked: content.outfits.filter((o) => o.unlockedByDefault).map((o) => o.id),
    worn: { cima: { id: 'camiseta', color: 0 }, baixo: { id: 'calca_jeans', color: 0 }, calcado: { id: 'tenis', color: 0 } },
    facialHair: 'nenhuma',
  };
}

export function outfitFitsAge(o: OutfitDef, age: number): boolean {
  return age >= o.minAge && age <= o.maxAge;
}

/** Peças escolhíveis agora numa camada (desbloqueadas, da idade, fora dos contextos automáticos). */
export function wardrobeOptions(state: GameState, content: GameContent, layer?: OutfitLayer): OutfitDef[] {
  return content.outfits.filter(
    (o) => (!layer || o.layer === layer) && state.wardrobe.unlocked.includes(o.id) && outfitFitsAge(o, state.character.age) && (o.context === 'dia' || o.context === 'luxo' || o.context === 'bebe'),
  );
}

/** Veste uma peça (substitui a da mesma camada; vestido tira blusa e calça e vice-versa). */
export function selectOutfit(state: GameState, content: GameContent, id: string, color = 0): GameState {
  const o = outfitDef(content, id);
  if (!o || !state.wardrobe.unlocked.includes(id) || !outfitFitsAge(o, state.character.age)) return state;
  const worn: Worn = { ...state.wardrobe.worn, [o.layer]: { id, color: Math.max(0, Math.min(o.colors.length - 1, color)) } };
  if (o.layer === 'inteira') {
    delete worn.cima;
    delete worn.baixo;
  }
  if (o.layer === 'cima' || o.layer === 'baixo') delete worn.inteira;
  // sem parte de baixo nem inteira: volta para a calça padrão
  if (!worn.inteira && !worn.baixo) worn.baixo = { id: 'calca_jeans', color: 0 };
  if (!worn.inteira && !worn.cima) worn.cima = { id: 'camiseta', color: 0 };
  return { ...state, wardrobe: { ...state.wardrobe, worn } };
}

/** Tira uma peça opcional (agasalho ou acessório). */
export function removeOutfit(state: GameState, layer: 'agasalho' | 'acessorio'): GameState {
  if (!state.wardrobe.worn[layer]) return state;
  const worn = { ...state.wardrobe.worn };
  delete worn[layer];
  return { ...state, wardrobe: { ...state.wardrobe, worn } };
}

export function setFacialHair(state: GameState, facialHair: FacialHair): GameState {
  if (state.character.age < 16) return state;
  return { ...state, wardrobe: { ...state.wardrobe, facialHair } };
}

export function setHairStyle(state: GameState, hairStyle: HairStyle): GameState {
  return { ...state, wardrobe: { ...state.wardrobe, hairStyle } };
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
