/**
 * Página de desenvolvimento /dev/avatars (só no `npm run dev`): grades da pixel art e, no modo "lado a lado"
 * (`?modo=lado-a-lado`), o mesmo descriptor no pixel art e no cartoon vetorial (release 0.0.3).
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import type { AvatarDescriptor } from '../../engine';
import { BUILDS, HAIR_STYLE_LABEL, HAIR_STYLES } from '../../engine';
import PixelAvatar from '../avatar/PixelAvatar';
import VectorAvatar from '../avatar/vector/VectorAvatar';
import { STAGE_AGES, abAdults, beards, faces, firstCharacter, hairs, marks, npcs, outfits, skinRamp, stagesByBuild } from './samples';

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

type Mode = 'pixel' | 'lado-a-lado';

function initialMode(): Mode {
  try {
    return new URLSearchParams(location.search).get('modo') === 'lado-a-lado' ? 'lado-a-lado' : 'pixel';
  } catch {
    return 'pixel';
  }
}

function ModeTabs({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  const tab = (m: Mode, label: string) => (
    <button
      type="button"
      data-testid={`mode-${m}`}
      aria-pressed={mode === m}
      onClick={() => {
        setMode(m);
        try {
          history.replaceState(null, '', m === 'pixel' ? location.pathname : `${location.pathname}?modo=${m}`);
        } catch {
          /* sem histórico */
        }
      }}
      className={`min-h-11 rounded-lg px-4 text-sm font-semibold ${mode === m ? 'bg-[#1c1916] text-[#f4efe4]' : 'bg-[#e8e2d6] text-[#1c1916]'}`}
    >
      {label}
    </button>
  );
  return (
    <div className="mb-4 flex gap-2">
      {tab('pixel', 'Pixel art')}
      {tab('lado-a-lado', 'Lado a lado (pixel × cartoon)')}
    </div>
  );
}

/** Mesmo descriptor nos dois visuais. */
function SideBySide() {
  const items = abAdults();
  const first = items[0]!;
  return (
    <>
      <h1 className="mb-1 text-xl font-bold">/dev/avatars — lado a lado: pixel art × cartoon</h1>
      <p className="mb-3 text-xs">Mesmo AvatarDescriptor da engine nos dois renderizadores. Fase 3: primeiro adulto cartoon.</p>
      <section className="mb-6 grid grid-cols-3 gap-3" data-testid="ab-grid">
        {items.map((s) => (
          <figure key={s.label} className="rounded-xl bg-[#e8e2d6] p-3" data-testid="ab-card">
            <div className="flex items-end justify-center gap-4">
              <PixelAvatar d={s.d} scale={4} label={`${s.label} (pixel)`} />
              <VectorAvatar d={s.d} size={256} label={`${s.label} (cartoon)`} />
            </div>
            <figcaption className="mt-2 text-center text-xs">{s.label}</figcaption>
          </figure>
        ))}
      </section>
      <section className="rounded-xl bg-[#e8e2d6] p-4" data-testid="ab-close">
        <h2 className="mb-2 text-sm font-semibold">Close: {first.label}</h2>
        <div className="flex items-end justify-center gap-8">
          <PixelAvatar d={first.d} scale={8} label="pixel" />
          <VectorAvatar d={first.d} size={512} label="cartoon" />
          <div className="flex flex-col items-center gap-3">
            <PixelAvatar d={first.d} scale={5} bust label="busto pixel" />
            <VectorAvatar d={first.d} size={140} bust label="busto cartoon" />
          </div>
        </div>
      </section>
    </>
  );
}

export default function DevAvatars() {
  const [mode, setMode] = useState<Mode>(initialMode);
  if (mode === 'lado-a-lado')
    return (
      <Box>
        <ModeTabs mode={mode} setMode={setMode} />
        <SideBySide />
      </Box>
    );
  return (
    <Box>
      <ModeTabs mode={mode} setMode={setMode} />
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
