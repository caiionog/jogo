/** Menu ☰ (Etapa 6): conquistas, Hall da Fama, vidas salvas (3 slots), backup do save, instalar app, configurações. */
import { useEffect, useRef, useState } from 'react';
import { GAME_CONTENT } from '../../content';
import { useGameStore } from '../store';
import { canInstall, isIos, isStandalone, onInstallChange, promptInstall } from '../pwa';
import Sheet from './Sheet';

export type MenuTarget = 'achievements' | 'hall' | 'settings';

export default function MenuSheet({ onClose, open }: { onClose: () => void; open: (t: MenuTarget) => void }) {
  const meta = useGameStore((s) => s.meta);
  const slots = useGameStore((s) => s.slots);
  const slot = useGameStore((s) => s.slot);
  const game = useGameStore((s) => s.game);
  const switchSlot = useGameStore((s) => s.switchSlot);
  const deleteSlot = useGameStore((s) => s.deleteSlot);
  const exportCurrent = useGameStore((s) => s.exportCurrent);
  const importFile = useGameStore((s) => s.importFile);
  const refreshSlots = useGameStore((s) => s.refreshSlots);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmDel, setConfirmDel] = useState<number | null>(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const newLife = useGameStore((s) => s.newLife);
  const [installable, setInstallable] = useState(canInstall());
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => onInstallChange(() => setInstallable(canInstall())), []);
  useEffect(() => {
    void refreshSlots();
  }, [refreshSlots, game?.alive]);
  const done = GAME_CONTENT.achievements.filter((a) => meta.achievements[a.id]).length;

  const doExport = () => {
    const file = exportCurrent();
    if (!file) return;
    const url = URL.createObjectURL(new Blob([file.text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMsg({ ok: true, text: `Save exportado: ${file.name}` });
  };
  const doImport = async (f: File | undefined) => {
    if (!f) return;
    const r = await importFile(await f.text());
    setMsg(r.ok ? { ok: true, text: `Save importado no slot ${slot}.` } : { ok: false, text: r.error ?? 'Não foi possível importar.' });
    if (fileRef.current) fileRef.current.value = '';
  };

  const item = 'flex min-h-12 w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-left text-sm';
  return (
    <Sheet title="Menu" onClose={onClose} testId="menu-sheet">
      <div className="flex flex-col gap-2">
        <button className={item} onClick={() => open('achievements')} data-testid="menu-achievements">
          <span className="text-xl" aria-hidden>🏅</span>
          <span className="flex-1">Conquistas</span>
          <span className="text-xs text-slate-400">
            {done}/{GAME_CONTENT.achievements.length}
          </span>
        </button>
        <button className={item} onClick={() => open('hall')} data-testid="menu-hall">
          <span className="text-xl" aria-hidden>🏛️</span>
          <span className="flex-1">Hall da Fama</span>
          <span className="text-xs text-slate-400">{meta.hallOfFame.length}</span>
        </button>
        <button className={item} onClick={() => open('settings')} data-testid="menu-settings">
          <span className="text-xl" aria-hidden>⚙️</span>
          <span className="flex-1">Configurações</span>
        </button>

        {game && (
          <button className={item} onClick={() => setConfirmNew(true)} data-testid="menu-new-life">
            <span className="text-xl" aria-hidden>🔁</span>
            <span className="flex-1">Nova vida</span>
          </button>
        )}
        {confirmNew && game && (
          <div className="rounded-xl border border-rose-800 p-3 text-sm" role="alertdialog" aria-label="Começar uma nova vida?">
            <p className="font-semibold">Começar uma nova vida?</p>
            <p className="text-xs text-slate-400">{game.alive ? `A vida de ${game.character.name} neste slot será perdida.` : 'A vida atual já terminou.'}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button className="min-h-11 rounded-xl border border-slate-700" onClick={() => setConfirmNew(false)}>Cancelar</button>
              <button className="min-h-11 rounded-xl bg-rose-600 font-semibold text-white" data-testid="menu-new-life-yes" onClick={() => { setConfirmNew(false); onClose(); void newLife(); }}>Nova vida</button>
            </div>
          </div>
        )}
        <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Vidas salvas</h3>
        <ul className="flex flex-col gap-2" data-testid="slots">
          {slots.map((s) => (
            <li key={s.slot} className={`rounded-xl border p-3 ${s.slot === slot ? 'border-emerald-600 bg-emerald-500/10' : 'border-slate-800 bg-slate-950'}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    Slot {s.slot}
                    {s.slot === slot ? ' · atual' : ''}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {s.empty ? 'Vazio' : s.broken ? 'Save ilegível' : `${s.name}, ${s.age} anos · ${s.generation}ª geração${s.alive ? '' : ' · falecido(a)'}`}
                  </p>
                </div>
                {s.slot !== slot && (
                  <button data-testid={`slot-open-${s.slot}`} onClick={() => void switchSlot(s.slot).then(onClose)} className="min-h-11 shrink-0 rounded-xl border border-slate-600 px-3 text-sm">
                    {s.empty ? 'Nova vida' : 'Jogar'}
                  </button>
                )}
              </div>
              {!s.empty && (
                <div className="mt-2">
                  {confirmDel === s.slot ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setConfirmDel(null)} className="min-h-11 rounded-lg border border-slate-600 text-xs">
                        Cancelar
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDel(null);
                          void deleteSlot(s.slot);
                        }}
                        className="min-h-11 rounded-lg bg-rose-500 text-xs font-bold text-slate-950"
                      >
                        Apagar slot {s.slot}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDel(s.slot)} className="min-h-11 text-xs text-slate-400 underline">
                      Apagar este slot
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>

        <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Backup do save</h3>
        <div className="grid grid-cols-2 gap-2">
          <button className="min-h-11 rounded-xl border border-slate-700 bg-slate-950 text-sm disabled:opacity-40" disabled={!game} onClick={doExport} data-testid="export-save">
            ⬇️ Exportar
          </button>
          <button className="min-h-11 rounded-xl border border-slate-700 bg-slate-950 text-sm" onClick={() => fileRef.current?.click()} data-testid="import-save">
            ⬆️ Importar
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" data-testid="import-input" onChange={(e) => void doImport(e.target.files?.[0])} />
        <p className="text-[11px] text-slate-400">O arquivo .json leva a vida do slot atual para outro aparelho. Importar substitui o slot atual.</p>
        {msg && (
          <p role="status" className={`rounded-lg px-3 py-2 text-xs ${msg.ok ? 'bg-emerald-500/10 text-emerald-200' : 'bg-rose-500/10 text-rose-200'}`} data-testid="transfer-msg">
            {msg.text}
          </p>
        )}

        {!isStandalone() && (
          <>
            <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Instalar no celular</h3>
            {installable ? (
              <button data-testid="install-app" onClick={() => void promptInstall()} className="min-h-11 rounded-xl bg-emerald-500 text-sm font-bold text-slate-950">
                📲 Instalar app
              </button>
            ) : (
              <p className="text-xs text-slate-400" data-testid="install-hint">
                {isIos() ? 'No iPhone: toque em Compartilhar (⬆️) e depois em "Adicionar à Tela de Início".' : 'No Android/Chrome: menu ⋮ → "Instalar app" (ou "Adicionar à tela inicial"). Depois de instalado, o jogo funciona offline.'}
              </p>
            )}
          </>
        )}
      </div>
    </Sheet>
  );
}
