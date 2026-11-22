/**
 * Registro do service worker (PWA) e o prompt de instalação. Tudo opcional: em páginas embutidas
 * (versão de teste em arquivo único) ou navegadores sem suporte, o jogo funciona sem PWA.
 */
import { registerSW } from 'virtual:pwa-register';

type Listener = () => void;
let updateFn: ((reload?: boolean) => Promise<void>) | null = null;
const needRefresh = new Set<Listener>();
const installListeners = new Set<Listener>();

/** Evento `beforeinstallprompt` (Chrome/Android/desktop) guardado para o botão "Instalar app". */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
let installEvent: BeforeInstallPromptEvent | null = null;

export function setupPwa(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installEvent = e as BeforeInstallPromptEvent;
    installListeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => {
    installEvent = null;
    installListeners.forEach((l) => l());
  });
  if (!('serviceWorker' in navigator)) return;
  try {
    updateFn = registerSW({
      onNeedRefresh() {
        needRefresh.forEach((l) => l());
      },
      onRegisterError(err: unknown) {
        console.warn('Service worker não registrado', err);
      },
    });
  } catch (err) {
    console.warn('PWA indisponível', err);
  }
}

export function onNeedRefresh(l: Listener): () => void {
  needRefresh.add(l);
  return () => needRefresh.delete(l);
}

export function applyUpdate(): void {
  void updateFn?.(true);
}

export function canInstall(): boolean {
  return installEvent !== null;
}

export function onInstallChange(l: Listener): () => void {
  installListeners.add(l);
  return () => installListeners.delete(l);
}

export async function promptInstall(): Promise<boolean> {
  if (!installEvent) return false;
  await installEvent.prompt();
  const { outcome } = await installEvent.userChoice;
  installEvent = null;
  installListeners.forEach((l) => l());
  return outcome === 'accepted';
}

/** iPhone/iPad no Safari: não há prompt; mostramos as instruções. */
export function isIos(): boolean {
  return typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isStandalone(): boolean {
  return typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
}
