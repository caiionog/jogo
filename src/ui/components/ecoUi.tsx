/** Componentes visuais compartilhados pelas abas de economia (Finanças, Trabalho, Bens, Empresas). */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { money } from './fightUi';

export { money };

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-surface)] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--ds-text-muted)]">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Row({ label, value, tone }: { label: ReactNode; value: ReactNode; tone?: 'pos' | 'neg' | 'muted' }) {
  const color = tone === 'pos' ? 'text-emerald-400' : tone === 'neg' ? 'text-rose-400' : tone === 'muted' ? 'text-[var(--ds-text-muted)]' : 'text-[var(--ds-text)]';
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5 text-sm">
      <span className="text-[var(--ds-text-muted)]">{label}</span>
      <span className={`tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

export function Btn({
  children,
  onClick,
  disabled,
  tone = 'default',
  className = '',
  testId,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'primary' | 'danger';
  className?: string;
  testId?: string;
}) {
  const t =
    tone === 'primary'
      ? 'border-emerald-600 bg-emerald-500/15 text-emerald-200'
      : tone === 'danger'
        ? 'border-rose-700 bg-rose-500/10 text-rose-200'
        : 'border-[var(--ds-border)] bg-[var(--ds-surface)] text-[var(--ds-text)]';
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
      className={`min-h-11 rounded-xl border px-3 py-2 text-sm active:scale-[0.98] disabled:opacity-40 ${t} ${className}`}
    >
      {children}
    </button>
  );
}

export const signed = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${money.format(Math.abs(v))}`;

/** Campo de valor com atalhos (a UI só monta o número; a engine valida). */
export function AmountInput({ value, onChange, presets }: { value: number; onChange: (v: number) => void; presets: { label: string; value: number }[] }) {
  return (
    <div className="flex flex-col gap-2">
      <input
        inputMode="numeric"
        aria-label="Valor"
        value={value ? value.toLocaleString('pt-BR') : ''}
        placeholder="R$ 0"
        onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)}
        className="min-h-11 w-full rounded-xl border border-[var(--ds-border)] bg-[var(--ds-bg)] px-3 text-base tabular-nums"
      />
      <div className="flex flex-wrap gap-1.5">
        {presets
          .filter((p) => p.value > 0)
          .map((p) => (
            <button key={p.label} onClick={() => onChange(p.value)} className="rounded-full border border-[var(--ds-border)] px-3 py-1 text-xs text-[var(--ds-text)]">
              {p.label}
            </button>
          ))}
      </div>
    </div>
  );
}

export interface ConfirmDetails {
  title: string;
  lines: { label: string; value: string; strong?: boolean }[];
  note?: string;
  confirmLabel: string;
  onConfirm: () => void;
}

/** Modal de confirmação para compras grandes, financiamentos e empréstimos (mostra o custo total com juros). */
export function ConfirmModal({ details, onClose }: { details: ConfirmDetails; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center" role="dialog" aria-modal="true" data-testid="confirm-modal">
      <div className="w-full max-w-md rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-surface)] p-5">
        <p className="text-lg font-semibold">{details.title}</p>
        <div className="mt-3 divide-y divide-slate-800">
          {details.lines.map((l) => (
            <div key={l.label} className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
              <span className="text-[var(--ds-text-muted)]">{l.label}</span>
              <span className={`tabular-nums ${l.strong ? 'text-base font-bold text-amber-300' : ''}`}>{l.value}</span>
            </div>
          ))}
        </div>
        {details.note && <p className="mt-2 text-xs text-[var(--ds-text-muted)]">{details.note}</p>}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={onClose} className="min-h-11 rounded-xl border border-[var(--ds-border)] py-3">
            Cancelar
          </button>
          <button
            data-testid="confirm-ok"
            onClick={() => {
              details.onConfirm();
              onClose();
            }}
            className="min-h-11 rounded-xl bg-emerald-500 py-3 font-bold text-[var(--ds-accent-ink)]"
          >
            {details.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Hook simples para abrir o modal de confirmação a partir de qualquer painel. */
export function useConfirm(): [ReactNode, (d: ConfirmDetails) => void] {
  const [details, setDetails] = useState<ConfirmDetails | null>(null);
  const modal = details ? <ConfirmModal details={details} onClose={() => setDetails(null)} /> : null;
  return [modal, setDetails];
}
