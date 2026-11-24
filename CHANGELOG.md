# Changelog

Todas as mudanças relevantes do jogo. Formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
versões em [SemVer](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Adicionado
- **Vida de foragido:** 7 eventos (blitz, vizinho desconfiado, saudade da família, bico sem documento, foto no
  noticiário, advogado propondo se entregar, mudar de cidade). Ser pego de novo encerra a fuga.
- **Regime aberto:** 5 eventos (atraso no albergue, emprego formal, antigos parceiros, família ajudando, curso
  noturno com remição).

### Alterado
- **Investigações da Polícia Civil:** a 2ª etapa de cada caso agora acontece no ano seguinte, e o caso ocupa dois anos.
- **Troca de tiro:** ferimentos próprios ("de raspão" ou "grave em serviço"), em vez de uma lesão qualquer do catálogo.
- **Carregamento:** o visual que não está em uso (cartoon ou pixel art) sai do pacote principal e só carrega se for
  escolhido. Chunk principal: ~323 KB gzip (antes ~371).
- O validador aceita prisão por evento com qualquer motivo que tenha faixa de pena (fuga, corrupção…).

## [0.0.3] — 2026-11-24

Visual cartoon, amigos em grupo, transição discreta nos momentos íntimos, subagents e skills. Save **v16** e meta
**v3**: saves da 0.0.2 migram sozinhos (fixture `src/save/__fixtures__/saves-v15.json`).

### Adicionado
- **Visual cartoon dos personagens**, agora o padrão:
  - vetorial, com traço limpo, contorno colorido, sombra suave e cabeça um pouco maior;
  - 5 fases contínuas e 5 biotipos (atlético e musculoso com forma);
  - todos os cabelos, barbas, rostos e expressões;
  - as 59 peças de roupa, inclusive fardas, kimono com faixa, prajied, presidiário e algemas;
  - roupas de banho só para 18+;
  - marcas da luta;
  - cerca de 1,6 ms por avatar e miniaturas em cache;
  - o avatar sempre sai vestido (regra testada).
- **Configurações → "Visual dos personagens":** Cartoon ou Pixel art. A escolha vale para o avatar, as miniaturas dos
  NPCs, os ícones e a animação da cama.
- **54 ícones em cartoon:** 33 do Mercado e dos empreendimentos, 14 de delitos, 3 fardas e 4 facções.
- **"Passar tempo com todos"** em Relações → Amigos:
  - atividades por idade e dinheiro;
  - lista de quem foi e de quem não pôde ir (ocupado, viajando, brigado);
  - afeto com todos e felicidade, com retorno decrescente;
  - "treinar juntos" conta como treino;
  - **21 eventos de grupo**.
- **Transição da cama** nos momentos íntimos já existentes:
  - cama coberta, luz que apaga e coração; dura 1,5 s e pula com um toque;
  - versão estática com movimento reduzido; cenário por contexto;
  - só toca entre adultos com "Conteúdo adulto" ligado; nunca com menores (testado em 1000 vidas).
- **/dev/avatars:** modo lado a lado com 5 fases, 24 NPCs, físicos, roupas, fardas e praia.
- **Fluxo de trabalho:**
  - 8 skills do projeto, revisadas antes da instalação e sem scripts;
  - 6 subagents em `.claude/agents/`;
  - regras de orquestração no CLAUDE.md.

### Alterado
- `AvatarRenderer` generalizado (`kind: 'pixel' | 'vector'`, imagem ou SVG).
- O avatar da tela principal respira e pisca também no cartoon.
- **Bundle:** ~371 KB gzip (1284 KB sem compressão) de JS, mais 46 KB de CSS (13 KB gzip).

### Problemas conhecidos
- **Tom de pele mais escuro:** o contorno do cartoon não chega a 3:1 contra a própria pele, porque o máximo físico é
  ~1,5:1. Contra o fundo do avatar passa de 3:1.
- **Zoom de 8×:** aparece um fio de anti-aliasing no cotovelo, onde o antebraço passa para a frente. Não se vê em
  tamanhos normais.
- **Bundle maior:** cresceu ~43 KB gzip com o renderizador cartoon e os ícones. Vale carregar sob demanda o
  renderizador que não está em uso.
- **Herdados da 0.0.2:** foragido sem eventos próprios, investigações num ano só e lesão genérica na troca de tiro.

### Próximos passos
- Carregar sob demanda o renderizador que não está em uso.
- Eventos de foragido e de regime aberto.
- Dieta e alimentação; pós-graduação.

## [0.0.2] — 2026-11-23

Treino invisível, carreira policial, crime, justiça e prisão. Save **v15**: saves da 0.0.1 migram sozinhos
(fixture `saves-v14.json`).

### Adicionado
- **Carreira policial** (Polícia Militar e Polícia Civil, em Carreiras → "Segurança pública"):
  - concurso de 18 a 30 anos com prova, TAF, saúde, psicológico e investigação social;
  - academia, estágio probatório e promoções;
  - Tiro oculto, mostrado só em palavras;
  - tela central com avatar fardado;
  - 41 eventos: troca de tiro, 4 investigações e dilemas;
  - forças especiais fictícias.
- **Crime:**
  - 13 delitos (leves a partir dos 12; médios e graves só a partir dos 18), com planejamento abstrato dos graves;
  - procurado e reputação ocultos;
  - dinheiro sujo e lavagem;
  - 4 facções fictícias e tráfico abstrato.
- **Justiça e prisão:**
  - processo, fiança, defesa e sentença por faixas fictícias;
  - regimes, progressão, remição e ficha criminal;
  - 22 eventos de prisão sem violência sexual;
  - reintegração.
- **Cruzamentos entre polícia, crime, luta e família**; fardas, uniforme de presidiário e algemas no avatar; ícones dos
  delitos, das fardas e das facções.
- **Testes:**
  - nomes proibidos;
  - 1000 vidas sem menor cometendo delito grave, entrando em facção ou traficando;
  - termos proibidos na prisão.

### Alterado
- **Treino invisível:** nenhuma tela mostra o contador. Acima do limite, o treino não rende, mostra um aviso e pode
  causar lesão leve.
- O patrocinador "Energético Choque" virou "Energético Faísca".
- `npm run sim` ganhou a seção de polícia e crime (GDD §10c).
- **Bundle:** ~328 KB gzip de JS.

### Problemas conhecidos
- Foragido sem eventos próprios.
- Investigações num ano só.
- Lesão genérica na troca de tiro.

## [0.0.1] — 2026-11-23

Primeira release numerada. O jogo deixa de ser só "Vida de Lutador" e vira um simulador de vida, **Vida Real** (nome
provisório), com a carreira de luta como destaque. Save **v14**: saves antigos migram sozinhos pela cadeia v1 → v14.

### Adicionado
- **Limite de treinos:** 10 sessões por ano, divididas entre modalidades, físico, sparring, clube e camps de luta.
  Emprego, faculdade e gerenciar empresa ocupam parte delas, e o contador "Treinos: X/10" mostra o motivo.
- **Carreira de Luta em uma tela só:**
  - linha do tempo (Iniciante → Amador → Profissional regional → Liga principal → Campeão);
  - "Próximo passo", com um botão que leva até lá;
  - modalidades, academia, treinador, treinos, cartel, ranking, ofertas, últimas lutas e aposentadoria;
  - atalho na tela principal;
  - dicas de primeira vez.
- **Modalidades e graduações:**
  - modalidades: jiu-jitsu, judô, wrestling, muay thai, boxe e kickboxing;
  - faixas de jiu-jitsu infantis (de duas cores) e adultas com graus, e a transição aos 16;
  - judô;
  - prajied de muay thai (federação fictícia FSBMT);
  - kimono com a faixa ou prajied no avatar de treino;
  - 31 academias, entre elas as de muay thai e as mistas.
- **Intercâmbio de artes marciais:** 5 programas fictícios, a partir dos 18 anos, ou dos 16 com autorização dos pais.
- **Faculdade:**
  - Exame Nacional Unificado (fictício);
  - 15 cursos em instituições públicas e particulares;
  - bolsa e Crédito Estudantil Futuro;
  - reprovação, jubilamento, trancar e formatura com diploma;
  - 17 empregos de nível superior, com exame da ordem e residência fictícios.
- **Clubes esportivos:** futebol, natação, atletismo, vôlei, basquete, judô e ginástica, com mensalidade e
  competições.
- **Vida noturna:**
  - locais por idade (matinê e lanchonete para menores; bar, show e balada para adultos);
  - casa de strip só com 18+ e "Conteúdo adulto" ligado;
  - brigas resolvidas pelas habilidades.
- **Interações adultas:** "Flertar" e "Passar a noite juntos" com amigos, colegas, treinador(a) e professor(a). Têm uma
  guarda única (`canHaveSexualContentWith`), exigem 18+ dos dois e a opção ligada, e as consequências vêm por eventos.
- **Roupas de banho:** peças adultas só a partir de 18 anos e peças infantis próprias. Aparecem na cena de praia ou
  piscina.
- **Talentos de nascimento:** 7 positivos e 3 negativos. São ocultos e herdáveis, revelados por eventos e mostrados no
  Perfil.
- **Sorte oculta:** inclina eventos, riscos e lances decisivos, sempre dentro de limites pequenos e sem aparecer como
  número.
- **48 eventos aleatórios novos**, em todas as fases da vida. Um evento não se repete antes de 5 anos.
- **Mercado:** 24 tipos de empreendimento, cada um com o seu ícone em pixel art.
- **Perfil do NPC:** um toque na miniatura abre o avatar da pessoa em corpo inteiro.
- **Ferramentas:**
  - versão do jogo em Configurações;
  - `npm run lint` (oxlint);
  - fixtures de saves reais em `src/save/__fixtures__/`;
  - roteiro de release no navegador (`scripts/e2e/release-check.mjs`).

### Alterado
- **Avatares:**
  - cabelos com silhueta arredondada;
  - sexo legível em todas as fases (cílios, lábios, maxilar, sobrancelhas, ombros e quadril);
  - boca e nariz redesenhados;
  - tipos de corpo bem distintos (magro, médio, atlético, forte e gordo);
  - curvas femininas nas adultas, sempre vestidas.
- **Habilidades:** "jiu-jitsu" virou **grappling** (o agarre em geral). O tempo de faixa só corre na modalidade
  treinada de fato.
- **Ganho de treino recalibrado:** cerca de 16–19 anos até "Sólido" e 23–28 até "Elite" com treino pesado. Os NPCs do
  Circuito Titã ficaram um pouco mais fortes.
- **Atividades repetidas no mesmo ano** rendem menos (1 → 0,6 → 0,35 → 0,2 → 0,1). Só os ganhos diminuem.
- **Nome e ícone** do PWA viraram "Vida Real" e "VR", e os textos de abertura apresentam um simulador de vida.
- **Balanceamento** (1000 vidas):
  - 25% das carreiras chegam ao Titã e 2,7% são campeões;
  - 11,5% chegam à faixa preta;
  - o perfil empreendedor tem mediana de R$ 1,02 mi aos 50 anos, e 18% das empresas quebram.
- **Bundle:** ~288 KB gzip (1028 KB sem compressão), em um arquivo só de propósito, por causa da versão em arquivo
  único e do precache offline.

### Removido
- **Energia** (pontos ⚡, "Energia insuficiente" e custo de energia das ações e empregos).
- Telas duplicadas "Carreira de lutador" e "Carreira de luta" antigas (`CareerPanel` como tela própria).
- A ação genérica "Treinar", substituída pelo treino por modalidade.

### Problemas conhecidos
- **Casamentos:** só cerca de 27% dos personagens se casam até os 40 na política do simulador. Isso depende de o
  jogador procurar romance e vai ser revisto.
- **Lint:** o ESLint com typescript-eslint ainda não suporta o TypeScript 7. Por enquanto o lint é o oxlint, sem as
  regras de hooks do React.
- **Versão de teste em arquivo único:** "Exportar save" não funciona nela, porque o navegador não dá permissão de
  download.
- **Corpo:** só muda por atributos e treino. Ainda não há ações de dieta ou alimentação.

### Próximos passos
- **0.0.2:**
  - treino invisível;
  - carreira policial (PM e Civil, fictícias);
  - crime, facções fictícias e prisão, com as regras de conteúdo da 0.0.2.
- Dieta e alimentação mexendo no corpo.
- Revisar a taxa de casamento e o ritmo de eventos de romance.
- Pós-graduação, que já tem gancho na formatura.
