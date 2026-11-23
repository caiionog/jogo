# Release 0.0.2 — progresso

Pedido original: [`SPEC.md`](SPEC.md). Plano aprovado (com os nomes fictícios): [`PLAN.md`](PLAN.md).
Branch `release/0.0.2`, criada a partir de `release/0.0.1` (tag local `v0.0.1`). Um commit por fase.
**Não fazer push, merge na main ou deploy sem perguntar.**

## Checklist
- [x] **0. Plano** aprovado pelo usuário (`PLAN.md`)
- [x] **1. Treino invisível** — `engine/fighting/overtrain.ts` + textos em `content/fightText/overtrain.ts`; sem contador em nenhuma tela; 703 testes
- [x] **2. Base da carreira policial** (concurso, formação, Tiro, cargos, promoções; save v15; teste de nomes proibidos) — 732 testes
- [x] **3. Eventos da PM e da Civil**, dilemas e força especial (≥ 25 eventos) — 41 eventos `pol_*`; 748 testes
- [x] **4. Delitos**, nível de procurado, reputação no crime e dinheiro sujo — 763 testes
- [x] **5. Facções e tráfico** — 773 testes
- [x] **6. Justiça**, processo, sentença e ficha criminal — 783 testes
- [x] **7. Prisão e reintegração** (≥ 20 eventos) — 22 eventos `prisao_*`; 790 testes
- [ ] **8. Cruzamentos** entre polícia, crime, luta e relacionamentos
- [ ] **9. Interface**, fardas, uniformes e ícones
- [ ] **10. Balanceamento** (`npm run sim`, tabelas no GDD)
- [ ] **11. Documentação e release** (CHANGELOG, versão 0.0.2, capturas, tag local `v0.0.2`)

## Notas da fase 1
- Treino de modalidade, físico, sparring e clube nunca bloqueia por falta de sessão: acima do limite, `overtrainSession`
  conta a sessão, não dá ganho, registra o aviso (causa `limit`/`job`/`college`/`business` por `sessionsBreakdown`) e,
  da 2ª tentativa extra em diante, sorteia lesão leve (8%, depois 12%, ajustado por `luckRiskChance`).
- Camps de luta, "gerenciar de perto" (e o futuro estande) continuam bloqueando sem sessões, com o texto
  "Sem tempo livre para isso neste ano".
- `TrainingMeter` foi removido; textos de emprego/faculdade/empresa falam de "tempo de treino", sem número.
- Toast do treino em excesso usa o ícone ⚠ (store).
- Fixture `src/save/__fixtures__/saves-v14.json` gerada (0.0.1) — usar no teste da migração v14→v15.

## Notas da fase 2
- **Save v15** (`migrateV14toV15`): `police` (`shooting`, `career`, `exams`, `past`), `crime` (`wanted`, `rep`, `dirty`,
  `record`, `juvenile`, `faction`, `trafficking`) e `prison: null`. A flag antiga `preso` vira passagem leve.
  As fases 3–8 podem acrescentar campos **opcionais** à v15 (nada publicado ainda). Tipos em `engine/police/types.ts`
  e `engine/crime/types.ts`.
- **Dados** em `src/content/careers/police/index.ts`: 5 trilhas (`pm_praca`, `pm_oficial` = CFO interno,
  `civil_investigador`, `civil_escrivao`, `civil_delegado` com Direito), postos com `salaryMW`/`minYears`/`minMerit`,
  lotações fictícias, cursos, forças especiais **Esquadrão Sentinela** (PM) e **Grupo Âncora** (Civil) — só os
  dados; o curso de seleção é da fase 3. `POLICE_JOBS` (`policia_militar`, `policia_civil`, categoria `seguranca`,
  `publicExam: true`) entram em `content.economy.jobs`.
- **Engine** `engine/police/`: `defs.ts` (trackDef, rankTitle, policeSalary, shootingHint, policeAssessment,
  nextRankGap), `exam.ts` (`policeExamBlockReason`, `runExam`, `takePoliceExam` — 1 por ano, etapas prova/TAF/
  saúde/psico/social), `career.ts` (`startAcademy`, `policeYear` no `advanceYear` logo depois do fechamento
  econômico, `leavePolice`, ações `policeWorkHard`/`policeCourse`/`shootingRange` (1 sessão)/`requestTransfer`/
  `resignPolice`, `addNotable`). `jobYear` paga `policeSalary` para `publicExam` (sem promoção/demissão genéricas);
  `quitJob` de policial = exoneração a pedido; candidatura comum devolve `'public-exam'`.
- `engine/crime/record.ts`: `hasConviction`, `hasRecord`, `factionLinked` (flag `ex_faccao` também conta).
- **UI provisória**: Ocupação → Carreiras → **Segurança pública** → PM/Civil abre `menus/police.tsx`
  (`PolicePanel`: status, ações do ano, concursos). Store: `takePoliceExam(track)`, `policeAction(kind)`.
  Testids: `career-cat-seguranca`, `career-policia_militar`, `exam-<track>`, `police-<acao>`, `police-status`.
- Patrocinador "Energético Choque" → "Energético Faísca" (id mantido). `tests/forbiddenNames.test.ts` varre
  `src/content` e `src/ui`.

## Notas da fase 3
- **Schema**: condição `police` (`force`, `track`, `stage`, `unit`, `minRank`, `serviceYears`, `inCase`, `noCase`,
  `former`, `corregedoria`) e efeito `police` (`merit`, `shooting`, `corregedoria`, `promote`, `exonerate`,
  `notable` (aceita `{o/a}`), `shootout: tática`, `caseStart`/`caseScore`/`caseEnd`, `specialStep`, `arrest`,
  `subdue`) em `engine/police/events.ts`, ligados em `events/types.ts`, `select.ts`, `core/effects.ts` e
  `validate.ts` (casos e eventos do curso existem). Campo opcional `police.case` (v15).
- `engine/police/shootout.ts`: `shootoutOdds` (tática × Tiro/atlética/luta × sorte ±20% `SHOOTOUT_LUCK`; força
  especial com perigo ×2), `rollShootout`; `applyShootout` registra mérito, lesão (catálogo, fonte `evento`) ou morte
  (flag `morte_evento` → `killCharacter` no `resolveEvent`). Feats: `shootouts`, `arrests`, `casesSolved`,
  `mortoEmServico`.
- Investigação: placar oculto + `caseSolveChance` (sorte ±0,05); fim resolvido/arquivado/suspeito errado
  (corregedoria +1). Etapas encadeadas por `followUps` `delayYears: 0` com `police.inCase`.
- Força especial: `specialBlockReason`/`trySpecialCourse` (ação, 1 por ano) abre `pol_especial_1`; cada
  `specialStep` sorteia `specialStepChance` (base 0,26 + atlética/Tiro/saúde acima do mínimo; ≈ 19% de aprovação
  dos candidatos) e a engine enfileira a etapa seguinte. Botão `special-try` no `PolicePanel`.
- `post('crime', +x)` soma em `crime.dirty` (categoria nova `crime` = "Dinheiro ilícito", não tributável).
- RelType novo `conhecido` (grupo "Conhecidos" em Relações); `arrest` cria pessoa com `preso_por_voce`.
- Eventos: `content/events/police/{pm,civil,life}.ts` (PM 9, Civil 14 em 4 casos, vida/dilemas/academia/curso 18).

## Notas da fase 4
- **Dados** `src/content/crime/index.ts`: 13 `CrimeDef` (4 leves 12+, 4 médios 18+, 5 graves 18+; 4 graves com
  `plan`), `CRIME` (`planEvents`, `suspicionEventId`, `places`: Centro Socioeducativo Rumo Novo, Programa Portas
  Abertas). O tráfico fica na fase 5.
- **Engine** `engine/crime/`: `crimes.ts` — **guarda única `crimeAllowed(state, def | 'faccao' | 'trafico')`**,
  `crimeBlockReason` (máx. 2× o mesmo delito/ano), `crimeSuccessChance`, `commitCrime`/`runCrime` (ganho via
  `post('crime')` → `dirty`, `committed`/`earned`, ferimento, morte rara via `killCharacter`, pego →
  `arrest`), `crimeRiskLabel`, pistas `wantedHint`/`crimeRepHint` (com sexo), `crimeYear` (no `advanceYear` ANTES
  do fechamento econômico: investigação com chance `wanted/250` se ≥ 20, suspeita do dinheiro sujo agendada,
  procurado −15, rep −2 sem crime, `dirty ≤ money`), `launderBlockReason`/`launderMoney` (60% do sujo, taxa 20%,
  risco). `arrest.ts`: `arrest(state, crimeId, rng, content, source)` — menor → `juvenileMeasure` (advertência,
  serviço comunitário ou internação curta com flag `internacao_ano`), adulto → passagem na ficha + `feats.arrested`.
  **A fase 6 deve trocar a passagem por processo/sentença dentro de `arrest`.** `plan.ts`: `startPlan`,
  condição `crime` e efeito `crime` (`wanted`, `rep`, `planTeam/Target/Time/Go`, `arrest`, `seizeDirty`); os
  eventos do plano são enfileirados pela engine.
- Campos opcionais novos na v15: `crime.plan`, `crime.committed`, `crime.earned`.
- **Eventos** `content/events/crime/index.ts` (11): 4 etapas do plano, suspeita, 2 de adolescência (só leves),
  convite da Turma do Viaduto, testemunha, família descobre, parceiro preso.
- **UI** `menus/crime.tsx` (Atividades → Crime, `act-crime`, `crime-<id>`, `crime-launder`, `crime-hints`);
  store: `commitCrime` (abre o pop-up de resultado), `startPlan`, `launderMoney`.

## Notas da fase 5
- **Dados** `content/crime/factions/index.ts`: Liga da Serpente, Clã do Corvo, Ordem do Sol Partido, Maré Cinzenta
  (`FactionDef`: `short`, `colors`, `symbol`, `territory.ufs/cities`, `size`, `rivals`, `rules`) e `FACTION_RANKS`.
  `CRIME.factionEvents` = `crime_faccao_missao` / `crime_faccao_saida`.
- **Engine** `engine/crime/faction.ts`: `factionsHere`, `factionAtWar`, `joinFaction` (18+; família −12, amigos
  −8 ou 12% entram junto com flag `faccao`), `tryLeaveFaction` (abre o evento de saída), `leaveFaction`,
  `factionYear` (renda por posto, guerra com rival no território, dívida cobrada ou morte, promoção, missão
  agendada), `TRAFFICKING` (pequeno/médio/grande), `startTrafficking`/`stopTrafficking`/`traffickingYear`
  (lucro −30% se em facção, apreensão, ferimento, prisão, morte). Rodam dentro de `crimeYear`; o `advanceYear` para
  se o personagem morrer ali.
- Condição `crime`: `factionWar`, `factionHere` (guardadas por 18+). Efeito `crime`: `joinFaction`, `leaveFaction`,
  `factionDebt`, `stopTrafficking`. O validador barra evento de facção/tráfico/plano com `minAge < 18`.
- Eventos `content/events/crime/faction.ts` (9). UI: seções Facção (`crime-faction`, `crime-leave-faction`) e
  Tráfico (`crime-trafico-<nivel>`, `crime-trafico-stop`) na tela de Crime; store `tryLeaveFaction`, `setTrafficking`.
- `tests/adultSafety.test.ts` agora também tenta todos os delitos, o plano e o tráfico com 12–17 anos (`crimeMinor`).

## Notas da fase 6
- **Dados** `content/crime/sentences.ts`: `SENTENCES` (faixas fictícias por delito/motivo, inclusive `corrupcao`,
  `excesso`, `fuga`, `investigacao`), `BAILABLE`, `FACILITIES` (Vale Cinzento provisório, Pedra Funda fechado, Boa
  Semente semiaberto, Recomeço aberto, Ala de Custódia Especial). `CRIME.justiceEvents` (delegacia, defesa,
  julgamento) em `content/events/crime/justice.ts`.
- **Engine** `engine/crime/justice.ts`: `arrest` de adulto agora registra a passagem e chama `openCase` (campo
  opcional `crime.case`: `crimeId`, `confessed`, `lawyer`, `quality`, `free`, `wasPolice`); efeitos `crime.plea`,
  `crime.lawyer` (`chooseLawyer`: Defensoria; particular caro — amigo/parente com `job` /Advogad/ cobra metade;
  quem trabalha como advogado se defende; fiança automática se cabível e houver dinheiro, ou liberdade provisória →
  julgamento agendado para o ano seguinte; senão julgamento imediato), `crime.verdict` (`verdict`: absolvição
  0,05–0,6; `computeSentence` = faixa × 1,5 reincidência × 1,25 facção × (1 − defesa/400) × 0,67 confissão × sorte
  ±10%; ≤ 1 ano = pena alternativa; senão `imprison`). `imprison`: regime por `regimeFor` (> 8 fechado, 4–8
  semiaberto, < 4 aberto), perde emprego (exceto aberto), policial demitido → ala especial, facção = proteção.
  `prisonYear` (no `advanceYear` logo depois do `crimeYear`): +1 ano, soltura quando `served + remission ≥ sentence`
  (flag `egresso`), condicional na metade com comportamento ≥ 60 (60%), progressão fechado→semiaberto em 1/4 e
  →aberto em 2/4 com comportamento ≥ 50. **A remição (`prison.remission`) ainda não é preenchida: fase 7 (ações de
  trabalhar/estudar na prisão, +0,25/ano).**
- Condição `crime`: `inCase`, `imprisoned`. `JobDef.requires.cleanRecord` (professor particular, cuidador,
  segurança) → motivo `'record'`; `hireChance` −0,25 com condenação; preso (fechado/semiaberto) não se candidata.

## Notas da fase 7
- **Engine** `engine/crime/prison.ts`: `behindBars` (fechado/semiaberto), `prisonAction` (`trabalhar`/`estudar` =
  remição 0,25 e +comportamento, 1×/ano; `treinar` até `PRISON_TRAIN_LIMIT` = 4; `conversar` cria conhecido com flag
  `detento`; `visita` pelo afeto do parente mais próximo; `quieto` +8 comportamento), `attemptEscape` (5–30%;
  falha = pena + `SENTENCES.fuga`, volta ao fechado, condenação "fuga"; sucesso = foragido, procurado 90),
  `yearsLeft`. Efeito `crime`: `behavior`, `remission`, `escape`, `protection`. Condição `crime`: `wing`, `regime`.
- Bloqueios enquanto atrás das grades: `actionBlockReason` → `'prison'`, `trainingBlockReason` → `'prison'`,
  empregos; faculdade trancada no `imprison`; **só eventos com `conditions.crime.imprisoned` são sorteados**
  (`isEligible`).
- Reintegração: `prisonYear` marca a flag `egresso`; o evento `auto` `prisao_reintegracao` (Programa Portas Abertas
  → flag `portas_abertas` reduz a penalidade da ficha na contratação para 0,1; família; antigos parceiros).
- **Eventos** `content/events/prison/index.ts` (22, inclusive 2 da Ala de Custódia Especial e 3 de egresso).
  `tests/prison.test.ts` varre termos de violência sexual.
- **UI** `menus/prison.tsx`: `PrisonBanner` (na tela principal, `prison-banner`) e `PrisaoScreen` (Atividades vira
  Prisão; `prison-<acao>`). Store `prisonAction`.

## Próximo passo exato (para a sessão nova)
1. `npm install`. Confira `npm run lint`, `npm test` (790 testes) e `npx tsc --noEmit`.
2. **Fase 8 — Cruzamentos**, conforme `PLAN.md`: policial prende NPC ligado a você (família/ex-amigo com flag
   `crime`/`faccao`) num dilema; policial com corregedoria alta pode ser preso por corrupção/excesso
   (`openCase(state, 'corrupcao'|'excesso')` → ala especial já existe em `imprison`); lutador: brigas de rua/prisão
   mexem na reputação, ser preso cancela contrato e patrocínios (`cancelSponsors`), evento de redenção na luta
   para egresso; parentes com crime/facção geram eventos para o policial e para o criminoso.
3. Depois da 0.0.2: o usuário pediu a **release 0.0.3** (texto completo no fim do pedido da sessão anterior; começa
   pela fase 0 = plano com aprovação).
