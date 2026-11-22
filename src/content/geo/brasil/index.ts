import type { GeoContent, Regiao, UfDef } from '../../../engine';
import { UF_DATA } from './data.generated';

/**
 * As 27 UFs com população, capital, cidades e cor ou raça do Censo 2022 (ver fontes em data.generated.ts).
 * Exceção: o DF tem um único município (Brasília); para o sorteio de cidade usamos Brasília e 5 regiões
 * administrativas com PESOS IGUAIS — escolha do jogo, porque o Censo 2022 não publica população por RA.
 */
const DF_LOCALITIES = ['Brasília', 'Ceilândia', 'Taguatinga', 'Samambaia', 'Gama', 'Planaltina'];

export const BRASIL_UFS: readonly UfDef[] = UF_DATA.map((u) => {
  const cities =
    u.sigla === 'DF'
      ? DF_LOCALITIES.map((name) => ({ name, populacao: Math.round(u.populacao / DF_LOCALITIES.length), custo: u.cities[0]!.custo }))
      : u.cities.map((c) => ({ name: c.name, populacao: c.populacao, custo: c.custo }));
  return {
    sigla: u.sigla,
    nome: u.nome,
    regiao: u.regiao as Regiao,
    populacao: u.populacao,
    capital: u.capital,
    cities,
    corRaca: { ...u.corRaca },
  };
});

export const GEO_CONTENT: GeoContent = { ufs: BRASIL_UFS };
