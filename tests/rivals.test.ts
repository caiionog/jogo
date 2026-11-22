import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import { acceptOffer, addRelation, autoFinishFight, closeFight, createPerson, createRng, emptyRecord, generateOffers, relationsOf, signWith } from '../src/engine';
import type { GameState } from '../src/engine';
import { fighterGame } from './fightHelpers';

const C = GAME_CONTENT;

function signed(skills: Record<string, number>, seed: string): GameState {
  const g = fighterGame(26, skills, { amateur: { ...emptyRecord(), wins: 5 }, reputation: 30, gymId: 'gen_bairro' }, seed);
  return generateOffers(signWith(g, 'arc', C), createRng(seed.length * 31 + 7), C);
}

describe('rivais do mundo da luta (Etapa 6)', () => {
  it('quem te nocauteia vira rival, ligado ao NPC do elenco', () => {
    const weak = { trocacao: 8, jiujitsu: 10, athletic: 20, chin: 5 };
    let found = false;
    for (let i = 0; i < 60 && !found; i++) {
      const g = signed(weak, `fraco-${i}`);
      const o = g.fighter.offers.find((x) => x.orgId === 'arc' && x.opponent.id.startsWith('n'));
      if (!o) continue;
      const r = closeFight(autoFinishFight(acceptOffer(g, o.id, {}, C), C));
      const last = r.fighter.history.at(-1)!;
      if (last.result === 'L' && (last.method === 'KO' || last.method === 'TKO')) {
        const rival = relationsOf(r, ['rival']).find(({ person }) => person.npcId === o.opponent.id);
        expect(rival).toBeDefined();
        found = true;
      }
    }
    expect(found).toBe(true);
  });

  it('nocautear o rival conta para "Acerto de contas"', () => {
    const strong = { trocacao: 96, jiujitsu: 60, athletic: 95, chin: 95 };
    let ko = false;
    for (let i = 0; i < 80 && !ko; i++) {
      let g = signed(strong, `forte-${i}`);
      const o = g.fighter.offers.find((x) => x.orgId === 'arc' && x.opponent.id.startsWith('n'));
      if (!o) continue;
      let p;
      [g, p] = createPerson(g, createRng(i), C, { age: 27, name: o.opponent.name, npcId: o.opponent.id });
      g = addRelation(g, p.id, 'rival', 10);
      const r = closeFight(autoFinishFight(acceptOffer(g, o.id, {}, C), C));
      const last = r.fighter.history.at(-1)!;
      if (last.result === 'W' && (last.method === 'KO' || last.method === 'TKO')) {
        expect(r.feats.koRival).toBe(1);
        ko = true;
      } else expect(r.feats.koRival ?? 0).toBe(0);
    }
    expect(ko).toBe(true);
  });
});
