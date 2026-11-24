/**
 * Minigames de finalização, passe, goleiro e MMA (release 0.0.4, fase 7). Todos puros, com RNG próprio no `setup`.
 */
import { createRng, seedToState } from '../core/rng';
import type {
  GoalieInput, GoalieResult, GoalieSetup, MinigameDef, MmaAnswer, MmaAttack, MmaInput, MmaResult, MmaSetup,
  PassInput, PassLane, PassResult, PassSetup, ShotInput, ShotResult, ShotSetup,
} from './types';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Finalização: um marcador vai e volta; pare dentro da brecha que o goleiro deixou. */
export const SHOT: MinigameDef<ShotSetup, ShotInput, ShotResult> = {
  kind: 'shot',
  label: 'Finalização',
  tutorial: 'O marcador corre de um lado para o outro. Toque quando ele estiver dentro da brecha verde para chutar no canto.',
  setup(seed, ctx) {
    const rng = createRng(seedToState(`${seed}:finalizacao`));
    const skill = clamp(ctx.skill, 0, 100);
    return {
      gap: rng.pick([0.12, 0.2, 0.8, 0.88]),
      width: clamp(0.1 + skill / 700 - ctx.opponent / 1500 - ctx.pressure * 0.03, 0.06, 0.25),
      noise: rng.next() * 2 - 1,
      spread: clamp(0.06 - skill / 2500 + ctx.pressure * 0.04, 0.01, 0.1),
      skill,
    };
  },
  resolve(setup, input) {
    const landed = Math.round(clamp(input.at + setup.noise * setup.spread, 0, 1) * 1000) / 1000;
    return { success: Math.abs(landed - setup.gap) <= setup.width / 2, landed };
  },
  simulate(setup) {
    const rng = createRng(seedToState(`sim:shot:${setup.noise}:${setup.skill}`));
    return { at: clamp(setup.gap + (rng.next() * 2 - 1) * (0.05 + (100 - setup.skill) / 600), 0, 1) };
  },
};

/** Passe: três companheiros, cada um com distância e marcação; escolha e acerte a força. */
export const PASS: MinigameDef<PassSetup, PassInput, PassResult> = {
  kind: 'pass',
  label: 'Passe',
  tutorial: 'Escolha o companheiro (o marcador perto dele aparece na tela) e pare a barra de força na medida da distância.',
  setup(seed, ctx) {
    const rng = createRng(seedToState(`${seed}:passe`));
    const lane = (): PassLane => ({ distance: Math.round((0.25 + rng.next() * 0.65) * 100) / 100, marker: Math.round(clamp(rng.next() * (0.6 + ctx.opponent / 200), 0, 1) * 100) / 100 });
    return { lanes: [lane(), lane(), lane()], tolerance: clamp(0.07 + ctx.skill / 900 - ctx.pressure * 0.02, 0.05, 0.2), cutRoll: rng.next(), skill: clamp(ctx.skill, 0, 100) };
  },
  resolve(setup, input) {
    const lane = setup.lanes[Math.max(0, Math.min(2, Math.round(input.lane)))]!;
    const diff = input.power - lane.distance;
    if (diff > setup.tolerance) return { success: false, outcome: 'forte' };
    if (diff < -setup.tolerance) return { success: false, outcome: 'fraco' };
    // marcador perto e passe longo: maior chance de corte
    if (setup.cutRoll < lane.marker * 0.7 * (0.5 + lane.distance / 2)) return { success: false, outcome: 'cortado' };
    return { success: true, outcome: 'certo' };
  },
  simulate(setup) {
    const best = setup.lanes.map((l, i) => ({ i, risk: l.marker * (0.5 + l.distance / 2) })).sort((a, b) => a.risk - b.risk)[setup.skill >= 50 ? 0 : 1]!.i;
    const rng = createRng(seedToState(`sim:pass:${setup.cutRoll}:${setup.skill}`));
    return { lane: best, power: clamp(setup.lanes[best]!.distance + (rng.next() * 2 - 1) * (0.04 + (100 - setup.skill) / 700), 0, 1) };
  },
};

/** Goleiro: o batedor dá uma dica (às vezes falsa); escolha o canto do pulo. */
export const GOALIE: MinigameDef<GoalieSetup, GoalieInput, GoalieResult> = {
  kind: 'goalie',
  label: 'Defesa de pênalti',
  tutorial: 'Observe a dica do batedor e toque no canto para onde vai pular. Pular certo nem sempre basta: o chute pode ser no ângulo.',
  setup(seed, ctx) {
    const rng = createRng(seedToState(`${seed}:goleiro`));
    const shotZone = rng.int(0, 5);
    // a dica é verdadeira mais vezes quando o batedor é fraco ou está nervoso
    const honest = rng.chance(clamp(0.45 + ctx.pressure * 0.2 - ctx.opponent / 400, 0.25, 0.7));
    const tellZone = honest ? shotZone : (shotZone + rng.int(1, 5)) % 6;
    return { shotZone, tellZone, reach: clamp(0.45 + ctx.skill / 200, 0.4, 0.92), roll: rng.next(), miss: rng.chance(0.08), skill: clamp(ctx.skill, 0, 100) };
  },
  resolve(setup, input) {
    if (setup.miss) return { success: true, outcome: 'fora', shotZone: setup.shotZone };
    const sameCol = input.zone % 3 === setup.shotZone % 3;
    const exact = input.zone === setup.shotZone;
    const reach = exact ? setup.reach : sameCol ? setup.reach * 0.45 : 0;
    return setup.roll < reach ? { success: true, outcome: 'defesa', shotZone: setup.shotZone } : { success: false, outcome: 'gol', shotZone: setup.shotZone };
  },
  simulate(setup) {
    // quem é bom lê o batedor: segue a dica, mas desconfia às vezes
    const rng = createRng(seedToState(`sim:goalie:${setup.roll}:${setup.skill}`));
    return { zone: rng.chance(0.5 + setup.skill / 300) ? setup.tellZone : rng.int(0, 5) };
  },
};

/** Resposta certa para cada golpe. */
export const MMA_COUNTER: Record<MmaAttack, MmaAnswer> = { jab: 'esquiva', chute: 'bloqueio', queda: 'sprawl' };

/** MMA: três trocas; leia o golpe que o oponente telegrafa e escolha a resposta. Vence com 2 de 3. */
export const MMA: MinigameDef<MmaSetup, MmaInput, MmaResult> = {
  kind: 'mma',
  label: 'Sparring de MMA',
  tutorial: 'O oponente dá sinais antes de atacar. Jab: esquive. Chute: bloqueie. Queda: faça o sprawl. Vence quem ganhar 2 de 3 trocas.',
  setup(seed, ctx) {
    const rng = createRng(seedToState(`${seed}:mma`));
    const types: MmaAttack[] = ['jab', 'chute', 'queda'];
    const attacks = [rng.pick(types), rng.pick(types), rng.pick(types)] as MmaSetup['attacks'];
    // oponente melhor disfarça mais; habilidade lê melhor
    const honesty = clamp(0.75 - ctx.opponent / 400 + ctx.skill / 500, 0.4, 0.92);
    const tells = attacks.map((a) => (rng.chance(honesty) ? a : rng.pick(types.filter((t) => t !== a)))) as MmaSetup['tells'];
    return { attacks, tells, skill: clamp(ctx.skill, 0, 100) };
  },
  resolve(setup, input) {
    const rounds = setup.attacks.map((a, i) => input.answers[i] === MMA_COUNTER[a]);
    const won = rounds.filter(Boolean).length;
    return { success: won >= 2, won, rounds };
  },
  simulate(setup) {
    const rng = createRng(seedToState(`sim:mma:${setup.tells.join('')}:${setup.skill}`));
    const answers = setup.tells.map((t) => (rng.chance(0.6 + setup.skill / 300) ? MMA_COUNTER[t] : rng.pick(['esquiva', 'bloqueio', 'sprawl'] as MmaAnswer[]))) as MmaInput['answers'];
    return { answers };
  },
};
