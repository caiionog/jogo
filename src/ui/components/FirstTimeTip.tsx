/** Explicação curta que aparece na primeira vez que o conceito surge e some depois do "Entendi" (meta). */
import { Info } from 'lucide-react';
import { useGameStore } from '../store';
import { TIPS } from '../text/tips';
import type { TipId } from '../text/tips';

export default function FirstTimeTip({ id }: { id: TipId }) {
  const seen = useGameStore((s) => s.meta.seenTips.includes(id));
  const dismiss = useGameStore((s) => s.dismissTip);
  if (seen) return null;
  return (
    <div role="note" className="flex items-start gap-2 rounded-[var(--ds-radius)] border border-[var(--ds-accent)] bg-[var(--ds-surface)] p-3 text-sm" data-testid={`tip-${id}`}>
      <Info size={18} aria-hidden className="mt-0.5 shrink-0 text-[var(--ds-accent)]" />
      <p className="flex-1">{TIPS[id]}</p>
      <button type="button" onClick={() => dismiss(id)} className="min-h-11 shrink-0 rounded-lg px-3 font-semibold text-[var(--ds-accent)]" data-testid={`tip-ok-${id}`}>
        Entendi
      </button>
    </div>
  );
}
