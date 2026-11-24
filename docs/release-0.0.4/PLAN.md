# Release 0.0.4 — Plano aprovado

Ponto de partida: `claude/beautiful-ptolemy-z8zx6u` @ `bf1ba8f`, save v16, meta v3. O plano original (fase 0) foi
aprovado com os ajustes abaixo.

## Ajustes em relação à fase 0
1. **Fama entra na fase 1** (tipo, migração v16→v17 e leitores). A fase 5 fica só com o conteúdo de fama (escândalos,
   redes sociais, comerciais). Motivo: as fases 3 e 4 já leem fama.
2. **Fase 3 em sequência**: primeiro `partners` e ex-amizades, depois o app de namoro (os dois mexem em relações).
3. **Clubes da Divisão A refeitos**: a lista da fase 0 espelhava os 20 clubes reais da primeira divisão (mesma cidade,
   mesmas cores, mesma sigla). Regras novas, checadas por teste:
   - nenhuma sigla do clube real da mesma cidade (CR, SE, CA, EC…) no lugar dela;
   - nenhum clube fictício com a mesma cidade **e** as mesmas cores de um clube real da lista proibida;
   - no máximo 2 clubes da Divisão A por cidade.
4. **Teste de varredura dos `auto`**: a flag de parada vale só se **todas** as escolhas a resolvem.
5. **População**: gerador versionado (`popVersion`); quem já apareceu na tela vai para o save; guardar também quem
   saiu (morreu, mudou-se).
6. **Vários parceiros**: casamento continua exclusivo (bigamia é crime); `open` vale para namoro e casamento aberto.
7. **Professor da rede pública**: qualquer licenciatura do jogo (Pedagogia, Educação Física, Letras, Matemática se
   existirem).

## Fases
| Fase | Conteúdo |
|---|---|
| 1 Casa em ordem | `cooldownYears` no `auto`, varredura, Exame da Ordem como ação, fama (tipo + v16→v17) |
| 2 População e imigração | pessoas da cidade sob demanda, bairros, vizinhos, origem (dados oficiais ou aviso) |
| 3 Social | `partners`, ex-amizades, iniciativa de NPCs; depois app de namoro, descoberta, gravidez casual |
| 4 Concursos e colegas | motor genérico de concurso, 10 cargos, colegas de farda |
| 5 Fama (conteúdo) | escândalos, redes sociais, comerciais, 20+ eventos |
| 6 Futebol | clubes fictícios, carreira e temporada |
| 7 Minigames | pênalti primeiro (pausa para teste), depois os outros |
| 8–10 | eventos contínuos, balanceamento, docs e tag `v0.0.4` |

As tabelas de cargos e a lista da Divisão B continuam como na fase 0.
