import type { GameEvent } from '../../../engine';

/** Amor × carreira de luta. */
export const LOVE_CAREER_EVENTS: readonly GameEvent[] = [
  {
    id: 'rel_partner_quit_fighting',
    conditions: { minAge: 18, fighting: { hasFought: true }, relationship: { types: ['parceiro', 'conjuge'], traits: ['protetor', 'ciumento', 'religioso'], personAge: { min: 18 } } },
    weight: 5,
    text: '{pessoa} chorou depois da sua última luta: "Eu não aguento ver você apanhar. Para, por favor."',
    choices: [
      { id: 'think', label: 'Prometer pensar no assunto', effects: { setFlags: { pensa_aposentar: true }, social: { affection: 8 } }, resultText: 'A conversa mexeu com você.' },
      { id: 'continue', label: '"Lutar é quem eu sou."', effects: { stats: { happiness: -2 }, social: { affection: -10 } }, resultText: '{pessoa} saiu do quarto em silêncio.' },
      { id: 'middle', label: 'Prometer menos lutas por ano', effects: { social: { affection: 4 } }, resultText: 'Vocês chegaram a um meio-termo.' },
    ],
  },
  {
    id: 'rel_partner_camp_support',
    conditions: { minAge: 16, fighting: { hasFought: true }, relationship: { types: ['parceiro', 'conjuge'], affection: { min: 60 }, traits: ['ambicioso', 'aventureiro', 'competitivo', 'orgulhoso', 'carinhoso'] } },
    weight: 5,
    text: '{pessoa} cuidou da sua dieta no camp inteiro e ainda segurou a placa na plateia.',
    choices: [
      { id: 'thank', label: 'Dedicar a vitória a {pessoa}', effects: { stats: { happiness: 5 }, social: { affection: 10 } }, resultText: 'O apoio fez toda a diferença.' },
      { id: 'focus', label: 'Focar só na luta', effects: { fighter: { skills: { cardio: 1 } }, social: { affection: 2 } }, resultText: 'Você agradeceu depois, com calma.' },
    ],
  },
  {
    id: 'rel_long_camp',
    conditions: { minAge: 18, fighting: { contracted: true }, relationship: { types: ['parceiro', 'conjuge'], personAge: { min: 18 } } },
    weight: 4,
    text: 'O camp para a próxima luta vai durar dois meses longe de casa. {pessoa} não está feliz.',
    choices: [
      { id: 'go', label: 'Ir para o camp mesmo assim', effects: { fighter: { skills: { cardio: 2, striking: 1 } }, social: { affection: -8 } }, resultText: 'Você voltou em forma, mas com saudade e uma relação mais fria.' },
      { id: 'home', label: 'Fazer o camp perto de casa', effects: { social: { affection: 6 } }, resultText: 'Menos estrutura, mais jantares juntos.' },
    ],
  },
];
