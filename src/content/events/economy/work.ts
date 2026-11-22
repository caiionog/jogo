import type { GameEvent } from '../../../engine';

/** Trabalho, patrocínio, empresário e TV. */
export const WORK_EVENTS: readonly GameEvent[] = [
  {
    id: 'eco_sponsor_offer',
    conditions: { minAge: 16, fighting: { reputation: { min: 15 }, hasFought: true, suspended: false } },
    weight: 6,
    text: 'Uma marca procurou sua equipe: querem estampar o logo no seu calção.',
    choices: [
      { id: 'sign', label: 'Fechar o patrocínio', effects: { economy: { signSponsor: 'best' } }, resultText: 'Contrato assinado. Agora é manter as vitórias e a imagem limpa.' },
      { id: 'no', label: 'Recusar por enquanto', effects: {}, resultText: 'Você preferiu esperar uma proposta melhor.' },
    ],
  },
  {
    id: 'eco_agent_offer',
    conditions: { minAge: 18, fighting: { contracted: true, reputation: { min: 20 } }, economy: { hasAgent: false } },
    weight: 5,
    text: 'Um empresário de lutadores quer cuidar da sua carreira: "Eu consigo bolsas 20% maiores. Fico com 15%."',
    choices: [
      { id: 'hire', label: 'Contratar o empresário', effects: { economy: { hireAgent: true } }, resultText: 'Agora as negociações ficam com ele.' },
      { id: 'no', label: 'Negociar sozinho(a)', effects: {}, resultText: 'Você prefere manter os 15% no bolso.' },
    ],
  },
  {
    id: 'eco_agent_scam',
    conditions: { minAge: 18, economy: { hasAgent: true } },
    weight: 2,
    text: 'Seu empresário parou de atender o telefone. O dinheiro de algumas bolsas não caiu na sua conta.',
    choices: [
      { id: 'sue', label: 'Processar (R$ 3.000 de advogado)', effects: { economy: { agentScam: true, post: { cat: 'eventos', amount: -3000, label: 'Advogado' } } }, resultText: 'O processo vai demorar anos. O dinheiro, provavelmente, não volta.' },
      { id: 'let', label: 'Engolir o prejuízo', effects: { stats: { happiness: -6 }, economy: { agentScam: true } }, resultText: 'Lição aprendida: confie, mas confira.' },
    ],
  },
  {
    id: 'eco_tv_commentator',
    conditions: { minAge: 24, fighting: { reputation: { min: 60 } }, economy: { jobs: ['lanchonete', 'entregador', 'repositor', 'auxiliar_adm', 'vendedor', 'motorista', 'tecnico', 'seguranca', 'instrutor'] } },
    weight: 4,
    once: true,
    text: 'Uma emissora quer você comentando as lutas do Circuito Titã na TV.',
    choices: [
      { id: 'yes', label: 'Aceitar (troca de emprego)', effects: { economy: { jobOffer: 'comentarista' }, fighter: { reputation: 3 } }, resultText: 'Microfone na mão e terno alinhado.' },
      { id: 'no', label: 'Foco total na luta', effects: {}, resultText: 'Você agradeceu o convite.' },
    ],
  },
  {
    id: 'eco_tv_invite_unemployed',
    conditions: { minAge: 24, fighting: { reputation: { min: 60 } }, economy: { employed: false } },
    weight: 4,
    once: true,
    text: 'Convite para comentar lutas ao vivo na TV — um trabalho que toma pouca energia e paga bem.',
    choices: [
      { id: 'yes', label: 'Aceitar o convite', effects: { economy: { jobOffer: 'comentarista' }, fighter: { reputation: 3 } }, resultText: 'Estreia na bancada com audiência recorde.' },
      { id: 'no', label: 'Recusar', effects: {}, resultText: 'Talvez no futuro.' },
    ],
  },
  {
    id: 'eco_promotion_offer',
    conditions: { minAge: 18, economy: { employed: true } },
    weight: 4,
    text: 'Abriu uma vaga de supervisão e seu nome foi lembrado.',
    choices: [
      { id: 'accept', label: 'Aceitar a promoção', effects: { stats: { happiness: 3 }, economy: { promote: true } }, resultText: 'Novo cargo, novo salário, mais responsabilidade.' },
      { id: 'decline', label: 'Recusar: menos tempo para treinar', effects: { fighter: { skills: { cardio: 1 } } }, resultText: 'Você manteve a rotina para não perder treinos.' },
    ],
  },
  {
    id: 'eco_abusive_boss',
    conditions: { minAge: 16, economy: { employed: true, jobCategory: ['meio_periodo', 'formal'] } },
    weight: 4,
    text: 'Seu chefe grita com todo mundo e passou a te perseguir.',
    choices: [
      { id: 'endure', label: 'Aguentar pelo salário', effects: { stats: { happiness: -5, health: -1 } }, resultText: 'Você engoliu sapos o ano inteiro.' },
      { id: 'quit', label: 'Pedir demissão', effects: { stats: { happiness: 4 }, economy: { loseJob: 'Você pediu as contas e saiu de cabeça erguida.' } }, resultText: 'Liberdade! Agora é procurar outra vaga.' },
    ],
  },
  {
    id: 'eco_mass_layoff',
    conditions: { minAge: 16, economy: { employed: true, econYear: ['crise'] } },
    weight: 7,
    text: 'A crise chegou à sua empresa: anunciaram uma demissão em massa.',
    choices: [
      {
        id: 'hope',
        label: 'Torcer para não estar na lista',
        effects: { stats: { happiness: -2 } },
        resultText: 'Você escapou do corte desta vez.',
        risk: { chance: 0.5, effects: { stats: { happiness: -6 }, economy: { loseJob: 'Você foi demitido(a) no corte em massa.' } }, resultText: 'Seu nome estava na lista.' },
      },
      { id: 'agree', label: 'Aceitar o plano de demissão voluntária', effects: { economy: { loseJob: 'Você aderiu ao plano de demissão voluntária.', post: { cat: 'salario', amount: 8000, label: 'Indenização da demissão voluntária' } } }, resultText: 'Saiu com uma indenização no bolso.' },
    ],
  },
];
