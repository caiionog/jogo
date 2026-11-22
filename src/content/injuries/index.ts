import type { InjuryDef, SequelaDef } from '../../engine';

/** Catálogo de lesões (Etapa 6). Tempo em meses; custo em R$ (× custo da cidade). */
export const INJURY_CATALOG: readonly InjuryDef[] = [
  { id: 'corte_supercilio', name: 'corte profundo no supercílio', severity: 1, months: [1, 2], cost: { fisio: 800 }, effects: { skills: { trocacao: -1 } }, sequelaChance: 0.05, sequelaId: 'cicatriz', sources: ['luta', 'sparring', 'evento'], zone: 'pele', weight: 1.4 },
  { id: 'distensao', name: 'distensão muscular', severity: 1, months: [1, 3], cost: { fisio: 1500 }, effects: { skills: { athletic: -4 } }, sequelaChance: 0.03, sources: ['luta', 'sparring', 'treino', 'evento'], zone: 'perna', weight: 1.5 },
  { id: 'entorse_tornozelo', name: 'entorse de tornozelo', severity: 1, months: [2, 4], cost: { fisio: 2000 }, effects: { skills: { jiujitsu: -1.8, athletic: -3 } }, sequelaChance: 0.05, sources: ['luta', 'sparring', 'treino', 'evento'], zone: 'perna' },
  { id: 'tendinite', name: 'tendinite no cotovelo', severity: 1, months: [2, 5], cost: { fisio: 2500 }, effects: { skills: { jiujitsu: -2.2, trocacao: -1.4 } }, sequelaChance: 0.08, sequelaId: 'cotovelo_cronico', sources: ['treino', 'sparring'], zone: 'ombro' },
  { id: 'nariz_quebrado', name: 'nariz quebrado', severity: 2, months: [2, 4], cost: { fisio: 2500, cirurgia: 9000 }, effects: { skills: { athletic: -4 }, stats: { looks: -2 } }, surgery: { successChance: 0.95, monthsFactor: 0.7 }, sequelaChance: 0.12, sequelaId: 'nariz_torto', sources: ['luta', 'sparring', 'evento'], zone: 'cabeca' },
  { id: 'concussao', name: 'concussão', severity: 2, months: [2, 6], cost: { fisio: 3000 }, effects: { skills: { trocacao: -1, chin: -8 } }, sequelaChance: 0.08, sequelaId: 'enxaqueca', sources: ['luta', 'sparring', 'evento'], zone: 'cabeca', brainDamage: 4 },
  { id: 'mao_fraturada', name: 'mão fraturada', severity: 2, months: [3, 6], cost: { fisio: 3500, cirurgia: 14000 }, effects: { skills: { trocacao: -7 } }, surgery: { successChance: 0.9, monthsFactor: 0.75 }, sequelaChance: 0.18, sequelaId: 'mao_fragil', sources: ['luta', 'sparring', 'evento'], zone: 'mao', weight: 1.2 },
  { id: 'costela_fraturada', name: 'costela fraturada', severity: 2, months: [3, 5], cost: { fisio: 3000 }, effects: { skills: { jiujitsu: -1.8, athletic: -8 } }, sequelaChance: 0.06, sources: ['luta', 'sparring', 'treino'], zone: 'tronco' },
  { id: 'orelha', name: 'orelha inchada (hematoma)', severity: 1, months: [1, 2], cost: { fisio: 600, cirurgia: 2500 }, effects: {}, surgery: { successChance: 0.97, monthsFactor: 0.5 }, sequelaChance: 0.45, sequelaId: 'orelha_couve_flor', sources: ['luta', 'sparring'], zone: 'pele' },
  { id: 'fratura_orbital', name: 'fratura orbital', severity: 3, months: [6, 10], cost: { fisio: 5000, cirurgia: 30000 }, effects: { skills: { trocacao: -6.5 } }, surgery: { successChance: 0.85, monthsFactor: 0.7 }, sequelaChance: 0.25, sequelaId: 'visao_reduzida', sources: ['luta'], zone: 'cabeca', brainDamage: 3, weight: 0.35 },
  { id: 'menisco', name: 'lesão no menisco', severity: 2, months: [4, 7], cost: { fisio: 5000, cirurgia: 25000 }, effects: { skills: { jiujitsu: -3.6, athletic: -5 } }, surgery: { successChance: 0.88, monthsFactor: 0.6 }, sequelaChance: 0.15, sequelaId: 'joelho_instavel', sources: ['luta', 'sparring', 'treino'], zone: 'joelho' },
  { id: 'lca', name: 'ruptura do ligamento cruzado do joelho', severity: 4, months: [10, 14], cost: { fisio: 8000, cirurgia: 45000 }, effects: { skills: { jiujitsu: -6.8, trocacao: -3.5, athletic: -10 } }, surgery: { successChance: 0.85, monthsFactor: 0.75 }, sequelaChance: 0.35, sequelaId: 'joelho_instavel', sources: ['luta', 'sparring', 'treino'], zone: 'joelho', weight: 0.35 },
  { id: 'ombro', name: 'luxação do ombro', severity: 3, months: [5, 9], cost: { fisio: 6000, cirurgia: 35000 }, effects: { skills: { jiujitsu: -6.6, trocacao: -4.2 } }, surgery: { successChance: 0.87, monthsFactor: 0.7 }, sequelaChance: 0.25, sequelaId: 'ombro_fragil', sources: ['luta', 'sparring'], zone: 'ombro', weight: 0.5 },
  { id: 'hernia', name: 'hérnia de disco', severity: 3, months: [6, 12], cost: { fisio: 7000, cirurgia: 40000 }, effects: { skills: { jiujitsu: -8.9 }, stats: { athletic: -3 } }, surgery: { successChance: 0.8, monthsFactor: 0.6 }, sequelaChance: 0.3, sequelaId: 'coluna_cronica', sources: ['luta', 'sparring', 'treino', 'evento'], zone: 'coluna', weight: 0.4 },
];

export const SEQUELAE: readonly SequelaDef[] = [
  { id: 'cicatriz', name: 'cicatriz no supercílio', description: 'Abre com mais facilidade.', skills: { trocacao: -1 } },
  { id: 'nariz_torto', name: 'nariz torto', description: 'Respira pior nas lutas longas.', skills: { athletic: -2 }, stats: { looks: -2 } },
  { id: 'enxaqueca', name: 'enxaqueca crônica', description: 'Dores de cabeça frequentes.', stats: { happiness: -3 }, skills: { chin: -3 } },
  { id: 'mao_fragil', name: 'mão frágil', description: 'Golpes potentes doem mais em você.', skills: { trocacao: -3.5 } },
  { id: 'cotovelo_cronico', name: 'cotovelo crônico', description: 'Dor ao finalizar.', skills: { jiujitsu: -1.7 } },
  { id: 'orelha_couve_flor', name: 'orelha de couve-flor', description: 'Marca de quem vive no tatame.', stats: { looks: -2 } },
  { id: 'visao_reduzida', name: 'visão reduzida', description: 'Enxerga menos os golpes que vêm.', skills: { trocacao: -1.8 } },
  { id: 'joelho_instavel', name: 'joelho instável', description: 'Quedas e explosão nunca mais foram as mesmas.', skills: { jiujitsu: -3.1, athletic: -4 }, stats: { athletic: -3 }, careerThreatening: true },
  { id: 'ombro_fragil', name: 'ombro frágil', description: 'Sai do lugar com facilidade.', skills: { jiujitsu: -3.3, trocacao: -2.1 }, careerThreatening: true },
  { id: 'coluna_cronica', name: 'dor crônica na coluna', description: 'Acordar já é um treino.', skills: { jiujitsu: -5 }, stats: { athletic: -4, happiness: -3 }, careerThreatening: true },
];

/** Nomes antigos da Etapa 3 → catálogo (migração v5→v6 e eventos antigos). */
export const LEGACY_INJURY_NAMES: Record<string, string> = {
  'joelho torcido': 'menisco',
  'costela trincada': 'costela_fraturada',
  'mão fraturada': 'mao_fraturada',
  'ombro deslocado': 'ombro',
  'corte profundo no supercílio': 'corte_supercilio',
  'lesão no tornozelo': 'entorse_tornozelo',
  'hérnia de disco leve': 'hernia',
  'nariz quebrado': 'nariz_quebrado',
  'joelho lesionado': 'menisco',
};
