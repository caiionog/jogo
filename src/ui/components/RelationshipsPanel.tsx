import { useState } from 'react';
import { GAME_CONTENT } from '../../content';
import { STAGE_LABEL, civilStatus, meetBlockReason, relLabel } from '../../engine';
import type { GameState, MeetMode, Person, RelType, Relation } from '../../engine';
import { useGameStore } from '../store';
import { Bar } from './fightUi';
import PersonSheet from './PersonSheet';

const GROUPS: { title: string; emoji: string; types: RelType[] }[] = [
  { title: 'Família', emoji: '🏠', types: ['pai', 'mae', 'irmao'] },
  { title: 'Amor', emoji: '❤️', types: ['parceiro', 'conjuge', 'ex'] },
  { title: 'Filhos', emoji: '🧸', types: ['filho'] },
  { title: 'Amigos', emoji: '🤝', types: ['amigo', 'colega_treino', 'treinador'] },
  { title: 'Rivais', emoji: '⚔️', types: ['rival'] },
];

const MEET_REASON: Record<string, string> = {
  'too-young': 'A partir dos 14 anos',
  'app-adult': 'Só a partir dos 18',
  taken: 'Você já está com alguém',
  'no-energy': 'Sem energia',
  busy: 'Resolva o evento',
  dead: '—',
};

const CIVIL: Record<string, string> = {
  solteiro: 'Solteiro(a)',
  ficando: 'Ficando',
  namorando: 'Namorando',
  noivo: 'Noivo(a)',
  casado: 'Casado(a)',
  divorciado: 'Divorciado(a)',
};

function Row({ person, rel, onOpen }: { person: Person; rel: Relation; onOpen: () => void }) {
  const label = rel.romance ? `${relLabel(rel.type, person.sex)} · ${STAGE_LABEL[rel.romance.stage]}` : relLabel(rel.type, person.sex);
  return (
    <li>
      <button onClick={onOpen} className="flex w-full items-center gap-3 rounded-xl bg-slate-900/70 px-3 py-2.5 text-left active:bg-slate-800" data-testid="person-row">
        <span className="text-xl">{!person.alive ? '🕯️' : person.sex === 'M' ? (person.age < 13 ? '👦' : person.age >= 60 ? '👴' : '👨') : person.age < 13 ? '👧' : person.age >= 60 ? '👵' : '👩'}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{person.name}</span>
          <span className="text-[11px] text-slate-400">
            {label} · {person.alive ? `${person.age} ${person.age === 1 ? 'ano' : 'anos'}` : `faleceu aos ${person.deathAge ?? person.age}`}
          </span>
        </span>
        {person.alive && (
          <span className="w-20 shrink-0">
            <Bar value={rel.affection} color={rel.affection >= 70 ? 'bg-emerald-500' : rel.affection >= 40 ? 'bg-amber-400' : 'bg-rose-500'} className="h-1.5" />
            <span className="mt-0.5 block text-right text-[10px] tabular-nums text-slate-500">afeto {rel.affection}</span>
          </span>
        )}
      </button>
    </li>
  );
}

export default function RelationshipsPanel({ game }: { game: GameState }) {
  const meet = useGameStore((s) => s.meet);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const rs = game.relationships;
  const pairs = rs.relations
    .map((rel) => ({ rel, person: rs.people.find((p) => p.id === rel.personId) }))
    .filter((x): x is { rel: Relation; person: Person } => !!x.person);
  const meetBtn = (mode: MeetMode, label: string) => {
    const reason = meetBlockReason(game, mode);
    return (
      <button
        disabled={reason !== null}
        onClick={() => meet(mode)}
        className="flex flex-1 flex-col items-center rounded-xl border border-pink-700/60 bg-pink-500/10 px-2 py-2 text-sm disabled:opacity-40"
      >
        <span>{label}</span>
        <span className="text-[10px] text-slate-400">{reason ? MEET_REASON[reason] : '⚡ 1'}</span>
      </button>
    );
  };
  const open = openId ? pairs.find((x) => x.person.id === openId) : undefined;

  return (
    <div className="flex flex-col gap-4" data-testid="relationships-panel">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Estado civil: <b className="text-slate-200">{CIVIL[civilStatus(game)]}</b></span>
        <span>{pairs.filter((x) => x.person.alive).length} pessoas</span>
      </div>
      <div className="flex gap-2">
        {meetBtn('social', '💘 Conhecer alguém')}
        {meetBtn('app', '📱 App de namoro')}
      </div>

      {GROUPS.map((g) => {
        const items = pairs
          .filter((x) => g.types.includes(x.rel.type))
          .sort((a, b) => Number(b.person.alive) - Number(a.person.alive) || g.types.indexOf(a.rel.type) - g.types.indexOf(b.rel.type) || b.rel.affection - a.rel.affection);
        if (!items.length) return null;
        return (
          <section key={g.title}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {g.emoji} {g.title}
            </h2>
            <ul className="flex flex-col gap-1.5">
              {items.map(({ person, rel }) => (
                <Row key={person.id} person={person} rel={rel} onOpen={() => setOpenId(person.id)} />
              ))}
            </ul>
          </section>
        );
      })}

      {rs.archived.length > 0 && (
        <section>
          <button onClick={() => setShowArchived((v) => !v)} className="text-xs text-slate-400 underline" aria-expanded={showArchived}>
            {showArchived ? 'Esconder' : 'Ver'} pessoas do passado ({rs.archived.length})
          </button>
          {showArchived && (
            <ul className="mt-2 flex flex-col gap-1 text-xs text-slate-400">
              {rs.archived
                .slice()
                .reverse()
                .map((a, i) => (
                  <li key={i} className="rounded-lg bg-slate-900/50 px-3 py-1.5">
                    <b className="text-slate-300">{a.name}</b> · {relLabel(a.type, 'M').replace('Marido', 'Cônjuge')} — {a.note}
                  </li>
                ))}
            </ul>
          )}
        </section>
      )}

      {open && <PersonSheet game={game} person={open.person} rel={open.rel} traits={GAME_CONTENT.relationships.traits} onClose={() => setOpenId(null)} />}
    </div>
  );
}
