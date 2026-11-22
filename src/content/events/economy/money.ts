import type { GameEvent } from '../../../engine';

/** Dinheiro, investimentos, golpes, impostos e dívidas. */
export const MONEY_EVENTS: readonly GameEvent[] = [
  {
    id: 'eco_regime',
    trigger: 'followUp',
    conditions: { minAge: 18 },
    weight: 1,
    text: 'Antes da lua de mel, o cartório pergunta: qual será o regime de bens de vocês?',
    choices: [
      { id: 'parcial', label: 'Comunhão parcial de bens', effects: { economy: { regime: 'parcial' } }, resultText: 'Tudo o que construírem juntos será dos dois.' },
      { id: 'separacao', label: 'Separação total de bens', effects: { economy: { regime: 'separacao' }, social: { affection: -3 } }, resultText: 'Cada um com o seu. {pessoa} achou um pouco frio, mas aceitou.' },
    ],
  },
  {
    id: 'eco_pyramid',
    conditions: { minAge: 18, economy: { money: { min: 10000 } } },
    weight: 3,
    text: 'Um conhecido apresenta um "investimento garantido" que rende 10% ao mês. Basta trazer mais gente...',
    choices: [
      {
        id: 'in',
        label: 'Colocar 30% do saldo',
        effects: { economy: { postShareOfMoney: { cat: 'eventos', share: -0.3, label: 'Esquema de pirâmide' } } },
        resultText: 'O site saiu do ar duas semanas depois. Era pirâmide.',
        risk: { chance: 0.12, effects: { economy: { post: { cat: 'eventos', amount: 4000, label: 'Saiu a tempo do esquema' } } }, resultText: 'Você sacou antes do esquema quebrar e ainda lucrou. Sorte pura.' },
      },
      { id: 'no', label: 'Desconfiar e recusar', effects: { stats: { intelligence: 1 } }, resultText: 'Meses depois, a polícia desmontou o esquema.' },
    ],
  },
  {
    id: 'eco_fake_auction',
    conditions: { minAge: 18, economy: { money: { min: 20000 } } },
    weight: 3,
    text: 'Um site de leilão anuncia um SUV pela metade do preço. Só precisa pagar o sinal de R$ 8.000 hoje.',
    choices: [
      { id: 'pay', label: 'Pagar o sinal', effects: { economy: { post: { cat: 'eventos', amount: -8000, label: 'Golpe do falso leilão' } }, stats: { happiness: -4 } }, resultText: 'O carro nunca existiu.' },
      { id: 'check', label: 'Pesquisar o site antes', effects: {}, resultText: 'Várias denúncias de golpe. Você escapou.' },
    ],
  },
  {
    id: 'eco_distant_uncle',
    conditions: { minAge: 18 },
    weight: 2,
    once: true,
    text: 'Um advogado liga: um tio distante que você mal conhecia deixou uma herança para você.',
    choices: [
      { id: 'take', label: 'Receber a herança', effects: { stats: { happiness: 4 }, economy: { inherit: [20000, 150000] } }, resultText: 'Que surpresa!' },
      { id: 'share', label: 'Receber e doar parte para caridade', effects: { stats: { happiness: 7 }, fighter: { reputation: 2 }, economy: { inherit: [20000, 150000], post: { cat: 'eventos', amount: -10000, label: 'Doação' } } }, resultText: 'Você ajudou um projeto social de luta para crianças.' },
    ],
  },
  {
    id: 'eco_bank_advice',
    conditions: { minAge: 20, economy: { money: { min: 30000 } } },
    weight: 4,
    text: 'O gerente do Banco Aurora sugere fazer o dinheiro trabalhar para você.',
    choices: [
      { id: 'index', label: 'Aplicar metade no Índice Bolsa Titã 100', effects: { economy: { investShare: 0.5 } }, resultText: 'Agora é aguentar os altos e baixos do mercado.' },
      { id: 'savings', label: 'Colocar metade na poupança', effects: { economy: { savingsShare: 0.5 } }, resultText: 'Rende pouco, mas é seguro.' },
      { id: 'keep', label: 'Deixar na conta', effects: {}, resultText: 'Dinheiro parado, mas à mão.' },
    ],
  },
  {
    id: 'eco_tax_temptation',
    conditions: { minAge: 20, economy: { evadedTax: false, money: { min: 20000 } } },
    weight: 3,
    text: 'Um contador "esperto" sugere esconder parte da sua renda da Receita este ano.',
    choices: [
      { id: 'evade', label: 'Sonegar metade do imposto', effects: { economy: { evade: true } }, resultText: 'Você pagou menos imposto... por enquanto.' },
      { id: 'honest', label: 'Declarar tudo certinho', effects: {}, resultText: 'Consciência tranquila.' },
    ],
  },
  {
    id: 'eco_tax_audit',
    conditions: { minAge: 20, economy: { evadedTax: true } },
    weight: 8,
    text: 'Malha fina! A Receita encontrou renda não declarada nos seus últimos anos.',
    choices: [
      { id: 'pay', label: 'Pagar imposto e multa', effects: { stats: { happiness: -5 }, economy: { taxFine: true } }, resultText: 'Doeu no bolso, mas acabou.' },
      { id: 'lawyer', label: 'Contratar advogado (R$ 5.000)', effects: { economy: { post: { cat: 'eventos', amount: -5000, label: 'Advogado tributário' }, taxFine: true }, fighter: { reputation: -2 } }, resultText: 'O advogado só conseguiu parcelar. A imprensa noticiou.' },
    ],
  },
  {
    id: 'eco_debt_collector',
    conditions: { minAge: 18, economy: { debt: { min: 1 } } },
    weight: 6,
    text: 'O telefone não para: são cobranças da dívida do cheque especial.',
    choices: [
      { id: 'cut', label: 'Cortar gastos para pagar', effects: { stats: { happiness: -2 } }, resultText: 'Você baixou o padrão de vida e fez um plano.' },
      { id: 'hide', label: 'Fingir que não é com você', effects: { stats: { happiness: -6, health: -2 } }, resultText: 'Os juros continuam correndo.' },
    ],
  },
  {
    id: 'eco_crisis',
    conditions: { minAge: 18, economy: { econYear: ['crise'] } },
    weight: 5,
    text: 'Crise econômica: os preços dispararam e todo mundo fala em cortar gastos.',
    choices: [
      { id: 'save', label: 'Apertar o cinto', effects: { stats: { happiness: -2 } }, resultText: 'Menos delivery, mais marmita.' },
      { id: 'ignore', label: 'Manter o estilo de vida', effects: { stats: { happiness: 1 } }, resultText: 'O cartão sentiu o impacto.' },
    ],
  },
  {
    id: 'eco_charity',
    conditions: { minAge: 25, economy: { netWorth: { min: 1000000 } } },
    weight: 3,
    text: 'Um projeto social que ensina luta para crianças da periferia pede apoio.',
    choices: [
      { id: 'donate', label: 'Doar R$ 50.000', effects: { stats: { happiness: 8 }, fighter: { reputation: 3 }, economy: { post: { cat: 'eventos', amount: -50000, label: 'Doação para projeto social' } } }, resultText: 'Seu nome virou nome de sala no projeto.' },
      { id: 'no', label: 'Agora não', effects: {}, resultText: 'Quem sabe no ano que vem.' },
    ],
  },
  {
    id: 'eco_parents_help',
    conditions: { minAge: 18, maxAge: 32, relationship: { types: ['pai', 'mae'], affection: { min: 60 } } },
    weight: 3,
    once: true,
    text: '{pessoa} quer te ajudar a começar a vida adulta com um dinheiro guardado.',
    choices: [
      { id: 'accept', label: 'Aceitar com gratidão', effects: { economy: { parentGift: true }, social: { affection: 5 } }, resultText: 'Uma ajuda e tanto para começar.' },
      { id: 'refuse', label: 'Recusar: quero me virar sozinho(a)', effects: { stats: { happiness: 2 }, social: { affection: 3 } }, resultText: '{pessoa} ficou orgulhoso(a) da sua independência.' },
    ],
  },
];
