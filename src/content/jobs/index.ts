import type { JobDef } from '../../engine';

/** Profissões (fictícias/genéricas). Salário anual em R$ (nível 1 → nível 5) e energia anual reservada. */
export const JOBS: readonly JobDef[] = [
  // meio período (16+)
  { id: 'lanchonete', title: 'Atendente de lanchonete', category: 'meio_periodo', minAge: 16, education: 'nenhuma', salary: [9000, 14000], energy: 2 },
  { id: 'entregador', title: 'Entregador de bike', category: 'meio_periodo', minAge: 16, education: 'nenhuma', minStats: { strength: 20 }, salary: [10000, 16000], energy: 2 },
  { id: 'repositor', title: 'Repositor de supermercado', category: 'meio_periodo', minAge: 16, education: 'fundamental', salary: [11000, 15000], energy: 2 },
  // formais
  { id: 'auxiliar_adm', title: 'Auxiliar administrativo', category: 'formal', minAge: 18, education: 'medio', salary: [26000, 42000], energy: 3 },
  { id: 'vendedor', title: 'Vendedor de loja', category: 'formal', minAge: 18, education: 'fundamental', minStats: { looks: 40 }, salary: [24000, 55000], energy: 3 },
  { id: 'motorista', title: 'Motorista de entregas', category: 'formal', minAge: 21, education: 'fundamental', salary: [28000, 45000], energy: 3 },
  { id: 'tecnico', title: 'Técnico de manutenção', category: 'formal', minAge: 18, education: 'medio', minStats: { intelligence: 40 }, salary: [34000, 70000], energy: 4 },
  { id: 'analista', title: 'Analista de escritório', category: 'formal', minAge: 22, education: 'superior', minStats: { intelligence: 55 }, salary: [55000, 130000], energy: 4 },
  { id: 'gerente', title: 'Gerente comercial', category: 'formal', minAge: 26, education: 'superior', minStats: { intelligence: 60, looks: 40 }, salary: [90000, 200000], energy: 4 },
  { id: 'engenheiro', title: 'Engenheiro', category: 'formal', minAge: 23, education: 'superior', minStats: { intelligence: 70 }, salary: [80000, 220000], energy: 4 },
  // ligados à luta
  { id: 'instrutor', title: 'Instrutor de academia', category: 'luta', minAge: 18, education: 'nenhuma', fightReq: { minBelt: 2, minProWins: 3 }, salary: [22000, 50000], energy: 2 },
  { id: 'seguranca', title: 'Segurança de eventos', category: 'luta', minAge: 18, education: 'fundamental', minStats: { strength: 50 }, salary: [26000, 40000], energy: 3 },
  { id: 'treinador', title: 'Treinador de luta', category: 'luta', minAge: 26, education: 'nenhuma', minReputation: 30, salary: [40000, 120000], energy: 3 },
  { id: 'comentarista', title: 'Comentarista de lutas na TV', category: 'luta', minAge: 24, education: 'medio', minReputation: 60, salary: [60000, 300000], energy: 1 },
];
