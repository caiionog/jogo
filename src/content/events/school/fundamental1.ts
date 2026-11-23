import type { GameEvent } from '../../../engine';

/** Fundamental I (1º ao 5º ano, 6–10 anos). */
export const FUNDAMENTAL1_EVENTS: readonly GameEvent[] = [
  {
    id: 'f1_bullying',
    tags: ['briga'],
    tone: 'bad',
    conditions: { schoolStages: ['fund1'] },
    weight: 8,
    once: true,
    text: '{colega}, um aluno mais velho, vive implicando com você, puxando sua mochila e rindo do seu lanche.',
    choices: [
      {
        id: 'fight',
        label: 'Revidar na hora',
        effects: { stats: { happiness: 3, athletic: 1 }, school: { discipline: -8 }, setFlags: { brigou_na_escola: true }, followUps: [{ eventId: 'f1_bully_returns', delayYears: 1 }] },
        resultText: 'Você partiu para cima e {colega} nunca esperou por isso. A diretoria só deu uma advertência.',
        risk: {
          chance: 0.4,
          effects: { stats: { health: -4 }, school: { suspend: true }, setFlags: { brigou_na_escola: true }, followUps: [{ eventId: 'f1_bully_returns', delayYears: 1 }] },
          resultText: 'A briga foi feia: os dois foram suspensos e você ficou com um galo na testa.',
        },
      },
      {
        id: 'teacher',
        label: 'Contar para a professora',
        effects: { school: { discipline: 2, popularity: -2 }, followUps: [{ eventId: 'f1_bully_returns', delayYears: 1 }] },
        resultText: '{professor} conversou com os pais de {colega}. As provocações diminuíram.',
      },
      { id: 'ignore', label: 'Ignorar', effects: { stats: { happiness: -4 } }, resultText: 'Você engoliu a raiva. Foi um ano difícil.' },
    ],
  },
  {
    id: 'f1_bully_returns',
    trigger: 'followUp',
    conditions: { enrolled: true },
    weight: 1,
    text: 'Um ano depois, {colega} — aquele que implicava com você — aparece de novo no recreio.',
    choices: [
      { id: 'face', label: 'Encarar de frente', effects: { stats: { happiness: 4 }, school: { popularity: 4 }, setFlags: { corajoso: true } }, resultText: '{colega} desviou o olhar e pediu desculpas. Você ganhou respeito na escola.' },
      { id: 'friend', label: 'Puxar conversa', effects: { stats: { happiness: 3 }, school: { popularity: 2 } }, resultText: 'Vocês descobriram que torcem pelo mesmo time e viraram colegas.' },
    ],
  },
  {
    id: 'f1_strict_teacher',
    conditions: { schoolStages: ['fund1', 'fund2'] },
    weight: 6,
    text: '{professor} é conhecid{o/a} como o terror da escola: lição todo dia e prova surpresa toda semana.',
    choices: [
      { id: 'dedicate', label: 'Se dedicar ao máximo', effects: { stats: { intelligence: 2, happiness: -2 }, school: { average: 6 } }, resultText: 'Foi puxado, mas você nunca aprendeu tanto.' },
      { id: 'complain', label: 'Reclamar em casa', effects: { stats: { happiness: 1 }, school: { average: -2 } }, resultText: 'Seus pais disseram que é bom para você. Sua nota caiu um pouco.' },
      { id: 'joke', label: 'Fazer piada na aula', effects: { stats: { happiness: 2 }, school: { discipline: -6, popularity: 3 } }, resultText: 'A turma riu muito. {professor} não achou graça e anotou seu nome.' },
    ],
  },
  {
    id: 'f1_reading_contest',
    conditions: { schoolStages: ['fund1'] },
    weight: 5,
    text: 'A escola lançou um concurso de leitura: quem ler mais livros no semestre ganha um prêmio.',
    choices: [
      { id: 'join', label: 'Participar para valer', effects: { stats: { intelligence: 3 }, school: { average: 3 } }, resultText: 'Você leu doze livros e ficou em segundo lugar.' },
      { id: 'skip', label: 'Livros? Prefiro brincar', effects: { stats: { happiness: 2 } }, resultText: 'Você passou o semestre brincando no pátio.' },
    ],
  },
  {
    id: 'f1_judo_invite',
    conditions: { schoolStages: ['fund1', 'fund2'], club: 'none' },
    weight: 6,
    once: true,
    text: 'O sensei do time de judô da escola viu você brincando de luta no pátio e chamou para um treino.',
    choices: [
      {
        id: 'join',
        label: 'Topar entrar no time',
        effects: { stats: { happiness: 2 }, school: { joinClub: 'judo' }, followUps: [{ eventId: 'school_interschool_champ', delayYears: 1 }] },
        resultText: 'Você vestiu o quimono pela primeira vez e se sentiu em casa.',
      },
      { id: 'later', label: 'Talvez outro dia', effects: {}, resultText: 'Você agradeceu, mas não foi ao treino.' },
    ],
  },
  {
    id: 'f1_field_trip',
    conditions: { schoolStages: ['fund1'] },
    weight: 5,
    text: 'A turma vai fazer uma excursão ao museu de ciências.',
    choices: [
      { id: 'learn', label: 'Prestar atenção em tudo', effects: { stats: { intelligence: 2, happiness: 2 } }, resultText: 'Você voltou falando de dinossauros a semana inteira.' },
      { id: 'mess', label: 'Fazer bagunça no ônibus', effects: { stats: { happiness: 3 }, school: { discipline: -5, popularity: 2 } }, resultText: 'Foi divertido até {professor} mandar um bilhete para seus pais.' },
    ],
  },
];
