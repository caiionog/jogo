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

  it('Concursos públicos: categoria lista os cargos e o Delegado; prestar registra a tentativa', () => {
    const g = adult(26, 'ui-concurso');
    open({ ...g, education: { ...g.education, graduated: true, current: null } }, ['nav-ocupacao', 'occ-careers', 'career-cat-concursos']);
    expect(screen.getByTestId('career-delegado')).toBeTruthy();
    act(() => fireEvent.click(screen.getByTestId('career-agente_administrativo')));
    const btn = screen.getByTestId('take-civil-exam') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    act(() => fireEvent.click(btn));
    expect(useGameStore.getState().game!.civilService.exams).toHaveLength(1);
  });

  it('Fama e redes: barra de fama, postar e comercial bloqueado sem fama', () => {
    open(adult(22, 'ui-fama'), ['nav-atividades', 'act-fama']);
    expect(screen.getByTestId('fame-card').textContent).toContain('seguidores');
    expect((screen.getByTestId('do-commercial') as HTMLButtonElement).disabled).toBe(true);
    act(() => fireEvent.click(screen.getByTestId('post-foto')));
    expect(useGameStore.getState().game!.yearUses['redes:post']).toBe(1);
  });

  it('Esporte profissional: peneira sem carreira; com carreira, escudo e pista sem números de habilidade', () => {
    const g = adult(15, 'ui-fut');
    open(g, ['nav-ocupacao', 'occ-careers', 'career-football']);
    expect((screen.getByTestId('football-tryout') as HTMLButtonElement).disabled).toBe(false);
    cleanup();
    const pro = { ...g, football: { stage: 'pro' as const, position: 'ATA' as const, skills: { finishing: 71.3, passing: 55.2, defending: 20.1, goalkeeping: 10, pace: 66.6 }, potential: 83, reputation: 20, clubId: 'litoraneo', contract: { clubId: 'litoraneo', years: 2, salary: 300000 }, offers: [], history: [], titles: [], caps: 0, divisions: {} } };
    open(pro, ['nav-ocupacao', 'occ-careers', 'career-football']);
    const text = screen.getByTestId('football-card').textContent + screen.getByTestId('football-hint').textContent;
    expect(text).toContain('Atlético Litorâneo');
    for (const n of ['71', '55', '66', '83']) expect(document.body.textContent).not.toContain(` ${n} `);
  });
});
