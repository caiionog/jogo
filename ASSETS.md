# ASSETS.md — Direção de arte do avatar: cartoon (padrão, release 0.0.3) e pixel art (Etapa 8)

O avatar é **derivado na engine e desenhado na UI**. `deriveAvatar` (engine, TS puro) devolve um `AvatarDescriptor`
com fase, tipo físico, cores, cabelo, barba, rosto, expressão, marcas e a roupa por camadas. O renderizador só traduz
esse descriptor em pixels: nunca calcula aparência nem lê o estado do jogo, e nada do avatar vai para o save.

```
GameState ──deriveAvatar()──▶ AvatarDescriptor ──renderAvatar()──▶ RGBA 32×64 ──PixelCanvas──▶ <canvas> 2×/3×/4×/8×
                                    │                                  └──bustCrop()──▶ busto 32×28 (topo, miniaturas)
                                    └──previewAvatar() (criação) · deriveNpcAvatar() (elenco, derivado do id)
```

| Peça | Arquivo | Papel |
|---|---|---|
| `renderAvatar(desc, opts)` | `src/ui/avatar/pixel/render.ts` | compõe as camadas num buffer RGBA (roda no Node: testes e scripts) |
| `makeRamp(hex)` | `src/ui/avatar/pixel/color.ts` | rampa de 4 tons com deslocamento de matiz |
| `generateBody(fase, sexo, tipo)` | `src/ui/avatar/pixel/bodygen.ts` | proporções → grade de regiões + âncoras |
| `PixelAvatarRenderer` | `src/ui/avatar/renderer.ts` | implementa `AvatarRenderer` (desenhar e tirar snapshot) |
| `PixelCanvas` / `PixelAvatar` | `src/ui/avatar/` | exibição com `image-rendering: pixelated`, respiração e piscar |
| `ThumbnailCache` / `AvatarThumb` | `src/ui/avatar/thumbnails.ts` | miniaturas (LRU por hash do descriptor) |
| Grades e regras | `src/content/sprites/` | corpos (`body/`), roupas (`clothes.ts`), ícones do Mercado (`market/`) |


## Visual cartoon (padrão desde a release 0.0.3)
Renderizador vetorial em `src/ui/avatar/vector/` (`VectorAvatarRenderer`). Ele implementa a mesma interface
`AvatarRenderer` do pixel art e consome o mesmo `AvatarDescriptor`. O jogador escolhe o visual em Configurações →
"Visual dos personagens" (`meta.settings.avatarStyle`, padrão `cartoon`). `PixelAvatar`, `AvatarThumb` (cache próprio:
`vectorThumbnails`), `GameIcon` e a `IntimacyTransition` seguem a escolha.

**Proporções**
- Moldura de 200 × 420 unidades (`VIEW_W`/`VIEW_H`), com o personagem centrado e uma sombra no chão.
- No adulto, a cabeça tem cerca de 1/5 da altura (um pouco maior que o real). No bebê é bem maior, com membros curtos e
  gordinhos.
- A transição entre fases é contínua pelos fatores `growth`, `elder`, `baby` e `sexK` (dimorfismo zero na infância).
  O idoso tem ombros caídos, cabeça um pouco mais baixa, pele mais opaca (`agedSkin`), bolsas e rugas.
- Os 5 biotipos variam continuamente por `fat` e `muscle`:
  - magro e médio;
  - atlético e musculoso, com trapézio, deltoide e bíceps por sombra suave, cintura em V, coxas e panturrilhas;
  - acima do peso, com barriga e papada.

  A roupa acompanha a silhueta.

**Traço e cor** (`palette.ts`)
- Cada região tem uma rampa curta: base, uma sombra suave (a mesma cor escurecida e um pouco mais saturada, puxada
  para o vermelho ou roxo) e o contorno, bem mais escuro e colorido, **nunca preto puro**.
- A luz vem de cima à esquerda: a sombra fica embaixo e à direita de cada forma.
- O contorno da pele tem contraste ≥ 3:1 com a própria pele até o tom 0,75 da rampa. No tom mais escuro, ele é mais
  escuro que a pele e tem ≥ 3:1 contra o fundo do avatar (testado).

**Camadas e sobreposição** (`svg.ts`)
- `group` desenha várias formas como uma peça só (pele inteira; roupa com mangas): o contorno de todas por baixo e os
  preenchimentos por cima. Assim só a silhueta externa ganha traço, nunca as emendas (ombro, quadril, pulso).
- Uma peça da frente sempre cobre a de trás por inteiro. O antebraço e a mão são redesenhados por cima de saia, barra
  e colete.
- Camisas de farda e social entram por dentro da calça, com cinto. O coturno fica por cima da calça; os outros calçados
  ficam por baixo da barra.

**Regras**
- **O avatar é SEMPRE renderizado vestido**, em qualquer renderizador. Não existe camada de corpo sem roupa visível.
  Sem parte de cima nem inteira, entra uma camiseta; sem parte de baixo nem inteira, uma bermuda (`wornLayers`). A
  sunga sozinha ganha a camiseta de reserva.
- Roupa de banho adulta só para 18+. Isso vem da engine (`swimOutfit`), e as peças cobrem com decência.
- Diversidade sem caricatura: as mesmas faixas amplas de traços para todos. Cor ou raça nunca muda mecânica.
- Determinismo: o mesmo descriptor gera o mesmo SVG. Os ids internos vêm do hash do descriptor; não há
  `Math.random`.
- Desempenho: um avatar leva menos de 5 ms (cerca de 1,6 ms medido). As miniaturas ficam em cache.
- Identidade própria: nada de formas, peças ou marcas de outros apps.

**Ícones cartoon** (`src/ui/icons/vector/` + `GameIcon`)
- Mesma linguagem dos avatares: contorno colorido e uma sombra por forma.
- Cada família tem uma base comum:
  - bens: cartão;
  - empreendimentos: fachada com toldo na cor do ramo e placa com o símbolo;
  - delitos: medalhão com anel de gravidade;
  - fardas: escudo;
  - facções: brasão nas cores da facção.
- Os ícones em pixel art continuam em `src/content/sprites/` para o visual pixel.

**Como adicionar no cartoon**
- **Roupa:** além do `OutfitDef` e da regra de pixel em `sprites/clothes.ts`, faça o desenho em
  `vector/clothes.ts` (corpo, camadas inteira e agasalho) ou em `vector/wear.ts` (calçados e acessórios). Peça sem
  desenho próprio cai no genérico da camada, na cor da peça.
- **Ícone:** uma entrada em `vector/market.ts` ou `vector/badges.ts`. `tests/vectorIcons.test.ts` exige SVG válido,
  todos diferentes entre si e sem `#000`.
- **Verificação:** use `/dev/avatars?modo=lado-a-lado`, que mostra fases, 24 NPCs, físicos, roupas, fardas, praia,
  pele, cabelos e rostos. Os testes ficam em `tests/vectorAvatar.test.ts`.

## Pixel art (alternativa)

## Direção de arte

- **Moldura comum de 32×64**, alinhada pelos pés (linha 62; a 63 é a sombra no chão). Exibição só em **escala
  inteira** (2×, 3×, 4×, 8×), nunca fracionada. Busto = recorte de 32×28 a partir do topo da cabeça.
- **Fases**: bebê (0–2), criança (3–11), adolescente (12–17), adulto (18–59) e idoso (60+, ombro caído e leve
  curvatura). Dentro da fase, a altura cresce em passos inteiros pela idade.
- **Tipos físicos** (`Build`): magro, médio, atlético, musculoso e acima do peso, derivados de gordura e musculatura
  (capacidade atlética, carga de treino, padrão de vida e propensão genética). A silhueta muda de forma visível.
- **Luz sempre de cima à esquerda.** Sombra pelo lado direito e de baixo; luz no topo da cabeça, ombro e coxa
  esquerdos.
- **Contorno seletivo (sel-out)**: a borda recebe o tom mais escuro da rampa da própria região, **nunca preto
  puro**. O teste garante contraste legível sobre o fundo do avatar nos dois extremos de pele.
- **Sem anti-aliasing**, sem meio-pixel, sem gradiente. Pixels isolados só onde têm sentido (brilho dos olhos, pinta,
  sarda, botão).
- **Ordem das camadas**: sombra no chão → cabelo de trás → corpo → calçado → parte de baixo → inteira → parte de
  cima → agasalho → mãos → rosto → barba → cabelo da frente → acessórios → marcas → rugas.
- **Animação**: respiração em 2 quadros (tronco 1 px) e piscar a cada 3–6 s, só na tela principal e no perfil;
  desligada com `prefers-reduced-motion`.

### Paleta
- **Rampas de 4 tons** por cor base (sombra forte, sombra, base, luz) com **deslocamento de matiz**: a sombra puxa
  para vermelho/roxo e a luz para amarelo; a saturação tem teto (`satCap`) para não estourar.
- A pele contínua do gene é quantizada em 20 bases; o cabelo em 12; as roupas usam as cores do catálogo
  (`src/content/outfits/index.ts`). Grisalho mistura pixels brancos por limiar estável conforme a idade.
- **Limite: ≤ 48 cores distintas por avatar** (testado em amostra grande). Os ícones 16×16 do Mercado usam
  paletas próprias de até 6 cores.

## Formato das grades (`src/content/sprites/`)

Cada pixel é um caractere, legível e editável num arquivo `.ts`:

```ts
export const ADULTO_M_MEDIO: BodySprite = {
  id: 'adulto_M_medio', w: 32, h: 64,
  // h cabeça · e orelha · n pescoço · t tronco · a braço · m mão · c quadril · l perna esq. · r perna dir. · p pé · '.' vazio
  shape: ['............hhhhhhhh............', /* … 64 linhas */],
  shade?: [/* opcional: '-' sombra · '=' sombra forte · '+' luz · '.' automático */],
  anchors: { head, eyeL, eyeR, mouth, neck, shoulderL/R, chest, waist, elbowL/R, wristL/R, hipL/R, kneeL/R, ankleL/R },
  headBox: [x, y, largura, altura],
};
```

- **Corpos**: as 50 combinações (5 fases × 2 sexos × 5 tipos) saem de `bodygen.ts` por proporções (meias-larguras de
  ombro/peito/cintura/quadril, linhas de tronco/pernas, braço/antebraço) e são gravadas em `body/generated.ts` por
  `npx tsx scripts/sprites/gen-bodies.ts`. Uma grade feita à mão tem prioridade: arquivo próprio em `body/` registrado
  em `BODY_OVERRIDES` (hoje: `adulto_M_medio`, o primeiro personagem).
- **Roupas são regras, não desenhos** (`clothes.ts`): `cover` diz quais regiões a peça cobre, de qual âncora até qual
  (`{ regions: ['l','r'], to: { a: 'kneeL', dy: 1 } }`), e `details` acrescenta gola, decote, alças, botões, zíper,
  bolso, capuz, cordão, barra da manga, cós, emblema, lapela, gravata, frente aberta, saia, sola, tira, brilho, vinco,
  faixa, aba do boné e lentes. O renderizador recolore a região com a rampa da cor, faz dobras (axilas, cintura,
  joelhos) e o contorno. Assim toda peça serve em todo corpo e idade (testado: roupa dentro da silhueta + 2 px).
  Camadas: `baixo`, `inteira`, `calcado`, `cima`, `agasalho`, `acessorio`.
- **Cabelos** (12): careca, raspado, curto, médio, longo, black power, tranças, dreads, coque, rabo de cavalo,
  moicano e franja, cada um com parte de trás e da frente, ajustados à caixa da cabeça de cada fase. O **tipo**
  (liso/ondulado/cacheado/crespo) aplica textura de pixels; calvície remove linhas do topo e das entradas.
- **Barbas** (adulto/adolescente 16+): por fazer, rala, cheia, bigode e cavanhaque, no tom do cabelo e com grisalho.
- **Rosto**: olhos pelo formato do gene, sobrancelhas, nariz e lábios em 3 larguras, 6 expressões (feliz, neutro,
  triste, cansado, bravo, machucado), sardas e pintas, rugas na testa e nos olhos.
- **Marcas da luta**: cicatriz, nariz torto, orelha de couve-flor e olho roxo.
- **Ícones do Mercado** (`market/index.ts`): 16×16, mesma notação de caracteres com paleta por ícone.

## Pipeline para artista (Aseprite → PNG → grade)

1. Desenhe o corpo em 32×64 (ou menor; o importador centraliza e alinha os pés na linha 62) usando **só as
   cores-chave** abaixo, fundo transparente. Sem sombreado: luz, sombra e contorno são aplicados pelo renderizador.

   | Região | Cor-chave | Região | Cor-chave |
   |---|---|---|---|
   | cabeça `h` | `#ff0000` | mão `m` | `#0080ff` |
   | orelha `e` | `#ff8000` | quadril `c` | `#0000ff` |
   | pescoço `n` | `#ffff00` | perna esq. `l` | `#ff00ff` |
   | tronco `t` | `#00ff00` | perna dir. `r` | `#8000ff` |
   | braço `a` | `#00ffff` | pé `p` | `#808080` |

2. Exporte PNG RGB/RGBA de 8 bits com o nome `corpo__<fase>__<sexo>__<tipo>.png`
   (fases `bebe|crianca|adolescente|adulto|idoso`, sexo `M|F`, tipo `magro|medio|atletico|musculoso|acima`).
3. `npx tsx scripts/sprites/png-to-grid.ts caminho/corpo__adulto__F__atletico.png` grava
   `src/content/sprites/body/adulto_F_atletico.ts` (âncoras copiadas da grade gerada; ajuste se precisar).
4. Registre o export em `BODY_OVERRIDES` (`body/index.ts`), rode `npm test` e confira em `/dev/avatars`.
   Uma cor fora da tabela interrompe a importação com a posição do pixel. (Ida e volta testada em
   `tests/pngImport.test.ts`.)

### Licenças
Só arte original do projeto ou CC0/CC-BY 4.0 (crédito em `public/CREDITS.md`). Nada de sprites, personagens ou estilo
copiados de jogos existentes, nem rostos de pessoas reais.

## Garantias testadas (`tests/pixelAvatar.test.ts`)
Determinismo (hash de pixels) · grade para todas as fases × sexos × tipos com âncoras na moldura · cobertura
fase × sexo × tipo × cabelo × roupa sem camada faltando · roupa dentro da silhueta · ≤ 48 cores · contraste do
contorno · compor < 5 ms · ícones 16×16 com paleta definida · toda roupa do catálogo tem regra.

## Regras de qualidade (release 0.0.1, `tests/avatarQuality.test.ts`)
- **O sexo tem de ser legível em todas as fases.** Mulheres têm cílios, lábio mais cheio, cintura e quadril
  arredondados e curvas sombreadas (só adulta e idosa, sempre vestida). Homens têm sobrancelha mais grossa, maxilar
  marcado no adulto e ombros mais largos. Um classificador simples por pixels não pode confundir M e F na amostra de
  NPCs.
- **O tipo de corpo tem de ser legível** (`BUILD_DELTA` em `bodygen.ts`): magro, médio, atlético, forte e gordo com
  silhuetas claramente diferentes. Depois de mexer, regere com `npx tsx scripts/sprites/gen-bodies.ts`.
- **Rosto:** olhos com 2 px ou mais de altura, boca e nariz desenhados por sexo, e contraste mínimo entre pele, cabelo
  e roupa vizinhos.
- **Cabelo:** forma arredondada com laterais afinando e um tom próprio de sombra (`hairTone`).
- **Roupa de treino:** a faixa de duas cores tem uma listra de 3 linhas e o prajied fica no braço (`drawBelt`,
  `drawPrajied`). As cores vêm dos dados de graduação.
- **Roupa de banho:** peças adultas só a partir de 18 anos (`minAge: 18`), sem exceção.
- Auditoria visual: `npx tsx scripts/sprites/avatar-audit.ts` gera a grade de NPCs. As capturas de antes e depois
  ficam em `docs/release-0.0.1/screenshots/`.

## Ícones de negócio (padrão)
Cada `BusinessDef` tem um ícone 16×16 montado por `businessIcon` (`src/content/sprites/market/business.ts`). A base é
comum a todos: fachada, toldo, contorno `#2a2238` e a moldura pelo token do tema, para funcionar no claro e no escuro.
Sobre ela entra um **glifo 8×7** próprio, em `BUSINESS_GLYPHS`, com o mesmo id do negócio. O glifo usa no máximo 6
cores no total e tem de ser diferente dos outros (o teste compara os hashes). `MARKET_ICONS` junta tudo e `ICON_FOR`
mapeia cada id.

## Como adicionar coisas
- **Roupa**: `OutfitDef` em `src/content/outfits/index.ts` (`layer`, `colors`, idades, `price` se for luxo) + regra
  com o mesmo id em `src/content/sprites/clothes.ts`. O teste falha se faltar a regra.
- **Cabelo**: id em `HAIR_STYLES`/`HAIR_STYLE_LABEL` (`engine/character/appearance/genes.ts`), peso de sorteio em
  `derive.ts`, desenho (trás/frente) no `render.ts`; aparece sozinho no perfil, na criação e na `/dev/avatars`.
- **Barba**: id em `FACIAL_HAIR`/`FACIAL_HAIR_LABEL` e o desenho em `render.ts`.
- **Expressão**: valor em `Expression` (`derive.ts`), regra de quando ela vale em `deriveAvatar`, boca/olhos em
  `render.ts`.
- **Traço de aparência novo**: gene em `AppearanceGenes`, sorteio em `sample.ts` (faixas iguais para todos os
  grupos), herança em `inherit.ts`, campo no descriptor e migração do save. Nunca use um gene em mecânica
  (`tests/fairness.test.ts`).
- **Ícone do Mercado**: grade 16×16 em `src/content/sprites/market/index.ts` e o mapeamento em `ICON_FOR`.
- **Ícone de negócio**: glifo 8×7 em `BUSINESS_GLYPHS` (ver "Ícones de negócio" acima).
