import type { GameEvent } from '../../../engine';

/** Amizades, companheiros de treino e rivais. */
export const FRIEND_EVENTS: readonly GameEvent[] = [
  {
    id: 'rel_party_before_fight',
    conditions: { minAge: 16, fighting: { hasFought: true }, relationship: { types: ['amigo', 'colega_treino'], affection: { min: 40 } } },
    weight: 5,
    text: '{pessoa} te chama para uma festa... justo na véspera de uma luta importante.',
    choices: [
      { id: 'go', label: 'Ir só um pouquinho', effects: { stats: { happiness: 5 }, fighter: { skills: { athletic: -2 } }, social: { affection: 6 } }, resultText: 'A festa foi ótima. O treino do dia seguinte, nem tanto.' },
      { id: 'no', label: 'Recusar: foco total', effects: { fighter: { skills: { athletic: 1 } }, social: { affection: -4 } }, resultText: '{pessoa} disse que você anda sumido(a).' },
    ],
  },
  {
    id: 'rel_rival_reconcile',
    conditions: { minAge: 16, relationship: { types: ['rival'] } },
    weight: 5,
    text: 'Depois de tanta provocação, {pessoa} te procurou: "Respeito o que você fez lá dentro. Bora tomar um café?"',
    choices: [
      { id: 'yes', label: 'Aceitar e fazer as pazes', effects: { stats: { happiness: 4 }, social: { affection: 30, setType: 'amigo' } }, resultText: 'O rival virou amigo. Quem diria.' },
      { id: 'no', label: 'Rival é rival', effects: { fighter: { reputation: 1 } }, resultText: 'Você manteve a pose. A rivalidade continua.' },
    ],
  },
  {
    id: 'rel_friend_betrayal',
    conditions: { minAge: 10, relationship: { types: ['amigo'] } },
    weight: 3,
    text: '{pessoa} contou para todo mundo um segredo que você confiou só a ele(a).',
    choices: [
      { id: 'confront', label: 'Tirar satisfação', effects: { social: { affection: -15 } }, resultText: 'A conversa foi dura, mas sincera.' },
      { id: 'forgive', label: 'Perdoar', effects: { stats: { happiness: -2 }, social: { affection: -3 } }, resultText: 'Você deu mais uma chance.' },
      { id: 'cut', label: 'Cortar a amizade', effects: { stats: { happiness: -3 }, social: { endRelation: 'Traiu sua confiança.' } }, resultText: 'Você saiu da vida de {pessoa}.' },
    ],
  },
  {
    id: 'rel_friend_moves',
    conditions: { minAge: 8, relationship: { types: ['amigo', 'colega_treino'], affection: { min: 30 } } },
    weight: 3,
    text: '{pessoa} vai se mudar para outra cidade com a família.',
    choices: [
      { id: 'bye', label: 'Fazer uma despedida', effects: { stats: { happiness: -2 }, social: { endRelation: 'Mudou-se de cidade.' } }, resultText: 'Vocês prometeram nunca esquecer um do outro.' },
      { id: 'keep', label: 'Prometer manter contato', effects: { social: { affection: -10 } }, resultText: 'As mensagens ficaram mais raras, mas continuam.' },
    ],
  },
  {
    id: 'rel_training_partner',
    conditions: { minAge: 12, relationship: { types: ['colega_treino'], sameGym: true } },
    weight: 5,
    text: '{pessoa} quer ser seu parceiro(a) fixo(a) de treino na academia.',
    choices: [
      { id: 'yes', label: 'Fechado!', effects: { social: { affection: 15 }, fighter: { skills: { trocacao: 1 } } }, resultText: 'Agora vocês se cobram todos os dias.' },
      { id: 'no', label: 'Prefiro variar os parceiros', effects: { social: { affection: -5 } }, resultText: '{pessoa} entendeu, meio sem graça.' },
    ],
  },
  {
    id: 'rel_school_friend_help',
    conditions: { enrolled: true, minAge: 8, relationship: { types: ['amigo'], affection: { min: 40 } } },
    weight: 4,
    text: 'Véspera de prova: {pessoa} se oferece para estudar com você.',
    choices: [
      { id: 'study', label: 'Estudar juntos', effects: { school: { average: 4 }, social: { affection: 5 } }, resultText: 'Entre risadas e resumos, deu tudo certo na prova.' },
      { id: 'play', label: 'Jogar videogame em vez de estudar', effects: { stats: { happiness: 4 }, school: { average: -2 }, social: { affection: 6 } }, resultText: 'A prova foi um desastre; a tarde, inesquecível.' },
    ],
  },
  {
    id: 'rel_party_new_people',
    conditions: { minAge: 15 },
    weight: 4,
    text: 'Numa festa de aniversário, você está numa roda de gente que não conhece.',
    choices: [
      { id: 'mingle', label: 'Puxar assunto', effects: { stats: { happiness: 3 }, social: { meet: { context: 'party', chance: 0.7 } } }, resultText: 'Você saiu da festa com contatos novos.' },
      { id: 'leave', label: 'Ir embora cedo', effects: { stats: { happiness: -1 } }, resultText: 'Sua cama parecia mais convidativa.' },
    ],
  },
];
