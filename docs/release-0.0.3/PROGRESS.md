# Release 0.0.3 — progresso

Pedido original: [`SPEC.md`](SPEC.md). Plano: [`PLAN.md`](PLAN.md). Commits na branch da sessão
(`claude/beautiful-ptolemy-z8zx6u`), a partir de `v0.0.2`.

## Checklist
- [x] **0. Plano** aprovado ("comece o próximo")
- [ ] **1. Skills** — `find-skills` instalada (`.agents/skills/find-skills`, link em `.claude/skills/`,
  `skills-lock.json`); lista curta apresentada, **aguardando aprovação**
- [ ] **2. Subagents** e regras de orquestração
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
Esperar o usuário escolher na lista. Depois disso:
1. Instalar com `npx -y skills add https://github.com/<repo> --skill <nome> --yes`.
2. Conferir que nada além de `.agents/skills/<nome>`, o link em `.claude/skills` e o `skills-lock.json` mudou.
3. Escrever a seção "Skills do projeto" no CLAUDE.md, commit e seguir para a Fase 2 (subagents).
