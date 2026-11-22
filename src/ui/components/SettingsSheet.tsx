import type { GameState, PartnerPreference } from '../../engine';
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

/** Configurações da vida: conteúdo adulto e interesse amoroso. */
export default function SettingsSheet({ game, onClose }: { game: GameState; onClose: () => void }) {
  const setSettings = useGameStore((s) => s.setSettings);
  const st = game.relationships.settings;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60" role="dialog" aria-modal="true" aria-label="Configurações" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl border-t border-slate-700 bg-slate-900 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3" onClick={(e) => e.stopPropagation()} data-testid="settings-sheet">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-700" />
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Configurações</h2>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-slate-400" aria-label="Fechar">
            ✕
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-4">
          <AdultToggle id="adult-setting" value={st.adultContent} onChange={(v) => setSettings({ adultContent: v })} />
          <div>
            <p className="mb-2 text-sm font-semibold">Interesse amoroso</p>
            <PreferencePicker value={st.preference} onChange={(p) => setSettings({ preference: p })} />
          </div>
        </div>
      </div>
    </div>
  );
}
