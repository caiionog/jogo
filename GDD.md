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
- Futuro: técnica por modalidade (trocação, wrestling, jiu-jitsu), cardio, queixo, fama, reputação.

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
Todas as organizações e lutadores são **fictícios**.

1. **Infância — artes marciais:** judô, jiu-jitsu, muay thai, boxe, karatê em academias de bairro. Faixas e
   torneios infantis.
2. **Amador:** campeonatos estaduais/nacionais de jiu-jitsu (ex.: "Copa Tatame Aberto") e MMA amador.
3. **Ligas regionais:** eventos profissionais menores (ex.: "Arena Regional de Combate", "Liga Fronteira MMA").
   Cartel profissional, bolsas por luta, primeiros patrocínios.
4. **Liga principal:** **Circuito Titã** — divisões de peso, **ranking top 15**, lutas principais,
   disputa e defesas de **cinturão**. Campeão de exemplo: Rafael "Trovão" Mendes.

Sistemas: treino por modalidade e camp de luta; corte de peso; **simulação round a round** (3 ou 5 rounds,
golpes, quedas, finalizações, nocautes, decisão dos juízes) usando atributos + RNG determinístico;
contratos; empresário; lesões e tempo de recuperação; rivalidades.

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
- **Etapa 3 — Carreira de luta** — modalidades e faixas, treino específico, simulação de luta round a round,
  organizações fictícias (amador → regional → Circuito Titã), cartel, ranking e cinturão, lesões básicas.
- **Etapa 4 — Relacionamentos** — família, amizades, namoro, casamento, filhos.
- **Etapa 5 — Economia e bens** — empregos, bolsas e patrocínios, imóveis, carros, empresas/academia.
- **Etapa 6 — Polimento** — PWA (instalável/offline), conquistas, aposentadoria e legado (jogar como herdeiro).
