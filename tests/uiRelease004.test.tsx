// @vitest-environment jsdom
/**
 * Telas da release 0.0.4: Pessoas da cidade, App de namoro e Exame da Ordem.
 * quem vai e quem não vai (com o motivo) e o efeito no afeto dos presentes via store.
 */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameState } from '../src/engine';
import { aged } from './relHelpers';

HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];

vi.mock('../src/save', () => ({
  clearGame: async () => {},
  clearSlot: async () => {},
  getActiveSlot: async () => 1,
  listSlots: async () => [],
  loadGame: async () => null,
  loadMeta: async () => null,
  saveGame: async () => {},
  saveMeta: async () => {},
  saveSlot: async () => {},
  setActiveSlot: async () => {},
  SLOT_COUNT: 3,
  exportSave: () => '',
  importSave: () => null,
}));

const { useGameStore } = await import('../src/ui/store');
const { useNav } = await import('../src/ui/nav');
const Life = (await import('../src/ui/screens/Life')).default;

function open(game: GameState, testIds: string[]) {
  useGameStore.setState({ game, status: 'ready', outcome: null, toasts: [], intimacy: null, intimacySeen: 0 });
  useNav.setState({ stack: [] });
  render(<Life />);
  for (const id of testIds) fireEvent.click(screen.getByTestId(id));
}

function adult(age: number, seed: string): GameState {
  const s: GameState = { ...aged(age, seed), pendingEvents: [], money: 50000 };
  return { ...s, economy: { ...s.economy, ledger: { year: s.year, opening: s.money, entries: [] } } };
}

beforeEach(() => history.replaceState({ nav: 0 }, ''));
afterEach(() => cleanup());

describe('telas da release 0.0.4', () => {
  it('Pessoas da cidade: puxar conversa cria um conhecido', () => {
    const g = adult(30, 'ui-cidade');
    open(g, ['nav-relacoes', 'nav-cidade']);
    expect(screen.getByTestId('city-summary').textContent).toContain(g.character.city);
    const before = useGameStore.getState().game!.relationships.people.length;
    const btn = screen.getAllByTestId('resident').find((b) => !(b as HTMLButtonElement).disabled)!;
    act(() => fireEvent.click(btn));
    expect(useGameStore.getState().game!.relationships.people.length).toBe(before + 1);
  });

  it('App de namoro: cartão com filtros, pular troca o perfil', () => {
    open(adult(30, 'ui-app'), ['nav-atividades', 'act-amor', 'meet-app']);
    const first = screen.getByTestId('app-card').textContent;
    act(() => fireEvent.click(screen.getByTestId('app-skip')));
    expect(screen.getByTestId('app-card').textContent).not.toBe(first);
    expect(screen.getByTestId('app-filters')).toBeTruthy();
  });

  it('Exame da Ordem aparece em Estudos para quem tem diploma de Direito', () => {
    const g = adult(24, 'ui-oab');
    open({ ...g, college: { ...g.college, diplomas: ['direito'] } }, ['nav-ocupacao', 'occ-careers', 'career-studies']);
    const btn = screen.getByTestId('take-bar-exam') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    act(() => fireEvent.click(btn));
    expect(useGameStore.getState().game!.yearUses['oab:exame']).toBe(1);
  });
});
