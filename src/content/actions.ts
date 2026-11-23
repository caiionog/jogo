import type { ActionDef } from '../engine';

export const ACTIONS: readonly ActionDef[] = [
  // ----- Vida -----
  {
    id: 'study',
    label: 'Estudar',
    emoji: '📚',
    description: 'Livros, lição de casa e curiosidade. Inteligência (e um pouco de nota, se estiver na escola).',
    category: 'vida',
    minAge: 4,
    // `school` só tem efeito quando matriculado — mesma lógica de "Estudar para as provas".
    effects: { stats: { intelligence: 2, happiness: -1 }, school: { average: 2 } },
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
    category: 'vida',
    minAge: 3,
    effects: { stats: { happiness: 3, athletic: 1 } },
    variance: 2,
    logTexts: [
      'Você brincou com os amigos da rua.',
      'Você passou a tarde jogando bola com a turma.',
      'Você se divertiu muito brincando de pega-pega.',
    ],
  },

  // ----- Lazer (Etapa 8) -----
  {
    id: 'go_out',
    label: 'Sair com os amigos',
    emoji: '🍕',
    description: 'Pizza, praça, conversa jogada fora. Felicidade.',
    category: 'vida',
    minAge: 13,
    effects: { stats: { happiness: 4 } },
    variance: 2,
    logTexts: ['Você saiu com os amigos e voltou rindo.', 'Rodízio de pizza com a turma.', 'Uma tarde na praça com os amigos.'],
  },
  {
    id: 'party',
    label: 'Ir a uma festa',
    emoji: '🎉',
    description: 'Música alta e gente nova. Pode render ressaca.',
    category: 'vida',
    minAge: 16,
    effects: { stats: { happiness: 6, health: -1 } },
    variance: 3,
    logTexts: ['Você dançou até de madrugada.', 'Festa boa, dia seguinte difícil.'],
  },
  {
    id: 'travel',
    label: 'Viajar',
    emoji: '🧳',
    description: 'Uns dias longe da rotina. Custa dinheiro, renova a cabeça.',
    category: 'vida',
    minAge: 18,
    effects: { stats: { happiness: 9, health: 1 }, money: -1800 },
    variance: 2,
    logTexts: ['Você viajou para o litoral e voltou renovado(a).', 'Uma semana na serra, longe de tudo.', 'Você conheceu outra capital do Brasil.'],
  },

  // ----- Escola -----
  {
    id: 'study_exams',
    label: 'Estudar para as provas',
    emoji: '📝',
    description: 'Revisar a matéria e fazer exercícios. Nota e inteligência.',
    category: 'escola',
    minAge: 6,
    requires: { enrolled: true, schoolStages: ['fund1', 'fund2', 'medio'] },
    effects: { stats: { intelligence: 1, happiness: -2 }, school: { average: 5 } },
    variance: 1,
    logTexts: [
      'Você revisou toda a matéria antes das provas.',
      'Você fez uma pilha de exercícios para a prova.',
      'Você montou resumos coloridos e estudou para as provas.',
    ],
  },
  {
    id: 'skip_class',
    label: 'Matar aula',
    emoji: '🏃',
    description: 'Diversão garantida, mas a nota e a disciplina sofrem. Pode dar problema.',
    category: 'escola',
    minAge: 8,
    requires: { enrolled: true, schoolStages: ['fund1', 'fund2', 'medio'] },
    effects: { stats: { happiness: 4 }, school: { average: -3, discipline: -6, absences: 4 } },
    logTexts: [
      'Você matou aula para ir à praça com uns colegas.',
      'Você pulou o muro da escola e passou a tarde no fliperama.',
      'Você matou aula e ficou vendo vídeos de luta no celular.',
    ],
    risk: {
      chance: 0.3,
      logText: 'Alguém viu você fora da escola...',
      effects: { followUps: [{ eventId: 'school_skip_caught', delayYears: 0 }] },
    },
  },
  {
    id: 'make_friends',
    label: 'Fazer amizade',
    emoji: '🤝',
    description: 'Conversar e se enturmar com os colegas. Popularidade.',
    category: 'escola',
    minAge: 3,
    requires: { enrolled: true },
    // pode render uma amizade de verdade (pessoa na aba Relações)
    effects: { stats: { happiness: 2 }, school: { popularity: 4 }, social: { meet: { context: 'school', chance: 0.45 } } },
    variance: 1,
    logTexts: [
      'Você puxou papo com colegas novos no intervalo.',
      'Você dividiu o lanche e fez novos amigos.',
      'Você se enturmou com a galera da sala.',
    ],
  },
];
