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
3. **Conteúdo é dado** em `src/content/`. Eventos seguem o schema `GameEvent` (`engine/events/types.ts`,
   detalhado abaixo) e são validados por `validateContent` (`engine/events/validate.ts`) nos testes.
4. **`GameState` é JSON puro** com campo `version`. Ao mudar o formato: incremente `STATE_VERSION`
   (`engine/core/state.ts`) e adicione a migração `n → n+1` em `src/save/migrations.ts` + teste.
   Versão atual: **2**. A migração v1→v2 cria `education` coerente com a idade, `familyWealth` e `scheduledEvents`,
   usando um RNG próprio (derivado da seed) para não alterar o `rngState`. Antes de mudar o formato de novo, gere
   uma fixture com saves reais da versão atual em `tests/fixtures/`.
5. **A UI (`src/ui/`) só lê o estado e despacha ações** pelo store Zustand (`ui/store.ts`), que chama a engine.
   Nenhuma regra de jogo dentro de componentes.

## Estrutura
```
src/
  engine/                 # regras do jogo (puro, testável)
    core/                 # rng, state (tipos), stats, effects, content (tipos), game (newGame/performAction/advanceYear/resolveEvent)
    character/            # criação de personagem, names.ts (geradores de nomes/escolas + preposições)
    lifeStages/           # fases da vida, energia, school.ts (matrícula, ano letivo, transferência, clubes)
    events/               # schema (types.ts), seleção (select.ts), validação de conteúdo (validate.ts)
    fighting/ relationships/ economy/ assets/   # placeholders (etapas futuras)
  content/                # dados (GAME_CONTENT em index.ts)
    actions.ts            # ações (categoria 'vida' | 'escola')
    clubs.ts              # clubes escolares
    locations.ts
    names/                # nomes fictícios de pessoas e escolas
    events/childhood.ts   # eventos de infância (Etapa 1)
    events/school/        # eventos escolares por fase + disciplina + marcos
  save/                   # migrations.ts (versão/migrações), storage.ts (idb-keyval)
  ui/                     # store.ts, App.tsx, screens/, components/
tests/                    # Vitest; fixtures/saves-v1.json = saves reais da Etapa 1 para testar migração
```

## Schema de eventos (`GameEvent`)
```ts
{
  id: 'f2_crush',                 // único
  trigger?: 'random' | 'auto' | 'followUp',   // padrão 'random' (sorteado por peso)
  weight: 6,                      // > 0 para 'random'
  once?: true,                    // só uma vez por vida
  conditions: {
    minAge?, maxAge?, sex?, stats?: { strength: { min: 25 } },
    flagsAll?: [...], flagsNone?: [...],
    enrolled?: boolean, schoolStages?: ['pre'|'fund1'|'fund2'|'medio'], schoolType?: 'publica'|'particular',
    school?: { average?: {min,max}, discipline?: {...}, popularity?: {...} },
    club?: ['judo', 'wrestling'] | 'any' | 'none',
    schoolResult?: ['passed'|'failed'|'honors'|'graduated'|'expelled'],  // resultado do último ano letivo
  },
  text: '... {colega} ... {professor} ... {da_escola} ... {o/a}',
  choices: [{ id, label, resultText, effects?, risk?: { chance, effects?, resultText } }],  // 2–3 escolhas
}
```
- **`trigger`**: `'auto'` entra sempre que as condições batem (marcos como formatura e reprovação; use com `once` ou
  `schoolResult`). `'followUp'` nunca é sorteado e só acontece quando outra escolha o agenda.
- **Efeitos** (`Effects`, `engine/core/effects.ts`): `stats`, `money`, `setFlags`, `clearFlags`,
  `school: { average, discipline, popularity, absences, suspend, expel, changeSchool: { type? }, joinClub, leaveClub }`
  (ignorado fora da escola) e `followUps: [{ eventId, delayYears }]`. Com `delayYears ≥ 1`, o evento é agendado em
  `scheduledEvents` e herda as variáveis do evento de origem (o mesmo `{colega}`). Com `0`, fica pendente na hora.
  Ao disparar, as condições são reavaliadas; se não baterem, o agendamento é descartado.
- **Placeholders**: `{name}`, `{city}`, `{escola}`, `{da_escola}`/`{na_escola}` (do/da, no/na conforme o nome),
  `{colega}`, `{professor}`, `{clube}` (sorteados quando o evento entra na fila) e `{o/a}` (gênero do personagem).
  Também funcionam nos rótulos das escolhas.
- **Ordem do tick anual** (`advanceYear`): fim do ano letivo → envelhecer → início do ano letivo/matrícula → energia →
  eventos (agendados vencidos + `auto` + 1–2 aleatórios).

## Como adicionar conteúdo
- **Evento:**
  1. Escolha o arquivo pela fase (`src/content/events/school/<fase>.ts` ou `events/childhood.ts`). Arquivo novo
     precisa ser incluído no `index.ts` da pasta.
  2. Escreva o objeto `GameEvent` (veja o schema acima) com id único e 2–3 escolhas.
  3. Para continuar a história no ano seguinte, crie um segundo evento com `trigger: 'followUp'` e agende-o em
     `effects.followUps` da escolha.
  4. Rode `npm test`: `tests/content.test.ts` roda `validateContent` (ids, clubes e alvos de `followUp` existentes,
     `risk.chance` entre 0 e 1).
- **Ação:** adicione um `ActionDef` em `src/content/actions.ts` com `category`, custo de energia, idade mínima,
  `requires?: { enrolled, schoolStages }`, efeitos, textos e `risk?` (efeitos extras com probabilidade).
- **Clube:** adicione um `ClubDef` em `src/content/clubs.ts` (`minStage`, `combat`, `joinEffects`, `yearlyEffects`).

## Flags importantes (ganchos entre etapas)
`interesse_luta`, `brigou_na_escola`, `medalha_interescolar`, `caminho_18` ('faculdade' | 'trabalho' | 'luta'),
`gostaDeLuta`, `artesMarciais`, `sonhaSerLutador`, `formado`, `repetente`, `expulso`, `suspenso`, `bolsista`.

## Regras de conteúdo
- Use **somente organizações, ligas e lutadores fictícios** (ex.: "Circuito Titã"). Nada de UFC, Bellator,
  ONE, PFL ou nomes de atletas reais.
- Textos em pt-BR, segunda pessoa ("Você...").
