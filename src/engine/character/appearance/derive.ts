/**
 * Aparência dinâmica (Etapa 7): `deriveAvatar` calcula tudo o que o renderizador precisa a partir do estado.
 * Nada disso é guardado no save — só os genes (fixos) e o guarda-roupa. A UI apenas renderiza o descriptor.
 */
import type { GameContent } from '../../core/content';
import { createRng, seedToState } from '../../core/rng';
import type { GameState, Sex } from '../../core/state';
import { bmiAt } from '../../fighting/body';
import type { Npc } from '../../fighting/types';
import { pickUf } from '../../geo';
import type { Person } from '../../relationships/types';
import { EYE_RGB, hairRgb, rgbHex, skinRgb } from './genes';
import type { Appearance, EyeShape, FaceShape, FacialHair, HairType } from './genes';
import { randomAppearance } from './inherit';
import { outfitDef, outfitFitsAge } from './outfits';
import type { OutfitMesh } from './outfits';

export type AgeStage = 'bebe' | 'crianca' | 'adolescente' | 'adulto' | 'idoso';
export type Expression = 'feliz' | 'neutro' | 'triste' | 'cansado' | 'machucado';
export type HairStyle = 'raspado' | 'curto' | 'medio' | 'longo' | 'preso';
export type AvatarContext = 'principal' | 'luta' | 'casamento' | 'formatura' | 'lista';

export interface AvatarDescriptor {
  sex: Sex;
  age: number;
  stage: AgeStage;
  /** 0 = recém-nascido … 1 = adulto (proporções contínuas: cabeça grande → corpo adulto). */
  growth: number;
  /** 0 até ~55 anos … 1 aos ~90 (postura, rosto, pele). */
  elder: number;
  fat: number;
  muscle: number;
  skin: string;
  hair: { type: HairType; style: HairStyle; color: string; grey: number; baldness: number };
  eyes: { color: string; shape: EyeShape };
  noseWidth: number;
  lipVolume: number;
  faceShape: FaceShape;
  wrinkles: number;
  facialHair: FacialHair;
  marks: { scar: boolean; brokenNose: boolean; cauliflowerEar: boolean; blackEye: boolean };
  expression: Expression;
  outfit: { id: string; mesh: OutfitMesh; color: string; beltColor?: string };
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const r2 = (x: number) => Math.round(x * 100) / 100;

/** Cor real das faixas de jiu-jitsu (branca → preta). */
export const BELT_HEX = ['#f1f1ee', '#2f5fb3', '#6b3fa0', '#6b4226', '#1b1b1b'] as const;

export function ageStage(age: number): AgeStage {
  return age <= 2 ? 'bebe' : age <= 11 ? 'crianca' : age <= 17 ? 'adolescente' : age <= 59 ? 'adulto' : 'idoso';
}

/** Crescimento contínuo de 0 (bebê) a 1 (adulto aos ~20): sem troca brusca de modelo. */
export function growthAt(age: number): number {
  return r2(clamp01(Math.pow(Math.min(age, 20) / 20, 0.75)));
}

export function elderAt(age: number): number {
  return r2(clamp01((age - 55) / 35));
}

/** Pseudoaleatório estável a partir de um número (estilos que não estão nos genes). */
function frac(x: number, k: number): number {
  const v = Math.sin(x * 12.9898 * k + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

function hairStyleFor(sex: Sex, age: number, a: Appearance): HairStyle {
  const r = frac(a.genes.weightGain + a.genes.noseWidth, 3);
  if (age <= 1) return 'curto';
  if (sex === 'M') return r < 0.12 ? 'raspado' : r < 0.8 ? 'curto' : 'medio';
  return r < 0.15 ? 'curto' : r < 0.45 ? 'medio' : r < 0.85 ? 'longo' : 'preso';
}

interface BodyInputs {
  sex: Sex;
  age: number;
  appearance: Appearance;
  /** 0–1 */
  fat: number;
  muscle: number;
  health: number;
  facialHair: FacialHair;
  marks?: AvatarDescriptor['marks'];
  expression: Expression;
  outfit: AvatarDescriptor['outfit'];
}

function build(i: BodyInputs): AvatarDescriptor {
  const g = i.appearance.genes;
  const age = i.age;
  const greyStart = 34 + frac(g.weightGain, 7) * 18;
  const grey = r2(clamp01((age - greyStart) / 28));
  const baldness = r2(i.sex === 'M' ? clamp01((age - 24) / 36) * Math.pow(g.baldness, 1.4) : clamp01((age - 50) / 40) * g.baldness * 0.25);
  const wrinkles = r2(clamp01((age - 30) / 55) * (1 + (1 - i.health / 100) * 0.4));
  return {
    sex: i.sex,
    age,
    stage: ageStage(age),
    growth: growthAt(age),
    elder: elderAt(age),
    fat: r2(i.fat),
    muscle: r2(i.muscle),
    skin: rgbHex(skinRgb(g.skinTone, g.undertone)),
    hair: { type: g.hairType, style: hairStyleFor(i.sex, age, i.appearance), color: rgbHex(hairRgb(g.hairColor, g.red, grey)), grey, baldness },
    eyes: { color: rgbHex(EYE_RGB[g.eyeColor]), shape: g.eyeShape },
    noseWidth: r2(g.noseWidth),
    lipVolume: r2(g.lipVolume),
    faceShape: g.faceShape,
    wrinkles,
    facialHair: age >= 16 ? i.facialHair : 'nenhuma',
    marks: i.marks ?? { scar: false, brokenNose: false, cauliflowerEar: false, blackEye: false },
    expression: i.expression,
    outfit: i.outfit,
  };
}

/** Roupa por idade/contexto quando não há escolha (NPCs e fallback). */
function pickOutfit(content: GameContent, age: number, seed: number, context: 'dia' | 'luta' = 'dia'): AvatarDescriptor['outfit'] {
  if (age <= 2) return wear(content, 'body', 0);
  const pool = content.outfits.filter((o) => (o.context === context || (context === 'dia' && o.context === 'dia')) && outfitFitsAge(o, age));
  const o = pool[Math.floor(frac(seed, 5) * pool.length)] ?? content.outfits[0]!;
  return wear(content, o.id, Math.floor(frac(seed, 11) * o.colors.length));
}

function wear(content: GameContent, id: string, color: number, beltColor?: string): AvatarDescriptor['outfit'] {
  const o = outfitDef(content, id) ?? content.outfits[0]!;
  return { id: o.id, mesh: o.mesh, color: o.colors[Math.min(color, o.colors.length - 1)] ?? '#888888', ...(beltColor ? { beltColor } : {}) };
}

/** Roupa do personagem: contexto automático (escola, luta, casamento, formatura) ou guarda-roupa. */
export function playerOutfit(state: GameState, content: GameContent, context: AvatarContext = 'principal'): AvatarDescriptor['outfit'] {
  const age = state.character.age;
  const belt = BELT_HEX[state.fighter.belt.rank] ?? BELT_HEX[0];
  if (context === 'luta') {
    const rules = state.activeFight?.offer.rules;
    return rules === 'grappling' ? wear(content, 'kimono', 0, belt) : wear(content, age < 14 ? 'regata_treino' : 'rashguard', 0);
  }
  if (context === 'casamento' && age >= 16) return wear(content, state.character.sex === 'F' ? 'vestido_festa' : 'terno', 0);
  if (context === 'formatura') return wear(content, 'camisa_formatura', 0);
  if (age <= 2) return wear(content, 'body', 0);
  if (state.education.current && age >= 6 && age <= 17) return wear(content, 'uniforme', 0);
  const chosen = outfitDef(content, state.wardrobe.outfit.id);
  if (chosen && outfitFitsAge(chosen, age) && state.wardrobe.unlocked.includes(chosen.id)) {
    return chosen.context === 'luta' ? wear(content, chosen.id, state.wardrobe.outfit.color, belt) : wear(content, chosen.id, state.wardrobe.outfit.color);
  }
  return pickOutfit(content, age, state.character.birthYear);
}

/** Avatar do personagem do jogador. */
export function deriveAvatar(state: GameState, content: GameContent, context: AvatarContext = 'principal'): AvatarDescriptor {
  const c = state.character;
  const st = c.stats;
  const a = c.appearance;
  const g = a.genes;
  const age = c.age;
  // musculatura: força + condicionamento (+ treino de luta), proporcional ao crescimento
  const skills = state.fighter.skills;
  const fightFit = (skills.striking + skills.wrestling + skills.grappling + skills.cardio) / 400;
  const muscle = clamp01(((st.strength * 0.6 + st.fitness * 0.4) / 100) * 1.15 + fightFit * 0.25 - 0.18) * growthAt(age);
  // gordura: IMC da Etapa 3 (força, condicionamento, biotipo, idade), genes, padrão de vida, saúde
  const bmi = bmiAt(age, st, c.build);
  let fat = age < 18 ? 0.3 + c.build * 0.07 + (g.weightGain - 0.5) * 0.25 + (st.fitness < 30 ? 0.08 : 0) : (bmi - 19.5) / 12 - muscle * 0.3;
  fat += (g.weightGain - 0.5) * 0.25 + (50 - st.fitness) / 250;
  if (age >= 18) fat += state.economy.standard === 'luxo' ? 0.08 : state.economy.standard === 'confortavel' ? 0.03 : 0;
  if (st.health < 35) fat -= 0.08;
  // marcas da luta
  const seq = state.health.sequelae;
  const last = state.fighter.history.at(-1);
  const foughtHurt = !!last && last.year === state.year && (last.result === 'L' || last.method === 'KO' || last.method === 'TKO');
  const headInjury = state.health.injuries.some((i) => ['concussao', 'fratura_orbital', 'corte_supercilio', 'nariz_quebrado'].includes(i.defId) && i.age === age);
  const marks = {
    scar: seq.includes('cicatriz') || state.health.injuries.some((i) => i.defId === 'corte_supercilio'),
    brokenNose: seq.includes('nariz_torto') || state.health.injuries.some((i) => i.defId === 'nariz_quebrado'),
    cauliflowerEar: seq.includes('orelha_couve_flor'),
    blackEye: foughtHurt || headInjury,
  };
  const expression: Expression = marks.blackEye ? 'machucado' : st.health < 35 ? 'cansado' : st.happiness >= 70 ? 'feliz' : st.happiness <= 35 ? 'triste' : 'neutro';
  return build({
    sex: c.sex,
    age,
    appearance: a,
    fat: clamp01(fat),
    muscle,
    health: st.health,
    facialHair: state.wardrobe.facialHair,
    marks,
    expression,
    outfit: playerOutfit(state, content, context),
  });
}

/** Avatar de uma pessoa (família, amigos, amores, filhos, treinador). */
export function derivePersonAvatar(person: Person, content: GameContent, opts: { affection?: number } = {}): AvatarDescriptor | null {
  const a = person.appearance;
  if (!a) return null;
  const age = person.age;
  const muscle = clamp01((person.athletic / 100) * 0.9 - 0.1) * growthAt(age);
  const fat = clamp01(0.3 + (50 - person.athletic) / 160 + (a.genes.weightGain - 0.5) * 0.35 + (age > 40 ? 0.06 : 0) - (person.health < 35 ? 0.08 : 0));
  const expression: Expression = !person.alive ? 'neutro' : person.health < 30 ? 'cansado' : (opts.affection ?? 50) >= 70 ? 'feliz' : (opts.affection ?? 50) <= 20 ? 'triste' : 'neutro';
  const seed = Number(person.id.replace(/\D/g, '')) || 1;
  return build({ sex: person.sex, age, appearance: a, fat, muscle, health: person.health, facialHair: a.facialHair, expression, outfit: pickOutfit(content, age, seed + a.genes.lipVolume) });
}

/** Aparência derivada (não guardada) de um lutador do elenco: UF pelo peso populacional, genes pela cor. */
export function npcAppearance(seed: string, npc: Pick<Npc, 'id'>, sex: Sex, content: GameContent): Appearance {
  const rng = createRng(seedToState(`${seed}:npc-look:${npc.id}`));
  return randomAppearance(rng, pickUf(rng, content.geo), sex);
}

/** Avatar de um lutador NPC: força/condicionamento e categoria de peso definem o corpo. */
/** Dados mínimos de um lutador (NPC do elenco ou adversário de uma oferta; sem idade, 28). */
export type NpcLike = Pick<Npc, 'id' | 'strength' | 'fitness' | 'style'> & { age?: number };

export function deriveNpcAvatar(seed: string, npc: NpcLike, sex: Sex, content: GameContent, opts: { heavy?: number; champion?: boolean } = {}): AvatarDescriptor {
  const a = npcAppearance(seed, npc, sex, content);
  const muscle = clamp01((npc.strength + npc.fitness) / 200 + 0.1);
  const fat = clamp01(0.12 + (opts.heavy ?? 0.4) * 0.35 + (a.genes.weightGain - 0.5) * 0.15 - (npc.fitness - 60) / 300);
  const s = Number(npc.id.replace(/\D/g, '')) || 1;
  const outfit = opts.champion ? wear(content, 'roupao', Math.floor(frac(s, 2) * 3)) : pickOutfit(content, npc.age ?? 28, s, 'luta');
  return build({
    sex,
    age: npc.age ?? 28,
    appearance: a,
    fat,
    muscle,
    health: 85,
    facialHair: a.facialHair,
    marks: { scar: frac(s, 13) < 0.25, brokenNose: frac(s, 17) < 0.2, cauliflowerEar: npc.style === 'grappler' && frac(s, 19) < 0.5, blackEye: false },
    expression: 'neutro',
    outfit,
  });
}

/** Prévia da criação de personagem: a mesma aparência em qualquer idade ("ver como"). */
export function previewAvatar(appearance: Appearance, sex: Sex, age: number, content: GameContent, opts: { facialHair?: FacialHair; outfitId?: string } = {}): AvatarDescriptor {
  const muscle = clamp01(0.3 - (age > 60 ? (age - 60) / 100 : 0)) * growthAt(age);
  const fat = clamp01(0.32 + (appearance.genes.weightGain - 0.5) * 0.3 + (age > 40 ? 0.08 : 0));
  const outfit = opts.outfitId && outfitDef(content, opts.outfitId) && outfitFitsAge(outfitDef(content, opts.outfitId)!, age) ? wear(content, opts.outfitId, 0) : pickOutfit(content, age, 7);
  return build({ sex, age, appearance, fat, muscle, health: age > 75 ? 60 : 90, facialHair: opts.facialHair ?? appearance.facialHair, expression: 'feliz', outfit });
}

/** Hash estável do descriptor (cache de miniaturas). */
export function avatarHash(d: AvatarDescriptor): string {
  const s = JSON.stringify(d);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}
