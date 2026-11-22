import type { GameEvent } from '../../../engine';

/** Gravidez, nascimento e filhos. */
export const CHILDREN_EVENTS: readonly GameEvent[] = [
  {
    id: 'rel_pregnancy_news',
    trigger: 'followUp',
    conditions: { minAge: 18 },
    weight: 1,
    text: 'O teste deu positivo: um bebê está a caminho!',
    choices: [
      { id: 'keep', label: 'Vamos ter o bebê!', effects: { stats: { happiness: 6 }, social: { affection: 10 } }, resultText: 'Começou a contagem regressiva para conhecer o bebê.' },
      { id: 'adoption', label: 'Entregar para adoção ao nascer', effects: { stats: { happiness: -4 }, social: { giveUpPregnancy: true } }, resultText: 'Foi uma decisão difícil, tomada a dois.' },
    ],
  },
  {
    id: 'rel_birth_celebration',
    trigger: 'auto',
    conditions: { flagsAll: ['recem_nascido'] },
    weight: 1,
    text: 'A família inteira veio conhecer o bebê.',
    choices: [
      { id: 'party', label: 'Fazer uma festinha', effects: { stats: { happiness: 4 }, clearFlags: ['recem_nascido'], social: { parentsAffection: 5 } }, resultText: 'Os avós brigaram para ver quem segurava primeiro.' },
      { id: 'quiet', label: 'Receber com calma, em casa', effects: { stats: { happiness: 2 }, clearFlags: ['recem_nascido'] }, resultText: 'Dias de pouco sono e muito amor.' },
    ],
  },
  {
    id: 'rel_want_child',
    conditions: { minAge: 22, civilStatus: ['casado'], children: { max: 0 }, relationship: { types: ['conjuge'], affection: { min: 60 }, personAge: { min: 18 } } },
    weight: 5,
    text: '{pessoa} diz que sonha em ter um filho com você.',
    choices: [
      { id: 'try', label: 'Vamos tentar!', effects: { stats: { happiness: 3 }, social: { affection: 8, pregnancyChance: 0.6 } }, resultText: 'Vocês decidiram aumentar a família.' },
      { id: 'adopt', label: 'Adotar uma criança (R$ 10.000)', effects: { social: { affection: 8, adopt: true } }, resultText: 'Vocês entraram na fila de adoção.' },
      { id: 'later', label: 'Ainda não é a hora', effects: { social: { affection: -5 } }, resultText: '{pessoa} ficou pensativo(a).' },
    ],
  },
  {
    id: 'rel_child_wants_fight',
    conditions: { relationship: { types: ['filho'], personAge: { min: 8, max: 17 }, personFlag: 'interesse_luta' } },
    weight: 6,
    once: true,
    text: '{pessoa} chegou da escola decidido(a): "Quero lutar igual a você!"',
    choices: [
      { id: 'support', label: 'Levar para a academia', effects: { stats: { happiness: 5 }, social: { affection: 10, setPersonFlags: { lutador_mirim: true } } }, resultText: 'Primeiro dia de quimono. Você ficou mais nervoso(a) que na sua estreia.' },
      { id: 'discourage', label: 'Dizer que luta é perigoso', effects: { social: { affection: -8 } }, resultText: '{pessoa} ficou frustrado(a).' },
    ],
  },
  {
    id: 'rel_child_bullied',
    conditions: { relationship: { types: ['filho'], personAge: { min: 7, max: 15 } } },
    weight: 4,
    text: '{pessoa} está sofrendo bullying na escola e chegou em casa chorando.',
    choices: [
      { id: 'defend', label: 'Ensinar a se defender', effects: { social: { affection: 8, setPersonFlags: { interesse_luta: true } } }, resultText: '{pessoa} voltou para a escola de cabeça erguida.' },
      { id: 'school', label: 'Ir falar com a escola', effects: { social: { affection: 6 } }, resultText: 'A coordenação resolveu o problema.' },
      { id: 'ignore', label: 'Dizer para ignorar', effects: { social: { affection: -5 } }, resultText: '{pessoa} sentiu que você não entendeu.' },
    ],
  },
  {
    id: 'rel_child_grades',
    conditions: { relationship: { types: ['filho'], personAge: { min: 10, max: 17 } } },
    weight: 4,
    text: 'O boletim de {pessoa} chegou cheio de notas vermelhas.',
    choices: [
      { id: 'help', label: 'Sentar e estudar junto', effects: { social: { affection: 5 } }, resultText: 'As notas melhoraram no bimestre seguinte.' },
      { id: 'tutor', label: 'Contratar aulas de reforço (R$ 1.500)', effects: { money: -1500, social: { affection: 3 } }, resultText: 'O professor particular fez milagre.' },
      { id: 'scold', label: 'Dar uma bronca', effects: { social: { affection: -6 } }, resultText: 'A porta do quarto bateu forte.' },
    ],
  },
  {
    id: 'rel_child_hero',
    conditions: { fighting: { hasFought: true }, relationship: { types: ['filho'], personAge: { min: 5, max: 14 } } },
    weight: 4,
    text: 'Na escola, {pessoa} contou para a turma toda que você é o(a) herói(na) da família.',
    choices: [
      { id: 'visit', label: 'Visitar a escola para uma palestra', effects: { stats: { happiness: 5 }, fighter: { reputation: 1 }, social: { affection: 10 } }, resultText: 'As crianças fizeram fila para tirar foto.' },
      { id: 'smile', label: 'Só sorrir de orgulho', effects: { stats: { happiness: 3 }, social: { affection: 4 } }, resultText: 'Melhor título do que qualquer cinturão.' },
    ],
  },
];
