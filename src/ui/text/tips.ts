/** Explicações curtas de primeira vez (release 0.0.1). Somem depois do "Entendi" (meta `seenTips`). */
export const TIPS = {
  graduacao: 'Graduação é a faixa (jiu-jitsu, judô) ou o prajied (muay thai). Sobe com tempo de treino na modalidade, idade e nível técnico, num exame na academia. Boxe e wrestling não têm graduação.',
  cartel: 'Cartel é o seu histórico de lutas: vitórias-derrotas-empates. Amador e profissional contam separado.',
  ranking: 'Ranking é a fila da sua categoria de peso na liga. Vencer quem está acima te faz subir; no top 3, uma sequência de vitórias dá a disputa do cinturão.',
  bolsa: 'Bolsa é o pagamento pela luta. Vencer paga um bônus; finalizar ou nocautear pode render bônus de performance. O camp (preparação) ocupa sessões de treino do ano.',
  treinador: 'O treinador avalia em palavras: Iniciante, Promissor, Sólido e Elite. "Agarre" é o jogo de quedas e chão (jiu-jitsu, judô, wrestling); "em pé" é a trocação (muay thai, boxe).',
} as const;

export type TipId = keyof typeof TIPS;
