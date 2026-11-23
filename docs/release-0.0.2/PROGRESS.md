# Release 0.0.2 — progresso

Pedido original: [`SPEC.md`](SPEC.md). Plano aprovado (com os nomes fictícios): [`PLAN.md`](PLAN.md).
Branch `release/0.0.2`, criada a partir de `release/0.0.1` (tag local `v0.0.1`). Um commit por fase.
**Não fazer push, merge na main ou deploy sem perguntar.**

## Checklist
- [x] **0. Plano** aprovado pelo usuário (`PLAN.md`)
- [ ] **1. Treino invisível**
- [ ] **2. Base da carreira policial** (concurso, formação, Tiro, cargos, promoções; save v15; teste de nomes proibidos)
- [ ] **3. Eventos da PM e da Civil**, dilemas e força especial (≥ 25 eventos)
- [ ] **4. Delitos**, nível de procurado, reputação no crime e dinheiro sujo
- [ ] **5. Facções e tráfico**
- [ ] **6. Justiça**, processo, sentença e ficha criminal
- [ ] **7. Prisão e reintegração** (≥ 20 eventos)
- [ ] **8. Cruzamentos** entre polícia, crime, luta e relacionamentos
- [ ] **9. Interface**, fardas, uniformes e ícones
- [ ] **10. Balanceamento** (`npm run sim`, tabelas no GDD)
- [ ] **11. Documentação e release** (CHANGELOG, versão 0.0.2, capturas, tag local `v0.0.2`)

## Próximo passo exato (para a sessão nova)
1. `npm install` e `git checkout release/0.0.2`. Confira `npm run lint`, `npm test` (695 testes) e `npx tsc --noEmit`.
2. Gere a fixture da 0.0.1 antes de qualquer mudança de formato: `npx tsx scripts/gen-fixtures.ts` →
   `src/save/__fixtures__/saves-v14.json`.
3. **Fase 1 — Treino invisível**, conforme `PLAN.md`. Onde estão as peças:
   - o bloqueio `'no-sessions'` fica em `engine/fighting/training.ts` (`trainingBlockReason`) e em
     `engine/lifeStages/sportsClub.ts`;
   - o `TrainingMeter` aparece em `ui/screens/Life.tsx`, `menus/activities.tsx`, `menus/clubs.tsx` e
     `menus/fightCareer.tsx`;
   - o teste `tests/ui.test.tsx:127` espera "Treinos: 0/10" e precisa mudar.
