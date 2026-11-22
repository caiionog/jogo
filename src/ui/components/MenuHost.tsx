/** Botão ☰ + as telas que o menu abre (conquistas, Hall da Fama, configurações). */
import { useState } from 'react';
import { useGameStore } from '../store';
import MenuSheet from './MenuSheet';
import type { MenuTarget } from './MenuSheet';
import { AchievementsScreen, HallOfFameScreen } from './MetaScreens';
import SettingsSheet from './SettingsSheet';

export default function MenuHost({ className = '', label = '☰' }: { className?: string; label?: string }) {
  const game = useGameStore((s) => s.game);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<MenuTarget | null>(null);
  return (
    <>
      <button onClick={() => setOpen(true)} className={className} aria-label="Menu" data-testid="menu-button">
        {label}
      </button>
      {open && (
        <MenuSheet
          onClose={() => setOpen(false)}
          open={(t) => {
            setOpen(false);
            setTarget(t);
          }}
        />
      )}
      {target === 'achievements' && <AchievementsScreen onClose={() => setTarget(null)} />}
      {target === 'hall' && <HallOfFameScreen onClose={() => setTarget(null)} />}
      {target === 'settings' && <SettingsSheet game={game} onClose={() => setTarget(null)} />}
    </>
  );
}
