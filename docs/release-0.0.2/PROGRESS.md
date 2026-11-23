# Release 0.0.2 — progresso

Pedido original: [`SPEC.md`](SPEC.md). Plano aprovado (com os nomes fictícios): [`PLAN.md`](PLAN.md).
Branch `release/0.0.2`, criada a partir de `release/0.0.1` (tag local `v0.0.1`). Um commit por fase.
**Não fazer push, merge na main ou deploy sem perguntar.**

## Checklist
- [x] **0. Plano** aprovado pelo usuário (`PLAN.md`)
- [x] **1. Treino invisível** — `engine/fighting/overtrain.ts` + textos em `content/fightText/overtrain.ts`; sem contador em nenhuma tela; 703 testes
- [x] **2. Base da carreira policial** (concurso, formação, Tiro, cargos, promoções; save v15; teste de nomes proibidos) — 732 testes
- [ ] **3. Eventos da PM e da Civil**, dilemas e força especial (≥ 25 eventos)
- [ ] **4. Delitos**, nível de procurado, reputação no crime e dinheiro sujo
- [ ] **5. Facções e tráfico**
- [ ] **6. Justiça**, processo, sentença e ficha criminal
- [ ] **7. Prisão e reintegração** (≥ 20 eventos)
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

## Próximo passo exato (para a sessão nova)
1. `npm install`. Confira `npm run lint`, `npm test` (732 testes) e `npx tsc --noEmit`.
2. **Fase 3 — Eventos policiais, dilemas e força especial** (≥ 25 eventos em `src/content/events/police/`), conforme
   `PLAN.md`: condição `police` e efeito `police` no schema de eventos (`engine/events/types.ts`, `select.ts`,
   `validate.ts`, `core/effects.ts`), `engine/police/shootout.ts` (troca de tiro com seed), casos encadeados da
   Civil com placar oculto em `police.case` (campo opcional novo da v15), NPCs presos com flag `preso_por_voce`,
   curso de seleção da força especial (aprovação 10–25%).
