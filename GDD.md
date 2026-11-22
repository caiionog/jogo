# GDD — Vida de Lutador

## 1. Visão
Simulador de vida em texto, no navegador e pensado para o celular, no estilo BitLife. O jogador nasce,
cresce ano a ano e toma decisões. O foco inicial é a **carreira de lutador**: das primeiras aulas de
artes marciais na infância até o cinturão da principal liga de MMA (fictícia) do mundo.

Pilares:
- **Decisões rápidas e consequências que se acumulam** — cada ano é uma rodada curta.
- **Histórias emergentes** — eventos aleatórios condicionados ao passado do personagem (flags).
- **Rejogabilidade** — atributos, local de nascimento e eventos sorteados por seed.

## 2. Loop principal (anual)
1. Início do ano: o jogador recebe **energia** (máximo depende de idade e saúde).
2. Gasta energia em **ações** (treinar, estudar, socializar, descansar, trabalhar...).
3. Clica **Avançar ano**: envelhece, efeitos naturais (crescimento/envelhecimento/humor) são aplicados.
4. Acontecem **1 ou 2 eventos aleatórios** com escolhas (alguns com risco).
5. Tudo é registrado no **log da vida**, ano a ano.

### Energia
| Idade | Base |
|---|---|
| 0–2 | 0 (bebê só avança o ano) |
| 3–5 | 3 |
| 6–12 | 5 |
| 13–17 | 6 |
| 18–49 | 7 |
| 50–64 | 6 |
| 65+ | 4 |

Modificador de saúde: < 25 → −2 · < 50 → −1 · ≥ 85 → +1.

## 3. Personagem
- Nome e sexo escolhidos; país/cidade e atributos iniciais sorteados.
- Atributos (0–100): **Saúde, Felicidade, Inteligência, Aparência, Força, Condicionamento**.
- Dinheiro, flags de história, histórico de eventos.
- Altura, peso e biotipo (crescem com a idade) e família com renda (`familyWealth`).
- Perfil de lutador (Etapa 3): habilidades de luta, talento oculto, faixa, reputação e cartéis — ver seção 5.

## 4. Escola (Etapa 2)

### Fases e séries
| Fase | Idades | Séries (`grade`) |
|---|---|---|
| Pré-escola | 3–5 | Pré I, II, III (0–2) |
| Fundamental I | 6–10 | 1º–5º ano (3–7) |
| Fundamental II | 11–14 | 6º–9º ano (8–11) |
| Ensino Médio | 15–17 | 1º–3º ano do EM (12–14) |

- **Matrícula automática** dos 3 aos 17 anos (série = idade − 3). Escola com nome fictício, sorteada pelo seed.
  Chance de ser particular = `0,1 + familyWealth/100 × 0,7` (`familyWealth` 0–100, sorteado ao nascer).
- A fase é derivada da **série**, não da idade: quem repete fica mais tempo (pode estudar até os 19; aos 20 sai sem diploma).
- Estado escolar (`education`): escola, série, nota média, disciplina, faltas, popularidade, clube, suspensões,
  histórico de anos, último resultado, repetências, expulsões, formado.

### Fórmulas
- **Média inicial do ano** = `30 + 0,35×inteligência + 0,15×notaFinalAnterior + (particular ? 3 : 0) + rng(−5..5)`.
- Durante o ano, ações e eventos mexem na média, disciplina, faltas e popularidade.
- **Nota final** = `0,7×média + 0,3×inteligência − 1,5×max(0, faltas − 10) + rng(−8..8)` (0–100).
- **Aprovação**: nota final ≥ 50 **e** faltas ≤ 25. Pré-escola sempre aprova.
- **Honra**: aprovado com nota final ≥ 88 (pode render bolsa em escola particular).
- **Reprovação**: repete a série, −10 felicidade, flag `repetente`.
- **Expulsão** (avaliada no fim do ano): disciplina ≤ 15 ou 3 suspensões na mesma escola → transferência para escola
  pública (disciplina 55, popularidade pela metade), flag `expulso`.
- **Suspensão** (efeito de eventos): disciplina −15, faltas +3, suspensões +1, flag `suspenso` (dura o ano).
- **Início de cada ano**: faltas zeradas; disciplina se recupera +3 (até 70).
- **Formatura**: aprovação no 3º ano do EM → `graduated`, flag `formado`, evento de formatura e baile.
- **Decisão dos 18 anos** (evento automático): faculdade / trabalhar / focar na luta → flag `caminho_18`.

Balanceamento (simulação de 200 vidas): quem estuda tira ~86 de média e quase nunca repete; o jogador equilibrado
fica em ~76; quem só brinca fica em ~67 e repete ~1,4 vez; quem mata aula sem parar quase nunca se forma.

### Ações escolares (só aparecem para quem está matriculado)
| Ação | ⚡ | Efeito |
|---|---|---|
| Estudar para as provas | 2 | média +5, inteligência +1, felicidade −2 |
| Matar aula | 1 | felicidade +4, média −3, disciplina −6, faltas +4; 30% de chance de o evento de punição acontecer na hora |
| Fazer amizade | 1 | popularidade +4, felicidade +2 |
| Clube (entrar/sair) | 1 | efeitos ao entrar + bônus anual no fim do ano letivo |

A ação **Estudar** (Etapa 1) também dá média +2 quando o personagem está matriculado, pelo mesmo mecanismo de efeitos.

**Clubes**: 🥋 Judô (a partir do Fund. I), 🤼 Luta olímpica (a partir do Fund. II), ⚽ Futebol, ♟️ Xadrez, 🎭 Teatro.
Os clubes de luta dão força e condicionamento todo ano e a flag `interesse_luta`.

### Eventos escolares (34)
- **Pré-escola**: primeiro dia, disputa de brinquedo, desenho da família.
- **Fundamental I**: bullying (→ continuação: o valentão volta), professor exigente, concurso de leitura,
  convite para o judô (→ campeonato interescolar), excursão.
- **Fundamental II / EM**: cola na prova, trabalho em grupo, olimpíada de matemática (→ fase final), primeira paixonite
  (→ continuação), convite para a luta olímpica (→ campeonato), bullying adolescente (→ desfecho), turma popular, festa.
- **Ensino Médio**: feira de ciências (→ feira regional), simulado, professor de física, convite para o baile.
- **Disciplina**: chamada dos pais, suspensão, punição por matar aula, expulsão, mudança de escola.
- **Marcos (automáticos)**: campeonato interescolar, bolsa por honra, elogio, reprovação, formatura + baile, decisão dos 18.

### Ganchos para a Etapa 3
- `interesse_luta`: clubes de judô ou luta olímpica, campeonato interescolar e a escolha "focar na luta" aos 18.
- `brigou_na_escola`: revidar o bullying (infância e adolescência).
- `medalha_interescolar`: venceu o campeonato interescolar.
- `caminho_18 = 'luta'`: começar a carreira amadora logo aos 18.
- Clubes de luta (`ClubDef.combat`) e flags da Etapa 1 (`gostaDeLuta`, `artesMarciais`, `sonhaSerLutador`).

## 5. Carreira de luta (Etapa 3)
Tudo é **fictício**: organizações, academias, eventos e lutadores.

### Escada da carreira
| Nível | Organização | Idade | Entrada | Formato |
|---|---|---|---|---|
| Kids | Copa Dente-de-Leão de Artes Marciais · Copa Kids Faixa Colorida (jiu-jitsu) | 6–14 | treinar (academia ou clube de luta da escola) | grappling, 1 round |
| Amador | Circuito Amador Punho de Ferro (MMA) · Copa Tatame Aberto (jiu-jitsu por faixa) | 15+ | treinar | MMA 3×; jiu-jitsu 1 round |
| Regional | **LFM** – Liga Fronteira MMA (2 vitórias amadoras, reputação 10) · **ARC** – Arena Regional de Combate (3 vitórias amadoras, reputação 15) | 18+ | proposta (evento) | 3 rounds; 5 em disputa de cinturão; ranking top 10 + campeão |
| Principal | **Circuito Titã** | 20+, assina até os 31 | 10 vitórias pro, reputação 50, aproveitamento ≥ 60% nas últimas 10 lutas pro | ranking top 15 + campeão por categoria |

- Contratos chegam como **eventos automáticos** quando os requisitos são atendidos e o jogador pode aceitar ou recusar. Só são propostas organizações de nível acima do contrato atual.
- **Ofertas de luta** são renovadas a cada ano e vencem no fim dele. Cada luta custa **energia de camp**: kids 1, amador 2, pro 3, título 4, substituição 1. Por isso dá para lutar 1–3 vezes por ano e ainda treinar.
- Lesão ou suspensão bloqueiam as ofertas.

### Perfil do lutador
- **Habilidades** (0–100): trocação, wrestling, jiu-jitsu, defesa, cardio e queixo.
  - Força e condicionamento (atributos base) entram na luta como potência e custo de estamina.
  - O **queixo** inicial é genético (sorteado entre 40 e 75). Ele cai com KOs sofridos e com a idade, e o sparring o treina um pouco.
- **Talento** (oculto, 0,65–1,35): multiplica os ganhos de treino e é o que diferencia as vidas.
- **Altura e peso**: altura adulta sorteada, curva de crescimento e peso pelo IMC (idade, força, condicionamento, biotipo).
  - A **categoria** é a menor cujo limite comporta 92% do peso de caminhada.
  - Masculino: mosca 57 · galo 61 · pena 66 · leve 70 · meio-médio 77 · médio 84 · meio-pesado 93 · pesado 120. Feminino: palha 52 · mosca 57 · galo 61 · pena 66.
  - **Corte agressivo** (opção ao aceitar a luta): vantagem de tamanho (mais potência), com 25% de chance de não bater o peso. Errar custa multa de 20% da bolsa, estamina inicial de 85, −3 de saúde e um evento.
- **Cartéis separados**: amador (inclui kids), profissional e jiu-jitsu, com método (KO/TKO, finalização, decisão).
- **Faixa de jiu-jitsu** (branca → preta). Só conta o ano em que o personagem treinou jiu-jitsu (ação ou academia de grappling):

  | Faixa | Idade mínima | Anos na faixa anterior | Jiu-jitsu |
  |---|---|---|---|
  | Azul | 16 | 2 | 35 |
  | Roxa | 16 | 2 | 50 |
  | Marrom | 18 | 2 | 65 |
  | Preta | 19 | 1 | 78 |

  A graduação acontece no evento automático "Exame de faixa".
- **Reputação** (0–100):
  - vitória: +ganho da organização (×1,5 se finalizar, ×2 em disputa de cinturão);
  - derrota: −ganho;
  - cai 3 por ano acima de 40, e mais 2 se o lutador não lutou.
  - A reputação aumenta a bolsa (× (1 + rep/100)) e libera contratos e patrocínios. Com reputação ≥ 15, a academia dá bolsa de atleta.

### Academias e treino
- Academias por cidade (`src/content/gyms/`), mais três genéricas, com mensalidade anual (paga a partir dos 18; antes disso, pelos pais), treinador (0–100) e especialidade. Entrar custa 1⚡.
- **Ganho** = `base × talento × (0,5 + treinador/100 × 0,8) × idade × (0,5 + saúde/200) × ((100 − habilidade)/100)^1,5 × especialidade × rng(0,8–1,2)`.
  - Sem academia, o fator do treinador é 0,45.
  - Idade: < 10 → 0,55 · 10–17 → 0,8 · 18–24 → 0,95 · **25–32 → 1,0** · 33–36 → 0,75 · 37+ → 0,45.
  - Especialidade: ×1,25 na habilidade da academia (×1,1 em tudo nas de MMA).
- **Ações**:

  | Ação | ⚡ | Efeito |
  |---|---|---|
  | Treino técnico | 2 | trocação, wrestling ou defesa (+ um pouco de defesa) |
  | Sparring | 2 | ganho 1,6× em duas habilidades + defesa + queixo; 8% de chance de lesão |
  | Condicionamento | 1 | cardio + condicionamento |
  | Jiu-jitsu | 2 | conta o ano para a faixa |

- **Lutar ensina**: cada luta dá pequenos ganhos nas habilidades usadas.
- **Declínio** a partir dos 33 (cardio e queixo primeiro). A saúde se recupera 35% do que falta para 90 por ano até os 45.
- **Clubes da escola** (Etapa 2) contam como treino: judô dá wrestling e jiu-jitsu; luta olímpica dá wrestling e cardio.

### Simulação de luta (`engine/fighting/simulateFight.ts`)
- **Máquina de estados**: `startFight → playRound → 'break' → chooseCorner → … → 'finished'`. O estado é JSON, com RNG próprio, e fica salvo no meio da luta.
- **Round**: 12 trocas (16 no grappling). Em cada troca age um lutador, sorteado por agressividade × estratégia × estamina (quem está por cima no chão age mais).
  - **Em pé**: golpe, queda ou clinch. A chance de tentar a queda cresce com a vantagem de wrestling/grappling e com a estratégia "chão".
  - **Golpe**: chance de acertar = `0,12 + 0,68·σ((ataque − defesa)/20)`. Dano = `(4 + trocação/18 + força/30) × rng`, atenuado pelo queixo e pela defesa.
  - **Golpe pesado** (~13%, ×2,3): pode causar knockdown, e o knockdown pode virar **KO** conforme o dano acumulado e o queixo. Dano ≥ 100 ou árbitro (a partir de 78) = **TKO**.
  - **Queda**: `0,08 + 0,7·σ((wrestling − defesa de queda)/16)`. Falhar cansa.
  - **Chão por cima**: ground and pound, controle ou **finalização**, cuja chance cresce com o cansaço do defensor. **Por baixo**: raspagem, finalização da guarda ou levantar.
  - **Estamina**: cada ação custa `base × (1,45 − cardio/100) × estratégia`. Recupera `8 + cardio/7` no intervalo. Eficiência = estamina × (1 − dano/250).
  - **Interrupção médica**: no intervalo, se o dano ≥ 85.
- **Córner** (escolhido entre rounds; o NPC usa `aiStrategy`):
  - `pressionar`: mais volume, dano e gasto, menos defesa;
  - `seguro`: mais defesa, menos volume;
  - `chão`: muito mais quedas. É bom para quem é melhor no chão e ruim para o trocador, porque quedas bloqueadas cansam.
- **Juízes**: 3 juízes, 10-9 por round (10-8 com domínio ou 2 knockdowns), cada um com ruído próprio → decisão unânime, dividida, majoritária ou empate. No grappling, a decisão é por pontos (queda 2, raspagem 2, controle 3).
- **Calibragem** (testes): 65 × 50 em todas as habilidades → o superior vence ~88%. Entre lutadores próximos: ~30% KO/TKO, ~10% finalização, ~60% decisão.
- **Narração**: `src/content/fightText/`, com várias variações por tipo de lance.

### Mundo vivo, ranking e matchmaking
- **Elencos de NPCs** (nome, apelido, estilo, habilidades na faixa do nível, cartel) gerados pelo seed **só para as categorias que o jogador toca**, para manter o save enxuto (~20 KB por elenco).
- **Ano no mundo**:
  - os NPCs envelhecem e evoluem até os 28 (com teto no nível da liga) e decaem depois dos 33;
  - fazem ~2 lutas rápidas (probabilidade logística por rating, com o método pelo estilo) contra vizinhos de ranking;
  - campeão × #1 disputam o cinturão uma vez por ano;
  - aposentadoria aos 35+ (ou com muitas derrotas), com reposição por novatos.
- **Ranking**:
  - quem vence alguém melhor ranqueado assume a posição dele, e o perdedor cai 2;
  - quem vence alguém pior ranqueado sobe 1;
  - entre dois sem ranking, o vencedor entra no fim;
  - em disputa de cinturão, o vencedor vira campeão e o ex-campeão vai para o #1.
- **Matchmaking**:
  - estreantes (< 3 lutas pro) só enfrentam não ranqueados;
  - sem ranking: não ranqueados ou os 3 últimos;
  - ranqueado em r: adversários entre r−3 e r+3;
  - **top 3 com 3 vitórias seguidas → disputa de cinturão**;
  - campeão defende contra o top 3.
  - Kids e amador usam adversários efêmeros no nível do jogador.
- **Dinheiro**: bolsa da organização × (1 + rep/100), mais bônus de vitória, mais 50% de chance de bônus de performance em finalização. Disputa de cinturão paga em dobro.
  - Bolsas: LFM R$ 3 mil + 3 mil · ARC R$ 4 mil + 4 mil · Titã R$ 30 mil + 30 mil (+50 mil de performance).
- **Lesão**: chance após cada luta (4%, +30% em derrota por KO, +12% com dano alto) ou no sparring. A lesão fica guardada como `injury { nome, anosRestantes }`, bloqueia lutas, tira 10 de saúde e passa no fim do ano.

### Eventos de carreira (24, em `src/content/events/fighting/`)
- **Base**: primeira aula, nervosismo antes do primeiro campeonato, exame de faixa (auto), estreia amadora, briga de rua (`brigou_na_escola`), aberto de jiu-jitsu, troca de academia, conselho do treinador, olheiro e medalha na escola.
- **Profissional**:
  - propostas da LFM, da ARC e do Circuito Titã (auto);
  - rival com trash talk (→ revanche agendada por `followUp`, com o mesmo `{lutador}`);
  - oferta de doping (risco de suspensão e de perder o cinturão), patrocínio, falha no corte de peso (hook);
  - lesão no treino, substituição de última hora, defesa de cinturão;
  - vídeo viral, media day e pensamentos de aposentadoria.

### Balanceamento (`npm run sim`, 1000 vidas focadas em luta, até os 40 anos)
A política do script entra na melhor academia cedo, treina com toda a energia, aceita todas as lutas e contratos e usa o córner automático.

| Métrica | Resultado |
|---|---|
| Estreia profissional | 98% · idade média 19,8 |
| Chegou à liga principal | **31,3%** · idade média de estreia 30,4 |
| Melhor posição no Titã (mediana) | #5 |
| Campeão de alguma liga | 33% (quase sempre regional) |
| **Campeão do Circuito Titã** | **2,2%** |
| Faixa preta | 10,6% |
| Cartel profissional médio | 17-15-1 |
| Vitórias pro por método | decisão 43% · finalização 29% · KO/TKO 28% |
| Carreira pro | 21 anos (ainda não há aposentadoria) |
| Mortes antes dos 40 | 0 |

Os principais ajustes que levaram a esses números:
- recuperação anual de saúde (antes, 2/3 morriam antes dos 40);
- experiência de luta e treino de cardio e defesa;
- talento;
- teto de evolução dos NPCs;
- queixo genético;
- requisitos do Titã com aproveitamento recente e idade de assinatura;
- disputa de cinturão só com 3 vitórias seguidas.

### Ganchos para as próximas etapas
- **Lesões completas**: `fighter.injury` (gravidade, cirurgia, sequelas); hoje só bloqueia lutas e tira saúde.
- **Aposentadoria**: a flag `pensa_aposentar`; o declínio após os 33 já existe; falta encerrar a carreira e criar um evento de despedida.
- **Legado**: `titlesWon`, histórico de lutas, Hall da Fama e filhos herdando academia ou fama.
- **Economia**: patrocínios hoje são eventos simples, a mensalidade é cobrada de forma básica, e ainda falta abrir uma academia própria.
- **Talento** pode virar algo revelado aos poucos (olheiros, testes).

## 6. Sistemas futuros
- **Faculdade:** vestibular, cursos e vida universitária (a partir da escolha `caminho_18 = 'faculdade'`).
- **Relacionamentos:** família (pais, irmãos), amizades, namoro, casamento, divórcio, filhos.
- **Emprego:** trabalhos paralelos antes de viver da luta; carreira pós-luta (técnico, comentarista).
- **Economia e bens:** salário, bolsas, patrocínio, imóveis, carros, abrir academia/empresa.
- **Saúde:** lesões, cirurgias, desgaste acumulado, doenças.
- **Aposentadoria e legado:** fim da carreira, Hall da Fama, filhos herdando academia/fama; jogar como herdeiro.
- **Meta:** conquistas, estatísticas de vidas anteriores.

## 7. Arquitetura (resumo)
Engine TS pura e determinística (`src/engine`), conteúdo como dados (`src/content`), save versionado com
migrações (`src/save`), UI React que apenas lê o estado e despacha ações (`src/ui`). Detalhes em `CLAUDE.md`.

## 8. Roadmap
- **Etapa 1 — Esqueleto jogável** ✅ — projeto, GameState, criação de personagem, energia, 3 ações,
  avançar ano, motor de eventos + 10 eventos de infância, log, autosave em IndexedDB, testes.
- **Etapa 2 — Escola** ✅ — fases escolares, matrícula automática, nota/disciplina/faltas/popularidade,
  aprovação e reprovação, expulsão, clubes, 3 ações escolares, eventos encadeados e automáticos, 34 eventos
  escolares, formatura e decisão dos 18 anos, save v2 com migração.
- **Etapa 3 — Carreira de luta** ✅ — perfil de lutador (habilidades, talento, corpo/categoria, faixas, reputação),
  academias e treino, 7 organizações fictícias (kids → amador → regionais → Circuito Titã), simulação round a round
  com córner, mundo vivo de NPCs com ranking e cinturão, ofertas/bolsas/lesões, 24 eventos, save v3 e `npm run sim`.
- **Etapa 4 — Relacionamentos** — família, amizades, namoro, casamento, filhos.
- **Etapa 5 — Economia e bens** — empregos, bolsas e patrocínios, imóveis, carros, empresas/academia.
- **Etapa 6 — Polimento** — PWA (instalável/offline), conquistas, aposentadoria e legado (jogar como herdeiro).
