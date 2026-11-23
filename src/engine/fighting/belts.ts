/**
 * Graduações por modalidade (release 0.0.1): faixas do jiu-jitsu (infantil e adulto, com graus), do judô e o prajied
 * do muay thai. Os sistemas são dados (`content.fighting.graduations`); aqui só as regras.
 *
 * - O tempo na graduação só corre no ano em que a modalidade foi treinada (`fighter.trainedThisYear`).
 * - A promoção exige idade, anos na graduação atual e nível da habilidade oculta da modalidade; acontece pelo evento
 *   automático "Exame de graduação" de cada modalidade (`fighting.gradeReady` → `fighter.promoteGrade`).
 * - Jiu-jitsu: até os 15 anos, sistema infantil; aos 16, passa para o adulto (azul ou branca, conforme o nível).
 */
import type { GameContent } from '../core/content';
import type { GameState } from '../core/state';
import { appendLog } from '../core/stats';
import type { GradeLevel, GradeState, GraduationSystem, ModalityDef, ModalityId } from './types';

/** Faixas adultas do jiu-jitsu (índices usados por requisitos de organizações e empregos). */
export const BELTS = ['branca', 'azul', 'roxa', 'marrom', 'preta'] as const;
export const BELT_EMOJI = ['⬜', '🟦', '🟪', '🟫', '⬛'] as const;

export function modalityDef(content: GameContent, id: ModalityId): ModalityDef | undefined {
  return content.fighting.modalities.find((m) => m.id === id);
}

export function graduationSystem(content: GameContent, id: string | undefined): GraduationSystem | undefined {
  return id ? content.fighting.graduations.find((g) => g.id === id) : undefined;
}

/** Sistema em que alguém dessa idade começa na modalidade (infantil até `kidsUntil`). */
export function startingSystem(mod: ModalityDef, age: number): string | undefined {
  if (mod.kidsGraduation && age <= (mod.kidsUntil ?? 15)) return mod.kidsGraduation;
  return mod.graduation;
}

export function gradeOf(state: GameState, id: ModalityId): GradeState | undefined {
  return state.fighter.grades[id];
}

export function gradeLevel(content: GameContent, g: GradeState | undefined): GradeLevel | undefined {
  return g ? graduationSystem(content, g.system)?.levels[g.rank] : undefined;
}

/**
 * Faixa ADULTA de jiu-jitsu (0 branca … 4 preta). Quem ainda está no sistema infantil (ou nunca treinou) conta como
 * branca. Usado por requisitos de organizações, empregos e conquistas.
 */
export function bjjRank(state: GameState): number {
  // saves antigos passam por funções da engine durante a migração (antes da v10, a faixa era `fighter.belt`)
  const legacy = (state.fighter as unknown as { belt?: { rank: number } }).belt;
  if (!state.fighter.grades) return legacy?.rank ?? 0;
  const g = state.fighter.grades.jiujitsu;
  return g && g.system === 'bjj_adulto' ? g.rank : 0;
}

/** "faixa azul (2 graus)" / "prajied vermelho" / "faixa laranja e branca". */
export function gradeText(content: GameContent, g: GradeState | undefined): string | null {
  const sys = graduationSystem(content, g?.system);
  const lvl = sys?.levels[g!.rank];
  if (!sys || !lvl) return null;
  const deg = g!.degree > 0 ? ` (${g!.degree} ${g!.degree === 1 ? 'grau' : 'graus'})` : '';
  return `${sys.kind === 'prajied' ? 'prajied' : 'faixa'} ${lvl.label}${deg}`;
}

/** Pronto para a próxima graduação da modalidade. */
export function gradeReady(state: GameState, id: ModalityId, content: GameContent): boolean {
  const g = gradeOf(state, id);
  const mod = modalityDef(content, id);
  const sys = graduationSystem(content, g?.system);
  if (!g || !mod || !sys) return false;
  const next = sys.levels[g.rank + 1];
  if (!next) return false;
  return state.character.age >= next.minAge && g.years >= next.minYears && state.fighter.skills[mod.skill] >= next.minSkill;
}

/** Promove para a próxima graduação se os requisitos forem atendidos. */
export function promoteGrade(state: GameState, id: ModalityId, content: GameContent): GameState {
  if (!gradeReady(state, id, content)) return state;
  const g = gradeOf(state, id)!;
  const mod = modalityDef(content, id)!;
  const next: GradeState = { ...g, rank: g.rank + 1, degree: 0, years: 0 };
  const sys = graduationSystem(content, g.system)!;
  const adultBjj = g.system === 'bjj_adulto';
  // faixas adultas de jiu-jitsu e as graduações altas dão um pouco de reputação
  const rep = adultBjj || next.rank >= sys.levels.length - 3 ? 2 : 0;
  const s: GameState = {
    ...state,
    fighter: { ...state.fighter, grades: { ...state.fighter.grades, [id]: next }, reputation: Math.min(100, state.fighter.reputation + rep) },
  };
  return appendLog(s, `Você recebeu ${gradeText(content, next)} de ${mod.label.toLowerCase()}!`);
}

/** Primeira sessão numa modalidade com graduação: começa na faixa branca do sistema da idade. */
export function ensureGrade(state: GameState, id: ModalityId, content: GameContent): GameState {
  if (state.fighter.grades[id]) return state;
  const mod = modalityDef(content, id);
  const system = mod ? startingSystem(mod, state.character.age) : undefined;
  if (!system) return state;
  return { ...state, fighter: { ...state.fighter, grades: { ...state.fighter.grades, [id]: { system, rank: 0, degree: 0, years: 0 } } } };
}

/**
 * Virada do ano de luta: modalidades treinadas somam 1 ano na graduação e, no jiu-jitsu adulto, um grau. Aos 16, o
 * jiu-jitsu infantil passa para o adulto. Zera `trainedThisYear`.
 */
export function graduationYear(state: GameState, content: GameContent): GameState {
  const grades = { ...state.fighter.grades };
  let s = state;
  for (const id of state.fighter.trainedThisYear) {
    const g = grades[id];
    if (!g) continue;
    const lvl = graduationSystem(content, g.system)?.levels[g.rank];
    const years = g.years + 1;
    const every = lvl?.degreeEvery ?? 1;
    const degree = lvl?.degrees && years % every === 0 ? Math.min(lvl.degrees, g.degree + 1) : g.degree;
    grades[id] = { ...g, years, degree };
  }
  s = { ...s, fighter: { ...s.fighter, grades, trainedThisYear: [] } };
  return kidsToAdult(s, content);
}

/** Jiu-jitsu infantil → adulto aos 16 (o personagem faz 16 no ano seguinte; vale a idade nova). */
export function kidsToAdult(state: GameState, content: GameContent, age = state.character.age + 1): GameState {
  let s = state;
  for (const [id, g] of Object.entries(state.fighter.grades) as [ModalityId, GradeState][]) {
    const sys = graduationSystem(content, g.system);
    const t = sys?.adultAt;
    if (!sys || !t || age < t.age) continue;
    const adult = graduationSystem(content, t.system);
    if (!adult) continue;
    const minKids = sys.levels.findIndex((l) => l.id === t.minKidsLevel);
    const toIdx = adult.levels.findIndex((l) => l.id === t.toLevel);
    const to = adult.levels[toIdx];
    const mod = modalityDef(content, id);
    const promote = to && mod && g.rank >= minKids && s.fighter.skills[mod.skill] >= to.minSkill;
    const next: GradeState = { system: adult.id, rank: promote ? toIdx : 0, degree: 0, years: promote ? 0 : Math.min(g.years, 1) };
    s = { ...s, fighter: { ...s.fighter, grades: { ...s.fighter.grades, [id]: next } } };
    s = appendLog(s, promote ? `Aos ${age} anos você passou para o jiu-jitsu adulto já de ${gradeText(content, next)}!` : `Aos ${age} anos você passou para o jiu-jitsu adulto: recomeça de faixa branca.`);
  }
  return s;
}
