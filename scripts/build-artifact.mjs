/**
 * Gera uma versão de teste em arquivo único (HTML com JS e CSS embutidos) a partir de dist/.
 * Uso: npm run build:artifact [-- caminho/de/saida.html]
 * O resultado é um fragmento de página (sem <html>/<head>/<body>), no formato aceito pelo publicador de páginas.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[2] ?? 'dist/vida-de-lutador.html';
const html = readFileSync('dist/index.html', 'utf8');
const js = html.match(/<script type="module" crossorigin src="\/([^"]+)"><\/script>/);
const css = html.match(/<link rel="stylesheet" crossorigin href="\/([^"]+)">/);
if (!js || !css) throw new Error('Não encontrei os assets em dist/index.html — rode npm run build antes.');
const code = readFileSync(join('dist', js[1]), 'utf8').replaceAll('</script', '<\\/script');
const style = readFileSync(join('dist', css[1]), 'utf8').replaceAll('</style', '<\\/style');

const page = `<meta charset="utf-8">
<title>Vida de Lutador</title>
<meta name="theme-color" content="#0f172a">
<style>${style}</style>
<div id="root"></div>
<script type="module">${code}</script>
`;
writeFileSync(out, page);
console.log(`Versão de teste gerada: ${out} (${(page.length / 1024).toFixed(0)} KB)`);
