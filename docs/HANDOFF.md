# HANDOFF — Vida Real 0.0.1

Estado do projeto em 2026-11-23, branch `release/0.0.1`, tag local `v0.0.1`. Documentos de referência:
- [`GDD.md`](../GDD.md): design e balanceamento (§10b);
- [`CLAUDE.md`](../CLAUDE.md): regras e como adicionar conteúdo;
- [`ASSETS.md`](../ASSETS.md): avatar e ícones;
- [`CHANGELOG.md`](../CHANGELOG.md): tudo o que entrou nesta versão;
- [`docs/release-0.0.1/PROGRESS.md`](release-0.0.1/PROGRESS.md): o diário das 12 fases.

## Números de saúde do projeto
| Item | Valor |
|---|---|
| Testes (Vitest) | **695 passando** em 52 arquivos |
| Typecheck / lint / build | limpos (`npx tsc --noEmit`, `npm run lint` com oxlint, `npm run build` sem avisos) |
| Versão do save | **14** (cadeia v1 → v14 testada com fixtures reais de cada versão em `src/save/__fixtures__/`) |
| Meta | `META_VERSION` 2 (`seenTips` das dicas de primeira vez) |
| Bundle | ~288 KB gzip · 1028 KB sem compressão (arquivo único de propósito) |
| Navegador | roteiro de release em 375×667 e 414×896, todas as verificações ok, console sem erros |

## O que ficou pronto
Fases 0 a 12 da release, todas detalhadas no CHANGELOG:
1. fim da energia, com 10 treinos por ano;
2. modalidades, graduações e grappling;
3. tela central da Carreira de Luta;
4. talentos e sorte;
5. faculdade e empregos de nível superior;
6. clubes esportivos e intercâmbio;
7. vida noturna e interações adultas com guarda única;
8. avatares: cabelo, sexo legível, tipos de corpo, curvas, boca e perfil do NPC;
9. roupas de banho por idade e 24 ícones de negócio;
10. 48 eventos novos e intervalo de repetição;
11. balanceamento;
12. documentação e release.

Capturas em `docs/release-0.0.1/screenshots/`: avatares antes e depois, Carreira de Luta, faculdade, mercado, vida
noturna, intercâmbio, prajied e uma vida aos 30, nos dois tamanhos de tela.

## O que ficou pendente
1. **Release 0.0.2**, já pedida pelo usuário: treino invisível, carreira policial (PM e Civil fictícias), crime,
   facções fictícias e prisão. As regras de conteúdo estão na conversa e vão para `docs/release-0.0.2/PLAN.md`. A
   Fase 0 é um plano para aprovação antes de qualquer código. Branch `release/0.0.2`, a partir de `release/0.0.1`.
2. **Dieta e alimentação** mexendo na gordura corporal. Foi oferecido ao usuário, mas ainda não foi pedido.
3. **Pós-graduação**: o gancho já existe na formatura (`formado_<curso>`).
4. **Telas antigas** (`FinancePanel`, `HealthPanel`, `RelationshipsPanel`, `RankingPanel`…) ainda usam `slate-*`
   remapeado. Vale migrá-las para `var(--ds-*)`.
5. **Pipeline do Aseprite**: só cobre corpos. Cabelo e roupa continuam em código.

## Problemas conhecidos
- **Casamentos:** só cerca de 27% se casam até os 40 na política do sim. Depende de o jogador procurar romance; rever o
  ritmo.
- **Lint:** o ESLint com typescript-eslint não suporta o TypeScript 7, então usamos o oxlint
  (`.oxlintrc.json`), que não tem as regras de hooks do React.
- **Versão em arquivo único:** "Exportar save" não funciona nela, por falta de permissão de download.
- **Valor de negócio no prejuízo = R$ 0**: problema que vem da Etapa 8, porque o negócio não guarda o custo de
  abertura.
- **Campeão do Titã oscila** entre 2% e 5% conforme a amostra do sim. Para comparar, use a mesma amostra.
- O formato do save exportado continua `vida-de-lutador` (`SAVE_FORMAT`), para não quebrar arquivos antigos.

## Como retomar
```bash
npm install
git checkout release/0.0.1            # ou release/0.0.2 quando existir
npm run lint && npm test && npm run build
npm run sim -- 1000                    # balanceamento
npm run dev                            # http://localhost:5173 e /dev/avatars
# roteiro de release no navegador (com o dev server rodando):
npx tsx scripts/e2e/states.ts tmp/e2e-states.json
node scripts/e2e/release-check.mjs 375 667 tmp/rc tmp/e2e-states.json
```
Antes de mudar o formato do save, gere a fixture da versão atual: `npx tsx scripts/gen-fixtures.ts`.
