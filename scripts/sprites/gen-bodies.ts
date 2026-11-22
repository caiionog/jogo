/**
 * Gera `src/content/sprites/body/generated.ts` com as silhuetas de todas as fases × sexos × tipos físicos.
 *   npx tsx scripts/sprites/gen-bodies.ts
 * As grades geradas podem ser editadas à mão; para preservar uma edição, mova a grade para um arquivo próprio em
 * `src/content/sprites/body/` e registre em BODY_OVERRIDES (body/index.ts).
 */
import { writeFileSync } from 'node:fs';
import { BUILDS } from '../../src/engine';
import type { AgeStage } from '../../src/engine';
import { generateBody } from '../../src/ui/avatar/pixel/bodygen';

const STAGES: AgeStage[] = ['bebe', 'crianca', 'adolescente', 'adulto', 'idoso'];
let out = `/* eslint-disable */\n// GERADO por scripts/sprites/gen-bodies.ts — edite as proporções em src/ui/avatar/pixel/bodygen.ts ou mova a\n// grade para um arquivo próprio (override) antes de editar à mão.\nimport type { BodySprite } from '../types';\n\nexport const GENERATED_BODIES: Record<string, BodySprite> = {\n`;
for (const stage of STAGES) for (const sex of ['M', 'F'] as const) for (const build of BUILDS) {
  const b = generateBody(stage, sex, build);
  const first = b.shape.findIndex((r) => r.includes('h'));
  out += `  ${b.id}: {\n    id: '${b.id}', w: ${b.w}, h: ${b.h},\n    // prettier-ignore\n    shape: [\n${b.shape.map((r, i) => `      '${r}',${i >= first && i % 4 === 0 ? ` // ${i}` : ''}`).join('\n')}\n    ],\n    anchors: ${JSON.stringify(b.anchors).replace(/"(\w+)":/g, '$1: ')},\n    headBox: ${JSON.stringify(b.headBox)},\n  },\n`;
}
out += '};\n';
writeFileSync('src/content/sprites/body/generated.ts', out);
console.log('ok', STAGES.length * 2 * BUILDS.length, 'corpos');
