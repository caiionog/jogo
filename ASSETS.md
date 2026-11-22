# ASSETS.md — Pipeline do avatar 3D

O avatar é **derivado na engine e renderizado na UI**: `deriveAvatar` (engine, TS puro) devolve um
`AvatarDescriptor` com números e cores. O renderizador só traduz esse descriptor em geometria. Ele nunca calcula
aparência nem lê o estado do jogo. Trocar o renderizador (Fase A → Fase B) não muda nada na engine nem no save.

```
GameState ──deriveAvatar()──▶ AvatarDescriptor ──AvatarRenderer──▶ canvas ao vivo (1 por tela)
                                     │                         └──▶ snapshot() → miniatura (cache por avatarHash)
                                     └──AvatarSvg──▶ fallback 2D
```

## Interface do renderizador

| Peça | Arquivo | Papel |
|---|---|---|
| `buildBust(desc) → THREE.Group` | `src/ui/avatar/bust.ts` | Fase A: busto procedural (compartilhado pelo canvas e pelas miniaturas) |
| `Avatar3D` | `src/ui/avatar/Avatar3D.tsx` | canvas R3F (`frameloop="demand"`), transição de ~500 ms, rotação na tela cheia |
| `snapshot(desc, size) → dataURL` | `src/ui/avatar/snapshot.ts` | renderizador oculto **compartilhado** para miniaturas |
| `ThumbnailCache` | `src/ui/avatar/thumbnails.ts` | LRU (300) por `avatarHash`, fila em tempo ocioso; não importa three |
| `AvatarSvg` | `src/ui/avatar/AvatarSvg.tsx` | fallback 2D do mesmo descriptor |
| `AvatarStage` / `AvatarThumb` | `src/ui/avatar/` | escolhem 3D ou 2D (WebGL, aparelho fraco, opção "Avatar: 2D") |

Uma Fase B só precisa oferecer uma função equivalente a `buildBust(desc)` (ex.: `buildGlbBust(desc)`) que devolva
um `THREE.Group` pronto. As luzes (`addLights`) e o enquadramento (`frameCamera` + `userData.frame`) ficam iguais.

## Fase A — busto procedural (atual)

- Geometria low-poly gerada em código (esferas deformadas, torno e tubos), materiais `MeshStandardMaterial`.
- **Limite: ≤ 6.000 triângulos por busto** (pior caso: cabelo cacheado comprido, barba, marcas e rugas).
  Verificado em `tests/bust.test.ts` para todas as combinações de cabelo, estilo, roupa e idade.
- Chunk 3D (three + R3F + drei) carregado sob demanda: ≈ 237 KB gzip. Alvo: < 250 KB.
- Parado: 0 desenhos por segundo. Girando: renderiza só durante a interação.

## Fase B — modelo GLB com shape keys (pipeline; ainda sem asset)

### Ferramentas e fontes aceitas
- Modelagem: **Blender** (4.x). Base humana: **MakeHuman** (exportações CC0) ou modelagem própria.
- **Licenças aceitas**: CC0 e CC-BY 4.0. Com CC-BY, o crédito vai em `public/models/CREDITS.md`.
  **Não aceitas**: licenças "editorial", NC (não comercial), ND, ou qualquer asset de jogo/marca existente.
- Nada de rostos de pessoas reais (sem fotogrametria de pessoas identificáveis).

### Limites
| Item | Limite |
|---|---|
| Triângulos (busto + cabelo + roupa visível) | **≤ 8.000** |
| Tamanho do `.glb` com Draco | **≤ 300 KB** (todos os cabelos e roupas juntos: ≤ 1,5 MB) |
| Texturas | ≤ 512×512, WebP/KTX2; preferir cor por vértice/material |
| Materiais por busto | ≤ 8 |
| Ossos | nenhum (busto estático; expressões por shape key) |

### Convenção de shape keys (nomes exatos; valores 0–1 vindos do descriptor)
| Shape key | Campo do descriptor | Observação |
|---|---|---|
| `age_baby` | `1 - growth` (quando `growth < 0.35`) | cabeça grande, rosto baixo, bochechas |
| `age_child` | faixa de `growth` 0,35–0,8 | |
| `age_elder` | `elder` | postura, papada, pálpebras |
| `fat` | `fat` | rosto, pescoço, tronco |
| `muscle` | `muscle` | ombros, trapézio, pescoço, V do tronco |
| `nose_width` | `noseWidth` | |
| `lip_volume` | `lipVolume` | |
| `face_round` / `face_square` / `face_heart` / `face_long` | `faceShape` (one-hot; oval = base) | |
| `eye_round` / `eye_long` / `eye_monolid` | `eyes.shape` (amendoado = base) | |
| `wrinkles` | `wrinkles` | ou textura de normal com intensidade |
| `smile` / `sad` / `tired` / `hurt` | `expression` (one-hot; neutro = base) | |
| `sex_f` | `sex === 'F'` | proporções do tronco |
| `ear_cauliflower` | `marks.cauliflowerEar` | |
| `nose_broken` | `marks.brokenNose` | |

Cabelos (`hair_liso_curto`, `hair_crespo_longo`…), barbas (`beard_barba`, `beard_bigode`, `beard_cavanhaque`) e
roupas (`outfit_<mesh>`, um por `OutfitMesh`) são **objetos separados** no mesmo GLB, ligados ou desligados pelo
descriptor. A calvície usa uma shape key `bald` no objeto do cabelo.

### Materiais e cores
- Pele: material `skin` com a cor de `desc.skin` (a paleta vem da engine: `skinRgb(tom, subtom)`).
- Cabelo/barba: `hair` com `desc.hair.color` (o grisalho já vem misturado).
- Olhos: `iris` com `desc.eyes.color`. Roupa: `cloth` com `desc.outfit.color`; faixa do kimono: `belt` com
  `desc.outfit.beltColor`.
- Nada de cor de pele "pintada" na textura: a cor vem sempre do descriptor (diversidade contínua).

### Exportação
1. Blender → glTF 2.0 binário, "+Y up", apply modifiers, shape keys ligadas, sem animações.
2. `npx gltf-transform optimize in.glb out.glb --compress draco --texture-compress webp`.
3. Conferir triângulos e tamanho (tabela acima). O arquivo vai em `public/models/`, é carregado sob demanda e entra
   no precache do PWA.

## Como adicionar coisas

- **Roupa nova**: `OutfitDef` em `src/content/outfits/index.ts` (`mesh` existente, `colors`, idades, `price` se for
  luxo). Para uma malha nova, acrescente o tipo em `OutfitMesh` (engine) e o caso em `addTorso` (`bust.ts`) e no
  `AvatarSvg`; depois rode `npm test` (limite de triângulos) e confira em `/dev/avatars`.
- **Traço de aparência novo**: gene em `AppearanceGenes` (`genes.ts`), sorteio em `sample.ts` (faixas amplas para
  todos os grupos), herança em `inherit.ts`, campo no descriptor (`derive.ts`), desenho em `bust.ts`/`AvatarSvg`, e
  migração do save (genes novos para quem não tem). Nunca use um gene em mecânica (`tests/fairness.test.ts`).
