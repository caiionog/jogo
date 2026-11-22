import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import {
  CONTRACT_CUT_LOSSES,
  STOP_EVENT_LOSSES,
  MEDICAL_VETO_BRAIN,
  PLAYER_ID,
  acceptOffer,
  advanceYear,
  applySequela,
  autoFinishFight,
  checkForcedRetirement,
  closeFight,
  createRng,
  emptyRecord,
  fightBlockReason,
  generateOffers,
  resolveEvent,
  retire,
  retireBlockReason,
  signWith,
  trainingBlockReason,
} from '../src/engine';
import type { GameState } from '../src/engine';
import { fighterGame } from './fightHelpers';

const C = GAME_CONTENT;
const strong = { trocacao: 90, jiujitsu: 90, athletic: 90, chin: 90 };

function pro(seed = 'apos'): GameState {
  const g = fighterGame(30, strong, { amateur: { ...emptyRecord(), wins: 5 }, pro: { ...emptyRecord(), wins: 8, losses: 2 }, reputation: 40, gymId: 'gen_bairro' }, seed);
  return signWith(g, 'arc', C);
}

describe('aposentadoria voluntária', () => {
  it('quem nunca lutou não tem o que aposentar', () => {
    expect(retireBlockReason(fighterGame(25))).toBe('never-fought');
  });

  it('"Aposentar" abre a despedida; cerimônia encerra contrato, ranking e ofertas', () => {
    let g = generateOffers(pro(), createRng(3), C);
    g = retire(g, C);
    expect(g.pendingEvents[0]?.eventId).toBe('retire_farewell');
    g = resolveEvent(g, 'retire_farewell', 'ceremony', C);
    expect(g.fighter.retired).toMatchObject({ age: 30, reason: 'voluntaria' });
    expect(g.fighter.orgId).toBeNull();
    expect(g.economy.contract).toBeNull();
    expect(g.fighter.offers).toEqual([]);
    for (const r of Object.values(g.world.rosters)) {
      expect(r.ranking).not.toContain(PLAYER_ID);
      expect(r.champion).not.toBe(PLAYER_ID);
    }
    expect(trainingBlockReason(g, 'sparring')).toBe('retired');
    expect(trainingBlockReason(g, 'jiujitsu')).toBeNull();
    // aposentado não recebe ofertas
    expect(generateOffers(g, createRng(4), C).fighter.offers).toEqual([]);
  });

  it('luta de despedida: aparece como oferta e, depois dela, a aposentadoria entra em vigor', () => {
    let g = retire(pro('desp'), C);
    g = resolveEvent(g, 'retire_farewell', 'fight', C);
    const offer = g.fighter.offers.find((o) => o.kind === 'farewell')!;
    expect(offer).toBeDefined();
    expect(g.fighter.retired).toBeNull();
    expect(fightBlockReason(g, offer)).toBeNull();
    g = closeFight(autoFinishFight(acceptOffer(g, offer.id, {}, C), C));
    expect(g.fighter.retired?.reason).toBe('voluntaria');
  });
});

describe('aposentadoria forçada', () => {
  it('dano cerebral alto: a comissão médica veta (definitivo)', () => {
    const g = pro();
    const r = checkForcedRetirement({ ...g, health: { ...g.health, brainDamage: MEDICAL_VETO_BRAIN } }, C);
    expect(r.fighter.retired?.reason).toBe('medica');
    expect(r.feats.forcedRetirements).toBe(1);
  });

  it('derrotas seguidas (fora do ranking): a liga corta o contrato (sem aposentar) e depois vem o "hora de parar?"', () => {
    const g = pro();
    const cut = checkForcedRetirement({ ...g, feats: { ...g.feats, curLosses: CONTRACT_CUT_LOSSES } }, C);
    expect(cut.fighter.orgId).toBeNull();
    expect(cut.economy.contract).toBeNull();
    expect(cut.fighter.retired).toBeNull();
    const six = checkForcedRetirement({ ...cut, feats: { ...cut.feats, curLosses: STOP_EVENT_LOSSES } }, C);
    expect(six.pendingEvents.map((p) => p.eventId)).toContain('retire_losing_streak');
    const stop = resolveEvent(six, 'retire_losing_streak', 'stop', C);
    expect(stop.fighter.retired?.reason).toBe('derrotas');
  });

  it('lesão grave com sequela (32+): o médico recomenda parar; aceitar aposenta por lesão', () => {
    const p = pro();
    expect(checkForcedRetirement(applySequela(p, 'joelho_instavel', C), C).pendingEvents).toEqual([]); // 30 anos: ainda não
    const g = applySequela({ ...p, character: { ...p.character, age: 32 } }, 'joelho_instavel', C);
    const r = checkForcedRetirement(g, C);
    expect(r.pendingEvents.map((p) => p.eventId)).toContain('retire_doctor');
    // não repete para a mesma sequela
    expect(checkForcedRetirement({ ...r, pendingEvents: [] }, C).pendingEvents).toEqual([]);
    const done = resolveEvent(r, 'retire_doctor', 'accept', C);
    expect(done.fighter.retired?.reason).toBe('lesao');
  });

  it('volta da aposentadoria: evento devolve o lutador (contando a volta)', () => {
    let g = resolveEvent(retire(pro(), C), 'retire_farewell', 'quiet', C);
    g = { ...g, pendingEvents: [{ eventId: 'comeback_offer', source: 'random' }] };
    g = resolveEvent(g, 'comeback_offer', 'back', C);
    expect(g.fighter.retired).toBeNull();
    expect(g.feats.comebacks).toBe(1);
    expect(trainingBlockReason(g, 'sparring')).toBeNull();
  });

  it('aposentado: a reputação decai devagar', () => {
    let g = resolveEvent(retire(pro(), C), 'retire_farewell', 'quiet', C);
    const rep = g.fighter.reputation;
    g = advanceYear(g, C);
    expect(rep - g.fighter.reputation).toBeLessThanOrEqual(1);
  });
});
