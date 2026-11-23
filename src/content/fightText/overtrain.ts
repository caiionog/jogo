/**
 * Treino além do limite do ano (release 0.0.2). O treino continua disponível, mas não rende: o jogador vê um aviso
 * em palavras (nunca o número de sessões). `job`/`college`/`business` entram quando parte do tempo do ano está
 * ocupada por emprego, faculdade ou empresa.
 */
export const OVERTRAIN = {
  text: {
    limit: [
      'Você treinou demais este ano. Seu corpo precisa descansar para evoluir.',
      'O corpo pediu arrego: você já treinou demais este ano e não evoluiu nada hoje.',
      'Treino a mais, ganho nenhum. Este ano seu corpo precisa de descanso.',
      '"Chega por este ano", disse o treinador. Sem descanso, não tem evolução.',
    ],
    job: [
      'Com seu trabalho, não sobra tempo para treinar mais este ano.',
      'Você treinou cansado depois do expediente e não rendeu nada. O trabalho já toma seu tempo este ano.',
      'Entre o emprego e os treinos, seu corpo não acompanha mais este ano.',
    ],
    college: [
      'Com a faculdade, não sobra tempo para treinar mais este ano.',
      'Entre aulas e provas, o treino de hoje não rendeu nada. Seu corpo precisa descansar.',
    ],
    business: [
      'Cuidando do negócio de perto, não sobra tempo para treinar mais este ano.',
    ],
  },
  /** Lesões leves por excesso (ids do catálogo). */
  injuryIds: ['distensao', 'entorse_tornozelo', 'tendinite'],
  /** Chance de lesão por tentativa extra: 1ª, 2ª, 3ª em diante. */
  injuryChance: [0, 0.08, 0.12],
  injuryText: 'O excesso cobrou a conta: {lesao}.',
} as const;
