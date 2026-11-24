/** Amostras da pixel art para /dev/avatars e para scripts/pixel-sheet.ts (mesmos descriptors da engine). */
import { GAME_CONTENT as C } from '../../content';
import type { Appearance, AvatarDescriptor, Build, OutfitPiece, Race, Worn } from '../../engine';
import { BUILDS, HAIR_STYLES, createRng, deriveNpcAvatar, generateNpc, genesForRace, previewAvatar, randomAppearance, ufOrDefault } from '../../engine';

const look = (race: Race, seed: number, patch: Partial<Appearance['genes']> = {}): Appearance => ({ genes: { ...genesForRace(createRng(seed), race), ...patch }, race, facialHair: 'nenhuma' });
export const BASE = look('parda', 4, { hairType: 'liso', skinTone: 0.5, freckles: 0, moles: 0 });
export const WORN: Worn = { cima: { id: 'camiseta', color: 2 }, baixo: { id: 'calca_jeans', color: 0 }, calcado: { id: 'tenis', color: 0 } };
const FB: Record<Build, [number, number]> = { magro: [0.12, 0.15], medio: [0.35, 0.3], atletico: [0.3, 0.5], musculoso: [0.2, 0.8], acima: [0.8, 0.3] };
const pv = (a: Appearance, sex: 'M' | 'F', age: number, o: Parameters<typeof previewAvatar>[4] = {}) => previewAvatar(a, sex, age, C, { worn: WORN, ...o });

const NPC_WORN: Worn[] = [
  { cima: { id: 'polo', color: 1 }, baixo: { id: 'bermuda', color: 3 }, calcado: { id: 'chinelo', color: 0 } },
  { inteira: { id: 'vestido', color: 2 }, calcado: { id: 'tenis', color: 1 } },
  { cima: { id: 'xadrez', color: 0 }, baixo: { id: 'calca_jeans', color: 1 }, calcado: { id: 'bota', color: 0 } },
  { cima: { id: 'blusa', color: 3 }, baixo: { id: 'saia', color: 0 }, calcado: { id: 'tenis', color: 2 } },
  { cima: { id: 'moletom', color: 2 }, baixo: { id: 'calca_moletom', color: 0 }, calcado: { id: 'tenis', color: 0 } },
  { cima: { id: 'social', color: 1 }, baixo: { id: 'calca_social', color: 0 }, calcado: { id: 'sapato', color: 0 }, agasalho: { id: 'jaqueta', color: 1 } },
];

export const STAGE_AGES = [1, 8, 15, 30, 72] as const;

export function firstCharacter(): AvatarDescriptor {
  const d = pv(BASE, 'M', 30, { fat: FB.medio[0], muscle: FB.medio[1] });
  return { ...d, hair: { ...d.hair, style: 'curto' } };
}

/** 5 fases × 5 tipos físicos (linhas = fases). */
export function stagesByBuild(sex: 'M' | 'F'): AvatarDescriptor[][] {
  return STAGE_AGES.map((age) => BUILDS.map((b) => pv(BASE, sex, age, { fat: FB[b][0], muscle: FB[b][1] })));
}

export function skinRamp(): AvatarDescriptor[] {
  return [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map((t, i) => pv({ ...BASE, genes: { ...BASE.genes, skinTone: t } }, i % 2 ? 'F' : 'M', 28));
}

/** Todos os estilos de cabelo em 3 cores (e tipos). */
export function hairs(): AvatarDescriptor[][] {
  return HAIR_STYLES.map((st) =>
    ([['liso', 0.05], ['cacheado', 0.35], ['crespo', 0.75]] as const).map(([type, color], i) => pv({ ...BASE, hairStyle: st, genes: { ...BASE.genes, hairType: type, hairColor: color, red: i === 1 && st === 'longo' } }, i === 2 ? 'M' : 'F', 26)),
  );
}

export function beards(): AvatarDescriptor[] {
  return (['nenhuma', 'por_fazer', 'rala', 'barba', 'bigode', 'cavanhaque'] as const).map((f) => pv(BASE, 'M', 40, { facialHair: f }));
}

export function faces(): AvatarDescriptor[] {
  const out = (['feliz', 'neutro', 'triste', 'cansado', 'bravo', 'machucado'] as const).map((ex) => pv(BASE, 'M', 30, { expression: ex }));
  for (const shape of ['amendoado', 'redondo', 'alongado', 'palpebra_lisa'] as const) out.push(pv({ ...BASE, genes: { ...BASE.genes, eyeShape: shape, freckles: 0.8, moles: 0.6 } }, 'F', 24));
  return out;
}

/** Todas as roupas (adulto) num corpo magro e num acima do peso. */
export function outfits(kind: 'magro' | 'acima'): AvatarDescriptor[] {
  const [fat, muscle] = FB[kind];
  return C.outfits
    .filter((o) => o.minAge <= 30 && o.maxAge >= 30 && o.id !== 'descalco')
    .map((o) => {
      const w: Worn =
        o.layer === 'inteira'
          ? { inteira: { id: o.id, color: 0 }, calcado: { id: 'tenis', color: 0 }, ...(o.id === 'kimono' ? { acessorio: { id: 'faixa', color: 2 } } : {}) }
          : o.layer === 'calcado' || o.layer === 'agasalho' || o.layer === 'acessorio'
            ? { ...WORN, [o.layer]: { id: o.id, color: 0 } }
            : { ...WORN, [o.layer]: { id: o.id, color: 0 } };
      return previewAvatar(BASE, kind === 'magro' ? 'F' : 'M', 30, C, { worn: w, fat, muscle });
    });
}

export function marks(): AvatarDescriptor[] {
  const m = pv(BASE, 'M', 28, { muscle: 0.7, fat: 0.2 });
  return [
    { ...m, outfit: { inteira: { id: 'kimono', color: '#f7f5f0', pattern: 'liso' }, acessorio: { id: 'faixa', color: '#6b3fa0', pattern: 'liso' }, calcado: { id: 'descalco', color: '#000000', pattern: 'liso' } } },
    { ...m, marks: { scar: true, brokenNose: true, cauliflowerEar: true, blackEye: true }, expression: 'machucado' },
    { ...pv(BASE, 'M', 78), wrinkles: 0.9 },
  ];
}

/** 24 NPCs aleatórios gerados pela engine (UF, cor ou raça e genes pela engine; lutadores do elenco incluídos). */
export function npcs(): AvatarDescriptor[] {
  const out: AvatarDescriptor[] = [];
  for (let i = 0; i < 24; i++) {
    const rng = createRng(500 + i);
    const uf = ufOrDefault(C.geo, C.geo.ufs[(i * 7) % C.geo.ufs.length]!.sigla);
    const sex = i % 2 ? 'F' : 'M';
    const a = randomAppearance(rng, uf, sex);
    const age = [4, 12, 19, 26, 34, 45, 58, 70][i % 8]!;
    out.push(i % 5 === 4 ? deriveNpcAvatar('dev', generateNpc(rng, `n${i}`, 55, sex, C, 27), sex, C) : previewAvatar(a, sex, age, C, { fat: rng.next() * 0.8, muscle: rng.next() * 0.6, expression: 'neutro', worn: NPC_WORN[i % NPC_WORN.length]! }));
  }
  return out;
}

/** Adulto do modo lado a lado (release 0.0.3): mesmo descriptor no pixel art e no cartoon. */
export interface AbSample {
  label: string;
  d: AvatarDescriptor;
}

/** 6 adultos variados: os dois sexos, pele do mais claro ao mais escuro, tipos de cabelo e físicos diferentes. */
export function abAdults(): AbSample[] {
  const mk = (label: string, race: Race, seed: number, sex: 'M' | 'F', age: number, genes: Partial<Appearance['genes']>, o: { style: Appearance['hairStyle']; worn: Worn; build: Build; facialHair?: Appearance['facialHair']; expression?: AvatarDescriptor['expression'] }): AbSample => {
    const a: Appearance = { ...look(race, seed, { freckles: 0, moles: 0, ...genes }), ...(o.style ? { hairStyle: o.style } : {}) };
    const [fat, muscle] = FB[o.build];
    return { label, d: previewAvatar(a, sex, age, C, { worn: o.worn, fat, muscle, facialHair: o.facialHair ?? 'nenhuma', expression: o.expression ?? 'feliz' }) };
  };
  return [
    mk('Homem, 30 · pele clara · liso curto · médio', 'branca', 11, 'M', 30, { skinTone: 0.04, undertone: -0.4, hairType: 'liso', hairColor: 0.45, eyeColor: 'azul', eyeShape: 'amendoado', faceShape: 'oval', noseWidth: 0.35, lipVolume: 0.3, baldness: 0 }, { style: 'curto', build: 'medio', facialHair: 'por_fazer', worn: { cima: { id: 'camiseta', color: 2 }, baixo: { id: 'calca_jeans', color: 0 }, calcado: { id: 'tenis', color: 0 } } }),
    mk('Mulher, 27 · ondulado longo · magra', 'parda', 12, 'F', 27, { skinTone: 0.36, undertone: 0.4, hairType: 'ondulado', hairColor: 0.18, eyeColor: 'castanho', eyeShape: 'amendoado', faceShape: 'coracao', noseWidth: 0.4, lipVolume: 0.6, freckles: 0.5 }, { style: 'longo', build: 'magro', worn: { cima: { id: 'blusa', color: 0 }, baixo: { id: 'saia', color: 0 }, calcado: { id: 'tenis', color: 1 } } }),
    mk('Homem, 42 · pele bem escura · crespo · acima do peso · barba', 'preta', 13, 'M', 42, { skinTone: 1, undertone: 0.1, hairType: 'crespo', hairColor: 0.02, eyeColor: 'castanho_escuro', eyeShape: 'redondo', faceShape: 'redondo', noseWidth: 0.8, lipVolume: 0.8, baldness: 0 }, { style: 'curto', build: 'acima', facialHair: 'barba', worn: { cima: { id: 'polo', color: 1 }, baixo: { id: 'bermuda', color: 3 }, calcado: { id: 'chinelo', color: 0 } } }),
    mk('Mulher, 34 · pele escura · black power · atlética', 'preta', 14, 'F', 34, { skinTone: 0.8, undertone: 0.3, hairType: 'crespo', hairColor: 0.06, eyeColor: 'castanho_escuro', eyeShape: 'redondo', faceShape: 'oval', noseWidth: 0.65, lipVolume: 0.9 }, { style: 'black_power', build: 'atletico', worn: { inteira: { id: 'vestido', color: 2 }, calcado: { id: 'sapato', color: 0 } } }),
    mk('Homem, 24 · cacheado médio · musculoso', 'parda', 15, 'M', 24, { skinTone: 0.58, undertone: 0.5, hairType: 'cacheado', hairColor: 0.12, eyeColor: 'mel', eyeShape: 'alongado', faceShape: 'quadrado', noseWidth: 0.55, lipVolume: 0.5, baldness: 0 }, { style: 'medio', build: 'musculoso', facialHair: 'cavanhaque', worn: { cima: { id: 'regata', color: 4 }, baixo: { id: 'calca_moletom', color: 1 }, calcado: { id: 'tenis', color: 2 } } }),
    mk('Mulher, 50 · liso · coque · camisa social', 'amarela', 16, 'F', 50, { skinTone: 0.18, undertone: 0.6, hairType: 'liso', hairColor: 0.05, eyeColor: 'castanho_escuro', eyeShape: 'palpebra_lisa', faceShape: 'longo', noseWidth: 0.3, lipVolume: 0.35 }, { style: 'coque', build: 'medio', expression: 'neutro', worn: { cima: { id: 'social', color: 1 }, baixo: { id: 'calca_social', color: 1 }, calcado: { id: 'sapato', color: 0 } } }),
  ];
}

// ——— release 0.0.3: cartoon como visual padrão (seções da /dev/avatars) ———

export interface Labeled {
  label: string;
  d: AvatarDescriptor;
}

/** Peça do catálogo (cor pelo índice). */
function pc(id: string, color = 0, accent?: string): OutfitPiece {
  if (id === 'prajied') return { id, color: ['#f1f1ee', '#c2413a', '#2f5fb3', '#1b1b1b'][color] ?? '#c2413a', pattern: 'liso', ...(accent ? { accent } : {}) };
  const o = C.outfits.find((x) => x.id === id)!;
  return { id, color: o.colors[Math.min(color, o.colors.length - 1)]!, pattern: o.pattern ?? 'liso', ...(accent ? { accent } : {}) };
}

const PHASE_LOOK: Appearance = { ...look('parda', 21, { hairType: 'ondulado', skinTone: 0.42, hairColor: 0.15, freckles: 0.2, moles: 0.3, eyeColor: 'castanho' }), hairStyle: 'curto' };
const PHASE_LOOK_F: Appearance = { ...look('parda', 22, { hairType: 'ondulado', skinTone: 0.42, hairColor: 0.15, freckles: 0.2, moles: 0.3, eyeColor: 'castanho' }), hairStyle: 'longo' };

/** O mesmo personagem nas 5 fases (1, 8, 15, 30 e 72 anos), menino/homem e menina/mulher. */
export function phases(sex: 'M' | 'F'): Labeled[] {
  const a = sex === 'M' ? PHASE_LOOK : PHASE_LOOK_F;
  return STAGE_AGES.map((age) => ({ label: `${age} ${age === 1 ? 'ano' : 'anos'}`, d: previewAvatar(a, sex, age, C, { worn: WORN, facialHair: age >= 30 && sex === 'M' ? 'por_fazer' : 'nenhuma', expression: 'feliz' }) }));
}

/** Os 5 tipos físicos de um adulto (roupa do dia a dia ou de treino). */
export function physiques(sex: 'M' | 'F', kind: 'dia' | 'treino'): Labeled[] {
  const worn: Worn = kind === 'dia'
    ? { cima: { id: 'camiseta', color: sex === 'M' ? 2 : 7 }, baixo: { id: 'bermuda', color: 0 }, calcado: { id: 'tenis', color: 0 } }
    : { cima: { id: 'regata_treino', color: 0 }, baixo: { id: 'shorts_luta', color: 2 }, calcado: { id: 'descalco', color: 0 } };
  const a: Appearance = { ...look(sex === 'M' ? 'preta' : 'branca', sex === 'M' ? 31 : 32, { hairType: sex === 'M' ? 'crespo' : 'liso', skinTone: sex === 'M' ? 0.7 : 0.15, hairColor: 0.1, freckles: 0, moles: 0 }), hairStyle: sex === 'M' ? 'curto' : 'rabo' };
  return BUILDS.map((b) => ({ label: b, d: previewAvatar(a, sex, 28, C, { worn, fat: FB[b][0], muscle: FB[b][1], expression: 'neutro' }) }));
}

/** Rampa de pele do mais claro ao mais escuro (cartoon). */
export function skinRampLabeled(): Labeled[] {
  return skinRamp().map((d, i) => ({ label: `tom ${(i / 10).toFixed(1)}`, d }));
}

/** Todos os estilos × tipos de cabelo. */
export function hairGrid(): Labeled[] {
  const out: Labeled[] = [];
  for (const st of HAIR_STYLES)
    for (const [type, color, sex] of [['liso', 0.05, 'M'], ['ondulado', 0.4, 'F'], ['cacheado', 0.3, 'F'], ['crespo', 0.08, 'M']] as const)
      out.push({ label: `${st} · ${type}`, d: previewAvatar({ ...BASE, hairStyle: st, genes: { ...BASE.genes, hairType: type, hairColor: color, skinTone: type === 'crespo' ? 0.8 : 0.4 } }, sex, 26, C, { worn: WORN, expression: 'neutro' }) });
  return out;
}

/** Barbas, expressões, olhos, formatos de rosto, sardas/pintas, marcas da luta, idoso calvo. */
export function faceGrid(): Labeled[] {
  const out: Labeled[] = [];
  for (const f of ['nenhuma', 'por_fazer', 'rala', 'barba', 'bigode', 'cavanhaque'] as const) out.push({ label: `barba: ${f}`, d: pv(BASE, 'M', 40, { facialHair: f, expression: 'neutro' }) });
  for (const ex of ['feliz', 'neutro', 'triste', 'cansado', 'bravo', 'machucado'] as const) out.push({ label: ex, d: pv(BASE, 'F', 30, { expression: ex }) });
  for (const shape of ['amendoado', 'redondo', 'alongado', 'palpebra_lisa'] as const) out.push({ label: `olho ${shape}`, d: pv({ ...BASE, genes: { ...BASE.genes, eyeShape: shape, freckles: 0.8, moles: 0.6 } }, 'F', 24) });
  for (const fs of ['oval', 'redondo', 'quadrado', 'coracao', 'longo'] as const) out.push({ label: `rosto ${fs}`, d: pv({ ...BASE, genes: { ...BASE.genes, faceShape: fs, noseWidth: fs === 'quadrado' ? 0.9 : 0.3, lipVolume: fs === 'coracao' ? 0.9 : 0.3 } }, 'M', 32, { expression: 'neutro' }) });
  const m = pv(BASE, 'M', 28, { muscle: 0.7, fat: 0.2 });
  out.push({ label: 'marcas da luta', d: { ...m, marks: { scar: true, brokenNose: true, cauliflowerEar: true, blackEye: true }, expression: 'machucado' } });
  out.push({ label: 'idoso calvo', d: { ...pv({ ...BASE, genes: { ...BASE.genes, baldness: 1 } }, 'M', 82, { facialHair: 'bigode' }), wrinkles: 0.9 } });
  out.push({ label: 'idosa', d: pv({ ...BASE, hairStyle: 'coque' }, 'F', 78) });
  return out;
}

/** Todas as peças do catálogo (e o prajied), cada uma num personagem coerente com a idade da peça. */
export function outfitGallery(): Labeled[] {
  const out: Labeled[] = [];
  const femOnly = new Set(['vestido', 'vestido_festa', 'biquini', 'maio', 'saia', 'saida_praia', 'blusa', 'cropped', 'maio_infantil']);
  let i = 0;
  for (const o of C.outfits) {
    const age = o.maxAge <= 2 ? 1 : o.maxAge <= 17 ? 8 : o.maxAge <= 25 ? 18 : Math.max(30, o.minAge);
    const sex: 'M' | 'F' = femOnly.has(o.id) ? 'F' : i++ % 2 ? 'F' : 'M';
    const base = previewAvatar({ ...BASE, hairStyle: sex === 'F' ? 'medio' : 'curto' }, sex, age, C, { expression: 'neutro', fat: 0.3, muscle: 0.4 });
    const kid = age < 18;
    const set = (patch: Partial<Record<string, OutfitPiece>>) => ({ ...base, outfit: { cima: pc('camiseta', 2), baixo: pc(kid ? 'bermuda' : 'calca_jeans', 0), calcado: pc('tenis', 0), ...patch } as AvatarDescriptor['outfit'] });
    let d: AvatarDescriptor;
    const p = pc(o.id, 0);
    switch (o.layer) {
      case 'inteira':
        d = { ...base, outfit: { inteira: p, calcado: o.id === 'body' ? pc('meia', 1) : o.context === 'praia' ? pc('chinelo', 0) : o.id === 'kimono' ? pc('descalco') : pc('tenis', 1), ...(o.id === 'kimono' ? { acessorio: pc('faixa', 2) } : {}) } };
        break;
      case 'calcado':
        d = o.id === 'meia' ? { ...base, outfit: { inteira: pc('body', 1), calcado: p } } : set({ calcado: p, baixo: pc('shorts', 1) });
        break;
      case 'cima':
        d = set({ cima: p, ...(o.context === 'praia' ? { baixo: pc('bermuda_infantil', 0), calcado: pc('chinelo') } : {}), ...(o.context === 'luta' ? { baixo: pc('shorts_luta', 1), calcado: pc('descalco') } : {}) });
        break;
      case 'baixo':
        d = set({ baixo: p, cima: pc(o.context === 'farda' ? 'farda_pm' : o.context === 'praia' ? 'camiseta' : 'camiseta', o.context === 'praia' ? 0 : 3), ...(o.context === 'praia' ? { calcado: pc('chinelo') } : {}) });
        break;
      case 'agasalho':
        d = set({ agasalho: p, ...(o.id === 'terno' || o.id === 'cronos_terno' ? { cima: pc('social'), baixo: pc('calca_social') , calcado: pc('sapato') } : {}), ...(o.id === 'colete_pm' ? { cima: pc('farda_pm'), baixo: pc('calca_farda'), calcado: pc('coturno') } : {}), ...(o.id === 'colete_civil' ? { cima: pc('camisa_civil'), baixo: pc('calca_farda', 1), calcado: pc('coturno') } : {}), ...(o.id === 'saida_praia' ? { cima: undefined, baixo: undefined, inteira: pc('biquini', 1), calcado: pc('chinelo') } : {}), ...(o.id === 'roupao' ? { cima: pc('regata_treino'), baixo: pc('shorts_luta'), calcado: pc('descalco') } : {}) });
        break;
      default:
        d = o.id === 'faixa' ? { ...base, outfit: { inteira: pc('kimono'), acessorio: p, calcado: pc('descalco') } } : set({ acessorio: p, ...(o.id === 'bone_pm' || o.id === 'capacete' ? { cima: pc(o.id === 'capacete' ? 'farda_tatica' : 'farda_pm'), baixo: pc('calca_farda'), calcado: pc('coturno') } : {}), ...(o.id === 'algemas' ? { cima: undefined, baixo: undefined, inteira: pc('uniforme_presidiario'), calcado: pc('chinelo') } : {}) });
    }
    for (const k of Object.keys(d.outfit) as (keyof AvatarDescriptor['outfit'])[]) if (!d.outfit[k]) delete d.outfit[k];
    out.push({ label: o.name, d });
  }
  const m = previewAvatar(BASE, 'M', 26, C, { expression: 'neutro', fat: 0.2, muscle: 0.7 });
  out.push({ label: 'Prajied (muay thai)', d: { ...m, outfit: { cima: pc('regata_treino', 2), baixo: pc('shorts_luta', 1), calcado: pc('descalco'), acessorio: pc('prajied', 1, '#e3a72f') } } });
  return out;
}

/** Fardas, prisão, praia (adultos e crianças) e luta. */
export function uniformsBeach(): Labeled[] {
  const M = previewAvatar({ ...BASE, hairStyle: 'curto' }, 'M', 32, C, { expression: 'neutro', fat: 0.3, muscle: 0.55 });
  const F = previewAvatar({ ...look('preta', 41, { hairType: 'crespo', skinTone: 0.85, freckles: 0, moles: 0 }), hairStyle: 'rabo' }, 'F', 29, C, { expression: 'neutro', fat: 0.3, muscle: 0.5 });
  const F2 = previewAvatar({ ...look('branca', 42, { hairType: 'ondulado', skinTone: 0.1, hairColor: 0.6, freckles: 0.6 }), hairStyle: 'longo' }, 'F', 33, C, { expression: 'feliz', fat: 0.35, muscle: 0.3 });
  const M2 = previewAvatar({ ...look('preta', 43, { hairType: 'crespo', skinTone: 1, freckles: 0 }), hairStyle: 'raspado' }, 'M', 36, C, { expression: 'feliz', fat: 0.6, muscle: 0.3 });
  const kidF = previewAvatar({ ...BASE, hairStyle: 'rabo' }, 'F', 8, C, { expression: 'feliz' });
  const kidM = previewAvatar({ ...BASE, hairStyle: 'curto' }, 'M', 6, C, { expression: 'feliz' });
  const teen = previewAvatar({ ...look('amarela', 44, { hairType: 'liso', skinTone: 0.25 }), hairStyle: 'franja' }, 'F', 15, C, { expression: 'neutro' });
  const kidJ = previewAvatar({ ...BASE, hairStyle: 'curto' }, 'M', 10, C, { expression: 'feliz' });
  const W = (d: AvatarDescriptor, outfit: AvatarDescriptor['outfit']): AvatarDescriptor => ({ ...d, outfit });
  return [
    { label: 'PM (farda, colete, boné)', d: W(M, { cima: pc('farda_pm'), agasalho: pc('colete_pm'), baixo: pc('calca_farda', 0), calcado: pc('coturno'), acessorio: pc('bone_pm') }) },
    { label: 'PM (policial)', d: W(F, { cima: pc('farda_pm'), agasalho: pc('colete_pm'), baixo: pc('calca_farda', 0), calcado: pc('coturno'), acessorio: pc('bone_pm') }) },
    { label: 'Civil (colete com distintivo)', d: W(M2, { cima: pc('camisa_civil'), agasalho: pc('colete_civil'), baixo: pc('calca_farda', 1), calcado: pc('coturno') }) },
    { label: 'Força especial', d: W(M, { cima: pc('farda_tatica'), agasalho: pc('colete_pm'), baixo: pc('calca_farda', 2), calcado: pc('coturno'), acessorio: pc('capacete') }) },
    { label: 'Presídio + algemas', d: W(M2, { inteira: pc('uniforme_presidiario'), calcado: pc('chinelo'), acessorio: pc('algemas') }) },
    { label: 'Presídio', d: W(F, { inteira: pc('uniforme_presidiario'), calcado: pc('chinelo') }) },
    { label: 'Biquíni (18+)', d: W(F2, { inteira: pc('biquini', 1), calcado: pc('chinelo', 1) }) },
    { label: 'Maiô + saída (18+)', d: W(F, { inteira: pc('maio', 1), agasalho: pc('saida_praia', 0), calcado: pc('chinelo') }) },
    { label: 'Sunga (18+, camiseta de reserva)', d: W(M, { baixo: pc('sunga', 1), calcado: pc('chinelo') }) },
    { label: 'Bermuda de praia (18+)', d: W(M2, { baixo: pc('bermuda_praia', 1), calcado: pc('chinelo', 2) }) },
    { label: 'Maiô infantil', d: W(kidF, { inteira: pc('maio_infantil', 0), calcado: pc('chinelo', 1) }) },
    { label: 'Camiseta UV + bermuda infantil', d: W(kidM, { cima: pc('camiseta_uv', 0), baixo: pc('bermuda_infantil', 2), calcado: pc('chinelo') }) },
    { label: 'Adolescente na praia', d: W(teen, { cima: pc('camiseta_uv', 1), baixo: pc('bermuda_infantil', 1), calcado: pc('chinelo', 2) }) },
    { label: 'Kimono faixa preta', d: W(M, { inteira: pc('kimono'), acessorio: pc('faixa', 4), calcado: pc('descalco') }) },
    { label: 'Kimono infantil (cinza c/ listra)', d: W(kidJ, { inteira: pc('kimono'), acessorio: { id: 'faixa', color: '#8f949c', pattern: 'liso', accent: '#f1f1ee' }, calcado: pc('descalco') }) },
    { label: 'Kimono azul (faixa roxa)', d: W(F, { inteira: pc('kimono', 1), acessorio: pc('faixa', 2), calcado: pc('descalco') }) },
    { label: 'Muay thai + prajied', d: W(M2, { cima: pc('regata_treino', 1), baixo: pc('shorts_luta', 1), calcado: pc('descalco'), acessorio: pc('prajied', 2, '#e3a72f') }) },
    { label: 'Rashguard + roupão', d: W(M, { cima: pc('rashguard', 0), baixo: pc('shorts_luta', 0), calcado: pc('descalco'), agasalho: pc('roupao', 0) }) },
  ];
}
