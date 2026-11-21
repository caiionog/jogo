import type { GameEvent } from '../../../engine';

/** Disciplina: chamada dos pais, suspensão, punição, expulsão e troca de escola. */
export const DISCIPLINE_EVENTS: readonly GameEvent[] = [
  {
    id: 'school_parents_called',
    conditions: { enrolled: true, minAge: 6, school: { discipline: { max: 40 } } },
    weight: 9,
    text: 'A coordenação {da_escola} chamou seus pais para falar do seu comportamento.',
    choices: [
      { id: 'promise', label: 'Prometer que vai melhorar', effects: { stats: { happiness: -2 }, school: { discipline: 8 } }, resultText: 'Você ficou de castigo, mas a conversa surtiu efeito.' },
      { id: 'argue', label: 'Discutir com a coordenadora', effects: { stats: { happiness: 1 }, school: { discipline: -6 } }, resultText: 'Seus pais saíram da reunião furiosos com você.' },
    ],
  },
  {
    id: 'school_suspension',
    conditions: { enrolled: true, minAge: 8, school: { discipline: { max: 30 } } },
    weight: 8,
    text: 'Você foi peg{o/a} pichando a parede do banheiro da escola com {colega}.',
    choices: [
      { id: 'admit', label: 'Assumir a culpa', effects: { school: { suspend: true, discipline: 5 } }, resultText: 'Você foi suspens{o/a} por três dias e teve que pintar a parede.' },
      { id: 'blame', label: 'Botar a culpa em {colega}', effects: { school: { popularity: -5 } }, resultText: 'A diretoria acreditou em você, mas a escola inteira soube da traição.', risk: { chance: 0.5, effects: { school: { suspend: true, discipline: -5 } }, resultText: 'As câmeras mostraram tudo. Suspensão dobrada.' } },
    ],
  },
  {
    id: 'school_skip_caught',
    trigger: 'followUp',
    conditions: { enrolled: true },
    weight: 1,
    text: 'A escola ligou para sua casa: você foi vist{o/a} fora da escola em horário de aula.',
    choices: [
      { id: 'truth', label: 'Contar a verdade', effects: { stats: { happiness: -3 }, school: { discipline: -2 } }, resultText: 'Você ficou sem celular por um mês, mas seus pais valorizaram a sinceridade.' },
      { id: 'lie', label: 'Inventar uma desculpa', effects: { stats: { happiness: 1 } }, resultText: 'Colou! Por enquanto...', risk: { chance: 0.5, effects: { stats: { happiness: -6 }, school: { suspend: true } }, resultText: 'A mentira não durou um dia. Suspensão e castigo.' } },
    ],
  },
  {
    id: 'school_expelled',
    trigger: 'auto',
    conditions: { schoolResult: ['expelled'] },
    weight: 1,
    text: 'Depois de tantas confusões, você foi expuls{o/a} e começa o ano numa escola nova: {escola}.',
    choices: [
      { id: 'fresh', label: 'Recomeçar do zero', effects: { stats: { happiness: 2 }, school: { discipline: 10 } }, resultText: 'Você decidiu que aqui vai ser diferente.' },
      { id: 'same', label: 'Continuar do mesmo jeito', effects: { stats: { happiness: 1 }, school: { discipline: -5, popularity: 3 } }, resultText: 'Em uma semana você já tinha fama de encrenqueir{o/a}.' },
    ],
  },
  {
    id: 'school_family_moves',
    conditions: { enrolled: true, minAge: 7, maxAge: 15 },
    weight: 3,
    once: true,
    text: 'Seus pais conseguiram um emprego em outro bairro e a família vai se mudar. Você terá que trocar de escola.',
    choices: [
      { id: 'accept', label: 'Encarar a mudança', effects: { stats: { happiness: -2 }, school: { changeSchool: {} } }, resultText: 'Você se despediu de {colega} e dos amigos {da_escola}.' },
      { id: 'beg', label: 'Implorar para ficar na escola atual', effects: { stats: { happiness: 2 }, money: -20 }, resultText: 'Seus pais aceitaram pagar o transporte para você continuar {na_escola}.' },
    ],
  },
];
