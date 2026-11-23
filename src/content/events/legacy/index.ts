import type { GameEvent } from '../../../engine';

/** Eventos de legado (Etapa 6): só aparecem a partir da 2ª geração. {antecessor} e {seu_pai} = quem você jogou antes. */
export const LEGACY_EVENTS: readonly GameEvent[] = [
  {
    id: 'legacy_debut',
    once: true,
    weight: 8,
    conditions: { minAge: 16, legacy: { generation: { min: 2 }, parentChampion: true }, fighting: { hasFought: true, proWins: { max: 1 } } },
    text: 'Manchete do site de lutas: "O herdeiro de {antecessor} estreia na liga". A arena está lotada para ver você.',
    choices: [
      { id: 'embrace', label: 'Entrar com o cinturão de {seu_pai} no ombro', effects: { fighter: { reputation: 6 }, stats: { happiness: 3 } }, resultText: 'A torcida foi à loucura.' },
      { id: 'own', label: 'Pedir que te chamem pelo seu próprio nome', effects: { fighter: { reputation: 2 }, stats: { happiness: 4 } }, resultText: 'Você quer escrever a sua própria história.' },
    ],
  },
  {
    id: 'legacy_comparison',
    weight: 4,
    conditions: { minAge: 14, maxAge: 35, legacy: { generation: { min: 2 } }, fighting: { hasFought: true } },
    text: 'Nos comentários de um vídeo seu, a torcida compara você a {antecessor}.',
    choices: [
      { id: 'proud', label: 'Ler com orgulho', effects: { stats: { happiness: 3 } }, resultText: '"Tem o mesmo jeito de andar no octógono", disse alguém.' },
      { id: 'pressure', label: 'Fechar o celular, irritado(a)', effects: { stats: { happiness: -2 }, fighter: { skills: { grappling: 1, trocacao: 1 } } }, resultText: 'A raiva virou treino extra.' },
    ],
  },
  {
    id: 'legacy_family_rival',
    once: true,
    weight: 3,
    conditions: { minAge: 18, maxAge: 38, legacy: { generation: { min: 2 } }, fighting: { hasFought: true, retired: false } },
    text: 'O filho de um antigo rival de {antecessor} provoca você nas redes: "Vou terminar o que meu pai começou."',
    choices: [
      { id: 'accept', label: 'Aceitar o desafio', effects: { fighter: { offer: { kind: 'rival' } }, stats: { happiness: 2 } }, resultText: 'A luta foi marcada. Rivalidade de família.' },
      { id: 'ignore', label: 'Ignorar', effects: { stats: { happiness: -1 } }, resultText: 'Ele continuou falando sozinho.' },
    ],
  },
  {
    id: 'legacy_gym_anniversary',
    weight: 4,
    conditions: { minAge: 18, legacy: { inheritedGym: true }, economy: { ownsBusiness: true } },
    text: 'A academia da família completa mais um aniversário. Na parede, a foto de {antecessor} ainda está lá.',
    choices: [
      { id: 'party', label: 'Fazer uma festa para os alunos', effects: { money: -3000, fighter: { reputation: 2 }, stats: { happiness: 4 } }, resultText: 'Teve churrasco e roda de histórias.' },
      { id: 'train', label: 'Comemorar com um treinão aberto', effects: { fighter: { reputation: 1, skills: { grappling: 1 } }, stats: { happiness: 2 } }, resultText: 'O tatame encheu.' },
    ],
  },
  {
    id: 'legacy_diary',
    once: true,
    weight: 3,
    conditions: { minAge: 12, legacy: { generation: { min: 2 } } },
    text: 'Arrumando a casa, você encontra um caderno velho: o diário de treinos de {antecessor}.',
    choices: [
      { id: 'study', label: 'Estudar cada página', effects: { fighter: { skills: { grappling: 1.1, trocacao: 1.7 } } }, resultText: 'Tinha anotação de cada luta, até das derrotas.' },
      { id: 'keep', label: 'Guardar como lembrança', effects: { stats: { happiness: 3 } }, resultText: 'Você chorou um pouco.' },
    ],
  },
  {
    id: 'legacy_grave',
    weight: 2,
    conditions: { minAge: 10, legacy: { generation: { min: 2 } } },
    text: 'No aniversário de morte de {antecessor}, você visita o túmulo.',
    choices: [
      { id: 'talk', label: 'Contar as novidades em voz alta', effects: { stats: { happiness: 3 } }, resultText: 'Parecia que alguém escutava.' },
      { id: 'flowers', label: 'Deixar flores e ir embora', effects: { stats: { happiness: 1 } }, resultText: 'Saudade.' },
    ],
  },
  {
    id: 'legacy_old_fan',
    weight: 3,
    conditions: { minAge: 12, legacy: { generation: { min: 2 }, parentChampion: true } },
    text: 'Um senhor na padaria reconhece seu sobrenome: "Eu estava na arena na noite em que {antecessor} ganhou o cinturão!"',
    choices: [
      { id: 'listen', label: 'Ouvir a história toda', effects: { stats: { happiness: 3 } }, resultText: 'Ele lembrava de cada golpe.' },
      { id: 'photo', label: 'Tirar uma foto com ele', effects: { fighter: { reputation: 1 } }, resultText: 'A foto rodou nas redes.' },
    ],
  },
  {
    id: 'legacy_heirloom',
    once: true,
    weight: 3,
    conditions: { minAge: 14, legacy: { generation: { min: 2 } } },
    text: 'A família entrega a você o primeiro quimono de {antecessor}, guardado por anos numa caixa.',
    choices: [
      { id: 'wear', label: 'Treinar com ele uma vez', effects: { stats: { happiness: 4 }, fighter: { skills: { grappling: 1 } } }, resultText: 'Ficou um pouco largo, mas serviu.' },
      { id: 'frame', label: 'Emoldurar na parede', effects: { stats: { happiness: 3 } }, resultText: 'É a primeira coisa que você vê ao acordar.' },
    ],
  },
  {
    id: 'legacy_pressure',
    weight: 3,
    conditions: { minAge: 15, maxAge: 28, legacy: { generation: { min: 2 }, parentChampion: true } },
    text: 'Todo mundo espera que você seja tão bom quanto {antecessor}. Às vezes isso pesa.',
    choices: [
      { id: 'therapy', label: 'Conversar com alguém sobre isso', effects: { money: -1500, stats: { happiness: 4 } }, resultText: 'Falar ajudou.' },
      { id: 'grind', label: 'Transformar a pressão em treino', effects: { fighter: { skills: { athletic: 2 } }, stats: { happiness: -2 } }, resultText: 'Você treinou até não aguentar mais.' },
    ],
  },
  {
    id: 'legacy_founder_story',
    once: true,
    weight: 3,
    conditions: { minAge: 8, legacy: { generation: { min: 3 } } },
    text: 'No almoço de família, os mais velhos contam histórias de três gerações de lutadores. Você percebe que faz parte de algo maior.',
    choices: [
      { id: 'proud', label: 'Prometer honrar o sobrenome', effects: { stats: { happiness: 4 }, setFlags: { interesse_luta: true } }, resultText: 'Todo mundo brindou.' },
      { id: 'own', label: 'Pensar em seguir outro caminho', effects: { stats: { happiness: 2 } }, resultText: 'Ninguém é obrigado a lutar.' },
    ],
  },
];
