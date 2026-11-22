import type { JobDef } from '../../../engine';

/**
 * Empregos básicos brasileiros (Etapa 8). Salários em SALÁRIOS MÍNIMOS mensais de referência (`salaryMW`, nível 1 →
 * nível 5); o valor anual em R$ (13 salários) é gerado a partir de SALARIO_MINIMO e depois ajustado pelo custo de
 * vida da cidade na engine. Para atualizar todos os salários de uma vez, mude só a constante.
 * Marcas de aplicativo são fictícias ("Zuum", "VaiJá").
 */
export const SALARIO_MINIMO = 1518;
/** Salário anual (13 salários) a partir de múltiplos do mínimo. */
export const anual = (mw: number) => Math.round(mw * SALARIO_MINIMO * 13);

type BasicJob = Omit<JobDef, 'salary'> & { salaryMW: [number, number] };
const job = (j: BasicJob): JobDef => ({ ...j, salary: [anual(j.salaryMW[0]), anual(j.salaryMW[1])] });

export const BASIC_JOBS: readonly JobDef[] = [
  // ---- 14+ / 16+: aprendiz e estágio ----
  job({ id: 'jovem_aprendiz', title: 'Jovem aprendiz', category: 'aprendiz', minAge: 14, education: 'nenhuma', requires: { studying: true }, salaryMW: [0.55, 0.75], energy: 1, hireChance: 0.65, ladder: ['Jovem aprendiz'], description: 'Meio período numa empresa, sem largar a escola. Primeira carteira assinada.' }),
  job({ id: 'estagio', title: 'Estágio', category: 'aprendiz', minAge: 16, education: 'nenhuma', requires: { schoolStages: ['medio'], acceptGraduated: true }, salaryMW: [0.7, 1.0], energy: 2, hireChance: 0.55, ladder: ['Estagiário', 'Estagiário sênior', 'Assistente'], yearlyEffects: { intelligence: 1 }, description: 'Aprender o serviço de escritório enquanto estuda.' }),
  // ---- 16+: meio período ----
  job({ id: 'lanchonete', title: 'Atendente de lanchonete', category: 'meio_periodo', minAge: 16, education: 'nenhuma', salaryMW: [0.6, 1.2], energy: 2, hireChance: 0.7, ladder: ['Atendente', 'Supervisor', 'Gerente da lanchonete'], description: 'Chapa, caixa e balcão no horário de pico.' }),
  job({ id: 'repositor', title: 'Repositor de supermercado', category: 'meio_periodo', minAge: 16, education: 'fundamental', salaryMW: [0.65, 1.1], energy: 2, hireChance: 0.65, ladder: ['Repositor', 'Líder de reposição', 'Encarregado'], yearlyEffects: { athletic: 1 }, description: 'Gôndolas cheias e etiquetas no lugar.' }),
  job({ id: 'empacotador', title: 'Empacotador', category: 'meio_periodo', minAge: 16, education: 'nenhuma', salaryMW: [0.5, 0.85], energy: 1, hireChance: 0.75, ladder: ['Empacotador', 'Operador de caixa', 'Fiscal de caixa'], description: 'Sacolas, gorjetas e conversa fiada.' }),
  job({ id: 'professor_particular', title: 'Professor(a) particular', category: 'meio_periodo', minAge: 18, education: 'medio', minStats: { intelligence: 70 }, formal: false, salaryMW: [0.8, 2.2], energy: 1, hireChance: 0.6, ladder: ['Aulas avulsas', 'Agenda cheia', 'Professor(a) disputado(a)'], yearlyEffects: { intelligence: 1 }, description: 'Reforço escolar em casa de aluno. Sem carteira.' }),
  // ---- 18+: tempo integral ----
  job({ id: 'entregador', title: 'Entregador do app Zuum', category: 'formal', minAge: 18, education: 'nenhuma', minStats: { athletic: 20 }, formal: false, salaryMW: [1.1, 1.7], energy: 2, hireChance: 0.9, ladder: ['Entregador', 'Entregador ouro'], yearlyEffects: { athletic: 1, health: -1 }, description: 'Bike ou moto, chuva ou sol. Paga por entrega, sem carteira.' }),
  job({ id: 'caixa', title: 'Operador(a) de caixa', category: 'formal', minAge: 18, education: 'fundamental', salaryMW: [1.0, 1.5], energy: 3, hireChance: 0.65, ladder: ['Operador de caixa', 'Fiscal de caixa', 'Gerente de loja'] }),
  job({ id: 'vendedor', title: 'Vendedor(a) de loja', category: 'formal', minAge: 18, education: 'fundamental', minStats: { looks: 40 }, salaryMW: [1.1, 2.8], energy: 3, hireChance: 0.6, ladder: ['Vendedor', 'Vendedor sênior', 'Gerente de loja'], description: 'Salário-base mais comissão.' }),
  job({ id: 'garcom', title: 'Garçom/Garçonete', category: 'formal', minAge: 18, education: 'nenhuma', salaryMW: [1.0, 1.9], energy: 3, hireChance: 0.65, ladder: ['Garçom', 'Chefe de salão', 'Maître'], yearlyEffects: { athletic: 1 }, description: 'Gorjeta boa no fim de semana.' }),
  job({ id: 'recepcionista', title: 'Recepcionista', category: 'formal', minAge: 18, education: 'medio', minStats: { looks: 35 }, salaryMW: [1.1, 1.6], energy: 3, hireChance: 0.6, ladder: ['Recepcionista', 'Recepcionista sênior', 'Supervisor(a) de atendimento'] }),
  job({ id: 'auxiliar_adm', title: 'Auxiliar administrativo', category: 'formal', minAge: 18, education: 'medio', salaryMW: [1.4, 2.6], energy: 3, hireChance: 0.55, ladder: ['Auxiliar administrativo', 'Assistente', 'Analista júnior'] }),
  job({ id: 'frentista', title: 'Frentista', category: 'formal', minAge: 18, education: 'fundamental', salaryMW: [1.2, 1.7], energy: 3, hireChance: 0.65, ladder: ['Frentista', 'Chefe de pista'], yearlyEffects: { health: -1 }, description: 'Periculosidade no contracheque, cheiro de gasolina na roupa.' }),
  job({ id: 'servente', title: 'Servente de obra', category: 'formal', minAge: 18, education: 'nenhuma', formal: false, salaryMW: [1.2, 2.1], energy: 3, hireChance: 0.8, ladder: ['Servente', 'Pedreiro', 'Mestre de obras'], yearlyEffects: { athletic: 2, health: -2 }, description: 'Massa, tijolo e sol na cabeça. Fortalece o corpo e cansa.' }),
  job({ id: 'auxiliar_limpeza', title: 'Auxiliar de limpeza', category: 'formal', minAge: 18, education: 'nenhuma', salaryMW: [1.0, 1.35], energy: 3, hireChance: 0.75, ladder: ['Auxiliar de limpeza', 'Encarregado(a) de limpeza'], yearlyEffects: { athletic: 1 } }),
  job({ id: 'cuidador', title: 'Cuidador(a) de idosos / babá', category: 'formal', minAge: 18, education: 'fundamental', formal: false, salaryMW: [1.1, 1.8], energy: 3, hireChance: 0.65, ladder: ['Cuidador(a)', 'Cuidador(a) de confiança'], yearlyEffects: { happiness: 1 } }),
  job({ id: 'motorista_app', title: 'Motorista do app VaiJá', category: 'formal', minAge: 18, education: 'nenhuma', requires: { cnh: true }, formal: false, salaryMW: [1.4, 2.4], energy: 3, hireChance: 0.9, ladder: ['Motorista', 'Motorista diamante'], yearlyEffects: { health: -1 }, description: 'Carro alugado, aplicativo ligado e trânsito.' }),
  job({ id: 'instrutor', title: 'Instrutor(a) de academia', category: 'luta', minAge: 18, education: 'nenhuma', fightReq: { minBelt: 1, minProWins: 3 }, salaryMW: [1.2, 2.6], energy: 2, hireChance: 0.6, ladder: ['Instrutor(a)', 'Professor(a) responsável', 'Coordenador(a) técnico(a)'], yearlyEffects: { athletic: 1 }, description: 'Exige faixa azul ou mais (ou Capacidade atlética alta).' }),
  // ---- 21+ ----
  job({ id: 'seguranca', title: 'Segurança', category: 'luta', minAge: 21, education: 'fundamental', minStats: { athletic: 60 }, salaryMW: [1.4, 2.1], energy: 3, hireChance: 0.6, ladder: ['Segurança', 'Chefe de segurança'], description: 'Portaria, eventos e noites longas. Exige Capacidade atlética alta.' }),
];
