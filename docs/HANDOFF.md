# HANDOFF — Vida Real 0.0.4

Estado em 2026-11-24, branch `claude/beautiful-ptolemy-z8zx6u` (com push), tag local `v0.0.4`. Referências:
- [`GDD.md`](../GDD.md) §10e: regras e metas desta release;
- [`CLAUDE.md`](../CLAUDE.md): regras, seção "Release 0.0.4";
- [`CHANGELOG.md`](../CHANGELOG.md);
- [`docs/release-0.0.4/PLAN.md`](release-0.0.4/PLAN.md) e [`PROGRESS.md`](release-0.0.4/PROGRESS.md): plano e diário.

## Números
| Item | Valor |
|---|---|
| Testes (Vitest) | todos passando (ver o último commit), inclusive no Windows |
| Typecheck / lint / build | limpos |
| Versões | save **20** (fixtures `saves-v16..v19.json`); meta **3** |
| Clone no Windows | `git config core.autocrlf false` (com CRLF, `tests/agents.test.ts` falha) |

## O que ficou pronto
Fama e redes, cidade com moradores e imigração (estimativa não oficial), vida amorosa adulta (vários parceiros,
casos, relação aberta, voltar com ex, app), concursos públicos e colegas de farda, Exame da Ordem, pós-graduação,
alimentação, futebol completo, cinco minigames, 40 acontecimentos do dia a dia, carreira de luta exclusiva e a
correção do emprego na prisão.

## Pendências e limites conhecidos
- **Imigração:** trocar a estimativa por dados oficiais (SISMIGRA/OBMigra) quando houver o cruzamento UF ×
  nacionalidade (`content/population/immigration.ts`).
- **Concursos:** a aprovação depende muito da inteligência; quem tem nota alta passa logo na primeira tentativa. Se
  quiser mais tensão, aumente o ruído da prova em `exams/stages.ts`.
- **Minigames de finalização, passe, goleiro e MMA:** cobertos por testes de UI; não foram vistos no navegador (o
  pênalti foi, e o usuário aprovou).
- Herdados: taxa de casamento, oxlint no lugar do ESLint, "Exportar save" na versão em arquivo único, contraste do
  contorno no tom de pele mais escuro do cartoon.

## Como retomar
```bash
npm install
npm run lint && npm test && npm run build
npm run dev                                   # http://localhost:5173
npm run sim -- 100 50 50 20 50                # inclui a tabela da 0.0.4 no fim (SIM004_N=60)
```
Antes de mudar o formato do save: `npx tsx scripts/gen-fixtures.ts` (vai criar `saves-v20.json`).
