import type { ActionDef } from '../engine';

export const ACTIONS: readonly ActionDef[] = [
  {
    id: 'train',
    label: 'Treinar',
    emoji: '🥊',
    description: 'Exercícios, corrida e brincadeiras de luta. Força e condicionamento.',
    energyCost: 2,
    minAge: 3,
    effects: { stats: { strength: 1, fitness: 2, health: 1, happiness: -1 } },
    variance: 1,
    logTexts: [
      'Você treinou até ficar sem fôlego.',
      'Você passou a tarde correndo e fazendo flexões.',
      'Você treinou socos num travesseiro velho.',
    ],
  },
  {
    id: 'study',
    label: 'Estudar',
    emoji: '📚',
    description: 'Livros, lição de casa e curiosidade. Inteligência.',
    energyCost: 2,
    minAge: 4,
    effects: { stats: { intelligence: 2, happiness: -1 } },
    variance: 1,
    logTexts: [
      'Você passou horas lendo livros.',
      'Você fez todas as lições de casa com capricho.',
      'Você estudou com dedicação.',
    ],
  },
  {
    id: 'socialize',
    label: 'Brincar / Socializar',
    emoji: '🎈',
    description: 'Brincar com amigos e se divertir. Felicidade.',
    energyCost: 1,
    minAge: 3,
    effects: { stats: { happiness: 3, fitness: 1 } },
    variance: 2,
    logTexts: [
      'Você brincou com os amigos da rua.',
      'Você passou a tarde jogando bola com a turma.',
      'Você se divertiu muito brincando de pega-pega.',
    ],
  },
];
