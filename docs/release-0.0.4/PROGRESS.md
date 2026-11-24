# Release 0.0.4 — Progresso

## Fase 1 — Casa em ordem (concluída)
- `autoEvents` respeita `cooldownYears` (`autoOnCooldown` em `engine/events/select.ts`); sem o campo, não há
  intervalo. Provas de faixa e propostas de organização: `cooldownYears: 2`. `school_honors` virou `once`.
- Varredura em `tests/release004.test.ts`: todo `auto` precisa de `once`, `cooldownYears`, `schoolResult` ou de uma
  flag de parada que todas as escolhas resolvem.
- Exame da Ordem: `barExamBlockReason`/`takeBarExam` (`engine/lifeStages/college.ts`), taxa R$ 300 e corte 60 em
  `content/college`. A nota vem da inteligência, do estudo do ano (até 3×), da sorte (±5) e de um ruído. Item novo em
  Estudos e atalho na vaga de advogado. O evento `oab_exam` virou aviso único com "Não tenho interesse em advogar".
- Fama: `character.fame`, `engine/fame/` (`addFame`, `fameYear`, `sportFame`, `fameAsRep`), efeito e condição `fame`.
  Patrocínios, vagas com `minReputation`, romance e procurar patrocínio leem `fameAsRep`. Padrão de vida de luxo, bens
  e falência mexem na fama, não mais na reputação. Empresário e "ensinar a lutar" continuam na reputação (esporte).
- Save v17 (`migrateV16toV17`), fixture `saves-v16.json`.
- Clone em Windows: use `git config core.autocrlf false`. Com CRLF, `tests/agents.test.ts` falha.

### Falhas conhecidas no Windows (já existiam antes)
- `tests/fairness.test.ts`: dois casos comparavam caminhos com `/`. **Corrigido na fase 4** (normaliza `\`).
- `tests/ui*.test.tsx`: o módulo virtual do PWA não resolvia no Windows. **Corrigido na fase 3** com um stub nos
  testes (`tests/stubs/pwa-register.ts`, alias em `vite.config.ts`). Sobra um erro de teardown (o visual carregado sob
  demanda termina de importar depois do fim do teste); os testes de UI passam.
- `tests/pixelAvatar.test.ts` (encaixe): estourava o tempo na suíte inteira. **Corrigido na fase 5** (`testTimeout: 30_000`).

## Fase 2 — População e imigração (concluída, sem dados de imigração)
- `engine/population/`: moradores gerados sob demanda por (seed, UF, cidade, `POP_VERSION`), de 60 a 400 conforme a
  população do IBGE. Bairros fictícios fixos por cidade (`cityNeighborhoods`, 6 a 12, sempre com "Centro"), bairro da
  casa por vida (`homeNeighborhood`), vizinhos, idade pelo ano de nascimento (envelhecem com o ano) e morte oculta
  (`lifespan`). Tudo por RNG derivado.
- Só vai para o save quem é conhecido: `population.met` (morador → pessoa). `meetResident` cria a `Person` com relação
  `conhecido`. Guardas de idade em `residentAgeBlock`: criança só com até 3 anos de diferença; adulto não puxa conversa
  com menor desconhecido.
- Save v18 (`migrateV17toV18`), fixture `saves-v17.json`. O herdeiro começa com a população vazia.
- Tela "Pessoas da cidade" (Relações → Pessoas da cidade, `screens/menus/city.tsx`): vizinhos e outros moradores,
  25 por página. Não foi verificada no navegador nem pelos testes de UI (que não rodam no Windows).
- **Imigração: sem dados.** A busca não achou um recorte oficial por UF e nacionalidade (OBMigra/SISMIGRA); os
  boletins do Ministério da Justiça trazem totais por UF e por nacionalidade, mas separados. `content.population.
  immigration` está vazio e o gerador não inventa números: todo morador nasce no Brasil até alguém preencher a tabela
  `{ uf, origin, share }` com a fonte. Eventos de imigração ficaram para depois disso.

## Fase 3 — Social (concluída)
- Vários romances entre adultos: `partners`, `newRomanceMode` ('free' | 'secret' | 'blocked') e `startRomance`
  (`relationships/people.ts`). `currentPartner` agora é o parceiro principal (cônjuge, depois quem não é caso).
  `Relation.romance` ganhou `open?` e `secret?` (opcionais, sem migração). Menor de idade com parceiro não começa outro.
- Casamento exclusivo: `hasOtherSpouse`; caso escondido não vira noivado nem casamento. Interação nova
  `propose_open` (só adultos; traços pesam). Ciúme só de parceiro fechado.
- Ciclo anual (`relationships/initiative.ts`): casos escondidos descobertos (22% ao ano; o caso termina, quem foi
  traído perde 25–40 de afeto), amizades com afeto ≥ 65 tomam a iniciativa (até 2 por ano) e quem gosta muito de você
  se declara (flag `quer_namorar` → evento `rel_confession`, efeito novo `social.startRomance`).
- Ex-amizades: amizade arquivada guarda a pessoa (`ArchivedPerson.person`, `endedAge`); `reconnectExFriend` (uma
  tentativa por ano, chance cai com o tempo). Seção "Ex-amizades" em Relações.
- App de namoro (`relationships/datingApp.ts`): 8 perfis por ano por RNG derivado, filtros de idade e intenção, 6
  curtidas por ano, match pela compatibilidade; "amizade" vira amigo; começa como caso se você já tem alguém fechado.
  Só 18+. Tela em Atividades → Amor → App de namoro.
- Gravidez casual: "Passar a noite juntos" tem 4% de chance (`canConceive`: 18+ e casal M/F); `Pregnancy.casual`.
- Pendente: eventos de descoberta, paternidade e do app (content-writer), e a condição de evento para "tem caso".

## Fase 4 — Concursos e colegas (concluída)
- Motor comum de etapas em `engine/exams/stages.ts` (`runExamStages`, `publicExamScore`, `studyBonus`,
  `titlesBonus`): prova, títulos, TAF, saúde, psicológico e investigação social completa, só de condenação ou nenhuma.
  A polícia passou a usá-lo (mesma sequência de RNG; os testes da polícia não mudaram).
- Concursos civis (`engine/civilService/`): `JobDef.civilExam` (órgão, taxa, idade máxima, etapas, estabilidade),
  `civilExamBlockReason`/`takeCivilExam` (uma tentativa por ano e cargo; posse no nível 1). Cargo público não é
  demitido pela crise (carteiro: 30% do risco) e só raramente por desempenho baixo.
- 10 cargos em `content/jobs/civil/` (tabela da fase 0; professor aceita Pedagogia e Educação Física, os cursos de
  licenciatura que o jogo tem). Categoria "Concursos públicos" em Carreiras, com o Delegado apontando para a Polícia
  Civil. Cartão do edital com etapas, taxa, idade máxima e a última tentativa.
- Colegas de farda (`police/colleagues.ts`): pessoas com a flag `colega_farda`, até 3, chegando no ciclo anual. 10
  eventos `pol_colega_*` e 3 de servidor público (`job_servidor_*`).
- Save v19 (`migrateV18toV19`, `civilService`), fixture `saves-v18.json`.

## Fase 5 — Fama, e as pendências (concluída)
- Fama no dia a dia (`engine/fame/social.ts`): seguidores calculados da fama (`followersOf`, só vitrine), rótulo
  (`fameLabel`), postar nas redes (13+, foto/treino/opinião, retorno decrescente; opinião tem 20% de polêmica) e
  comercial (16+, fama 30+, uma vez por ano, cachê = fama² × 20, marcas fictícias em `content/fame`).
- Tela Atividades → Fama e redes, com barra de fama (0–100), seguidores, posts e comercial.
- 21 eventos de fama (`content/events/fame/`): reconhecimento, podcast, talk show, reality, prêmio, paparazzi,
  escândalos, notícia falsa, golpe com perfil falso, haters e fãs na porta.
- Pendências da fase 3: condição nova `love` (`affair`, `openRelationship`, `casualPregnancy`, `usedApp` pela flag
  `usou_app`) e 8 eventos (`events/relationships/modern.ts`): caso quase descoberto, amigo que sabe, regras da relação
  aberta, gravidez casual e paternidade, golpe e encontros do app.
- Imigração (fase 2): **estimativa não oficial** em `content/population/immigration.ts` (parte de moradores nascidos
  fora por UF × mistura de origens por região; fontes no cabeçalho), com nomes por idioma de origem. `POP_VERSION`
  subiu para 2. 7 eventos de vizinhança e imigração (`events/population/`), sem mecânica por origem.
- Alimentação (pendência antiga): `character.eating` (normal, saudável, besteira, restrita; opcional, sem migração),
  12+, mexe no IMC (`bmiAt`) e na saúde do ano (`eatingYear`). Seção "Alimentação" em Saúde.
- Pós-graduação (pendência antiga): especialização (1 ano, paga), mestrado (2, bolsa) e doutorado (4, bolsa, exige
  mestrado) por área de diploma (`startPostgrad`/`postgradYear`, campos opcionais em `college`). Títulos contam na
  prova de títulos dos concursos; emprego novo "Professor(a) universitário(a)" (`requires.postgrad`).
- Telas antigas (`src/ui/components/`): 241 classes `slate-*`/`text-white` trocadas pelos tokens `--ds-*`.

## Fase 6 — Futebol (concluída)
- Clubes (`content/football/clubs.ts`): Divisão A **refeita** (20 clubes, cidades espalhadas, nenhuma combinação
  cidade + cores de clube real, no máximo 2 por cidade), Divisão B (lista da fase 0 com cores novas e trocas onde o
  nome evocava um clube real), C e D geradas de prefixo genérico + lugar inventado, 6 ligas estrangeiras fictícias.
  Torneios: Campeonato Nacional, Copa Nacional, Copa Condor, Estadual, Troféu Craque do Ano, Seleção Nacional.
- `tests/football.test.ts`: ~110 nomes e apelidos reais proibidos, cidade + cores de 40 clubes reais, 20 por divisão.
- Motor (`engine/football/`): peneira (10–23, uma por ano, chance pela capacidade atlética, idade e clube esportivo),
  base → primeiro contrato aos 17+ (ou dispensa aos 20), habilidades e potencial **ocultos** (pistas em palavras),
  treino extra (1 sessão), crescimento até 24 e declínio depois dos 30, temporada anual (tabela de todas as divisões
  com força do ano por RNG derivado, jogos, gols, assistências, nota, títulos, Seleção), salário e premiação por
  `post('salario')`, renovação, propostas de clubes melhores e do exterior, sem clube, aposentadoria (40, ou nível
  baixo a partir dos 33), promoção e rebaixamento de 4 por divisão. O futebol alimenta a fama (`sportFame`).
- Condição de evento `football` e efeito `football` (prestígio e habilidades). 26 eventos `fut_*`.
- Tela Ocupação → Carreiras → Jogador(a) de futebol ("Esporte profissional"): escudo procedural (SVG com as cores e as
  iniciais), clube, contrato, pista, última temporada, propostas, treino e aposentadoria.
- Balanceamento (60 vidas que tentam a peneira todo ano dos 10 aos 17): ~83% viram profissionais, ~5% jogam no
  exterior, ~5% chegam à Seleção, nota de pico média 7,7, ~2 títulos por carreira.
- Save v20 (`migrateV19toV20`, `football: null`), fixture `saves-v19.json`.

## Fase 7 — Minigames: pênalti (concluído; **pausa para o teste do usuário**)
- Interface em `engine/minigames/types.ts` (`MinigameDef`: `setup` com RNG próprio, `resolve` puro, `simulate` pela
  habilidade). Pênalti em `penalty.ts`: gol 3 × 2 zonas, força (> 0,9 isola, < 0,25 o goleiro pega), desvio pela
  pressão e pela finalização, trave no limite, goleiro que pula numa zona (ou fica no meio) com alcance.
- Ligação (`play.ts`): `state.minigame` (opcional, sem migração), `startMinigame`, `finishMinigame` (entrada ou
  `null` = simular), treino de pênaltis (até 3 por ano, ganho pequeno de finalização) e o efeito de evento
  `minigame`. Evento `fut_penalti_jogo` (pênalti decisivo: prestígio, fama e felicidade). Se o ano virar com o
  minigame aberto, ele é simulado.
- Tela `components/PenaltyGame.tsx`: toque para mirar, barra de força oscilando (toque para parar), "Chutar",
  "Simular", tutorial curto, goleiro e bola animados; com movimento reduzido, a força vira um controle deslizante e
  nada anima. Testado no navegador (dev server): mirar, força, resultado e fechar, console sem erros.
- Pênalti aprovado pelo usuário.

## Fase 7 — Minigames: finalização, passe, goleiro e MMA (concluída)
- `minigames/types.ts` virou uma união por tipo (`ActiveMinigame`), com `success` em todo resultado. `others.ts`:
  - finalização: marcador que vai e volta; parar dentro da brecha (largura pela finalização e pelo goleiro);
  - passe: três companheiros com distância e marcação; escolher e acertar a força (tolerância pelo passe);
  - goleiro: o batedor dá uma dica (às vezes falsa); pular no canto certo defende pelo alcance;
  - MMA: três trocas; o parceiro telegrafa o golpe (nem sempre de verdade); esquiva/bloqueio/sprawl; vence 2 de 3.
- `play.ts`: registro `MINIGAMES`, habilidade oculta por tipo (finalização, passe, goleiro, média da luta),
  `startPractice(kind)` (3 por ano cada; MMA exige academia), consequências por tipo e contexto.
- Treinos na tela de futebol (defesas só para goleiro) e "Sparring interativo" em Atividades → Treino (14+).
  Eventos: `fut_finalizacao_jogo`, `fut_passe_decisivo`, `fut_goleiro_penalti`, `fight_sparring_desafio`.
- Telas em `components/MinigameModal.tsx`, todas com tutorial, "Simular" e versão sem animação. Cobertas pelos
  testes de UI; a verificação no navegador desta parte ficou de fora porque a aba do dev server tinha um save em uso.

## Fases 8–10 — Pedidos do usuário, eventos, balanceamento e release (concluídas)
- **Prisão:** preso no fechado/semiaberto perde o emprego na hora (já era assim em `imprison`), mas a regressão
  para o fechado e saves antigos deixavam o emprego. Agora `jobYear` e a regressão também tiram; o clube de futebol
  rescinde o contrato.
- **Luta exclusiva:** `careers/exclusive.ts` (`isProFighter`, `leaveOtherCareersForFighting`); bloqueios em vagas
  comuns (`'fighter'`), concursos, polícia e propostas de futebol; assinar com organização encerra as outras.
- **Voltar com ex:** interação `reconcile` ("Tentar voltar"), dentro de `isValidPartnerAge`; volta como "ficando"
  (ou caso escondido). Eventos `d_adult_ex_mensagem` e `d_adult_reencontro_ex`.
- **40 acontecimentos do dia a dia** (`events/random/daily.ts`), da infância à velhice.
- **Balanceamento:** `scripts/sim004.ts` (no fim do `npm run sim`). Com 40 vidas: futebol 80% profissionais,
  exterior e Seleção raros, nota de pico ~8; concurso de agente administrativo 73% (quase todos na 1ª tentativa,
  pela inteligência); app de namoro 17% de match. Cortes dos concursos de nível médio subiram (50→58, 45→52, 50→56).
- Docs: CHANGELOG `[0.0.4]`, GDD §10e, HANDOFF, CLAUDE.md; `package.json` 0.0.4; tag local `v0.0.4`.
