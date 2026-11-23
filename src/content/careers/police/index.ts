/**
 * Carreira policial (release 0.0.2). Só "Polícia Militar" e "Polícia Civil", sem sigla nem estado. Unidades,
 * cursos e lotações são fictícios. Salários em salários mínimos mensais de referência (×13 por ano, antes do custo
 * da cidade). Os requisitos (idade, escolaridade, diploma) ficam aqui para serem fáceis de ajustar.
 */
import type { JobDef, PoliceContent, PoliceTrackDef } from '../../../engine';
import { SALARIO_MINIMO } from '../../jobs/basic';
import { CASE_TEXT, SHOOTOUT_TEXT, SPECIAL_TEXT } from './text';

const anual = (mw: number) => Math.round(mw * SALARIO_MINIMO * 13);

const BATALHOES = ['1º Batalhão', '3º Batalhão', '7º Batalhão', '12º Batalhão', '18º Batalhão', 'Batalhão de Trânsito', 'Batalhão Rodoviário', 'Companhia de Policiamento Escolar'];
const DELEGACIAS = ['1ª Delegacia', '4ª Delegacia', '9ª Delegacia', '15ª Delegacia', 'Delegacia de Furtos e Roubos', 'Delegacia de Homicídios', 'Delegacia de Defesa da Mulher', 'Delegacia de Crimes Financeiros'];
const CLASSES = ['de 3ª Classe', 'de 2ª Classe', 'de 1ª Classe', 'de Classe Especial'];

export const POLICE_TRACKS: readonly PoliceTrackDef[] = [
  {
    id: 'pm_praca',
    force: 'pm',
    label: 'Soldado da Polícia Militar',
    entry: 'concurso',
    ageRange: [18, 30],
    education: 'medio',
    fee: 90,
    cut: { prova: 52, taf: 42, psico: 40 },
    course: 'Curso de Formação de Soldados',
    postings: BATALHOES,
    ranks: [
      { title: 'Soldado', salaryMW: 3.2, minYears: 0, minMerit: 0 },
      { title: 'Cabo', salaryMW: 3.8, minYears: 5, minMerit: 20 },
      { title: 'Sargento', salaryMW: 4.8, minYears: 6, minMerit: 40 },
      { title: 'Subtenente', salaryMW: 6, minYears: 7, minMerit: 60 },
    ],
  },
  {
    id: 'pm_oficial',
    force: 'pm',
    label: 'Oficial da Polícia Militar',
    entry: 'interno',
    ageRange: [18, 35],
    education: 'superior',
    fee: 0,
    cut: { prova: 64, taf: 48, psico: 45 },
    course: 'Curso de Formação de Oficiais',
    postings: BATALHOES,
    ranks: [
      { title: 'Tenente', salaryMW: 7, minYears: 0, minMerit: 0 },
      { title: 'Capitão', salaryMW: 9, minYears: 4, minMerit: 25 },
      { title: 'Major', salaryMW: 11.5, minYears: 5, minMerit: 45 },
      { title: 'Tenente-coronel', salaryMW: 14, minYears: 5, minMerit: 65 },
      { title: 'Coronel', salaryMW: 17, minYears: 5, minMerit: 85 },
    ],
  },
  {
    id: 'civil_investigador',
    force: 'civil',
    label: 'Investigador da Polícia Civil',
    entry: 'concurso',
    ageRange: [18, 30],
    education: 'superior',
    fee: 110,
    cut: { prova: 60, taf: 38, psico: 42 },
    course: 'Curso de Formação de Investigadores',
    postings: DELEGACIAS,
    ranks: CLASSES.map((c, i) => ({ title: `Investigador ${c}`, titleF: `Investigadora ${c}`, salaryMW: [4.5, 5.5, 6.8, 8.5][i]!, minYears: [0, 5, 5, 6][i]!, minMerit: [0, 20, 40, 60][i]! })),
  },
  {
    id: 'civil_escrivao',
    force: 'civil',
    label: 'Escrivão da Polícia Civil',
    entry: 'concurso',
    ageRange: [18, 30],
    education: 'superior',
    fee: 110,
    cut: { prova: 62, taf: 35, psico: 40 },
    course: 'Curso de Formação de Escrivães',
    postings: DELEGACIAS,
    ranks: CLASSES.map((c, i) => ({ title: `Escrivão ${c}`, titleF: `Escrivã ${c}`, salaryMW: [4.5, 5.5, 6.8, 8.5][i]!, minYears: [0, 5, 5, 6][i]!, minMerit: [0, 18, 36, 55][i]! })),
  },
  {
    id: 'civil_delegado',
    force: 'civil',
    label: 'Delegado da Polícia Civil',
    entry: 'concurso',
    ageRange: [18, 30],
    education: 'superior',
    degree: ['direito'],
    fee: 180,
    cut: { prova: 72, taf: 35, psico: 45 },
    course: 'Curso de Formação de Delegados',
    postings: DELEGACIAS,
    ranks: CLASSES.map((c, i) => ({ title: `Delegado ${c}`, titleF: `Delegada ${c}`, salaryMW: [12, 14.5, 17.5, 21][i]!, minYears: [0, 4, 5, 5][i]!, minMerit: [0, 25, 45, 70][i]! })),
  },
];

export const POLICE: PoliceContent = {
  tracks: POLICE_TRACKS,
  academyName: 'Academia de Formação Policial',
  minimumWage: SALARIO_MINIMO,
  courses: ['Curso de Mediação de Conflitos', 'Curso de Direção Defensiva', 'Curso de Primeiros Socorros', 'Curso de Técnicas de Abordagem', 'Curso de Inteligência Policial', 'Curso de Atendimento a Vítimas', 'Curso de Gestão de Crises'],
  jobIds: { pm: 'policia_militar', civil: 'policia_civil' },
  cases: [
    { id: 'carga', label: 'o caso do furto de carga' },
    { id: 'homicidio', label: 'o caso do homicídio no bairro' },
    { id: 'desvio', label: 'o caso do desvio de dinheiro' },
    { id: 'faccao', label: 'a investigação sobre a facção' },
  ],
  shootoutText: SHOOTOUT_TEXT,
  caseText: CASE_TEXT,
  specialEvents: ['pol_especial_1', 'pol_especial_2', 'pol_especial_3'],
  specialText: SPECIAL_TEXT,
  special: [
    { force: 'pm', name: 'Esquadrão Sentinela', course: 'Curso de Operações Sentinela', minServiceYears: 3, minAthletic: 65, minShooting: 60, minHealth: 70, salaryBonus: 0.2 },
    { force: 'civil', name: 'Grupo Âncora', course: 'Seleção Âncora', minServiceYears: 3, minAthletic: 60, minShooting: 62, minHealth: 70, salaryBonus: 0.2 },
  ],
};

const range = (force: 'pm' | 'civil'): [number, number] => {
  const all = POLICE_TRACKS.filter((t) => t.force === force).flatMap((t) => t.ranks.map((r) => r.salaryMW));
  return [Math.min(...all), Math.max(...all)];
};

/** As duas carreiras como empregos (Ocupação → Carreiras → Segurança pública). Entrada só por concurso. */
export const POLICE_JOBS: readonly JobDef[] = (['pm', 'civil'] as const).map((force) => {
  const mw = range(force);
  return {
    id: POLICE.jobIds[force],
    title: force === 'pm' ? 'Polícia Militar' : 'Polícia Civil',
    category: 'seguranca',
    minAge: 18,
    education: force === 'pm' ? 'medio' : 'superior',
    salary: [anual(mw[0]), anual(mw[1])],
    salaryMW: mw,
    trainingSessions: 4,
    publicExam: true,
    ladder: force === 'pm' ? ['Soldado', 'Cabo', 'Sargento', 'Subtenente', 'Oficial'] : ['Escrivão', 'Investigador', 'Delegado'],
    description: force === 'pm' ? 'Patrulhamento e policiamento ostensivo. Entrada por concurso público (18 a 30 anos).' : 'Investigação e inquéritos. Entrada por concurso público (18 a 30 anos); delegado exige Direito.',
  } satisfies JobDef;
});
