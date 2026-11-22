/** Página de desenvolvimento /dev/avatars (só no `npm run dev`): grades da pixel art. */
import type { ReactNode } from 'react';
import type { AvatarDescriptor } from '../../engine';
import { BUILDS, HAIR_STYLE_LABEL, HAIR_STYLES } from '../../engine';
import PixelAvatar from '../avatar/PixelAvatar';
import { STAGE_AGES, beards, faces, firstCharacter, hairs, marks, npcs, outfits, skinRamp, stagesByBuild } from './samples';

function Row({ title, items, scale = 3, testId }: { title: string; items: AvatarDescriptor[]; scale?: number; testId?: string }) {
  return (
    <section className="mb-5" data-testid={testId}>
      <h2 className="mb-1 text-sm font-semibold">{title}</h2>
      <div className="flex flex-wrap items-end gap-2">
        {items.map((d, i) => (
          <PixelAvatar key={i} d={d} scale={scale} />
        ))}
      </div>
    </section>
  );
}

function Grid({ title, rows, rowLabels, colLabels, testId }: { title: string; rows: AvatarDescriptor[][]; rowLabels: string[]; colLabels: string[]; testId?: string }) {
  return (
    <section className="mb-5" data-testid={testId}>
      <h2 className="mb-1 text-sm font-semibold">{title}</h2>
      <table>
        <thead>
          <tr>
            <th />
            {colLabels.map((c) => (
              <th key={c} className="px-1 text-xs font-normal">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <th className="pr-2 text-right text-xs font-normal">{rowLabels[i]}</th>
              {r.map((d, j) => (
                <td key={j} className="align-bottom">
                  <PixelAvatar d={d} scale={2} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

const Box = ({ children }: { children: ReactNode }) => <div className="mx-auto max-w-5xl bg-[#cfc8ba] p-4 text-[#1c1916]">{children}</div>;

export default function DevAvatars() {
  return (
    <Box>
      <h1 className="mb-3 text-xl font-bold">/dev/avatars — pixel art (32×64)</h1>
      <section className="mb-5" data-testid="pixel-first">
        <h2 className="mb-1 text-sm font-semibold">Primeiro personagem: 1× · 4× · 8×</h2>
        <div className="flex items-end gap-6">
          {[1, 4, 8].map((s) => (
            <PixelAvatar key={s} d={firstCharacter()} scale={s} animate={s === 8} />
          ))}
        </div>
      </section>
      <Grid title="5 fases × 5 tipos físicos (masculino)" rows={stagesByBuild('M')} rowLabels={STAGE_AGES.map((a) => `${a} anos`)} colLabels={[...BUILDS]} testId="grid-M" />
      <Grid title="5 fases × 5 tipos físicos (feminino)" rows={stagesByBuild('F')} rowLabels={STAGE_AGES.map((a) => `${a} anos`)} colLabels={[...BUILDS]} testId="grid-F" />
      <Row title="Rampa de pele (mesmo personagem)" items={skinRamp()} testId="skin" />
      <Grid title="Cabelos × 3 cores/tipos" rows={hairs()} rowLabels={HAIR_STYLES.map((h) => HAIR_STYLE_LABEL[h])} colLabels={['liso escuro', 'cacheado castanho', 'crespo claro']} testId="hairs" />
      <Row title="Barbas" items={beards()} testId="beards" />
      <Row title="Expressões e olhos (com sardas/pintas)" items={faces()} testId="faces" />
      <Row title="Roupas — corpo magro" items={outfits('magro')} scale={2} testId="outfits-thin" />
      <Row title="Roupas — corpo acima do peso" items={outfits('acima')} scale={2} testId="outfits-heavy" />
      <Row title="Kimono com faixa roxa, marcas da luta e rugas" items={marks()} testId="marks" />
      <Row title="24 NPCs aleatórios (engine)" items={npcs()} scale={2} testId="npcs" />
    </Box>
  );
}
