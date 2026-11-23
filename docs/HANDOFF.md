# HANDOFF — Vida Real 0.0.2

Estado do projeto em 2026-11-23, branch de trabalho `claude/beautiful-ptolemy-z8zx6u` (a partir de `release/0.0.2`),
tag local `v0.0.2`. Documentos de referência:
- [`GDD.md`](../GDD.md): design e balanceamento (§10c para esta release);
- [`CLAUDE.md`](../CLAUDE.md): regras, regras de conteúdo da 0.0.2 e como adicionar conteúdo;
- [`ASSETS.md`](../ASSETS.md): avatar e ícones;
- [`CHANGELOG.md`](../CHANGELOG.md): tudo o que entrou nesta versão;
- [`docs/release-0.0.2/PROGRESS.md`](release-0.0.2/PROGRESS.md): o diário das 12 fases, com notas técnicas de cada uma.

## Números de saúde do projeto
| Item | Valor |
|---|---|
| Testes (Vitest) | **798 passando** em 62 arquivos |
| Typecheck / lint / build | limpos (`npx tsc --noEmit`, `npm run lint`, `npm run build`) |
| Versão do save | **15** (cadeia v1 → v15; fixture com saves reais da 0.0.1 em `src/save/__fixtures__/saves-v14.json`) |
| Bundle | ~328 KB gzip · 1161 KB sem compressão de JS, mais 42 KB de CSS |
| Navegador | 375×667 e 414×896, console sem erros nas telas novas |

## O que ficou pronto
Fases 0 a 11, todas detalhadas no CHANGELOG e no PROGRESS:
1. treino invisível;
2. carreira policial: concurso, formação, Tiro, postos e save v15;
3. 41 eventos policiais, troca de tiro, investigações, dilemas e força especial;
4. delitos, procurado, reputação, dinheiro sujo e planejamento;
5. facções e tráfico;
6. justiça e ficha criminal;
7. prisão e reintegração;
8. cruzamentos;
9. interface, fardas, uniforme, algemas e ícones;
10. balanceamento (`scripts/simCrime.ts`);
11. documentação e release.

Capturas em `docs/release-0.0.2/screenshots/`: carreira policial (PM, Civil em 414×896, força especial), troca de
tiro e resultado, investigação, menu de crime e prisão (banner e ações).

## O que ficou pendente
1. **Release 0.0.3**, já pedida pelo usuário. O texto completo está em
   [`docs/release-0.0.3/SPEC.md`](release-0.0.3/SPEC.md):
   - visual cartoon em teste A/B;
   - "Passar tempo com todos os amigos";
   - animação da cama;
   - subagents e skills.

   A Fase 0 é o plano, com aprovação antes de qualquer código. Branch `release/0.0.3`.
2. **Foragido**: hoje só aumenta o procurado. Faltam eventos próprios de quem vive foragido e de quem cumpre pena no
   regime aberto.
3. **Roteiro de release no navegador** (`scripts/e2e/release-check.mjs`): ainda não tem os cenários da 0.0.2. As
   capturas desta release saíram do `scripts/e2e/shot.mjs` com estados gerados pela engine.
4. **Pendências antigas:** dieta e alimentação, pós-graduação e migração das telas antigas para `var(--ds-*)`.

## Problemas conhecidos
- **Lesão na troca de tiro:** vem do catálogo geral (fonte `evento`), então às vezes aparece algo como "distensão
  muscular" depois de "você foi atingido".
- **Investigações da Civil:** todas as etapas acontecem no mesmo ano.
- **Herdados da 0.0.1:** taxa de casamento, oxlint no lugar do ESLint e "Exportar save" na versão em arquivo único.

## Como retomar
```bash
npm install
npm run lint && npm test && npm run build
npm run sim -- 300 150 150 60 150        # balanceamento (o 5º número = vidas por perfil de polícia e crime)
SIM_CRIME_N=200 npx tsx scripts/simCrime.ts   # só polícia e crime
npm run dev                               # http://localhost:5173 e /dev/avatars
# capturas com um estado gerado pela engine:
npx tsx scripts/e2e/state.ts lutador20 tmp/e2e-state.json
node scripts/e2e/shot.mjs tmp/e2e-state.json tmp/shot 375 667 nav-atividades,act-crime
```
Antes de mudar o formato do save, gere a fixture da versão atual: `npx tsx scripts/gen-fixtures.ts` (vai criar
`saves-v15.json`).
