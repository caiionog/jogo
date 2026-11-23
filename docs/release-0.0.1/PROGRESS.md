# Release 0.0.1 — progresso

Branch `release/0.0.1` (local; **sem push** até o usuário pedir). Plano aprovado em 2026-11-23 (fase 0):
[`PLAN.md`](./PLAN.md) — leia antes de continuar (decisões de modelagem de cada fase).
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
- [x] **2. Modalidades, grappling, graduações, academias, ganho de treino** (save v10)
  - Habilidade `jiujitsu` → `grappling` (jiu-jitsu, judô, wrestling); `trocacao` (muay thai, boxe, kickboxing).
  - `src/content/martialArts/`: 6 modalidades + 4 sistemas de graduação (jiu-jitsu infantil com faixas de duas cores,
    adulto com graus, judô, prajied da FSBMT fictícia). Boxe/wrestling/kickboxing sem graduação.
  - Engine `fighting/belts.ts` reescrito: `grades` por modalidade, `gradeReady`/`promoteGrade`, `graduationYear`
    (tempo só corre na modalidade treinada; grau por ano), `kidsToAdult` aos 16 (laranja+ e nível de azul → azul).
    `bjjRank` mantém requisitos antigos (orgs, empregos, conquistas). Exames: jiu-jitsu, judô, muay thai (eventos auto).
  - Academias: `modalities` no lugar de `specialty`; 31 academias (novas de muay thai e mistas). Modalidade e
    sparring exigem academia que ofereça; sem academia só o treino físico.
  - Treino: toda modalidade dá ~30–50% da atlética do físico (arredondamento estocástico com RNG da seed — antes os
    ganhos fracionários sumiam); atlética com retorno decrescente mais suave; `FIGHT_XP = 1.5` (camp ocupa sessões).
  - Metas (perfil 7 sessões na modalidade + 3 físico desde os 10, 200 vidas): **Sólido aos 17, Elite aos 25 (talento
    ≥ 1,1), atlética 79 aos 21** — `tests/trainingTargets.test.ts` com tolerância; seção nova no `npm run sim`.
  - Sim de carreira (300 vidas): Titã ~34%, campeão do Titã ~2,3%, faixa preta ~4% (Etapa 8: 28,6% / 2,8% / 12,6%).
  - Avatar: contexto `treino` (kimono + faixa da graduação com listra infantil; regata + shorts + prajied no braço).
  - Migração v9→v10 (+ fixture real `saves-v9.json` com luta em andamento).
- [x] **3. Tela central da Carreira de Luta** (meta: `seenTips`)
  - `screens/menus/fightCareer.tsx`: avatar de treino, linha do tempo (Iniciante → Amador → Profissional regional →
    Liga principal → Campeão), "Próximo passo" (`fighterNextStepText` na engine: frase + alvo do botão), modalidades e
    graduação, academia, treinador, treinos do ano (com botões), cartel e ranking (abre o Ranking), ofertas, últimas
    lutas e aposentadoria. `carreira-luta` e `luta` apontam para a mesma tela; telas antigas removidas.
  - Atalho "🥊 Carreira de Luta" na tela principal (com nº de ofertas): treinar, ver ofertas e ranking em 2 toques.
  - Dicas de primeira vez (graduação, cartel, ranking, bolsa/camp, treinador) com "Entendi": `meta.seenTips`
    (META_VERSION 2 + migração). Testes de UI: 2 toques, dica some e não volta, nenhum número de habilidade.
  - Captura: `docs/release-0.0.1/fase3-carreira-luta.png`.
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
- Avatar: a listra branca da faixa infantil quase some sobre o kimono branco (rever na fase 8).
- Faixa preta caiu para ~4% no sim (exige grappling 78 e o sim divide sessões entre camps); rever na fase 11.
- Scripts de apoio: `scripts/gen-fixtures.ts` (fixture da versão atual), `scripts/e2e/state.ts` (cenário) e
  `scripts/e2e/shot.mjs` (Playwright: injeta o save no IndexedDB e tira capturas; `URL` opcional).

## Próximo passo exato (para a sessão nova)
1. `npm install` (node_modules não vem no clone) e `git checkout release/0.0.1`; confira `npm test` (618 testes) e
   `npx tsc --noEmit`.
2. **Fase 4 — Talentos e sorte (save v11)**, conforme `PLAN.md`:
   - Antes de mudar o formato: `npx tsx scripts/gen-fixtures.ts` → `src/save/__fixtures__/saves-v10.json`.
   - `src/content/talents/` (TalentDef: chance, negative, heritBonus, mods) + `engine/character/talents.ts`;
     `character.talents [{id, revealed}]`, `character.luck` (0–100, média de 3 uniformes) com RNG derivado
     `createRng(seedToState(\`${seed}:talentos\`))` — nunca o `rngState` principal (fairness).
   - Sorte: limites em `src/content/luck.ts`; `GameEvent.tone` e `risk.tone`; peso em `select.ts` (`selectEvents`,
     ~linha 240), risco em `game.ts` (`performAction` e `resolveEvent`, `rng.chance(choice.risk.chance)`), lances de
     KO/finalização em `simulateFight.ts`; efeitos `luck` e `revealTalent`, condição `talent`.
   - `Person.talents`, herança em `relationships/family.ts`/`romance.ts` (nascimento), elenco derivado do id.
   - Migração v10→v11 (`seed:v11:*`), testes de frequência (100 mil), herança, limite e estatística da sorte,
     guarda do `ui.test` (sorte/talentos nunca como número), perfil mostra talentos revelados.
3. Depois, fases 5 a 12 na ordem do checklist acima (fase 8 tem PAUSA para aprovação do usuário).

Dev server para capturas: `npx vite --port 5173 &`, `npx tsx scripts/e2e/state.ts lutador20 tmp/e2e-state.json`,
`node scripts/e2e/shot.mjs tmp/e2e-state.json tmp/x 375 667 shortcut-luta`.

## Pedidos do usuário depois da fase 3 (incluir nas próximas fases)
1. **Cabelos dos avatares** precisam melhorar: forma, volume, textura e silhueta. Entra na **fase 8** (qualidade dos
   avatares), com antes e depois e pausa para aprovação.
2. **Homens com aparência de mulher e vice-versa:** o sexo tem de ser legível no avatar. Na fase 8, revisar as
   diferenças por sexo em todas as fases de idade: proporções (ombro, quadril, cintura), maxilar e rosto, sobrancelha,
   cílios e boca, distribuição dos cabelos (curtos em F e longos em M continuam possíveis, mas com outros sinais
   claros) e a barba/sombra de barba em M adulto. Teste automático: um classificador simples por pixels/âncoras não
   pode confundir M e F na amostra de 48 NPCs × 5 fases.
3. **O jogo é um simulador de VIDA, não só de lutador.** A luta é uma carreira entre várias (faculdade, empregos,
   empresas, clubes, vida noturna…). Consequências:
   - textos de abertura, título/subtítulo, README, GDD §1 e CLAUDE.md devem apresentar o jogo como simulador de vida
     (a carreira de luta como destaque, não como o único foco);
   - a tela principal não deve empurrar a luta para quem não luta (o atalho "Carreira de Luta" já só aparece para quem
     tem academia ou interesse; manter assim e oferecer atalhos equivalentes, p.ex. faculdade/emprego);
   - balanceamento e eventos (fases 10 e 11) devem cobrir bem vidas sem luta;
   - **perguntar ao usuário** se o nome do jogo muda (hoje "Vida de Lutador") antes de trocar título, manifest do PWA
     e ícones.
