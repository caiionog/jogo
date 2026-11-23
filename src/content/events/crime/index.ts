import type { GameEvent } from '../../../engine';
import { FACTION_EVENTS } from './faction';
import { JUSTICE_EVENTS } from './justice';
import { CROSSING_EVENTS } from './crossings';

/**
 * Crime (release 0.0.2, fase 4): etapas abstratas do planejamento dos delitos graves, suspeita do dinheiro sujo e
 * situações do dia a dia de quem anda no crime. Nada de método ou detalhe real; violência curta e não glamourizada.
 * Menores: só eventos de infrações leves (maxAge 17, sem facção, sem plano).
 */
export const CRIME_EVENTS: readonly GameEvent[] = [
  ...FACTION_EVENTS,
  ...JUSTICE_EVENTS,
  ...CROSSING_EVENTS,
  // --- planejamento (aberto pela ação "Planejar"; a engine enfileira a etapa seguinte) ---
  {
    id: 'crime_plano_equipe',
    trigger: 'followUp',
    conditions: { minAge: 18, crime: { planning: true } },
    weight: 0,
    text: 'Para o plano dar certo, você precisa de gente. Quem chamar?',
    choices: [
      { id: 'amigos', label: 'Amigos de confiança (pouca experiência)', effects: { crime: { planTeam: 'amigos' } }, resultText: 'Gente leal, mas nervosa.' },
      { id: 'conhecidos', label: 'Conhecidos da rua', effects: { crime: { planTeam: 'conhecidos' } }, resultText: 'Gente que você não conhece direito.' },
      { id: 'profissionais', label: 'Gente experiente (fica com a maior parte)', effects: { crime: { planTeam: 'profissionais' } }, resultText: 'Eles avaliam você de cima a baixo antes de topar.' },
    ],
  },
  {
    id: 'crime_plano_alvo',
    trigger: 'followUp',
    conditions: { minAge: 18, crime: { planning: true } },
    weight: 0,
    text: 'Agora, o tamanho do alvo.',
    choices: [
      { id: 'pequeno', label: 'Algo pequeno e mais seguro', effects: { crime: { planTarget: 'pequeno' } }, resultText: 'Menos dinheiro, menos chance de dar errado.' },
      { id: 'medio', label: 'Um alvo médio', effects: { crime: { planTarget: 'medio' } }, resultText: 'Equilíbrio entre risco e ganho.' },
      { id: 'grande', label: 'O alvo grande', effects: { crime: { planTarget: 'grande' } }, resultText: 'Se der certo, muda sua vida. Se der errado, também.' },
    ],
  },
  {
    id: 'crime_plano_momento',
    trigger: 'followUp',
    conditions: { minAge: 18, crime: { planning: true } },
    weight: 0,
    text: 'Quando agir?',
    choices: [
      { id: 'dia', label: 'De dia, no meio do movimento', effects: { crime: { planTime: 'dia' } }, resultText: 'Muita gente, muitas testemunhas.' },
      { id: 'noite', label: 'De noite, com a rua vazia', effects: { crime: { planTime: 'noite' } }, resultText: 'Menos olhos, mas qualquer barulho chama atenção.' },
    ],
  },
  {
    id: 'crime_plano_hora',
    trigger: 'followUp',
    conditions: { minAge: 18, crime: { planning: true } },
    weight: 0,
    text: 'Chegou a hora. Uma viatura passa devagar pela rua e um dos seus parceiros está suando frio.',
    choices: [
      { id: 'seguir', label: 'Seguir com o plano', effects: { crime: { planGo: true } }, resultText: 'Não tem mais volta.' },
      { id: 'abortar', label: 'Abortar', effects: { crime: { planGo: false } }, resultText: 'Melhor perder a viagem do que a liberdade.' },
    ],
  },

  // --- dinheiro sujo ---
  {
    id: 'crime_suspeita',
    trigger: 'followUp',
    conditions: { minAge: 18 },
    weight: 0,
    text: 'Seus gastos chamaram atenção: um vizinho comentou, o banco pediu explicações sobre a origem do dinheiro.',
    choices: [
      { id: 'explicar', label: 'Inventar uma explicação', effects: { crime: { wanted: 10 } }, risk: { chance: 0.35, effects: { crime: { wanted: 25, seizeDirty: 0.5 } }, resultText: 'A história não colou. Parte do dinheiro foi bloqueada para investigação.' }, resultText: 'Por enquanto, colou.' },
      { id: 'discreto', label: 'Ficar quieto e gastar menos', effects: { crime: { wanted: 5 }, stats: { happiness: -2 } }, resultText: 'Você voltou a viver modestamente. A desconfiança foi passando.' },
    ],
  },

  // --- adolescência (só infrações leves) ---
  {
    id: 'crime_teen_pichar',
    conditions: { minAge: 13, maxAge: 17 },
    weight: 3,
    text: 'Uns colegas mais velhos chamam você para pichar o muro da escola de madrugada.',
    choices: [
      { id: 'ir', label: 'Ir junto', effects: { crime: { rep: 2, wanted: 3 }, stats: { happiness: 2 } }, risk: { chance: 0.3, effects: { crime: { arrest: 'pichacao' } }, resultText: 'Uma viatura passou na hora.' }, resultText: 'Foi a noite mais emocionante do ano. E um muro a mais para a prefeitura pintar.' },
      { id: 'nao', label: 'Recusar', effects: { stats: { happiness: -1 } }, resultText: 'Eles te chamaram de medroso. Dois foram pegos na semana seguinte.' },
    ],
  },
  {
    id: 'crime_teen_desafio',
    conditions: { minAge: 12, maxAge: 17, crime: { juvenile: true } },
    weight: 3,
    cooldownYears: 2,
    text: 'Depois da sua passagem pela delegacia, um educador social te convida para um projeto de esporte e música no bairro.',
    choices: [
      { id: 'aceitar', label: 'Participar', effects: { stats: { happiness: 4, athletic: 2 }, crime: { rep: -5 }, setFlags: { projeto_social: true } }, resultText: 'Você encontrou gente que acredita em você.' },
      { id: 'recusar', label: 'Não ir', effects: {}, resultText: 'Você preferiu ficar na rua.' },
    ],
  },

  // --- vida no crime (18+) ---
  {
    id: 'crime_convite_turma',
    conditions: { minAge: 18, maxAge: 40, crime: { rep: { min: 8 }, faction: false } },
    weight: 3,
    cooldownYears: 4,
    text: 'A Turma do Viaduto, um grupo de rua sem chefe nem regras, chama você para "uns trabalhos" de vez em quando.',
    choices: [
      { id: 'aceitar', label: 'Topar', effects: { crime: { rep: 6 }, setFlags: { turma_viaduto: true } }, resultText: 'Você passou a ser visto com eles. Dinheiro fácil e um alvo nas costas.' },
      { id: 'recusar', label: 'Cair fora', effects: { crime: { rep: -2 } }, resultText: 'Você cortou o contato. Alguns ainda te cumprimentam na rua.' },
    ],
  },
  {
    id: 'crime_testemunha',
    conditions: { minAge: 18, crime: { wanted: { min: 30 } } },
    weight: 4,
    cooldownYears: 3,
    text: 'Um conhecido avisa: uma testemunha reconheceu você numa foto mostrada pela polícia.',
    choices: [
      { id: 'sumir', label: 'Sumir por um tempo', effects: { crime: { wanted: -10 }, stats: { happiness: -4 }, economy: { post: { cat: 'eventos', amount: -3000, label: 'Tempo escondido' } } }, resultText: 'Meses fora de casa, longe de todo mundo.' },
      { id: 'advogado', label: 'Procurar um advogado', effects: { economy: { post: { cat: 'eventos', amount: -5000, label: 'Advogado' } } }, resultText: 'O advogado recomendou silêncio e paciência.' },
      { id: 'ficar', label: 'Seguir a vida normal', effects: {}, risk: { chance: 0.4, effects: { crime: { arrest: 'investigacao' } }, resultText: 'A polícia foi mais rápida.' }, resultText: 'Nada aconteceu. Ainda.' },
    ],
  },
  {
    id: 'crime_familia_descobre',
    once: true,
    conditions: { minAge: 18, crime: { rep: { min: 15 } }, hasRelation: ['mae', 'pai'] },
    weight: 4,
    text: 'Sua família descobriu de onde vem o seu dinheiro.',
    choices: [
      { id: 'prometer', label: 'Prometer que vai parar', effects: { social: { parentsAffection: 4 }, stats: { happiness: 2 }, setFlags: { prometeu_parar: true } }, resultText: 'Sua mãe chorou e te abraçou. Agora você precisa cumprir.' },
      { id: 'negar', label: 'Negar tudo', effects: { social: { parentsAffection: -10 } }, resultText: 'Eles não acreditaram. O almoço de domingo nunca mais foi o mesmo.' },
      { id: 'assumir', label: 'Assumir e dizer que é a sua vida', effects: { social: { parentsAffection: -18 }, crime: { rep: 2 } }, resultText: 'Seu pai te pediu para não voltar mais lá.' },
    ],
  },
  {
    id: 'crime_parceiro_preso',
    conditions: { minAge: 18, crime: { rep: { min: 20 }, record: false } },
    weight: 3,
    cooldownYears: 3,
    text: 'Um parceiro dos seus "trabalhos" foi preso. Dizem que ele está pensando em fazer delação.',
    choices: [
      { id: 'ajudar', label: 'Pagar o advogado dele', effects: { economy: { post: { cat: 'eventos', amount: -8000, label: 'Advogado do parceiro' } }, crime: { rep: 4 } }, resultText: 'Ele ficou calado. E ficou te devendo.' },
      { id: 'sumir', label: 'Cortar contato e torcer', effects: {}, risk: { chance: 0.4, effects: { crime: { wanted: 30 } }, resultText: 'Ele falou. Seu nome está no depoimento.' }, resultText: 'Ele não falou. Desta vez.' },
    ],
  },
];
