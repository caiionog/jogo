/** Pequenos componentes visuais compartilhados pelas telas de luta. */
import type { FightStyle } from '../../engine';

export const STYLE_LABEL: Record<FightStyle, string> = {
  striker: 'Trocador',
  grappler: 'Especialista em chão',
  allround: 'Completo',
};

export function Bar({ value, color = 'bg-emerald-500', className = 'h-1.5' }: { value: number; color?: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-full bg-[var(--ds-surface-2)] ${className}`}>
      <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}


export const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
