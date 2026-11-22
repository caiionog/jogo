/**
 * Gera os dados do Brasil a partir de fontes oficiais (rode só quando quiser atualizar os dados):
 *   npx tsx scripts/geo-fetch.ts <caminho do municipios-br.sqlite>
 *
 * Fontes:
 * - IBGE, Censo Demográfico 2022, SIDRA tabela 9605 (população residente por cor ou raça, por UF):
 *   https://apisidra.ibge.gov.br/values/t/9605/n3/all/v/93/p/2022/c86/allxt
 * - IBGE, Censo 2022, população e rendimento médio por município, via pacote npm `municipios-br@3.2.1`
 *   (banco SQLite com dados do IBGE; baixe com `npm pack municipios-br@3.2.1`).
 * - IBGE, API "Nomes no Brasil" (Censo 2010), ranking por década de nascimento, sexo e UF:
 *   https://servicodados.ibge.gov.br/api/v2/censos/nomes/ranking
 * Grava src/content/geo/brasil/data.generated.ts e src/content/names/ibgeNames.generated.ts.
 */
import { writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const DB = process.argv[2];
if (!DB) throw new Error('uso: npx tsx scripts/geo-fetch.ts <municipios-br.sqlite>');
const today = new Date().toISOString().slice(0, 10);

async function json(url: string): Promise<unknown> {
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url);
    if (r.ok) return r.json();
    await new Promise((res) => setTimeout(res, 1000 * (i + 1)));
  }
  throw new Error(`falhou: ${url}`);
}

// ---- cor ou raça por UF (SIDRA 9605) ----
const RACE_KEY: Record<string, string> = { Branca: 'branca', Preta: 'preta', Parda: 'parda', Amarela: 'amarela', 'Indígena': 'indigena' };
const sidra = (await json('https://apisidra.ibge.gov.br/values/t/9605/n3/all/v/93/p/2022/c86/allxt')) as Record<string, string>[];
const raceByUfCode: Record<string, Record<string, number>> = {};
for (const row of sidra.slice(1)) {
  const k = RACE_KEY[row.D4N!];
  if (!k) continue;
  (raceByUfCode[row.D1C!] ??= {})[k] = Number(row.V);
}

// ---- municípios (Censo 2022) ----
const db = new DatabaseSync(DB, { readOnly: true });
type Mun = { ibge_code: number; name: string; uf: string; uf_name: string; region_name: string; populacao_2022: number; capital: number; pib_per_capita: number | null };
const muns = db.prepare('select ibge_code, name, uf, uf_name, region_name, populacao_2022, capital, pib_per_capita from municipios').all() as unknown as Mun[];
const byUf = new Map<string, Mun[]>();
for (const m of muns) (byUf.get(m.uf) ?? byUf.set(m.uf, []).get(m.uf)!).push(m);
const natPib = muns.reduce((t, m) => t + (m.pib_per_capita ?? 0) * m.populacao_2022, 0) / muns.reduce((t, m) => t + (m.pib_per_capita ? m.populacao_2022 : 0), 0);
// custo de vida DO JOGO: derivado do PIB per capita do município (IBGE) relativo à média nacional ponderada,
// comprimido (raiz quadrada) para 0,8–1,35. Não é um índice oficial de custo de vida.
const cost = (m: Mun) => (m.pib_per_capita ? Math.round(Math.min(1.35, Math.max(0.8, 0.6 + 0.4 * Math.sqrt(m.pib_per_capita / natPib))) * 100) / 100 : 1);

const ufs = [...byUf.entries()].map(([sigla, list]) => {
  list.sort((a, b) => b.populacao_2022 - a.populacao_2022);
  const capital = list.find((m) => m.capital === 1)!;
  const top = [capital, ...list.filter((m) => m !== capital)].slice(0, Math.min(8, list.length));
  const code = String(Math.floor(capital.ibge_code / 100000));
  const race = raceByUfCode[code]!;
  const total = Object.values(race).reduce((t, v) => t + v, 0);
  const pct = Object.fromEntries(Object.entries(race).map(([k, v]) => [k, Math.round((v / total) * 10000) / 100]));
  return {
    sigla,
    nome: capital.uf_name,
    regiao: capital.region_name,
    ibge: Number(code),
    populacao: total,
    populacaoMunicipios: list.reduce((t, m) => t + m.populacao_2022, 0),
    capital: capital.name,
    cities: top.map((m) => ({ name: m.name, populacao: m.populacao_2022, custo: cost(m) })),
    corRaca: pct,
  };
}).sort((a, b) => a.ibge - b.ibge);

writeFileSync(
  'src/content/geo/brasil/data.generated.ts',
  `/**
 * GERADO por scripts/geo-fetch.ts em ${today} — não edite à mão.
 * Fontes:
 * - Cor ou raça e população por UF: IBGE, Censo Demográfico 2022, SIDRA tabela 9605
 *   (https://sidra.ibge.gov.br/tabela/9605), variável 93 "População residente". Percentuais = categoria / soma das 5 categorias.
 * - Cidades e população: IBGE, Censo 2022, por município (via pacote municipios-br@3.2.1). Capital + maiores cidades da UF.
 * - custo: multiplicador DO JOGO derivado do PIB per capita do município (IBGE) relativo à média nacional
 *   (raiz quadrada, limitado a 0,8–1,35). Não é um índice oficial de custo de vida.
 */
export const UF_DATA = ${JSON.stringify(ufs, null, 1)} as const;
`,
);
console.log('UFs:', ufs.length, ufs.map((u) => `${u.sigla}:${u.cities.length}`).join(' '));

if (process.argv.includes('--sem-nomes')) process.exit(0);
// ---- nomes (Censo 2010, API de nomes) ----
const DECADES = [1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000];
type Rank = { localidade: string; res: { nome: string; frequencia: number }[] }[];
const national: Record<string, Record<string, [string, number][]>> = { M: {}, F: {} };
for (const sexo of ['M', 'F'] as const) {
  for (const d of DECADES) {
    const r = (await json(`https://servicodados.ibge.gov.br/api/v2/censos/nomes/ranking?decada=${d}&sexo=${sexo}`)) as Rank;
    national[sexo]![d] = r[0]!.res.map((x) => [x.nome, x.frequencia]);
  }
}
const REG_DECADES = [1960, 1980, 2000];
const regional: Record<string, Record<string, Record<string, [string, number][]>>> = {};
for (const u of ufs) {
  for (const sexo of ['M', 'F'] as const) {
    for (const d of REG_DECADES) {
      const r = (await json(`https://servicodados.ibge.gov.br/api/v2/censos/nomes/ranking?decada=${d}&sexo=${sexo}&localidade=${u.ibge}`)) as Rank;
      const bucket = (((regional[u.regiao] ??= {})[sexo] ??= {})[d] ??= []);
      for (const x of r[0]!.res) {
        const e = bucket.find((b) => b[0] === x.nome);
        if (e) e[1] += x.frequencia;
        else bucket.push([x.nome, x.frequencia]);
      }
    }
  }
}
for (const reg of Object.values(regional)) for (const sx of Object.values(reg)) for (const [d, list] of Object.entries(sx)) sx[d] = list.sort((a, b) => b[1] - a[1]).slice(0, 25);
writeFileSync(
  'tmp/ibge-names-raw.json',
  JSON.stringify({ national, regional }),
);
console.log('nomes ok; únicos:', new Set([...Object.values(national.M!), ...Object.values(national.F!)].flat().map((x) => x[0])).size);
