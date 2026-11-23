import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import {
  ADULT_INTERACTIONS,
  SEXUAL_INTERACTIONS,
  advanceYear,
  applicableInteractions,
  createRng,
  currentPartner,
  getPerson,
  interact,
  meetSomeone,
  newGame,
  relationsOf,
  resolveEvent,
} from '../src/engine';
import type { GameState, InteractionKind } from '../src/engine';

const C = GAME_CONTENT;
const adultIds = new Set(C.events.filter((e) => e.tags?.includes('adult')).map((e) => e.id));

interface Violations {
  adultMinor: number;
  adultOff: number;
  adultPartnerMinor: number;
  teenPartnerRange: number;
  adultActionMinor: number;
}

/** Verifica todo evento pendente: nenhum 'adult' com menor de 18 ou com a opção desligada. */
function checkPending(s: GameState, v: Violations) {
  for (const p of s.pendingEvents) {
    if (!adultIds.has(p.eventId)) continue;
    if (!s.relationships.settings.adultContent) v.adultOff++;
    if (s.character.age < 18) v.adultMinor++;
    const target = getPerson(s, p.vars?.pessoa_id);
    if (target && target.age < 18) v.adultPartnerMinor++;
    const partner = currentPartner(s);
    if (partner && partner.person.age < 18) v.adultPartnerMinor++;
  }
}

function checkPartner(s: GameState, v: Violations) {
  const p = currentPartner(s);
  if (!p) return;
  const a = s.character.age;
  if (a >= 14 && a <= 17) {
    if (p.person.age < 14 || p.person.age > 17 || Math.abs(p.person.age - a) > 2) v.teenPartnerRange++;
  }
}

describe('conteúdo adulto: 1000 vidas simuladas', () => {
  it('nenhum evento adult com menor de 18 (personagem ou parceiro) nem com a opção desligada; namoros adolescentes na faixa', () => {
    const v: Violations = { adultMinor: 0, adultOff: 0, adultPartnerMinor: 0, teenPartnerRange: 0, adultActionMinor: 0 };
    let adultSeen = 0;
    let teenRomances = 0;
    for (let i = 0; i < 1000; i++) {
      const rng = createRng(5000 + i);
      const on = i % 3 !== 0; // 2/3 das vidas com a opção ligada
      let s = newGame({ seed: `safe-${i}`, name: 'Teste Seguro', sex: i % 2 ? 'M' : 'F', adultContent: on }, C);
      for (let y = 0; y < 30 && s.alive; y++) {
        // alterna a opção no meio de algumas vidas
        if (y === 20 && i % 7 === 0) s = { ...s, relationships: { ...s.relationships, settings: { ...s.relationships.settings, adultContent: !s.relationships.settings.adultContent } } };
        s = advanceYear(s, C);
        checkPending(s, v);
        checkPartner(s, v);
        let guard = 0;
        while (s.pendingEvents.length && guard++ < 10) {
          const p = s.pendingEvents[0]!;
          if (adultIds.has(p.eventId)) adultSeen++;
          const ev = C.events.find((e) => e.id === p.eventId)!;
          s = resolveEvent(s, ev.id, rng.pick(ev.choices).id, C);
          checkPending(s, v);
        }
        // tenta romance e ações íntimas de qualquer jeito (o motor deve bloquear)
        if (!s.pendingEvents.length) {
          s = meetSomeone(s, rng.chance(0.5) ? 'social' : 'app', C, createRng(i * 100 + y));
          checkPartner(s, v);
          if (currentPartner(s) && s.character.age < 18) teenRomances++;
          for (const { person, rel } of relationsOf(s, ['parceiro', 'conjuge'])) {
            for (const kind of ['intimacy', 'intimacy_protected', 'try_baby', 'ask_out', 'propose', 'date'] as InteractionKind[]) {
              const allowed = applicableInteractions(s, person, rel).includes(kind);
              const forbidden = (SEXUAL_INTERACTIONS.includes(kind) && (s.character.age < 18 || person.age < 18)) || (ADULT_INTERACTIONS.includes(kind) && !s.relationships.settings.adultContent);
              if (allowed && forbidden) v.adultActionMinor++;
              const before = s;
              s = interact({ ...s }, person.id, kind, C);
              if (forbidden) {
                // ação adulta proibida: o estado não pode ter mudado
                if (s !== before && JSON.stringify({ ...s, yearUses: before.yearUses }) !== JSON.stringify(before)) v.adultActionMinor++;
              }
              checkPending(s, v);
              let g2 = 0;
              while (s.pendingEvents.length && g2++ < 5) {
                const ev = C.events.find((e) => e.id === s.pendingEvents[0]!.eventId)!;
                s = resolveEvent(s, ev.id, rng.pick(ev.choices).id, C);
              }
            }
          }
        }
      }
    }
    expect(v).toEqual({ adultMinor: 0, adultOff: 0, adultPartnerMinor: 0, teenPartnerRange: 0, adultActionMinor: 0 });
    // a simulação de fato exercitou os dois lados
    expect(adultSeen).toBeGreaterThan(50);
    expect(teenRomances).toBeGreaterThan(50);
  }, 240_000);
});
