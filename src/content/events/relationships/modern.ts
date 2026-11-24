import type { GameEvent } from '../../../engine';

/**
 * Vida amorosa moderna (release 0.0.4, fase 3): caso escondido, relação aberta, gravidez casual e app de namoro.
 * Tudo entre adultos (minAge 18 e, com alvo, personAge 18+). Textos sugestivos, nunca explícitos.
 */
export const MODERN_LOVE_EVENTS: readonly GameEvent[] = [
  { id: 'amor_caso_quase', weight: 6, tone: 'bad', conditions: { minAge: 18, love: { affair: true } }, text: 'Seu celular vibrou na mesa do jantar com uma mensagem que não podia aparecer. Você virou a tela bem a tempo.',
    choices: [
      { id: 'terminar', label: 'Decidir acabar com o caso', resultText: 'Você mandou uma mensagem curta e apagou a conversa. O coração ainda acelerado.', effects: { stats: { happiness: -2 } } },
      { id: 'continuar', label: 'Seguir com a vida dupla', resultText: 'A adrenalina passa. O medo fica.', effects: { stats: { happiness: -3 } } },
    ] },
  { id: 'amor_caso_amigo_sabe', weight: 4, tone: 'bad', conditions: { minAge: 18, love: { affair: true }, relationship: { types: ['amigo'], personAge: { min: 18 } } }, text: '{pessoa} viu você com outra pessoa e pergunta, baixinho: "O que está acontecendo?"',
    choices: [
      { id: 'contar', label: 'Contar a verdade e pedir sigilo', resultText: '{pessoa} prometeu não contar, mas não aprovou.', effects: { social: { affection: -5 } } },
      { id: 'mentir', label: 'Inventar uma desculpa', resultText: '{pessoa} fingiu acreditar.', effects: { social: { affection: -10 } } },
    ] },
  { id: 'amor_aberta_regras', weight: 5, conditions: { minAge: 18, love: { openRelationship: true }, relationship: { types: ['parceiro', 'conjuge'], personAge: { min: 18 } } }, text: 'Você e {pessoa} sentam para revisar os combinados da relação aberta.',
    choices: [
      { id: 'manter', label: 'Manter as regras como estão', resultText: 'Conversa adulta, sem drama.', effects: { social: { affection: 4 } } },
      { id: 'fechar', label: 'Propor voltar a ser só vocês dois', resultText: '{pessoa} sorriu: "Eu também estava pensando nisso."', effects: { social: { affection: 6 } } },
    ] },
  { id: 'amor_gravidez_casual', weight: 9, once: true, conditions: { minAge: 18, love: { casualPregnancy: true } }, text: 'A notícia da gravidez depois de uma noite só caiu como um raio. Há muita coisa a decidir.',
    choices: [
      { id: 'assumir', label: 'Assumir a criança e a responsabilidade', resultText: 'Não era o plano, mas você vai estar presente.', effects: { stats: { happiness: -2 }, setFlags: { assumiu_paternidade: true } } },
      { id: 'exame', label: 'Pedir um exame de paternidade antes', resultText: 'O exame confirmou. O clima ficou estranho, mas a verdade veio.', effects: { money: -600, stats: { happiness: -3 }, setFlags: { assumiu_paternidade: true } } },
    ] },
  { id: 'amor_pensao_conversa', weight: 4, once: true, conditions: { minAge: 19, flagsAll: ['assumiu_paternidade'], children: { min: 1 } }, text: 'Você e a outra parte do bebê precisam acertar visitas e despesas, mesmo sem namorar.',
    choices: [
      { id: 'acordo', label: 'Fazer um acordo amigável', resultText: 'Cada um do seu jeito, os dois pela criança.', effects: { stats: { happiness: 2 } } },
      { id: 'justica', label: 'Deixar a justiça decidir', resultText: 'Demorou e desgastou, mas ficou tudo no papel.', effects: { money: -2500, stats: { happiness: -3 } } },
    ] },
  { id: 'amor_app_golpe', weight: 4, tone: 'bad', conditions: { minAge: 18, love: { usedApp: true } }, text: 'Um match do app, cheio de fotos perfeitas, pede um Pix "para uma emergência".',
    choices: [
      { id: 'bloquear', label: 'Desconfiar e bloquear', resultText: 'Era perfil falso. Você se livrou.', effects: { stats: { happiness: 1 } } },
      { id: 'mandar', label: 'Mandar o dinheiro', resultText: 'O perfil sumiu junto com o dinheiro.', effects: { money: -1500, stats: { happiness: -5 } } },
    ] },
  { id: 'amor_app_encontro_ruim', weight: 5, conditions: { minAge: 18, love: { usedApp: true } }, text: 'O encontro do app chegou 40 minutos atrasado e só falou da ex a noite inteira.',
    choices: [
      { id: 'rir', label: 'Transformar em história engraçada', resultText: 'Seus amigos choraram de rir no grupo.', effects: { stats: { happiness: 2 } } },
      { id: 'desistir', label: 'Apagar o app por um tempo', resultText: 'Uma pausa faz bem.', effects: { stats: { happiness: 1 } } },
    ] },
  { id: 'amor_app_conhecido', weight: 3, conditions: { minAge: 18, love: { usedApp: true } }, text: 'No app, aparece o perfil de alguém do seu trabalho. Vocês dois deram "curtir".',
    choices: [
      { id: 'conversar', label: 'Puxar conversa e rir da coincidência', resultText: 'Na segunda-feira, um sorriso cúmplice no café.', effects: { stats: { happiness: 3 } } },
      { id: 'fingir', label: 'Fingir que não viu', resultText: 'O elevador nunca foi tão constrangedor.', effects: { stats: { happiness: -1 } } },
    ] },
];
