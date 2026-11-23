# Plano — Release 0.0.2: treino invisível, carreira policial, crime e prisão

## Contexto
A 0.0.1 está fechada:
- tag local `v0.0.1`, branch `release/0.0.1` com push;
- 695 testes passando, lint e build limpos, save v14.

Pendências do CHANGELOG que continuam valendo: taxa de casamento (~27%), oxlint no lugar do ESLint, "Exportar save"
na versão em arquivo único e a falta de ação de dieta.

Esta release:
- esconde o contador de treino;
- cria as carreiras de **Polícia Militar** e **Polícia Civil**;
- cria o **mundo do crime**: delitos, facções, tráfico, justiça e prisão.

Todo o conteúdo segue as regras do pedido: tudo fictício, nada de manual, violência não gráfica, nenhuma violência
sexual na prisão, nenhum lado glamourizado e menores só com infrações leves.

**Branch:** `release/0.0.2`, já criada a partir de `release/0.0.1`. Um commit por fase, e
`docs/release-0.0.2/PROGRESS.md` com as fases 0–11 como checklist. **Sem push, merge ou deploy sem perguntar.**
**Save:** v14 → **v15** numa migração só, feita na Fase 2. As fases seguintes acrescentam campos opcionais à mesma v15
enquanto nada foi publicado. Se algum formato mudar depois de um commit com fixture, sobe para v16. Antes de mudar,
gero a fixture `src/save/__fixtures__/saves-v14.json` com saves reais da 0.0.1 (`npx tsx scripts/gen-fixtures.ts`).

---

## Nomes fictícios propostos
Nenhum deles usa sigla de 2 letras que seja sigla de UF, e nenhum lembra facção ou unidade real.

| Tipo | Nome | Sigla / cor / símbolo | Território e regras |
|---|---|---|---|
| Facção | **Liga da Serpente** | "a Liga" · verde e preto · serpente enrolada num cadeado | Grandes capitais do Sudeste e Centro-Oeste; a maior do mapa. Regra: "dívida se paga no ano". |
| Facção | **Clã do Corvo** | "o Clã" · roxo e preto · corvo de asas abertas | Sul e interior de SP; disciplina rígida. Regra: "quem fala com a polícia sai". |
| Facção | **Ordem do Sol Partido** | "a Ordem" · laranja · sol cortado ao meio | Nordeste. Regra: "a família de um é de todos". |
| Facção | **Maré Cinzenta** | "a Maré" · cinza e azul · onda quebrando | Cidades portuárias e o Norte; pequena e ambiciosa. Regra: "ninguém trabalha sozinho". |
| Gangue local | **Turma do Viaduto** | sem símbolo | Qualquer cidade. Delitos médios. Não é facção: serve de porta de entrada sem hierarquia. |

Rivalidades: Liga × Ordem, Clã × Maré e Liga × Maré.

| Tipo | Nome |
|---|---|
| Força especial da PM | **Esquadrão Sentinela** (curso: "Curso de Operações Sentinela") |
| Força especial da Civil | **Grupo Âncora** (curso: "Seleção Âncora") |
| Academia de polícia | Academia de Formação Policial · Curso de Formação de Oficiais (termos genéricos) |
| Corregedoria | Corregedoria (termo genérico) |
| Presídio (fechado) | **Penitenciária Pedra Funda** |
| Provisório | **Centro de Detenção Vale Cinzento** |
| Semiaberto | **Colônia Agrícola Boa Semente** |
| Aberto | **Casa do Albergado Recomeço** |
| Ala de policiais presos | **Ala de Custódia Especial** (na Pedra Funda) |
| Socioeducativo (12–17) | **Centro Socioeducativo Rumo Novo** |
| Ressocialização | **Programa Portas Abertas** (emprego e curso para egressos) |
| Exame de admissão | "Concurso Público" (genérico) |

Ajuste necessário: o patrocinador fictício "Energético **Choque**" (`content/sponsors`) cairia no teste de nomes
proibidos. Ele passa a se chamar "Energético Faísca", com o mesmo id.

---

## Fase 1 — Treino invisível (sem mudança de save)
**Engine** (`fighting/training.ts`, `lifeStages/sessions.ts`, `sportsClub.ts`)
- `'no-sessions'` deixa de bloquear o treino de modalidade, físico, sparring e clube. Acima do limite:
  - o ganho é zero;
  - a contagem continua em `fighter.sessionsThisYear`;
  - o resultado traz `overtrain: { extra: n, cause: 'limit'|'job'|'college' }`.
- **Texto do aviso** (variações em `content/fightText/overtrain.ts`):
  - pelo limite: "Você treinou demais este ano. Seu corpo precisa descansar para evoluir.";
  - quando o motivo é o emprego ou a faculdade: "Com seu trabalho, não sobra tempo para treinar mais este ano.".

  A causa vem de `sessionsBreakdown`.
- A partir da 2ª tentativa extra, há risco de lesão leve por excesso: `health.injury` de um id leve do catálogo, com
  chance em dados (8% e depois 12%), ajustada pela sorte (`luckRisk`).
- Os camps de luta, o "gerenciar de perto" e o estande continuam bloqueando sem sessões. O motivo vira texto sem
  número: "Sem tempo livre para isso neste ano".

**UI**
- Sai o `TrainingMeter` de `Life.tsx`, `activities.tsx`, `clubs.tsx` e `fightCareer.tsx`, e os subtítulos
  "1 sessão" / "Ocupa N sessões" viram texto sem número.
- O `ResultModal` mostra o aviso no lugar do diff.

**Testes**
- No `ui.test`: nenhum "Treinos:", "/10" ou "sessõ" renderizado, em nenhuma tela.
- Acima do limite, ganho zero e o texto certo (limite × emprego).
- Na 1ª tentativa extra não há lesão. Na 2ª em diante há lesão, com frequência dentro da faixa em 2000 seeds.

## Fase 2 — Base da carreira policial (save v15)
- **Dados** em `src/content/careers/police/`:
  - `PoliceCareerDef` por trilha:
    - `pm_praca` (Soldado → Cabo → Sargento → Subtenente);
    - `pm_oficial` (Tenente → Capitão → Major → Tenente-coronel → Coronel);
    - `civil_investigador` e `civil_escrivao` (classes 3ª → 2ª → 1ª → Especial);
    - `civil_delegado` (classes até "Delegado(a) de Classe Especial").
  - Cada trilha tem:
    - `ageRange` [18, 30];
    - `education` ('medio' | 'superior' | `degree: ['direito']`);
    - pesos das etapas do concurso;
    - salários por posto em salários mínimos;
    - anos mínimos e mérito por promoção.
- **Estado** (`GameState.police`):
  - `shooting` (0–100, **oculto**, mostrado como pista: "mira insegura" / "boa mira");
  - `career`: `{ force, track, rank, stage: 'formacao'|'probatorio'|'efetivo', serviceYears, merit, unit:
    'regular'|'especial', notable: string[], corregedoria: number, specialTries }` ou `null`;
  - `exams`: últimos resultados.
- **Emprego:** a carreira policial ocupa o `economy.job` como um `JobDef` com `publicExam: true`. Assim o salário, as 4
  sessões reservadas, o imposto e a demissão usam o fechamento econômico que já existe. O salário do posto vem do
  `police.career`.
- **Concurso** (`engine/police/exam.ts`), com inscrição 1 vez por ano:
  1. prova: inteligência + ações de estudo do ano + sorte + ruído;
  2. TAF: Capacidade atlética;
  3. saúde: `health` e lesões graves;
  4. psicológico: felicidade e flags de histórico;
  5. investigação social: ficha criminal limpa e nenhuma ligação com facção.

  Cada etapa reprova com o motivo. O resultado sai por evento.
- **Formação:** 1 ano de academia, com eventos próprios e ganho de Tiro e atlética. Depois vêm 2 anos de estágio
  probatório e a efetivação.
- **Promoção** (`advanceYear`, no fechamento): tempo + mérito (ocorrências, ações "trabalhar com afinco" e cursos) +
  evento. Oficial da PM: concurso interno (CFO), que exige superior.
- **Ações do ano** (Ocupação → Polícia): trabalhar com afinco, fazer curso, treinar no estande (1 sessão), pedir
  transferência e pedir exoneração.
- **Migração v14→v15:**
  - `police: { shooting: 0, career: null, exams: [] }`;
  - `crime` vazio;
  - `prison: null`;
  - a flag antiga `preso` (briga na balada) vira uma passagem leve na ficha.
- **Testes:**
  - idade 18–30;
  - escolaridade por trilha;
  - delegado sem Direito é barrado;
  - ficha suja reprova;
  - TAF depende da atlética;
  - formação → probatório → efetivo;
  - promoções da PM e da Civil;
  - fixture v14 migra.

## Fase 3 — Eventos policiais, dilemas e força especial (≥ 25 eventos em `content/events/police/`)
- **Condições novas:** `police: { force?, track?, stage?, unit?, minRank?, serviceYears? }`.
- **Efeitos novos:** `police: { merit, shooting, corregedoria, promote, exonerate, specialCourse, notable }`.
- **PM:**
  - abordagem, com escolhas protocolo / revistar / liberar / pedir apoio / usar força. Grappling e trocação ajudam a
    imobilizar sem ferir;
  - ocorrências: assalto em andamento, briga de bar (pode ser um lutador do elenco), violência doméstica, acidente e
    perseguição.
- **Troca de tiro** (`engine/police/shootout.ts`, função pura com seed):
  - tática escolhida (avançar, se abrigar, negociar, recuar) × Tiro × atlética × sorte (limitada por `LUCK`);
  - resultados: suspeito preso, fuga, colega ferido, você ferido (catálogo de lesões) ou morte (rara, mais comum na
    força especial, por `killCharacter`);
  - texto curto e não gráfico.
- **Civil:** 4 casos encadeados por `followUps` com `delayYears: 0` (furto de carga, homicídio, desvio de dinheiro e
  facção), de 3 a 5 etapas cada:
  - pistas, testemunha, mandado e operação;
  - um placar oculto do caso fica em `police.case`;
  - o fim é resolvido, arquivado ou suspeito errado preso.
- **Dilemas:** propina, colega corrupto e pressão política. Aceitar entra pelo `post('crime')`, com risco de
  corregedoria, exoneração e prisão (gancho da Fase 8).
- **Outros:** homenagem, reconhecido por um criminoso, ameaça à família, plantão no Natal e colega morto em serviço.
- **NPCs presos por você:** viram `Person` com a flag `preso_por_voce` e podem voltar (vingança, reencontro, delação).
- **Força especial:**
  - curso de seleção (evento em 3 etapas) que exige anos de serviço, atlética e Tiro altos, saúde e sorte;
  - aprovação alvo de 10–25% entre os candidatos;
  - na unidade: missões perigosas, reputação, bônus de salário e mais risco.
- **Testes:** determinismo da troca de tiro e da investigação pela seed; a sorte inclina sem decidir sozinha (limites);
  faixa de aprovação da força especial no sim.

## Fase 4 — Delitos, procurado, reputação no crime e dinheiro sujo
- **Dados** em `src/content/crime/index.ts`: `CrimeDef { id, label, tier: 'leve'|'medio'|'grave', minAge (12 | 18),
  baseSuccess, gain: [min,max], risk: { caught, injury, death }, wantedGain, repGain, minCrimeRep?, plan?: true }`.
  - **leves (12+):** pichação, furto em loja, briga de rua e dano a patrimônio;
  - **médios (18+):** furto de carro, receptação, estelionato simples e agressão;
  - **graves (18+):** assalto a pedestre, a comércio, a joalheria e a banco, tráfico (Fase 5) e sequestro.
- **Planejamento dos graves:** uma cadeia de escolhas **abstratas** (equipe de NPCs com qualidade oculta, alvo
  "pequeno, médio ou grande", momento "dia ou noite", seguir ou abortar). O resultado sai do RNG com sorte, atlética,
  inteligência, reputação no crime e equipe. Nenhum detalhe técnico.
- **Estado `GameState.crime`:**
  - `wanted` (0–100, oculto; pistas como "Você sente que está sendo observado"; cai 15 por ano);
  - `rep` (oculta);
  - `dirty` (parte do dinheiro que é "suja");
  - `record` (ficha criminal);
  - `juvenile` (passagens de 12 a 17 anos, que não contam depois dos 18);
  - `faction` e `trafficking`.
- **Dinheiro sujo:** o ganho entra por `post('crime')` e soma em `dirty`. Gastar acima de um limiar com `dirty` alto
  gera o evento de suspeita. Lavar por um empreendimento do Mercado é uma ação com risco, que reduz `dirty` e paga taxa.
- **Investigação:** um sorteio anual de investigação e prisão pelo `wanted`, que leva à Fase 6.
- **Menores:** a guarda única `crimeAllowed(state, def)` exige 18+ para médios, graves, facção e tráfico. As
  consequências dos menores são advertência, serviço comunitário ou internação curta (até 1 ano no Rumo Novo, com a
  escola continuando).
- **Testes:**
  - idade mínima por categoria;
  - `wanted` sobe e desce;
  - suspeita com dinheiro sujo;
  - a lavagem respeita a invariante do extrato.

## Fase 5 — Facções e tráfico (`src/content/crime/factions/`)
- `FactionDef { id, name, colors, symbol, territory: { ufs, cities? }, size, rivals, rules[] }`.
- **Entrada:** só por evento de convite, a partir dos 18, com reputação no crime ou amizade com um membro (`Person`
  com a flag `faccao:<id>`).
- **Hierarquia:** membro → soldado → gerente → liderança regional → cúpula.
- **Membro:**
  - missões anuais por evento (recusar gera dívida e risco);
  - guerras com rivais;
  - dívidas internas;
  - morte por traição;
  - sair é um evento com escolhas e risco alto.
- **Família e amigos reagem** (`social.affection` e afastamento) e alguns entram junto.
- **Tráfico:** nível pequeno, médio ou grande. Lucro anual, com risco anual de apreensão, prisão, conflito e morte no
  fechamento do ano. Só "drogas", sem nenhum detalhe.
- **Testes:**
  - convite + 18+;
  - sair é possível e arriscado;
  - rivalidade gera evento;
  - em 1000 vidas, nenhum menor comete delito grave, entra em facção ou trafica (estende `adultSafety`).

## Fase 6 — Justiça e ficha criminal
- **Fluxo** `arrest → delegacia → audiência → processo`, com um `crime.case` em andamento:
  - fiança quando cabível;
  - advogado (NPC com a profissão `advogado` ou diploma de Direito ganha função) ou defensor público;
  - responder em liberdade.
- **Sentença:** `content/crime/sentences.ts` traz faixas de anos fictícias por categoria. Agravam a reincidência e a
  facção; atenuam o bom advogado, a confissão e a sorte (limitada).
- **Regimes:** fechado (> 8 anos), semiaberto (4–8) e aberto (< 4), simplificados.
- **Durante a pena:**
  - progressão a cada 1/4 da pena cumprida, com bom comportamento;
  - livramento condicional na metade;
  - remição: trabalhar ou estudar desconta 0,25 ano por ano.
- **Ficha permanente** em `crime.record`:
  - bloqueia concursos e `JobDef.requires.cleanRecord`;
  - reduz a `hireChance` dos outros empregos;
  - aparece em condições de eventos.
- **Testes:**
  - faixas;
  - agravantes e atenuantes;
  - progressão;
  - remição;
  - a ficha bloqueia concursos e empregos.

## Fase 7 — Prisão e reintegração (≥ 20 eventos em `content/events/prison/`)
- **Estado `GameState.prison`:** `{ facility, regime, sentence, served, remission, behavior, protection, wing:
  'comum'|'especial', kind: 'adulto'|'internacao' }`.
- **Enquanto preso:**
  - o `advanceYear` pula emprego, escola (pausa) e faculdade (trancada);
  - contratos e patrocínios são cancelados;
  - as ações são trocadas pelas da prisão: trabalhar, estudar (supletivo/EAD), treinar no pátio (limite 4), conversar
    com detentos, receber visita (o afeto pesa) e ficar fora de confusão.
- **Eventos:**
  - briga no pátio (o lutador ganha respeito);
  - recrutamento por facção;
  - dívida;
  - revista;
  - rebelião (lado ou se esconder);
  - transferência;
  - fuga (falhar aumenta a pena);
  - visita que não vem;
  - mentor.

  Nenhum evento tem violência sexual nem insinuação. Isso é verificado por uma lista de termos proibidos no teste.
- **Soltura:** no ano certo. Vem o evento de reintegração (emprego difícil, família, convite para voltar e o Programa
  Portas Abertas).
- **Testes:** ações trocadas; soltura no ano certo; fuga falha aumenta a pena.

## Fase 8 — Cruzamentos
- **Policial e conhecidos:** o policial pode prender um NPC ligado a você (família ou ex-amigo com flag de crime), num
  evento de dilema.
- **Ficha e polícia:** quem tem ficha não é policial. Um policial preso por corrupção ou excesso vai para a Ala de
  Custódia Especial, com eventos próprios, e é exonerado.
- **Lutador:**
  - briga de rua e briga na prisão mexem na reputação;
  - ser preso cancela o contrato e os patrocínios (reusa `cancelSponsors`);
  - o ex-presidiário tem um evento de redenção na luta.
- **Família:** parentes com crime ou facção geram eventos para o policial e para o criminoso.

## Fase 9 — Interface, fardas e ícones
- **Ocupação → Carreiras:** categoria **"Segurança pública"** (`CareerCategory` + `CAT_TITLE`), com cartões da PM e da
  Civil e a escada de postos.
- **Tela central "Polícia"** (`screens/menus/police.tsx`, no estilo da luta):
  ```
  [avatar fardado]  Polícia Militar · 3º Batalhão (fictício)
                    Sargento · 7 anos de serviço
  Avaliação: "Respeitado(a) na tropa" · Mira: "boa"
  ┌ Próximo passo: "Mais 1 ano e mérito para Subtenente" [Trabalhar com afinco] ┐
  Ações do ano: Trabalhar com afinco · Curso · Estande · Transferência · Exoneração
  Força especial: Esquadrão Sentinela — "Exige 5 anos de serviço"   [Tentar o curso]
  Ocorrências marcantes: • Prendeu {nome} em assalto (28 anos) • Homenagem (30)
  ```
- **Atividades → Crime** (12+; graves só 18+; menores veem só os leves):
  ```
  Leves     🖌 Pichação          Risco: baixo   ›
  Médios    🚗 Furto de carro     Risco: alto    ›   (18+)
  Graves    💎 Assalto a joalheria Risco: muito alto › (planejamento em etapas)
  Dinheiro: "Você tem dinheiro que chama atenção" [Lavar pelo seu negócio]
  [Ficha] → ficha criminal, processo em andamento, advogado, regime
  ```
- **Prisão:**
  - banner na tela principal: "🔒 Preso — regime fechado, faltam 3 anos";
  - a aba Atividades vira **Prisão** (ações da prisão);
  - o + Idade continua.
- **Avatar** (`outfits` + `sprites/clothes.ts`, encaixados na silhueta):
  - farda da PM (camisa, colete, distintivo e boné);
  - Civil (camisa, colete preto com distintivo);
  - força especial (farda escura, colete e capacete);
  - uniforme de presidiário (bege);
  - algemas no contexto `prisao` (evento de prisão).

  `AvatarContext` ganha `'policia'` e `'prisao'`.
- **Ícones 16×16:** 14 delitos, 3 fardas e 4 símbolos de facção, no padrão "base comum + glifo", com teste de unicidade
  e paleta.

## Fase 10 — Balanceamento (`npm run sim`)
- **Novas seções:**
  - % que vira policial, idade média de entrada, % na força especial e mortes em serviço;
  - % que comete crimes, % de presos, pena média, reincidência, % em facção, expectativa de vida no crime;
  - renda do crime × emprego comum.
- **Metas:**
  - o crime rende mais no curto prazo e quase sempre termina mal (prisão, morte ou ficha) em ≥ 80% das carreiras
    criminosas graves;
  - a polícia é estável, com mortalidade em serviço baixa;
  - a força especial fica em ≤ 15% dos policiais.

  As tabelas vão para o GDD.

## Fase 11 — Documentação e release
- **Docs:**
  - GDD: novas seções e balanceamento;
  - CLAUDE.md: regras de conteúdo, teste de nomes proibidos e como adicionar cargo, evento policial, delito, facção e
    evento de prisão;
  - CHANGELOG 0.0.2, com o bundle;
  - HANDOFF e PROGRESS.
- **Versão** 0.0.2 em `package.json` e Configurações.
- **Navegador:** roteiro `release-check` ampliado com os cenários do checklist em 375×667 e 414×896. As capturas vão
  para `docs/release-0.0.2/screenshots/`.
- **Fechamento:** commit e tag local `v0.0.2`. **Pergunto antes de qualquer push.**

---

## Teste de nomes proibidos (entra na Fase 2 e cobre todo o conteúdo)
`tests/forbiddenNames.test.ts` varre todos os textos de `src/content` (JSON dos dados) e da UI:
- **nomes longos**, sem diferenciar maiúsculas: Primeiro Comando da Capital, Comando Vermelho, Terceiro Comando Puro,
  Amigos dos Amigos, Família do Norte, Bonde do Maluco, Guardiões do Estado, Sindicato do Crime;
- **siglas**, como palavra inteira e diferenciando maiúsculas: PCC, CV, TCP, ADA, FDN, BDM, GDE, BOPE, ROTA, GATE,
  COE, CORE, TIGRE, GOE, COT e "Choque";
- **estado ao lado da polícia**: "Polícia Militar"/"Polícia Civil" seguida ou precedida (até 3 palavras) de nome de
  UF ou sigla de UF, e padrões como `PM[A-Z]{2}`/`PCE?[A-Z]{2}`.

## Verificação por fase
- `npx tsc --noEmit`, `npm run lint` e os testes da área (só o resumo e as falhas).
- Commit `release 0.0.2 (fase N): …` e PROGRESS.md atualizado.
- Quando a fase mexer na UI, Playwright em 375×667.
- Se o contexto apertar: paro num ponto limpo, deixo o próximo passo no PROGRESS.md e peço uma sessão nova com
  "Continue a release 0.0.2 a partir do docs/release-0.0.2/PROGRESS.md".
