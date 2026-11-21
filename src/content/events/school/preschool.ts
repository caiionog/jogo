import type { GameEvent } from '../../../engine';

/** Pré-escola (3–5 anos). */
export const PRESCHOOL_EVENTS: readonly GameEvent[] = [
  {
    id: 'pre_first_day',
    conditions: { schoolStages: ['pre'] },
    weight: 8,
    once: true,
    text: 'Primeiro dia {na_escola}. Sua mãe está indo embora e você sente um frio na barriga.',
    choices: [
      { id: 'cry', label: 'Chorar agarrad{o/a} na perna dela', effects: { stats: { happiness: -3 } }, resultText: 'Você chorou a manhã inteira, mas no fim do dia já estava rindo.' },
      { id: 'brave', label: 'Respirar fundo e entrar', effects: { stats: { happiness: 3 }, school: { popularity: 3 } }, resultText: 'Você entrou na sala e logo fez amizade com {colega}.' },
    ],
  },
  {
    id: 'pre_toy_dispute',
    conditions: { schoolStages: ['pre'] },
    weight: 6,
    text: '{colega} pegou o brinquedo com que você estava brincando.',
    choices: [
      { id: 'grab', label: 'Puxar de volta', effects: { stats: { happiness: 2 }, school: { discipline: -5 } }, resultText: 'Você puxou o brinquedo de volta e levou uma bronca da professora.' },
      { id: 'share', label: 'Propor brincar junto', effects: { stats: { happiness: 2 }, school: { popularity: 4, discipline: 2 } }, resultText: 'Vocês brincaram juntos a tarde toda.' },
      { id: 'cry', label: 'Chamar a professora', effects: { school: { discipline: 1 } }, resultText: '{professor} devolveu o brinquedo para você.' },
    ],
  },
  {
    id: 'pre_drawing',
    conditions: { schoolStages: ['pre'] },
    weight: 5,
    text: '{professor} pediu para a turma desenhar a família.',
    choices: [
      { id: 'careful', label: 'Caprichar no desenho', effects: { stats: { intelligence: 1, happiness: 2 } }, resultText: 'Seu desenho foi pendurado no mural da escola.' },
      { id: 'fighter', label: 'Desenhar você com um cinturão de campeão', effects: { stats: { happiness: 3 }, setFlags: { gostaDeLuta: true } }, resultText: 'A turma achou o máximo o seu desenho com cinturão de campeão.' },
    ],
  },
];
