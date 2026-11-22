# Vida de Lutador

Simulador de vida no navegador, no estilo BitLife, focado na carreira de lutador. Você nasce, vai à escola, entra
numa academia, sobe dos torneios infantis até o **Circuito Titã** (liga fictícia), namora, casa, tem filhos, ganha e
perde dinheiro, se machuca, se aposenta, envelhece e morre. Depois, se tiver filhos, a história continua com um deles.

Tudo é fictício: ligas, academias, marcas, bancos e lutadores. Os textos estão em português do Brasil.

**Versão 1.0** — design completo em [`GDD.md`](./GDD.md); guia técnico em [`CLAUDE.md`](./CLAUDE.md).

## O que tem no jogo
- **Vida ano a ano** com energia, ações e eventos com escolhas e consequências.
- **Escola**: notas, disciplina, clubes, formatura.
- **Carreira de luta**: treino, faixas de jiu-jitsu, lutas round a round com córner, ranking vivo, cinturões, rivais.
- **Relações**: família, amigos, namoro, casamento e filhos.
- **Economia**: emprego, bolsas, patrocínios, banco, imóveis, carros, a sua própria academia e outras empresas.
- **Corpo**: lesões com tratamento (repouso, fisioterapia, cirurgia), sequelas, doenças da velhice e dano acumulado na
  cabeça.
- **Fim de vida**: aposentadoria, testamento, obituário com nota da vida e continuar como filho(a), com dinastia e
  árvore genealógica.
- **Entre vidas**: 50 conquistas (algumas secretas) e Hall da Fama.
- **Como app**: funciona offline, pode ser instalado no celular, tem 3 vidas salvas e backup do save em arquivo.

## Como rodar
Requisitos: Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:5173
```

Outros comandos:

```bash
npm test           # testes (Vitest)
npm run build      # typecheck + build de produção em dist/
npm run preview    # serve o build em http://localhost:4173 (com o PWA: offline e instalar)
npm run sim        # simulação de balanceamento (carreira, economia, vidas completas, dinastias, conquistas)
npm run bench      # performance de "Avançar ano" com um save de 80 anos
```

Para publicar, sirva a pasta `dist/` em qualquer hospedagem estática com HTTPS (o service worker exige HTTPS, exceto em
`localhost`).

## Como instalar no celular
O jogo é um PWA: depois de aberto uma vez, funciona sem internet.

- **Android (Chrome)**: abra o jogo, toque em **☰ → Instalar app**. Se o botão não aparecer, use o menu do Chrome
  **⋮ → Instalar app** (ou "Adicionar à tela inicial").
- **iPhone/iPad (Safari)**: toque em **Compartilhar (⬆️) → Adicionar à Tela de Início**.
- **Computador (Chrome/Edge)**: ícone de instalar na barra de endereço, ou **☰ → Instalar app**.

Quando sair uma versão nova, aparece o aviso **"Nova versão disponível — Atualizar"**.

## Backup do save (e troca de aparelho)
Os saves ficam no próprio aparelho (IndexedDB do navegador). Para não perder a sua vida:

1. Abra **☰ → Backup do save → Exportar**. Vai baixar um arquivo `vida-de-lutador-<nome>-<data>.json` com a vida do
   slot atual.
2. No outro aparelho (ou depois de limpar o navegador), abra **☰ → Importar** e escolha o arquivo. A vida entra no
   slot atual.

Saves de versões antigas do jogo são convertidos automaticamente. Arquivos inválidos ou de versão mais nova são
recusados com uma mensagem explicando o motivo. As conquistas e o Hall da Fama ficam guardados à parte e não vão no
arquivo de exportação.

Para começar outra vida sem perder a atual, use os **3 slots** em **☰ → Vidas salvas**. Para apagar tudo deste
aparelho, use **☰ → Configurações → Apagar dados**.
