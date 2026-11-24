# CLAUDE.md — Vida Real (release 0.0.1)

Simulador de vida no navegador, estilo BitLife: escola, faculdade, trabalho, empresas, esporte, carreira de luta
(destaque), família, dinheiro e legado. Nome provisório "Vida Real" (o formato do save continua `vida-de-lutador`).
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
npx tsx scripts/sprites/gen-bodies.ts            # regera as silhuetas de pixel art (body/generated.ts)
npx tsx scripts/sprites/png-to-grid.ts arq.png   # importa um corpo desenhado no Aseprite (ver ASSETS.md)
npm run build:artifact -- caminho.html   # versão de teste em arquivo único (sem service worker)
npm run lint        # oxlint (o typescript-eslint ainda não suporta o TypeScript 7)
npx tsx scripts/gen-fixtures.ts                  # fixture de saves reais da versão atual (antes de mudar o formato)
node scripts/e2e/release-check.mjs 375 667 tmp/rc tmp/e2e-states.json   # roteiro de release no navegador
```
Antes de commitar: `npm run lint && npm test && npm run build`.

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
   Versão atual: **15** (release 0.0.2: v14→v15 cria `police`, `crime` e `prison: null`; a flag antiga `preso`
   vira passagem leve na ficha; campos opcionais `police.case`, `crime.plan/case/committed/earned`; fixture
   `saves-v14.json`). Release 0.0.1: v8→v9 `energy` sai, entra `yearUses` e ofertas com `campSessions`; v9→v10
   `skills.jiujitsu` → `grappling`, `belt` → `fighter.grades` por modalidade, academias com `modalities`; v10→v11
   talentos e sorte (RNG `seed:v11:*`); v11→v12 `college` e `character.diplomas`; v12→v13 `sportsClub` e `exchange`;
   v13→v14 `character.scene` (praia/piscina) e `eventLastAge` (intervalo de repetição). Fixtures novas em
   `src/save/__fixtures__/saves-v8..v13.json` (as antigas foram movidas de `tests/fixtures/`). Cadeia testada: v1 → v14.
   v7→v8: `strength/fitness` viram `athletic`; as 6 habilidades viram `jiujitsu`/`trocacao` +
   `chinBase` no personagem, nos elencos, nas ofertas e na luta em andamento; guarda-roupa por camadas; sardas e pintas
   por RNG próprio `seed:v8:*`; fixtures em `tests/fixtures/saves-v7.json`). Cadeia testada: v1 → v8.
   v6→v7: só Brasil (cidade estrangeira → UF/cidade sorteada), aparência/genes para todas as pessoas com família
   coerente, guarda-roupa inicial (RNG `seed:v7`; fixtures `saves-v6.json`).
   v5→v6: `fighter.injury` vira lesão do catálogo em `health.injuries`, `health.brainDamage`
   estimado pelos nocautes do histórico, `fighter.retired`, `feats`, `dynasty` geração 1, `ending`, `economy.will`;
   saves mortos ganham o fim de vida; fixtures em `tests/fixtures/saves-v5.json`.
   v4→v5 criou `economy` — extrato vazio, moradia pela idade, patrimônio dos pais, regime de bens
   parcial para casados — e `energy.reserved`; fixtures em `tests/fixtures/saves-v4.json`).
   v3→v4 adicionou `relationships` com família coerente com a idade e "Conteúdo adulto" desligado. v2→v3 adicionou corpo, `fighter`, `world` e `activeFight`.
   Versão 2: A migração v1→v2 cria `education` coerente com a idade, `familyWealth` e `scheduledEvents`,
   usando um RNG próprio (derivado da seed) para não alterar o `rngState`. Antes de mudar o formato de novo, gere
   uma fixture com saves reais da versão atual em `src/save/__fixtures__/` (`npx tsx scripts/gen-fixtures.ts`).
   O **armazenamento meta** (conquistas, Hall da Fama, estatísticas, preferências) é separado do save da vida: chave
   `meta` no IndexedDB, `META_VERSION` e `metaMigrations` em `src/save/meta.ts`. Saves de vida ficam em 3 slots
   (`save:slot1..3`, slot ativo em `slot:active`); a chave antiga `save:current` migra para o slot 1.
5. **Dinheiro é inteiro e só muda por `post()`** (`engine/economy/ledger.ts`): `post(estado, categoria, valor, rótulo)`
   lança no extrato do ano. Nunca escreva `money: s.money + x`. Invariante testada: `money − ledger.opening === Σ
   lançamentos`. Arredonde com `toMoney`. Efeitos `money` de eventos já viram `post('eventos')`.
6. **A UI (`src/ui/`) só lê o estado e despacha ações** pelo store Zustand (`ui/store.ts`), que chama a engine.
   Nenhuma regra de jogo dentro de componentes.
7. **Habilidades de luta nunca aparecem como número na UI.** `fighter.skills` (jiu-jitsu, trocação) e o queixo
   (`chinOf`) são ocultos: a UI mostra só pistas (frase do treinador, `coachAssessment` em palavras, faixa, cartel,
   ranking). O teste de navegação (`tests/ui.test.tsx`) falha se um número de habilidade for renderizado. Os 5
   atributos visíveis (`STAT_KEYS`: health, happiness, intelligence, looks, athletic) podem aparecer.
8. **Não discriminação**: cor ou raça e genes são só demografia e aparência; nunca entram em mecânica, chances,
   salários ou condições de evento (`tests/fairness.test.ts`).

## Estrutura
```
src/
  engine/                 # regras do jogo (puro, testável)
    core/                 # rng, state (tipos), stats, effects, content (tipos), game (newGame/performAction/advanceYear/resolveEvent)
    character/            # criação de personagem, names.ts (geradores de nomes/escolas + preposições)
    lifeStages/           # fases da vida, sessions.ts (10 treinos/ano, retorno decrescente), college.ts, sportsClub.ts, nightlife.ts, school.ts (matrícula, ano letivo, transferência, clubes)
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
      jobs.ts business.ts fightIncome.ts   # empregos (sessões reservadas), empresas, empresário/contrato/patrocínio
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
  ui/                     # store.ts, nav.ts (pilha de menus + Voltar), App.tsx, pwa.ts
    design/               # tokens.css (claro/escuro), components.tsx (ListItem, MenuScreen, StatBar, BottomNav, AgeButton…), modals.tsx
    screens/              # Life (tela principal), NewLife (criação), Obituary; menus/ (occupation, assets, activities, NavHost)
    avatar/               # pixel/ (render.ts, bodygen.ts, color.ts, PixelCanvas, icon.ts), PixelAvatar, AvatarThumb, AvatarSheet, thumbnails
    dev/                  # /dev/avatars (só no dev)
    components/ text/     # painéis reaproveitados nos menus (Sheet, MenuSheet, MetaScreens, Toasts, FightScreen…), textos de UI
  content/geo/ content/outfits/ content/sprites/   # Brasil (UFs/cidades/IBGE), roupas, grades de pixel art (corpos, regras de roupa, ícones)
  engine/geo/ engine/character/appearance/          # sorteio de local; genes, herança, deriveAvatar, guarda-roupa
  engine/economy/careers.ts content/jobs/basic/ content/events/jobs/   # carreiras, empregos básicos, eventos de trabalho
  engine/police/ engine/crime/   # release 0.0.2: carreira policial (defs, exam, career, events, shootout); crime (crimes, plan, faction, arrest, justice, prison, record)
  content/careers/police/ content/crime/ content/events/{police,crime,prison}/ content/sprites/crimeIcons.ts   # dados da 0.0.2
scripts/sprites/          # gen-bodies.ts (gera body/generated.ts), png-to-grid.ts (importa PNG do Aseprite)
public/icons/             # ícones originais do PWA (SVG + PNGs gerados)
tests/                    # Vitest; fixtures/saves-v1.json = saves reais da Etapa 1 para testar migração
```

## Relacionamentos e a regra de conteúdo adulto (obrigatória)
- **`Person`** (`engine/relationships/types.ts`) é o modelo único de NPC (família, amigos, amores, filhos, treinador,
  rivais). **`Relation`** liga o personagem a cada pessoa (tipo, afeto, histórico curto, romance). Lutadores do elenco
  (Etapa 3) entram por referência (`Person.npcId`), nunca copiados. Respeite `MAX_ACTIVE_PEOPLE` (`enforcePeopleLimit`).
- **`canHaveSexualContent(personagem, parceiro)`** (`guards.ts`) exige **as duas idades ≥ 18** (com não parceiros, use
  `canHaveSexualContentWith`). TODA ação, evento ou
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
    minAge?, maxAge?, sex?, stats?: { athletic: { min: 25 } },
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
  (ignorado fora da escola), `fighter: { skills: { jiujitsu, trocacao, athletic, chin } (SkillDelta), reputation, joinGym: 'local'|'best'|id, leaveGym, signWith: orgId,
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
  → corpo → sorteio de morte (`deathCheck` → `killCharacter`: obituário, nota, partilha) → início do ano letivo/matrícula → ano da faculdade → zera `yearUses`/sessões → relacionamentos (envelhecer/morte,
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
- **Ação:** adicione um `ActionDef` em `src/content/actions.ts` com `category`, idade mínima,
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

- **Emprego:** prefira o formato da Etapa 8 em `src/content/jobs/basic/` (ver "Como adicionar (Etapa 8)"). Os empregos
  da Etapa 5 continuam em `src/content/jobs/index.ts` (`category` 'aprendiz'|'meio_periodo'|'formal'|'luta', `minAge`,
  `education`, `minStats?`, `minReputation?`, `fightReq?`, `salary: [nível 1, nível 5]` antes do custo da cidade,
  `trainingSessions` reservadas/ano: 0, 2 ou 4).
- **Bem:** `AssetDef` em `src/content/assets/index.ts` (`kind`, `price: [min,max]` — imóveis × cidade —, `happiness`,
  `reputation?`, `article?` para o log, `variants?`). Taxas/depreciação ficam em `engine/assets/assets.ts`.
- **Empresa:** `BusinessDef` em `src/content/businesses/index.ts` (`startCost`, `revenue`, `cost`, `managerCost`, `combat?`;
  Etapa 8: `open` (abrir do zero/franquia), `forSale` + `saleNames` (aparece à venda no Mercado), `risk`). Regras do
  fechamento (`businessYear`): o prejuízo sai do bolso do dono (extrato) nos 2 primeiros anos e depois só se o ano
  anterior foi positivo; dois anos seguidos no vermelho, ou sem dinheiro para cobrir, o negócio quebra e a venda dos
  equipamentos devolve 25% de `startCost × nível`. Rode `npm run sim` (empresas quebradas do perfil empreendedor ~13%).
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

## Brasil e aparência (Etapa 7)
- **Só Brasil**: 27 UFs e cidades em `src/content/geo/brasil/` (`data.generated.ts` é gerado por `scripts/geo-fetch.ts`
  a partir do IBGE; o jogo não acessa a rede). Nascimento sorteado pela população; `cityMultOf` escala salários,
  aluguel, imóveis e saúde. Mudança de cidade: `moveTo`/`moveBlockReason` (18+, R$ 3.000 na UF, R$ 8.000 fora) ou
  efeito de evento `move: { to: 'outra_capital'|'mesma_uf', cost? }`.
- **Nomes**: IBGE por década e região; nome completo = nome + sobrenome da mãe + sobrenome do pai.
- **Aparência**: genes em `engine/character/appearance/` (`sample.ts` por cor ou raça com faixas amplas e sobrepostas,
  `inherit.ts` para filhos, `parentsFor` para família coerente). Usa um RNG próprio (`lookRng`): nunca mexe no
  `rngState`. `deriveAvatar` é puro e nada do avatar vai para o save. A regra 8 (não discriminação) vale para tudo isso.
- **Cidade nova**: entra pelo script de dados; academia nova precisa de `city` existente nos dados de geo.

## Interface (Etapa 8)
- **Tela principal** (`screens/Life.tsx`): busto pixel (toque → Perfil/guarda-roupa), feed da vida por idade, "Treinos: X/10", atalho "Carreira de Luta",
  5 barras, barra inferior Ocupação · Bens · **+ Idade** · Relações · Atividades. Menu ≡: Conquistas, Hall da Fama,
  Saves, Configurações, Nova vida.
- **Menus em camadas**: `useNav().open(id, params)` empilha uma tela; `NavHost.tsx` mapeia o id para título e corpo
  (`MenuScreen` + `ListItem`). O Voltar do sistema (popstate) fecha um nível. Mapa completo no GDD §10.
- **Sistema de design**: use os tokens `--ds-*` (`design/tokens.css`) e os componentes de `design/components.tsx`;
  toque ≥ 44 px, contraste AA nos dois modos, animações com `prefers-reduced-motion`. Ícones: lucide-react.
- **Ação desabilitada mostra o motivo** (`ListItem disabled reason=…`), vindo de uma `*BlockReason` da engine.
- **Pop-ups**: `EventModal` (evento + miniatura do NPC) e `ResultModal` (texto + diff dos atributos visíveis, calculado
  no store por `diffOf`, não no `GameState`). Ações viram toast.
- **Avatar**: `PixelAvatar` (corpo inteiro ou `bust`), `AvatarThumb` (miniatura com cache) e `AvatarSheet` (perfil e
  guarda-roupa por camada). NPCs: `personAvatar`/`fighterAvatar` (`avatar/descriptors.ts`). Direção de arte em `ASSETS.md`.
- **Finanças**: "Anos anteriores" abre cada ano arquivado por categoria (`economy.history[].totals`).
- **Telas antigas** (`components/CareerPanel`, `FinancePanel`, `HealthPanel`, `RelationshipsPanel`, `RankingPanel`…)
  são reaproveitadas dentro dos menus; algumas ainda usam classes `slate-*`, que o `tokens.css` remapeia para os
  tokens. Ao mexer numa delas, prefira `var(--ds-*)` e evite `text-white`/cores fixas (contraste no tema claro).

### Verificação (Etapa 8)
- Testes de UI em `tests/ui.test.tsx` (jsdom + Testing Library; o save é mockado e `canvas.getContext` devolve null).
- Antes de entregar uma mudança visível: `npm run dev` e Playwright (já instalado; não rode `playwright install`) em
  375×667 e 414×896. Os `data-testid` principais: `age-button`, `nav-<menu>`, `screen-<id>`, `event-choice`,
  `result-ok`, `career-<jobId>`, `apply-job`, `offer-card`, `biz-offer`, `buy-confirm`, `my-asset`, `my-business`.
- Para testar um cenário, gere o `GameState` com a engine (Node/tsx) e grave em IndexedDB (`keyval-store`/`keyval`,
  chaves `save:slot1` e `slot:active`) antes de recarregar a página.
- Versão de teste: `npm run build:artifact -- arquivo.html` (fragmento com `<meta charset="utf-8">`, sem service
  worker). "Exportar save" não funciona nessa versão (sem permissão de download).

### Como adicionar (Etapa 8)
- **Item de menu**: `ListItem` na tela-mãe (`screens/menus/*.tsx`) com `onClick={() => nav.open('id')}` e o caso
  `'id'` em `NavHost.tsx`. Se precisar de regra, crie a função na engine e a ação no store.
- **Emprego básico**: `JobDef` em `src/content/jobs/basic/index.ts` (`minAge`, `requires { studying, schoolStages,
  acceptGraduated, cnh }`, `salaryMW: [início, teto]` em salários mínimos/mês, `formal`, `ladder` com títulos e
  multiplicadores, `hireChance`, `yearlyEffects`, `trainingSessions`, `description`; nível superior: `requires.degree`/`license` em
  `src/content/jobs/superior/`). Aparece sozinho em Carreiras.
- **Categoria de carreira**: `CareerCategory` e `careerCategoryOf` em `engine/economy/careers.ts` + título em
  `CAT_TITLE` (NavHost).
- **Atividade**: `ActionDef` em `src/content/actions.ts` e o item no grupo certo de `menus/activities.tsx`.
- **Imóvel/veículo/luxo**: `AssetDef` (`where?: 'litoral'|'interior'`, `size`, `noRent`, `teen`) + ícone em
  `content/sprites/market/` (`ICON_FOR`). **Empreendimento**: `BusinessDef` (`open`, `forSale`, `saleNames`, `risk`).
- **Roupa, cabelo, barba, expressão**: ver `ASSETS.md` (roupa = `OutfitDef` + regra em `sprites/clothes.ts`).
- **Pista do treinador**: frases em `src/content/fightText/coach.ts`.

## Saúde, morte e legado (Etapa 6)
- Lesões vivem em `GameState.health` (não em `fighter`). Só lesão grave (≥ 3) com mais de 6 meses veta luta
  (`injuryVeto`); lutar lesionado pesa nas habilidades e pode agravar. O dano cerebral é **oculto**: a UI só mostra
  pistas (`brainHint`), nunca o número.
- A morte passa sempre por `killCharacter` (ano ou evento com `health.die`): preenche `character.death` e `ending`
  (obituário, nota, partilha). `continueAsChild` cria o novo estado mantendo `world`, `year`, `seed` e `rngState`.
- O Hall da Fama e as conquistas são calculados pela engine (`evaluateAchievements`, `recordLifeEnd`) e gravados pela
  UI no meta; a data (ISO) vem da UI.

## Release 0.0.1 — vida além da luta
- **Sem energia.** Cada ano tem **10 sessões de treino** (`content/config.ts`, `LIMITS`), divididas entre modalidades,
  físico, sparring, clube esportivo e camps de luta (`offer.campSessions`). Ficam reservadas 4 sessões com emprego
  integral, 2 com meio período ou estágio, 2 com a faculdade e 2 com "gerenciar de perto". Tudo isso está em
  `engine/lifeStages/sessions.ts` (`sessionsLeft`, `sessionsReserved`, `sessionsBreakdown`, `useSessions`). As outras
  atividades não têm limite, mas rendem menos a cada repetição no ano: `repeatMultiplier`/`scalePositiveEffects`,
  contadas em `yearUses`. Só os efeitos positivos diminuem. Não use mais "energia" nem "⚡" em textos (há um teste).
- **Talentos ocultos** (`content/talents/`, `engine/character/talents.ts`): sorteados ao nascer com o RNG derivado e
  herdáveis (`heritBonus`). Só aparecem no Perfil depois de revelados por evento (`effects.revealTalent`, condição
  `talent`). Os `mods` são pequenos e lidos por funções puras.
- **Sorte oculta** (`character.luck`, 0–100): nunca aparece como número. Os limites ficam em `LUCK`: peso de evento ±25%
  conforme `tone: 'good'|'bad'`, risco ±8 pp (`risk.tone`, padrão `'bad'`), lances de KO e finalização ±3% e no
  máximo ±10 por evento (`effects.luck`). Os valores novos usam sempre um RNG derivado, `createRng(seedToState(\`${seed}:…\`))`,
  e nunca o `rngState` (fairness).
- **Interações sexuais com não parceiros** (amigo, colega de treino, treinador, `professor`) passam por
  `canHaveSexualContentWith(state, pessoa)` (`guards.ts`). A função usa `adultContentAllowed`, que exige 18+ dos dois e
  a opção ligada, e barra o professor da escola enquanto o personagem estuda. Não reimplemente essa regra.
- **Roupa de banho só para 18+** quando é peça adulta (`minAge: 18`). As peças infantis têm `maxAge: 17`, e
  `swimOutfit`/`outfitFitsAge` filtram por idade. A cena (`character.scene`) vem de um efeito `scene`. Há uma
  varredura em `tests/swimwear.test.ts`.
- **Intervalo de repetição**: um evento `random` sem `once` não volta antes de `LIMITS.eventCooldown` (5) anos, ou do
  `cooldownYears` do próprio evento (`eventLastAge`).

### Como adicionar (release 0.0.1)
- **Curso**: `CourseDef` em `src/content/college/index.ts` (`years`, `cutoffPublic`, `cutoffPrivate`, `tuition` em
  salários mínimos, `difficulty`, `develops`). Os empregos que exigem o curso usam `requires.degree: [id]`.
- **Modalidade**: `ModalityDef` em `src/content/martialArts/index.ts` (`skill: 'grappling'|'trocacao'`,
  `graduation?`). Ela precisa estar em `modalities` de alguma academia (`content/gyms/`), além do rótulo em
  `ui/text/fight.ts`.
- **Graduação**: um sistema em `GRADUATIONS` (mesmo arquivo), com níveis `{ id, label, color, stripe?, minAge,
  minYears, minSkill }`. O exame é o evento automático com a condição `fighting.gradeReady` e o efeito
  `fighter.promoteGrade`.
- **Clube esportivo**: `SportsClubDef` em `src/content/sportsClubs/index.ts` (`city|null`, `fee`, `sports`, `minAge`).
  Os eventos ficam em `events/clubs/`, com a condição `sportsClub`.
- **Intercâmbio**: `ExchangeProgramDef` em `src/content/exchange/index.ts`.
- **Local da vida noturna**: `VenueDef` em `src/content/nightlife/index.ts` (`minAge`, `maxAge?`, `adult?`, `cost`,
  `events`). Local `adult` exige 18+ e "Conteúdo adulto". Os eventos ficam em `events/nightlife/`.
- **Talento**: `TalentDef` em `src/content/talents/index.ts`, com `chance` 0,05–0,15 (negativos menos), `mods`
  existentes e `hint`. Inclua também um evento de revelação em `events/talents/`.
- **Ícone de negócio**: um glifo 8×7 em `BUSINESS_GLYPHS` (`content/sprites/market/business.ts`), com o mesmo id do
  `BusinessDef`. A fachada comum, o contorno e a moldura saem de `businessIcon`. O teste exige um ícone por negócio,
  todos distintos e com no máximo 6 cores.
- **Evento**: marque `tone` (bom ou ruim) para a sorte agir, e `cooldownYears` se 5 anos não servir.
  `tests/eventsCoverage.test.ts` confere que toda idade tem eventos elegíveis.

## Polícia, crime, justiça e prisão (release 0.0.2)
- **Regras de conteúdo (obrigatórias):**
  - tudo fictício: facções, forças especiais, operações, presídios, pessoas;
  - "Polícia Militar" e "Polícia Civil" sem sigla nem estado;
  - crime é mecânica (escolha, chance, risco, consequência), **nunca manual**: nada de método, técnica, receita ou
    detalhe operacional real;
  - violência curta e não gráfica;
  - **prisão sem violência sexual**, nem como insinuação (`tests/prison.test.ts`);
  - nenhum lado glamourizado.
- **Teste de nomes proibidos:** `tests/forbiddenNames.test.ts` varre `src/content` e `src/ui` atrás de nomes e siglas
  de facções e unidades reais (PCC, CV, BOPE, ROTA, "Choque"…) e de "Polícia Militar/Civil" ao lado de UF ou de sigla
  de UF (`PMSP`). Não use essas palavras nem em comentários.
- **Menores:** a guarda única `crimeAllowed(state, def | 'faccao' | 'trafico')` (`engine/crime/crimes.ts`) libera
  delitos leves a partir dos 12 e médios, graves, facção, tráfico e plano só a partir dos 18. Menor pego recebe medida
  socioeducativa (`juvenileMeasure`) e entra na ficha juvenil, que não conta depois dos 18. O validador barra evento de
  facção, tráfico ou plano com `minAge < 18`. `tests/adultSafety.test.ts` (1000 vidas) falha se um menor fizer algo
  disso.
- **Ocultos:** Tiro (`police.shooting`), procurado (`crime.wanted`) e reputação no crime (`crime.rep`) nunca aparecem
  como número. A UI usa `shootingHint`, `wantedHint` e `crimeRepHint`.
- **Dinheiro ilícito** entra só por `post(s, 'crime', +x)`, que soma em `crime.dirty` e `crime.earned`.
- **Ordem no `advanceYear`:** `crimeYear` (facção, tráfico, investigação, suspeita, procurado −15), depois
  `prisonYear`, depois o fechamento econômico, depois `policeYear`. Atrás das grades (fechado ou semiaberto), só eventos
  com `conditions.crime.imprisoned` são sorteados e as ações comuns devolvem `'prison'`.
- **Esquemas novos de evento:**
  - condição `police`: `force`, `track`, `stage`, `unit`, `minRank`, `serviceYears`, `inCase`, `noCase`, `former`,
    `corregedoria`;
  - efeito `police`: `merit`, `shooting`, `corregedoria`, `promote`, `exonerate`, `notable`, `shootout`, `caseStart`,
    `caseScore`, `caseEnd`, `specialStep`, `arrest`, `subdue`;
  - condição `crime`: `wanted`, `rep`, `dirty`, `record`, `juvenile`, `planning`, `faction`, `trafficking`,
    `factionWar`, `factionHere`, `inCase`, `imprisoned`, `wing`, `regime`, `committed`;
  - efeito `crime`: `wanted`, `rep`, `planTeam`, `planTarget`, `planTime`, `planGo`, `arrest`, `seizeDirty`,
    `joinFaction`, `leaveFaction`, `factionDebt`, `stopTrafficking`, `plea`, `lawyer`, `verdict`, `behavior`,
    `remission`, `escape`, `protection`.

### Como adicionar (release 0.0.2)
- **Cargo policial:** um posto em `ranks` da trilha em `src/content/careers/police/index.ts` (`title`, `titleF?`,
  `salaryMW`, `minYears`, `minMerit`). Trilha nova: `PoliceTrackDef` (`entry`, `ageRange`, `education`, `degree?`,
  `cut`, `course`, `postings`) e o id em `PoliceTrackId`.
- **Evento policial:** em `src/content/events/police/` (`pm.ts`, `civil.ts`, `life.ts`), com id `pol_*`, condição
  `police` e efeito `police`. Caso novo da Civil: id em `POLICE.cases`, 1ª etapa com `caseStart` e `noCase: true`,
  etapas `trigger: 'followUp'` com `inCase`, encadeadas por `followUps` com `delayYears: 0`, e a última com `caseEnd`.
- **Delito:** `CrimeDef` em `src/content/crime/index.ts` (`tier`, `minAge` 12 ou 18, `baseSuccess`, `gain`, `risk`,
  `wantedGain`, `repGain`, `minCrimeRep?`, `plan?`, `text` sem método) + faixa de pena em `crime/sentences.ts` + ícone
  em `sprites/crimeIcons.ts` (o teste de ícones exige os três).
- **Facção:** `FactionDef` em `src/content/crime/factions/index.ts` (nome e símbolo inventados, `territory`, `rivals`
  existentes, `rules`) + glifo em `FACTION_GLYPHS`. Rode `tests/forbiddenNames.test.ts`.
- **Evento de prisão:** em `src/content/events/prison/index.ts`, id `prisao_*`, `minAge: 18` e
  `crime: { imprisoned: true }` (com `wing`/`regime` se quiser). Nada de violência sexual.
- **Balanceamento:** `npm run sim` (6º argumento = vidas por perfil de polícia e crime) ou
  `SIM_CRIME_N=200 npx tsx scripts/simCrime.ts`. Metas e tabela no GDD §10c.

## Skills do projeto (release 0.0.3)
Instaladas com `npx skills add` em `.agents/skills/` (link em `.claude/skills/`; versões travadas em
`skills-lock.json`). Todas são só instruções em Markdown, sem scripts. Antes de instalar outra, leia o SKILL.md e os
scripts dela; nada de origem duvidosa, binários ou acesso amplo.

| Skill | Para que serve | Quando usar |
|---|---|---|
| `find-skills` | Procurar skills no índice skills.sh | Antes de propor uma skill nova (se a CLI vier vazia, use `https://skills.sh/api/search?q=…`) |
| `web-design-guidelines` | Revisão de UI e UX contra diretrizes de interface | Ao terminar uma tela nova ou mexer em layout |
| `accessibility` | Auditoria WCAG 2.2 | Toque ≥ 44 px, contraste nos dois temas, `prefers-reduced-motion`, leitores de tela |
| `vitest` | Referência do Vitest | Testes da engine, mocks, benchmarks (ex.: avatar em < 5 ms) |
| `react-testing-library` | Testes de componentes centrados no usuário | `tests/ui.test.tsx` e testes novos de tela |
| `frontend-design` | Direção visual e tipografia | Visual cartoon, cenários e telas novas |
| `code-review` | Revisão de um diff contra os padrões do repositório e o pedido | Antes de cada commit de fase (o subagente `reviewer` se apoia nela) |
| `better-portuguese` | Revisão de texto em PT-BR | Eventos, textos de UI, CHANGELOG e documentação |

## Subagents e orquestração (release 0.0.3)
Agentes do projeto em `.claude/agents/`, com frontmatter validado por `tests/agents.test.ts`:

| Agente | Escopo | Ferramentas |
|---|---|---|
| `engine-dev` | `src/engine/`, `tests/` (nunca `src/ui/`) | Read, Edit, Write, Bash, Grep, Glob |
| `ui-dev` | `src/ui/` (nunca regra de jogo) | Read, Edit, Write, Bash, Grep, Glob |
| `content-writer` | `src/content/`; roda os testes de conteúdo antes de terminar | Read, Edit, Write, Bash, Grep, Glob |
| `avatar-artist` | `src/ui/avatar/`, `src/content/sprites/`, `src/ui/dev/`; capturas de `/dev/avatars` | Read, Edit, Write, Bash, Grep, Glob |
| `test-runner` | tsc, lint, testes, build → resumo e falhas (modelo leve) | Read, Bash, Grep |
| `reviewer` | revisa o diff contra este arquivo e devolve problemas, sem editar | Read, Grep, Glob, Bash |

Regras:
- **Papéis.** A sessão principal planeja, divide o trabalho, integra e decide. Os subagents executam tarefas com
  escopo fechado.
- **Arquivos.** Cada tarefa delegada diz exatamente quais arquivos e pastas o subagent pode alterar. Dois subagents
  nunca alteram os mesmos arquivos ao mesmo tempo.
- **Paralelismo.** Tarefas independentes rodam em paralelo. Quando houver risco de conflito, use isolamento por git
  worktree (`isolation: "worktree"`) e faça o merge na sessão principal.
- **Tipos compartilhados primeiro.** Mudanças em `GameState`, no schema de eventos (`GameEvent`, `Effects`) ou em
  `AvatarDescriptor` são feitas antes de delegar o resto, na sessão principal, junto com a migração de save.
- **Verificação.** Todo resultado de subagent passa pelo `test-runner` e pelo `reviewer` antes do commit.
- **Retorno.** Os subagents devolvem um resumo curto (o que mudou, arquivos, testes), não o código inteiro.

## Flags importantes (ganchos entre etapas)
`interesse_luta`, `brigou_na_escola`, `medalha_interescolar`, `caminho_18` ('faculdade' | 'trabalho' | 'luta'),
`gostaDeLuta`, `artesMarciais`, `sonhaSerLutador`, `formado`, `repetente`, `expulso`, `suspenso`, `bolsista`,
`pensa_aposentar` (gancho de aposentadoria), `casado`, `divorciado`, `viuvo`, `recem_nascido`, `primeiro_beijo`,
`pais_separados`, `ist`, `falencia`, `empresa_faliu`, `academia_propria`, `sonegar_ano`, `aposentado`,
`academia_herdada`, `filho_de_campeao`, `lutador_mirim` (herdado), `pensou_parar_derrotas`/`medico_parar` (controle dos
eventos de aposentadoria), `egresso`, `portas_abertas`, `recomecou`, `foragido`, `ex_faccao`, `turma_viaduto`,
`internacao_ano`, `curso_especial_ano`; nas pessoas: `interesse_luta`, `lutador_mirim` (gancho do legado), `academia`, `separados`, `pediu_dinheiro`, `preso_por_voce`, `crime`, `faccao`, `policial`, `detento`.

## Regras de conteúdo
- Use **somente organizações, ligas, academias, eventos e lutadores fictícios** (ex.: "Circuito Titã", "ARC").
  Nada de UFC, Bellator, ONE, PFL, IBJJF, marcas, bancos ou empresas reais, nem nomes de pessoas reais (`tests/content.test.ts` barra os nomes de ligas).
- Textos em pt-BR, segunda pessoa ("Você...").
