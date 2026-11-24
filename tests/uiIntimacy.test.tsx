// @vitest-environment jsdom
/**
 * Transição de cena íntima (release 0.0.3): só toca quando chega uma cena `intimo` com `seq` novo; nunca com a cena
 * do save carregado nem com praia; versão estática com prefers-reduced-motion; "Pular" fecha; o desenho só tem
 * quarto, cama, cobertor, travesseiro, luz e coração.
 */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameState, IntimacyVariant } from '../src/engine';
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

const { useGameStore, intimacySeqOf } = await import('../src/ui/store');
const { useNav } = await import('../src/ui/nav');
const Life = (await import('../src/ui/screens/Life')).default;
const { IntimacyScene } = await import('../src/ui/components/IntimacyTransition');

const ALLOWED_PARTS = new Set(['quarto', 'cama', 'cobertor', 'travesseiro', 'coracao', 'luz']);

function base(): GameState {
  return { ...aged(30, 'ui-int', { adultContent: true }), pendingEvents: [] };
}
const withScene = (g: GameState, scene: GameState['scene']): GameState => ({ ...g, scene });
const intimo = (g: GameState, seq: number, variant: IntimacyVariant = 'casa') => withScene(g, { kind: 'intimo', year: g.year, variant, seq });

function setReducedMotion(reduce: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: reduce && q.includes('prefers-reduced-motion'),
    media: q,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

/** Abre a tela como um save carregado (o seq da cena atual conta como visto). */
function load(game: GameState) {
  useGameStore.setState({ game, status: 'ready', outcome: null, toasts: [], intimacy: null, intimacySeen: intimacySeqOf(game) });
  useNav.setState({ stack: [] });
  render(<Life />);
}
/** Uma mudança do jogo (como depois de uma interação ou escolha de evento). */
const change = (game: GameState) => act(() => useGameStore.setState({ game }));

beforeEach(() => {
  history.replaceState({ nav: 0 }, '');
  setReducedMotion(false);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('IntimacyTransition', () => {
  it('não toca ao abrir um save com cena íntima antiga', () => {
    load(intimo(base(), 3));
    expect(screen.queryByTestId('intimacy-anim')).toBeNull();
    expect(useGameStore.getState().intimacy).toBeNull();
  });

  it('toca quando chega uma cena íntima com seq novo e não repete com o mesmo seq', () => {
    const g = intimo(base(), 1);
    load(g);
    change(intimo(g, 2, 'hotel'));
    expect(screen.getByTestId('intimacy-anim')).toBeTruthy();
    expect(screen.queryByTestId('intimacy-static')).toBeNull();
    fireEvent.click(screen.getByTestId('intimacy-skip'));
    expect(screen.queryByTestId('intimacy-anim')).toBeNull();
    // outra mudança qualquer com a mesma cena (mesmo seq): nada
    change({ ...intimo(g, 2, 'hotel'), money: g.money + 1 });
    expect(screen.queryByTestId('intimacy-anim')).toBeNull();
  });

  it('não toca com cena de praia; depois dela, a próxima cena íntima (seq 1) toca', () => {
    const g = intimo(base(), 4);
    load(g);
    change(withScene(g, { kind: 'praia', year: g.year }));
    expect(screen.queryByTestId('intimacy-anim')).toBeNull();
    change(intimo(g, 1));
    expect(screen.getByTestId('intimacy-anim')).toBeTruthy();
  });

  it('o botão "Pular" é acessível e fecha; o resultado aparece depois', () => {
    const g = base();
    load(g);
    change(intimo(g, 1));
    act(() => useGameStore.setState({ outcome: { lines: ['Vocês passaram a noite juntos.'], deltas: [], money: 0 } }));
    expect(screen.queryByTestId('result-ok')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Pular' }));
    expect(screen.queryByTestId('intimacy-skip')).toBeNull();
    expect(screen.getByTestId('result-ok')).toBeTruthy();
  });

  it('termina sozinha depois de 1,5 s', () => {
    vi.useFakeTimers();
    const g = base();
    load(g);
    change(intimo(g, 1));
    expect(screen.getByTestId('intimacy-anim')).toBeTruthy();
    act(() => vi.advanceTimersByTime(1600));
    expect(screen.queryByTestId('intimacy-anim')).toBeNull();
  });

  it('com prefers-reduced-motion mostra a versão estática', () => {
    setReducedMotion(true);
    vi.useFakeTimers();
    const g = base();
    load(g);
    change(intimo(g, 1, 'casal'));
    expect(screen.getByTestId('intimacy-static')).toBeTruthy();
    expect(screen.queryByTestId('intimacy-anim')).toBeNull();
    expect(document.querySelector('.ds-intimacy-heart, .ds-intimacy-dim')).toBeNull();
    act(() => vi.advanceTimersByTime(1100));
    expect(screen.queryByTestId('intimacy-static')).toBeNull();
  });

  it('o desenho só tem quarto, cama, cobertor, travesseiro, luz e coração (todas as variantes e estilos)', () => {
    for (const variant of ['casa', 'hotel', 'simples', 'casal'] as const) {
      for (const style of ['pixel', 'cartoon'] as const) {
        const { container, unmount } = render(<IntimacyScene variant={variant} style={style} animated />);
        const svg = container.querySelector('svg')!;
        expect(svg.getAttribute('shape-rendering')).toBe(style === 'pixel' ? 'crispEdges' : 'geometricPrecision');
        const parts = [...svg.querySelectorAll('[data-part]')].map((el) => el.getAttribute('data-part')!);
        expect(new Set(parts)).toEqual(ALLOWED_PARTS);
        for (const p of parts) expect(ALLOWED_PARTS.has(p)).toBe(true);
        // todo elemento desenhado pertence a uma das partes permitidas; nada de pessoa, imagem ou texto
        for (const el of svg.querySelectorAll('rect, path, circle, ellipse, polygon')) expect(el.closest('[data-part]')).not.toBeNull();
        expect(svg.querySelector('image, text, use, foreignObject, [data-part*="pessoa"], [data-part*="person"]')).toBeNull();
        unmount();
      }
    }
  });
});
