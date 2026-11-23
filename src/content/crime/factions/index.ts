/**
 * Facções criminosas FICTÍCIAS (release 0.0.2). Nomes, cores e símbolos inventados, sem semelhança com grupos reais
 * (ver `tests/forbiddenNames.test.ts`). Entrada só por convite, a partir dos 18. Nenhum lado é glamourizado.
 */
import type { FactionDef } from '../../../engine';

export const FACTIONS: readonly FactionDef[] = [
  {
    id: 'liga',
    name: 'Liga da Serpente',
    short: 'a Liga',
    colors: ['#1f7a3a', '#111111'],
    symbol: 'serpente enrolada num cadeado',
    territory: { ufs: ['SP', 'RJ', 'MG', 'ES', 'GO', 'DF', 'MS', 'MT'] },
    size: 'grande',
    rivals: ['ordem', 'mare'],
    rules: ['Dívida se paga no mesmo ano.', 'Ninguém age no território sem autorização.'],
  },
  {
    id: 'cla',
    name: 'Clã do Corvo',
    short: 'o Clã',
    colors: ['#5b2a86', '#111111'],
    symbol: 'corvo de asas abertas',
    territory: { ufs: ['PR', 'SC', 'RS', 'SP'] },
    size: 'media',
    rivals: ['mare'],
    rules: ['Quem fala com a polícia sai.', 'Disciplina acima de tudo.'],
  },
  {
    id: 'ordem',
    name: 'Ordem do Sol Partido',
    short: 'a Ordem',
    colors: ['#e07b1a', '#4a2a0a'],
    symbol: 'sol cortado ao meio',
    territory: { ufs: ['BA', 'PE', 'CE', 'RN', 'PB', 'AL', 'SE', 'PI', 'MA'] },
    size: 'grande',
    rivals: ['liga'],
    rules: ['A família de um é de todos.', 'Ninguém mexe com morador.'],
  },
  {
    id: 'mare',
    name: 'Maré Cinzenta',
    short: 'a Maré',
    colors: ['#6b7280', '#1e3a8a'],
    symbol: 'onda quebrando',
    territory: { ufs: ['AM', 'PA', 'AP', 'RR', 'AC', 'RO', 'TO'], cities: ['Santos', 'Paranaguá', 'Itajaí', 'Vitória'] },
    size: 'pequena',
    rivals: ['cla', 'liga'],
    rules: ['Ninguém trabalha sozinho.', 'Traição não tem perdão.'],
  },
];

export const FACTION_RANKS: readonly string[] = ['Membro', 'Soldado', 'Gerente', 'Liderança regional', 'Cúpula'];
