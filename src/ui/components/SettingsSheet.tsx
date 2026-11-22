import { useState } from 'react';
import type { GameState, MetaSettings, PartnerPreference } from '../../engine';
import Sheet from './Sheet';
import { useGameStore } from '../store';

export const PREFERENCE_LABEL: Record<PartnerPreference, string> = { M: 'Homens', F: 'Mulheres', any: 'Ambos' };

export function PreferencePicker({ value, onChange }: { value: PartnerPreference; onChange: (p: PartnerPreference) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Interesse amoroso">
      {(['F', 'M', 'any'] as PartnerPreference[]).map((p) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={value === p}
          onClick={() => onChange(p)}
          className={`rounded-xl border px-2 py-2 text-sm ${value === p ? 'border-pink-500 bg-pink-500/15 text-pink-200' : 'border-slate-700 bg-slate-900'}`}
        >
          {PREFERENCE_LABEL[p]}
        </button>
      ))}
    </div>
  );
}

export function AdultToggle({ value, onChange, id }: { value: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-900 p-3">
      <input id={id} type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-5 w-5 accent-pink-500" />
      <span>
        <span className="block text-sm font-semibold">Conteúdo adulto (18+)</span>
        <span className="block text-xs text-slate-400">
          Libera eventos e ações sugestivos entre personagens adultos (sempre com 18 anos ou mais), no estilo do BitLife. Nada gráfico.
        </span>
      </span>
    </label>
  );
}

/** Configurações: da vida (conteúdo adulto, interesse amoroso) e do app (narração, fonte, apagar dados). */
export default function SettingsSheet({ game, onClose }: { game: GameState | null; onClose: () => void }) {
  const setSettings = useGameStore((s) => s.setSettings);
  const meta = useGameStore((s) => s.meta);
  const setMeta = useGameStore((s) => s.setMetaSettings);
  const eraseAll = useGameStore((s) => s.eraseAll);
  const [erasing, setErasing] = useState(false);
  const st = game?.relationships.settings;
  const speeds: [MetaSettings['fightSpeed'], string][] = [
    ['lenta', 'Lenta'],
    ['normal', 'Normal'],
    ['rapida', 'Rápida'],
  ];
  return (
    <Sheet title="Configurações" onClose={onClose} testId="settings-sheet">
      <div className="flex flex-col gap-4">
        {st && (
          <>
            <AdultToggle id="adult-setting" value={st.adultContent} onChange={(v) => setSettings({ adultContent: v })} />
            <div>
              <p className="mb-2 text-sm font-semibold">Interesse amoroso</p>
              <PreferencePicker value={st.preference} onChange={(p) => setSettings({ preference: p })} />
            </div>
          </>
        )}
        <div>
          <p className="mb-2 text-sm font-semibold">Velocidade da narração das lutas</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Velocidade da narração">
            {speeds.map(([v, label]) => (
              <button key={v} type="button" role="radio" aria-checked={meta.settings.fightSpeed === v} onClick={() => setMeta({ fightSpeed: v })} className={`min-h-11 rounded-xl border px-2 text-sm ${meta.settings.fightSpeed === v ? 'border-emerald-500 bg-emerald-500/15 text-emerald-200' : 'border-slate-700 bg-slate-950'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Tamanho do texto</p>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tamanho do texto">
            {(['normal', 'grande'] as const).map((v) => (
              <button key={v} type="button" role="radio" aria-checked={meta.settings.fontScale === v} onClick={() => setMeta({ fontScale: v })} className={`min-h-11 rounded-xl border px-2 text-sm ${meta.settings.fontScale === v ? 'border-emerald-500 bg-emerald-500/15 text-emerald-200' : 'border-slate-700 bg-slate-950'}`}>
                {v === 'normal' ? 'Normal' : 'Grande'}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-rose-900 p-3">
          <p className="text-sm font-semibold text-rose-200">Apagar dados</p>
          <p className="text-xs text-slate-400">Apaga as 3 vidas salvas, as conquistas e o Hall da Fama deste aparelho. Não dá para desfazer.</p>
          {!erasing ? (
            <button onClick={() => setErasing(true)} className="mt-2 min-h-11 w-full rounded-xl border border-rose-700 text-sm text-rose-200">
              Apagar tudo…
            </button>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button onClick={() => setErasing(false)} className="min-h-11 rounded-xl border border-slate-600 text-sm">
                Cancelar
              </button>
              <button
                data-testid="erase-confirm"
                onClick={() => {
                  void eraseAll();
                  onClose();
                }}
                className="min-h-11 rounded-xl bg-rose-500 text-sm font-bold text-slate-950"
              >
                Apagar tudo
              </button>
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}
