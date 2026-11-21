import type { GameEvent } from '../../../engine';

/** Fundamental II (6º ao 9º ano, 11–14 anos). */
export const FUNDAMENTAL2_EVENTS: readonly GameEvent[] = [
  {
    id: 'f2_cheating',
    conditions: { schoolStages: ['fund2', 'medio'] },
    weight: 7,
    text: 'Dia de prova difícil. {colega} oferece a cola com as respostas.',
    choices: [
      {
        id: 'cheat',
        label: 'Aceitar a cola',
        effects: { school: { average: 6 } },
        resultText: 'Ninguém percebeu e você tirou uma nota ótima.',
        risk: { chance: 0.35, effects: { school: { average: -8, suspend: true } }, resultText: '{professor} pegou a cola no seu estojo. Zero na prova e suspensão.' },
      },
      { id: 'refuse', label: 'Recusar e fazer sozinh{o/a}', effects: { stats: { intelligence: 1 }, school: { discipline: 2 } }, resultText: 'Você fez a prova com o que sabia e ficou de consciência tranquila.' },
      { id: 'report', label: 'Avisar o professor', effects: { school: { discipline: 3, popularity: -6 } }, resultText: '{colega} levou zero e a turma inteira passou a te chamar de dedo-duro.' },
    ],
  },
  {
    id: 'f2_group_work',
    conditions: { schoolStages: ['fund2', 'medio'] },
    weight: 6,
    text: 'Trabalho em grupo valendo nota. {colega} sumiu e ninguém do grupo faz nada.',
    choices: [
      { id: 'carry', label: 'Fazer o trabalho sozinh{o/a}', effects: { stats: { happiness: -3, intelligence: 1 }, school: { average: 4 } }, resultText: 'Você virou a noite, mas o trabalho ficou excelente.' },
      { id: 'rally', label: 'Organizar o grupo', effects: { stats: { happiness: 1 }, school: { average: 3, popularity: 3 } }, resultText: 'Você dividiu as tarefas e todo mundo colaborou.' },
      { id: 'tell', label: 'Contar ao professor quem não fez nada', effects: { school: { average: 2, popularity: -3 } }, resultText: '{professor} deu nota separada para cada um.' },
    ],
  },
  {
    id: 'f2_math_olympiad',
    conditions: { schoolStages: ['fund2', 'medio'], school: { average: { min: 70 } } },
    weight: 5,
    once: true,
    text: '{professor} indicou você para a Olimpíada Regional de Matemática.',
    choices: [
      {
        id: 'train',
        label: 'Treinar com provas antigas',
        effects: { stats: { intelligence: 3, happiness: -1 }, setFlags: { olimpiada: true }, followUps: [{ eventId: 'f2_olympiad_final', delayYears: 1 }] },
        resultText: 'Você passou para a fase final, que acontece no ano que vem!',
        risk: { chance: 0.4, effects: { stats: { intelligence: 2 } }, resultText: 'Você foi bem, mas não passou de fase. Experiência valiosa.' },
      },
      { id: 'decline', label: 'Não quero essa pressão', effects: { stats: { happiness: 1 } }, resultText: 'Você agradeceu e recusou a indicação.' },
    ],
  },
  {
    id: 'f2_olympiad_final',
    trigger: 'followUp',
    conditions: { enrolled: true },
    weight: 1,
    text: 'Chegou a fase final da Olimpíada Regional de Matemática, com {professor} torcendo por você.',
    choices: [
      {
        id: 'focus',
        label: 'Manter a calma e resolver tudo',
        effects: { stats: { happiness: 8, intelligence: 2 }, school: { popularity: 4 }, setFlags: { medalha_olimpiada: true } },
        resultText: 'Medalha de prata! Seu nome saiu no jornal da cidade.',
        risk: { chance: 0.5, effects: { stats: { happiness: -2, intelligence: 1 } }, resultText: 'O nervosismo bateu e você ficou sem medalha.' },
      },
      { id: 'guess', label: 'Chutar as difíceis e sair cedo', effects: { stats: { happiness: 1 } }, resultText: 'Você terminou rápido e ficou no meio da tabela.' },
    ],
  },
  {
    id: 'f2_crush',
    conditions: { schoolStages: ['fund2', 'medio'] },
    weight: 6,
    once: true,
    text: 'Você não consegue parar de pensar em {colega}, da sua sala. Seu coração dispara toda vez que se cruzam no corredor.',
    choices: [
      { id: 'note', label: 'Mandar um bilhete', effects: { stats: { happiness: 3 }, setFlags: { primeira_paixonite: true }, followUps: [{ eventId: 'f2_crush_followup', delayYears: 1 }] }, resultText: 'Você deixou o bilhete na mochila e saiu correndo. Agora é esperar.' },
      { id: 'secret', label: 'Guardar segredo', effects: { stats: { happiness: -1 }, setFlags: { primeira_paixonite: true } }, resultText: 'Ninguém vai saber. Só o seu diário.' },
    ],
  },
  {
    id: 'f2_crush_followup',
    trigger: 'followUp',
    conditions: { minAge: 11 },
    weight: 1,
    text: 'Um ano depois do bilhete, {colega} finalmente vem falar com você no intervalo.',
    choices: [
      { id: 'talk', label: 'Conversar sem gaguejar', effects: { stats: { happiness: 6 }, school: { popularity: 2 } }, resultText: 'Vocês riram juntos e trocaram contato. Fica a lembrança da primeira paixonite.' },
      { id: 'run', label: 'Fugir de vergonha', effects: { stats: { happiness: -3 } }, resultText: 'Você ficou vermelh{o/a} e saiu andando. Fica para a próxima.' },
    ],
  },
  {
    id: 'f2_wrestling_invite',
    conditions: { schoolStages: ['fund2', 'medio'], stats: { strength: { min: 25 } } },
    weight: 5,
    once: true,
    text: 'O técnico da equipe de luta olímpica viu você na aula de educação física e quer você no time.',
    choices: [
      {
        id: 'join',
        label: 'Entrar na equipe',
        effects: { school: { joinClub: 'wrestling' }, followUps: [{ eventId: 'school_interschool_champ', delayYears: 1 }] },
        resultText: 'Você começou a treinar quedas e controle no tatame.',
      },
      { id: 'no', label: 'Recusar', effects: {}, resultText: 'Você preferiu manter sua rotina.' },
    ],
  },
  {
    id: 'f2_bullying',
    conditions: { schoolStages: ['fund2', 'medio'] },
    weight: 7,
    once: true,
    text: '{colega} e a turminha começaram a espalhar apelidos sobre você e a filmar suas reações.',
    choices: [
      {
        id: 'fight',
        label: 'Revidar no braço',
        effects: { stats: { happiness: 2 }, school: { suspend: true, popularity: 3 }, setFlags: { brigou_na_escola: true }, followUps: [{ eventId: 'f2_bully_aftermath', delayYears: 1 }] },
        resultText: 'Você acertou {colega} no meio do pátio. O vídeo rodou a escola e você foi suspens{o/a}.',
        risk: { chance: 0.35, effects: { stats: { health: -6, happiness: -4 }, school: { suspend: true }, setFlags: { brigou_na_escola: true } }, resultText: 'Eram três contra um. Você apanhou e ainda foi suspens{o/a}.' },
      },
      { id: 'teacher', label: 'Levar o caso à coordenação', effects: { school: { discipline: 2 }, followUps: [{ eventId: 'f2_bully_aftermath', delayYears: 1 }] }, resultText: 'A coordenação chamou os responsáveis e apagou os vídeos.' },
      { id: 'ignore', label: 'Ignorar', effects: { stats: { happiness: -5 }, school: { popularity: -3 } }, resultText: 'Os apelidos continuaram por meses.' },
    ],
  },
  {
    id: 'f2_bully_aftermath',
    trigger: 'followUp',
    conditions: { enrolled: true },
    weight: 1,
    text: 'No ano seguinte, {colega} — aquele dos apelidos — chega com cara séria para falar com você.',
    choices: [
      { id: 'listen', label: 'Ouvir o que tem a dizer', effects: { stats: { happiness: 4 } }, resultText: '{colega} pediu desculpas de verdade. Página virada.' },
      { id: 'walk', label: 'Dar as costas', effects: { stats: { happiness: 1 }, school: { popularity: 1 } }, resultText: 'Você não quis papo. Cada um seguiu seu caminho.' },
    ],
  },
  {
    id: 'f2_popular_group',
    conditions: { schoolStages: ['fund2', 'medio'], school: { popularity: { min: 55 } } },
    weight: 5,
    text: 'A turma mais popular da escola convidou você para sentar com eles no intervalo.',
    choices: [
      { id: 'join', label: 'Aceitar o convite', effects: { stats: { happiness: 3 }, school: { popularity: 6, average: -2 } }, resultText: 'Agora todo mundo sabe seu nome. As conversas são mais sobre festas do que sobre estudo.' },
      { id: 'stay', label: 'Ficar com os amigos de sempre', effects: { stats: { happiness: 2 }, school: { popularity: -1 } }, resultText: 'Seus amigos de sempre ficaram felizes com a sua lealdade.' },
    ],
  },
  {
    id: 'f2_classmate_party',
    conditions: { schoolStages: ['fund2', 'medio'] },
    weight: 6,
    text: '{colega} vai dar uma festa no sábado, mas é véspera de prova.',
    choices: [
      { id: 'go', label: 'Ir à festa', effects: { stats: { happiness: 5 }, school: { popularity: 4, average: -3 } }, resultText: 'A festa foi incrível. A prova, nem tanto.' },
      { id: 'study', label: 'Ficar estudando', effects: { stats: { happiness: -2 }, school: { average: 3 } }, resultText: 'Você ouviu as histórias da festa na segunda, mas mandou bem na prova.' },
      { id: 'both', label: 'Ir só um pouquinho', effects: { stats: { happiness: 2 }, school: { popularity: 2 } }, resultText: 'Você apareceu, dançou uma música e voltou cedo.' },
    ],
  },
];
