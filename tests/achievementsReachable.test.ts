import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import { achievementMet, emptyMeta, emptyRecord, killCharacter } from '../src/engine';
import type { GameState, MetaState } from '../src/engine';
import { adult } from './ecoHelpers';
import { withPerson } from './relHelpers';

const C = GAME_CONTENT;

/** Um estado (alcançável no jogo) que satisfaz cada conquista: prova que nenhuma é impossível. */
function stateFor(id: string): { s: GameState; meta?: MetaState } {
  let s = adult(40, 50000, `ach-${id}`);
  const f = s.fighter;
  const feats = (x: Record<string, number>) => ({ ...s, feats: { ...s.feats, ...x } });
  const flags = (x: Record<string, boolean | number | string>) => ({ ...s, flags: { ...s.flags, ...x } });
  const pro = (wins: number, losses = 0) => ({ ...s, fighter: { ...f, pro: { ...emptyRecord(), wins, losses } } });
  switch (id) {
    case 'formatura': return { s };
    case 'medalha_escolar': return { s: flags({ medalha_interescolar: true }) };
    case 'expulso_formado': return { s: flags({ expulso: true }) };
    case 'primeiro_beijo': return { s: flags({ primeiro_beijo: true }) };
    case 'turma': for (let i = 0; i < 5; i++) [s] = withPerson(s, 'amigo', 30 + i); return { s };
    case 'primeira_vitoria': case 'estreia_pro': return { s: pro(1) };
    case 'primeira_finalizacao': return { s: { ...s, fighter: { ...f, pro: { ...emptyRecord(), wins: 1, winsBy: { KO: 0, SUB: 1, DEC: 0 } } } } };
    case 'primeiro_ko': return { s: { ...s, fighter: { ...f, pro: { ...emptyRecord(), wins: 1, winsBy: { KO: 1, SUB: 0, DEC: 0 } } } } };
    case 'dez_pro': return { s: pro(10) };
    case 'vinte_cinco_pro': return { s: pro(25) };
    case 'invicto_10': return { s: feats({ maxUnbeaten: 10 }) };
    case 'faixa_roxa': case 'faixa_preta': return { s: { ...s, fighter: { ...f, belt: { rank: 4, years: 1 } } } };
    case 'campeao_regional': return { s: feats({ regionalTitles: 1 }) };
    case 'campeao_tita': return { s: feats({ majorTitles: 1 }) };
    case 'tres_defesas': return { s: feats({ titleDefenses: 3 }) };
    case 'ko_rival': return { s: feats({ koRival: 1 }) };
    case 'lenda': return { s: { ...s, fighter: { ...f, reputation: 92 } } };
    case 'veterano_40': return { s: feats({ oldestFightAge: 41 }) };
    case 'invicto_aposentado': return { s: { ...s, fighter: { ...f, pro: { ...emptyRecord(), wins: 7 }, retired: { age: 33, reason: 'voluntaria', comebacks: 0 } } } };
    case 'despedida': return { s: feats({ farewellWin: 1 }) };
    case 'volta': return { s: feats({ comebacks: 1 }) };
    case 'cirurgia': return { s: feats({ surgeries: 1 }) };
    case 'colecao_lesoes': return { s: { ...s, health: { ...s.health, history: Array.from({ length: 8 }, (_, i) => ({ age: 20 + i, defId: 'distensao', source: 'luta' as const })) } } };
    case 'aposentou_inteiro': return { s: feats({ retiredHealthy: 1 }) };
    case 'cortado': return { s: feats({ contractCuts: 1 }) };
    case 'oitenta_saudavel': return { s: { ...s, character: { ...s.character, age: 82, stats: { ...s.character.stats, health: 70 } } } };
    case 'centenario': return { s: { ...s, character: { ...s.character, age: 100 } } };
    case 'casou': case 'para_sempre': {
      s = flags({ casado: true });
      return { s: id === 'para_sempre' ? killCharacter(s, 'causas naturais', C) : s };
    }
    case 'familia_grande': for (let i = 0; i < 3; i++) [s] = withPerson(s, 'filho', 5 + i); return { s };
    case 'casa_propria': return { s: { ...s, economy: { ...s.economy, assets: [{ id: 'a1', kind: 'imovel', catalogId: 'apartamento', name: 'Apartamento', value: 300000, paid: 315000, boughtYear: s.year, home: true }] } } };
    case 'milionario': return { s: { ...s, money: 1_200_000 } };
    case 'dez_milhoes': return { s: { ...s, money: 10_500_000 } };
    case 'milionario_jovem': return { s: { ...s, money: 1_100_000, character: { ...s.character, age: 29 } } };
    case 'academia_propria': return { s: { ...s, economy: { ...s.economy, businesses: [{ id: 'b1', defId: 'academia', name: 'Academia', level: 1, cash: 30000, reputation: 40, manager: false, dedicatedYear: -1, years: 1, lastProfit: 0, profits: [] }] } } };
    case 'tres_empresas': return { s: feats({ businessesOpened: 3 }) };
    case 'fenix': return { s: { ...flags({ falencia: 1 }), money: 250000 } };
    case 'garoto_propaganda': return { s: { ...s, economy: { ...s.economy, sponsors: ['a', 'b', 'c'].map((x) => ({ sponsorId: x, yearsLeft: 2, amount: 10000 })) } } };
    case 'comentarista': return { s: { ...s, economy: { ...s.economy, job: { jobId: 'comentarista', level: 1, performance: 50, years: 1 } } } };
    case 'testamento': return { s: { ...s, economy: { ...s.economy, will: { shares: { x: 100 }, year: s.year } } } };
    case 'segunda_geracao': return { s: { ...s, dynasty: { ...s.dynasty, generation: 2 } } };
    case 'cinco_geracoes': return { s: { ...s, dynasty: { ...s.dynasty, generation: 5 } } };
    case 'tres_geracoes_lutadores': case 'filho_campeao': case 'dinastia_tita': {
      const member = { name: 'Antepassado', sex: 'M' as const, gen: 1, born: 1950, died: 2020, ageAtDeath: 70, cause: '—', score: 60, record: '20-5-0', titles: ['Circuito Titã'], belt: 4, peakRep: 90, children: [] };
      s = { ...s, dynasty: { ...s.dynasty, generation: 3, members: [member, { ...member, gen: 2 }] }, fighter: { ...f, pro: { ...emptyRecord(), wins: 3 } } };
      return { s: { ...s, feats: { ...s.feats, majorTitles: 1 } } };
    }
    case 'academia_herdada': return { s: flags({ academia_herdada: true }) };
    case 'vida_exemplar': {
      s = { ...s, money: 20_000_000, character: { ...s.character, age: 95, stats: { ...s.character.stats, happiness: 95 } }, feats: { ...s.feats, majorTitles: 3, titleDefenses: 3, peakRep: 95 }, fighter: { ...f, pro: { ...emptyRecord(), wins: 30 }, belt: { rank: 4, years: 3 } } };
      s = { ...flags({ casado: true }) };
      [s] = withPerson(s, 'conjuge', 90, { stage: 'casados' });
      for (let i = 0; i < 3; i++) [s] = withPerson(s, 'filho', 60 + i);
      return { s: killCharacter(s, 'causas naturais', C) };
    }
    case 'hall_cinco': {
      const meta = emptyMeta();
      const h = { id: 'x', name: 'X', sex: 'M' as const, generation: 1, dynasty: 'X', born: 1, died: 2, age: 1, cause: '', score: 1, record: '0-0-0', titles: [], netWorth: 0, summary: '' };
      return { s, meta: { ...meta, hallOfFame: Array.from({ length: 5 }, (_, i) => ({ ...h, id: `h${i}` })) } };
    }
  }
  throw new Error(`sem estado de teste para "${id}"`);
}

describe('nenhuma conquista é impossível', () => {
  it.each(C.achievements.map((a) => a.id))('%s pode ser desbloqueada', (id) => {
    const def = C.achievements.find((a) => a.id === id)!;
    let { s, meta } = stateFor(id);
    if (id === 'expulso_formado') s = { ...s, education: { ...s.education, graduated: true } };
    expect(achievementMet(def, s, meta ?? emptyMeta())).toBe(true);
  });

  it('e nenhuma é trivial: um bebê recém-nascido não desbloqueia nada', async () => {
    const { newGame } = await import('../src/engine');
    const baby = newGame({ seed: 'bebe', name: 'Bebê Teste', sex: 'F' }, C);
    expect(C.achievements.filter((a) => achievementMet(a, baby, emptyMeta())).map((a) => a.id)).toEqual([]);
  });
});
