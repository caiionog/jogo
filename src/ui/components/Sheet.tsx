/** Painel em tela cheia/folha inferior acessível: Esc fecha, foco preso dentro, foco volta ao sair. */
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

export default function Sheet({ title, onClose, children, testId, full = false }: { title: string; onClose: () => void; children: ReactNode; testId?: string; full?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('button, [href], input, select, [tabindex]:not([tabindex="-1"])')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab' || !ref.current) return;
      const items = [...ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, select, [tabindex]:not([tabindex="-1"])')];
      if (!items.length) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [onClose]);
  // portal no <body>: o cabeçalho usa backdrop-filter, que prenderia o `position: fixed` dentro dele
  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div
        ref={ref}
        data-testid={testId}
        onClick={(e) => e.stopPropagation()}
        className={`flex w-full max-w-md flex-col border-t border-[var(--ds-border)] bg-[var(--ds-surface)] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 ${full ? 'h-[100dvh] pt-[max(0.75rem,env(safe-area-inset-top))]' : 'max-h-[88dvh] rounded-t-3xl'}`}
      >
        {!full && <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[var(--ds-surface-2)]" />}
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="h-11 w-11 rounded-lg text-[var(--ds-text)]" aria-label="Fechar">
            ✕
          </button>
        </div>
        <div className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
