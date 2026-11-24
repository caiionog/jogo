// @vitest-environment jsdom
/** Visual dos personagens (release 0.0.3): a preferência troca o renderizador e persiste no meta. */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import { emptyMeta, newGame } from '../src/engine';

HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];
const saved: unknown[] = [];
vi.mock('../src/save', () => ({
  clearGame: async () => {},
  clearSlot: async () => {},
  getActiveSlot: async () => 1,
  listSlots: async () => [],
  loadGame: async () => null,
  loadMeta: async () => null,
  saveGame: async () => {},
  saveMeta: async (m: unknown) => {
    saved.push(m);
  },
  saveSlot: async () => {},
  setActiveSlot: async () => {},
  SLOT_COUNT: 3,
  exportSave: () => '',
  importSave: () => null,
}));

const { useGameStore } = await import('../src/ui/store');
const { useNav } = await import('../src/ui/nav');
const Life = (await import('../src/ui/screens/Life')).default;

function start(style: 'pixel' | 'cartoon') {
  const g = newGame({ seed: 'style', name: 'Teste', sex: 'F', birthYear: 2000, uf: 'SP', city: 'São Paulo' }, GAME_CONTENT);
  const meta = emptyMeta();
  useGameStore.setState({ game: { ...g, year: 2025, character: { ...g.character, age: 25 } }, status: 'ready', outcome: null, toasts: [], meta: { ...meta, settings: { ...meta.settings, avatarStyle: style } } });
  useNav.setState({ stack: [] });
  return render(<Life />);
}
afterEach(() => cleanup());

describe('visual dos personagens', () => {
  it('cartoon (padrão) desenha SVG; pixel art desenha canvas', async () => {
    expect(emptyMeta().settings.avatarStyle).toBe('cartoon');
    start('cartoon');
    const btn = screen.getByTestId('avatar-button');
    await waitFor(() => expect(btn.querySelector('svg')).not.toBeNull()); // visual em chunk lazy
    expect(btn.querySelector('canvas')).toBeNull();
    cleanup();
    start('pixel');
    const btn2 = screen.getByTestId('avatar-button');
    await waitFor(() => expect(btn2.querySelector('canvas')).not.toBeNull());
    expect(btn2.querySelector('svg')).toBeNull();
  });

  it('a opção nas Configurações troca o visual e grava no meta', async () => {
    start('cartoon');
    fireEvent.click(screen.getByTestId('menu-button'));
    fireEvent.click(screen.getByTestId('menu-settings'));
    fireEvent.click(screen.getByTestId('style-pixel'));
    expect(useGameStore.getState().meta.settings.avatarStyle).toBe('pixel');
    expect((saved.at(-1) as { settings: { avatarStyle: string } }).settings.avatarStyle).toBe('pixel');
    await waitFor(() => expect(screen.getByTestId('avatar-button').querySelector('canvas')).not.toBeNull());
  });
});
