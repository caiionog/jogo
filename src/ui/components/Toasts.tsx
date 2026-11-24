/** Toasts: conquista desbloqueada e nova versão do app disponível (Etapa 6). */
import { useEffect, useState } from 'react';
import { useGameStore } from '../store';
import { applyUpdate, onNeedRefresh } from '../pwa';

export default function Toasts() {
  const toasts = useGameStore((s) => s.toasts);
  const dismiss = useGameStore((s) => s.dismissToast);
  // durante a transição de cena íntima os toasts esperam (aparecem quando a tela volta)
  const hold = useGameStore((s) => !!s.intimacy);
  const [update, setUpdate] = useState(false);
  useEffect(() => onNeedRefresh(() => setUpdate(true)), []);
  // conquistas somem sozinhas depois de alguns segundos
  useEffect(() => {
    if (!toasts.length || hold) return;
    const t = setTimeout(() => dismiss(toasts[0]!.id), 4500);
    return () => clearTimeout(t);
  }, [toasts, dismiss, hold]);
  if ((!toasts.length || hold) && !update) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(0.5rem,env(safe-area-inset-top))] z-50 mx-auto flex w-full max-w-md flex-col gap-2 px-4" aria-live="polite">
      {update && (
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-sky-600 bg-slate-900 p-3 shadow-lg" data-testid="update-toast">
          <span className="text-2xl" aria-hidden>
            ✨
          </span>
          <p className="flex-1 text-sm">Nova versão disponível.</p>
          <button onClick={applyUpdate} className="min-h-11 rounded-xl bg-sky-500 px-3 text-sm font-bold text-slate-950">
            Atualizar
          </button>
        </div>
      )}
      {!hold && toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-amber-500/50 bg-slate-900 p-3 text-left shadow-lg"
          data-testid="achievement-toast"
        >
          <span className="text-2xl" aria-hidden>
            {t.icon}
          </span>
          <span className="flex-1">
            <span className="block text-[11px] uppercase tracking-wide text-amber-300">{t.title}</span>
            <span className="block text-sm font-semibold">{t.text}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
