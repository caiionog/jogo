# Changelog

Todas as mudanças relevantes do jogo. Formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
versões em [SemVer](https://semver.org/lang/pt-BR/).

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
