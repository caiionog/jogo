# HANDOFF — Vida de Lutador (versão 1.2, fim da Etapa 8)

Estado do projeto em 2026-11-23, branch `claude/bitlife-game-foundation-rhsf8m`. Documentos de referência:
[`GDD.md`](../GDD.md) (design, seção 10 = Etapa 8), [`CLAUDE.md`](../CLAUDE.md) (regras e como adicionar conteúdo) e
[`ASSETS.md`](../ASSETS.md) (direção de arte do avatar).

## Números de saúde do projeto
| Item | Valor |
|---|---|
| Testes (Vitest) | **572 passando** em 43 arquivos |
| Typecheck / build | limpos (`npm run build`) |
| Versão do save | **8** (cadeia de migração v1 → v8 testada com fixtures reais de cada versão) |
| `advanceYear` com save de 80 anos | mediana 0,43 ms · p95 1,25 ms (`npm run bench`) |
| Save de 80 anos | ~95 KB |
| Versão de teste em arquivo único | ~935 KB (`npm run build:artifact`) |
| Verificação no navegador | 375×667 e 414×896, sem erros de console |

## O que ficou pronto

### Etapas 1–7 (antes desta entrega)
Esqueleto e eventos (1), escola (2), carreira de luta com simulação round a round, ranking e cinturões (3),
relacionamentos com a regra de conteúdo adulto (4), economia com extrato, bens e empresas (5), lesões, saúde, morte,
legado, conquistas, Hall da Fama e PWA (6), Brasil com dados do IBGE, genética da aparência e regra de não
discriminação (7). Detalhes no roadmap do GDD (seção 13).

### Etapa 8 (esta entrega)
- **Nova interface**:
  - tela principal com busto em pixel art, feed da vida por idade, energia em pontos e as 5 barras recolhíveis;
  - barra inferior Ocupação · Bens · **+ Idade** · Relações · Atividades;
  - menus em camadas com o Voltar do sistema;
  - pop-ups de evento (com miniatura do NPC) e de resultado (diff dos atributos), toasts;
  - sistema de design com tema claro/escuro e fonte pixelada nos títulos;
  - itens desabilitados mostram o motivo.
- **Atributos**:
  - 5 visíveis: Felicidade, Saúde, Inteligência, Aparência e Capacidade atlética;
  - ocultos: jiu-jitsu, trocação e queixo derivado (idade, dano cerebral, saúde);
  - pistas só em palavras: frase do treinador, avaliação "Iniciante/Promissor/Sólido/Elite" com imprecisão, faixa,
    cartel, ranking;
  - treino em 4 tipos: jiu-jitsu, trocação, físico e sparring;
  - simulação de luta e NPCs adaptados, com estilos (chão/trocador/completo).
- **Empregos**:
  - 26 no total, 19 básicos brasileiros: de jovem aprendiz (14+) a segurança (21+);
  - salário em salários mínimos, formal ou informal, escada de cargos;
  - vagas do ano pela seed/cidade, chance de contratação;
  - CNH (R$ 3.000, pode reprovar);
  - 16 eventos de trabalho.
- **Carreiras**:
  - cartões com salário, requisitos ✓/✗ e energia;
  - detalhe com escada e "Candidatar-se";
  - troca de emprego com confirmação de demissão;
  - carreira de lutador com etapa e próximo passo; academia coexiste com emprego.
- **Mercado**:
  - 20 bens: casa de praia só em UF litorânea, sítio fora da capital;
  - 11 empreendimentos (comprar existente ou abrir/franquia);
  - ofertas do ano pela seed, filtros, "ver outra cidade";
  - confirmação à vista/financiado com custo total;
  - reformar imóvel, renomear empresa;
  - aluguel e lucro no extrato; "Anos anteriores" abre por categoria.
- **Negócios comprados**:
  - caixa de giro igual ao de um aberto do zero;
  - o dono cobre prejuízo (2 anos de carência);
  - quebra só com 2 anos seguidos no vermelho ou sem dinheiro;
  - a venda dos equipamentos devolve 25% do custo.
- **Avatar em pixel art** (o 3D da Etapa 7 foi removido):
  - corpo inteiro 32×64 gerado por código: 5 fases × 2 sexos × 5 tipos físicos;
  - roupas como regras sobre a silhueta (43 peças, 6 camadas);
  - 12 cabelos com textura pelo tipo, 6 barbas, 6 expressões, sardas e pintas;
  - marcas de luta, kimono com a cor da faixa;
  - respiração e piscar;
  - ≤ 48 cores por avatar;
  - miniaturas com cache;
  - criação com prévia "ver como" nas 5 fases;
  - página `/dev/avatars` (só no dev);
  - importador de PNG do Aseprite para corpos (`scripts/sprites/png-to-grid.ts`).
- **Save v8**: migração de atributos e habilidades (personagem, elencos, ofertas, luta em andamento), guarda-roupa por
  camadas, sardas/pintas.
- **Balanceamento**: Circuito Titã mais difícil, regionais um pouco mais fáceis e bolsa do Titã menor. A tabela
  antes × depois está no GDD §10.
- **Docs**: GDD v1.2, CLAUDE.md (save v8, regras 7 e 8, Etapa 7, interface, verificação), ASSETS.md (pixel art),
  README.

## O que ficou pendente
1. **Imagens de referência do avatar** (`docs/references/avatar/`) nunca chegaram ao repositório. A pixel art seguiu só
   as regras escritas de direção de arte; vale uma rodada de ajuste com as referências.
2. **Estudos / faculdade**: a categoria aparece em Carreiras como "Em breve". O gancho existe (`caminho_18 =
   'faculdade'`), mas não há vestibular, cursos nem diploma.
3. **Pipeline do Aseprite**: o importador cobre só corpos. Cabelos, barbas e roupas continuam sendo regras e desenhos
   em código (`render.ts`, `clothes.ts`).
4. **Cabelo "ralo de idoso"**: o plano previa 13 estilos; ficaram 12, porque o ralo da velhice é feito pela calvície
   genética, não por um estilo próprio.
5. **Diff do resultado**: o plano previa `GameState.lastOutcome` vindo da engine. O diff é calculado no store
   (`diffOf`), fora do save. Funciona, mas um resultado pendente não sobrevive a recarregar a página.
6. **Verificação em 414×896**: tela principal e todos os menus. Os fluxos longos (Carreiras, Mercado, luta) foram
   percorridos só em 375×667.
7. **Telas antigas dentro dos menus** (`CareerPanel`, `FinancePanel`, `HealthPanel`, `RelationshipsPanel`,
   `RankingPanel`…) ainda usam classes `slate-*`, remapeadas para os tokens. Migrá-las para `var(--ds-*)` e para os
   componentes do design system deixaria o visual mais uniforme.
8. **Ideias do GDD §11** (outras carreiras, outros países, avatar animado na luta, modo desafio, eventos sazonais).

## Problemas conhecidos
- **Valor de negócio no prejuízo = R$ 0** (venda, patrimônio e partilha). `businessValue` só olha caixa e lucros
  recentes. O piso de equipamento (25% do custo) existe só na falência, porque o negócio não guarda o custo de
  abertura. Corrigir pede um campo novo em `Business` e, portanto, migração para o save v9.
- **Lutador mais rico que na Etapa 7**: patrimônio mediano aos 50 de R$ 351 mil → R$ 549 mil, porque depois da carreira
  ele cai em empregos básicos de verdade. Falência caiu de 42,7% para 32%, ainda a mais alta. Chegar ao Titã subiu de
  24,2% para 28,6%. Está aceitável, mas vale rever se a carreira de luta ficou fácil demais.
- **Perfil empreendedor** também ficou mais rico (mediana aos 50: R$ 766 mil → R$ 1,07 mi) com a nova regra de cobrir
  prejuízo; quebras caíram de 30,9% para 13,4%.
- **Campeão do Titã oscila** entre ~2% e ~5% conforme a amostra do `npm run sim` (500 vidas). Para comparar ajustes,
  use a mesma amostra e rode mais de uma vez.
- **Conquistas que não saíram na amostra do sim**: expulso e formado, primeiro beijo, centenário, invicto
  aposentado, filho campeão, Dinastia Titã, academia herdada. O sim escolhe sempre a primeira opção dos eventos.
  `tests/achievementsReachable.test.ts` garante que todas são alcançáveis.
- **Versão de teste (artifact)**: "Exportar save" não funciona, porque a página publicada não tem permissão de
  download; o resto funciona. No jogo normal (`npm run dev`/`preview`) exporta normalmente.
- **Negócio sem gerente e sem "Gerenciar de perto"** tende a dar prejuízo (cuidado ×0,75) e quebrar depois da carência.
  É intencional (o cartão mostra as duas projeções), mas pode surpreender. Um aviso no log no primeiro prejuízo ajudaria.
- **Roupa do perfil**: fora da luta o avatar usa a roupa do guarda-roupa; o kimono com a cor da faixa só aparece no
  contexto de luta (luta em andamento). Não é bug, mas um jogador pode procurar o kimono no perfil.

## Como retomar
```bash
npm install
npm test && npm run build      # antes de qualquer commit
npm run sim                     # balanceamento (compare com tmp/sim-before-e8.txt / tmp/sim-after-e8.txt, se existirem)
npm run dev                     # http://localhost:5173 e /dev/avatars
```
Para verificar no navegador, siga "Verificação (Etapa 8)" no CLAUDE.md (Playwright já instalado, saves injetados no
IndexedDB, viewports 375×667 e 414×896).
