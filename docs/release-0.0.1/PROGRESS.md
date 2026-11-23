# Release 0.0.1 — progresso

Branch `release/0.0.1` (local; **sem push** até o usuário pedir). Plano aprovado em 2026-11-23 (fase 0).
Para retomar numa sessão nova: "Continue a release 0.0.1 a partir do docs/release-0.0.1/PROGRESS.md".

## Ponto de partida
- Etapa 8 completa (v1.2): 572 testes em 43 arquivos, typecheck/build limpos, save v8.
- Pendências herdadas: faculdade "Em breve", referências do avatar, Aseprite só corpos, telas antigas com `slate-*`,
  verificação 414×896 dos fluxos longos, valor de negócio no prejuízo = 0.

## Fases
- [x] **0. Plano** — aprovado (pontos confusos da carreira e esboço da tela central no plano).
- [x] **1. Fim da energia e limite de sessões** (save v9)
  - `GameState.energy` saiu; entrou `yearUses` (retorno decrescente). Módulo `engine/lifeStages/sessions.ts`
    (`sessionsLeft/Reserved/Breakdown`, `repeatMultiplier`, `scalePositiveEffects`); limites em `content/config.ts`.
  - Treino e sparring = 1 sessão; camp de luta = `offer.campSessions` (substituição 1, org + 1 no título);
    `JobDef.trainingSessions` 4/2/0; "gerenciar de perto" = 2 sessões; academia, saúde, fisioterapia, patrocínio,
    clubes escolares sem custo. CNH: 1 tentativa por ano. Ação genérica `train` removida.
  - UI: "Treinos: 8/10" (tela principal e Treino) com "Seu emprego ocupa 2 sessões de treino"; nenhum ⚡/energia.
  - Migração v8→v9 + fixture real `saves-v8.json`; `tests/sessions.test.ts` (22 testes).
  - Bug antigo corrigido: cinturão vago passava de graça para o jogador (#1) sem registrar o título
    (`removeFromRanking`/`world.ts`) — teste em `ranking.test.ts`.
  - Balanceamento provisório: `SESSION_GAIN = 0.45` em `training.ts` (10 sessões ≈ 3× mais treinos que a energia).
    Sim 300 vidas: Titã 38% (antes 28,6%), campeão Titã 5% (2,8%). A fase 2 recalibra.
- [ ] **2. Modalidades, grappling, graduações, academias, ganho de treino** (save v10)
- [ ] **3. Tela central da Carreira de Luta** (meta: `seenTips`)
- [ ] **4. Talentos e sorte** (save v11)
- [ ] **5. Faculdade, cursos e empregos de nível superior** (save v12)
- [ ] **6. Clubes esportivos e intercâmbio** (save v13)
- [ ] **7. Vida noturna e interações adultas**
- [ ] **8. Qualidade dos avatares** — PAUSA para aprovação do antes × depois
- [ ] **9. Roupas de banho e ícones de negócios** (save v14)
- [ ] **10. Eventos novos (≥ 40) e intervalo de repetição**
- [ ] **11. Balanceamento geral** (`npm run sim`, GDD)
- [ ] **12. Documentação e release** (CHANGELOG, versão 0.0.1, tag local `v0.0.1`)

## Decisões
- Fixtures de saves passaram de `tests/fixtures/` para `src/save/__fixtures__/` (checklist da release). Cada versão
  nova do save ganha a fixture real da versão anterior gerada por `npx tsx scripts/gen-fixtures.ts` **antes** de mudar
  o formato.
- Uma versão de save por fase que muda o estado (v9…v14).

## Pendências / notas
- Scripts de apoio: `scripts/gen-fixtures.ts` (fixture da versão atual), `scripts/e2e/state.ts` (cenário) e
  `scripts/e2e/shot.mjs` (Playwright: injeta o save no IndexedDB e tira capturas; `URL` opcional).
