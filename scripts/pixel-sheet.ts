/**
 * Folhas de revisão da pixel art (sem navegador): npx tsx scripts/pixel-sheet.ts <pasta> [escala]
 * Mesmas amostras da página /dev/avatars (src/ui/dev/samples.ts).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import type { AvatarDescriptor } from '../src/engine';
import { renderAvatar } from '../src/ui/avatar/pixel/render';
import { beards, faces, firstCharacter, hairs, marks, npcs, outfits, skinRamp, stagesByBuild } from '../src/ui/dev/samples';
import { sheet } from './pixel-preview';

const dir = process.argv[2] ?? 'tmp/sheets';
const scale = Number(process.argv[3] ?? 4);
mkdirSync(dir, { recursive: true });
const save = (name: string, ds: AvatarDescriptor[]) => writeFileSync(`${dir}/${name}.png`, sheet(ds.map((d) => renderAvatar(d)), scale));
save('01-primeiro', [firstCharacter()]);
stagesByBuild('M').forEach((r, i) => save(`02-fases-M-${i}`, r));
stagesByBuild('F').forEach((r, i) => save(`02-fases-F-${i}`, r));
save('03-fases-medio', stagesByBuild('M').map((r) => r[1]!).concat(stagesByBuild('F').map((r) => r[1]!)));
save('04-pele', skinRamp());
save('05-cabelos-a', hairs().slice(0, 6).flat());
save('05-cabelos-b', hairs().slice(6).flat());
save('06-barbas', beards());
save('07-rostos', faces());
const t = outfits('magro');
const h = outfits('acima');
save('08-roupas-magro-a', t.slice(0, 16));
save('08-roupas-magro-b', t.slice(16));
save('08-roupas-acima-a', h.slice(0, 16));
save('08-roupas-acima-b', h.slice(16));
save('09-marcas', marks());
save('10-npcs-a', npcs().slice(0, 12));
save('10-npcs-b', npcs().slice(12));
console.log('ok', dir);
