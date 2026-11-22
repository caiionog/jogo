import type { FightTextPack } from '../../engine';

/**
 * Narração da luta. Placeholders: {a} = quem age, {b} = o outro, {golpe}, {finalizacao},
 * {n} (round), {plano} (estratégia do córner), {placar}, {tipo} (tipo de decisão).
 */
export const FIGHT_TEXT: FightTextPack = {
  strikes: {
    standing: ['um direto', 'um jab duplo', 'um cruzado', 'um gancho', 'um chute na coxa', 'um chute alto', 'um uppercut', 'uma joelhada voadora', 'um chute no corpo', 'um cruzado de esquerda'],
    clinch: ['uma joelhada no corpo', 'uma cotovelada curta', 'um uppercut curto', 'uma joelhada na coxa'],
    ground: ['marteladas', 'uma cotovelada', 'socos curtos', 'um soco de cima para baixo'],
  },
  submissions: ['um mata-leão', 'uma guilhotina', 'um triângulo', 'uma chave de braço', 'uma kimura', 'um estrangulamento de braço', 'uma chave de calcanhar'],

  round_start: ['🔔 Começa o {n}º round!', '🔔 {n}º round! Os dois voltam ao centro do octógono.', '🔔 Soa o gongo para o {n}º round.'],
  corner: ['O córner de {a} pediu para {plano}.', '{a} volta com a orientação de {plano}.'],
  strike_land: ['{a} acerta {golpe} em {b}.', '{a} conecta {golpe}!', '{golpe} de {a} encontra o alvo.', '{a} encaixa {golpe} e {b} sente.'],
  strike_heavy: ['{a} acerta {golpe} e {b} balança!', 'Que pancada! {a} acerta {golpe} e sacode {b}!', '{b} cambaleia depois de {golpe} de {a}!'],
  strike_miss: ['{a} tenta {golpe}, mas {b} esquiva.', '{golpe} de {a} passa raspando.', '{b} bloqueia {golpe} de {a}.', '{a} erra {golpe} e se desequilibra.'],
  knockdown: ['KNOCKDOWN! {a} derruba {b} com {golpe}!', '{b} vai à lona depois de {golpe} de {a}!', '{a} derruba {b} com {golpe}! A plateia levanta!'],
  ko: ['NOCAUTE! {a} apaga {b} com {golpe}!', 'ACABOU! {a} nocauteia {b} com {golpe}!', '{golpe} perfeito de {a}! {b} não levanta. Nocaute!'],
  tko: ['O árbitro interrompe! {a} vence por nocaute técnico após {golpe}.', '{b} não se defende mais e o árbitro para a luta! Vitória de {a}!', 'Chuva de golpes de {a}! O árbitro entra e encerra: nocaute técnico!'],
  takedown: ['{a} cruza e derruba {b}!', 'Queda de {a}! {b} vai às costas no chão.', '{a} pega as duas pernas e leva {b} para o chão.', 'Que queda! {a} levanta {b} e bate no solo.'],
  takedown_stuffed: ['{a} tenta a queda, mas {b} defende bem.', '{b} espalha as pernas e anula a queda de {a}.', '{a} gasta energia numa queda que não sai.'],
  guard_pull: ['{a} puxa para a guarda.', '{a} senta e chama {b} para o jogo de chão.'],
  clinch: ['{a} cola em {b} na grade.', 'Clinch! {a} amarra {b} contra a grade.'],
  clinch_break: ['{a} se solta do clinch.', 'O árbitro separa e os dois voltam ao centro.', '{a} empurra {b} e desfaz o clinch.'],
  gnp: ['{a} castiga {b} no chão com {golpe}.', 'Ground and pound! {a} desce {golpe}.', '{a}, por cima, encaixa {golpe}.'],
  control: ['{a} passa a guarda e controla {b}.', '{a} estabiliza por cima e trabalha a montada.', '{a} pega as costas de {b}!', '{a} mantém {b} preso no chão.', '{a} encaixa o joelho na barriga de {b}.', '{a} trabalha por cima com paciência.', '{a} sai do meio-guarda e chega na montada!'],
  sub_attempt: ['{a} tenta {finalizacao}, mas {b} escapa!', '{a} quase encaixa {finalizacao}! {b} resiste.', 'Perigo! {a} arma {finalizacao}... {b} se defende.'],
  sub_escape: ['{a} escapa da posição ruim.', '{a} se defende e recompõe a guarda.'],
  sub_win: ['FINALIZOU! {a} encaixa {finalizacao} e {b} bate!', '{finalizacao} de {a}! {b} desiste. Vitória por finalização!', '{a} aperta {finalizacao} até {b} bater. Que técnica!'],
  sweep: ['{a} raspa e fica por cima!', 'Raspagem! {a} inverte a posição.'],
  standup: ['{a} levanta e volta para a luta em pé.', '{a} se livra e fica de pé.'],
  round_end: ['🔔 Fim do {n}º round.', '🔔 Acaba o {n}º round. Os dois vão para o córner.'],
  doctor: ['O médico examina {b} no intervalo e encerra a luta! Interrupção médica, vitória de {a}.', 'O corte de {b} está feio e o médico para a luta. Vitória de {a}!'],
  decision: ['Decisão {tipo} dos juízes ({placar}): vitória de {a}!', 'Os juízes deram vitória a {a} por decisão {tipo} ({placar}).'],
  draw: ['Os juízes não chegaram a um vencedor ({placar}). Empate!'],
};
