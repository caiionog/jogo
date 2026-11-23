/**
 * Talentos de nascimento e sorte (release 0.0.1). Tudo oculto: a UI só mostra talentos revelados (por evento) e pistas
 * da sorte em palavras. Ambos usam RNG DERIVADO da seed (`seed:talentos…`), nunca o `rngState` principal — assim o
 * resto da vida (e o teste de não discriminação) não muda de rumo. Regras: os mods são pequenos e têm limite.
 */
import type { GameContent } from '../core/content';
import { createRng, seedToState } from '../core/rng';
import type { Rng } from '../core/rng';
import type { Character, GameState } from '../core/state';
import { appendLog } from '../core/stats';

export interface TalentMods {
  athleticStart?: number;
  intelligenceStart?: number;
  looksStart?: number;
  /** +fração no ganho de treino (luta e físico). */
  trainingGain?: number;
  /** +fração nos ganhos de estudo. */
  studyGain?: number;
  diseaseMult?: number;
  injuryMonthsMult?: number;
  injuryChanceMult?: number;
  /** +fração na chance de nocaute depois do knockdown. */
  koBonus?: number;
  /** +fração na chance de finalização. */
  subBonus?: number;
  affectionMult?: number;
  reputationMult?: number;
  /** Peso dos eventos de briga (tag `briga`). */
  fightEventMult?: number;
}

export interface TalentDef {
  id: string;
  label: string;
  chance: number;
  negative?: boolean;
  heritBonus: number;
  mods: TalentMods;
  /** Pista em palavras (perfil, quando revelado). */
  hint: string;
}

export interface CharacterTalent {
  id: string;
  revealed: boolean;
}

export interface LuckConfig {
  eventWeight: number;
  risk: number;
  fight: number;
  maxEventChange: number;
  riskFloor: number;
  riskCeil: number;
}

/** Sorteia talentos: cada um com a sua chance, + `heritBonus` se algum dos pais tem. */
export function rollTalents(rng: Rng, content: GameContent, parents: readonly (readonly string[])[] = []): string[] {
  const out: string[] = [];
  for (const t of content.talents) {
    const inherited = parents.some((p) => p.includes(t.id));
    if (rng.chance(t.chance + (inherited ? t.heritBonus : 0))) out.push(t.id);
  }
  return out;
}

/** Sorte inata 0–100: média de 3 uniformes (concentrada no meio, poucos extremos). */
export function rollLuck(rng: Rng): number {
  return Math.round(((rng.next() + rng.next() + rng.next()) / 3) * 100);
}

/**
 * Coloca talentos e sorte num personagem recém-criado (muta o objeto novo, antes de entrar no estado) e aplica os
 * bônus iniciais de atributo (atlético, prodígio, beleza).
 */
export function applyBirthTalents(c: Character, ids: readonly string[], luck: number, content: GameContent): void {
  c.talents = ids.map((id) => ({ id, revealed: false }));
  c.luck = luck;
  const add = (k: 'athletic' | 'intelligence' | 'looks', v: number | undefined) => {
    if (v) c.stats = { ...c.stats, [k]: Math.max(0, Math.min(100, c.stats[k] + v)) };
  };
  for (const id of ids) {
    const m = content.talents.find((t) => t.id === id)?.mods;
    add('athletic', m?.athleticStart);
    add('intelligence', m?.intelligenceStart);
    add('looks', m?.looksStart);
  }
}

/** RNG derivado para talentos/sorte de uma pessoa (não mexe no rngState). */
export function talentRng(seed: string, key: string): Rng {
  return createRng(seedToState(`${seed}:talentos:${key}`));
}

export function hasTalent(state: GameState, id: string): boolean {
  return (state.character.talents ?? []).some((t) => t.id === id);
}

/** Valor combinado de um mod nos talentos do personagem (revelados ou não). Somas para bônus; produto para `*Mult`. */
export function talentMod(state: GameState, content: GameContent, key: keyof TalentMods): number {
  const mult = key.endsWith('Mult');
  let v = mult ? 1 : 0;
  for (const t of state.character.talents ?? []) {
    const m = content.talents.find((d) => d.id === t.id)?.mods[key];
    if (m === undefined) continue;
    v = mult ? v * m : v + m;
  }
  return v;
}

export function talentDef(content: GameContent, id: string): TalentDef | undefined {
  return content.talents.find((t) => t.id === id);
}

/** Revela um talento (efeito de evento). Sem o talento, nada muda. */
export function revealTalent(state: GameState, id: string, content: GameContent): GameState {
  const t = state.character.talents.find((x) => x.id === id);
  if (!t || t.revealed) return state;
  const def = talentDef(content, id);
  const talents = state.character.talents.map((x) => (x.id === id ? { ...x, revealed: true } : x));
  const s: GameState = { ...state, character: { ...state.character, talents } };
  const log = def ? `${def.negative ? '⚠️' : '✨'} Você descobriu: ${def.label}. ${def.hint}` : '';
  return log ? appendLog(s, log) : s;
}


// ---------------------------------------------------------------------------
// sorte
// ---------------------------------------------------------------------------

/** -1 (azar extremo) … 0 (média) … +1 (sorte extrema). */
export function luckFactor(state: GameState): number {
  const l = state.character.luck ?? 50;
  return Math.max(-1, Math.min(1, (l - 50) / 50));
}

/** Multiplicador do peso de um evento pelo tom: bons pesam mais para quem tem sorte, ruins para quem tem azar. */
export function luckWeightMult(state: GameState, tone: 'good' | 'bad' | undefined, content: GameContent): number {
  if (!tone) return 1;
  const k = content.luck.eventWeight * luckFactor(state);
  return tone === 'good' ? 1 + k : 1 - k;
}

/**
 * Chance de um risco com a sorte: risco ruim (padrão) cai para quem tem sorte; risco bom sobe. A diferença para a
 * chance original nunca passa de `luck.risk` e o resultado fica entre `riskFloor` e `riskCeil`.
 */
export function luckRiskChance(state: GameState, chance: number, tone: 'good' | 'bad' | undefined, content: GameContent): number {
  const d = content.luck.risk * luckFactor(state) * (tone === 'good' ? 1 : -1);
  const c = Math.max(content.luck.riskFloor, Math.min(content.luck.riskCeil, chance + d));
  return Math.abs(c - chance) > content.luck.risk ? chance + Math.sign(c - chance) * content.luck.risk : c;
}

/** Multiplicador dos lances decisivos da luta (nocaute, finalização) do jogador: 1 ± `luck.fight`. */
export function luckFightMult(state: GameState, content: GameContent): number {
  return 1 + content.luck.fight * luckFactor(state);
}

/** Efeito de evento na sorte, limitado por `maxEventChange` e a 0–100. */
export function changeLuck(state: GameState, delta: number, content: GameContent): GameState {
  const d = Math.max(-content.luck.maxEventChange, Math.min(content.luck.maxEventChange, delta));
  const luck = Math.max(0, Math.min(100, (state.character.luck ?? 50) + d));
  return { ...state, character: { ...state.character, luck } };
}

/** Pista da sorte em palavras (log e obituário). null = sorte comum. */
export function luckHint(state: GameState): string | null {
  const l = state.character.luck ?? 50;
  if (l >= 78) return 'Que sorte! Parece que as coisas sempre dão certo para você.';
  if (l <= 22) return 'Parece que nada dá certo para você…';
  return null;
}

export function luckTitle(state: GameState): string | null {
  const l = state.character.luck ?? 50;
  if (l >= 78) return `Nasceu virad${state.character.sex === 'M' ? 'o' : 'a'} para a lua.`;
  if (l <= 22) return `Azarad${state.character.sex === 'M' ? 'o' : 'a'} de carteirinha.`;
  return null;
}
