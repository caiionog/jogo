import type { GameEvent } from '../../../engine';

/** Base da carreira: primeira academia, torneios kids, faixas, amador, olheiro. */
export const FIGHT_BASE_EVENTS: readonly GameEvent[] = [
  {
    id: 'fight_first_class',
    conditions: { minAge: 5, maxAge: 14, flagsAll: ['gostaDeLuta'], fighting: { hasGym: false } },
    weight: 9,
    once: true,
    text: 'Seus pais viram o quanto você gosta de luta e perguntaram se você quer fazer uma aula experimental numa academia do bairro.',
    choices: [
      { id: 'go', label: 'Quero muito!', effects: { stats: { happiness: 4 }, fighter: { joinGym: 'local', skills: { grappling: 1.1 } } }, resultText: 'Você amarrou a faixa branca pela primeira vez e saiu da aula sorrindo.' },
      { id: 'later', label: 'Agora não', effects: {}, resultText: 'Você preferiu deixar para depois.' },
    ],
  },
  {
    id: 'fight_kids_nerves',
    conditions: { minAge: 6, maxAge: 14, fighting: { hasGym: true, hasFought: false } },
    weight: 6,
    once: true,
    text: 'O professor quer inscrever você no seu primeiro campeonato infantil. Sua barriga gela só de pensar.',
    choices: [
      { id: 'brave', label: 'Encarar o frio na barriga', effects: { stats: { happiness: 2 }, fighter: { reputation: 2, skills: { trocacao: 1 } } }, resultText: 'Você decidiu competir. A emoção é parte do esporte.' },
      { id: 'train_more', label: 'Treinar mais antes de competir', effects: { fighter: { skills: { grappling: 1.1 } } }, resultText: 'Você pediu mais um tempo para se preparar.' },
    ],
  },
  {
    id: 'fight_sparring_desafio',
    weight: 4,
    cooldownYears: 3,
    conditions: { minAge: 14, fighting: { hasGym: true } },
    text: 'O professor junta todo mundo: "Sparring valendo a vaga no próximo campeonato. Quem se habilita?"',
    choices: [
      { id: 'encarar', label: 'Entrar no sparring', resultText: 'Você calçou as luvas e foi para o centro do tatame.', effects: { minigame: { kind: 'mma', context: 'jogo' } } },
      { id: 'assistir', label: 'Assistir e aprender', resultText: 'Você anotou cada detalhe.', effects: { fighter: { skills: { trocacao: 0.5 } } } },
    ],
  },
  {
    id: 'fight_belt_exam',
    trigger: 'auto',
    cooldownYears: 2,
    conditions: { fighting: { gradeReady: 'jiujitsu' } },
    weight: 1,
    text: 'Seu professor de jiu-jitsu marcou seu exame de faixa. Toda a academia vai assistir.',
    choices: [
      { id: 'exam', label: 'Fazer o exame', effects: { stats: { happiness: 6 }, fighter: { promoteGrade: 'jiujitsu' } }, resultText: 'Depois de muito suor e de passar pelo corredor de faixas, você foi graduad{o/a}!' },
      { id: 'wait', label: 'Pedir mais um tempo', effects: { fighter: { skills: { grappling: 1 } } }, resultText: 'Você preferiu se sentir mais preparad{o/a} antes de trocar de faixa.' },
    ],
  },
  {
    id: 'fight_judo_exam',
    trigger: 'auto',
    cooldownYears: 2,
    conditions: { fighting: { gradeReady: 'judo' } },
    weight: 1,
    text: 'O sensei chamou você para o exame de faixa do judô: quedas, rolamentos e os nomes dos golpes em japonês.',
    choices: [
      { id: 'exam', label: 'Fazer o exame', effects: { stats: { happiness: 5 }, fighter: { promoteGrade: 'judo' } }, resultText: 'Você fez a saudação, projetou o parceiro limpo e saiu com a faixa nova na cintura.' },
      { id: 'wait', label: 'Esperar o próximo exame', effects: { fighter: { skills: { grappling: 1 } } }, resultText: 'Você preferiu treinar mais um pouco antes do exame.' },
    ],
  },
  {
    id: 'fight_muaythai_exam',
    trigger: 'auto',
    cooldownYears: 2,
    conditions: { fighting: { gradeReady: 'muaythai' } },
    weight: 1,
    text: 'Dia de graduação no muay thai: o kru vai avaliar sua base, os chutes e o wai kru.',
    choices: [
      { id: 'exam', label: 'Fazer a graduação', effects: { stats: { happiness: 5 }, fighter: { promoteGrade: 'muaythai' } }, resultText: 'O kru amarrou o prajied novo no seu braço. A academia inteira aplaudiu.' },
      { id: 'wait', label: 'Pedir mais um tempo', effects: { fighter: { skills: { trocacao: 1 } } }, resultText: 'Você preferiu lapidar a técnica antes de trocar de prajied.' },
    ],
  },
  {
    id: 'fight_amateur_debut',
    conditions: { minAge: 15, maxAge: 22, fighting: { hasGym: true, amateurWins: { max: 0 }, contracted: false } },
    weight: 7,
    once: true,
    text: 'Seu treinador acha que você está pront{o/a} para o MMA amador no Circuito Amador Punho de Ferro.',
    choices: [
      { id: 'yes', label: 'Bora estrear!', effects: { stats: { happiness: 3 }, fighter: { reputation: 2, skills: { athletic: 2 } } }, resultText: 'Você começou um camp de verdade, com dieta e sparring.' },
      { id: 'no', label: 'Ainda não me sinto pront{o/a}', effects: { fighter: { skills: { trocacao: 1 } } }, resultText: 'Você decidiu treinar mais um ano antes de estrear.' },
    ],
  },
  {
    id: 'fight_street_brawl',
    tags: ['briga'],
    tone: 'bad',
    conditions: { minAge: 15, maxAge: 26, flagsAll: ['brigou_na_escola'] },
    weight: 4,
    once: true,
    text: 'Numa festa, um rapaz provoca você e chama para a briga do lado de fora. Alguém já está filmando.',
    choices: [
      {
        id: 'fight',
        label: 'Aceitar a briga',
        effects: { stats: { happiness: 2 }, fighter: { reputation: 3 } },
        resultText: 'Você resolveu em segundos. O vídeo rodou, mas seu treinador ficou furioso.',
        risk: { chance: 0.35, effects: { stats: { happiness: -4 }, money: -500, fighter: { reputation: -6 } }, resultText: 'A polícia apareceu. Você pagou fiança e virou piada nas redes.' },
      },
      { id: 'leave', label: 'Ir embora', effects: { stats: { happiness: -1 }, fighter: { skills: { trocacao: 1 } } }, resultText: 'Lutador de verdade luta no octógono. Você foi para casa.' },
    ],
  },
  {
    id: 'fight_bjj_open',
    conditions: { minAge: 15, fighting: { hasGym: true, injured: false, suspended: false } },
    weight: 5,
    text: 'A Copa Tatame Aberto abriu inscrições extras com premiação dobrada para a sua faixa.',
    choices: [
      { id: 'enter', label: 'Me inscrever', effects: { fighter: { offer: { kind: 'bjjOpen' } } }, resultText: 'Inscrição feita! A luta está na sua lista de ofertas.' },
      { id: 'skip', label: 'Focar no MMA', effects: {}, resultText: 'Você deixou o campeonato de jiu-jitsu para outra hora.' },
    ],
  },
  {
    id: 'fight_gym_switch',
    conditions: { minAge: 14, fighting: { hasGym: true, reputation: { min: 10 } } },
    weight: 4,
    once: true,
    text: 'O dono de uma academia de ponta viu suas lutas e convidou você para treinar com a equipe dele.',
    choices: [
      { id: 'switch', label: 'Trocar de academia', effects: { stats: { happiness: 2 }, fighter: { joinGym: 'best' } }, resultText: 'Nova equipe, novos parceiros de treino.' },
      { id: 'loyal', label: 'Ficar com quem me ensinou tudo', effects: { stats: { happiness: 3 }, fighter: { skills: { trocacao: 1 } } }, resultText: 'Seu professor se emocionou com a sua lealdade.' },
    ],
  },
  {
    id: 'fight_coach_advice',
    conditions: { minAge: 10, fighting: { hasGym: true } },
    weight: 5,
    text: 'Depois do treino, {professor} chama você num canto: "Você precisa escolher no que vai ficar realmente bom."',
    choices: [
      { id: 'trocacao', label: 'Mãos pesadas (trocação)', effects: { fighter: { skills: { trocacao: 3 } } }, resultText: 'Você passou meses batendo manopla até a mão doer.' },
      { id: 'fisico', label: 'Preparação física', effects: { stats: { athletic: 3 } }, resultText: 'Tiro, escada, corda: o fôlego nunca esteve tão bom.' },
      { id: 'jiujitsu', label: 'Quedas e finalizações (jiu-jitsu)', effects: { fighter: { skills: { grappling: 3 } } }, resultText: 'Você estudou cada detalhe da queda ao mata-leão.' },
    ],
  },
  {
    id: 'fight_scout',
    conditions: { minAge: 16, maxAge: 26, fighting: { amateurWins: { min: 2 }, contracted: false } },
    weight: 6,
    once: true,
    text: 'Um olheiro das ligas regionais estava na plateia da sua última luta e quer ver você treinar.',
    choices: [
      { id: 'show', label: 'Mostrar serviço no treino', effects: { fighter: { reputation: 8 } }, resultText: 'O olheiro anotou seu nome e prometeu falar de você para os promotores.' },
      { id: 'shy', label: 'Treinar normalmente, sem pressão', effects: { fighter: { reputation: 3 } }, resultText: 'Ele gostou do que viu, mas sem muito alarde.' },
    ],
  },
  {
    id: 'fight_kids_medal',
    conditions: { minAge: 6, maxAge: 14, enrolled: true, fighting: { hasFought: true } },
    weight: 4,
    once: true,
    text: 'Você levou sua medalha de campeonato para a escola e a turma toda quis ver.',
    choices: [
      { id: 'show', label: 'Mostrar com orgulho', effects: { stats: { happiness: 4 }, school: { popularity: 5 } }, resultText: 'Virou a estrela da sala: todo mundo quer aprender um golpe com você.' },
      { id: 'humble', label: 'Guardar na mochila', effects: { stats: { happiness: 1 }, school: { discipline: 2 } }, resultText: 'Você preferiu não chamar atenção.' },
    ],
  },
];
