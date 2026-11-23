import type { SportsClubDef } from '../../engine';

/**
 * Clubes esportivos fictícios (release 0.0.1), diferentes das academias de luta. A partir dos 6 anos; mensalidade
 * anual (paga pelos pais até os 18). Treinar no clube conta nas 10 sessões e sobe a Capacidade atlética; o judô do
 * clube também dá grappling e conta para a faixa de judô. `city: null` = existe em qualquer cidade.
 */
export const SPORTS_CLUBS: readonly SportsClubDef[] = [
  { id: 'clube_bairro', name: 'Associação Esportiva do Bairro', city: null, fee: 900, minAge: 6, sports: ['futebol', 'volei', 'basquete', 'judo'] },
  { id: 'clube_aquatico', name: 'Clube Aquático Maré Alta', city: null, fee: 2400, minAge: 6, sports: ['natacao', 'ginastica'] },
  { id: 'clube_atletismo', name: 'Centro de Atletismo Passo Firme', city: null, fee: 1200, minAge: 8, sports: ['atletismo'] },
  { id: 'sp_paulistano_fc', name: 'Clube Paulistano de Regatas e Esportes', city: 'São Paulo', fee: 6000, minAge: 6, sports: ['natacao', 'futebol', 'volei', 'basquete', 'ginastica', 'judo'] },
  { id: 'rj_orla_ec', name: 'Orla Esporte Clube', city: 'Rio de Janeiro', fee: 4800, minAge: 6, sports: ['futebol', 'volei', 'natacao'] },
  { id: 'bh_serra_ec', name: 'Serra Esporte Clube', city: 'Belo Horizonte', fee: 3600, minAge: 6, sports: ['basquete', 'volei', 'natacao', 'atletismo'] },
  { id: 'poa_guaiba_ec', name: 'Grêmio Esportivo Guaíba', city: 'Porto Alegre', fee: 3400, minAge: 6, sports: ['futebol', 'ginastica', 'judo'] },
  { id: 'ssa_bahia_ec', name: 'Clube Baiano de Esportes', city: 'Salvador', fee: 2600, minAge: 6, sports: ['futebol', 'volei', 'natacao'] },
];

export const SPORT_LABEL: Record<string, string> = {
  futebol: 'Futebol',
  natacao: 'Natação',
  atletismo: 'Atletismo',
  volei: 'Vôlei',
  basquete: 'Basquete',
  judo: 'Judô',
  ginastica: 'Ginástica',
};
