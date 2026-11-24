# Release 0.0.3 — progresso

Pedido original: [`SPEC.md`](SPEC.md). Plano: [`PLAN.md`](PLAN.md). Commits na branch da sessão
(`claude/beautiful-ptolemy-z8zx6u`), a partir de `v0.0.2`.

## Checklist
- [x] **0. Plano** aprovado ("comece o próximo")
- [x] **1. Skills** — `find-skills` + 7 escolhidas pelo usuário ("as que achar melhor"): web-design-guidelines,
  accessibility, vitest, react-testing-library, frontend-design, code-review, better-portuguese; seção no CLAUDE.md
- [x] **2. Subagents** e regras de orquestração — 6 agentes em `.claude/agents/`, seção no CLAUDE.md, `tests/agents.test.ts`
- [x] **3. Primeiro personagem cartoon** — estilo aprovado pelo usuário ("gostei muito desse estilo")
- [x] **4. Passar tempo com todos** e eventos de grupo
- [x] **5. Animação da cama** (`IntimacyTransition`) — conferida no navegador (ligado, desligado e movimento reduzido)
- [x] **6. Cartoon completo** e grade A/B — o usuário pediu para caprichar e adotar; cartoon é o padrão, e os ícones também viraram cartoon
- [x] **7. Documentação e release** (tag local `v0.0.3`)

## Notas da fase 1
- A rede do ambiente bloqueava `skills.sh`. O host foi adicionado ao ambiente "jogo" (aprovado no pedido de
  permissão). A CLI `npx skills find` ainda devolve vazio, mas a API `https://skills.sh/api/search?q=…` funciona com
  curl, e foi ela que serviu para a busca.
- Lidos (clone raso em scratchpad): SKILL.md, referências e scripts de 11 candidatas.
  - Descartada `tailwind-4-docs` (roda Python + `git clone` do site do Tailwind).
  - Descartada `svg-logo-designer` (logos, não personagens).
  - Descartadas as de pixel art, game balance e "character design sheet": poucas instalações ou chamam APIs
    externas.

## Notas das fases 3–5 (em andamento)
- **Tipos compartilhados** (sessão principal):
  - `AvatarRenderer` generalizado (`kind`, `AvatarImage` pixel|svg, `AvatarStyle`);
  - save **v16** (`scene.kind 'intimo'` com `variant` e `seq`, `relationships.lastGroup`; fixture `saves-v15.json`);
  - `FriendsContent`/`GroupActivityDef`; efeitos `social.pairFriends/npcCouple/groupAffection/intimacy`;
  - a cena íntima não aciona roupa de praia.
- **content-writer:**
  - 14 atividades em `content/friends/` (criança, adolescente e adulto);
  - 21 eventos `grupo_*` em `content/events/friends/`;
  - `intimacy: true` em `adult_night_with_partner` (safe e unsafe) e em `adult_forgot_condom/go`.
- **engine-dev:**
  - `engine/relationships/group.ts` (`groupActivities`, `groupAvailability` com RNG derivado, `groupBlockReason`,
    `hangOutAll`, `groupEventVars` com `pessoa*`/`pessoa2*`);
  - `intimacy.ts` (`intimacyVariant`, `recordIntimacy` via `canHaveSexualContentWith`);
  - interações sexuais gravam a cena.
- **Revisão** (subagente revisor), corrigida na sessão principal:
  - `groupEventFits`: casal NPC só para par com `isValidPartnerAge`; evento `adult` exige as duas pessoas;
  - custo no extrato em `familia`;
  - testes novos dessas guardas;
  - `adultSafety` (1000 vidas) também passa tempo com todos e confere os casais NPC.
- Em andamento:
  - `avatar-artist`: `src/ui/avatar/vector/` e o modo lado a lado em `/dev/avatars`;
  - `ui-dev`: botão, sheet e `IntimacyTransition`.
- Os agentes de `.claude/agents/` só são carregados em sessões novas; nesta sessão eles rodam como `general-purpose`
  lendo o próprio arquivo do agente.

## Fechamento
- Navegador (`scripts/e2e/check003.mjs`, 375×667 e 414×896, console sem erros):
  - troca de visual com persistência;
  - amigos em 3 idades com evento de grupo;
  - cama com a opção ligada, nenhuma com ela desligada, versão estática com movimento reduzido.
- Correção no fechamento: a linha "Não foram: …" ia para o toast no lugar da atividade (ordem do log).
- Achado: a seção 0.0.2 do CHANGELOG nunca tinha sido gravada (a inserção falhou em silêncio); foi escrita junto com a
  0.0.3.

## Próximo passo exato
Release fechada. Próximas ideias no CHANGELOG ("Próximos passos") e no HANDOFF.
