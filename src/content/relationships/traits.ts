import type { TraitDef } from '../../engine';

/**
 * Traços de personalidade. actionMods multiplica o efeito das ações; fightStance é a postura diante da carreira
 * de luta (−1 reprova, +1 apoia); jealousy aumenta conflitos.
 */
export const TRAITS: readonly TraitDef[] = [
  { id: 'leal', label: 'Leal', jealousy: 0, fightStance: 0, actionMods: { spend_time: 1.2 }, likes: ['carinhoso'], dislikes: ['explosivo'] },
  { id: 'ciumento', label: 'Ciumento', jealousy: 0.6, fightStance: -1, actionMods: { date: 1.2, argue: 1.3 }, dislikes: ['aventureiro'] },
  { id: 'ambicioso', label: 'Ambicioso', jealousy: 0.1, fightStance: 1, actionMods: { compliment: 0.8 }, likes: ['ambicioso'] },
  { id: 'explosivo', label: 'Explosivo', jealousy: 0.3, fightStance: 1, actionMods: { argue: 1.5 }, dislikes: ['tranquilo'] },
  { id: 'carinhoso', label: 'Carinhoso', jealousy: 0.1, fightStance: 0, actionMods: { compliment: 1.4, spend_time: 1.3 }, likes: ['leal'] },
  { id: 'protetor', label: 'Protetor', jealousy: 0.3, fightStance: -1, actionMods: { talk: 1.2 }, likes: ['leal'] },
  { id: 'aventureiro', label: 'Aventureiro', jealousy: 0, fightStance: 1, actionMods: { date: 1.4, spend_time: 1.1 }, dislikes: ['ciumento'] },
  { id: 'generoso', label: 'Generoso', jealousy: 0, fightStance: 0, actionMods: { gift: 1.5, ask_money: 1.3 }, likes: ['carinhoso'] },
  { id: 'orgulhoso', label: 'Orgulhoso', jealousy: 0.2, fightStance: 1, actionMods: { compliment: 1.5, argue: 1.2 } },
  { id: 'tranquilo', label: 'Tranquilo', jealousy: 0, fightStance: 0, actionMods: { argue: 0.6, talk: 1.2 }, likes: ['tranquilo'] },
  { id: 'religioso', label: 'Religioso', jealousy: 0.1, fightStance: -1, actionMods: { talk: 1.1 } },
  { id: 'competitivo', label: 'Competitivo', jealousy: 0.2, fightStance: 1, actionMods: { spend_time: 1.1 } },
];
