# CLAUDE.md — Vida de Lutador

Simulador de vida no navegador, estilo BitLife, focado na carreira de lutador.
Design completo e roadmap em [`GDD.md`](./GDD.md). Textos do jogo em português (BR).

## Stack
- Vite + React 19 + TypeScript (strict, `noUncheckedIndexedAccess`)
- Tailwind CSS v4 (`@tailwindcss/vite`, sem arquivo de config)
- Zustand (estado da UI) · idb-keyval (save em IndexedDB) · Vitest (testes)
- Mobile-first: layout de coluna única (`max-w-md`), alvos de toque grandes, botão principal fixo no rodapé.

## Comandos
```bash
npm install         # dependências
npm run dev         # servidor de desenvolvimento (http://localhost:5173)
npm test            # Vitest (uma execução); npm run test:watch para modo watch
npm run typecheck   # tsc --noEmit
npm run build       # typecheck + build de produção em dist/
npm run preview     # serve o build
```
Antes de commitar: `npm test && npm run build`.

## Regras de arquitetura (obrigatórias)
1. **`src/engine/` é TypeScript puro.** Nunca importa React, DOM, `src/ui`, `src/content` ou `src/save`,
   nem pacotes npm. Funções no formato `(estado, ação, conteúdo) => novoEstado`, sem mutar a entrada.
   O conteúdo é injetado via `GameContent`. (Verificado por `tests/architecture.test.ts`.)
2. **RNG determinístico** em `engine/core/rng.ts` (mulberry32). Proibido `Math.random()` na engine.
   O estado do RNG vive em `GameState.rngState`; use o helper `withRng` em `game.ts`. A seed vem da UI.
3. **Conteúdo é dado** em `src/content/`. Eventos seguem o schema `GameEvent` (`engine/events/types.ts`):
   `id`, `conditions` (idade, sexo, faixas de atributos, `flagsAll`/`flagsNone`), `weight`, `once?`, `text`,
   `choices[]` com `effects` e `risk?` opcional (resultado alternativo com probabilidade).
4. **`GameState` é JSON puro** com campo `version`. Ao mudar o formato: incremente `STATE_VERSION`
   (`engine/core/state.ts`) e adicione a migração `n → n+1` em `src/save/migrations.ts` + teste.
5. **A UI (`src/ui/`) só lê o estado e despacha ações** pelo store Zustand (`ui/store.ts`), que chama a engine.
   Nenhuma regra de jogo dentro de componentes.

## Estrutura
```
src/
  engine/                 # regras do jogo (puro, testável)
    core/                 # rng, state (tipos), stats, effects, content (tipos), game (newGame/performAction/advanceYear/resolveEvent)
    character/            # criação de personagem
    lifeStages/           # fases da vida e energia máxima por idade/saúde
    events/               # schema de eventos e seleção por condição + peso
    fighting/ relationships/ economy/ assets/   # placeholders (etapas futuras)
  content/                # dados: actions.ts, locations.ts, events/*.ts, index.ts (GAME_CONTENT)
  save/                   # migrations.ts (versão/migrações), storage.ts (idb-keyval)
  ui/                     # store.ts, App.tsx, screens/, components/
tests/                    # Vitest (rng, energia, yearTick, seleção de eventos, arquitetura, migrações, conteúdo)
```

## Como adicionar conteúdo
- **Evento:** adicione um objeto `GameEvent` em `src/content/events/<fase>.ts` (id único, peso > 0) e,
  se for arquivo novo, inclua em `src/content/index.ts`. Use flags para encadear histórias
  (ex.: `gostaDeLuta`, `artesMarciais`). `tests/content.test.ts` valida ids e escolhas.
- **Ação:** adicione um `ActionDef` em `src/content/actions.ts` (custo de energia, idade mínima, efeitos, textos).

## Regras de conteúdo
- Use **somente organizações, ligas e lutadores fictícios** (ex.: "Circuito Titã"). Nada de UFC, Bellator,
  ONE, PFL ou nomes de atletas reais.
- Textos em pt-BR, segunda pessoa ("Você...").
