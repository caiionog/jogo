import type { GameEvent } from '../../../engine';

/** Ensino Médio (15–17 anos). */
export const HIGHSCHOOL_EVENTS: readonly GameEvent[] = [
  {
    id: 'em_science_fair',
    conditions: { schoolStages: ['medio'] },
    weight: 5,
    once: true,
    text: 'Feira de ciências do Ensino Médio. Seu grupo precisa de um projeto.',
    choices: [
      {
        id: 'ambitious',
        label: 'Projeto ambicioso: filtro de água solar',
        effects: { stats: { intelligence: 3, happiness: 3 }, school: { average: 4 }, followUps: [{ eventId: 'em_science_fair_regional', delayYears: 1 }] },
        resultText: 'O projeto ganhou o 1º lugar e foi selecionado para a feira regional do ano que vem!',
        risk: { chance: 0.4, effects: { stats: { happiness: -2, intelligence: 1 } }, resultText: 'O protótipo pegou fogo na apresentação. Pelo menos foi engraçado.' },
      },
      { id: 'simple', label: 'Projeto simples e seguro', effects: { school: { average: 2 } }, resultText: 'Nota boa, sem sustos.' },
      { id: 'slack', label: 'Deixar o grupo fazer tudo', effects: { stats: { happiness: 1 }, school: { popularity: -2, average: -1 } }, resultText: 'O grupo apresentou sem você e ficou de cara feia.' },
    ],
  },
  {
    id: 'em_science_fair_regional',
    trigger: 'followUp',
    conditions: { enrolled: true },
    weight: 1,
    text: 'Seu filtro de água solar está na feira regional de ciências. Os jurados se aproximam.',
    choices: [
      { id: 'pitch', label: 'Fazer uma apresentação caprichada', effects: { stats: { happiness: 6, intelligence: 2 }, setFlags: { premio_ciencias: true } }, resultText: 'Menção honrosa regional! Ótimo para o currículo.' },
      { id: 'nervous', label: 'Deixar outro colega falar', effects: { stats: { happiness: 1 } }, resultText: '{colega} apresentou e o grupo ficou entre os finalistas.' },
    ],
  },
  {
    id: 'em_mock_exam',
    conditions: { schoolStages: ['medio'] },
    weight: 6,
    text: 'Simulado do vestibular no sábado de manhã.',
    choices: [
      { id: 'take', label: 'Fazer o simulado a sério', effects: { stats: { intelligence: 2, happiness: -1 }, school: { average: 3 } }, resultText: 'Você ficou entre os dez melhores da escola.' },
      { id: 'sleep', label: 'Dormir até tarde', effects: { stats: { happiness: 2, health: 1 }, school: { average: -1 } }, resultText: 'Você acordou ao meio-dia, descansad{o/a} e sem culpa.' },
    ],
  },
  {
    id: 'em_tough_teacher',
    conditions: { schoolStages: ['medio'] },
    weight: 5,
    text: '{professor}, de física, reprova metade da turma todo ano e avisou que este ano não será diferente.',
    choices: [
      { id: 'study_group', label: 'Montar um grupo de estudos', effects: { stats: { intelligence: 2 }, school: { average: 4, popularity: 2 } }, resultText: 'O grupo virou referência e todo mundo passou em física.' },
      { id: 'tutor', label: 'Pedir aulas extras', effects: { stats: { intelligence: 2 }, school: { average: 5 }, money: -50 }, resultText: 'As aulas particulares custaram caro, mas física deixou de ser um bicho de sete cabeças.' },
      { id: 'give_up', label: 'Desistir da matéria', effects: { stats: { happiness: 1 }, school: { average: -5 } }, resultText: 'Você entregou os pontos em física.' },
    ],
  },
  {
    id: 'em_prom_invite',
    conditions: { schoolStages: ['medio'], minAge: 16 },
    weight: 5,
    once: true,
    text: 'O baile de formatura está chegando e {colega} pergunta se você quer ir em dupla.',
    choices: [
      { id: 'yes', label: 'Aceitar', effects: { stats: { happiness: 5 }, school: { popularity: 3 }, setFlags: { par_no_baile: true } }, resultText: 'Vocês combinaram a cor da roupa e tudo.' },
      { id: 'friends', label: 'Ir com a turma de amigos', effects: { stats: { happiness: 3 } }, resultText: 'Você vai ao baile com a galera de sempre.' },
    ],
  },
];
