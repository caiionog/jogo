# Release 0.0.3 — pedido original (resumo fiel; começar só depois de fechar a 0.0.2)

Título: novo visual dos personagens, amigos em grupo, subagents e skills.

Esta sessão:
1. organiza o trabalho com subagents para produzir mais rápido;
2. procura skills que otimizem o projeto;
3. testa um novo visual para os personagens, no estilo cartoon de apps sociais e do BitLife;
4. adiciona o botão "Passar tempo com todos os amigos";
5. adiciona uma animação discreta (cama com cobertor e coração) para os momentos íntimos já existentes;
6. fecha a release 0.0.3.

## Regras da sessão
1. Orientação enxuta: CLAUDE.md, GDD.md, ASSETS.md, `docs/HANDOFF.md`, `git log --oneline -30`; usar o subagente Explore.
2. Antes de mudar algo, dizer em poucas linhas o estado da 0.0.2 (pronto, pendências do CHANGELOG, testes).
3. Criar `docs/release-0.0.3/PROGRESS.md` com as fases como checklist e manter atualizado.
4. Commits por fase na branch `release/0.0.3`; ao fim de cada fase: `tsc --noEmit`, testes da área, commit, PROGRESS.
5. Contexto acabando: parar num ponto limpo, PROGRESS com o próximo passo e pedir sessão nova com
   "Continue a release 0.0.3 a partir do docs/release-0.0.3/PROGRESS.md".
6. Testes/build/sim: mostrar só resumo e falhas.
7. Regras de arquitetura e conteúdo do CLAUDE.md; toda mudança no estado exige migração de save.

## Parte 1: skills
1. Instalar a skill de busca: `npx skills add https://github.com/vercel-labs/skills --skill find-skills`.
2. Usar a `find-skills` para procurar skills úteis (React + Vite + TS, Tailwind, Zustand, Vitest/Testing Library,
   testes de componentes, acessibilidade, performance web e bundle, PWA, ilustração SVG e design de personagens, pixel
   art, UI mobile, game design e balanceamento, revisão de código, escrita de conteúdo e localização pt-BR).
3. Não instalar nada além da `find-skills` sem aprovação. Mostrar lista curta (máx. 10): nome, origem, o que faz, por
   que ajuda, risco (scripts, rede).
4. Ler o SKILL.md e os scripts antes de propor. Descartar origem duvidosa, binários, credenciais, acesso amplo.
5. Após aprovação, instalar e registrar no CLAUDE.md a seção "Skills do projeto" (nome, para que serve, quando usar).

## Parte 2: subagents
1. Criar em `.claude/agents/` (frontmatter `name`, `description`, `tools` mínimas, `model` quando fizer sentido;
   instruções curtas apontando para o CLAUDE.md):
   - engine-dev: lógica pura em `src/engine/` com Vitest; nunca toca `src/ui/`.
   - ui-dev: telas/componentes em `src/ui/` com o sistema de design; nunca lógica de jogo na UI.
   - content-writer: eventos/cursos/empregos/textos em `src/content/` no schema, pt-BR, regras de conteúdo; roda o
     teste de validação de conteúdo antes de terminar.
   - avatar-artist: só `src/ui/avatar/` e `src/content/sprites/` (ou peças do novo visual), segue o ASSETS.md, gera
     capturas de `/dev/avatars`.
   - test-runner: typecheck, lint, testes, build; devolve só resumo e falhas com arquivo e linha.
   - reviewer: revisa diff contra o CLAUDE.md (engine puro, RNG com seed, migração, regras de conteúdo e idade);
     devolve lista de problemas, sem editar.
2. Regras de orquestração (também no CLAUDE.md): sessão principal planeja/divide/integra/decide; cada tarefa
   delegada diz os arquivos permitidos; dois subagents nunca alteram os mesmos arquivos ao mesmo tempo; tarefas
   independentes em paralelo, com git worktree quando houver risco de conflito e merge na sessão principal; mudanças
   em tipos compartilhados (GameState, schema de eventos, AvatarDescriptor) primeiro na sessão principal; todo
   resultado passa por test-runner e reviewer antes do commit; subagents devolvem resumo curto.
3. Usar o fluxo já nesta release (avatar-artist no visual, content-writer nos eventos de grupo, ui-dev no botão).

## Parte 3: novo visual (teste A/B)
Cartoon estilo avatares de apps sociais e BitLife: vetorial, traço limpo, cores chapadas com sombra suave, cabeça um
pouco maior, expressivo e simpático. Identidade própria: não copiar personagens, peças, formas características nem
marca de nenhum app (Snapchat/Bitmoji, BitLife etc.).
1. `VectorAvatarRenderer` em `src/ui/avatar/vector/`, mesma interface `AvatarRenderer`, mesmo `AvatarDescriptor`;
   o pixel art continua.
2. SVG em camadas com peças desenhadas em código (paths), cores do descriptor. Nada de imagens de terceiros.
3. Cobertura igual ao pixel art: busto e corpo inteiro; 5 fases de idade com transição contínua; tipos físicos;
   rampa completa de pele com sombras em todos os tons; cabelos; barbas; olhos, nariz, lábios, rostos; expressões;
   roupas pela silhueta (fardas, kimono com faixa, presidiário, roupas de banho só 18+); marcas da luta.
4. Diversidade sem caricatura (ASSETS.md).
5. Regra: o avatar sempre é renderizado vestido; não existe camada de corpo sem roupa visível em nenhum renderizador.
6. A/B: Configurações → "Visual dos personagens": Pixel art ou Cartoon. `/dev/avatars` ganha modo lado a lado (mesmo
   personagem nos dois visuais, 5 fases e 24 NPCs). PARAR e mostrar capturas depois do primeiro adulto e de novo
   depois da grade completa; o usuário decide o padrão.
7. Desempenho: SVG das miniaturas de NPC em cache; compor um avatar em < 5 ms.

## Parte 4: "Passar tempo com todos os amigos"
1. Relacionamentos → Amigos: botão no topo "Passar tempo com todos".
2. Atividade em grupo por idade e dinheiro: criança (brincar na rua, videogame, festa de aniversário); adolescente
   (shopping, praia, festa, jogar bola); adulto (churrasco, bar, praia, viagem curta, jogo de futebol, treinar
   juntos — conta como sessão de treino —, noite de jogos).
3. Efeitos: afeto sobe com todos (mais com os próximos), felicidade sobe, custo conforme a atividade, retorno
   decrescente no mesmo ano.
4. ≥ 15 eventos de grupo em `src/content/events/friends/`: dois amigos se conhecem e viram amigos ou rivais, casal
   entre NPCs, briga no churrasco (o lutador separa ou entra), alguém some com a conta, foto que vira lembrança no
   log, amigo pede ajuda na frente de todos, ex aparece no rolê.
5. A lista mostra quem foi e quem não pôde (ocupados, viajando, brigados).

## Parte 5: animação da cama
Regras atuais mantidas (`canHaveSexualContent`, "Conteúdo adulto" ligado, texto sugestivo e não gráfico).
1. Animação curta: cama de frente, cobertor cobrindo tudo, nenhuma parte dos personagens; luz apaga devagar; um
   coração surge acima, pulsa uma vez e some; volta com o resultado em texto. Nada de movimento ritmado, sons ou outro
   detalhe sugestivo.
2. 1–2 s, pula com um toque, respeita `prefers-reduced-motion` (só o coração sobre a cama, sem movimento).
3. Variações de cenário: quarto de casa, de hotel, simples, cama de casal grande; no visual ativo.
4. Componente de UI `IntimacyTransition`, disparado por um efeito do evento; a engine não sabe de animação.

## Testes
- `.claude/agents/` com frontmatter válido.
- Avatar cartoon: determinismo; cobertura fases × físicos × cabelos × roupas; contraste do contorno nos tons extremos;
  roupas de banho nunca < 18; nenhuma combinação sem roupa.
- Configuração do visual persiste e troca o renderizador.
- Passar tempo com todos: afeto sobe nos presentes; custo; retorno decrescente; atividades por idade; eventos válidos.
- Animação: só com `canHaveSexualContent` e "Conteúdo adulto"; nunca com menores (1000 vidas); reduced-motion =
  versão estática.
- Migração de save (configuração do visual).

## Fases (uma por commit)
0. Plano (modo de planejamento, divisão entre subagents) — esperar aprovação.
1. Skills (pausa para aprovar a lista).
2. Subagents e orquestração.
3. Primeiro personagem cartoon e pausa (enquanto espera, fases 4 e 5).
4. Passar tempo com todos e eventos de grupo (ui-dev e content-writer em paralelo).
5. Animação da cama.
6. Cartoon completo e grade A/B, pausa para escolher o padrão.
7. Documentação e release.

## Documentação
- GDD: novo visual (e o padrão escolhido), passar tempo com todos, animação da cama.
- CLAUDE.md: "Skills do projeto", "Subagents e orquestração", regra do avatar nunca sem roupa.
- ASSETS.md: guia do visual cartoon ao lado do pixel art.

## Checklist
1. tsc, lint, testes, build sem avisos; bundle no CHANGELOG.
2. Fixture de saves da 0.0.2 migra sem erro.
3. Navegador 375×667 e 414×896, console limpo: trocar o visual; bebê a idoso; passar tempo com todos em idades
   diferentes e ver evento de grupo; animação com "Conteúdo adulto" ligado e nunca desligado.
4. Capturas em `docs/release-0.0.3/screenshots/` (A/B, amigos, evento de grupo, animação).
5. `version` 0.0.3 no package.json e em Configurações.
6. CHANGELOG 0.0.3 com "Próximos passos" e problemas conhecidos.
7. PROGRESS e HANDOFF atualizados, commit final, tag local `v0.0.3`, resumo. Sem push, merge na main ou deploy sem
   perguntar.
