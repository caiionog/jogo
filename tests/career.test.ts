import { describe, expect, it } from 'vitest';
import { noInjuries, withInjury } from './healthHelpers';
import { GAME_CONTENT } from '../src/content';
import {
  PLAYER_ID,
  acceptOffer,
  advanceYear,
  autoFinishFight,
  chooseFightCorner,
  closeFight,
  createRng,
  declineOffer,
  emptyRecord,
  fightBlockReason,
  generateOffers,
  performAction,
  rankOf,
  signWith,
  sessionsLeft,
} from '../src/engine';
import type { GameState } from '../src/engine';
import { fighterGame } from './fightHelpers';

const strong = { trocacao: 90, jiujitsu: 90, athletic: 90, chin: 90 };

function pro(seed = 'pro', skills = strong): GameState {
  const g = fighterGame(24, skills, { amateur: { ...emptyRecord(), wins: 5 }, reputation: 30, gymId: 'gen_bairro' }, seed);
  return signWith(g, 'arc', GAME_CONTENT);
}

/** Aceita a primeira oferta da ARC e luta até o fim. */
const arcOffer = (g: GameState) => g.fighter.offers.find((o) => o.orgId === 'arc')!;
function fightFirst(g: GameState, opts = {}, content = GAME_CONTENT): GameState {
  const offer = arcOffer(g);
  return autoFinishFight(acceptOffer(g, offer.id, opts, content), content);
}

describe('ofertas', () => {
  it('criança que treina recebe ofertas kids; sem treino, nada', () => {
    const kid = fighterGame(9, {}, { gymId: 'gen_bairro' });
    const offers = generateOffers(kid, createRng(2), GAME_CONTENT).fighter.offers;
    expect(offers.length).toBeGreaterThan(0);
    expect(offers.every((o) => o.kind === 'kids' && o.rules === 'grappling')).toBe(true);
    expect(generateOffers(fighterGame(9), createRng(2), GAME_CONTENT).fighter.offers).toEqual([]);
  });

  it('amador (15+) recebe MMA amador e jiu-jitsu', () => {
    const offers = generateOffers(fighterGame(16, {}, { gymId: 'gen_bairro' }), createRng(4), GAME_CONTENT).fighter.offers;
    expect(offers.some((o) => o.orgId === 'amador_punho_de_ferro')).toBe(true);
    expect(offers.some((o) => o.orgId === 'bjj_tatame_aberto' && o.rules === 'grappling')).toBe(true);
  });

  it('profissional recebe lutas da própria liga (com adversário do elenco) e não do amador de MMA', () => {
    const offers = generateOffers(pro(), createRng(5), GAME_CONTENT).fighter.offers;
    const arc = offers.filter((o) => o.orgId === 'arc');
    expect(arc.length).toBeGreaterThan(0);
    expect(arc[0]!.opponent.id).toMatch(/^n\d+/);
    expect(arc[0]!.purse).toBeGreaterThan(0);
    expect(offers.some((o) => o.orgId === 'amador_punho_de_ferro')).toBe(false);
  });

  it('lesão grave ou suspensão bloqueiam ofertas (lesão leve não)', () => {
    const inj = pro();
    expect(generateOffers(withInjury(inj, 'lca', 12), createRng(1), GAME_CONTENT).fighter.offers).toEqual([]);
    expect(generateOffers(withInjury(inj, 'corte_supercilio', 2), createRng(1), GAME_CONTENT).fighter.offers.length).toBeGreaterThan(0);
    expect(generateOffers({ ...inj, fighter: { ...inj.fighter, suspendedYears: 1 } }, createRng(1), GAME_CONTENT).fighter.offers).toEqual([]);
  });
});

describe('luta e resultado', () => {
  const g0 = generateOffers(pro(), createRng(5), GAME_CONTENT);

  it('aceitar ocupa as sessões do camp, inicia a luta e bloqueia o resto do jogo', () => {
    const offer = arcOffer(g0);
    const g = acceptOffer(g0, offer.id, {}, GAME_CONTENT);
    expect(g.fighter.sessionsThisYear).toBe(g0.fighter.sessionsThisYear + offer.campSessions);
    expect(g.activeFight).not.toBeNull();
    expect(g.fighter.offers.some((o) => o.id === offer.id)).toBe(false);
    if (g.activeFight!.fight.phase === 'break') {
      expect(advanceYear(g, GAME_CONTENT)).toBe(g);
      expect(performAction(g, 'study', GAME_CONTENT)).toBe(g);
      expect(fightBlockReason(g, g.fighter.offers[0], GAME_CONTENT)).toBe('busy');
      const after = chooseFightCorner(g, 'ground', GAME_CONTENT);
      expect(after.activeFight!.fight.round).toBe(2);
    }
  });

  it('resultado: cartel, dinheiro, reputação, ranking, histórico e log', () => {
    const g = fightFirst(g0);
    const af = g.activeFight!;
    expect(af.applied).toBe(true);
    const won = af.fight.result!.winner === 0;
    expect(won).toBe(true); // lutador muito superior
    expect(g.fighter.pro.wins).toBe(1);
    expect(g.fighter.proDebutAge).toBe(24);
    expect(g.money).toBeGreaterThan(g0.money);
    expect(g.fighter.reputation).toBeGreaterThan(g0.fighter.reputation);
    expect(g.fighter.history.at(-1)).toMatchObject({ result: 'W', orgId: 'arc', pro: true });
    const roster = Object.values(g.world.rosters)[0]!;
    expect(rankOf(roster, PLAYER_ID)).not.toBeNull();
    expect(g.log.at(-1)!.entries.at(-1)).toMatch(/^\[ARC\] Você venceu .+'.+' .+ por /);
    expect(closeFight(g).activeFight).toBeNull();
  });

  it('derrota: cartel e reputação caem', () => {
    const weak = generateOffers(pro('fraco', { trocacao: 5, jiujitsu: 5, athletic: 5, chin: 20 }), createRng(5), GAME_CONTENT);
    const g = fightFirst(weak);
    expect(g.activeFight!.fight.result!.winner).toBe(1);
    expect(g.fighter.pro.losses).toBe(1);
    expect(g.fighter.winStreak).toBe(0);
    expect(g.fighter.reputation).toBeLessThan(weak.fighter.reputation);
    expect(g.log.at(-1)!.entries.join(' ')).toMatch(/Você perdeu para/);
  });

  it('é determinístico', () => {
    expect(fightFirst(g0)).toEqual(fightFirst(g0));
  });

  it('corte agressivo pode falhar o peso: multa e evento de falha', () => {
    let missed = 0;
    for (let i = 0; i < 40; i++) {
      const g = generateOffers(pro(`cut${i}`), createRng(i), GAME_CONTENT);
      const r = acceptOffer(g, arcOffer(g).id, { aggressiveCut: true }, GAME_CONTENT);
      expect(r.activeFight!.aggressiveCut).toBe(true);
      expect(r.activeFight!.fight.fighters[0].sizeEdge).toBeGreaterThan(0);
      if (r.activeFight!.missedWeight) {
        missed++;
        expect(r.pendingEvents.some((p) => p.eventId === 'fight_weight_miss')).toBe(true);
      }
    }
    expect(missed).toBeGreaterThan(3);
    expect(missed).toBeLessThan(20);
  });

  it('recusar oferta remove da lista', () => {
    const id = g0.fighter.offers[0]!.id;
    expect(declineOffer(g0, id).fighter.offers.some((o) => o.id === id)).toBe(false);
  });

  it('lesão grave bloqueia novas lutas e passa com o tempo', () => {
    const g = withInjury(g0, 'ombro', 9);
    expect(fightBlockReason(g, g.fighter.offers[0], GAME_CONTENT)).toBe('injured');
    expect(acceptOffer(g, g.fighter.offers[0]!.id, {}, GAME_CONTENT)).toBe(g);
    // 9 meses: sara na virada do ano
    const next = advanceYear(g, GAME_CONTENT);
    expect(next.health.injuries.some((i) => i.defId === 'ombro')).toBe(false);
  });

  it('vencendo seguidas, chega ao top 3 e disputa (e ganha) o cinturão', () => {
    let g = pro('campeao');
    // 12 sessões por ano (como os 12 de energia de antes): 4 lutas por ano isolam o caminho até o cinturão
    const C12 = { ...GAME_CONTENT, limits: { ...GAME_CONTENT.limits, trainingSessions: 12 } };
    for (let year = 0; year < 12 && g.fighter.titles.length === 0; year++) {
      g = advanceYear({ ...g, pendingEvents: [] }, GAME_CONTENT);
      // ignora lesões para isolar o caminho até o cinturão
      g = noInjuries({ ...g, pendingEvents: [] });
      for (let k = 0; k < 4 && arcOffer(g) && sessionsLeft(g, C12) >= arcOffer(g).campSessions; k++) {
        g = closeFight(fightFirst(g, {}, C12));
        g = noInjuries({ ...g, pendingEvents: [] });
      }
    }
    expect(g.fighter.titles).toHaveLength(1);
    expect(g.fighter.titlesWon).toBe(1);
    const t = g.fighter.titles[0]!;
    const roster = g.world.rosters[`${t.orgId}:${t.divisionId}`]!;
    expect(roster.champion).toBe(PLAYER_ID);
    expect(g.log.flatMap((y) => y.entries).join('\n')).toMatch(/novo campeão/);
  });
});
