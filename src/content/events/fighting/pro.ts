import type { GameEvent } from '../../../engine';

/** Carreira profissional: contratos, rivais, doping, patrocínio, peso, lesões, cinturão. */
export const FIGHT_PRO_EVENTS: readonly GameEvent[] = [
  {
    id: 'fight_offer_lfm',
    trigger: 'auto',
    conditions: { fighting: { orgEligible: 'lfm', tiers: ['none'] } },
    weight: 1,
    text: 'A Liga Fronteira MMA ofereceu seu primeiro contrato profissional: 4 lutas, bolsa modesta e muita estrada.',
    choices: [
      { id: 'sign', label: 'Assinar com a LFM', effects: { stats: { happiness: 6 }, fighter: { signWith: 'lfm' } }, resultText: 'Agora você luta como profissional!' },
      { id: 'wait', label: 'Esperar uma proposta melhor', effects: {}, resultText: 'Você agradeceu e seguiu no amador.' },
    ],
  },
  {
    id: 'fight_offer_arc',
    trigger: 'auto',
    conditions: { fighting: { orgEligible: 'arc', tiers: ['none'] } },
    weight: 1,
    text: 'A Arena Regional de Combate, a maior liga da região, quer você no próximo card.',
    choices: [
      { id: 'sign', label: 'Assinar com a ARC', effects: { stats: { happiness: 7 }, fighter: { signWith: 'arc' } }, resultText: 'Contrato assinado com a ARC!' },
      { id: 'wait', label: 'Recusar por enquanto', effects: {}, resultText: 'Você decidiu esperar.' },
    ],
  },
  {
    id: 'fight_offer_titan',
    trigger: 'auto',
    conditions: { fighting: { orgEligible: 'titan' } },
    weight: 1,
    text: 'O telefone toca: é o matchmaker do Circuito Titã. A liga principal do mundo quer você!',
    choices: [
      { id: 'sign', label: 'Assinar com o Circuito Titã', effects: { stats: { happiness: 10 }, fighter: { signWith: 'titan', reputation: 5 } }, resultText: 'Você chegou ao maior palco do MMA. O sonho de criança virou realidade.' },
      { id: 'wait', label: 'Ficar mais um ano na regional', effects: { fighter: { reputation: 2 } }, resultText: 'Você preferiu amadurecer mais antes do grande salto.' },
    ],
  },
  {
    id: 'fight_rival_trash',
    conditions: { minAge: 18, fighting: { hasFought: true, injured: false } },
    weight: 6,
    once: true,
    text: '{lutador} publicou um vídeo zombando de você: "Esse aí é só marketing. Eu desmonto em um round."',
    choices: [
      {
        id: 'answer',
        label: 'Responder e desafiar',
        effects: { stats: { happiness: 2 }, fighter: { reputation: 4 }, social: { addFromVar: { var: 'lutador', type: 'rival', affection: 15 } }, followUps: [{ eventId: 'fight_rival_showdown', delayYears: 1 }] },
        resultText: 'A troca de farpas viralizou. Os fãs querem essa luta.',
      },
      { id: 'ignore', label: 'Ignorar', effects: { fighter: { skills: { trocacao: 1 } } }, resultText: 'Você deixou o falatório para lá e foi treinar.' },
    ],
  },
  {
    id: 'fight_rival_showdown',
    trigger: 'followUp',
    conditions: { fighting: { injured: false, suspended: false } },
    weight: 1,
    text: 'Um ano de provocações depois, {lutador} aceitou o desafio. Os promotores oferecem a luta com bolsa reforçada.',
    choices: [
      { id: 'accept', label: 'Vamos resolver isso no octógono', effects: { fighter: { offer: { kind: 'rival' } } }, resultText: 'A luta contra {lutador} está na sua lista de ofertas.' },
      { id: 'decline', label: 'Não vale a pena', effects: { fighter: { reputation: -3 } }, resultText: 'Os fãs ficaram decepcionados.' },
    ],
  },
  {
    id: 'fight_doping_offer',
    conditions: { minAge: 20, fighting: { contracted: true, suspended: false } },
    weight: 3,
    once: true,
    text: 'Um "preparador" oferece uma substância que "ninguém detecta" para turbinar seu desempenho.',
    choices: [
      {
        id: 'take',
        label: 'Aceitar a substância',
        effects: { fighter: { skills: { jiujitsu: 1, trocacao: 1.4, athletic: 4 } } },
        resultText: 'Você se sentiu mais forte do que nunca. Ninguém percebeu... por enquanto.',
        risk: { chance: 0.4, effects: { stats: { happiness: -10 }, fighter: { suspendYears: 1, reputation: -20, vacateTitles: true } }, resultText: 'O antidoping pegou! Suspensão de um ano e a reputação no chão.' },
      },
      { id: 'refuse', label: 'Recusar e denunciar', effects: { fighter: { reputation: 2 } }, resultText: 'Você manteve a carreira limpa.' },
    ],
  },
  {
    id: 'fight_sponsor',
    conditions: { fighting: { reputation: { min: 30 } } },
    weight: 5,
    text: 'Duas marcas querem patrocinar você neste ano.',
    choices: [
      { id: 'supp', label: 'Marca de suplementos (R$ 5.000)', effects: { money: 5000, fighter: { reputation: 2 } }, resultText: 'Seu calção agora tem a logo dos suplementos.' },
      { id: 'energy', label: 'Energético famoso (R$ 12.000)', effects: { money: 12000, stats: { happiness: 2 } }, resultText: 'Contrato gordo! Só não pode ser fotografad{o/a} com outra marca.' },
      { id: 'none', label: 'Recusar: quero foco total', effects: { fighter: { skills: { athletic: 1 } } }, resultText: 'Sem distrações neste ano.' },
    ],
  },
  {
    id: 'fight_weight_miss',
    trigger: 'followUp',
    conditions: {},
    weight: 1,
    text: 'Você não bateu o peso para a luta contra {lutador}. A imprensa só fala disso.',
    choices: [
      { id: 'sorry', label: 'Pedir desculpas publicamente', effects: { fighter: { reputation: -2 } }, resultText: 'Os fãs entenderam. Na próxima, corte com mais cuidado.' },
      { id: 'blame', label: 'Culpar o nutricionista', effects: { fighter: { reputation: -5 }, stats: { happiness: 1 } }, resultText: 'Pegou mal. Até sua equipe ficou chateada.' },
    ],
  },
  {
    id: 'fight_training_injury',
    conditions: { minAge: 16, fighting: { hasGym: true, injured: false } },
    weight: 4,
    text: 'No meio do camp você sente uma fisgada forte no joelho.',
    choices: [
      {
        id: 'push',
        label: 'Treinar mesmo com dor',
        effects: { fighter: { skills: { athletic: 2 } } },
        resultText: 'A dor passou. Ufa!',
        risk: { chance: 0.5, effects: { fighter: { injury: { name: 'joelho lesionado', years: 1 } } }, resultText: 'O joelho não aguentou. Lesão séria: fora das lutas por um ano.' },
      },
      { id: 'rest', label: 'Parar e tratar', effects: { fighter: { skills: { athletic: -1 } } }, resultText: 'Você perdeu um pouco de ritmo, mas preservou o joelho.' },
    ],
  },
  {
    id: 'fight_short_notice',
    conditions: { fighting: { contracted: true, injured: false, suspended: false, reputation: { min: 20 } } },
    weight: 5,
    text: 'Um lutador se machucou e o card principal ficou sem adversário. Você aceita substituir com duas semanas de aviso?',
    choices: [
      { id: 'accept', label: 'Aceitar o desafio', effects: { fighter: { reputation: 3, offer: { kind: 'shortNotice' } } }, resultText: 'Topou! A luta, com bolsa reforçada, está nas suas ofertas.' },
      { id: 'decline', label: 'Recusar: sem camp, sem luta', effects: {}, resultText: 'Você não quis arriscar sem preparação.' },
    ],
  },
  {
    id: 'fight_title_defense',
    conditions: { fighting: { champion: true, injured: false, suspended: false } },
    weight: 9,
    text: 'A organização marcou a defesa do seu cinturão contra o desafiante número 1.',
    choices: [
      { id: 'accept', label: 'Defender o cinturão', effects: { fighter: { offer: { kind: 'titleDefense' }, reputation: 2 } }, resultText: 'A defesa de cinturão está nas suas ofertas.' },
      { id: 'delay', label: 'Pedir mais tempo', effects: { fighter: { reputation: -5 } }, resultText: 'Os fãs e a imprensa chamaram você de campeão de papel.' },
    ],
  },
  {
    id: 'fight_viral_video',
    conditions: { fighting: { hasFought: true, reputation: { min: 10, max: 70 } } },
    weight: 4,
    text: 'Um vídeo de um treino seu viralizou: milhões de visualizações em dois dias.',
    choices: [
      { id: 'ride', label: 'Aproveitar a onda nas redes', effects: { fighter: { reputation: 6 }, stats: { happiness: 3 } }, resultText: 'Seus seguidores explodiram.' },
      { id: 'focus', label: 'Ignorar e voltar ao treino', effects: { fighter: { reputation: 2, skills: { trocacao: 1 } } }, resultText: 'A fama é passageira; o treino fica.' },
    ],
  },
  {
    id: 'fight_media_day',
    conditions: { fighting: { tiers: ['major'] } },
    weight: 4,
    text: 'Media day do Circuito Titã: dezenas de câmeras e um microfone na sua frente.',
    choices: [
      { id: 'show', label: 'Dar um show na entrevista', effects: { fighter: { reputation: 5 } }, resultText: 'Suas frases viraram manchete.' },
      { id: 'humble', label: 'Respostas humildes e curtas', effects: { fighter: { reputation: 1 }, stats: { happiness: 1 } }, resultText: 'Discreto, mas respeitado.' },
    ],
  },
  {
    id: 'fight_retirement_thoughts',
    conditions: { minAge: 34, fighting: { proWins: { min: 1 } } },
    weight: 4,
    once: true,
    text: 'O corpo já não responde como antes. À noite, você se pega pensando em aposentadoria.',
    choices: [
      { id: 'plan', label: 'Começar a planejar o pós-carreira', effects: { setFlags: { pensa_aposentar: true }, stats: { happiness: 2 } }, resultText: 'Você começou a pensar em abrir a própria academia um dia.' },
      { id: 'never', label: '"Eu vou até o fim!"', effects: { fighter: { skills: { athletic: 1 } } }, resultText: 'Ainda há lenha para queimar.' },
    ],
  },
];
