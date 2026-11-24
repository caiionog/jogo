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
- `tests/ui*.test.tsx`: o módulo virtual do PWA não resolve no Windows.
- `tests/pixelAvatar.test.ts` (encaixe): passa sozinho, mas pode estourar o tempo na suíte inteira.

## Próximo
Fase 2 (população e imigração), depois fase 3 em sequência.
