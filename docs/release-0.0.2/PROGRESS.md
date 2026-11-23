# Release 0.0.2 — progresso

Pedido original: [`SPEC.md`](SPEC.md). Plano aprovado (com os nomes fictícios): [`PLAN.md`](PLAN.md).
Branch `release/0.0.2`, criada a partir de `release/0.0.1` (tag local `v0.0.1`). Um commit por fase.
**Não fazer push, merge na main ou deploy sem perguntar.**

## Checklist
- [x] **0. Plano** aprovado pelo usuário (`PLAN.md`)
- [x] **1. Treino invisível** — `engine/fighting/overtrain.ts` + textos em `content/fightText/overtrain.ts`; sem contador em nenhuma tela; 703 testes
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

## Notas da fase 1
- Treino de modalidade, físico, sparring e clube nunca bloqueia por falta de sessão: acima do limite, `overtrainSession`
  conta a sessão, não dá ganho, registra o aviso (causa `limit`/`job`/`college`/`business` por `sessionsBreakdown`) e,
  da 2ª tentativa extra em diante, sorteia lesão leve (8%, depois 12%, ajustado por `luckRiskChance`).
- Camps de luta, "gerenciar de perto" (e o futuro estande) continuam bloqueando sem sessões, com o texto
  "Sem tempo livre para isso neste ano".
- `TrainingMeter` foi removido; textos de emprego/faculdade/empresa falam de "tempo de treino", sem número.
- Toast do treino em excesso usa o ícone ⚠ (store).
- Fixture `src/save/__fixtures__/saves-v14.json` gerada (0.0.1) — usar no teste da migração v14→v15.

## Próximo passo exato (para a sessão nova)
1. `npm install` e `git checkout release/0.0.2` (ou a branch de trabalho da sessão). Confira `npm run lint`,
   `npm test` (703 testes) e `npx tsc --noEmit`.
2. **Fase 2 — Base da carreira policial**, conforme `PLAN.md` (save v15, `tests/forbiddenNames.test.ts`,
   renomear o patrocinador "Energético Choque" para "Energético Faísca" mantendo o id).
