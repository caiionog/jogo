import { gradeLevel } from '../../fighting/belts';
import type { ModalityId } from '../../fighting/types';
/**
 * Aparência dinâmica: `deriveAvatar` calcula tudo o que o renderizador precisa a partir do estado.
 * Nada disso é guardado no save — só os genes (fixos) e o guarda-roupa. A UI apenas desenha o descriptor
 * (Etapa 8: pixel art de corpo inteiro, por camadas).
 */
import type { GameContent } from '../../core/content';
import { createRng, seedToState } from '../../core/rng';
import type { GameState, Sex } from '../../core/state';
import { bmiAt } from '../../fighting/body';
import type { Npc } from '../../fighting/types';
import { pickUf } from '../../geo';
import type { Person } from '../../relationships/types';
import { EYE_RGB, HAIR_STYLES, hairRgb, rgbHex, skinRgb } from './genes';
import type { Appearance, EyeShape, FaceShape, FacialHair, HairStyle, HairType } from './genes';
import { randomAppearance } from './inherit';
import { outfitDef, outfitFitsAge } from './outfits';
import type { OutfitLayer, OutfitPattern, Worn } from './outfits';

export type AgeStage = 'bebe' | 'crianca' | 'adolescente' | 'adulto' | 'idoso';
export type Expression = 'feliz' | 'neutro' | 'triste' | 'cansado' | 'bravo' | 'machucado';
/** Tipo físico (silhueta da pixel art), derivado de gordura e musculatura. */
export type Build = 'magro' | 'medio' | 'atletico' | 'musculoso' | 'acima';
export const BUILDS: readonly Build[] = ['magro', 'medio', 'atletico', 'musculoso', 'acima'];
/** `treino`: roupa da modalidade principal (kimono + faixa, shorts + prajied…). */
export type AvatarContext = 'principal' | 'luta' | 'treino' | 'casamento' | 'formatura' | 'lista';

export interface OutfitPiece {
  id: string;
  /** Cor base (hex) — o renderizador gera a rampa. */
  color: string;
  pattern: OutfitPattern;
  /** Segunda cor: listra da faixa infantil, ponta do prajied (release 0.0.1). */
  accent?: string;
}
export type AvatarOutfit = Partial<Record<OutfitLayer, OutfitPiece>>;

export interface AvatarDescriptor {
  sex: Sex;
  age: number;
  stage: AgeStage;
  /** 0 = recém-nascido … 1 = adulto (crescimento contínuo pela idade). */
  growth: number;
  /** 0 até ~55 anos … 1 aos ~90 (postura, rosto, pele). */
  elder: number;
  fat: number;
  muscle: number;
  build: Build;
  skin: string;
  hair: { type: HairType; style: HairStyle; color: string; grey: number; baldness: number };
  eyes: { color: string; shape: EyeShape };
  noseWidth: number;
  lipVolume: number;
  faceShape: FaceShape;
  freckles: number;
  moles: number;
  wrinkles: number;
  facialHair: FacialHair;
  marks: { scar: boolean; brokenNose: boolean; cauliflowerEar: boolean; blackEye: boolean };
  expression: Expression;
  outfit: AvatarOutfit;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const r2 = (x: number) => Math.round(x * 100) / 100;


export function ageStage(age: number): AgeStage {
  return age <= 2 ? 'bebe' : age <= 11 ? 'crianca' : age <= 17 ? 'adolescente' : age <= 59 ? 'adulto' : 'idoso';
}

/** Crescimento contínuo de 0 (bebê) a 1 (adulto aos ~20). */
export function growthAt(age: number): number {
  return r2(clamp01(Math.pow(Math.min(age, 20) / 20, 0.75)));
}

export function elderAt(age: number): number {
  return r2(clamp01((age - 55) / 35));
}

export function buildOf(fat: number, muscle: number): Build {
  if (fat >= 0.62) return 'acima';
  if (muscle >= 0.62 && fat < 0.45) return 'musculoso';
  if (muscle >= 0.42) return 'atletico';
  if (fat < 0.22 && muscle < 0.3) return 'magro';
  return 'medio';
}

/** Pseudoaleatório estável a partir de um número (estilos que não estão nos genes). */
function frac(x: number, k: number): number {
  const v = Math.sin(x * 12.9898 * k + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** Estilo de cabelo de quem não escolheu: estável pelos genes; todo estilo pode aparecer para qualquer pessoa. */
function hairStyleFor(sex: Sex, age: number, a: Appearance): HairStyle {
  if (a.hairStyle) return a.hairStyle;
  if (age <= 1) return 'curto';
  const r = frac(a.genes.weightGain + a.genes.noseWidth + a.genes.lipVolume, 3);
  const curly = a.genes.hairType === 'cacheado' || a.genes.hairType === 'crespo';
  // pesos por sexo (moda, não genética); black power só com cabelo cacheado/crespo (física do cabelo)
  const w: Partial<Record<HairStyle, number>> =
    sex === 'M'
      ? { raspado: 14, curto: 40, medio: 10, moicano: 3, dreads: 4, trancas: 3, franja: 4, longo: 3, rabo: 1, black_power: curly ? 8 : 0 }
      : { curto: 10, medio: 20, longo: 24, rabo: 12, coque: 10, franja: 8, trancas: 6, dreads: 3, raspado: 2, black_power: curly ? 10 : 0 };
  const keys = HAIR_STYLES.filter((k) => (w[k] ?? 0) > 0);
  const total = keys.reduce((t, k) => t + (w[k] ?? 0), 0);
  let x = r * total;
  for (const k of keys) {
    x -= w[k] ?? 0;
    if (x < 0) return k;
  }
  return 'curto';
}

interface BodyInputs {
  sex: Sex;
  age: number;
  appearance: Appearance;
  fat: number;
  muscle: number;
  health: number;
  facialHair: FacialHair;
  hairStyle?: HairStyle;
  marks?: AvatarDescriptor['marks'];
  expression: Expression;
  outfit: AvatarOutfit;
}

function build(i: BodyInputs): AvatarDescriptor {
  const g = i.appearance.genes;
  const age = i.age;
  const greyStart = 34 + frac(g.weightGain, 7) * 18;
  const grey = r2(clamp01((age - greyStart) / 28));
  const baldness = r2(i.sex === 'M' ? clamp01((age - 24) / 36) * Math.pow(g.baldness, 1.4) : clamp01((age - 50) / 40) * g.baldness * 0.25);
  const wrinkles = r2(clamp01((age - 30) / 55) * (1 + (1 - i.health / 100) * 0.4));
  const fat = r2(i.fat);
  const muscle = r2(i.muscle);
  return {
    sex: i.sex,
    age,
    stage: ageStage(age),
    growth: growthAt(age),
    elder: elderAt(age),
    fat,
    muscle,
    build: buildOf(fat, muscle),
    skin: rgbHex(skinRgb(g.skinTone, g.undertone)),
    hair: { type: g.hairType, style: i.hairStyle ?? hairStyleFor(i.sex, age, i.appearance), color: rgbHex(hairRgb(g.hairColor, g.red, grey)), grey, baldness },
    eyes: { color: rgbHex(EYE_RGB[g.eyeColor]), shape: g.eyeShape },
    noseWidth: r2(g.noseWidth),
    lipVolume: r2(g.lipVolume),
    faceShape: g.faceShape,
    freckles: r2(g.freckles ?? 0),
    moles: r2(g.moles ?? 0),
    wrinkles,
    facialHair: age >= 16 ? i.facialHair : 'nenhuma',
    marks: i.marks ?? { scar: false, brokenNose: false, cauliflowerEar: false, blackEye: false },
    expression: i.expression,
    outfit: i.outfit,
  };
}

function piece(content: GameContent, id: string, color: number): OutfitPiece | undefined {
  const o = outfitDef(content, id);
  if (!o) return undefined;
  return { id: o.id, color: o.colors[Math.max(0, Math.min(color, o.colors.length - 1))] ?? '#888888', pattern: o.pattern ?? 'liso' };
}

function wornToOutfit(content: GameContent, worn: Worn, age: number): AvatarOutfit {
  const out: AvatarOutfit = {};
  for (const [layer, w] of Object.entries(worn) as [OutfitLayer, { id: string; color: number }][]) {
    const o = outfitDef(content, w.id);
    if (!o || !outfitFitsAge(o, age)) continue;
    const p = piece(content, w.id, w.color);
    if (p) out[layer] = p;
  }
  return out;
}

/** Roupa de quem não escolhe (NPCs e fallback): peças do dia a dia sorteadas de forma estável. */
function casualOutfit(content: GameContent, age: number, sex: Sex, seed: number): AvatarOutfit {
  if (age <= 2) return { inteira: piece(content, 'body', Math.floor(frac(seed, 2) * 5))!, calcado: piece(content, 'meia', 0)! };
  const pick = (ids: string[], k: number) => {
    const fit = ids.filter((id) => {
      const o = outfitDef(content, id);
      return o && outfitFitsAge(o, age);
    });
    const id = fit[Math.floor(frac(seed, k) * fit.length)] ?? ids[0]!;
    const o = outfitDef(content, id)!;
    return piece(content, id, Math.floor(frac(seed, k + 1) * o.colors.length))!;
  };
  const dress = sex === 'F' && frac(seed, 31) < 0.25;
  if (dress) return { inteira: pick(['vestido'], 5), calcado: pick(['tenis', 'chinelo', 'sapato'], 7) };
  return {
    cima: pick(['camiseta', 'camiseta', 'camiseta_listrada', 'camiseta_estampa', 'polo', 'regata', 'blusa', 'moletom', 'xadrez', 'social'], 11),
    baixo: pick(sex === 'F' ? ['calca_jeans', 'calca_jeans', 'saia', 'shorts', 'bermuda'] : ['calca_jeans', 'calca_jeans', 'bermuda', 'calca_moletom', 'shorts'], 13),
    calcado: pick(['tenis', 'tenis', 'chinelo', 'bota', 'sapato'], 17),
  };
}

/**
 * Modalidade principal para o avatar de treino: a treinada no ano, senão a de graduação mais alta, senão a primeira da
 * academia. `undefined` se o personagem não pratica nada.
 */
export function mainModality(state: GameState, content: GameContent): ModalityId | undefined {
  const f = state.fighter;
  if (f.trainedThisYear.length) return f.trainedThisYear[0];
  const graded = (Object.entries(f.grades) as [ModalityId, { rank: number }][]).sort((a, b) => b[1].rank - a[1].rank)[0];
  if (graded) return graded[0];
  return content.fighting.gyms.find((g) => g.id === f.gymId)?.modalities[0];
}

/**
 * Roupa de treino da modalidade: jiu-jitsu e judô de kimono com a faixa da graduação (listra das faixas infantis
 * incluída); muay thai com shorts e o prajied no braço (cor e ponta da graduação); boxe, wrestling e kickboxing de
 * regata e shorts.
 */
export function gradeOutfit(state: GameState, content: GameContent, mod: ModalityId): AvatarOutfit {
  const age = state.character.age;
  const lvl = gradeLevel(content, state.fighter.grades[mod]);
  const feet = piece(content, 'descalco', 0)!;
  if (mod === 'jiujitsu' || mod === 'judo') {
    const belt: OutfitPiece = { id: 'faixa', color: lvl?.color ?? '#f1f1ee', pattern: 'liso', ...(lvl?.stripe ? { accent: lvl.stripe } : {}) };
    return { inteira: piece(content, 'kimono', 0)!, acessorio: belt, calcado: feet };
  }
  const top = piece(content, age < 14 || mod === 'wrestling' || mod === 'muaythai' ? 'regata_treino' : 'rashguard', 0)!;
  const out: AvatarOutfit = { cima: top, baixo: piece(content, 'shorts_luta', mod === 'muaythai' ? 1 : 0)!, calcado: feet };
  if (mod === 'muaythai') out.acessorio = { id: 'prajied', color: lvl?.color ?? '#f1f1ee', pattern: 'liso', ...(lvl?.tip ? { accent: lvl.tip } : {}) };
  return out;
}

/**
 * Roupa de banho pela idade (release 0.0.1). REGRA: biquíni, maiô, sunga, bermuda de praia e saída de praia só com
 * 18+ (`minAge` no catálogo, conferido de novo aqui); antes disso, maiô infantil fechado ou camiseta UV + bermuda.
 */
export function swimOutfit(content: GameContent, age: number, sex: Sex, seed: number): AvatarOutfit {
  const safe = (id: string, color: number) => {
    const o = outfitDef(content, id);
    return o && outfitFitsAge(o, age) ? piece(content, id, color) : undefined;
  };
  const c = Math.floor(frac(seed, 41) * 4);
  const feet = piece(content, 'chinelo', 0) ?? piece(content, 'descalco', 0)!;
  if (age >= 18) {
    if (sex === 'F') return { inteira: (frac(seed, 43) < 0.6 ? safe('biquini', c) : safe('maio', c))!, calcado: feet };
    return { baixo: (frac(seed, 47) < 0.5 ? safe('sunga', c) : safe('bermuda_praia', c))!, calcado: feet };
  }
  if (sex === 'F' && age >= 4) return { inteira: safe('maio_infantil', c % 3)!, calcado: feet };
  return { cima: safe('camiseta_uv', c % 3)!, baixo: safe('bermuda_infantil', c % 3)!, calcado: feet };
}

/** Roupa do personagem: contexto automático (bebê, escola, luta, casamento, formatura) ou o guarda-roupa. */
export function playerOutfit(state: GameState, content: GameContent, context: AvatarContext = 'principal'): AvatarOutfit {
  const age = state.character.age;
  if (context === 'luta') {
    const rules = state.activeFight?.offer.rules;
    if (rules === 'grappling') return gradeOutfit(state, content, 'jiujitsu');
    return { cima: piece(content, age < 14 ? 'regata_treino' : 'rashguard', 0)!, baixo: piece(content, 'shorts_luta', 0)!, calcado: piece(content, 'descalco', 0)! };
  }
  if (context === 'treino') {
    const mod = mainModality(state, content);
    if (mod) return gradeOutfit(state, content, mod);
  }
  if (context === 'casamento' && age >= 16) {
    return state.character.sex === 'F'
      ? { inteira: piece(content, 'vestido_festa', 0)!, calcado: piece(content, 'sapato', 0)! }
      : { cima: piece(content, 'social', 0)!, agasalho: piece(content, 'terno', 0)!, baixo: piece(content, 'calca_social', 0)!, calcado: piece(content, 'sapato', 0)! };
  }
  if (context === 'formatura') return { cima: piece(content, 'camisa_formatura', 0)!, baixo: piece(content, 'calca_jeans', 0)!, calcado: piece(content, 'tenis', 0)! };
  if (age <= 2) return { inteira: piece(content, 'body', 0)!, calcado: piece(content, 'meia', 0)! };
  if (context === 'principal' && state.scene && state.scene.year === state.year) return swimOutfit(content, age, state.character.sex, state.character.birthYear);
  const worn = wornToOutfit(content, state.wardrobe.worn ?? {}, age);
  if (state.education.current && age >= 6 && age <= 17) {
    // dia de escola: uniforme por cima, resto do guarda-roupa
    const { inteira: _i, ...rest } = worn;
    void _i;
    return { ...rest, cima: piece(content, 'uniforme', 0)!, baixo: rest.baixo ?? piece(content, 'calca_jeans', 0)! };
  }
  if (!worn.cima && !worn.inteira) return casualOutfit(content, age, state.character.sex, state.character.birthYear);
  return worn;
}

/** Avatar do personagem do jogador. */
export function deriveAvatar(state: GameState, content: GameContent, context: AvatarContext = 'principal'): AvatarDescriptor {
  const c = state.character;
  const st = c.stats;
  const a = c.appearance;
  const g = a.genes;
  const age = c.age;
  // musculatura: Capacidade atlética + carga de treino recente (Etapa 8), proporcional ao crescimento
  const load = state.fighter.trainingLoad ?? 0;
  const muscle = clamp01((st.athletic / 100) * 0.95 + load * 0.35 - 0.2) * growthAt(age);
  // gordura: IMC (Capacidade atlética, biotipo, idade), genes, padrão de vida, saúde
  const bmi = bmiAt(age, st, c.build);
  let fat = age < 18 ? 0.3 + c.build * 0.07 + (g.weightGain - 0.5) * 0.25 + (st.athletic < 30 ? 0.08 : 0) : (bmi - 19.5) / 12 - muscle * 0.3;
  fat += (g.weightGain - 0.5) * 0.25 + (50 - st.athletic) / 250 - load * 0.08;
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
  const lostThisYear = !!last && last.year === state.year && last.result === 'L';
  const expression: Expression = marks.blackEye
    ? 'machucado'
    : st.health < 35
      ? 'cansado'
      : lostThisYear || (st.happiness <= 25 && st.health >= 50)
        ? 'bravo'
        : st.happiness >= 70
          ? 'feliz'
          : st.happiness <= 35
            ? 'triste'
            : 'neutro';
  return build({
    sex: c.sex,
    age,
    appearance: a,
    fat: clamp01(fat),
    muscle,
    health: st.health,
    facialHair: state.wardrobe.facialHair,
    ...(state.wardrobe.hairStyle ? { hairStyle: state.wardrobe.hairStyle } : {}),
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
  const expression: Expression = !person.alive ? 'neutro' : person.health < 30 ? 'cansado' : (opts.affection ?? 50) >= 70 ? 'feliz' : (opts.affection ?? 50) <= 20 ? 'bravo' : (opts.affection ?? 50) <= 35 ? 'triste' : 'neutro';
  const seed = (Number(person.id.replace(/\D/g, '')) || 1) + a.genes.lipVolume;
  return build({ sex: person.sex, age, appearance: a, fat, muscle, health: person.health, facialHair: a.facialHair, expression, outfit: casualOutfit(content, age, person.sex, seed) });
}

/** Aparência derivada (não guardada) de um lutador do elenco: UF pelo peso populacional, genes pela cor. */
export function npcAppearance(seed: string, npc: Pick<Npc, 'id'>, sex: Sex, content: GameContent): Appearance {
  const rng = createRng(seedToState(`${seed}:npc-look:${npc.id}`));
  return randomAppearance(rng, pickUf(rng, content.geo), sex);
}

/** Dados mínimos de um lutador (NPC do elenco ou adversário de uma oferta; sem idade, 28). */
export type NpcLike = Pick<Npc, 'id' | 'athletic' | 'style'> & { age?: number };

/** Avatar de um lutador NPC: físico e categoria de peso definem o corpo; roupa de luta. */
export function deriveNpcAvatar(seed: string, npc: NpcLike, sex: Sex, content: GameContent, opts: { heavy?: number; champion?: boolean } = {}): AvatarDescriptor {
  const a = npcAppearance(seed, npc, sex, content);
  const muscle = clamp01(npc.athletic / 100 + 0.1);
  const fat = clamp01(0.12 + (opts.heavy ?? 0.4) * 0.35 + (a.genes.weightGain - 0.5) * 0.15 - (npc.athletic - 60) / 300);
  const s = Number(npc.id.replace(/\D/g, '')) || 1;
  const outfit: AvatarOutfit = {
    cima: piece(content, frac(s, 3) < 0.5 ? 'rashguard' : 'regata_treino', Math.floor(frac(s, 4) * 4))!,
    baixo: piece(content, 'shorts_luta', Math.floor(frac(s, 5) * 4))!,
    calcado: piece(content, 'descalco', 0)!,
    ...(opts.champion ? { agasalho: piece(content, 'roupao', Math.floor(frac(s, 2) * 3))! } : {}),
  };
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
export function previewAvatar(
  appearance: Appearance,
  sex: Sex,
  age: number,
  content: GameContent,
  opts: { facialHair?: FacialHair; worn?: Worn; fat?: number; muscle?: number; expression?: Expression } = {},
): AvatarDescriptor {
  const muscle = opts.muscle ?? clamp01(0.3 - (age > 60 ? (age - 60) / 100 : 0)) * growthAt(age);
  const fat = opts.fat ?? clamp01(0.32 + (appearance.genes.weightGain - 0.5) * 0.3 + (age > 40 ? 0.08 : 0));
  const worn = opts.worn ? wornToOutfit(content, opts.worn, age) : {};
  const outfit = age <= 2 ? casualOutfit(content, age, sex, 7) : worn.cima || worn.inteira ? worn : casualOutfit(content, age, sex, 7);
  return build({ sex, age, appearance, fat, muscle, health: age > 75 ? 60 : 90, facialHair: opts.facialHair ?? appearance.facialHair, expression: opts.expression ?? 'feliz', outfit });
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
