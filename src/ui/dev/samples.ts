/** Amostras da pixel art para /dev/avatars e para scripts/pixel-sheet.ts (mesmos descriptors da engine). */
import { GAME_CONTENT as C } from '../../content';
import type { Appearance, AvatarDescriptor, Build, Race, Worn } from '../../engine';
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
