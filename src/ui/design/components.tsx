/**
 * Componentes do sistema de design (Etapa 8). Usam os tokens de `tokens.css` (--ds-*); ícones do lucide-react.
 * Áreas de toque ≥ 44 px; animações curtas desligadas com prefers-reduced-motion.
 */
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// ---------------------------------------------------------------------------
// ListItem: ícone, título, subtítulo curto, valor à direita e seta
// ---------------------------------------------------------------------------
export function ListItem({
  icon: Icon,
  emoji,
  title,
  subtitle,
  right,
  onClick,
  disabled,
  reason,
  chevron = true,
  testId,
  tone,
  leading,
}: {
  icon?: LucideIcon;
  emoji?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** Motivo exibido quando desabilitado ("Disponível a partir dos 14 anos"). */
  reason?: string;
  chevron?: boolean;
  testId?: string;
  tone?: 'accent' | 'danger';
  leading?: ReactNode;
}) {
  const content = (
    <>
      {leading ?? (Icon || emoji) ? (
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone === 'danger' ? 'bg-[color-mix(in_srgb,var(--ds-danger)_15%,transparent)] text-[var(--ds-danger)]' : 'bg-[var(--ds-surface-2)] text-[var(--ds-accent)]'}`}>
          {leading ?? (Icon ? <Icon size={20} aria-hidden /> : <span className="text-xl" aria-hidden>{emoji}</span>)}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[15px] font-semibold ${tone === 'danger' ? 'text-[var(--ds-danger)]' : ''}`}>{title}</span>
        {(disabled && reason) || subtitle ? <span className="block text-xs text-[var(--ds-text-muted)]">{disabled && reason ? reason : subtitle}</span> : null}
      </span>
      {right && <span className="shrink-0 text-right text-sm text-[var(--ds-text-muted)]">{right}</span>}
      {onClick && chevron && <ChevronRight size={18} className="shrink-0 text-[var(--ds-text-muted)]" aria-hidden />}
    </>
  );
  const cls = 'flex min-h-14 w-full items-center gap-3 rounded-[var(--ds-radius)] bg-[var(--ds-surface)] px-3 py-2 text-left';
  if (!onClick) return <div className={cls} data-testid={testId}>{content}</div>;
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-disabled={disabled} className={`${cls} active:scale-[0.99] disabled:opacity-50`} data-testid={testId}>
      {content}
    </button>
  );
}

export function ListGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      {title && <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-[var(--ds-text-muted)]">{title}</h3>}
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// MenuScreen: tela cheia com "Voltar" e título (um nível da pilha)
// ---------------------------------------------------------------------------
export function MenuScreen({ title, onBack, children, testId, actions }: { title: string; onBack: () => void; children: ReactNode; testId?: string; actions?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
  }, []);
  return (
    <div ref={ref} className="ds-anim-slide fixed inset-0 z-30 mx-auto flex w-full max-w-md flex-col bg-[var(--ds-bg)]" role="dialog" aria-modal="true" aria-label={title} data-testid={testId}>
      <header className="flex min-h-14 items-center gap-1 border-b border-[var(--ds-border)] px-2 pt-[env(safe-area-inset-top,0px)]">
        <button type="button" onClick={onBack} className="flex h-11 min-w-11 items-center gap-1 rounded-lg px-2 text-[var(--ds-accent)]" aria-label="Voltar" data-autofocus>
          <ChevronLeft size={22} aria-hidden />
          <span className="text-sm">Voltar</span>
        </button>
        <h2 className="ds-pixel-title min-w-0 flex-1 truncate text-center text-lg">{title}</h2>
        <span className="flex min-w-[76px] justify-end">{actions}</span>
      </header>
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
        <div className="flex flex-col gap-3">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BottomSheet: folha que sobe de baixo (portal no body)
// ---------------------------------------------------------------------------
export function BottomSheet({ title, onClose, children, testId }: { title: string; onClose: () => void; children: ReactNode; testId?: string }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="ds-anim-rise flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-[var(--ds-radius-lg)] border-t border-[var(--ds-border)] bg-[var(--ds-surface)] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3" data-testid={testId}>
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-[var(--ds-border)]" />
        <h2 className="ds-pixel-title mb-2 text-lg">{title}</h2>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// StatBar: barra de atributo com cor e porcentagem (anima quando muda)
// ---------------------------------------------------------------------------
export function StatBar({ label, value, color, icon, compact = false }: { label: string; value: number; color: string; icon?: ReactNode; compact?: boolean }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const prev = useRef(v);
  const [bump, setBump] = useState(false);
  useEffect(() => {
    if (prev.current !== v) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 320);
      prev.current = v;
      return () => clearTimeout(t);
    }
  }, [v]);
  return (
    <div className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'}`} role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={v}>
      <span className="flex w-[8.5rem] shrink-0 items-center gap-1.5 truncate">
        {icon}
        {label}
      </span>
      <span className="h-3 flex-1 overflow-hidden rounded-full bg-[var(--ds-surface-2)]">
        <span className="ds-bar-fill block h-full rounded-full" style={{ width: `${v}%`, background: color }} />
      </span>
      <span className={`w-10 shrink-0 text-right tabular-nums ${bump ? 'ds-anim-bump' : ''}`}>{v}%</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BottomNav + AgeButton
// ---------------------------------------------------------------------------
export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  badge?: boolean;
  active?: boolean;
}

export function AgeButton({ onClick, disabled, label = 'Idade' }: { onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Avançar ano"
      data-testid="age-button"
      className="-mt-6 flex h-[72px] w-[72px] shrink-0 flex-col items-center justify-center rounded-full border-4 border-[var(--ds-bg)] bg-[var(--ds-age)] font-bold text-[var(--ds-age-ink)] shadow-lg active:scale-95 disabled:opacity-50"
    >
      <Plus size={26} strokeWidth={3} aria-hidden />
      <span className="ds-pixel-title -mt-0.5 text-xs">{label}</span>
    </button>
  );
}

export function BottomNav({ left, right, center }: { left: NavItem[]; right: NavItem[]; center: ReactNode }) {
  const btn = (it: NavItem) => (
    <button
      key={it.id}
      type="button"
      onClick={it.onClick}
      aria-pressed={it.active}
      data-testid={`nav-${it.id}`}
      className={`relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] ${it.active ? 'text-[var(--ds-accent)]' : 'text-[var(--ds-text-muted)]'}`}
    >
      <it.icon size={22} aria-hidden />
      <span className="truncate">{it.label}</span>
      {it.badge && <span className="absolute right-3 top-2 h-2 w-2 rounded-full bg-[var(--ds-danger)]" aria-label="novidade" />}
    </button>
  );
  return (
    <nav className="flex items-end gap-1 border-t border-[var(--ds-border)] bg-[var(--ds-surface)] px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1" aria-label="Menus">
      {left.map(btn)}
      {center}
      {right.map(btn)}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Botão padrão
// ---------------------------------------------------------------------------
export function DsButton({ children, onClick, disabled, tone = 'default', className = '', testId, full }: { children: ReactNode; onClick: () => void; disabled?: boolean; tone?: 'default' | 'primary' | 'danger'; className?: string; testId?: string; full?: boolean }) {
  const t =
    tone === 'primary'
      ? 'bg-[var(--ds-accent)] text-[var(--ds-accent-ink)] font-bold'
      : tone === 'danger'
        ? 'border border-[var(--ds-danger)] text-[var(--ds-danger)]'
        : 'border border-[var(--ds-border)] bg-[var(--ds-surface)]';
  return (
    <button type="button" onClick={onClick} disabled={disabled} data-testid={testId} className={`min-h-11 rounded-[var(--ds-radius)] px-4 py-2 text-sm active:scale-[0.98] disabled:opacity-40 ${full ? 'w-full' : ''} ${t} ${className}`}>
      {children}
    </button>
  );
}
