import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import {
  ADULT_INTERACTIONS,
  groupActivities,
  groupBlockReason,
  hangOutAll,
  commitCrime,
  startPlan,
  startTrafficking,
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
  crimeMinor: number;
  /** release 0.0.3: cena `intimo` com menor de 18 (personagem ou parceiro) ou com a opção desligada. */
  intimateScene: number;
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

const SERIOUS = new Set(C.crime.crimes.filter((c) => c.tier !== 'leve').map((c) => `crime:${c.id}`));
const ADULT_CRIME_EVENTS = new Set(C.events.filter((e) => /joinFaction|planTeam|planGo|stopTrafficking|factionDebt|"faction":true|"trafficking":true|"planning":true/.test(JSON.stringify(e))).map((e) => e.id));

/** Menores: nenhum delito médio/grave, facção, tráfico, plano ou evento de crime adulto. */
function checkCrime(s: GameState, v: Violations) {
  if (s.character.age >= 18 || !s.alive) return;
  if (s.crime.faction || s.crime.trafficking || s.crime.plan) v.crimeMinor++;
  if (Object.keys(s.yearUses).some((k) => SERIOUS.has(k))) v.crimeMinor++;
  if (s.crime.record.length) v.crimeMinor++;
  if (s.pendingEvents.some((p) => ADULT_CRIME_EVENTS.has(p.eventId))) v.crimeMinor++;
}

/** Cena íntima do ano: nunca com personagem < 18, opção desligada ou parceiro(a) atual < 18. */
function checkScene(s: GameState, v: Violations) {
  const sc = s.scene;
  if (!sc || sc.kind !== 'intimo' || sc.year !== s.year) return;
  if (s.character.age < 18) v.intimateScene++;
  if (!s.relationships.settings.adultContent) v.intimateScene++;
  const p = currentPartner(s);
  if (p && p.person.age < 18) v.intimateScene++;
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
    const v: Violations = { adultMinor: 0, adultOff: 0, adultPartnerMinor: 0, teenPartnerRange: 0, adultActionMinor: 0, crimeMinor: 0, intimateScene: 0 };
    let adultSeen = 0;
    let teenRomances = 0;
    let scenesSeen = 0;
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
        checkCrime(s, v);
        checkScene(s, v);
        let guard = 0;
        while (s.pendingEvents.length && guard++ < 10) {
          const p = s.pendingEvents[0]!;
          if (adultIds.has(p.eventId)) adultSeen++;
          const ev = C.events.find((e) => e.id === p.eventId)!;
          s = resolveEvent(s, ev.id, rng.pick(ev.choices).id, C);
          checkPending(s, v);
          checkCrime(s, v);
        }
        // crime (release 0.0.2): tenta todos os delitos, o tráfico e o plano de qualquer jeito (o motor deve bloquear)
        if (!s.pendingEvents.length && s.alive && s.character.age >= 12 && s.character.age < 18 && y % 3 === 0) {
          for (const c of C.crime.crimes) s = c.plan ? startPlan(s, c.id, C) : commitCrime(s, c.id, C);
          s = startTrafficking(s, 'pequeno');
          checkCrime(s, v);
          let g3 = 0;
          while (s.pendingEvents.length && g3++ < 8) {
            const ev = C.events.find((e) => e.id === s.pendingEvents[0]!.eventId)!;
            s = resolveEvent(s, ev.id, rng.pick(ev.choices).id, C);
            checkCrime(s, v);
          }
        }
        // release 0.0.3: passar tempo com todos (eventos de grupo, casais NPC × NPC)
        if (!s.pendingEvents.length && s.alive && y % 2 === 0) {
          const act = groupActivities(s, C).find((a) => groupBlockReason(s, a.id, C) === null);
          if (act) {
            s = hangOutAll(s, act.id, C);
            let g4 = 0;
            while (s.pendingEvents.length && g4++ < 5) {
              const ev = C.events.find((e) => e.id === s.pendingEvents[0]!.eventId)!;
              if (adultIds.has(ev.id)) adultSeen++;
              checkPending(s, v);
              s = resolveEvent(s, ev.id, rng.pick(ev.choices).id, C);
            }
            for (const p of s.relationships.people) {
              const other = typeof p.flags.casal_com === 'string' ? s.relationships.people.find((q) => q.id === p.flags.casal_com) : undefined;
              // casal NPC × NPC: menor com adulto só é tolerável como envelhecimento natural (diferença ≤ 2 anos)
              if (other && (p.age < 18) !== (other.age < 18) && Math.abs(p.age - other.age) > 2) v.teenPartnerRange++;
            }
          }
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
              checkScene(s, v);
              if (s.scene?.kind === 'intimo' && s.scene !== before.scene) scenesSeen++;
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
    expect(v).toEqual({ adultMinor: 0, adultOff: 0, adultPartnerMinor: 0, teenPartnerRange: 0, adultActionMinor: 0, crimeMinor: 0, intimateScene: 0 });
    // a simulação de fato exercitou os dois lados
    expect(adultSeen).toBeGreaterThan(50);
    expect(teenRomances).toBeGreaterThan(50);
    expect(scenesSeen).toBeGreaterThan(50);
  }, 240_000);
});

// ---------------------------------------------------------------------------
// release 0.0.1: interações com amizades, colegas, treinadores e professores + vida noturna
// ---------------------------------------------------------------------------
import { FLIRT_TYPES, VENUES_FOR_TEST, addRelation, createPerson, goOut, isValidPartnerAge } from './adultSafetyHelpers';

describe('conteúdo adulto (release 0.0.1): 1000 vidas com flerte, noite juntos e vida noturna', () => {
  it('nenhuma interação sexual com menor de 18, com professor da escola durante a escola ou com a opção desligada', () => {
    const v = { sexMinor: 0, sexOff: 0, sexTeacher: 0, flirtRange: 0, flirtTeacher: 0, stripBlocked: 0, adultEvent: 0 };
    let nightSeen = 0;
    let flirtSeen = 0;
    for (let i = 0; i < 1000; i++) {
      const rng = createRng(9000 + i);
      const on = i % 3 !== 0;
      let s = newGame({ seed: `safe2-${i}`, name: 'Teste Seguro', sex: i % 2 ? 'M' : 'F', adultContent: on }, C);
      // pessoas injetadas: amizade adolescente, colega adolescente, professor da escola (adulto) e amizade adulta
      const inject = (age: number, type: (typeof FLIRT_TYPES)[number], flags: Record<string, boolean> = {}) => {
        let p;
        [s, p] = createPerson(s, rng, C, { age, flags });
        s = addRelation(s, p.id, type, 60);
      };
      for (let y = 0; y < 26 && s.alive; y++) {
        if (y === 12) {
          inject(rng.int(14, 17), 'amigo');
          inject(rng.int(14, 17), 'colega_treino');
          inject(rng.int(30, 55), 'professor', { professor_escola: true });
          inject(rng.int(19, 30), 'amigo');
        }
        s = advanceYear({ ...s, pendingEvents: [] }, C);
        s = { ...s, pendingEvents: [] };
        // vida noturna em todos os locais (o motor bloqueia o que não pode)
        for (const venue of VENUES_FOR_TEST) {
          const before = s;
          s = goOut(s, venue.id, C);
          const adultAllowed = s.character.age >= 18 && s.relationships.settings.adultContent;
          if (venue.adult && s !== before && !adultAllowed) v.stripBlocked++;
          for (const p of s.pendingEvents) if (adultIds.has(p.eventId) && !adultAllowed) v.adultEvent++;
          while (s.pendingEvents.length) {
            const ev = C.events.find((e) => e.id === s.pendingEvents[0]!.eventId)!;
            s = resolveEvent(s, ev.id, rng.pick(ev.choices).id, C);
          }
        }
        // flerte e noite juntos com todo mundo que der
        for (const { person, rel } of relationsOf(s, [...FLIRT_TYPES])) {
          const a = s.character.age;
          const teacherDuringSchool = !!person.flags.professor_escola && !!s.education.current;
          const allowed = applicableInteractions(s, person, rel);
          if (allowed.includes('night_together')) {
            if (a < 18 || person.age < 18) v.sexMinor++;
            if (!s.relationships.settings.adultContent) v.sexOff++;
            if (teacherDuringSchool) v.sexTeacher++;
          }
          if (allowed.includes('flirt')) {
            if (!isValidPartnerAge(a, person.age)) v.flirtRange++;
            if (person.flags.professor_escola) v.flirtTeacher++;
          }
          for (const kind of ['flirt', 'night_together'] as InteractionKind[]) {
            const forbidden = kind === 'night_together' ? a < 18 || person.age < 18 || !s.relationships.settings.adultContent || teacherDuringSchool : !isValidPartnerAge(a, person.age) || !!person.flags.professor_escola;
            const before = s;
            s = interact(s, person.id, kind, C);
            if (s !== before) {
              if (kind === 'night_together') nightSeen++;
              else flirtSeen++;
              if (forbidden) v[kind === 'night_together' ? 'sexMinor' : 'flirtRange']++;
            }
            while (s.pendingEvents.length) {
              const ev = C.events.find((e) => e.id === s.pendingEvents[0]!.eventId)!;
              s = resolveEvent(s, ev.id, rng.pick(ev.choices).id, C);
            }
          }
        }
      }
    }
    expect(v).toEqual({ sexMinor: 0, sexOff: 0, sexTeacher: 0, flirtRange: 0, flirtTeacher: 0, stripBlocked: 0, adultEvent: 0 });
    expect(nightSeen).toBeGreaterThan(50);
    expect(flirtSeen).toBeGreaterThan(50);
  }, 400_000);
});
