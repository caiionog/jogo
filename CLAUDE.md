# CLAUDE.md — Vida de Lutador

Simulador de vida no navegador, estilo BitLife, focado na carreira de lutador.
Design completo e roadmap em [`GDD.md`](./GDD.md). Textos do jogo em português (BR).

## Stack
- Vite + React 19 + TypeScript (strict, `noUncheckedIndexedAccess`)
- Tailwind CSS v4 (`@tailwindcss/vite`, sem arquivo de config)
- Zustand (estado da UI) · idb-keyval (save em IndexedDB) · Vitest (testes)
- Mobile-first: layout de coluna única (`max-w-md`), alvos de toque grandes, botão principal fixo no rodapé.

## Comandos
```bash
npm install         # dependências
npm run dev         # servidor de desenvolvimento (http://localhost:5173)
npm test            # Vitest (uma execução); npm run test:watch para modo watch
npm run typecheck   # tsc --noEmit
npm run build       # typecheck + build de produção em dist/
npm run preview     # serve o build de produção (PWA: service worker, offline, instalar) em http://localhost:4173
npm run sim         # balanceamento: npm run sim -- N M L D (carreiras até 40, perfis econômicos, vidas completas, dinastias)
npm run bench       # performance: "Avançar ano" com save de 80 anos (grava tmp/save-80.json)
npm run icons       # regera os PNGs do PWA a partir de public/icons/icon.svg
npm run build:artifact -- caminho.html   # versão de teste em arquivo único (sem service worker)
```
Antes de commitar: `npm test && npm run build`.

## Regras de arquitetura (obrigatórias)
1. **`src/engine/` é TypeScript puro.** Nunca importa React, DOM, `src/ui`, `src/content` ou `src/save`,
   nem pacotes npm. Funções no formato `(estado, ação, conteúdo) => novoEstado`, sem mutar a entrada.
   O conteúdo é injetado via `GameContent`. (Verificado por `tests/architecture.test.ts`.)
2. **RNG determinístico** em `engine/core/rng.ts` (mulberry32). Proibido `Math.random()` na engine.
   O estado do RNG vive em `GameState.rngState`; use o helper `withRng` em `game.ts`. A seed vem da UI.
3. **Conteúdo é dado** em `src/content/`. Eventos seguem o schema `GameEvent` (`engine/events/types.ts`,
   detalhado abaixo) e são validados por `validateContent` (`engine/events/validate.ts`) nos testes.
4. **`GameState` é JSON puro** com campo `version`. Ao mudar o formato: incremente `STATE_VERSION`
   (`engine/core/state.ts`) e adicione a migração `n → n+1` em `src/save/migrations.ts` + teste.
   Versão atual: **6** (v5→v6: `fighter.injury` vira lesão do catálogo em `health.injuries`, `health.brainDamage`
   estimado pelos nocautes do histórico, `fighter.retired`, `feats`, `dynasty` geração 1, `ending`, `economy.will`;
   saves mortos ganham o fim de vida; fixtures em `tests/fixtures/saves-v5.json`). Cadeia testada: v1 → v6.
   v4→v5 criou `economy` — extrato vazio, moradia pela idade, patrimônio dos pais, regime de bens
   parcial para casados — e `energy.reserved`; fixtures em `tests/fixtures/saves-v4.json`).
   v3→v4 adicionou `relationships` com família coerente com a idade e "Conteúdo adulto" desligado. v2→v3 adicionou corpo, `fighter`, `world` e `activeFight`.
   Versão 2: A migração v1→v2 cria `education` coerente com a idade, `familyWealth` e `scheduledEvents`,
   usando um RNG próprio (derivado da seed) para não alterar o `rngState`. Antes de mudar o formato de novo, gere
   uma fixture com saves reais da versão atual em `tests/fixtures/`.
   O **armazenamento meta** (conquistas, Hall da Fama, estatísticas, preferências) é separado do save da vida: chave
   `meta` no IndexedDB, `META_VERSION` e `metaMigrations` em `src/save/meta.ts`. Saves de vida ficam em 3 slots
   (`save:slot1..3`, slot ativo em `slot:active`); a chave antiga `save:current` migra para o slot 1.
5. **Dinheiro é inteiro e só muda por `post()`** (`engine/economy/ledger.ts`): `post(estado, categoria, valor, rótulo)`
   lança no extrato do ano. Nunca escreva `money: s.money + x`. Invariante testada: `money − ledger.opening === Σ
   lançamentos`. Arredonde com `toMoney`. Efeitos `money` de eventos já viram `post('eventos')`.
6. **A UI (`src/ui/`) só lê o estado e despacha ações** pelo store Zustand (`ui/store.ts`), que chama a engine.
   Nenhuma regra de jogo dentro de componentes.

## Estrutura
```
src/
  engine/                 # regras do jogo (puro, testável)
    core/                 # rng, state (tipos), stats, effects, content (tipos), game (newGame/performAction/advanceYear/resolveEvent)
    character/            # criação de personagem, names.ts (geradores de nomes/escolas + preposições)
    lifeStages/           # fases da vida, energia, school.ts (matrícula, ano letivo, transferência, clubes)
    events/               # schema (types.ts), seleção (select.ts), validação de conteúdo (validate.ts)
    fighting/             # carreira de luta (Etapa 3)
      simulateFight.ts    # luta round a round (máquina de estados) — narração vem de content.fighting.text
      types.ts            # habilidades, organizações, academias, ofertas, elencos, perfil
      profile.ts body.ts training.ts belts.ts   # perfil, corpo/categoria, treino, faixas
      orgs.ts world.ts ranking.ts matchmaking.ts # requisitos/contratos, NPCs, ranking, adversários
      career.ts           # ofertas, aceitar/córner/resultado, viradas de ano, efeitos `fighter`, academia
    relationships/        # relacionamentos (Etapa 4)
      types.ts            # Person, Relation, traços, configurações
      guards.ts           # canDate, isValidPartnerAge, canMarry, canHaveSexualContent, adultContentAllowed
      people.ts family.ts # pessoas/relações (limite de 40 ativas), família, envelhecimento e morte
      actions.ts social.ts romance.ts year.ts   # ações, amizades/efeitos `social`, namoro/casamento/filhos, ciclo anual
    economy/              # economia (Etapa 5)
      types.ts            # EconomyState, Ledger, Loan, Job, Business, Asset, defs de conteúdo
      ledger.ts           # post (ÚNICA forma de mudar dinheiro), categorias, histórico, toMoney
      market.ts bank.ts taxes.ts   # ano econômico por seed, poupança/índice/empréstimos (Price), IR/previdência/IPTU
      jobs.ts business.ts fightIncome.ts   # empregos (energia reservada), empresas, empresário/contrato/patrocínio
      living.ts family.ts worth.ts close.ts  # custo de vida/dívida/falência, herança/divórcio/pensão, patrimônio, fechamento
      effects.ts actions.ts   # efeitos `economy` de eventos; ações prontas para a UI (com a guarda economyAction)
    assets/               # bens: mercado anual, compra/financiamento/venda, aluguel, depreciação
    fighting/injuries/    # lesões (Etapa 6): sorteio por dano/zona, agravamento, tratamento, sequelas, dano cerebral
    fighting/retirement.ts  # aposentadoria voluntária/forçada (veto médico, lesão, derrotas) e volta
    health/               # types (HealthState, catálogos), aging (doenças, hábitos, pistas do dano cerebral), death, effects
    legacy/               # will (testamento/partilha), finalize (morte, obituário, nota), succession (continuar como filho)
    meta/                 # conquistas: metrics (registro de métricas puras), achievements (avaliação, Hall da Fama), feats
  content/                # dados (GAME_CONTENT em index.ts)
    actions.ts            # ações (categoria 'vida' | 'escola')
    clubs.ts              # clubes escolares
    locations.ts
    names/                # nomes fictícios de pessoas e escolas
    events/childhood.ts   # eventos de infância (Etapa 1)
    events/school/        # eventos escolares por fase + disciplina + marcos
    events/fighting/      # eventos de carreira de luta (base.ts, pro.ts)
    organizations/        # organizações (index.ts) e categorias de peso (divisions.ts)
    gyms/                 # academias por cidade
    fightText/            # narração da luta (index.ts), apelidos e lesões (nicknames.ts)
    relationships/        # traços de personalidade (traits.ts) e profissões (jobs.ts)
    events/relationships/ # família, amigos, romance, adult (tag 'adult'), filhos, amor × carreira
    jobs/ assets/ businesses/ sponsors/ economy/   # vagas, catálogo de bens, empresas, patrocinadores, impostos/cidades
    events/economy/       # eventos de economia (work.ts, money.ts, assets.ts)
    injuries/ health/     # catálogo de lesões e sequelas; doenças e custos das ações de saúde
    legacy/ achievements/ # regras de herança/legado; 50 conquistas (dados)
    events/health/ events/legacy/   # aposentadoria, doenças e mortes por evento; eventos de legado (2ª geração+)
scripts/sim.ts            # balanceamento (Node/tsx, só engine + conteúdo); bench.ts (performance); icons.mjs
  save/                   # migrations.ts (versão/migrações), storage.ts (3 slots), meta.ts (meta separado), transfer.ts (exportar/importar)
  ui/                     # store.ts, App.tsx, pwa.ts, screens/ (Life, NewLife, Obituary), components/ (painéis, Sheet, MenuSheet, MetaScreens, Toasts)
public/icons/             # ícones originais do PWA (SVG + PNGs gerados)
tests/                    # Vitest; fixtures/saves-v1.json = saves reais da Etapa 1 para testar migração
```

## Relacionamentos e a regra de conteúdo adulto (obrigatória)
- **`Person`** (`engine/relationships/types.ts`) é o modelo único de NPC (família, amigos, amores, filhos, treinador,
  rivais). **`Relation`** liga o personagem a cada pessoa (tipo, afeto, histórico curto, romance). Lutadores do elenco
  (Etapa 3) entram por referência (`Person.npcId`), nunca copiados. Respeite `MAX_ACTIVE_PEOPLE` (`enforcePeopleLimit`).
- **`canHaveSexualContent(personagem, parceiro)`** (`guards.ts`) exige **as duas idades ≥ 18**. TODA ação, evento ou
  efeito sexual tem de passar por ela (inclusive gravidez e IST) — não reimplemente a regra em outro lugar.
  Parceiros só via `isValidPartnerAge` (14–17 → 14–17 com no máximo 2 anos de diferença; 18+ → 18+); noivado/casamento
  via `canMarry`.
- Eventos com conteúdo adulto levam `tags: ['adult']`, `minAge >= 18` e, com alvo, `relationship.personAge.min >= 18`
  (o validador exige). O motor ainda filtra pela opção **"Conteúdo adulto"** (`relationships.settings.adultContent`,
  desligada por padrão) e pela idade do personagem e do alvo. Textos sugestivos, nunca gráficos.
- `tests/adultSafety.test.ts` simula 1000 vidas e falha se qualquer evento `adult` aparecer com menor de 18 ou com a
  opção desligada, ou se um namoro adolescente sair da faixa. Mantenha-o passando.

## Schema de eventos (`GameEvent`)
```ts
{
  id: 'f2_crush',                 // único
  trigger?: 'random' | 'auto' | 'followUp',   // padrão 'random' (sorteado por peso)
  weight: 6,                      // > 0 para 'random'
  once?: true,                    // só uma vez por vida
  tags?: ['adult'],               // conteúdo adulto (ver regra acima)
  conditions: {
    minAge?, maxAge?, sex?, stats?: { strength: { min: 25 } },
    flagsAll?: [...], flagsNone?: [...],
    enrolled?: boolean, schoolStages?: ['pre'|'fund1'|'fund2'|'medio'], schoolType?: 'publica'|'particular',
    school?: { average?: {min,max}, discipline?: {...}, popularity?: {...} },
    club?: ['judo', 'wrestling'] | 'any' | 'none',
    schoolResult?: ['passed'|'failed'|'honors'|'graduated'|'expelled'],  // resultado do último ano letivo
    fighting?: { orgs?, tiers?: ['none'|'kids'|'amateur'|'regional'|'major'], contracted?, ranked?, rankMax?,
                 champion?, belt?: {min,max}, amateurWins?, proWins?, reputation?, hasGym?, injured?, suspended?,
                 orgEligible?: 'titan', beltPromotionReady?, hasFought?, retired?, retiredYears?, lossStreak? },
    relationship?: { types: ['amigo'], affection?, traits?, personAge?, stages?, sameGym?, personFlag?, personFlagNone? }, // alvo {pessoa}
    hasRelation?, noRelation?, civilStatus?: ['solteiro'|'ficando'|'namorando'|'noivo'|'casado'|'divorciado'],
    children?: {min,max}, partnerAge?: {min,max},
    health?: { injured?, sequela?: [ids], brainDamage?: {min,max}, conditions?: [ids] | 'any', healthStat?, hasVehicle? },
    legacy?: { generation?: {min,max}, parentChampion?, inheritedGym? },
    economy?: { money?, netWorth?, debt?: {min,max}, employed?, jobs?, jobCategory?, hasAsset?: ['imovel'|'veiculo'|'luxo'],
                ownsBusiness?, businessDefs?, econYear?: ['normal'|'crise'|'boom'], hasSponsor?, hasAgent?, hasLoan?,
                housing?, evadedTax?, invested?, rentingOut? },
  },
  text: '... {colega} ... {professor} ... {da_escola} ... {o/a}',
  choices: [{ id, label, resultText, effects?, risk?: { chance, effects?, resultText } }],  // 2–3 escolhas
}
```
- **`trigger`**: `'auto'` entra sempre que as condições batem (marcos como formatura e reprovação; use com `once` ou
  `schoolResult`). `'followUp'` nunca é sorteado e só acontece quando outra escolha o agenda.
- **Efeitos** (`Effects`, `engine/core/effects.ts`): `stats`, `money`, `setFlags`, `clearFlags`,
  `school: { average, discipline, popularity, absences, suspend, expel, changeSchool: { type? }, joinClub, leaveClub }`
  (ignorado fora da escola), `fighter: { skills, reputation, joinGym: 'local'|'best'|id, leaveGym, signWith: orgId,
  injury: { name?, years } (legado: vira lesão do catálogo), suspendYears, vacateTitles, promoteBelt,
  offer: { kind: 'shortNotice'|'rival'|'titleDefense'|'bjjOpen'|'farewell' }, retire: motivo, unretire }`,
  `health: { injury: id|'random', heal, brainDamage, condition, controlCondition: id|'var', sequela, die: causa }`,
  `social: { affection (do alvo), meet: { context }, addFromVar: { var, type }, setType, endRelation, breakUp, stage,
  wedding: 'simple'|'big', divorce, pregnancyChance, ist, giveUpPregnancy, adopt, personHealth, setPersonFlags,
  parentsAffection }`, `economy: { post: {cat, amount, label}, postShareOfMoney, hireAgent, fireAgent, agentScam,
  signSponsor, cancelSponsors, loseJob, promote, jobOffer, assetDamage, vehicleTheft, investLoss, sellBusinessOffer,
  taxFine, evade, lend, inherit, regime, investShare, savingsShare, parentGift }` e `followUps: [{ eventId, delayYears }]`. Com `delayYears ≥ 1`, o evento é agendado em
  `scheduledEvents` e herda as variáveis do evento de origem (o mesmo `{colega}`). Com `0`, fica pendente na hora.
  Ao disparar, as condições são reavaliadas; se não baterem, o agendamento é descartado.
- **Placeholders**: `{name}`, `{city}`, `{escola}`, `{da_escola}`/`{na_escola}` (do/da, no/na conforme o nome),
  `{colega}`, `{professor}`, `{clube}`, `{lutador}` (nome 'apelido' sobrenome; também `{lutador_nome}`, `{lutador_apelido}`),
  `{pessoa}`/`{pessoa_nome}`/`{relacao}` (alvo da condição `relationship`), `{antecessor}`/`{seu_pai}` (legado),
  `{doenca}` (diagnóstico)
  — sorteados quando o evento entra na fila — e `{o/a}` (gênero do personagem).
  Também funcionam nos rótulos das escolhas.
- **Ordem do tick anual** (`advanceYear`): fim do ano letivo → fim do ano de luta (ofertas expiram, faixa, mensalidade,
  lesão) → lesões (`injuriesYear`: 12 meses, sequelas) → fechamento econômico (`closeEconomicYear`: emprego, patrocínios, empresas, bens, juros, custo de vida,
  parcelas, impostos, dívida, arquivo do extrato) → envelhecer → saúde (`healthYear`: doenças, dano cerebral, hábitos)
  → corpo → sorteio de morte (`deathCheck` → `killCharacter`: obituário, nota, partilha) → início do ano letivo/matrícula → energia → relacionamentos (envelhecer/morte,
  nascimentos, despesas, decaimento, desgaste, carreira × família, limite) → início do ano de luta (declínio, mundo
  dos NPCs, ofertas) → eventos (agendados vencidos + `auto` + 1–2 aleatórios).
- **Luta em andamento** (`GameState.activeFight`) bloqueia ações, avançar ano e novas lutas até `closeFight`.

## Como adicionar conteúdo
- **Evento:**
  1. Escolha o arquivo pela fase (`src/content/events/school/<fase>.ts` ou `events/childhood.ts`). Arquivo novo
     precisa ser incluído no `index.ts` da pasta.
  2. Escreva o objeto `GameEvent` (veja o schema acima) com id único e 2–3 escolhas.
  3. Para continuar a história no ano seguinte, crie um segundo evento com `trigger: 'followUp'` e agende-o em
     `effects.followUps` da escolha.
  4. Rode `npm test`: `tests/content.test.ts` roda `validateContent` (ids, clubes e alvos de `followUp` existentes,
     `risk.chance` entre 0 e 1).
- **Ação:** adicione um `ActionDef` em `src/content/actions.ts` com `category`, custo de energia, idade mínima,
  `requires?: { enrolled, schoolStages }`, efeitos, textos e `risk?` (efeitos extras com probabilidade).
- **Clube:** adicione um `ClubDef` em `src/content/clubs.ts` (`minStage`, `combat`, `joinEffects`, `yearlyEffects`).
- **Organização:** adicione um `OrgDef` em `src/content/organizations/index.ts` (tier, sport, regras, idade, requisitos,
  `contract`, `rankingSize` (>0 exige contrato), rounds, bolsa, custo de camp, faixa de habilidade dos NPCs). Se tiver
  contrato, crie um evento `trigger: 'auto'` com `conditions.fighting.orgEligible` e efeito `fighter.signWith`.
  Depois rode `npm run sim` e confira o balanceamento.
- **Academia:** adicione um `GymDef` em `src/content/gyms/index.ts` (`city` precisa existir em `locations.ts`, ou `null`).
- **Evento de luta:** em `src/content/events/fighting/` (base = infância/amador, pro = profissional), usando
  `conditions.fighting` e `effects.fighter`.
- **Traço:** adicione um `TraitDef` em `src/content/relationships/traits.ts` (`actionMods`, `jealousy`, `fightStance`,
  `likes`/`dislikes` com ids existentes).
- **Evento de relacionamento:** em `src/content/events/relationships/<tema>.ts` com `conditions.relationship` (alvo
  `{pessoa}`) e `effects.social`. Romance adolescente: `maxAge <= 17` e `relationship.personAge` 14–17. Conteúdo
  sexual: arquivo `adult.ts`, `tags: ['adult']`, `minAge >= 18`, `personAge.min >= 18`.
- **Ação de relacionamento:** acrescente o tipo em `InteractionKind` (`types.ts`), custo/rótulo em `actions.ts`, onde ela
  se aplica em `applicableInteractions` (se for sexual, inclua em `SEXUAL_INTERACTIONS` e condicione a
  `canHaveSexualContent`/`adultContentAllowed`) e o efeito em `runInteraction`. A UI mostra sozinha.
- **Texto de luta:** acrescente variações em `src/content/fightText/index.ts` na chave do tipo de lance. Placeholders:
  `{a}` (quem age), `{b}`, `{golpe}`, `{finalizacao}`, `{n}`, `{plano}`, `{placar}`, `{tipo}`. O validador exige todas as chaves.

- **Emprego:** `JobDef` em `src/content/jobs/index.ts` (`category` 'meio_periodo'|'formal'|'luta', `minAge`, `education`,
  `minStats?`, `minReputation?`, `fightReq?`, `salary: [nível 1, nível 5]` antes do custo da cidade, `energy` reservada/ano).
- **Bem:** `AssetDef` em `src/content/assets/index.ts` (`kind`, `price: [min,max]` — imóveis × cidade —, `happiness`,
  `reputation?`, `article?` para o log, `variants?`). Taxas/depreciação ficam em `engine/assets/assets.ts`.
- **Empresa:** `BusinessDef` em `src/content/businesses/index.ts` (`startCost`, `revenue`, `cost`, `managerCost`, `combat?`).
- **Patrocinador:** `SponsorDef` em `src/content/sponsors/index.ts` (marca fictícia, `minReputation`, `amount`, `years`,
  `maxLossStreak`, `scandal`).
- **Evento econômico:** em `src/content/events/economy/`, com `conditions.economy` e `effects.economy`. Valores sempre
  inteiros. Depois rode `npm run sim` e confira a tabela de perfis econômicos.
- **Cidade nova:** inclua o custo em `content/economy/index.ts` (`cityCost`); salários e imóveis escalam por ele.

- **Lesão:** `InjuryDef` em `src/content/injuries/index.ts` (`severity` 1–4, `months: [min,max]`, `cost`, `effects.skills`
  na luta, `surgery?`, `sequelaChance` + `sequelaId` de `SEQUELAE`, `sources`, `zone`, `weight?`, `brainDamage?`).
  Nome antigo da Etapa 3 → id em `LEGACY_INJURY_NAMES`. Rode `npm run sim` (lesão grave em 35–60% das carreiras pro).
- **Doença:** `ConditionDef` em `src/content/health/index.ts` (`minAge`, `baseChance` < 0,2, `healthPerYear`,
  `deathMult` ≥ 1, `treatmentCost`, `risk`, `deathCause`).
- **Conquista:** `AchievementDef` em `src/content/achievements/index.ts` (`metric` existente em `engine/meta/metrics.ts`,
  `min`/`max`, `secret?`, `onDeath?`). Métrica nova = função pura `(state, meta) => number` em `METRICS` (contadores da
  vida vão em `state.feats` via `bumpFeat`/`maxFeat`). Acrescente o caso em `tests/achievementsReachable.test.ts`.
- **Evento de legado:** em `src/content/events/legacy/` com `conditions.legacy` (`generation: { min: 2 }`,
  `parentChampion`, `inheritedGym`) e os placeholders `{antecessor}`/`{seu_pai}`.

## Saúde, morte e legado (Etapa 6)
- Lesões vivem em `GameState.health` (não em `fighter`). Só lesão grave (≥ 3) com mais de 6 meses veta luta
  (`injuryVeto`); lutar lesionado pesa nas habilidades e pode agravar. O dano cerebral é **oculto**: a UI só mostra
  pistas (`brainHint`), nunca o número.
- A morte passa sempre por `killCharacter` (ano ou evento com `health.die`): preenche `character.death` e `ending`
  (obituário, nota, partilha). `continueAsChild` cria o novo estado mantendo `world`, `year`, `seed` e `rngState`.
- O Hall da Fama e as conquistas são calculados pela engine (`evaluateAchievements`, `recordLifeEnd`) e gravados pela
  UI no meta; a data (ISO) vem da UI.

## Flags importantes (ganchos entre etapas)
`interesse_luta`, `brigou_na_escola`, `medalha_interescolar`, `caminho_18` ('faculdade' | 'trabalho' | 'luta'),
`gostaDeLuta`, `artesMarciais`, `sonhaSerLutador`, `formado`, `repetente`, `expulso`, `suspenso`, `bolsista`,
`pensa_aposentar` (gancho de aposentadoria), `casado`, `divorciado`, `viuvo`, `recem_nascido`, `primeiro_beijo`,
`pais_separados`, `ist`, `falencia`, `empresa_faliu`, `academia_propria`, `sonegar_ano`, `aposentado`,
`academia_herdada`, `filho_de_campeao`, `lutador_mirim` (herdado), `pensou_parar_derrotas`/`medico_parar` (controle dos
eventos de aposentadoria); nas pessoas: `interesse_luta`, `lutador_mirim` (gancho do legado), `academia`, `separados`, `pediu_dinheiro`.

## Regras de conteúdo
- Use **somente organizações, ligas, academias, eventos e lutadores fictícios** (ex.: "Circuito Titã", "ARC").
  Nada de UFC, Bellator, ONE, PFL, IBJJF, marcas, bancos ou empresas reais, nem nomes de pessoas reais (`tests/content.test.ts` barra os nomes de ligas).
- Textos em pt-BR, segunda pessoa ("Você...").
