import type { GameEvent } from '../../../engine';

/** Faculdade (release 0.0.1): exame nacional, atlética, jogos universitários, estágio e Exame da Ordem. */
export const COLLEGE_EVENTS: readonly GameEvent[] = [
  {
    id: 'enu_exam',
    trigger: 'auto',
    once: true,
    conditions: { minAge: 17, enrolled: true, schoolStages: ['medio'] },
    weight: 1,
    text: 'Chegou o dia do Exame Nacional Unificado (ENU). A nota decide em qual faculdade e curso você pode entrar.',
    choices: [
      { id: 'take', label: 'Fazer a prova', resultText: 'Você entregou a prova no último minuto.', effects: { college: { exam: true } } },
      { id: 'skip', label: 'Não fazer este ano', resultText: 'Você decidiu não fazer a prova agora. Dá para fazer depois, em Ocupação → Estudos.' },
    ],
  },
  {
    id: 'college_games',
    weight: 5,
    tone: 'good',
    conditions: { college: { enrolled: true } },
    text: 'A atlética do seu curso te chamou para os jogos universitários.',
    choices: [
      { id: 'play', label: 'Jogar pela atlética', resultText: 'Você suou a camisa e voltou com uma medalha e amigos novos.', effects: { stats: { athletic: 2, happiness: 4 }, social: { meet: { context: 'school' } } } },
      { id: 'cheer', label: 'Só torcer na arquibancada', resultText: 'Você perdeu a voz de tanto gritar.', effects: { stats: { happiness: 3 } } },
    ],
  },
  {
    id: 'college_fight_team',
    weight: 4,
    tone: 'good',
    conditions: { college: { enrolled: true }, fighting: { hasGym: true } },
    text: 'A faculdade tem um time de luta e o técnico soube que você treina. Querem você no campeonato universitário.',
    choices: [
      { id: 'join', label: 'Entrar no time', resultText: 'Você representou a faculdade no tatame.', effects: { fighter: { skills: { grappling: 1.5 }, reputation: 1, offer: { kind: 'bjjOpen' } }, stats: { happiness: 3 } } },
      { id: 'no', label: 'Focar nos estudos', resultText: 'Você agradeceu e voltou para a biblioteca.', effects: { stats: { intelligence: 1 } } },
    ],
  },
  {
    id: 'college_hard_exam',
    weight: 6,
    tone: 'bad',
    conditions: { college: { enrolled: true } },
    text: 'A prova mais difícil do semestre é amanhã e você mal abriu o caderno.',
    choices: [
      { id: 'cram', label: 'Virar a noite estudando', resultText: 'Você foi bem, mas dormiu em pé no dia seguinte.', effects: { stats: { intelligence: 1, health: -1 } } },
      { id: 'cheat', label: 'Levar uma cola', resultText: 'Ninguém percebeu.', effects: { stats: { happiness: 1 } }, risk: { chance: 0.3, resultText: 'O professor pegou a cola. Zero na prova e uma advertência.', effects: { stats: { happiness: -6 } } } },
      { id: 'pray', label: 'Ir no improviso', resultText: 'Foi raspando.', effects: { stats: { happiness: -1 } } },
    ],
  },
  {
    id: 'college_internship',
    weight: 4,
    tone: 'good',
    conditions: { college: { enrolled: true }, minAge: 19 },
    text: 'Um professor indicou você para um estágio de férias na área do curso.',
    choices: [
      { id: 'yes', label: 'Aceitar o estágio', resultText: 'Você aprendeu mais em três meses do que em um ano de aula.', effects: { stats: { intelligence: 2 }, money: 2500 } },
      { id: 'no', label: 'Aproveitar as férias', resultText: 'Você descansou de verdade.', effects: { stats: { happiness: 3 } } },
    ],
  },
  {
    id: 'oab_exam',
    trigger: 'auto',
    conditions: { minAge: 22, college: { diploma: ['direito'] }, flagsNone: ['oab'] },
    weight: 1,
    text: 'As inscrições do Exame da Ordem (fictício) abriram. Sem ele, você não pode advogar.',
    choices: [
      {
        id: 'take',
        label: 'Fazer o exame',
        resultText: 'Aprovad{o/a}! Você já pode advogar.',
        effects: { setFlags: { oab: true }, stats: { happiness: 6 } },
        risk: { chance: 0.45, resultText: 'Reprovad{o/a} por poucos pontos. Dá para tentar de novo no ano que vem.', effects: { stats: { happiness: -4 } } },
      },
      { id: 'later', label: 'Deixar para o ano que vem', resultText: 'Você vai estudar mais antes.' },
    ],
  },
];
