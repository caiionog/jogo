# HANDOFF — Vida Real 0.0.3

Estado do projeto em 2026-11-24, branch de trabalho `claude/beautiful-ptolemy-z8zx6u`, tag local `v0.0.3`
(a `v0.0.2` também é local). Documentos de referência:
- [`GDD.md`](../GDD.md): design e balanceamento (§10d para esta release);
- [`CLAUDE.md`](../CLAUDE.md): regras, skills, subagents e "Release 0.0.3";
- [`ASSETS.md`](../ASSETS.md): guia do cartoon (padrão) e do pixel art;
- [`CHANGELOG.md`](../CHANGELOG.md): o que entrou em cada versão;
- [`docs/release-0.0.3/PROGRESS.md`](release-0.0.3/PROGRESS.md): o diário das fases, com notas técnicas.

## Números de saúde do projeto
| Item | Valor |
|---|---|
| Testes (Vitest) | **860 passando** em 71 arquivos |
| Typecheck / lint / build | limpos; o build só avisa do tamanho do chunk |
| Versões | save **16** (fixture da 0.0.2 em `saves-v15.json`); meta **3** (`settings.avatarStyle`) |
| Bundle | ~371 KB gzip (1284 KB) de JS, mais 13 KB gzip de CSS |
| Avatar cartoon | ~1,6 ms por avatar; miniaturas em cache |
| Navegador | 375×667 e 414×896 com `scripts/e2e/check003.mjs`: tudo ok, console sem erros |

## O que ficou pronto
1. **Skills:** `find-skills` e mais 7 do projeto, todas revisadas e sem scripts (seção no CLAUDE.md).
2. **Subagents:** 6 agentes em `.claude/agents/`, com as regras de orquestração no CLAUDE.md. Eles carregam nas
   sessões novas.
3. **Visual cartoon:**
   - renderizador vetorial completo, agora o padrão (escolhido pelo usuário);
   - opção em Configurações e 54 ícones em cartoon;
   - regra: o avatar é sempre renderizado vestido.
4. **Passar tempo com todos:** botão, atividades por idade e 21 eventos de grupo.
5. **Transição da cama** nos momentos íntimos: só para adultos com "Conteúdo adulto" ligado, com versão estática para
   movimento reduzido.

Capturas em `docs/release-0.0.3/screenshots/`:
- A/B: `ab-*`;
- físicos, roupas, fardas e praia: `cartoon-*`;
- ícones: `icones-cartoon.png`;
- amigos em 3 idades: `amigos-*`;
- evento de grupo: `evento-grupo-*`;
- animação da cama: `cama-*`.

## O que ficou pendente
- Carregar sob demanda o renderizador que não está em uso. O bundle cresceu ~43 KB gzip.
- Pendências da 0.0.2: eventos de foragido e de regime aberto, investigações num ano só e lesão genérica na troca de
  tiro.
- Pendências antigas: dieta, pós-graduação e migração das telas antigas para `var(--ds-*)`.

## Problemas conhecidos
- **Tom de pele mais escuro:** no cartoon, o contorno não chega a 3:1 contra a própria pele (o máximo físico é ~1,5:1).
- **Zoom de 8×:** aparece um fio de anti-aliasing no cotovelo.
- **Herdados:** taxa de casamento, oxlint no lugar do ESLint e "Exportar save" na versão em arquivo único.

## Como retomar
```bash
npm install
npm run lint && npm test && npm run build
npm run dev                                   # http://localhost:5173 e /dev/avatars?modo=lado-a-lado
npx tsx scripts/e2e/states003.ts tmp/s003      # estados de cenário da 0.0.3
node scripts/e2e/check003.mjs 375 667 tmp      # verificação no navegador (dev server na 5173)
```
Antes de mudar o formato do save, gere a fixture: `npx tsx scripts/gen-fixtures.ts` (vai criar `saves-v16.json`).
