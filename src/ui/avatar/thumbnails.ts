/**
 * Miniaturas dos NPCs: nenhum canvas por pessoa. O busto em pixel art é composto uma vez e guardado (dataURL) num
 * cache LRU pela chave `avatarHash(descriptor)`; os pedidos entram numa fila processada em tempo ocioso.
 */
import type { AvatarDescriptor } from '../../engine';
import { avatarHash } from '../../engine';

export type SnapshotFn = (d: AvatarDescriptor, size: number) => string;

export interface ThumbnailOptions {
  max?: number;
  /** Agenda trabalho em tempo ocioso (padrão: requestIdleCallback/setTimeout). */
  schedule?: (fn: () => void) => void;
}

const defaultSchedule = (fn: () => void) => {
  const ric = (globalThis as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  if (ric) ric(fn, { timeout: 300 });
  else setTimeout(fn, 16);
};

export class ThumbnailCache {
  private cache = new Map<string, string>();
  private waiting = new Map<string, { d: AvatarDescriptor; size: number; done: ((url: string) => void)[] }>();
  private renderer: SnapshotFn | null = null;
  private loading: Promise<SnapshotFn> | null = null;
  private scheduled = false;
  private readonly max: number;
  private readonly schedule: (fn: () => void) => void;
  /** Quantas vezes o renderizador desenhou (para testes e medidas). */
  renders = 0;

  constructor(private readonly load: () => Promise<SnapshotFn>, opts: ThumbnailOptions = {}) {
    this.max = opts.max ?? 300;
    this.schedule = opts.schedule ?? defaultSchedule;
  }

  key(d: AvatarDescriptor, size: number): string {
    return `${avatarHash(d)}@${size}`;
  }

  get(d: AvatarDescriptor, size: number): string | undefined {
    const k = this.key(d, size);
    const url = this.cache.get(k);
    if (url !== undefined) {
      this.cache.delete(k);
      this.cache.set(k, url);
    }
    return url;
  }

  get size(): number {
    return this.cache.size;
  }

  request(d: AvatarDescriptor, size: number): Promise<string> {
    const hit = this.get(d, size);
    if (hit !== undefined) return Promise.resolve(hit);
    const k = this.key(d, size);
    return new Promise((resolve) => {
      const w = this.waiting.get(k);
      if (w) w.done.push(resolve);
      else this.waiting.set(k, { d, size, done: [resolve] });
      this.pump();
    });
  }

  private pump(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    this.schedule(() => void this.work());
  }

  private async work(): Promise<void> {
    if (!this.renderer) {
      this.loading ??= this.load();
      this.renderer = await this.loading;
    }
    const started = Date.now();
    for (const [k, w] of this.waiting) {
      this.waiting.delete(k);
      const url = this.renderer(w.d, w.size);
      this.renders++;
      this.put(k, url);
      w.done.forEach((f) => f(url));
      if (Date.now() - started > 12) break;
    }
    this.scheduled = false;
    if (this.waiting.size) this.pump();
  }

  private put(k: string, url: string): void {
    this.cache.set(k, url);
    while (this.cache.size > this.max) this.cache.delete(this.cache.keys().next().value!);
  }
}

/** Cache global do app (busto em pixel art; o tamanho na tela é só escala CSS). */
export const thumbnails = new ThumbnailCache(() => import('./renderer').then((m) => (d: AvatarDescriptor) => m.PixelAvatarRenderer.snapshot(d)));

/** Cache das miniaturas no visual cartoon (release 0.0.3): busto em SVG (dataURL), composto uma vez por descriptor. */
export const vectorThumbnails = new ThumbnailCache(() => import('./vector').then((m) => (d: AvatarDescriptor) => m.VectorAvatarRenderer.snapshot(d)));

/** Cache do visual ativo. */
export function thumbnailsFor(style: 'pixel' | 'cartoon'): ThumbnailCache {
  return style === 'cartoon' ? vectorThumbnails : thumbnails;
}
