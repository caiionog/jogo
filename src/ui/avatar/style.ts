/**
 * Visual ativo dos personagens e ícones (release 0.0.3): preferência do jogador no meta
 * (`settings.avatarStyle`, padrão 'cartoon'). Componentes de avatar e de ícone leem por este hook.
 */
import { useGameStore } from '../store';
import type { AvatarStyle } from './renderer';

export function useAvatarStyle(): AvatarStyle {
  return useGameStore((s) => s.meta.settings.avatarStyle ?? 'cartoon');
}
