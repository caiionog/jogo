/**
 * GERADO por scripts/geo-fetch.ts em 2026-11-22 — não edite à mão.
 * Fontes:
 * - Cor ou raça e população por UF: IBGE, Censo Demográfico 2022, SIDRA tabela 9605
 *   (https://sidra.ibge.gov.br/tabela/9605), variável 93 "População residente". Percentuais = categoria / soma das 5 categorias.
 * - Cidades e população: IBGE, Censo 2022, por município (via pacote municipios-br@3.2.1). Capital + maiores cidades da UF.
 * - custo: multiplicador DO JOGO derivado do PIB per capita do município (IBGE) relativo à média nacional
 *   (raiz quadrada, limitado a 0,8–1,35). Não é um índice oficial de custo de vida.
 */
export const UF_DATA = [
 {
  "sigla": "RO",
  "nome": "Rondônia",
  "regiao": "Norte",
  "ibge": 11,
  "populacao": 1581159,
  "populacaoMunicipios": 1581196,
  "capital": "Porto Velho",
  "cities": [
   {
    "name": "Porto Velho",
    "populacao": 460434,
    "custo": 1
   },
   {
    "name": "Ji-Paraná",
    "populacao": 124333,
    "custo": 0.97
   },
   {
    "name": "Ariquemes",
    "populacao": 96833,
    "custo": 0.97
   },
   {
    "name": "Vilhena",
    "populacao": 95832,
    "custo": 1
   },
   {
    "name": "Cacoal",
    "populacao": 86887,
    "custo": 0.96
   },
   {
    "name": "Rolim de Moura",
    "populacao": 56406,
    "custo": 0.95
   },
   {
    "name": "Jaru",
    "populacao": 50591,
    "custo": 0.98
   },
   {
    "name": "Guajará-Mirim",
    "populacao": 39387,
    "custo": 0.89
   }
  ],
  "corRaca": {
   "branca": 30.74,
   "preta": 8.65,
   "amarela": 0.27,
   "parda": 59.24,
   "indigena": 1.09
  }
 },
 {
  "sigla": "AC",
  "nome": "Acre",
  "regiao": "Norte",
  "ibge": 12,
  "populacao": 830008,
  "populacaoMunicipios": 830018,
  "capital": "Rio Branco",
  "cities": [
   {
    "name": "Rio Branco",
    "populacao": 364756,
    "custo": 0.92
   },
   {
    "name": "Cruzeiro do Sul",
    "populacao": 91888,
    "custo": 0.89
   },
   {
    "name": "Tarauacá",
    "populacao": 43467,
    "custo": 0.85
   },
   {
    "name": "Sena Madureira",
    "populacao": 41343,
    "custo": 0.86
   },
   {
    "name": "Feijó",
    "populacao": 35426,
    "custo": 0.85
   },
   {
    "name": "Brasiléia",
    "populacao": 26000,
    "custo": 0.93
   },
   {
    "name": "Senador Guiomard",
    "populacao": 21454,
    "custo": 0.99
   },
   {
    "name": "Mâncio Lima",
    "populacao": 19294,
    "custo": 0.83
   }
  ],
  "corRaca": {
   "branca": 21.44,
   "preta": 8.56,
   "amarela": 0.23,
   "parda": 66.25,
   "indigena": 3.51
  }
 },
 {
  "sigla": "AM",
  "nome": "Amazonas",
  "regiao": "Norte",
  "ibge": 13,
  "populacao": 3941498,
  "populacaoMunicipios": 3941613,
  "capital": "Manaus",
  "cities": [
   {
    "name": "Manaus",
    "populacao": 2063689,
    "custo": 1.03
   },
   {
    "name": "Itacoatiara",
    "populacao": 103598,
    "custo": 0.91
   },
   {
    "name": "Manacapuru",
    "populacao": 101883,
    "custo": 0.84
   },
   {
    "name": "Parintins",
    "populacao": 96372,
    "custo": 0.83
   },
   {
    "name": "Tefé",
    "populacao": 73669,
    "custo": 0.86
   },
   {
    "name": "Coari",
    "populacao": 70616,
    "custo": 1
   },
   {
    "name": "Tabatinga",
    "populacao": 66764,
    "custo": 0.8
   },
   {
    "name": "Maués",
    "populacao": 61204,
    "custo": 0.8
   }
  ],
  "corRaca": {
   "branca": 18.39,
   "preta": 4.91,
   "amarela": 0.15,
   "parda": 68.8,
   "indigena": 7.74
  }
 },
 {
  "sigla": "RR",
  "nome": "Roraima",
  "regiao": "Norte",
  "ibge": 14,
  "populacao": 635615,
  "populacaoMunicipios": 636707,
  "capital": "Boa Vista",
  "cities": [
   {
    "name": "Boa Vista",
    "populacao": 413486,
    "custo": 0.96
   },
   {
    "name": "Rorainópolis",
    "populacao": 32647,
    "custo": 0.9
   },
   {
    "name": "Alto Alegre",
    "populacao": 21096,
    "custo": 0.94
   },
   {
    "name": "Caracaraí",
    "populacao": 20957,
    "custo": 0.9
   },
   {
    "name": "Pacaraima",
    "populacao": 19305,
    "custo": 0.86
   },
   {
    "name": "Cantá",
    "populacao": 18682,
    "custo": 0.88
   },
   {
    "name": "Mucajaí",
    "populacao": 18095,
    "custo": 0.9
   },
   {
    "name": "Normandia",
    "populacao": 13986,
    "custo": 0.88
   }
  ],
  "corRaca": {
   "branca": 20.65,
   "preta": 7.74,
   "amarela": 0.12,
   "parda": 57.35,
   "indigena": 14.14
  }
 },
 {
  "sigla": "PA",
  "nome": "Pará",
  "regiao": "Norte",
  "ibge": 15,
  "populacao": 8118960,
  "populacaoMunicipios": 8120131,
  "capital": "Belém",
  "cities": [
   {
    "name": "Belém",
    "populacao": 1303403,
    "custo": 0.9
   },
   {
    "name": "Ananindeua",
    "populacao": 478778,
    "custo": 0.87
   },
   {
    "name": "Santarém",
    "populacao": 331942,
    "custo": 0.88
   },
   {
    "name": "Parauapebas",
    "populacao": 267836,
    "custo": 1.14
   },
   {
    "name": "Marabá",
    "populacao": 266533,
    "custo": 0.93
   },
   {
    "name": "Castanhal",
    "populacao": 192256,
    "custo": 0.91
   },
   {
    "name": "Abaetetuba",
    "populacao": 158188,
    "custo": 0.81
   },
   {
    "name": "Cametá",
    "populacao": 134184,
    "custo": 0.81
   }
  ],
  "corRaca": {
   "branca": 19.34,
   "preta": 9.77,
   "amarela": 0.15,
   "parda": 69.88,
   "indigena": 0.85
  }
 },
 {
  "sigla": "AP",
  "nome": "Amapá",
  "regiao": "Norte",
  "ibge": 16,
  "populacao": 733747,
  "populacaoMunicipios": 733759,
  "capital": "Macapá",
  "cities": [
   {
    "name": "Macapá",
    "populacao": 442933,
    "custo": 0.95
   },
   {
    "name": "Santana",
    "populacao": 107618,
    "custo": 0.92
   },
   {
    "name": "Laranjal do Jari",
    "populacao": 35114,
    "custo": 0.94
   },
   {
    "name": "Oiapoque",
    "populacao": 27482,
    "custo": 0.9
   },
   {
    "name": "Mazagão",
    "populacao": 21924,
    "custo": 0.88
   },
   {
    "name": "Porto Grande",
    "populacao": 17848,
    "custo": 0.9
   },
   {
    "name": "Tartarugalzinho",
    "populacao": 12945,
    "custo": 0.87
   },
   {
    "name": "Pedra Branca do Amapari",
    "populacao": 12847,
    "custo": 0.89
   }
  ],
  "corRaca": {
   "branca": 21.4,
   "preta": 11.81,
   "amarela": 0.1,
   "parda": 65.28,
   "indigena": 1.41
  }
 },
 {
  "sigla": "TO",
  "nome": "Tocantins",
  "regiao": "Norte",
  "ibge": 17,
  "populacao": 1511407,
  "populacaoMunicipios": 1511460,
  "capital": "Palmas",
  "cities": [
   {
    "name": "Palmas",
    "populacao": 302692,
    "custo": 0.97
   },
   {
    "name": "Araguaína",
    "populacao": 171301,
    "custo": 0.96
   },
   {
    "name": "Gurupi",
    "populacao": 85125,
    "custo": 0.96
   },
   {
    "name": "Porto Nacional",
    "populacao": 64418,
    "custo": 0.98
   },
   {
    "name": "Paraíso do Tocantins",
    "populacao": 52360,
    "custo": 0.96
   },
   {
    "name": "Colinas do Tocantins",
    "populacao": 34233,
    "custo": 0.92
   },
   {
    "name": "Araguatins",
    "populacao": 31918,
    "custo": 0.84
   },
   {
    "name": "Guaraí",
    "populacao": 24775,
    "custo": 0.97
   }
  ],
  "corRaca": {
   "branca": 23.2,
   "preta": 13.19,
   "amarela": 0.23,
   "parda": 62.14,
   "indigena": 1.24
  }
 },
 {
  "sigla": "MA",
  "nome": "Maranhão",
  "regiao": "Nordeste",
  "ibge": 21,
  "populacao": 6776530,
  "populacaoMunicipios": 6776699,
  "capital": "São Luís",
  "cities": [
   {
    "name": "São Luís",
    "populacao": 1037775,
    "custo": 0.95
   },
   {
    "name": "Imperatriz",
    "populacao": 273110,
    "custo": 0.92
   },
   {
    "name": "São José de Ribamar",
    "populacao": 244579,
    "custo": 0.8
   },
   {
    "name": "Timon",
    "populacao": 174465,
    "custo": 0.82
   },
   {
    "name": "Caxias",
    "populacao": 156973,
    "custo": 0.83
   },
   {
    "name": "Paço do Lumiar",
    "populacao": 145643,
    "custo": 0.8
   },
   {
    "name": "Codó",
    "populacao": 114275,
    "custo": 0.82
   },
   {
    "name": "Açailândia",
    "populacao": 106550,
    "custo": 0.95
   }
  ],
  "corRaca": {
   "branca": 20.1,
   "preta": 12.61,
   "amarela": 0.1,
   "parda": 66.39,
   "indigena": 0.81
  }
 },
 {
  "sigla": "PI",
  "nome": "Piauí",
  "regiao": "Nordeste",
  "ibge": 22,
  "populacao": 3271140,
  "populacaoMunicipios": 3271199,
  "capital": "Teresina",
  "cities": [
   {
    "name": "Teresina",
    "populacao": 866300,
    "custo": 0.92
   },
   {
    "name": "Parnaíba",
    "populacao": 162159,
    "custo": 0.86
   },
   {
    "name": "Picos",
    "populacao": 83090,
    "custo": 0.9
   },
   {
    "name": "Piripiri",
    "populacao": 65538,
    "custo": 0.84
   },
   {
    "name": "Floriano",
    "populacao": 62036,
    "custo": 0.88
   },
   {
    "name": "Barras",
    "populacao": 47938,
    "custo": 0.8
   },
   {
    "name": "Altos",
    "populacao": 47453,
    "custo": 0.82
   },
   {
    "name": "União",
    "populacao": 46119,
    "custo": 0.8
   }
  ],
  "corRaca": {
   "branca": 22.63,
   "preta": 12.25,
   "amarela": 0.09,
   "parda": 64.84,
   "indigena": 0.19
  }
 },
 {
  "sigla": "CE",
  "nome": "Ceará",
  "regiao": "Nordeste",
  "ibge": 23,
  "populacao": 8794119,
  "populacaoMunicipios": 8794957,
  "capital": "Fortaleza",
  "cities": [
   {
    "name": "Fortaleza",
    "populacao": 2428708,
    "custo": 0.93
   },
   {
    "name": "Caucaia",
    "populacao": 355679,
    "custo": 0.89
   },
   {
    "name": "Juazeiro do Norte",
    "populacao": 286120,
    "custo": 0.86
   },
   {
    "name": "Maracanaú",
    "populacao": 234509,
    "custo": 1.01
   },
   {
    "name": "Sobral",
    "populacao": 203023,
    "custo": 0.91
   },
   {
    "name": "Itapipoca",
    "populacao": 131123,
    "custo": 0.84
   },
   {
    "name": "Crato",
    "populacao": 131050,
    "custo": 0.84
   },
   {
    "name": "Maranguape",
    "populacao": 105093,
    "custo": 0.84
   }
  ],
  "corRaca": {
   "branca": 27.93,
   "preta": 6.77,
   "amarela": 0.13,
   "parda": 64.71,
   "indigena": 0.45
  }
 },
 {
  "sigla": "RN",
  "nome": "Rio Grande do Norte",
  "regiao": "Nordeste",
  "ibge": 24,
  "populacao": 3302648,
  "populacaoMunicipios": 3302729,
  "capital": "Natal",
  "cities": [
   {
    "name": "Natal",
    "populacao": 751300,
    "custo": 0.95
   },
   {
    "name": "Mossoró",
    "populacao": 264577,
    "custo": 0.94
   },
   {
    "name": "Parnamirim",
    "populacao": 252716,
    "custo": 0.9
   },
   {
    "name": "São Gonçalo do Amarante",
    "populacao": 115838,
    "custo": 0.86
   },
   {
    "name": "Macaíba",
    "populacao": 82249,
    "custo": 0.9
   },
   {
    "name": "Ceará-Mirim",
    "populacao": 79115,
    "custo": 0.82
   },
   {
    "name": "Extremoz",
    "populacao": 61635,
    "custo": 0.82
   },
   {
    "name": "Caicó",
    "populacao": 61146,
    "custo": 0.89
   }
  ],
  "corRaca": {
   "branca": 39.49,
   "preta": 9.17,
   "amarela": 0.16,
   "parda": 50.9,
   "indigena": 0.28
  }
 },
 {
  "sigla": "PB",
  "nome": "Paraíba",
  "regiao": "Nordeste",
  "ibge": 25,
  "populacao": 3974620,
  "populacaoMunicipios": 3974687,
  "capital": "João Pessoa",
  "cities": [
   {
    "name": "João Pessoa",
    "populacao": 833932,
    "custo": 0.92
   },
   {
    "name": "Campina Grande",
    "populacao": 419379,
    "custo": 0.9
   },
   {
    "name": "Santa Rita",
    "populacao": 149910,
    "custo": 0.85
   },
   {
    "name": "Patos",
    "populacao": 103165,
    "custo": 0.87
   },
   {
    "name": "Bayeux",
    "populacao": 82742,
    "custo": 0.86
   },
   {
    "name": "Sousa",
    "populacao": 67259,
    "custo": 0.88
   },
   {
    "name": "Cabedelo",
    "populacao": 66519,
    "custo": 1.03
   },
   {
    "name": "Cajazeiras",
    "populacao": 63239,
    "custo": 0.89
   }
  ],
  "corRaca": {
   "branca": 35.72,
   "preta": 7.96,
   "amarela": 0.12,
   "parda": 55.55,
   "indigena": 0.64
  }
 },
 {
  "sigla": "PE",
  "nome": "Pernambuco",
  "regiao": "Nordeste",
  "ibge": 26,
  "populacao": 9057167,
  "populacaoMunicipios": 9058931,
  "capital": "Recife",
  "cities": [
   {
    "name": "Recife",
    "populacao": 1488920,
    "custo": 0.96
   },
   {
    "name": "Jaboatão dos Guararapes",
    "populacao": 644037,
    "custo": 0.91
   },
   {
    "name": "Petrolina",
    "populacao": 386791,
    "custo": 0.88
   },
   {
    "name": "Caruaru",
    "populacao": 378048,
    "custo": 0.9
   },
   {
    "name": "Olinda",
    "populacao": 349976,
    "custo": 0.84
   },
   {
    "name": "Paulista",
    "populacao": 342167,
    "custo": 0.85
   },
   {
    "name": "Cabo de Santo Agostinho",
    "populacao": 203440,
    "custo": 1.08
   },
   {
    "name": "Camaragibe",
    "populacao": 147771,
    "custo": 0.82
   }
  ],
  "corRaca": {
   "branca": 33.61,
   "preta": 10.04,
   "amarela": 0.15,
   "parda": 55.28,
   "indigena": 0.92
  }
 },
 {
  "sigla": "AL",
  "nome": "Alagoas",
  "regiao": "Nordeste",
  "ibge": 27,
  "populacao": 3127574,
  "populacaoMunicipios": 3127683,
  "capital": "Maceió",
  "cities": [
   {
    "name": "Maceió",
    "populacao": 957916,
    "custo": 0.92
   },
   {
    "name": "Arapiraca",
    "populacao": 234696,
    "custo": 0.9
   },
   {
    "name": "Rio Largo",
    "populacao": 93927,
    "custo": 0.85
   },
   {
    "name": "Palmeira dos Índios",
    "populacao": 71574,
    "custo": 0.84
   },
   {
    "name": "Marechal Deodoro",
    "populacao": 60370,
    "custo": 1
   },
   {
    "name": "União dos Palmares",
    "populacao": 59280,
    "custo": 0.89
   },
   {
    "name": "Penedo",
    "populacao": 58650,
    "custo": 0.84
   },
   {
    "name": "São Miguel dos Campos",
    "populacao": 51990,
    "custo": 0.9
   }
  ],
  "corRaca": {
   "branca": 29.27,
   "preta": 9.55,
   "amarela": 0.18,
   "parda": 60.36,
   "indigena": 0.64
  }
 },
 {
  "sigla": "SE",
  "nome": "Sergipe",
  "regiao": "Nordeste",
  "ibge": 28,
  "populacao": 2209930,
  "populacaoMunicipios": 2210004,
  "capital": "Aracaju",
  "cities": [
   {
    "name": "Aracaju",
    "populacao": 602757,
    "custo": 0.93
   },
   {
    "name": "Nossa Senhora do Socorro",
    "populacao": 192330,
    "custo": 0.81
   },
   {
    "name": "Itabaiana",
    "populacao": 103440,
    "custo": 0.89
   },
   {
    "name": "Lagarto",
    "populacao": 101579,
    "custo": 0.85
   },
   {
    "name": "São Cristóvão",
    "populacao": 95612,
    "custo": 0.81
   },
   {
    "name": "Estância",
    "populacao": 65078,
    "custo": 0.86
   },
   {
    "name": "Tobias Barreto",
    "populacao": 50905,
    "custo": 0.86
   },
   {
    "name": "Simão Dias",
    "populacao": 42578,
    "custo": 0.85
   }
  ],
  "corRaca": {
   "branca": 25.2,
   "preta": 12.85,
   "amarela": 0.13,
   "parda": 61.61,
   "indigena": 0.21
  }
 },
 {
  "sigla": "BA",
  "nome": "Bahia",
  "regiao": "Nordeste",
  "ibge": 29,
  "populacao": 14141167,
  "populacaoMunicipios": 14141626,
  "capital": "Salvador",
  "cities": [
   {
    "name": "Salvador",
    "populacao": 2417678,
    "custo": 0.91
   },
   {
    "name": "Feira de Santana",
    "populacao": 616272,
    "custo": 0.92
   },
   {
    "name": "Vitória da Conquista",
    "populacao": 370879,
    "custo": 0.92
   },
   {
    "name": "Camaçari",
    "populacao": 300372,
    "custo": 1.12
   },
   {
    "name": "Juazeiro",
    "populacao": 237821,
    "custo": 0.88
   },
   {
    "name": "Lauro de Freitas",
    "populacao": 203331,
    "custo": 0.96
   },
   {
    "name": "Itabuna",
    "populacao": 186708,
    "custo": 0.89
   },
   {
    "name": "Ilhéus",
    "populacao": 178649,
    "custo": 0.95
   }
  ],
  "corRaca": {
   "branca": 19.61,
   "preta": 22.38,
   "amarela": 0.11,
   "parda": 57.31,
   "indigena": 0.59
  }
 },
 {
  "sigla": "MG",
  "nome": "Minas Gerais",
  "regiao": "Sudeste",
  "ibge": 31,
  "populacao": 20539291,
  "populacaoMunicipios": 20539989,
  "capital": "Belo Horizonte",
  "cities": [
   {
    "name": "Belo Horizonte",
    "populacao": 2315560,
    "custo": 1.01
   },
   {
    "name": "Uberlândia",
    "populacao": 713224,
    "custo": 1.06
   },
   {
    "name": "Contagem",
    "populacao": 621863,
    "custo": 1.06
   },
   {
    "name": "Juiz de Fora",
    "populacao": 540756,
    "custo": 0.96
   },
   {
    "name": "Montes Claros",
    "populacao": 414240,
    "custo": 0.91
   },
   {
    "name": "Betim",
    "populacao": 411846,
    "custo": 1.22
   },
   {
    "name": "Uberaba",
    "populacao": 337836,
    "custo": 1.06
   },
   {
    "name": "Ribeirão das Neves",
    "populacao": 329794,
    "custo": 0.84
   }
  ],
  "corRaca": {
   "branca": 41.08,
   "preta": 11.84,
   "amarela": 0.15,
   "parda": 46.76,
   "indigena": 0.16
  }
 },
 {
  "sigla": "ES",
  "nome": "Espírito Santo",
  "regiao": "Sudeste",
  "ibge": 32,
  "populacao": 3833643,
  "populacaoMunicipios": 3833712,
  "capital": "Vitória",
  "cities": [
   {
    "name": "Vitória",
    "populacao": 322869,
    "custo": 1.11
   },
   {
    "name": "Serra",
    "populacao": 520653,
    "custo": 1.06
   },
   {
    "name": "Vila Velha",
    "populacao": 467722,
    "custo": 0.95
   },
   {
    "name": "Cariacica",
    "populacao": 353491,
    "custo": 1.01
   },
   {
    "name": "Cachoeiro de Itapemirim",
    "populacao": 185786,
    "custo": 0.95
   },
   {
    "name": "Linhares",
    "populacao": 166786,
    "custo": 1.02
   },
   {
    "name": "Guarapari",
    "populacao": 124656,
    "custo": 0.88
   },
   {
    "name": "São Mateus",
    "populacao": 123752,
    "custo": 0.92
   }
  ],
  "corRaca": {
   "branca": 38.59,
   "preta": 11.21,
   "amarela": 0.11,
   "parda": 49.79,
   "indigena": 0.3
  }
 },
 {
  "sigla": "RJ",
  "nome": "Rio de Janeiro",
  "regiao": "Sudeste",
  "ibge": 33,
  "populacao": 16054635,
  "populacaoMunicipios": 16055174,
  "capital": "Rio de Janeiro",
  "cities": [
   {
    "name": "Rio de Janeiro",
    "populacao": 6211223,
    "custo": 1.05
   },
   {
    "name": "São Gonçalo",
    "populacao": 896744,
    "custo": 0.88
   },
   {
    "name": "Duque de Caxias",
    "populacao": 808161,
    "custo": 1.11
   },
   {
    "name": "Nova Iguaçu",
    "populacao": 785867,
    "custo": 0.88
   },
   {
    "name": "Campos dos Goytacazes",
    "populacao": 483540,
    "custo": 1.11
   },
   {
    "name": "Belford Roxo",
    "populacao": 483087,
    "custo": 0.84
   },
   {
    "name": "Niterói",
    "populacao": 481749,
    "custo": 1.29
   },
   {
    "name": "São João de Meriti",
    "populacao": 440962,
    "custo": 0.88
   }
  ],
  "corRaca": {
   "branca": 41.98,
   "preta": 16.16,
   "amarela": 0.14,
   "parda": 41.62,
   "indigena": 0.1
  }
 },
 {
  "sigla": "SP",
  "nome": "São Paulo",
  "regiao": "Sudeste",
  "ibge": 35,
  "populacao": 44408746,
  "populacaoMunicipios": 44411238,
  "capital": "São Paulo",
  "cities": [
   {
    "name": "São Paulo",
    "populacao": 11451999,
    "custo": 1.13
   },
   {
    "name": "Guarulhos",
    "populacao": 1291771,
    "custo": 1.07
   },
   {
    "name": "Campinas",
    "populacao": 1139047,
    "custo": 1.09
   },
   {
    "name": "São Bernardo do Campo",
    "populacao": 810729,
    "custo": 1.11
   },
   {
    "name": "Santo André",
    "populacao": 748919,
    "custo": 0.98
   },
   {
    "name": "Osasco",
    "populacao": 728615,
    "custo": 1.3
   },
   {
    "name": "Sorocaba",
    "populacao": 723682,
    "custo": 1.09
   },
   {
    "name": "Ribeirão Preto",
    "populacao": 698642,
    "custo": 1.07
   }
  ],
  "corRaca": {
   "branca": 57.79,
   "preta": 7.99,
   "amarela": 1.16,
   "parda": 32.96,
   "indigena": 0.11
  }
 },
 {
  "sigla": "PR",
  "nome": "Paraná",
  "regiao": "Sul",
  "ibge": 41,
  "populacao": 11443994,
  "populacaoMunicipios": 11444380,
  "capital": "Curitiba",
  "cities": [
   {
    "name": "Curitiba",
    "populacao": 1773718,
    "custo": 1.05
   },
   {
    "name": "Londrina",
    "populacao": 555965,
    "custo": 0.99
   },
   {
    "name": "Maringá",
    "populacao": 409657,
    "custo": 1.05
   },
   {
    "name": "Ponta Grossa",
    "populacao": 358371,
    "custo": 1.06
   },
   {
    "name": "Cascavel",
    "populacao": 348051,
    "custo": 1
   },
   {
    "name": "São José dos Pinhais",
    "populacao": 329628,
    "custo": 1.15
   },
   {
    "name": "Foz do Iguaçu",
    "populacao": 285415,
    "custo": 1.02
   },
   {
    "name": "Colombo",
    "populacao": 232212,
    "custo": 0.91
   }
  ],
  "corRaca": {
   "branca": 64.57,
   "preta": 4.24,
   "amarela": 0.88,
   "parda": 30.06,
   "indigena": 0.24
  }
 },
 {
  "sigla": "SC",
  "nome": "Santa Catarina",
  "regiao": "Sul",
  "ibge": 42,
  "populacao": 7610178,
  "populacaoMunicipios": 7610361,
  "capital": "Florianópolis",
  "cities": [
   {
    "name": "Florianópolis",
    "populacao": 537211,
    "custo": 1.02
   },
   {
    "name": "Joinville",
    "populacao": 616317,
    "custo": 1.09
   },
   {
    "name": "Blumenau",
    "populacao": 361261,
    "custo": 1.05
   },
   {
    "name": "São José",
    "populacao": 270299,
    "custo": 1.01
   },
   {
    "name": "Itajaí",
    "populacao": 264054,
    "custo": 1.34
   },
   {
    "name": "Chapecó",
    "populacao": 254785,
    "custo": 1.05
   },
   {
    "name": "Palhoça",
    "populacao": 222598,
    "custo": 0.97
   },
   {
    "name": "Criciúma",
    "populacao": 214493,
    "custo": 1.01
   }
  ],
  "corRaca": {
   "branca": 76.29,
   "preta": 4.07,
   "amarela": 0.16,
   "parda": 19.22,
   "indigena": 0.25
  }
 },
 {
  "sigla": "RS",
  "nome": "Rio Grande do Sul",
  "regiao": "Sul",
  "ibge": 43,
  "populacao": 10882765,
  "populacaoMunicipios": 10882965,
  "capital": "Porto Alegre",
  "cities": [
   {
    "name": "Porto Alegre",
    "populacao": 1332845,
    "custo": 1.08
   },
   {
    "name": "Caxias do Sul",
    "populacao": 463501,
    "custo": 1.09
   },
   {
    "name": "Canoas",
    "populacao": 347657,
    "custo": 1.1
   },
   {
    "name": "Pelotas",
    "populacao": 325685,
    "custo": 0.94
   },
   {
    "name": "Santa Maria",
    "populacao": 271735,
    "custo": 0.95
   },
   {
    "name": "Gravataí",
    "populacao": 265074,
    "custo": 1.02
   },
   {
    "name": "Novo Hamburgo",
    "populacao": 227646,
    "custo": 0.99
   },
   {
    "name": "Viamão",
    "populacao": 224112,
    "custo": 0.87
   }
  ],
  "corRaca": {
   "branca": 78.42,
   "preta": 6.52,
   "amarela": 0.07,
   "parda": 14.67,
   "indigena": 0.31
  }
 },
 {
  "sigla": "MS",
  "nome": "Mato Grosso do Sul",
  "regiao": "Centro-Oeste",
  "ibge": 50,
  "populacao": 2756950,
  "populacaoMunicipios": 2757013,
  "capital": "Campo Grande",
  "cities": [
   {
    "name": "Campo Grande",
    "populacao": 898100,
    "custo": 0.97
   },
   {
    "name": "Dourados",
    "populacao": 243367,
    "custo": 1.1
   },
   {
    "name": "Três Lagoas",
    "populacao": 132152,
    "custo": 1.18
   },
   {
    "name": "Corumbá",
    "populacao": 96268,
    "custo": 0.96
   },
   {
    "name": "Ponta Porã",
    "populacao": 92017,
    "custo": 1.04
   },
   {
    "name": "Naviraí",
    "populacao": 50457,
    "custo": 1.06
   },
   {
    "name": "Nova Andradina",
    "populacao": 48563,
    "custo": 1.07
   },
   {
    "name": "Sidrolândia",
    "populacao": 47118,
    "custo": 1.11
   }
  ],
  "corRaca": {
   "branca": 42.38,
   "preta": 6.5,
   "amarela": 0.71,
   "parda": 46.93,
   "indigena": 3.48
  }
 },
 {
  "sigla": "MT",
  "nome": "Mato Grosso",
  "regiao": "Centro-Oeste",
  "ibge": 51,
  "populacao": 3658570,
  "populacaoMunicipios": 3664526,
  "capital": "Cuiabá",
  "cities": [
   {
    "name": "Cuiabá",
    "populacao": 650877,
    "custo": 1.02
   },
   {
    "name": "Várzea Grande",
    "populacao": 300078,
    "custo": 0.97
   },
   {
    "name": "Rondonópolis",
    "populacao": 244911,
    "custo": 1.05
   },
   {
    "name": "Sinop",
    "populacao": 196312,
    "custo": 1.02
   },
   {
    "name": "Sorriso",
    "populacao": 110635,
    "custo": 1.21
   },
   {
    "name": "Tangará da Serra",
    "populacao": 106434,
    "custo": 1
   },
   {
    "name": "Cáceres",
    "populacao": 89681,
    "custo": 0.9
   },
   {
    "name": "Primavera do Leste",
    "populacao": 85146,
    "custo": 1.15
   }
  ],
  "corRaca": {
   "branca": 32.3,
   "preta": 9.86,
   "amarela": 0.3,
   "parda": 56,
   "indigena": 1.55
  }
 },
 {
  "sigla": "GO",
  "nome": "Goiás",
  "regiao": "Centro-Oeste",
  "ibge": 52,
  "populacao": 7056295,
  "populacaoMunicipios": 7056495,
  "capital": "Goiânia",
  "cities": [
   {
    "name": "Goiânia",
    "populacao": 1437366,
    "custo": 1
   },
   {
    "name": "Aparecida de Goiânia",
    "populacao": 527796,
    "custo": 0.94
   },
   {
    "name": "Anápolis",
    "populacao": 398869,
    "custo": 0.99
   },
   {
    "name": "Rio Verde",
    "populacao": 225696,
    "custo": 1.14
   },
   {
    "name": "Águas Lindas de Goiás",
    "populacao": 225693,
    "custo": 0.8
   },
   {
    "name": "Luziânia",
    "populacao": 209129,
    "custo": 0.9
   },
   {
    "name": "Valparaíso de Goiás",
    "populacao": 198861,
    "custo": 0.83
   },
   {
    "name": "Senador Canedo",
    "populacao": 155635,
    "custo": 0.92
   }
  ],
  "corRaca": {
   "branca": 36.24,
   "preta": 9.19,
   "amarela": 0.24,
   "parda": 54.18,
   "indigena": 0.15
  }
 },
 {
  "sigla": "DF",
  "nome": "Distrito Federal",
  "regiao": "Centro-Oeste",
  "ibge": 53,
  "populacao": 2817281,
  "populacaoMunicipios": 2817381,
  "capital": "Brasília",
  "cities": [
   {
    "name": "Brasília",
    "populacao": 2817381,
    "custo": 1.22
   }
  ],
  "corRaca": {
   "branca": 39.98,
   "preta": 10.71,
   "amarela": 0.45,
   "parda": 48.66,
   "indigena": 0.2
  }
 }
] as const;
