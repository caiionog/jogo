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
- `tests/fairness.test.ts`: dois casos comparam caminhos com `/` (no Windows saem com `\`).
- `tests/ui*.test.tsx`: o módulo virtual do PWA não resolvia no Windows. **Corrigido na fase 3** com um stub nos
  testes (`tests/stubs/pwa-register.ts`, alias em `vite.config.ts`). Sobra um erro de teardown (o visual carregado sob
  demanda termina de importar depois do fim do teste); os testes de UI passam.
- `tests/pixelAvatar.test.ts` (encaixe): passa sozinho, mas pode estourar o tempo na suíte inteira.

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

## Próximo
Fase 4: motor genérico de concurso (refatorando o da polícia), os 10 cargos e os colegas de farda.
