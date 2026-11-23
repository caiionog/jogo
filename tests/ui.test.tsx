// @vitest-environment jsdom
/**
 * Navegação e pop-ups (Etapa 8), com Testing Library: barra inferior, menus em camadas, Carreiras e Mercado até a
 * confirmação, "Voltar", motivo de ação desabilitada, pop-up de evento + resultado e nenhuma habilidade em número.
 */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import type { GameState } from '../src/engine';
import { newGame } from '../src/engine';

// jsdom não tem canvas: o app cai no desenho 2D (mesmo caminho de um aparelho sem WebGL)
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

function adult(age = 25, money = 300000): GameState {
  const g = newGame({ seed: 'ui', name: 'Teste', surnames: ['Souza', 'Lima'], sex: 'M', birthYear: 2000, uf: 'SP', city: 'São Paulo' }, GAME_CONTENT);
  return {
    ...g,
    year: 2000 + age,
    money,
    character: { ...g.character, age, stats: { ...g.character.stats, intelligence: 70, looks: 60, athletic: 70, health: 90 } },
    education: { ...g.education, current: null, graduated: true },
    economy: { ...g.economy, ledger: { year: 2000 + age, opening: money, entries: [] }, lastIncome: 90000, housing: 'aluguel' },
    // valores distintos para garantir que não aparecem em lugar nenhum
    fighter: { ...g.fighter, skills: { grappling: 87.3, trocacao: 91.7 }, chinBase: 63 },
  };
}

function start(game: GameState) {
  useGameStore.setState({ game, status: 'ready', outcome: null, toasts: [] });
  useNav.setState({ stack: [] });
  return render(<Life />);
}

beforeEach(() => {
  history.replaceState({ nav: 0 }, '');
});
afterEach(() => cleanup());

describe('barra inferior e menus em camadas', () => {
  it('cada botão da barra abre o seu menu; Voltar fecha', () => {
    start(adult());
    for (const [id, title] of [['ocupacao', 'Ocupação'], ['bens', 'Bens'], ['relacoes', 'Relacionamentos'], ['atividades', 'Atividades']] as const) {
      fireEvent.click(screen.getByTestId(`nav-${id}`));
      const dlg = screen.getByRole('dialog', { name: title });
      expect(dlg).toBeTruthy();
      act(() => useNav.getState().syncDepth(0)); // o popstate do "Voltar" do sistema
      expect(screen.queryByRole('dialog', { name: title })).toBeNull();
    }
  });

  it('"Voltar" fecha só o nível de cima (pilha) e o histórico do navegador acompanha', () => {
    start(adult());
    fireEvent.click(screen.getByTestId('nav-ocupacao'));
    fireEvent.click(screen.getByTestId('occ-careers'));
    fireEvent.click(screen.getByTestId('career-cat-integral'));
    expect(useNav.getState().stack.map((s) => s.id)).toEqual(['ocupacao', 'carreiras', 'carreiras-cat']);
    expect((history.state as { nav: number }).nav).toBe(3);
    // botão do sistema: o popstate leva a profundidade 2
    act(() => useNav.getState().syncDepth(2));
    expect(useNav.getState().stack.map((s) => s.id)).toEqual(['ocupacao', 'carreiras']);
    expect(screen.getByRole('dialog', { name: 'Carreiras' })).toBeTruthy();
  });

  it('Carreiras navega até o detalhe e a confirmação de troca de emprego', () => {
    const g = adult();
    const employed = { ...g, economy: { ...g.economy, job: { jobId: 'lanchonete', level: 1, performance: 50, years: 0 } } };
    start(employed);
    fireEvent.click(screen.getByTestId('nav-ocupacao'));
    fireEvent.click(screen.getByTestId('occ-careers'));
    fireEvent.click(screen.getByTestId('career-cat-integral'));
    fireEvent.click(screen.getByTestId('career-garcom'));
    expect(screen.getByTestId('career-ladder').textContent).toContain('Garçom');
    fireEvent.click(screen.getByTestId('apply-job'));
    const sheet = screen.getByTestId('confirm-job');
    expect(within(sheet).getByText(/Só dá para ter um emprego por vez/)).toBeTruthy();
  });

  it('Mercado navega até a confirmação de compra com financiamento', () => {
    start(adult(30, 400000));
    fireEvent.click(screen.getByTestId('nav-bens'));
    fireEvent.click(screen.getByTestId('assets-market'));
    fireEvent.click(screen.getByTestId('market-imovel'));
    fireEvent.click(screen.getAllByTestId('offer-card')[0]!);
    const sheet = screen.getByTestId('buy-sheet');
    fireEvent.click(within(sheet).getByRole('radio', { name: 'Financiado' }));
    expect(within(sheet).getByTestId('financing').textContent).toMatch(/Custo total/);
    expect(within(sheet).getByTestId('buy-confirm')).toBeTruthy();
  });

  it('ação desabilitada mostra o motivo', () => {
    const kid = { ...adult(), character: { ...adult().character, age: 12 } };
    start(kid);
    fireEvent.click(screen.getByTestId('nav-atividades'));
    expect(screen.getByTestId('act-mudar').textContent).toContain('Disponível a partir dos 18 anos');
    expect((screen.getByTestId('act-mudar') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByTestId('act-treino'));
    const g = useGameStore.getState().game!;
    // sem academia, modalidade não dá
    expect(screen.getByTestId('train-jiujitsu').textContent).toContain('Precisa de uma academia');
    // academia de boxe: jiu-jitsu não é oferecido
    act(() => useGameStore.setState({ game: { ...g, fighter: { ...g.fighter, gymId: 'gen_boxe' } } }));
    expect(screen.getByTestId('train-jiujitsu').textContent).toContain('Sua academia não oferece esta modalidade');
    const noSessions = { ...g, fighter: { ...g.fighter, gymId: 'gen_bairro', sessionsThisYear: 10 } };
    act(() => useGameStore.setState({ game: noSessions }));
    expect(screen.getByTestId('train-jiujitsu').textContent).toContain('Sem sessões de treino livres neste ano');
    for (const el of screen.getAllByTestId('sessions')) expect(el.textContent).toContain('Treinos: 0/10');
    expect(document.body.textContent).not.toMatch(/⚡|[Ee]nergia/);
  });
});

describe('pop-ups de evento e resultado', () => {
  it('o evento mostra as escolhas e, depois, o resultado com as mudanças', () => {
    const g = adult();
    const ev = GAME_CONTENT.events.find((e) => e.id === 'job_big_tip')!;
    start({ ...g, pendingEvents: [{ eventId: ev.id, source: 'random' }] });
    const modal = screen.getByTestId('event-modal');
    expect(within(modal).getAllByTestId('event-choice')).toHaveLength(ev.choices.length);
    fireEvent.click(within(modal).getAllByTestId('event-choice')[0]!);
    const result = screen.getByTestId('result-modal');
    expect(result.textContent).toContain('Dia ganho');
    expect(result.textContent).toMatch(/Felicidade \+4/);
    fireEvent.click(screen.getByTestId('result-ok'));
    expect(screen.queryByTestId('result-modal')).toBeNull();
  });
});

describe('habilidades ocultas', () => {
  it('nenhum número de jiu-jitsu ou trocação aparece nas telas de luta e treino', () => {
    const g = adult();
    start({ ...g, fighter: { ...g.fighter, gymId: 'sp_leao_dourado' } });
    const texts: string[] = [];
    const visit = (open: () => void) => {
      open();
      texts.push(document.body.textContent ?? '');
    };
    visit(() => fireEvent.click(screen.getByTestId('nav-ocupacao')));
    visit(() => fireEvent.click(screen.getByTestId('occ-fight')));
    act(() => useNav.getState().syncDepth(1));
    visit(() => fireEvent.click(screen.getByTestId('occ-careers')));
    visit(() => fireEvent.click(screen.getByTestId('career-fighter')));
    act(() => useNav.getState().syncDepth(0));
    visit(() => fireEvent.click(screen.getByTestId('nav-atividades')));
    visit(() => fireEvent.click(screen.getByTestId('act-treino')));
    const all = texts.join('\n');
    expect(all).not.toMatch(/87[.,]?3?|91[.,]?7?/);
    expect(all).toMatch(/Iniciante|Promissor|Sólido|Elite/);
  });
});
