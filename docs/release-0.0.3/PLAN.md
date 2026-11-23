# Plano — Release 0.0.3: visual cartoon (A/B), amigos em grupo, animação discreta, subagents e skills

Pedido completo: [`SPEC.md`](SPEC.md). **Aguardando aprovação.**

## Ponto de partida (0.0.2)
- 0.0.2 fechada:
  - tag local `v0.0.2`;
  - 798 testes passando; lint, typecheck e build limpos;
  - save v15;
  - JS de ~328 KB gzip.
- Pendências do CHANGELOG:
  - foragido sem eventos próprios;
  - investigações da Civil num ano só;
  - lesão genérica na troca de tiro;
  - casamento ~27%;
  - oxlint;
  - "Exportar save" na versão em arquivo único.

## Decisões de formato (feitas na sessão principal, antes de delegar)
1. **`AvatarRenderer` generalizado**:
   - hoje devolve RGBA de pixel art;
   - passa a ser `{ kind: 'pixel' | 'vector'; render; bust; snapshot }`, e `render` devolve uma imagem de pixels ou um
     SVG;
   - `PixelAvatar`, `AvatarThumb` e o cache de miniaturas escolhem o renderizador pela preferência.
2. **Preferência do visual** no **meta** (é preferência, não pertence à vida):
   - campo `settings.avatarStyle: 'pixel' | 'cartoon'`;
   - `META_VERSION` 2 → 3, com migração e teste.
3. **Cena íntima**:
   - `GameState.scene` ganha o tipo `'intimo'` com `variant` (`casa` | `hotel` | `simples` | `casal`);
   - quem preenche é a engine, só depois de `canHaveSexualContent` e `adultContentAllowed`;
   - a UI anima, e a engine não sabe nada de animação;
   - save v15 → **v16** e fixture `saves-v15.json` com saves reais da 0.0.2.
4. **Amigos em grupo**:
   - `engine/relationships/group.ts`: atividades por idade e dinheiro, quem vai e quem não pode (ocupado, viajando,
     brigado) e `hangOutAll`;
   - dados em `content/friends/`;
   - "treinar juntos" usa as sessões de treino.

## Fases
1. **Skills**:
   - instalar só a `find-skills`;
   - buscar pelos temas do pedido e ler o SKILL.md e os scripts de cada uma;
   - lista de até 10, com nome, origem, função, ganho para o projeto e risco → **pausa para aprovação**;
   - instalar as aprovadas e criar a seção "Skills do projeto" no CLAUDE.md.
2. **Subagents** em `.claude/agents/`:
   - `engine-dev` (`src/engine`, `tests`);
   - `ui-dev` (`src/ui`);
   - `content-writer` (`src/content`, roda o teste de conteúdo);
   - `avatar-artist` (`src/ui/avatar`, `src/content/sprites`, `src/ui/dev`);
   - `test-runner` (só Bash e leitura, modelo leve);
   - `reviewer` (só leitura e `git diff`);
   - regras de orquestração no CLAUDE.md;
   - `tests/agents.test.ts` para o frontmatter.
3. **Primeiro personagem cartoon** (avatar-artist):
   - `src/ui/avatar/vector/`, com SVG em camadas a partir do mesmo descriptor;
   - um adulto completo e o modo lado a lado em `/dev/avatars`;
   - **pausa com as capturas**; enquanto isso, fases 4 e 5.
4. **Passar tempo com todos**:
   - engine-dev: regras e testes de afeto, custo, retorno decrescente e idade;
   - content-writer: atividades e ≥ 15 eventos em `src/content/events/friends/`;
   - ui-dev: botão, escolha e lista de quem foi e de quem não pôde ir;
   - o que mexe no schema de eventos (ex.: `social.pairFriends`, `social.npcCouple`) é feito antes, na sessão
     principal.
5. **Animação da cama** (`IntimacyTransition`, ui-dev):
   - cama coberta, luz que apaga, coração que pulsa uma vez;
   - 1,5 s, pula com um toque;
   - com reduced-motion, fica estática;
   - cenário por `variant`;
   - testes de guarda, 1000 vidas sem menores e reduced-motion.
6. **Cartoon completo** com cobertura igual à do pixel art:
   - roupas pela silhueta, inclusive fardas, kimono e presidiário, e roupa de banho só 18+;
   - nunca sem roupa;
   - miniaturas em cache e menos de 5 ms por avatar;
   - Configurações → "Visual dos personagens";
   - grade A/B (5 fases + 24 NPCs) → **pausa para você escolher o padrão**.
7. **Documentação e release**:
   - GDD, CLAUDE.md, ASSETS.md (guia do cartoon) e CHANGELOG;
   - versão 0.0.3 e capturas;
   - HANDOFF e tag local `v0.0.3`.

## Perguntas para a aprovação
- **Branch**: esta sessão só pode dar push na branch dela (`claude/beautiful-ptolemy-z8zx6u`). Posso fazer os commits
  da 0.0.3 nela (como na 0.0.2) e criar `release/0.0.3` localmente?
- **Rede**: o `npx skills add` precisa baixar do GitHub/npm. Se o proxy bloquear, sigo sem a `find-skills` e aviso.
