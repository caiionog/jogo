import { useState } from 'react';
import { GAME_CONTENT } from '../../content';
import { PLAYER_ID, opponentFullName, playerDivision, recordText, viewRoster } from '../../engine';
import type { GameState } from '../../engine';
import { STYLE_LABEL } from './fightUi';

const C = GAME_CONTENT;

export default function RankingPanel({ game }: { game: GameState }) {
  const ranked = C.fighting.orgs.filter((o) => o.rankingSize > 0);
  const contract = ranked.find((o) => o.id === game.fighter.orgId);
  const [orgId, setOrgId] = useState(contract?.id ?? 'titan');
  const div = playerDivision(game, C);
  const roster = viewRoster(game, orgId, div.id, C);
  if (!roster) return null;
  const org = C.fighting.orgs.find((o) => o.id === orgId)!;
  const npc = (id: string) => roster.npcs.find((n) => n.id === id);
  const row = (id: string, pos: string) => {
    const isMe = id === PLAYER_ID;
    const n = npc(id);
    return (
      <li
        key={id}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isMe ? 'border border-emerald-500 bg-emerald-500/15' : 'bg-slate-900/60'}`}
        data-testid={isMe ? 'ranking-me' : undefined}
      >
        <span className="w-8 shrink-0 text-center font-bold text-slate-400">{pos}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate">{isMe ? `${game.character.name} (você)` : n ? opponentFullName(n) : id}</span>
          {n && (
            <span className="text-[11px] text-slate-500">
              {recordText(n.record)} · {STYLE_LABEL[n.style]} · {n.age} anos
            </span>
          )}
          {isMe && <span className="text-[11px] text-slate-400">{recordText(game.fighter.pro)} profissional</span>}
        </span>
      </li>
    );
  };
  return (
    <div className="flex flex-col gap-3" data-testid="ranking-panel">
      <div className="flex gap-2 overflow-x-auto">
        {ranked.map((o) => (
          <button
            key={o.id}
            onClick={() => setOrgId(o.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${o.id === orgId ? 'bg-emerald-500 font-bold text-slate-950' : 'border border-slate-700 text-slate-300'}`}
          >
            {o.short}
          </button>
        ))}
      </div>
      <div>
        <h2 className="font-bold">{org.name}</h2>
        <p className="text-xs text-slate-400">
          {div.label} (até {div.limitKg} kg) · top {org.rankingSize}
          {!game.world.rosters[`${org.id}:${div.id}`] && ' · prévia (o elenco ganha vida quando você chegar lá)'}
        </p>
      </div>
      <ul className="flex flex-col gap-1">
        {roster.champion && row(roster.champion, '🏆')}
        {roster.ranking.map((id, i) => row(id, `#${i + 1}`))}
      </ul>
    </div>
  );
}
