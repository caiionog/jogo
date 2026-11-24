import type { JobDef } from '../../../engine';
import type { CivilExamSpec } from '../../../engine';
import { anual } from '../basic';

/**
 * Concursos públicos civis (release 0.0.4). Órgãos genéricos e fictícios; salários em salários mínimos/mês (início →
 * teto). Entrada só pelo concurso (Ocupação → Carreiras → Concursos públicos). Delegado continua na Polícia Civil.
 */
type CivilJob = Omit<JobDef, 'salary' | 'category' | 'trainingSessions' | 'civilExam'> & { salaryMW: [number, number]; exam: CivilExamSpec; trainingSessions?: number };
const civil = (j: CivilJob): JobDef => {
  const { exam, ...rest } = j;
  return { category: 'concurso', trainingSessions: 4, ...rest, civilExam: exam, salary: [anual(j.salaryMW[0]), anual(j.salaryMW[1])] };
};

const ANY_DEGREE = ['educacao_fisica', 'fisioterapia', 'nutricao', 'direito', 'administracao', 'contabeis', 'medicina', 'enfermagem', 'engenharia', 'computacao', 'jornalismo', 'psicologia', 'pedagogia', 'arquitetura', 'marketing'];

export const CIVIL_JOBS: readonly JobDef[] = [
  civil({ id: 'tecnico_tribunal', title: 'Técnico(a) do tribunal', minAge: 18, education: 'superior', requires: { degree: ANY_DEGREE }, salaryMW: [5.5, 9], ladder: ['Técnico(a) judiciário(a)', 'Técnico(a) sênior', 'Chefe de seção'], exam: { agency: 'Tribunal Regional', fee: 120, cut: { prova: 62 }, social: 'full' }, description: 'Processos, prazos e atendimento no fórum. Qualquer curso superior.' }),
  civil({ id: 'analista_tribunal', title: 'Analista do tribunal', minAge: 18, education: 'superior', requires: { degree: ['direito', 'administracao', 'contabeis'] }, salaryMW: [8.5, 14], ladder: ['Analista judiciário(a)', 'Analista sênior', 'Diretor(a) de secretaria'], exam: { agency: 'Tribunal Regional', fee: 150, cut: { prova: 72 }, titles: true, social: 'full' }, description: 'Pareceres e gestão no tribunal. Direito, Administração ou Ciências Contábeis.' }),
  civil({ id: 'professor_rede', title: 'Professor(a) da rede pública', minAge: 18, education: 'superior', requires: { degree: ['pedagogia', 'educacao_fisica'] }, salaryMW: [3, 6], ladder: ['Professor(a)', 'Professor(a) titular', 'Coordenador(a) pedagógico(a)'], yearlyEffects: { intelligence: 1 }, exam: { agency: 'Secretaria de Educação', fee: 80, cut: { prova: 55 }, titles: true, social: 'conviction' }, description: 'Sala de aula na rede pública. Pedagogia ou Educação Física.' }),
  civil({ id: 'agente_administrativo', title: 'Agente administrativo(a)', minAge: 18, education: 'medio', salaryMW: [2.2, 4], ladder: ['Agente administrativo(a)', 'Assistente técnico(a)'], exam: { agency: 'Prefeitura', fee: 60, cut: { prova: 58 }, social: 'none' }, description: 'Protocolo, arquivo e atendimento na prefeitura. Ensino médio.' }),
  civil({ id: 'auditor_fiscal', title: 'Auditor(a) fiscal', minAge: 18, education: 'superior', requires: { degree: ['contabeis', 'direito', 'administracao', 'engenharia', 'computacao'] }, salaryMW: [13, 20], ladder: ['Auditor(a) fiscal', 'Auditor(a) sênior', 'Delegado(a) da receita'], exam: { agency: 'Secretaria da Fazenda', fee: 200, cut: { prova: 82 }, titles: true, social: 'full' }, description: 'Fiscaliza tributos. Um dos concursos mais difíceis.' }),
  civil({ id: 'carteiro', title: 'Carteiro(a)', minAge: 18, education: 'medio', salaryMW: [1.6, 3], ladder: ['Carteiro(a)', 'Carteiro(a) líder'], yearlyEffects: { athletic: 1 }, exam: { agency: 'Empresa Pública de Correspondência', fee: 50, cut: { prova: 52, taf: 25 }, social: 'none', stability: 'parcial' }, description: 'Entrega na rua, faça chuva ou sol. Estabilidade parcial (empresa pública).' }),
  civil({ id: 'bombeiro_militar', title: 'Bombeiro(a) militar', minAge: 18, education: 'medio', salaryMW: [3, 8], ladder: ['Soldado bombeiro', 'Cabo', 'Sargento', 'Oficial bombeiro'], yearlyEffects: { athletic: 1 }, exam: { agency: 'Corpo de Bombeiros Militar', fee: 100, maxAge: 30, cut: { prova: 58, taf: 50 }, health: true, social: 'full' }, description: 'Resgates, incêndios e salvamentos. Até 30 anos, com TAF e exame de saúde.' }),
  civil({ id: 'agente_penitenciario', title: 'Agente penitenciário(a)', minAge: 18, education: 'medio', salaryMW: [2.8, 6], ladder: ['Agente', 'Agente sênior', 'Chefe de plantão'], yearlyEffects: { happiness: -1 }, exam: { agency: 'Secretaria de Administração Penitenciária', fee: 90, maxAge: 35, cut: { prova: 55, taf: 40, psico: 45 }, social: 'full' }, description: 'Custódia e segurança nas unidades prisionais. Até 35 anos.' }),
  civil({ id: 'guarda_municipal', title: 'Guarda municipal', minAge: 18, education: 'medio', salaryMW: [1.9, 4], ladder: ['Guarda', 'Guarda de 1ª classe', 'Inspetor(a)'], exam: { agency: 'Prefeitura', fee: 70, maxAge: 35, cut: { prova: 56, taf: 38 }, social: 'full' }, description: 'Patrulha de praças, escolas e prédios da cidade. Até 35 anos.' }),
  civil({ id: 'perito_criminal', title: 'Perito(a) criminal', minAge: 18, education: 'superior', requires: { degree: ['engenharia', 'computacao', 'medicina', 'contabeis', 'enfermagem'] }, salaryMW: [7.5, 14], ladder: ['Perito(a)', 'Perito(a) sênior', 'Diretor(a) do instituto'], exam: { agency: 'Instituto de Perícia', fee: 150, cut: { prova: 75, taf: 30 }, titles: true, social: 'full' }, description: 'Laudos e laboratório para as investigações. Engenharia, Computação, Medicina, Contábeis ou Enfermagem.' }),
];
