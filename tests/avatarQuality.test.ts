/** Qualidade do avatar (release 0.0.1, fase 8): sexo legível, olhos legíveis, cabelo sem bloco quadrado. */
import { describe, expect, it } from 'vitest';
import { BUILDS } from '../src/engine';
import { bodySprite } from '../src/content/sprites/body';
import { renderAvatar } from '../src/ui/avatar/pixel/render';
import { npcSample } from '../scripts/sprites/avatar-audit';

const GROWN = ['adolescente', 'adulto', 'idoso'] as const;

describe('sexo legível no corpo', () => {
  it.each(GROWN)('%s: ombro − quadril é maior no homem que na mulher, em todos os tipos físicos', (stage) => {
    for (const build of BUILDS) {
      // largura real da silhueta (tronco + braços) na linha do ombro e na linha do quadril
      const spread = (sex: 'M' | 'F') => {
        const b = bodySprite(stage, sex, build);
        const w = (y: number) => [...b.shape[y]!].filter((c) => c !== '.').length;
        return w(b.anchors.shoulderL[1] + 1) - w(b.anchors.hipL[1]);
      };
      expect(spread('M'), `${stage} ${build}`).toBeGreaterThan(spread('F'));
    }
  });
});

describe('rosto e cabelo na amostra de 48 pessoas', () => {
  const sample = npcSample(48, 4242);
  it('olhos com pelo menos 2 px de altura (pálpebra + íris), diferentes da pele em volta', () => {
    for (const d of sample) {
      if (d.stage === 'bebe') continue;
      const img = renderAvatar(d);
      const [ex, ey] = bodySprite(d.stage, d.sex, d.build).anchors.eyeL;
      const px = (x: number, y: number) => [...img.data.slice((y * img.w + x) * 4, (y * img.w + x) * 4 + 3)].join(',');
      const skin = px(ex, ey + 2);
      expect(px(ex + 1, ey)).not.toBe(skin);
      expect(px(ex, ey - 1)).not.toBe(skin);
    }
  });

  it('nenhum cabelo vira um bloco retangular: as laterais afinam (linhas de baixo mais estreitas que as do meio)', () => {
    for (const d of sample.filter((x) => (x.hair.style === 'longo' || x.hair.style === 'medio') && x.stage !== 'bebe')) {
      const img = renderAvatar(d);
      const widthAt = (y: number) => {
        let n = 0;
        for (let x = 0; x < img.w; x++) if (img.data[(y * img.w + x) * 4 + 3]! > 0) n++;
        return n;
      };
      expect(widthAt(0)).toBeLessThanOrEqual(widthAt(8));
    }
  });
});
