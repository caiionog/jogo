// @vitest-environment jsdom
/**
 * "Passar tempo com todos" (release 0.0.3): botão no topo do grupo Amigos, folha com as atividades por idade,
 * quem vai e quem não vai (com o motivo) e o efeito no afeto dos presentes via store.
 */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import type { GameState, Person } from '../src/engine';
import { getRelation, groupActivities, groupAvailability } from '../src/engine';
import { aged, withPerson } from './relHelpers';

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

/** Personagem de `age` anos com `n` amigos (afeto 55) e, opcionalmente, um amigo brigado (afeto 10). */
function withFriends(age: number, n: number, feud = false): [GameState, Person[]] {
  let s: GameState = { ...aged(age, 'ui-grp'), pendingEvents: [], money: 50000 };
  s = { ...s, economy: { ...s.economy, ledger: { year: s.year, opening: s.money, entries: [] } } };
  const people: Person[] = [];
  for (let i = 0; i < n; i++) {
    let p: Person;
    [s, p] = withPerson(s, 'amigo', Math.max(6, age + i - 1), { affection: 55 });
    people.push(p);
  }
  if (feud) {
    let p: Person;
    [s, p] = withPerson(s, 'amigo', age + 3, { affection: 10, sex: 'M' });
    people.push(p);
  }
  return [s, people];
}

function openRelations(game: GameState) {
  useGameStore.setState({ game, status: 'ready', outcome: null, toasts: [], intimacy: null, intimacySeen: 0 });
  useNav.setState({ stack: [] });
  render(<Life />);
  fireEvent.click(screen.getByTestId('nav-relacoes'));
}

beforeEach(() => history.replaceState({ nav: 0 }, ''));
afterEach(() => cleanup());

describe('passar tempo com todos', () => {
  it('o botão aparece no grupo Amigos quando há amigos', () => {
    const [g] = withFriends(25, 3);
    openRelations(g);
    const btn = screen.getByTestId('group-hangout');
    expect((btn as HTMLButtonElement).disabled).toBe(false);
    expect(btn.textContent).toContain('Passar tempo com todos');
  });

  it('sem amigos, o botão fica desabilitado com o motivo', () => {
    const [g] = withFriends(25, 0);
    openRelations(g);
    const btn = screen.getByTestId('group-hangout') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toContain('Você ainda não tem amigos');
  });

  it('a folha mostra as atividades da idade: criança × adulto', () => {
    const [kid] = withFriends(8, 3);
    openRelations(kid);
    fireEvent.click(screen.getByTestId('group-hangout'));
    const kidIds = groupActivities(kid, GAME_CONTENT).map((a) => a.id);
    expect(kidIds).toContain('brincar_rua');
    for (const id of kidIds) expect(screen.getByTestId(`group-activity-${id}`)).toBeTruthy();
    expect(screen.queryByTestId('group-activity-bar')).toBeNull();
    expect(screen.getByTestId('group-activity-brincar_rua').textContent).toContain('grátis');
    cleanup();

    const [adult] = withFriends(25, 3);
    openRelations(adult);
    fireEvent.click(screen.getByTestId('group-hangout'));
    expect(screen.getByTestId('group-activity-bar').textContent).toMatch(/R\$\s?120/);
    expect(screen.getByTestId('group-activity-treinar_juntos').textContent).toContain('conta como treino');
    expect(screen.queryByTestId('group-activity-brincar_rua')).toBeNull();
  });

  it('mostra quem vai e quem não vai, com o motivo', () => {
    const [g, people] = withFriends(25, 3, true);
    openRelations(g);
    fireEvent.click(screen.getByTestId('group-hangout'));
    const { present, absent } = groupAvailability(g, GAME_CONTENT);
    const presentBox = screen.getByTestId('group-present');
    for (const p of present) expect(presentBox.textContent).toContain(p.name);
    const feud = people.at(-1)!;
    const absentBox = screen.getByTestId('group-absent');
    expect(absentBox.textContent).toContain(`${feud.name.split(' ')[0]} (brigado com você)`);
    expect(absent.length).toBeGreaterThanOrEqual(1);
  });

  it('atividade sem dinheiro fica desabilitada com o motivo', () => {
    const [g0] = withFriends(25, 3);
    const g = { ...g0, money: 50, economy: { ...g0.economy, ledger: { ...g0.economy.ledger, opening: 50 } } };
    openRelations(g);
    fireEvent.click(screen.getByTestId('group-hangout'));
    const bar = screen.getByTestId('group-activity-bar') as HTMLButtonElement;
    expect(bar.disabled).toBe(true);
    expect(bar.textContent).toContain('Dinheiro insuficiente');
  });

  it('escolher uma atividade aumenta o afeto dos presentes e fecha a folha', () => {
    const [g] = withFriends(25, 3);
    openRelations(g);
    fireEvent.click(screen.getByTestId('group-hangout'));
    const { present } = groupAvailability(g, GAME_CONTENT);
    expect(present.length).toBeGreaterThan(0);
    const sheet = screen.getByTestId('group-sheet');
    act(() => fireEvent.click(within(sheet).getByTestId('group-activity-churrasco')));
    const after = useGameStore.getState().game!;
    for (const p of present) expect(getRelation(after, p.id)!.affection).toBeGreaterThan(getRelation(g, p.id)!.affection);
    expect(after.relationships.lastGroup?.activityId).toBe('churrasco');
    expect(screen.queryByTestId('group-sheet')).toBeNull();
  });
});
