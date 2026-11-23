import type { LuckConfig, TalentDef } from '../../engine';

/**
 * Talentos de nascimento (release 0.0.1). Ocultos: o jogador os descobre por eventos e pistas; revelados, aparecem no
 * perfil. `chance` = probabilidade ao nascer (5–15% os positivos; menor os negativos). `heritBonus` = chance extra de
 * um filho herdar o talento de um dos pais. Os `mods` são lidos pelas regras (multiplicadores e bônus pequenos).
 */
export const TALENTS: readonly TalentDef[] = [
  { id: 'atletico', label: 'Talento atlético', chance: 0.1, heritBonus: 0.25, mods: { athleticStart: 12, trainingGain: 0.15 }, hint: 'Seu corpo responde ao treino mais rápido que o dos outros.' },
  { id: 'prodigio', label: 'Prodígio intelectual', chance: 0.08, heritBonus: 0.2, mods: { intelligenceStart: 15, studyGain: 0.3 }, hint: 'Você aprende as coisas na primeira explicação.' },
  { id: 'beleza', label: 'Beleza marcante', chance: 0.1, heritBonus: 0.25, mods: { looksStart: 15 }, hint: 'As pessoas viram para olhar quando você passa.' },
  { id: 'saude_ferro', label: 'Saúde de ferro', chance: 0.08, heritBonus: 0.2, mods: { diseaseMult: 0.6, injuryMonthsMult: 0.8 }, hint: 'Você quase nunca fica doente e sara rápido.' },
  { id: 'mao_pesada', label: 'Mão pesada', chance: 0.07, heritBonus: 0.15, mods: { koBonus: 0.15 }, hint: 'Quando o seu golpe entra, a luta costuma acabar.' },
  { id: 'corpo_elastico', label: 'Corpo elástico', chance: 0.07, heritBonus: 0.15, mods: { subBonus: 0.15 }, hint: 'Você encaixa finalizações de posições que ninguém imagina.' },
  { id: 'carismatico', label: 'Carisma', chance: 0.1, heritBonus: 0.2, mods: { affectionMult: 1.2, reputationMult: 1.15 }, hint: 'As pessoas gostam de você logo de cara.' },
  // negativos (chance menor)
  { id: 'saude_fragil', label: 'Saúde frágil', chance: 0.05, negative: true, heritBonus: 0.15, mods: { diseaseMult: 1.5, injuryMonthsMult: 1.25 }, hint: 'Qualquer gripe te derruba por semanas.' },
  { id: 'propenso_lesao', label: 'Propensão a lesões', chance: 0.05, negative: true, heritBonus: 0.15, mods: { injuryChanceMult: 1.4 }, hint: 'Seu corpo se machuca com facilidade.' },
  { id: 'pavio_curto', label: 'Pavio curto', chance: 0.06, negative: true, heritBonus: 0.15, mods: { fightEventMult: 1.8 }, hint: 'Você explode por pouca coisa.' },
];

/**
 * Sorte (oculta, 0–100). Inclina os resultados, nunca decide sozinha: os limites abaixo valem no extremo (0 ou 100).
 * - `eventWeight`: peso dos eventos bons/ruins no sorteio do ano (±25%);
 * - `risk`: chance de o risco de uma escolha dar errado (±8 pontos percentuais, com piso/teto);
 * - `fight`: lances decisivos da luta (nocaute e finalização) (±3%);
 * - `maxEventChange`: o máximo que um evento (amuleto, espelho quebrado) muda a sorte.
 */
export const LUCK: LuckConfig = { eventWeight: 0.25, risk: 0.08, fight: 0.03, maxEventChange: 10, riskFloor: 0.02, riskCeil: 0.98 };
