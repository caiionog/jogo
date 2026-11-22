import type { JobDef } from '../../engine';
import { BASIC_JOBS, SALARIO_MINIMO } from './basic';

export { SALARIO_MINIMO };

/** Carreiras de nível superior e ligadas à luta (Etapa 5). */
const OTHER_JOBS: readonly JobDef[] = [
  { id: 'motorista', title: 'Motorista de entregas', category: 'formal', minAge: 21, education: 'fundamental', salary: [28000, 45000], energy: 3 },
  { id: 'tecnico', title: 'Técnico de manutenção', category: 'formal', minAge: 18, education: 'medio', minStats: { intelligence: 40 }, salary: [34000, 70000], energy: 4 },
  { id: 'analista', title: 'Analista de escritório', category: 'formal', minAge: 22, education: 'superior', minStats: { intelligence: 55 }, salary: [55000, 130000], energy: 4 },
  { id: 'gerente', title: 'Gerente comercial', category: 'formal', minAge: 26, education: 'superior', minStats: { intelligence: 60, looks: 40 }, salary: [90000, 200000], energy: 4 },
  { id: 'engenheiro', title: 'Engenheiro', category: 'formal', minAge: 23, education: 'superior', minStats: { intelligence: 70 }, salary: [80000, 220000], energy: 4 },
  // ligados à luta
  { id: 'treinador', title: 'Treinador de luta', category: 'luta', minAge: 26, education: 'nenhuma', minReputation: 30, salary: [40000, 120000], energy: 3 },
  { id: 'comentarista', title: 'Comentarista de lutas na TV', category: 'luta', minAge: 24, education: 'medio', minReputation: 60, salary: [60000, 300000], energy: 1 },
];

/** Todos os empregos: básicos (Etapa 8) + os demais. `salaryMW` (salários mínimos) é preenchido para exibição. */
export const JOBS: readonly JobDef[] = [...BASIC_JOBS, ...OTHER_JOBS.map((j) => ({ ...j, salaryMW: [Math.round((j.salary[0] / (SALARIO_MINIMO * 13)) * 10) / 10, Math.round((j.salary[1] / (SALARIO_MINIMO * 13)) * 10) / 10] as [number, number] }))];
