import type { FootballClubDef, FootballLeagueDef } from '../../engine';

/**
 * Futebol (release 0.0.4, fase 6). Tudo fictício: nenhum nome, apelido, escudo, mascote ou patrocinador real.
 * Regras checadas por `tests/football.test.ts`:
 * - nenhum nome da lista de clubes e apelidos reais;
 * - nenhum clube fictício com a mesma cidade e as mesmas cores de um clube real da lista;
 * - no máximo 2 clubes da Divisão A por cidade.
 * `power` é a força base (0–100) do elenco; a força do ano varia em torno dela.
 */
const A = (id: string, name: string, city: string, uf: string, colors: [string, string], colorNames: string, mascot: string, power: number): FootballClubDef =>
  ({ id, name, city, uf, colors, colorNames, mascot, division: 'A', power });
const B = (id: string, name: string, city: string, uf: string, colors: [string, string], colorNames: string, mascot: string, power: number): FootballClubDef =>
  ({ id, name, city, uf, colors, colorNames, mascot, division: 'B', power });

export const DIVISION_A: readonly FootballClubDef[] = [
  A('litoraneo', 'Atlético Litorâneo', 'Rio de Janeiro', 'RJ', ['#f97316', '#1d4ed8'], 'laranja e azul', 'o Tubarão-Martelo', 80),
  A('guanabara', 'União Guanabara', 'Rio de Janeiro', 'RJ', ['#7c3aed', '#ffffff'], 'roxo e branco', 'a Gaivota Atrevida', 76),
  A('metropole', 'Metrópole FC', 'São Paulo', 'SP', ['#ea580c', '#111827'], 'laranja e preto', 'o Arranha-Céu', 81),
  A('garoa', 'Garoa FC', 'São Paulo', 'SP', ['#6d28d9', '#facc15'], 'roxo e amarelo', 'o Guarda-Chuva', 77),
  A('serrano', 'Clube Serrano', 'Belo Horizonte', 'MG', ['#7f1d1d', '#d4a017'], 'vinho e dourado', 'o Pão de Queijo Valente', 78),
  A('pampa', 'Associação Pampa', 'Porto Alegre', 'RS', ['#15803d', '#f97316'], 'verde e laranja', 'o Chimarrão Fumegante', 77),
  A('pinheiral', 'Pinheiral FC', 'Curitiba', 'PR', ['#38bdf8', '#6b7280'], 'azul-celeste e cinza', 'a Gralha-Azul', 74),
  A('barravento', 'Barravento EC', 'Salvador', 'BA', ['#14b8a6', '#ffffff'], 'turquesa e branco', 'o Acarajé de Ouro', 75),
  A('frevo', 'Frevo FC', 'Recife', 'PE', ['#facc15', '#7e22ce'], 'amarelo e roxo', 'a Sombrinha de Frevo', 73),
  A('jangada', 'Jangada AC', 'Fortaleza', 'CE', ['#2dd4bf', '#f97316'], 'verde-água e laranja', 'o Jangadeiro', 74),
  A('ipe_roxo', 'Ipê Roxo FC', 'Goiânia', 'GO', ['#9333ea', '#16a34a'], 'roxo e verde', 'o Pequi Espinhento', 70),
  A('igarape', 'Igarapé FC', 'Manaus', 'AM', ['#22c55e', '#fb923c'], 'verde e laranja', 'o Peixe-Boi', 68),
  A('acai', 'Açaí FC', 'Belém', 'PA', ['#581c87', '#ffffff'], 'roxo e branco', 'o Açaí Parrudo', 69),
  A('bicicleta', 'Bicicleta FC', 'Joinville', 'SC', ['#16a34a', '#facc15'], 'verde e amarelo', 'a Bicicleta Voadora', 70),
  A('cafezal', 'Sociedade Esportiva Cafezal', 'Campinas', 'SP', ['#78350f', '#fef3c7'], 'marrom e creme', 'o Grão Ligeiro', 72),
  A('candango', 'Candango FC', 'Brasília', 'DF', ['#facc15', '#1e40af'], 'amarelo e azul', 'o Ipê Amarelo', 71),
  A('dunas', 'Dunas FC', 'Natal', 'RN', ['#fb923c', '#ffffff'], 'laranja e branco', 'o Buggy', 67),
  A('tuiuiu', 'Tuiuiú AC', 'Cuiabá', 'MT', ['#dc2626', '#1d4ed8'], 'vermelho e azul', 'o Tuiuiú', 66),
  A('moqueca', 'Moqueca EC', 'Vitória', 'ES', ['#a3e635', '#111827'], 'verde-limão e preto', 'a Panela de Barro', 66),
  A('bumba', 'Bumba FC', 'São Luís', 'MA', ['#ec4899', '#2563eb'], 'rosa e azul', 'o Boi-Bumbá', 65),
];

export const DIVISION_B: readonly FootballClubDef[] = [
  B('vinicola', 'Vinícola EC', 'Caxias do Sul', 'RS', ['#7e22ce', '#bef264'], 'roxo e verde-claro', 'a Uva Marrenta', 64),
  B('ilheu', 'CA Ilhéu', 'Florianópolis', 'SC', ['#f97316', '#7dd3fc'], 'laranja e azul-claro', 'a Tainha Voadora', 63),
  B('manezinho', 'Manezinho FC', 'Florianópolis', 'SC', ['#ec4899', '#111827'], 'rosa e preto', 'o Boi-de-Mamão', 61),
  B('carvoeiro', 'Carvoeiro EC', 'Criciúma', 'SC', ['#6b7280', '#f97316'], 'cinza e laranja', 'o Capacete de Mineiro', 62),
  B('araguaia', 'Araguaia EC', 'Palmas', 'TO', ['#15803d', '#fb923c'], 'verde e laranja', 'o Boto do Araguaia', 58),
  B('pampulha', 'EC Pampulha', 'Belo Horizonte', 'MG', ['#7dd3fc', '#facc15'], 'azul-claro e amarelo', 'a Garça da Lagoa', 63),
  B('marajo', 'SE Marajó', 'Belém', 'PA', ['#111827', '#f97316'], 'preto e laranja', 'o Búfalo Marajoara', 60),
  B('ver_o_peso', 'EC Ver-o-Peso', 'Belém', 'PA', ['#16a34a', '#7e22ce'], 'verde e roxo', 'a Balança do Mercado', 59),
  B('sururu', 'Clube Sururu', 'Maceió', 'AL', ['#f97316', '#16a34a'], 'laranja e verde', 'o Sururu', 60),
  B('xareu', 'Xaréu FC', 'Natal', 'RN', ['#1e3a8a', '#facc15'], 'azul-marinho e amarelo', 'o Xaréu', 58),
  B('lencois', 'Lençóis AC', 'São Luís', 'MA', ['#ffffff', '#14b8a6'], 'branco e turquesa', 'a Duna Andante', 57),
  B('pamonha', 'Pamonha Atlético', 'Goiânia', 'GO', ['#facc15', '#78350f'], 'amarelo e marrom', 'a Pamonha de Sal', 61),
  B('canavial', 'Canavial EC', 'Ribeirão Preto', 'SP', ['#a3e635', '#78350f'], 'verde-limão e marrom', 'o Calango do Canavial', 62),
  B('linguiceira', 'SE Linguiceira', 'Bragança Paulista', 'SP', ['#fb923c', '#15803d'], 'laranja e verde', 'a Linguiça Campeã', 60),
  B('encontro_aguas', 'CA Encontro das Águas', 'Manaus', 'AM', ['#111827', '#d6c7a1'], 'preto e bege', 'o Boto-Cor-de-Rosa', 59),
  B('planalto', 'Planalto EC', 'Brasília', 'DF', ['#6b7280', '#dc2626'], 'cinza e vermelho', 'o Lobo-Guará', 61),
  B('forro', 'Forró Clube de Campina', 'Campina Grande', 'PB', ['#f97316', '#2563eb'], 'laranja e azul', 'a Sanfona', 58),
  B('pinhao', 'Pinhão AC', 'Curitiba', 'PR', ['#14532d', '#facc15'], 'verde-escuro e amarelo', 'o Pinhão Furioso', 62),
  B('cacau', 'Cacau FC', 'Ilhéus', 'BA', ['#78350f', '#facc15'], 'marrom e amarelo', 'o Fruto do Cacau', 57),
  B('uirapuru', 'Uirapuru EC', 'Porto Velho', 'RO', ['#16a34a', '#dc2626'], 'verde e vermelho', 'o Uirapuru', 56),
];

/** Divisões C e D: prefixo genérico + lugar inventado (cidades fictícias do interior). */
const PREFIXES = ['Associação Esportiva', 'União', 'Sociedade Recreativa', 'Esporte Clube', 'Atlético', 'Clube Recreativo', 'Associação Atlética', 'Recreativo'];
const PLACES = [
  'Vale do Junco', 'Serra Alta', 'Porto das Garças', 'Campo Verde do Sul', 'Ribeirão das Pedras', 'Lagoa Serena', 'Morro do Vento',
  'Barra do Sossego', 'Pedra Branca do Norte', 'Riacho Fundo do Leste', 'Vila dos Cajueiros', 'Ponte Velha', 'Cachoeira Mansa',
  'Arraial dos Coqueiros', 'Chapada do Sol', 'Várzea Grande do Oeste', 'Engenho Novo da Serra', 'Mata Escura do Sul', 'Ilha dos Sabiás',
  'Ventania do Norte', 'Rio Manso', 'Capão das Paineiras', 'Brejo Alegre', 'Pau-Brasil do Leste', 'Areia Dourada', 'Boa Esperança da Serra',
  'Santo Antônio do Ribeirão', 'Três Lagoas do Norte', 'Bom Jardim do Vale', 'Alvorada do Rio', 'Monte Sereno', 'Pindorama do Sul',
  'Nova Aurora', 'Campo Limpo do Norte', 'Ouro Fino do Vale', 'Jatobá', 'Piracema', 'Cajuru do Oeste', 'Taquaral', 'Juriti',
];
const PALETTE: [string, string, string][] = [
  ['#0ea5e9', '#f8fafc', 'azul e branco'], ['#b91c1c', '#facc15', 'vermelho e amarelo'], ['#166534', '#f8fafc', 'verde e branco'],
  ['#7c2d12', '#fde68a', 'marrom e amarelo'], ['#4c1d95', '#f97316', 'roxo e laranja'], ['#0f766e', '#111827', 'verde-petróleo e preto'],
  ['#be185d', '#f8fafc', 'pink e branco'], ['#1e3a8a', '#dc2626', 'azul e vermelho'],
];
const lower = (division: 'C' | 'D', offset: number, base: number): FootballClubDef[] =>
  Array.from({ length: 20 }, (_, i) => {
    const place = PLACES[offset + i]!;
    const [c1, c2, names] = PALETTE[(offset + i) % PALETTE.length]!;
    return {
      id: `${division.toLowerCase()}_${place.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, '_')}`,
      name: `${PREFIXES[(offset + i) % PREFIXES.length]} ${place}`,
      city: place,
      uf: '',
      colors: [c1, c2],
      colorNames: names,
      mascot: 'o Mascote da Cidade',
      division,
      power: base - (i % 7),
    };
  });

export const DIVISION_C = lower('C', 0, 54);
export const DIVISION_D = lower('D', 20, 46);

/** Ligas estrangeiras fictícias, com clubes de nomes inventados. */
const L = (id: string, name: string, region: string, clubs: string[], power: number, salaryMult: number): FootballLeagueDef => ({
  id, name, region, salaryMult,
  clubs: clubs.map((n, i) => ({ id: `${id}_${i}`, name: n, city: region, uf: '', colors: ['#334155', '#e2e8f0'], colorNames: 'cinza e branco', mascot: '', division: 'X', power: power - i * 2 })),
});

export const FOREIGN_LEAGUES: readonly FootballLeagueDef[] = [
  L('iberica', 'Liga Ibérica', 'Europa', ['Real Mirador', 'Atlético Olivar', 'Unión Costa Brava', 'Sporting Ribeira', 'CD Meseta', 'Deportivo Faro'], 88, 6),
  L('canal', 'Liga do Canal', 'Europa', ['Kingsbridge United', 'Northgate Rovers', 'Harbor City', 'Westmoor Athletic', 'Redcliff Town', 'Bellwater FC'], 89, 7),
  L('alpina', 'Liga Alpina', 'Europa', ['FC Edelweiss', 'Bergtal 04', 'Sporting Lago Azzurro', 'AS Valle Verde', 'Glacier SC', 'Union Tannenwald'], 86, 5),
  L('sol_nascente', 'Liga do Sol Nascente', 'Ásia', ['Sakura Wings', 'Harbor Dragons Yokoura', 'Seaside Mariners', 'Mount Fuyu FC', 'Neon Bay United', 'Lantern City'], 76, 3),
  L('golfo', 'Liga do Golfo', 'Oriente Médio', ['Al Sahra FC', 'Desert Falcons', 'Oasis United', 'Pearl Coast SC', 'Dune Riders', 'Crescent Bay'], 75, 6),
  L('duas_costas', 'Liga das Duas Costas', 'Estados Unidos', ['Pacific Breakers', 'Atlantic Comets', 'Prairie Thunder', 'Bayou Pelicans', 'Desert Suns', 'Lakeshore Anchors'], 74, 4),
];

export const COMPETITIONS = {
  nacional: 'Campeonato Nacional',
  copa: 'Copa Nacional',
  continental: 'Copa Condor',
  premio: 'Troféu Craque do Ano',
  selecao: 'Seleção Nacional',
  estadual: 'Estadual',
} as const;
