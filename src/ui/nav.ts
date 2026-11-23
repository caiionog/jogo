/**
 * Navegação em camadas (Etapa 8): pilha de telas no Zustand da UI — nunca no GameState.
 * Integrada ao histórico do navegador: abrir uma tela faz pushState; o "Voltar" do Android e o gesto de voltar do
 * iPhone disparam popstate e fecham um nível, em vez de sair do app.
 */
import { create } from 'zustand';

export type ScreenId =
  | 'ocupacao' | 'minha-ocupacao' | 'carreiras' | 'carreiras-cat' | 'carreira' | 'carreira-luta' | 'estudos' | 'escola' | 'luta' | 'ranking' | 'clube' | 'intercambio' | 'noite'
  | 'bens' | 'meus-bens' | 'bem' | 'empresa' | 'mercado' | 'mercado-cat' | 'financas'
  | 'relacoes'
  | 'atividades' | 'treino' | 'estudo' | 'saude' | 'lazer' | 'amor' | 'testamento' | 'crime'
  | 'perfil';

export interface ScreenRef {
  id: ScreenId;
  params?: Record<string, string>;
}

interface NavStore {
  stack: ScreenRef[];
  /** Abre uma tela nova por cima (empilha). */
  push(s: ScreenRef | ScreenId): void;
  /** Abre um menu raiz (substitui a pilha). */
  open(s: ScreenId): void;
  /** Fecha o nível de cima (pelo histórico, para o botão do sistema funcionar igual). */
  back(): void;
  /** Fecha tudo. */
  closeAll(): void;
  /** Usado pelo popstate: ajusta a pilha à profundidade do histórico. */
  syncDepth(depth: number): void;
}

const hasWindow = typeof window !== 'undefined' && typeof history !== 'undefined';
const ref = (s: ScreenRef | ScreenId): ScreenRef => (typeof s === 'string' ? { id: s } : s);

export const useNav = create<NavStore>((set, get) => ({
  stack: [],
  push(s) {
    const stack = [...get().stack, ref(s)];
    set({ stack });
    if (hasWindow) history.pushState({ nav: stack.length }, '');
  },
  open(s) {
    // trocar de menu raiz não empilha histórico demais: volta à base e abre
    const depth = get().stack.length;
    set({ stack: [ref(s)] });
    if (hasWindow) {
      if (depth === 0) history.pushState({ nav: 1 }, '');
      else history.replaceState({ nav: 1 }, '');
    }
  },
  back() {
    if (!get().stack.length) return;
    if (hasWindow && (history.state as { nav?: number } | null)?.nav) history.back();
    else set({ stack: get().stack.slice(0, -1) });
  },
  closeAll() {
    const depth = get().stack.length;
    if (!depth) return;
    if (hasWindow && (history.state as { nav?: number } | null)?.nav) history.go(-depth);
    else set({ stack: [] });
  },
  syncDepth(depth) {
    const stack = get().stack;
    if (depth < stack.length) set({ stack: stack.slice(0, Math.max(0, depth)) });
  },
}));

/** Liga o popstate do navegador à pilha (chamar uma vez). */
export function bindHistory(): () => void {
  if (!hasWindow) return () => {};
  if (!(history.state as { nav?: number } | null)?.nav) history.replaceState({ nav: 0 }, '');
  const onPop = (e: PopStateEvent) => useNav.getState().syncDepth((e.state as { nav?: number } | null)?.nav ?? 0);
  window.addEventListener('popstate', onPop);
  return () => window.removeEventListener('popstate', onPop);
}
