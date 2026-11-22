import type { NamePools } from '../../engine';
import { IBGE_NAMES_NATIONAL, IBGE_NAMES_REGIONAL } from './ibgeNames.generated';
import { SURNAMES } from './surnames';

/** Nomes de pessoas (IBGE) e nomes fictícios de escolas. */
export const NAMES: NamePools = {
  // Etapa 7: nomes reais do IBGE por década e região; male/female = fallback (década de 2000)
  byDecade: IBGE_NAMES_NATIONAL,
  byRegion: IBGE_NAMES_REGIONAL,
  male: IBGE_NAMES_NATIONAL.M['2000']!.map(([n]) => n),
  female: IBGE_NAMES_NATIONAL.F['2000']!.map(([n]) => n),
  surnames: SURNAMES,
  publicSchoolPrefixes: ['Escola Municipal', 'Escola Estadual', 'E.E.', 'Colégio Estadual'],
  privateSchoolPrefixes: ['Colégio', 'Instituto', 'Colégio Particular', 'Centro Educacional'],
  schoolNames: [
    'Ipê Amarelo', 'Horizonte Azul', 'Monte Verde', 'Sol Nascente', 'Vale das Palmeiras', 'Nova Aurora',
    'Rio Claro', 'Estrela Guia', 'Pedra Branca', 'Santa Luzia', 'Bem-te-vi', 'Jardim das Acácias',
  ],
};
