import type { GameEvent } from '../../../engine';

/** Processo criminal (release 0.0.2, fase 6): delegacia → defesa → julgamento. Adultos; tom sóbrio. */
export const JUSTICE_EVENTS: readonly GameEvent[] = [
  {
    id: 'justica_delegacia',
    trigger: 'followUp',
    conditions: { minAge: 18, crime: { inCase: true } },
    weight: 0,
    text: 'Na delegacia, o escrivão liga o computador: "Vai querer falar alguma coisa?"',
    choices: [
      { id: 'confessar', label: 'Confessar', effects: { crime: { plea: 'confessar' }, followUps: [{ eventId: 'justica_defesa', delayYears: 0 }] }, resultText: 'Você contou o que fez. A confissão costuma reduzir a pena.' },
      { id: 'silencio', label: 'Ficar em silêncio e esperar o advogado', effects: { crime: { plea: 'silencio' }, followUps: [{ eventId: 'justica_defesa', delayYears: 0 }] }, resultText: 'Você usou o direito de ficar calad{o/a}.' },
      { id: 'negar', label: 'Negar tudo', effects: { crime: { plea: 'negar' }, followUps: [{ eventId: 'justica_defesa', delayYears: 0 }] }, resultText: 'Você negou. O delegado anotou sem levantar os olhos.' },
    ],
  },
  {
    id: 'justica_defesa',
    trigger: 'followUp',
    conditions: { minAge: 18, crime: { inCase: true } },
    weight: 0,
    text: 'Quem vai cuidar da sua defesa?',
    choices: [
      { id: 'publico', label: 'Defensoria Pública (gratuita)', effects: { crime: { lawyer: 'publico' } }, resultText: 'Você assinou os papéis da Defensoria.' },
      { id: 'particular', label: 'Advogado particular (caro)', effects: { crime: { lawyer: 'particular' } }, resultText: 'Você foi atrás de um advogado.' },
    ],
  },
  {
    id: 'justica_julgamento',
    trigger: 'followUp',
    conditions: { minAge: 18, crime: { inCase: true } },
    weight: 0,
    text: 'Dia do julgamento. Sua família está no fundo da sala.',
    choices: [
      { id: 'julgar', label: 'Ouvir a sentença', effects: { crime: { verdict: true } }, resultText: 'O juiz leu a decisão.' },
      { id: 'acordo', label: 'Aceitar um acordo e confessar (pena menor)', effects: { crime: { plea: 'confessar', verdict: true } }, resultText: 'Você aceitou o acordo.' },
    ],
  },
];
