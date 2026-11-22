/**
 * Silhuetas por fase × sexo × tipo físico. As grades feitas à mão (overrides) têm prioridade sobre as geradas
 * (`generated.ts`, por `scripts/sprites/gen-bodies.ts`). Para ajustar um corpo à mão: copie a grade gerada para um
 * arquivo próprio aqui, edite e registre em BODY_OVERRIDES.
 */
import type { AgeStage, Build } from '../../../engine';
import type { BodySprite } from '../types';
import { ADULTO_M_MEDIO } from './adulto_M_medio';
import { GENERATED_BODIES } from './generated';

export const BODY_OVERRIDES: Readonly<Record<string, BodySprite>> = {
  adulto_M_medio: ADULTO_M_MEDIO,
};

export function bodySprite(stage: AgeStage, sex: 'M' | 'F', build: Build): BodySprite {
  const id = `${stage}_${sex}_${build}`;
  return BODY_OVERRIDES[id] ?? GENERATED_BODIES[id] ?? GENERATED_BODIES['adulto_M_medio']!;
}
