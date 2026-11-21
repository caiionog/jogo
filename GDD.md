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

## 4. Carreira de luta (Etapa 3)
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

## 5. Sistemas futuros
- **Colégio:** notas, matérias, bullying, esportes escolares, vestibular/faculdade.
- **Relacionamentos:** família (pais, irmãos), amizades, namoro, casamento, divórcio, filhos.
- **Emprego:** trabalhos paralelos antes de viver da luta; carreira pós-luta (técnico, comentarista).
- **Economia e bens:** salário, bolsas, patrocínio, imóveis, carros, abrir academia/empresa.
- **Saúde:** lesões, cirurgias, desgaste acumulado, doenças.
- **Aposentadoria e legado:** fim da carreira, Hall da Fama, filhos herdando academia/fama; jogar como herdeiro.
- **Meta:** conquistas, estatísticas de vidas anteriores.

## 6. Arquitetura (resumo)
Engine TS pura e determinística (`src/engine`), conteúdo como dados (`src/content`), save versionado com
migrações (`src/save`), UI React que apenas lê o estado e despacha ações (`src/ui`). Detalhes em `CLAUDE.md`.

## 7. Roadmap
- **Etapa 1 — Esqueleto jogável** ✅ — projeto, GameState, criação de personagem, energia, 3 ações,
  avançar ano, motor de eventos + 10 eventos de infância, log, autosave em IndexedDB, testes.
- **Etapa 2 — Escola** — entrada na escola, notas, eventos de colégio (6–17 anos), professores, amigos simples,
  esportes escolares, ação "descansar".
- **Etapa 3 — Carreira de luta** — modalidades e faixas, treino específico, simulação de luta round a round,
  organizações fictícias (amador → regional → Circuito Titã), cartel, ranking e cinturão, lesões básicas.
- **Etapa 4 — Relacionamentos** — família, amizades, namoro, casamento, filhos.
- **Etapa 5 — Economia e bens** — empregos, bolsas e patrocínios, imóveis, carros, empresas/academia.
- **Etapa 6 — Polimento** — PWA (instalável/offline), conquistas, aposentadoria e legado (jogar como herdeiro).
