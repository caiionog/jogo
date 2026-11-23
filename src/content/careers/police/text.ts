/**
 * Textos da carreira policial (release 0.0.2). Violência sempre curta e não gráfica, no tom do resto do jogo.
 * `{o/a}` = gênero do personagem; `{caso}` = rótulo do caso; `{unidade}` = força especial.
 */
export const SHOOTOUT_TEXT = {
  preso: [
    'O suspeito ficou sem saída e se rendeu. Ninguém se feriu e você fez a prisão.',
    'Depois de minutos tensos, o suspeito largou a arma. Prisão feita.',
    'Sua equipe cercou o local e o suspeito se entregou.',
  ],
  fuga: [
    'No meio da confusão, o suspeito conseguiu fugir por um beco.',
    'Os tiros pararam e, quando vocês avançaram, não havia mais ninguém.',
    'O suspeito escapou num carro. A ocorrência terminou sem prisão.',
  ],
  colega_ferido: [
    'Um colega foi atingido de raspão e levado ao hospital. Ele vai se recuperar, mas o susto ficou.',
    'Seu parceiro de viatura se feriu na ação. O resto do plantão foi em silêncio.',
  ],
  ferido: [
    'Você foi atingid{o/a} e levad{o/a} ao hospital. O colete ajudou, mas a recuperação vai levar um tempo.',
    'Na troca de tiros, você se feriu e precisou de atendimento médico.',
  ],
  morte: [
    'A ação deu errado. Você não voltou para casa naquela noite.',
  ],
} as const;

export const CASE_TEXT = {
  resolvido: [
    'As peças se encaixaram: {caso} foi resolvido e o responsável vai responder na justiça.',
    'Operação concluída. {caso} virou exemplo na delegacia.',
  ],
  arquivado: [
    'Sem provas suficientes, {caso} foi arquivado. Fica a frustração.',
    'As pistas esfriaram e {caso} acabou na gaveta.',
  ],
  errado: [
    'Você prendeu a pessoa errada em {caso}. O verdadeiro responsável apareceu depois, e a corregedoria abriu um procedimento.',
  ],
} as const;

export const SPECIAL_TEXT = {
  fail: [
    'O corpo não aguentou o ritmo do curso e você foi desligad{o/a}. Fica para outra vez.',
    'Você tocou o sino e pediu para sair. Sem vergonha: a maioria não termina.',
    'Uma nota abaixo do mínimo no tiro tirou você do curso.',
  ],
  pass: 'Você concluiu o curso e recebeu o distintivo do {unidade}. Poucos chegam até aqui.',
} as const;
