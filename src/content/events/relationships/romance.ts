import type { GameEvent } from '../../../engine';

/** Namoro adolescente (14–17, sem conteúdo sexual) e romance adulto não explícito. */
export const ROMANCE_EVENTS: readonly GameEvent[] = [
  // ----- adolescentes (14–17): só carinho, nada sexual -----
  {
    id: 'rel_teen_first_date',
    conditions: { minAge: 14, maxAge: 17, relationship: { types: ['parceiro'], stages: ['ficando', 'namorando'], personAge: { min: 14, max: 17 } } },
    weight: 7,
    once: true,
    text: 'Primeiro encontro de verdade com {pessoa}. Você trocou de roupa três vezes.',
    choices: [
      { id: 'movie', label: 'Cinema e pipoca', effects: { stats: { happiness: 5 }, social: { affection: 8 } }, resultText: 'Vocês riram mais do que assistiram ao filme.' },
      { id: 'snack', label: 'Lanchonete do bairro', effects: { stats: { happiness: 4 }, social: { affection: 6 } }, resultText: 'Milkshake dividido e conversa até a lanchonete fechar.' },
      { id: 'nervous', label: 'Ficar travado(a) de nervoso', effects: { social: { affection: 2 } }, resultText: '{pessoa} achou fofo o seu nervosismo.' },
    ],
  },
  {
    id: 'rel_teen_first_kiss',
    conditions: { minAge: 14, maxAge: 17, flagsNone: ['primeiro_beijo'], relationship: { types: ['parceiro'], stages: ['ficando', 'namorando'], personAge: { min: 14, max: 17 } } },
    weight: 7,
    once: true,
    text: 'No fim do passeio, no portão de casa, {pessoa} chega mais perto...',
    choices: [
      { id: 'kiss', label: 'Dar o primeiro beijo', effects: { stats: { happiness: 7 }, setFlags: { primeiro_beijo: true }, social: { affection: 10 } }, resultText: 'Seu primeiro beijo. Você não dormiu direito naquela noite.' },
      { id: 'wait', label: 'Dar só um abraço', effects: { social: { affection: 2 } }, resultText: 'Ainda não era a hora, e tudo bem.' },
    ],
  },
  {
    id: 'rel_teen_jealousy',
    conditions: { minAge: 14, maxAge: 17, relationship: { types: ['parceiro'], traits: ['ciumento', 'protetor'], personAge: { min: 14, max: 17 } } },
    weight: 5,
    text: '{pessoa} ficou com ciúmes porque você conversou muito com {colega} no intervalo.',
    choices: [
      { id: 'explain', label: 'Explicar com calma', effects: { social: { affection: 3 } }, resultText: 'Tudo esclarecido, com direito a pedido de desculpas.' },
      { id: 'mad', label: 'Ficar irritado(a) com o ciúme', effects: { social: { affection: -8 } }, resultText: 'Vocês ficaram dois dias sem se falar.' },
    ],
  },
  {
    id: 'rel_teen_distance',
    conditions: { minAge: 14, maxAge: 17, relationship: { types: ['parceiro'], affection: { max: 40 }, personAge: { min: 14, max: 17 } } },
    weight: 5,
    text: '{pessoa} anda distante e responde suas mensagens com "kkk".',
    choices: [
      { id: 'talk', label: 'Chamar para conversar', effects: { social: { affection: 8 } }, resultText: 'Era só fase de provas. Vocês se acertaram.' },
      { id: 'end', label: 'Terminar', effects: { social: { breakUp: true } }, resultText: 'Acabou. Doeu, mas passa.' },
    ],
  },
  // ----- adultos (18+), não explícito -----
  {
    id: 'rel_adult_jealousy',
    conditions: { minAge: 18, relationship: { types: ['parceiro', 'conjuge'], traits: ['ciumento'], personAge: { min: 18 } } },
    weight: 5,
    text: '{pessoa} viu uma mensagem no seu celular e ficou desconfiado(a).',
    choices: [
      { id: 'show', label: 'Mostrar a conversa inteira', effects: { social: { affection: 5 } }, resultText: 'Era só o grupo da academia. Ufa.' },
      { id: 'fight', label: 'Reclamar da falta de confiança', effects: { stats: { happiness: -3 }, social: { affection: -10 } }, resultText: 'A noite terminou em silêncio.' },
    ],
  },
  {
    id: 'rel_proposal_moment',
    conditions: { minAge: 18, civilStatus: ['namorando'], relationship: { types: ['parceiro'], stages: ['namorando'], affection: { min: 70 }, personAge: { min: 18 } } },
    weight: 6,
    text: 'Faz tempo que você e {pessoa} estão juntos. Será que chegou a hora de pedir em casamento?',
    choices: [
      {
        id: 'ask',
        label: 'Ajoelhar e pedir',
        effects: { stats: { happiness: 8 }, social: { stage: 'noivos', affection: 8 }, followUps: [{ eventId: 'rel_wedding', delayYears: 0 }] },
        resultText: '{pessoa} chorou e disse SIM!',
        risk: { chance: 0.2, effects: { stats: { happiness: -6 }, social: { affection: -10 } }, resultText: '{pessoa} disse que ainda não está pronto(a). Que balde de água fria.' },
      },
      { id: 'wait', label: 'Esperar mais um pouco', effects: {}, resultText: 'Você guardou a aliança na gaveta.' },
    ],
  },
  {
    id: 'rel_wedding',
    trigger: 'followUp',
    conditions: { minAge: 18, relationship: { types: ['parceiro'], stages: ['noivos'], personAge: { min: 18 } } },
    weight: 1,
    text: 'Hora de planejar o casamento com {pessoa}!',
    choices: [
      { id: 'simple', label: 'Cerimônia simples (R$ 3.000)', effects: { social: { wedding: 'simple' } }, resultText: 'Só os mais próximos, e foi perfeito.' },
      { id: 'big', label: 'Festa grande (R$ 20.000)', effects: { social: { wedding: 'big', parentsAffection: 5 } }, resultText: 'Teve banda, pista lotada e tio dançando até o fim.' },
      { id: 'delay', label: 'Adiar o casamento', effects: { social: { affection: -5 } }, resultText: '{pessoa} ficou chateado(a), mas entendeu.' },
    ],
  },
  {
    id: 'rel_marriage_crisis',
    conditions: { minAge: 18, civilStatus: ['casado'], relationship: { types: ['conjuge'], affection: { max: 45 } } },
    weight: 6,
    text: 'O casamento com {pessoa} está em crise: brigas por tudo e pouco carinho.',
    choices: [
      { id: 'therapy', label: 'Terapia de casal (R$ 2.000)', effects: { money: -2000, social: { affection: 15 } }, resultText: 'Aos poucos, vocês voltaram a se ouvir.' },
      { id: 'trip', label: 'Viajar a dois (R$ 4.000)', effects: { money: -4000, stats: { happiness: 4 }, social: { affection: 12 } }, resultText: 'A viagem reacendeu a chama.' },
      { id: 'divorce', label: 'Pedir o divórcio', effects: { social: { divorce: true } }, resultText: 'Foi o fim de um capítulo.' },
    ],
  },
  {
    id: 'rel_anniversary',
    conditions: { minAge: 18, relationship: { types: ['conjuge'], affection: { min: 40 } } },
    weight: 4,
    text: 'Aniversário de casamento com {pessoa}.',
    choices: [
      { id: 'dinner', label: 'Jantar especial (R$ 300)', effects: { money: -300, stats: { happiness: 3 }, social: { affection: 7 } }, resultText: 'Vocês brindaram aos anos juntos.' },
      { id: 'forgot', label: 'Esquecer a data', effects: { social: { affection: -12 } }, resultText: '{pessoa} não esqueceu. E não vai esquecer tão cedo.' },
    ],
  },
  {
    id: 'rel_ex_returns',
    conditions: { minAge: 15, relationship: { types: ['ex'] } },
    weight: 3,
    text: '{pessoa}, seu ex, mandou mensagem: "Saudade de você..."',
    choices: [
      { id: 'reply', label: 'Responder com carinho', effects: { social: { affection: 8 } }, resultText: 'Vocês relembraram os velhos tempos.' },
      { id: 'ignore', label: 'Visualizar e não responder', effects: { stats: { happiness: 1 } }, resultText: 'Página virada.' },
    ],
  },
];
