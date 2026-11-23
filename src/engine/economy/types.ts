/** Economia (Etapa 5). Dinheiro SEMPRE em inteiros (R$ 1 = unidade mínima). Tudo JSON puro. */

export type LedgerCategory =
  | 'salario'
  /** Trabalho sem carteira (Etapa 8): sem INSS nem imposto retido. */
  | 'trabalho_informal'
  | 'luta'
  | 'patrocinio'
  | 'aluguel_recebido'
  | 'empresa'
  | 'juros'
  | 'heranca'
  | 'venda_bens'
  | 'credito'
  | 'familia'
  | 'aplicacoes'
  | 'impostos'
  | 'saude'
  | 'moradia'
  | 'padrao_vida'
  | 'filhos'
  | 'academia'
  | 'compras'
  | 'parcelas'
  | 'manutencao'
  | 'agente'
  | 'pensao'
  | 'multas'
  | 'eventos';

export interface LedgerEntry {
  cat: LedgerCategory;
  amount: number;
  label: string;
}

export interface Ledger {
  year: number;
  /** Saldo no início do extrato. Invariante: money − opening === Σ entries. */
  opening: number;
  entries: LedgerEntry[];
}

/** Resumo de um ano fechado (só totais por categoria, para o save não crescer). */
export interface YearSummary {
  year: number;
  age: number;
  totals: Partial<Record<LedgerCategory, number>>;
  closing: number;
  netWorth: number;
}

export type Housing = 'pais' | 'aluguel' | 'propria';
export type LivingStandard = 'simples' | 'confortavel' | 'luxo';
export type EconYearKind = 'normal' | 'crise' | 'boom';
export type EducationLevel = 'nenhuma' | 'fundamental' | 'medio' | 'superior';
/** aprendiz = jovem aprendiz/estágio (14+/16+); meio_periodo; formal e luta = tempo integral. */
export type JobCategory = 'aprendiz' | 'meio_periodo' | 'formal' | 'luta';
export type LoanKind = 'pessoal' | 'imobiliario' | 'veiculo';
export type Regime = 'parcial' | 'separacao';

export interface Loan {
  id: string;
  kind: LoanKind;
  label: string;
  principal: number;
  /** Juros ao ano (ex.: 0.09). */
  rate: number;
  years: number;
  /** Parcela anual fixa (tabela Price, inteira). */
  installment: number;
  yearsLeft: number;
  /** Saldo devedor. */
  balance: number;
  assetId?: string;
}

export interface Job {
  jobId: string;
  level: number;
  performance: number;
  years: number;
}

export interface SponsorDeal {
  sponsorId: string;
  yearsLeft: number;
  amount: number;
}

export interface FightContract {
  orgId: string;
  fightsLeft: number;
  basePurse: number;
  wins: number;
  losses: number;
}

export interface Business {
  id: string;
  defId: string;
  name: string;
  level: number;
  cash: number;
  reputation: number;
  manager: boolean;
  /** Ano em que o dono se dedicou (bônus no fechamento desse ano). */
  dedicatedYear: number;
  years: number;
  lastProfit: number;
  profits: number[];
}

export type AssetKind = 'imovel' | 'veiculo' | 'luxo';

export interface Asset {
  id: string;
  kind: AssetKind;
  catalogId: string;
  name: string;
  /** Valor de mercado atual. */
  value: number;
  /** Quanto foi pago (preço + taxas). */
  paid: number;
  boughtYear: number;
  home?: boolean;
  rented?: boolean;
  insured?: boolean;
  loanId?: string;
  /** Estado de conservação (Etapa 8): imóvel a reformar rende menos aluguel. */
  condition?: 'nova' | 'boa' | 'reformar';
  /** Tendência do bairro (±% ao ano somado à valorização do mercado). */
  trend?: number;
  /** Ano da última reforma (uma por ano). */
  renovatedYear?: number;
  /** Cidade/UF do imóvel (pode ser comprado em outra cidade). */
  city?: string;
  uf?: string;
}

export interface EconomyState {
  ledger: Ledger;
  history: YearSummary[];
  housing: Housing;
  standard: LivingStandard;
  /** Dívida automática (cheque especial) — positiva. */
  debt: number;
  debtYears: number;
  savings: number;
  investments: number;
  loans: Loan[];
  nextId: number;
  job: Job | null;
  /** Último salário anual pago (para limite de crédito, pensão etc.). */
  lastIncome: number;
  agent: { name: string; cut: number } | null;
  contract: FightContract | null;
  sponsors: SponsorDeal[];
  assets: Asset[];
  /** Ofertas do mercado já compradas neste ano. */
  boughtOffers: string[];
  businesses: Business[];
  marriage: { personId: string; regime: Regime; netWorthAtMarriage: number } | null;
  alimony: { childId: string; amount: number }[];
  /** Imposto devido sonegado (para a malha fina). */
  evadedTax: number;
  /** Testamento (Etapa 6): personId → %. */
  will?: { shares: Record<string, number>; year: number } | null;
}

// ---------------------------------------------------------------------------
// Conteúdo
// ---------------------------------------------------------------------------

export interface JobDef {
  id: string;
  title: string;
  category: JobCategory;
  minAge: number;
  education: EducationLevel;
  minStats?: { intelligence?: number; athletic?: number; looks?: number };
  minReputation?: number;
  /** Requisito alternativo de luta: faixa mínima OU vitórias pro mínimas. */
  fightReq?: { minBelt?: number; minProWins?: number };
  /** Salário anual (R$) no nível 1 e no 5, antes do custo da cidade (no conteúdo, gerado a partir de `salaryMW`). */
  salary: [number, number];
  /** O mesmo salário em salários mínimos mensais de referência (exibição; Etapa 8). */
  salaryMW?: [number, number];
  /** Sessões de treino que o emprego ocupa por ano: 4 (tempo integral), 2 (meio período/estágio) ou 0. */
  trainingSessions: number;
  /** Requisitos extras (Etapa 8). */
  requires?: {
    /** Precisa estar matriculado (jovem aprendiz). */
    studying?: boolean;
    /** Fases escolares aceitas (estágio: ensino médio); `graduated` aceita quem já terminou. */
    schoolStages?: readonly ('fund2' | 'medio')[];
    acceptGraduated?: boolean;
    /** Carteira de motorista (flag `cnh`). */
    cnh?: boolean;
  };
  /** Carteira assinada (padrão true). Informal paga 15% a mais, sem INSS e sem imposto retido. */
  formal?: boolean;
  /** Escada de cargos ao longo dos níveis 1–5 (ex.: Atendente → Supervisor → Gerente). */
  ladder?: readonly string[];
  /** Chance base de contratação (padrão 0,6). */
  hireChance?: number;
  /** Efeitos anuais nos atributos (servente: +Capacidade atlética, −Saúde). */
  yearlyEffects?: Partial<Record<'health' | 'happiness' | 'intelligence' | 'looks' | 'athletic', number>>;
  description?: string;
}

export interface AssetDef {
  id: string;
  kind: AssetKind;
  name: string;
  /** Faixa de preço base (antes do custo da cidade). */
  price: [number, number];
  /** Felicidade anual enquanto possui. */
  happiness: number;
  /** Reputação anual (luxo/status). */
  reputation?: number;
  /** Artigo usado no log ("um", "uma", "as"...). Padrão: "um". */
  article?: string;
  /** Bairros/variações para dar nome às ofertas. */
  variants?: readonly string[];
  /** Onde existe (Etapa 8): casa de praia só em UF litorânea; sítio/fazenda fora da capital. */
  where?: 'litoral' | 'interior';
  /** Tamanho em m² (imóveis) para os cartões do Mercado. */
  size?: [number, number];
  /** Imóvel que não pode ser alugado (terreno). */
  noRent?: boolean;
  /** Item que menor de idade pode comprar com o próprio dinheiro (luxo barato). */
  teen?: boolean;
}

export interface BusinessDef {
  id: string;
  name: string;
  startCost: number;
  revenue: number;
  cost: number;
  managerCost: number;
  /** Academia própria: liga à carreira de luta. */
  combat?: boolean;
  /** Como aparece no Mercado (Etapa 8): abrir do zero, franquia (marca fictícia) e/ou comprar um existente. */
  open?: 'zero' | 'franquia';
  /** Negócios existentes à venda no Mercado. */
  forSale?: boolean;
  /** Nomes fictícios de negócios existentes à venda. */
  saleNames?: readonly string[];
  /** Risco em palavras (variação do faturamento). */
  risk?: 'baixo' | 'medio' | 'alto';
}

export interface SponsorDef {
  id: string;
  brand: string;
  minReputation: number;
  amount: number;
  years: number;
  /** Cancela com esta quantidade de derrotas seguidas. */
  maxLossStreak: number;
  /** Cancela em escândalo (doping/suspensão, traição pública). */
  scandal: boolean;
}

export interface TaxBracket {
  upTo: number | null;
  rate: number;
}

export interface EconomyContent {
  jobs: readonly JobDef[];
  assets: readonly AssetDef[];
  businesses: readonly BusinessDef[];
  sponsors: readonly SponsorDef[];
  taxBrackets: readonly TaxBracket[];
  /** Multiplicador de custo por cidade (padrão 1). */
  /** Nomes fictícios (bancos, empresários). */
  agents: readonly string[];
  hooks: { regimeEventId?: string };
}
