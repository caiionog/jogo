# Release 0.0.3 — progresso

Pedido original: [`SPEC.md`](SPEC.md). Plano: [`PLAN.md`](PLAN.md). Commits na branch da sessão
(`claude/beautiful-ptolemy-z8zx6u`), a partir de `v0.0.2`.

## Checklist
- [x] **0. Plano** aprovado ("comece o próximo")
- [x] **1. Skills** — `find-skills` + 7 escolhidas pelo usuário ("as que achar melhor"): web-design-guidelines,
  accessibility, vitest, react-testing-library, frontend-design, code-review, better-portuguese; seção no CLAUDE.md
- [x] **2. Subagents** e regras de orquestração — 6 agentes em `.claude/agents/`, seção no CLAUDE.md, `tests/agents.test.ts`
- [ ] **3. Primeiro personagem cartoon** (pausa para ver)
- [ ] **4. Passar tempo com todos** e eventos de grupo
- [ ] **5. Animação da cama** (`IntimacyTransition`)
- [ ] **6. Cartoon completo** e grade A/B (pausa para escolher o padrão)
- [ ] **7. Documentação e release** (tag local `v0.0.3`)

## Notas da fase 1
- A rede do ambiente bloqueava `skills.sh`. O host foi adicionado ao ambiente "jogo" (aprovado no pedido de
  permissão). A CLI `npx skills find` ainda devolve vazio, mas a API `https://skills.sh/api/search?q=…` funciona com
  curl, e foi ela que serviu para a busca.
- Lidos (clone raso em scratchpad): SKILL.md, referências e scripts de 11 candidatas.
  - Descartada `tailwind-4-docs` (roda Python + `git clone` do site do Tailwind).
  - Descartada `svg-logo-designer` (logos, não personagens).
  - Descartadas as de pixel art, game balance e "character design sheet": poucas instalações ou chamam APIs
    externas.

## Próximo passo exato
**Fase 3 — primeiro personagem cartoon.** Antes de delegar ao `avatar-artist`, a sessão principal generaliza a
interface `AvatarRenderer` (`src/ui/avatar/renderer.ts`): `kind: 'pixel' | 'vector'` e `render` devolvendo imagem ou
SVG. Depois o avatar-artist cria `src/ui/avatar/vector/` (`VectorAvatarRenderer`, um adulto completo) e o modo lado a
lado em `/dev/avatars`, com capturas. **Pausa para o usuário ver.** Em paralelo seguem as fases 4 e 5.
