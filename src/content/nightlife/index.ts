import type { VenueDef } from '../../engine';

/**
 * Vida noturna (release 0.0.1). Cada saída custa dinheiro (até os 18, quase nada) e sorteia UM evento da lista do
 * local, com peso pela sorte (e pavio curto nas brigas). Locais 18+ bloqueados para menores; a casa de strip exige
 * 18+ e a opção "Conteúdo adulto" ligada (o evento tem a tag `adult`).
 */
export const VENUES: readonly VenueDef[] = [
  // antes dos 18
  { id: 'lanchonete', label: 'Lanchonete com a turma', emoji: '🍔', minAge: 10, maxAge: 17, cost: 40, events: ['night_meet', 'night_acquaintance', 'night_phone', 'night_teen_overspend'] },
  { id: 'festa_amigos', label: 'Festa de amigos', emoji: '🎈', minAge: 12, maxAge: 17, cost: 30, events: ['night_meet', 'night_acquaintance', 'night_fight_teen', 'night_teen_overspend'] },
  { id: 'matine', label: 'Matinê', emoji: '🪩', minAge: 13, maxAge: 17, cost: 60, events: ['night_meet', 'night_acquaintance', 'night_fight_teen', 'night_phone'] },
  // 18+
  { id: 'bar', label: 'Bar', emoji: '🍺', minAge: 18, cost: 120, events: ['night_meet', 'night_acquaintance', 'night_fight', 'night_fight_fighter', 'night_overspend', 'night_hangover'] },
  { id: 'festa', label: 'Festa', emoji: '🎉', minAge: 18, cost: 150, events: ['night_meet', 'night_acquaintance', 'night_overspend', 'night_phone', 'night_hangover'] },
  { id: 'show', label: 'Show', emoji: '🎸', minAge: 16, cost: 250, events: ['night_meet', 'night_acquaintance', 'night_phone', 'night_overspend'] },
  { id: 'balada', label: 'Balada', emoji: '🪩', minAge: 18, cost: 300, events: ['night_meet', 'night_acquaintance', 'night_fight', 'night_fight_fighter', 'night_overspend', 'night_phone', 'night_hangover'] },
  { id: 'casa_strip', label: 'Casa de strip', emoji: '💃', minAge: 18, adult: true, cost: 500, events: ['night_strip', 'night_overspend', 'night_hangover'] },
];
