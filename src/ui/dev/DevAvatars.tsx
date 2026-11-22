/** Página de desenvolvimento /dev/avatars (só no `npm run dev`): grade de fases × gordura × genes/roupas. */
import { useMemo, useState } from 'react';
import { GAME_CONTENT } from '../../content';
import type { AvatarDescriptor, Race } from '../../engine';
import { RACE_LABEL, createRng, genesForRace, previewAvatar } from '../../engine';
import AvatarStage from '../avatar/AvatarStage';
import AvatarThumb from '../avatar/AvatarThumb';

const AGES = [1, 7, 15, 32, 74];
const FATS = [0.08, 0.45, 0.88];
const COMBOS: { race: Race; sex: 'M' | 'F'; seed: number; outfit: string; facialHair?: 'barba' | 'bigode' | 'cavanhaque'; hair?: AvatarDescriptor['hair']['type'] }[] = [
  { race: 'parda', sex: 'M', seed: 3, outfit: 'camiseta', facialHair: 'barba', hair: 'cacheado' },
  { race: 'preta', sex: 'F', seed: 8, outfit: 'vestido', hair: 'crespo' },
  { race: 'branca', sex: 'M', seed: 5, outfit: 'kimono', hair: 'liso' },
  { race: 'amarela', sex: 'F', seed: 11, outfit: 'jaqueta', hair: 'liso' },
  { race: 'indigena', sex: 'M', seed: 2, outfit: 'rashguard', facialHair: 'bigode', hair: 'liso' },
  { race: 'parda', sex: 'F', seed: 21, outfit: 'terno', hair: 'ondulado' },
];

function descriptor(c: (typeof COMBOS)[number], age: number, fat: number): AvatarDescriptor {
  const genes = { ...genesForRace(createRng(c.seed), c.race), ...(c.hair ? { hairType: c.hair } : {}) };
  const d = previewAvatar({ genes, race: c.race, facialHair: c.facialHair ?? 'nenhuma' }, c.sex, age, GAME_CONTENT, { outfitId: c.outfit });
  const withBelt = d.outfit.mesh === 'kimono' ? { ...d.outfit, beltColor: ['#f1f1ee', '#2f5fb3', '#6b3fa0', '#6b4226', '#1b1b1b'][Math.min(4, Math.floor(age / 15))]! } : d.outfit;
  return { ...d, fat, outfit: withBelt, marks: { ...d.marks, cauliflowerEar: c.outfit === 'kimono' && age > 20, brokenNose: c.outfit === 'rashguard' && age > 20 } };
}

export default function DevAvatars() {
  const [sel, setSel] = useState<AvatarDescriptor | null>(null);
  const grid = useMemo(() => COMBOS.map((c) => AGES.map((a) => FATS.map((f) => descriptor(c, a, f)))), []);
  return (
    <div className="mx-auto max-w-5xl p-4 text-slate-100">
      <h1 className="mb-1 text-xl font-bold">/dev/avatars</h1>
      <p className="mb-4 text-sm text-slate-400">5 fases × 3 níveis de gordura × 6 combinações de genes/roupas. Toque para ver ao vivo.</p>
      {sel && (
        <div className="mb-4 flex items-center gap-4 rounded-xl bg-slate-900 p-3">
          <AvatarStage d={sel} orbit className="h-72 w-72" label="Busto ao vivo" />
          <pre className="max-h-72 flex-1 overflow-auto text-[10px] text-slate-400">{JSON.stringify(sel, null, 1)}</pre>
        </div>
      )}
      <section className="mb-4" data-testid="dev-muscle">
        <h2 className="mb-1 text-sm text-slate-300">Treino: musculatura 0,1 → 0,9 (mesmos genes, 28 anos, regata)</h2>
        <div className="flex gap-1 rounded-lg bg-slate-900 p-1">
          {[0.1, 0.35, 0.6, 0.9].map((m) => {
            const d0 = descriptor({ race: 'parda', sex: 'M', seed: 4, outfit: 'regata', hair: 'ondulado' }, 28, 0.25);
            const d = { ...d0, muscle: m, fat: 0.35 - m * 0.25 };
            return (
              <button key={m} type="button" onClick={() => setSel(d)}>
                <AvatarThumb d={d} size={96} />
              </button>
            );
          })}
        </div>
      </section>
      {grid.map((rows, i) => (
        <section key={i} className="mb-4">
          <h2 className="mb-1 text-sm text-slate-300">
            {RACE_LABEL[COMBOS[i]!.race]} · {COMBOS[i]!.sex} · {COMBOS[i]!.outfit} · {COMBOS[i]!.hair}
          </h2>
          <div className="flex flex-wrap gap-2">
            {rows.map((fats, j) => (
              <div key={j} className="flex gap-1 rounded-lg bg-slate-900 p-1" data-testid="dev-cell">
                {fats.map((d, k) => (
                  <button key={k} type="button" onClick={() => setSel(d)} title={`${AGES[j]} anos, gordura ${FATS[k]}`}>
                    <AvatarThumb d={d} size={64} />
                  </button>
                ))}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
