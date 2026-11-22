import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import { deriveAvatar } from '../src/engine';
import { ThumbnailCache } from '../src/ui/avatar/thumbnails';
import { makeGame } from './helpers';

describe('cache de miniaturas', () => {
  const sync = (fn: () => void) => queueMicrotask(fn);
  it('mesmo descriptor → mesma imagem, desenhada uma vez só; descriptor diferente → outra', async () => {
    let calls = 0;
    const cache = new ThumbnailCache(async () => (d, size) => `img:${++calls}:${d.age}:${size}`, { schedule: sync });
    const g = makeGame('thumb');
    const a = deriveAvatar(g, GAME_CONTENT);
    const [x, y] = await Promise.all([cache.request(a, 64), cache.request(structuredClone(a), 64)]);
    expect(x).toBe(y);
    expect(await cache.request(a, 64)).toBe(x);
    expect(cache.renders).toBe(1);
    const older = deriveAvatar({ ...g, character: { ...g.character, age: 40 } }, GAME_CONTENT);
    expect(await cache.request(older, 64)).not.toBe(x);
    expect(cache.renders).toBe(2);
    expect(cache.get(a, 64)).toBe(x);
  });

  it('LRU: mantém no máximo N imagens, descartando a menos usada', async () => {
    const cache = new ThumbnailCache(async () => (d) => `img:${d.age}`, { max: 3, schedule: sync });
    const g = makeGame('lru');
    const at = (age: number) => deriveAvatar({ ...g, character: { ...g.character, age } }, GAME_CONTENT);
    for (const age of [20, 21, 22]) await cache.request(at(age), 32);
    cache.get(at(20), 32); // 20 vira a mais recente
    await cache.request(at(23), 32);
    expect(cache.size).toBe(3);
    expect(cache.get(at(21), 32)).toBeUndefined();
    expect(cache.get(at(20), 32)).toBe('img:20');
  });
});
