import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import { EYE_SHAPES, FACE_SHAPES, HAIR_TYPES, RACES, createRng, genesForRace, previewAvatar } from '../src/engine';
import type { AvatarDescriptor } from '../src/engine';
import { MAX_TRIANGLES, buildBust, countTriangles, disposeBust } from '../src/ui/avatar/bust';

describe('busto procedural (Fase A)', () => {
  it(`fica abaixo de ${MAX_TRIANGLES} triângulos em todas as combinações de idade, cabelo, roupa e marcas`, () => {
    const rng = createRng(1);
    let max = 0;
    const styles = ['raspado', 'curto', 'medio', 'longo', 'preso'] as const;
    for (const race of [RACES[0]!, RACES[2]!]) for (const type of HAIR_TYPES) for (const style of styles) for (const outfit of GAME_CONTENT.outfits) {
      for (const age of [1, 30]) {
        const genes = { ...genesForRace(rng, race), hairType: type, eyeShape: EYE_SHAPES[rng.int(0, 3)]!, faceShape: FACE_SHAPES[rng.int(0, 4)]! };
        const base = previewAvatar({ genes, race, facialHair: 'barba' }, age % 2 ? 'F' : 'M', age, GAME_CONTENT);
        const d: AvatarDescriptor = { ...base, hair: { ...base.hair, style }, marks: { scar: true, brokenNose: true, cauliflowerEar: true, blackEye: true }, wrinkles: 0.8, fat: 0.9, outfit: { id: outfit.id, mesh: outfit.mesh, color: outfit.colors[0]!, beltColor: '#1b1b1b' } };
        const g = buildBust(d);
        max = Math.max(max, countTriangles(g));
        disposeBust(g);
      }
    }
    expect(max).toBeLessThanOrEqual(MAX_TRIANGLES);
    console.log('máximo de triângulos por busto:', max);
  });
});
