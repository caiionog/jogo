import type { GraduationSystem, ModalityDef } from '../../engine';

/**
 * Modalidades (release 0.0.1). Cada uma treina uma das duas habilidades ocultas:
 * - grappling: jiu-jitsu, judô e wrestling (luta olímpica) — quedas, controle e finalização;
 * - trocação: muay thai, boxe e kickboxing — golpes e defesa em pé.
 * `athletic` = fração do ganho de Capacidade atlética do treino físico que a sessão também dá.
 */
export const MODALITIES: readonly ModalityDef[] = [
  { id: 'jiujitsu', label: 'Jiu-jitsu', emoji: '🥋', skill: 'grappling', base: 3.6, athletic: 0.3, graduation: 'bjj_adulto', kidsGraduation: 'bjj_infantil', kidsUntil: 15, sub: 'Chão, raspagens e finalizações' },
  { id: 'judo', label: 'Judô', emoji: '🥋', skill: 'grappling', base: 3.4, athletic: 0.4, graduation: 'judo', sub: 'Quedas, projeções e pegada no kimono' },
  { id: 'wrestling', label: 'Wrestling', emoji: '🤼', skill: 'grappling', base: 3.4, athletic: 0.5, sub: 'Luta olímpica: quedas e controle (sem graduação)' },
  { id: 'muaythai', label: 'Muay thai', emoji: '🥊', skill: 'trocacao', base: 3.8, athletic: 0.4, graduation: 'muaythai_fsbmt', sub: 'Socos, chutes, joelhadas, cotoveladas e clinch' },
  { id: 'boxe', label: 'Boxe', emoji: '🥊', skill: 'trocacao', base: 3.8, athletic: 0.4, sub: 'Socos, esquivas e jogo de pernas (sem graduação)' },
  { id: 'kickboxing', label: 'Kickboxing', emoji: '🦵', skill: 'trocacao', base: 3.8, athletic: 0.4, sub: 'Socos e chutes em ritmo alto (sem graduação)' },
];

// faixas
const WHITE = '#f1f1ee';
const GRAY = '#8d8f94';
const YELLOW = '#e8c22c';
const ORANGE = '#e57a22';
const GREEN = '#3c8c3f';
const BLUE = '#2f5fb3';
const PURPLE = '#6b3fa0';
const BROWN = '#6b4226';
const BLACK = '#1b1b1b';
const RED = '#c62f2f';
const LIGHT_BLUE = '#7fb6e6';

/** Faixa infantil: cor + listra (branca ou preta) no meio, como no sistema usado no Brasil. */
function kidsLevels(): GraduationSystem['levels'] {
  const out: GraduationSystem['levels'][number][] = [{ id: 'branca', label: 'branca', color: WHITE, minAge: 4, minYears: 0, minSkill: 0 }];
  const colors: [string, string, number][] = [
    ['cinza', GRAY, 4],
    ['amarela', YELLOW, 7],
    ['laranja', ORANGE, 10],
    ['verde', GREEN, 13],
  ];
  let skill = 5;
  for (const [name, color, age] of colors) {
    out.push({ id: `${name}_branca`, label: `${name} e branca`, color, stripe: WHITE, minAge: age, minYears: 1, minSkill: skill });
    out.push({ id: name, label: name, color, minAge: age, minYears: 1, minSkill: skill + 2 });
    out.push({ id: `${name}_preta`, label: `${name} e preta`, color, stripe: BLACK, minAge: age + 1, minYears: 1, minSkill: skill + 4 });
    skill += 7;
  }
  return out;
}

export const GRADUATIONS: readonly GraduationSystem[] = [
  {
    id: 'bjj_infantil',
    label: 'Jiu-jitsu infantil',
    kind: 'faixa',
    note: 'Até os 15 anos. Aos 16 passa para o sistema adulto: azul se já tiver faixa laranja ou mais e nível de azul; senão, branca.',
    levels: kidsLevels(),
    adultAt: { age: 16, system: 'bjj_adulto', minKidsLevel: 'laranja_branca', toLevel: 'azul' },
  },
  {
    id: 'bjj_adulto',
    label: 'Jiu-jitsu adulto',
    kind: 'faixa',
    note: 'Branca, azul, roxa, marrom e preta. Cada ano treinado dá um grau (até 4) na faixa atual; na preta, um grau a cada 3 anos.',
    levels: [
      { id: 'branca', label: 'branca', color: WHITE, minAge: 0, minYears: 0, minSkill: 0, degrees: 4 },
      { id: 'azul', label: 'azul', color: BLUE, minAge: 16, minYears: 2, minSkill: 35, degrees: 4 },
      { id: 'roxa', label: 'roxa', color: PURPLE, minAge: 16, minYears: 2, minSkill: 50, degrees: 4 },
      { id: 'marrom', label: 'marrom', color: BROWN, minAge: 18, minYears: 2, minSkill: 65, degrees: 4 },
      { id: 'preta', label: 'preta', color: BLACK, minAge: 19, minYears: 1, minSkill: 78, degrees: 6, degreeEvery: 3 },
    ],
  },
  {
    id: 'judo',
    label: 'Judô',
    kind: 'faixa',
    note: 'Sequência de faixas usada no judô brasileiro (kyu): branca, cinza, azul, amarela, laranja, verde, roxa, marrom e preta (1º dan em diante).',
    levels: [
      { id: 'branca', label: 'branca', color: WHITE, minAge: 0, minYears: 0, minSkill: 0 },
      { id: 'cinza', label: 'cinza', color: GRAY, minAge: 6, minYears: 1, minSkill: 6 },
      { id: 'azul', label: 'azul', color: BLUE, minAge: 8, minYears: 1, minSkill: 12 },
      { id: 'amarela', label: 'amarela', color: YELLOW, minAge: 10, minYears: 1, minSkill: 18 },
      { id: 'laranja', label: 'laranja', color: ORANGE, minAge: 11, minYears: 1, minSkill: 25 },
      { id: 'verde', label: 'verde', color: GREEN, minAge: 12, minYears: 1, minSkill: 33 },
      { id: 'roxa', label: 'roxa', color: PURPLE, minAge: 14, minYears: 1, minSkill: 42 },
      { id: 'marrom', label: 'marrom', color: BROWN, minAge: 15, minYears: 2, minSkill: 52 },
      { id: 'preta', label: 'preta (1º dan)', color: BLACK, minAge: 17, minYears: 2, minSkill: 64, degrees: 5, degreeEvery: 3 },
    ],
  },
  {
    id: 'muaythai_fsbmt',
    label: 'Muay thai (FSBMT)',
    kind: 'prajied',
    federation: 'Federação Sião-Brasileira de Muay Thai (FSBMT, fictícia)',
    note: 'Prajied (kruang) no braço. Como as federações variam, o jogo usa a FSBMT, fictícia, inspirada nas graduações por cor comuns no Brasil.',
    levels: [
      { id: 'branco', label: 'branco', color: WHITE, minAge: 0, minYears: 0, minSkill: 0 },
      { id: 'vermelho', label: 'vermelho', color: RED, minAge: 7, minYears: 1, minSkill: 8 },
      { id: 'vermelho_azul_claro', label: 'vermelho com ponta azul-clara', color: RED, tip: LIGHT_BLUE, minAge: 9, minYears: 1, minSkill: 15 },
      { id: 'azul_claro', label: 'azul-claro', color: LIGHT_BLUE, minAge: 11, minYears: 1, minSkill: 22 },
      { id: 'azul_claro_azul_escuro', label: 'azul-claro com ponta azul-escura', color: LIGHT_BLUE, tip: BLUE, minAge: 12, minYears: 1, minSkill: 30 },
      { id: 'azul_escuro', label: 'azul-escuro', color: BLUE, minAge: 14, minYears: 1, minSkill: 38 },
      { id: 'azul_escuro_preto', label: 'azul-escuro com ponta preta', color: BLUE, tip: BLACK, minAge: 15, minYears: 1, minSkill: 47 },
      { id: 'preto', label: 'preto', color: BLACK, minAge: 16, minYears: 2, minSkill: 58 },
      { id: 'preto_branco', label: 'preto com ponta branca (instrutor)', color: BLACK, tip: WHITE, minAge: 18, minYears: 2, minSkill: 68 },
      { id: 'kru', label: 'branco e vermelho (kru)', color: WHITE, tip: RED, minAge: 21, minYears: 3, minSkill: 78 },
    ],
  },
];
