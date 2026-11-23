# Plano — Melhorias + release 0.0.1

## Contexto
A Etapa 8 está fechada (572 testes passando, save v8). Quem jogou pediu 15 melhorias: acabar com a energia, deixar a
carreira de luta mais clara, modalidades e graduações, faculdade, clubes, intercâmbio, vida noturna, interações
adultas, roupas de banho, avatares melhores, ícones, talentos, sorte e mais eventos. A sessão termina com a release
0.0.1: tag local, CHANGELOG e HANDOFF, **sem push**.

**Branch:** criar `release/0.0.1` local a partir de `ad0950e`, com um commit por fase. Nada de push, merge ou deploy
sem perguntar.

Primeiro passo, depois da aprovação: criar `docs/release-0.0.1/PROGRESS.md` com as fases 0–12 como checklist.

---

## Pontos confusos encontrados na carreira de luta (hoje)
1. **Duas telas com quase o mesmo nome:** "Carreira de lutador" (`carreira-luta`, em Ocupação → Carreiras) e
   "Carreira de luta" (`luta`, em Ocupação). As duas mostram próximo passo, avaliação do treinador e entrar na
   academia, mas cada uma tem o seu código e o seu texto (`nextStepText` × `NextStep`/`gapText`).
2. **"Procurar lutas" não procura:** leva ao `CareerPanel` inteiro, e não a uma lista de ofertas.
3. **Treino em três lugares:** Atividades → Treino, os botões do `CareerPanel` e a ação genérica `train`, que está
   escondida na UI mas é usada pelo sim.
4. **Ranking a 4 toques** (Ocupação → Carreiras → Carreira de lutador → Ranking). O `CareerPanel` mostra "#N", mas o
   número não leva ao ranking.
5. **Dica do treino aponta para 3 níveis abaixo** ("Ocupação → Carreiras → Carreira de lutador").
6. **Termos sem explicação:**
   - "Chão" e "Em pé";
   - "Trocação";
   - "camp" (custo de camp);
   - cartel "Jiu-jitsu" separado do amador e do pro;
   - Iniciante/Promissor/Sólido/Elite;
   - siglas de liga (LFM, ARC) no próximo passo;
   - "bolsa".
7. **Aposentado sem saída:** o texto diz "dá para voltar pela Carreira de luta", mas a volta só acontece por evento.
   Não existe botão.
8. **Academia de judô ou wrestling conta como jiu-jitsu:** a especialidade `jiujitsu` faz o tempo de faixa de
   jiu-jitsu correr sem treinar jiu-jitsu.
9. **Visual misturado:** o `CareerPanel` usa `slate`/`emerald` fixos, e os menus usam os tokens `--ds-*`.

## Esboço da nova tela central "Carreira de Luta" (`luta`)
```
┌ Carreira de Luta ───────────────────────────┐
│ [avatar com o kimono/faixa ou prajied]      │
│ Iniciante ─ Amador ─●Pro regional─ Liga ─ 🏆 │  ← linha do tempo, etapa atual destacada
├ Próximo passo ──────────────────────────────┤
│ "Vença mais 2 lutas amadoras para receber   │
│  convites profissionais."   [Procurar lutas]│  ← botão leva ao alvo (ofertas/academia/treino)
├ Modalidades ────────────────────────────────┤
│ Jiu-jitsu  faixa azul · 2 graus        (i)  │
│ Muay thai  prajied azul-claro          (i)  │
│ Boxe       sem graduação                    │
├ Academia(s) ────────────────────────────────┤
│ Tatame Leste (jiu-jitsu, muay thai) R$/ano  │  [Trocar/Entrar]
├ Treinador ──────────────────────────────────┤
│ "Sólido no chão, Promissor em pé."          │
├ Treinos: 7/10  (seu emprego ocupa 4)        │
│ [Jiu-jitsu] [Muay thai] [Físico] [Sparring] │  ← treinar aqui mesmo (2 toques)
├ Cartel e ranking ───────────────────────────┤
│ Pro 8-3 · Amador 5-1 · #6 na ARC (leve)  >  │  ← abre o Ranking
├ Ofertas deste ano (2) ──────────────────────┤
│ [cartão da oferta] [cartão da oferta]       │
├ Últimas lutas · Aposentar ──────────────────┤
└─────────────────────────────────────────────┘
```
- **Chegando à tela em 1 toque:** um atalho "🥊 Carreira de Luta" na tela principal, logo abaixo do busto. Ele
  aparece quando o personagem tem academia, interesse em luta ou alguma luta no cartel. A tela também continua em
  Ocupação → Carreira de Luta.
- **Treinar, procurar luta ou ver o ranking:** 2 toques no total, como pedido.
- **O que sai:** `carreira-luta`, o `CareerPanel` dentro de `luta` e o `NextStep` duplicado. Um único
  `fighterNextStepText` passa a ficar na engine (`careers.ts`): frase objetiva mais o alvo do botão.
- **Explicações curtas** (graduação, cartel, ranking, bolsa, camp, chão/em pé): aparecem na primeira vez, com um botão
  "Entendi". O que já foi visto fica guardado no **meta** (`preferences.seenTips`, com migração do `META_VERSION`),
  não no `GameState`.

---

## Decisões de modelagem (valem para todas as fases)
- **Uma versão de save por fase que mudar o estado:**
  - v9: energia;
  - v10: modalidades;
  - v11: talentos e sorte;
  - v12: faculdade;
  - v13: clubes e intercâmbio;
  - v14: cena de praia e histórico de eventos.

  Cada versão terá migração, teste e fixture real da versão anterior, gerada pela engine antes da mudança. As fixtures
  vão para `src/save/__fixtures__/` (as atuais de `tests/fixtures/` mudam para lá na Fase 1), e o teste da cadeia
  passa a ir de v1 até a versão atual.
- **Valores novos e ocultos** (sorte, talentos, migrações) usam um RNG derivado
  (`createRng(seedToState(\`${seed}:luck\`))` e afins). Assim o `rngState` principal e o `tests/fairness.test.ts`
  ficam intactos.
- **Regras numéricas ficam em dados** (`src/content/…`): limite de sessões, tabela do retorno decrescente, limites da
  sorte, chances de talentos e graduações.

---

## Fase 1 — Fim da energia → limite de sessões (save v9)
**Engine**
- Remover `Energy` e `GameState.energy`, `lifeStages/energy.ts`, todo `'no-energy'` e as constantes `*_COST`.
- Novo módulo `engine/lifeStages/sessions.ts`:
  - `TRAINING_SESSIONS_PER_YEAR = 10`, vindo do conteúdo (`content/config.ts`);
  - `sessionsReserved(state)` soma as sessões ocupadas:
    - emprego de tempo integral: 4;
    - meio período ou estágio: 2;
    - faculdade: 2 (a partir da Fase 5);
    - "gerenciar empresa de perto": 2;
  - `sessionsLeft(state)` devolve o que sobra; o contador continua em `fighter.sessionsThisYear`, que já existe;
  - `sessionsBreakdown(state)` dá à UI as linhas de texto ("Seu emprego ocupa 4 sessões de treino").
- **Treino** (luta e físico): cada treino gasta 1 sessão. Sparring também gasta 1.
- **Camp de luta:** aceitar uma luta consome sessões (`offer.campCost` vira `campSessions`: substituição 1, amador 2,
  pro 3, título 4). Isso mantém o limite atual de 1 a 3 lutas por ano.
- **`JobDef.energy` vira `trainingSessions`**, com valor 0, 2 ou 4 pela categoria. O validador exige um desses valores.
- **Retorno decrescente** nas demais ações (estudar, sair, festa, socializar, interações, conhecer alguém, conversar
  com colegas, trabalhar mais):
  - contador anual `GameState.yearUses: Record<string, number>`, zerado no `advanceYear`;
  - multiplicador vindo de dados, `[1, 0.6, 0.35, 0.2, 0.1]`, aplicado aos efeitos positivos (atributos, média,
    afeto). Os efeitos negativos e o dinheiro não diminuem;
  - continuam os limites próprios que já existem (patrocínio, pedir aumento e saúde, 1 vez por ano) e entra o da CNH
    (1 tentativa por ano).
- **Ação genérica `train`:** sai do conteúdo; o sim passa a usar `trainFighter`.

**Migração v8→v9**
- Apagar `energy`.
- Criar `yearUses: {}`.
- `sessionsThisYear` fica limitado a 10.
- `campCost` vira `campSessions` nas ofertas.

**UI**
- Sai o `EnergyDots` (`Life.tsx`). Entra o "Treinos: 7/10", com o detalhe do que está reservado.
- Todos os "⚡" e "Energia insuficiente" saem. Entram os motivos novos: "Sem sessões de treino neste ano", "Seu emprego
  ocupa 4 sessões".
- Revisar o texto de `content/events/economy/work.ts:51` ("toma pouca energia").

**Testes**
- Reescrever `energy.test.ts` como `sessions.test.ts`: limite de 10, desconto por emprego, retorno decrescente e
  nenhum `energy` no estado.
- No conteúdo, uma varredura garante que não sobrou "energia" nem "⚡", com exceção da narração da luta.
- Ajustar os helpers e os cerca de 20 testes que usam energia. Fixture `saves-v8.json`.

## Fase 2 — Modalidades, grappling, graduações, academias, ganho de treino (save v10)
- **Habilidades:** `skills.jiujitsu` vira `skills.grappling` em todo o projeto.
  - Fica intacto o `rules: 'grappling'` das organizações.
  - O parâmetro `grappling` de `fightExperience` muda de nome para não confundir.
- **`src/content/martialArts/`:** `ModalityDef { id, label, skill: 'grappling'|'trocacao', graduation?: GraduationSystemId }`
  para jiu-jitsu, judô, wrestling, muay thai, boxe e kickboxing. O kickboxing fica só para o intercâmbio e para
  academias que o oferecerem.
- **Graduações** (`graduations.ts`, em dados; cada nível tem `minAge`, `minYears`, `minSkill` e cor ou cores para o
  avatar):
  - **Jiu-jitsu infantil (4–15):** branca, cinza/branca, cinza, cinza/preta, amarela/branca, amarela, amarela/preta,
    laranja/branca, laranja, laranja/preta, verde/branca, verde, verde/preta;
  - **Transição aos 16:** quem tem laranja ou mais, e habilidade de azul, passa para a azul; os outros vão para a
    branca adulta;
  - **Jiu-jitsu adulto:** branca, azul, roxa, marrom e preta, com até 4 graus por faixa (1 por ano treinado) e graus
    na preta;
  - **Judô** (sequência usada no Brasil, sem citar a entidade no jogo): branca, cinza, azul, amarela, laranja, verde,
    roxa, marrom, preta (1º dan em diante);
  - **Muay thai** pela federação fictícia "Federação Sião-Brasileira de Muay Thai (FSBMT)": prajied branco, vermelho,
    vermelho com ponta azul-clara, azul-claro, azul-claro com ponta azul-escura, azul-escuro, azul-escuro com ponta
    preta, preto, preto com ponta branca, branco e vermelho (kru). A escolha fica documentada no GDD;
  - **Boxe, wrestling e kickboxing:** sem graduação.
- **Estado do lutador:**
  - `belt` e `trainedBjjThisYear` saem;
  - entra `fighter.grades: Partial<Record<ModalityId, { system, rank, degree, years }>>`;
  - entra `fighter.trainedThisYear: ModalityId[]`;
  - o tempo na faixa só corre na modalidade realmente treinada (resolve o ponto confuso 8);
  - o exame de faixa automático (`fight_belt_exam`) vira genérico por modalidade, com a condição
    `fighting.gradeReady: modalityId` e o efeito `fighter.promoteGrade: modalityId`;
  - as condições antigas `belt`/`beltPromotionReady` passam a apontar para o jiu-jitsu.
- **Academias:**
  - `GymDef.specialty` vira `modalities: ModalityId[]`;
  - entram academias de muay thai e mistas (jiu-jitsu + muay thai, judô + wrestling, MMA com tudo) em cada capital,
    e as genéricas;
  - cada modalidade só pode ser treinada numa academia que a ofereça, com o motivo
    "Sua academia não oferece muay thai";
  - na migração, academia `jiujitsu` vira `['jiujitsu']`, as de judô e wrestling passam a ter o id certo,
    `trocacao` vira `['muaythai','boxe']` e `mma` vira todas.
- **Treino:**
  - os tipos passam a ser jiu-jitsu, judô, wrestling, muay thai, boxe, físico e sparring (o sparring continua e é
    o que causa dano cerebral; se você preferir, eu tiro);
  - todo treino de luta dá também cerca de 35% do ganho de atlética do treino físico;
  - as bases sobem para bater as metas;
  - o fator de idade < 10 é revisto (os 0,55 atuais travam quem começa aos 10).
- **Calibragem (`npm run sim`):** entra um perfil "10 sessões/ano desde os 10", com a idade mediana em que se chega a
  Sólido e a Elite por faixa de talento e a atlética aos 21. Teste com tolerância:
  - Sólido na modalidade principal entre os 16 e os 19 anos (talento ≥ 1,0);
  - Elite entre os 23 e os 28 (talento ≥ 1,1);
  - atlética ≥ 70 aos 21 na mediana de quem treina pesado.

  Depois disso, conferir que chegar ao Titã e ser campeão do Titã não disparam; se dispararem, os NPCs sobem junto.
- **Avatar:**
  - entra o contexto `treino`, que mostra o kimono com a faixa (jiu-jitsu ou judô, incluindo as faixas de duas cores
    com listra) ou o prajied no braço com shorts de muay thai;
  - aparece na tela central e no resultado do treino;
  - `BELT_HEX` deixa de existir e passa a sair dos dados de graduação.
- **Testes:**
  - cada modalidade sobe a habilidade certa e a atlética;
  - não dá para treinar sem academia da modalidade;
  - tempos e requisitos das graduações e a transição aos 16;
  - migração v9→v10: o jiu-jitsu vira grappling, a faixa adulta vai para `grades.jiujitsu`, e quem tem menos de 16
    ganha a faixa infantil estimada pela habilidade.

## Fase 3 — Tela central da Carreira de Luta (só UI e engine; sem mudança de save, salvo o meta)
- O novo `screens/menus/fightCareer.tsx` substitui `CarreiraLutaScreen`, `LutaScreen` e o `CareerPanel`, reaproveitando
  `OfferCard`, `RetireSection` e `GymSection` migrados para `--ds-*`.
- Linha do tempo: Iniciante → Amador → Profissional regional → Liga principal → Campeão (vem de `fighterStage` mais
  `titles`).
- `fighterNextStepText(state, content)` na engine devolve `{ text, target: 'academia'|'treino'|'ofertas'|'ranking'|null }`.
  Exemplos de frase: "Faça mais 2 lutas amadoras…" ou "Entre numa academia de jiu-jitsu".
- Aposentado: o cartão explica que a volta acontece por convite, com reputação de 30 ou mais.
- O "#N no ranking" abre o Ranking.
- Explicações da primeira vez: `FirstTimeTip` mais `seenTips` no meta (`META_VERSION` + migração + teste).
- **Testes de UI** (`tests/ui.test.tsx`): 2 toques a partir da tela principal para treino, ofertas e ranking; a dica
  aparece uma vez e não volta depois do "Entendi"; nenhum número de habilidade na tela (regra 7).

## Fase 4 — Talentos e sorte (save v11)
- **`src/content/talents/`:** `TalentDef { id, chance (0,05–0,15; negativos 0,03–0,06), negative, heritBonus,
  mods }`, com estes talentos:
  - positivos: atlético, prodígio intelectual, beleza marcante, saúde de ferro, mão pesada, corpo elástico e
    carismático;
  - negativos: saúde frágil, propenso a lesões e pavio curto.

  Os `mods` são declarativos e lidos por funções puras em `engine/character/talents.ts`: atlética inicial, ganho de
  treino e estudo, aparência, risco de doenças, recuperação, nocaute, finalização, afeto e reputação em entrevistas,
  chance de lesão e peso dos eventos de briga.
- **Estado:**
  - `character.talents: { id, revealed: boolean }[]`;
  - `Person.talents?: string[]`, com os filhos tendo chance base + `heritBonus` de herdar o talento de um dos pais;
  - lutadores do elenco: o talento é derivado do id e não ocupa o save.
- **Revelação:**
  - efeito `revealTalent: id`;
  - condição `talent: { id, revealed: false }`;
  - eventos de revelação com pistas ("Seu professor de educação física disse que você tem um dom raro");
  - os talentos revelados aparecem no Perfil.
- **Sorte:**
  - `character.luck` vale de 0 a 100 e é sorteada pela média de 3 uniformes do RNG derivado;
  - os limites ficam em dados (`content/luck.ts`): peso dos eventos ±25%, chance de risco ±8 pontos percentuais
    (com piso e teto), lances decisivos da luta ±3%;
  - **eventos:** `GameEvent.tone?: 'good'|'bad'` e `risk.tone` (o padrão do risco é `'bad'`). O peso é multiplicado
    por `1 + k·(luck−50)/50` com o sinal do tom;
  - **resultado de risco:** a chance é ajustada pela sorte, em `game.ts:172` e `game.ts:382`;
  - **luta:** só os lances de knockdown/KO e finalização, com o limite acima;
  - **eventos de amuleto e espelho quebrado:** efeito `luck: ±n`, com limite por evento;
  - **pistas:** frases no log a cada poucos anos, nos extremos, e o título no obituário ("Nasceu virado(a) para a
    lua" / "Azarado(a) de carteirinha");
  - nunca aparece como número (acrescentar a sorte e os talentos à guarda do `ui.test`).
- **Migração v10→v11:** sorte e talentos com o RNG `seed:v11:*`, todos não revelados; nas `Person`, também pelo RNG
  derivado.
- **Testes:**
  - frequência dos talentos em 100 mil nascimentos dentro de ±0,5 ponto percentual;
  - herança com chance maior;
  - sorte determinística;
  - o efeito nunca passa do limite (propriedade em todas as funções de modificação);
  - teste estatístico: em 2000 vidas, sorte ≥ 75 tem mais eventos `good` por vida que sorte ≤ 25;
  - a fairness continua passando.

## Fase 5 — Faculdade, cursos e empregos de nível superior (save v12)
- **Exame Nacional Unificado (ENU, fictício):**
  - evento automático no 3º ano do ensino médio;
  - nota de 0 a 1000 = inteligência + média escolar + ações de estudo do ano + sorte + ruído;
  - fica guardada em `education.examScore`;
  - `adult_path_18` passa a oferecer a faculdade quando há nota.
- **`src/content/college/`:**
  - 15 cursos `CourseDef { id, label, years, cutoffPublic, cutoffPrivate, tuition (em salários mínimos), difficulty, develops: StatKey, events? }`;
  - instituições fictícias por tipo;
  - a pública não cobra mensalidade e tem nota de corte alta;
  - a particular tem mensalidade, com bolsa por nota ou pelo "Crédito Estudantil Futuro" (fictício), que vira um
    `Loan` com carência até a formatura.
- **Estado:** `GameState.college?: { courseId, type, institution, year, grade, status: 'cursando'|'trancado'|'formado'|'desistiu', funding, failures }`
  e `character.diplomas: string[]`.
- **Ano letivo da faculdade** (no `advanceYear`, depois do ano escolar):
  - a nota é calculada pela dificuldade, pela inteligência, pelas ações e pela sorte;
  - reprovação repete o ano; 2 reprovações levam ao evento de jubilamento;
  - existe trancar e destrancar;
  - a faculdade ocupa 2 sessões de treino.
- **Ações:** estudar, matar aula, estágio (emprego de estágio com `requires.college`) e atlética universitária (festas,
  jogos universitários, time de luta, que dá lutas amadoras).
- **Formatura:** entra no diploma e na flag `formado_<curso>`; a pós-graduação fica como gancho.
- **Empregos:**
  - `JobDef.requires.degree: CourseId[]`, mais `requires.license?: 'oab'|'crm'`. Há o exame da ordem fictício
    (aprovação por chance) e a residência médica como degrau da escada;
  - 17 empregos novos em `content/jobs/superior/`;
  - preparador físico, fisioterapeuta e nutricionista ganham `trainingBonus` pequeno (+5%);
  - comentarista exige reputação mínima;
  - `educationLevel` passa a considerar 'superior' com qualquer diploma.
- **Migração v11→v12:** saves com `caminho_18 = 'faculdade'`:
  - 22 anos ou mais e com ensino médio: recebem o diploma de Administração;
  - 18 a 21: ficam matriculados em Administração na particular, no ano correspondente.
- **UI:** o "Estudos — Em breve" vira a tela "Faculdade" (Ocupação), com curso, ano, nota, ações e trancar.
- **Testes:** nota de corte, pública × particular, financiamento, conclusão com diploma, emprego que exige o diploma
  certo e as 2 sessões descontadas.

## Fase 6 — Clubes esportivos e intercâmbio (save v13)
- **Clubes (`src/content/sportsClubs/`):**
  - `SportsClubDef { id, name, city|null, fee, sports: ['futebol','natacao','atletismo','volei','basquete','judo','ginastica'], minAge: 6 }`;
  - estado `GameState.sportsClub?: { clubId, sport, years }`;
  - "Treinar no clube" gasta 1 sessão e dá atlética (o judô do clube também dá grappling e conta para a graduação
    de judô), com chance de amizade;
  - eventos de competição (campeonato estadual, jogos escolares) com a condição `sportsClub`;
  - a mensalidade sai pelo `post('clube')`, paga pelos pais até os 18;
  - continuam separados dos clubes escolares.
- **Intercâmbio (`src/content/exchange/`):**
  - 5 programas fictícios: muay thai na Tailândia, judô no Japão, wrestling nos EUA, kickboxing na Holanda e um centro
    de jiu-jitsu no exterior. Cada um tem custo (passagem + estadia + mensalidade), modalidade e academia de
    referência fictícia;
  - pode-se fazer aos 18 ou mais; entre 16 e 17, só com o evento de autorização dos pais (a chance depende do afeto e
    da renda da família, e os pais podem pagar parte);
  - estado `GameState.exchange?: { programId, year }`, com duração de 1 ano;
  - durante o intercâmbio, as sessões vão para a modalidade do programa com bônus grande e a academia do Brasil fica
    suspensa;
  - no fim: ganho de habilidade e atlética, reputação +, eventos próprios (adaptação, saudade, amizade estrangeira,
    lesão, luta local) e flag `fez_intercambio_<id>`;
  - a moradia continua no Brasil;
  - com emprego de tempo integral, o bloqueio mostra o motivo e abre o evento "pedir licença ou demissão";
  - escola (16 e 17 anos): o ano letivo fica em pausa, sem reprovar.
- **Testes:**
  - clube: mensalidade, idade mínima e uso de sessão;
  - intercâmbio: idade, autorização, custo, conflito com o emprego e ganho.

## Fase 7 — Vida noturna e interações adultas (sem mudança de save, salvo novos tipos de relação; se precisar, v13 recebe o tipo `professor`)
- **`src/content/nightlife/`:**
  - `VenueDef { id, label, minAge, maxAge?, adult?: true, cost, events: eventId[] }`;
  - menores de 18: festa de amigos, matinê e lanchonete;
  - 18 ou mais: bar, festa, show e balada; a casa de strip exige 18 ou mais, `adult: true` e o "Conteúdo adulto"
    ligado.
- **`goOut(state, venueId)`** na engine:
  - lança o custo;
  - escolhe 1 evento da lista do local, com peso pela sorte e pelo talento, e o deixa pendente;
  - eventos: conhecer alguém (vira amizade ou romance pelos guards), encontrar um conhecido, gastar demais, perder o
    celular, ressaca (−saúde) e briga;
  - a **briga** é resolvida por trocação, grappling e atlética: pode vencer, apanhar (lesão leve), ser preso (multa e
    flag) ou ganhar reputação, se for lutador.
- **Interações adultas** (`relationships/actions.ts`):
  - "Flertar" (romântico) e "Passar a noite juntos" (sexual) com amigo(a), colega de treino, treinador(a) e o tipo
    novo `professor` (professor ou instrutor de faculdade, academia ou curso);
  - **guarda única nova em `guards.ts`:** `canHaveSexualContentWith(state, person, rel)` chama
    `canHaveSexualContent` + `adultContentAllowed` e barra professor da escola enquanto o personagem for aluno.
    Não se reimplementa a regra;
  - entram em `SEXUAL_INTERACTIONS`;
  - consequências por `followUps`: afeto, virar romance ou estragar a amizade, ciúme do parceiro, fofoca na academia,
    instrutor demitido e expulsão da academia, problema no emprego ou na faculdade quando há hierarquia;
  - eventos em `events/relationships/adult.ts` com `tags: ['adult']`.
- **Testes:**
  - `adultSafety` ampliado: 1000 vidas que tentam todas as interações novas com todos os tipos de relação, inclusive
    menores injetados e professor da escola, com "Conteúdo adulto" ligado e desligado → 0 violações;
  - locais 18+ bloqueados para menores;
  - casa de strip só com a opção ligada.

## Fase 8 — Qualidade dos avatares → **PAUSA**
1. Script Playwright que abre `/dev/avatars`, com uma seção nova de 48 NPCs aleatórios por seed, as 5 fases e a rampa
   de pele inteira, e grava as capturas em `docs/release-0.0.1/screenshots/avatars-before-*.png`.
2. Lista dos 10 piores casos com o motivo, no PROGRESS.md.
3. Correções no sistema:
   - `render.ts`: olhos com 2 px ou mais, cabeça legível em 2×;
   - `color.ts`: deslocamento de matiz na sombra e piso de contraste pele × cabelo × roupa por diferença de
     luminância;
   - contorno seletivo;
   - silhueta dos cabelos;
   - encaixe das roupas (`clothes.ts`).
4. Testes novos: altura dos olhos, contraste mínimo entre regiões vizinhas e nenhuma roupa fora da silhueta.
5. Duas rodadas de antes e depois, lado a lado (imagem composta), **enviadas a você, e paro para a sua aprovação**.

## Fase 9 — Roupas de banho e ícones de negócios (save v14: cena)
- **Roupas:**
  - `OutfitContext` ganha `'praia'`;
  - adultos (`minAge: 18`): biquíni, maiô, sunga, bermuda de praia e saída de praia, com variações de cor;
  - infantis (`maxAge: 17`): maiô inteiro, camiseta UV e bermuda;
  - `outfitFitsAge` é reforçado em `playerOutfit`, no guarda-roupa e nos NPCs.
- **Cena:** `character.scene?: 'praia'|'piscina'`, válida no ano e definida por efeito `scene`: casa de praia,
  viagem, clube de natação, evento na praia. O `deriveAvatar` escolhe a roupa de banho certa para a idade.
- **Teste:** varredura de todas as idades × contextos × NPCs → nenhuma peça adulta abaixo de 18.
- **Negócios:** pelo menos 22 tipos no Mercado (a lista pedida, com novos `BusinessDef` em `content/businesses`),
  cada um com um ícone 16×16 único em `sprites/market/`. As paletas saem de uma base comum com contorno `#2a2238` e um
  quadro de fundo pelo token, para funcionar no claro e no escuro.
- **Testes:** todo negócio tem ícone próprio, ícones distintos (hash) e paleta de até 6 cores.

## Fase 10 — Eventos novos (≥ 40) e intervalo de repetição
- **Intervalo de repetição:**
  - `GameEvent.cooldownYears?`, com padrão em dados (5 anos para `random` sem `once`);
  - `GameState.eventLastAge: Record<id, age>`, que entra na v14;
  - `eligibleEvents` passa a filtrar pelo intervalo.
- **Pelo menos 40 eventos novos**, todos com `tone` e com a sorte nos riscos:
  - infância, escola, faculdade, trabalho, rua, viagem, saúde, dinheiro, luta e vida noturna;
  - incluem os eventos de revelação de talento e os de amuleto e azar.
- **Testes:** ids únicos, schema válido, intervalo respeitado e cobertura (toda idade de 3 a 80 tem pelo menos N
  eventos elegíveis num estado típico).

## Fase 11 — Balanceamento geral
- `npm run sim` completo, com carreira, economia, vidas, dinastias e o perfil novo de treino.
- Ajuste fino. Tabelas antes × depois no GDD.

## Fase 12 — Documentação e release
- GDD, CLAUDE.md e ASSETS.md atualizados conforme a lista do pedido.
- `package.json` com `version: "0.0.1"`, exibida em Configurações pelo `define __APP_VERSION__` do Vite.
- **CHANGELOG.md** (Keep a Changelog), com o bundle gzip registrado; está em ~189 KB hoje, então provavelmente fica
  abaixo de 300 KB.
- Não existe lint no projeto. Proponho adicionar ESLint (typescript-eslint + react-hooks) com um script `lint` e
  corrigir o que aparecer.
- Teste manual com Playwright em 375×667 e 414×896, com os roteiros do checklist e o console sem erros.
- Capturas em `docs/release-0.0.1/screenshots/`.
- PROGRESS.md e HANDOFF.md, commit final e `git tag v0.0.1` local. Mostro o resumo e **não faço push**.

---

## Verificação por fase
- `npx tsc --noEmit` e os testes da área. O resumo e as falhas ficam no chat.
- Commit `release 0.0.1 (fase N): …` e PROGRESS.md atualizado.
- Quando a fase mexer na UI, Playwright rápido em 375×667.
- Se o contexto apertar: paro num ponto limpo, deixo o próximo passo exato no PROGRESS.md e peço uma sessão nova com
  "Continue a release 0.0.1 a partir do docs/release-0.0.1/PROGRESS.md".
