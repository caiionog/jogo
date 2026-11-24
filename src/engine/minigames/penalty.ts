/**
 * Minigame do pênalti (release 0.0.4, fase 7). O jogador toca no gol para mirar e para a barra de força.
 * - Força alta demais (> 0,9) isola a bola; fraca demais (< 0,25) chega mansa nas mãos do goleiro.
 * - O chute desvia um pouco (pressão alta e finalização baixa desviam mais); passar do limite do gol é "fora",
 *   raspar no limite é "trave".
 * - Se o goleiro pulou na zona da bola, defende conforme o alcance; canto alto e força boa dificultam.
 */
import { createRng, seedToState } from '../core/rng';
import type { MinigameDef, PenaltyInput, PenaltyResult, PenaltySetup } from './types';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Zona (0–5) de um ponto do gol: colunas -1..-1/3, -1/3..1/3, 1/3..1; linhas baixo (< 0,5) e alto. */
export function zoneOf(x: number, y: number): number {
  const col = x < -1 / 3 ? 0 : x > 1 / 3 ? 2 : 1;
  return col + (y >= 0.5 ? 3 : 0);
}

export const PENALTY: MinigameDef<PenaltySetup, PenaltyInput, PenaltyResult> = {
  kind: 'penalty',
  label: 'Cobrança de pênalti',
  tutorial: 'Toque no gol para mirar. Depois toque de novo para parar a barra de força: forte demais isola, fraco demais o goleiro pega.',
  setup(seed, ctx) {
    const rng = createRng(seedToState(`${seed}:penalti`));
    const keeperZone = rng.chance(0.12) ? -1 : rng.int(0, 5);
    const skill = clamp(ctx.skill, 0, 100);
    return {
      keeperZone,
      keeperReach: clamp(0.35 + ctx.keeperSkill / 200, 0.3, 0.85),
      spread: clamp(0.08 + ctx.pressure * 0.12 - skill / 1000, 0.03, 0.3),
      noise: [rng.next() * 2 - 1, rng.next() * 2 - 1],
      saveRoll: rng.next(),
      skill,
      simAim: [rng.pick([-0.75, -0.55, 0.55, 0.75]), rng.chance(0.4) ? 0.75 : 0.25],
    };
  },
  resolve(setup, input) {
    const power = clamp(input.power, 0, 1);
    const sx = clamp(input.x, -1.2, 1.2) + setup.noise[0] * setup.spread;
    const sy = clamp(input.y, 0, 1.2) + setup.noise[1] * setup.spread + (power > 0.75 ? (power - 0.75) * 0.6 : 0);
    const shot = { x: Math.round(sx * 100) / 100, y: Math.round(sy * 100) / 100 };
    if (power > 0.9 || sy > 1.05 || Math.abs(sx) > 1.05) return { outcome: 'fora', shot, keeperZone: setup.keeperZone };
    if (sy > 0.97 || Math.abs(sx) > 0.97) return { outcome: 'trave', shot, keeperZone: setup.keeperZone };
    const zone = zoneOf(sx, sy);
    if (power < 0.25) return { outcome: 'defesa', shot, keeperZone: zone };
    if (setup.keeperZone === zone || (setup.keeperZone === -1 && zone % 3 === 1)) {
      // canto (longe do centro) e alto dificultam; força boa também
      const corner = Math.abs(sx) > 0.7 ? 0.25 : 0;
      const high = sy > 0.75 ? 0.15 : 0;
      const reach = clamp(setup.keeperReach - corner - high - (power - 0.5) * 0.3, 0.05, 0.95);
      if (setup.saveRoll < reach) return { outcome: 'defesa', shot, keeperZone: setup.keeperZone };
    }
    return { outcome: 'gol', shot, keeperZone: setup.keeperZone };
  },
  simulate(setup) {
    // a habilidade escolhe um canto e uma força razoável; quem finaliza mal erra a força com mais frequência
    const rng = createRng(seedToState(`sim:${setup.noise[0]}:${setup.skill}`));
    const wobble = (100 - setup.skill) / 250;
    return { x: setup.simAim[0], y: setup.simAim[1], power: clamp(0.62 + (rng.next() * 2 - 1) * wobble, 0, 1) };
  },
};
