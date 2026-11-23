import type { GameEvent } from '../../../engine';

/** Clubes esportivos e intercâmbio (release 0.0.1). */
export const CLUB_EXCHANGE_EVENTS: readonly GameEvent[] = [
  // ----- clube esportivo -----
  {
    id: 'club_state_championship',
    weight: 5,
    tone: 'good',
    conditions: { minAge: 8, sportsClub: {} },
    text: 'O clube vai disputar o campeonato estadual e o técnico chamou você para a equipe.',
    choices: [
      { id: 'go', label: 'Dar o melhor', resultText: 'Você voltou com uma medalha no peito!', effects: { stats: { athletic: 2, happiness: 5 } }, risk: { chance: 0.45, tone: 'bad', resultText: 'Não deu pódio dessa vez, mas a experiência valeu.', effects: { stats: { athletic: 1, happiness: 1 } } } },
      { id: 'bench', label: 'Ficar no banco e torcer', resultText: 'Você viu tudo de perto e aprendeu.', effects: { stats: { happiness: 1 } } },
    ],
  },
  {
    id: 'club_school_games',
    weight: 4,
    tone: 'good',
    conditions: { minAge: 10, maxAge: 17, sportsClub: {}, enrolled: true },
    text: 'Os jogos escolares começaram e a escola quer você no time, já que você treina no clube.',
    choices: [
      { id: 'play', label: 'Jogar pela escola', resultText: 'A escola inteira gritou o seu nome na final.', effects: { stats: { happiness: 4 }, school: { popularity: 6 } } },
      { id: 'no', label: 'Deixar para os outros', resultText: 'Você assistiu da arquibancada.' },
    ],
  },
  {
    id: 'club_new_friend',
    weight: 4,
    tone: 'good',
    conditions: { minAge: 6, sportsClub: {} },
    text: 'Depois do treino no clube, um pessoal da equipe chamou você para tomar um açaí.',
    choices: [
      { id: 'yes', label: 'Ir junto', resultText: 'Você ganhou uma amizade do clube.', effects: { stats: { happiness: 3 }, social: { meet: { context: 'school' } } } },
      { id: 'no', label: 'Ir para casa', resultText: 'Você preferiu descansar.' },
    ],
  },
  // ----- intercâmbio -----
  {
    id: 'exchange_adaptation',
    weight: 6,
    tone: 'bad',
    conditions: { exchange: {} },
    text: 'Comida diferente, idioma que você mal entende e um fuso horário que embaralhou seu sono.',
    choices: [
      { id: 'push', label: 'Se jogar na cultura local', resultText: 'Em um mês você já pedia comida sem apontar o cardápio.', effects: { stats: { intelligence: 2, happiness: 2 } } },
      { id: 'hide', label: 'Ficar no quarto vendo vídeo do Brasil', resultText: 'Foi mais difícil se adaptar.', effects: { stats: { happiness: -3 } } },
    ],
  },
  {
    id: 'exchange_homesick',
    weight: 5,
    tone: 'bad',
    conditions: { exchange: {} },
    text: 'Bateu uma saudade forte de casa, da família e da comida da sua mãe.',
    choices: [
      { id: 'call', label: 'Ligar para a família', resultText: 'Uma hora de chamada de vídeo resolveu metade do problema.', effects: { stats: { happiness: 2 }, social: { parentsAffection: 4 } } },
      { id: 'train', label: 'Descontar no treino', resultText: 'A saudade virou suor.', effects: { stats: { athletic: 1, happiness: -1 } } },
    ],
  },
  {
    id: 'exchange_foreign_friend',
    weight: 5,
    tone: 'good',
    conditions: { exchange: {} },
    text: 'Um colega de treino de outro país te convidou para conhecer a cidade no fim de semana.',
    choices: [
      { id: 'go', label: 'Topar o passeio', resultText: 'Vocês viraram amigos para a vida — e você aprendeu umas palavras novas.', effects: { stats: { happiness: 4, intelligence: 1 }, social: { meet: { context: 'gym' } } } },
      { id: 'rest', label: 'Descansar para o treino', resultText: 'Seu corpo agradeceu.', effects: { stats: { health: 1 } } },
    ],
  },
  {
    id: 'exchange_injury',
    weight: 3,
    tone: 'bad',
    conditions: { exchange: {} },
    text: 'O ritmo de treino no exterior é brutal. Numa sessão puxada, alguma coisa estalou.',
    choices: [
      { id: 'treat', label: 'Parar e tratar', resultText: 'Você perdeu umas semanas, mas se recuperou direito.', effects: { health: { injury: 'random' }, stats: { happiness: -2 } } },
      { id: 'ignore', label: 'Treinar machucado', resultText: 'Você aguentou firme.', effects: { stats: { athletic: 1 } }, risk: { chance: 0.5, resultText: 'Piorou: agora é uma lesão de verdade.', effects: { health: { injury: 'random' }, stats: { happiness: -4 } } } },
    ],
  },
  {
    id: 'exchange_local_fight',
    weight: 4,
    tone: 'good',
    conditions: { exchange: {}, minAge: 16 },
    text: 'O dono da academia te inscreveu numa luta local. Estrangeiro na casa do adversário.',
    choices: [
      { id: 'fight', label: 'Lutar', resultText: 'Você venceu e o ginásio inteiro aplaudiu o brasileiro.', effects: { fighter: { reputation: 3, skills: { trocacao: 1, grappling: 1 } }, stats: { happiness: 5 } }, risk: { chance: 0.45, tone: 'bad', resultText: 'Derrota apertada, mas você ganhou respeito.', effects: { fighter: { reputation: 1 }, stats: { happiness: -1 } } } },
      { id: 'watch', label: 'Só assistir desta vez', resultText: 'Você estudou cada lance da noite.', effects: { fighter: { skills: { trocacao: 0.5, grappling: 0.5 } } } },
    ],
  },
];
