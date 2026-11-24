/** Mudar de cidade (Etapa 7): UF e cidade, com custo pelo extrato. */
import { useState } from 'react';
import { GAME_CONTENT } from '../../content';
import { MOVE_COST_OTHER_UF, MOVE_COST_SAME_UF, moveBlockReason } from '../../engine';
import Sheet from './Sheet';
import { money } from './ecoUi';
import { useGameStore } from '../store';

const REASON: Record<string, string> = { busy: 'Resolva o que está pendente antes.', 'too-young': 'Só a partir dos 18 anos.', same: 'Você já mora aqui.', 'no-money': 'Dinheiro insuficiente para a mudança.', unknown: 'Cidade desconhecida.' };

export default function MoveSheet({ onClose }: { onClose: () => void }) {
  const game = useGameStore((s) => s.game);
  const moveCity = useGameStore((s) => s.moveCity);
  const [uf, setUf] = useState(game?.character.uf ?? 'SP');
  const ufd = GAME_CONTENT.geo.ufs.find((u) => u.sigla === uf)!;
  const [city, setCity] = useState(ufd.capital);
  if (!game) return null;
  const block = moveBlockReason(game, GAME_CONTENT, uf, city);
  const cost = uf === game.character.uf ? MOVE_COST_SAME_UF : MOVE_COST_OTHER_UF;
  const cityCost = ufd.cities.find((c) => c.name === city)?.custo ?? 1;
  return (
    <Sheet title="Mudar de cidade" onClose={onClose} testId="move-sheet">
      <h2 className="mb-1 text-lg font-bold">Mudar de cidade</h2>
      <p className="mb-3 text-sm text-[var(--ds-text-muted)]">
        Hoje: {game.character.city} – {game.character.uf}. Custo de vida, salários e imóveis mudam com a cidade; academias locais ficam para trás.
      </p>
      <label className="mb-2 flex flex-col gap-1 text-sm">
        Estado
        <select value={uf} onChange={(e) => { const u = GAME_CONTENT.geo.ufs.find((x) => x.sigla === e.target.value)!; setUf(u.sigla); setCity(u.capital); }} className="min-h-11 rounded-xl border border-[var(--ds-border)] bg-[var(--ds-bg)] px-3">
          {GAME_CONTENT.geo.ufs.map((u) => (
            <option key={u.sigla} value={u.sigla}>{u.nome} ({u.sigla})</option>
          ))}
        </select>
      </label>
      <label className="mb-3 flex flex-col gap-1 text-sm">
        Cidade
        <select value={city} onChange={(e) => setCity(e.target.value)} className="min-h-11 rounded-xl border border-[var(--ds-border)] bg-[var(--ds-bg)] px-3">
          {ufd.cities.map((c) => (
            <option key={c.name} value={c.name}>{c.name}{c.name === ufd.capital ? ' (capital)' : ''}</option>
          ))}
        </select>
      </label>
      <p className="mb-3 text-sm text-[var(--ds-text)]">
        Mudança: {money.format(cost)} · custo de vida ×{cityCost.toFixed(2).replace('.', ',')}
      </p>
      {block && <p className="mb-2 text-sm text-amber-300">{REASON[block]}</p>}
      <button disabled={!!block} onClick={() => { moveCity(uf, city); onClose(); }} className="min-h-12 rounded-xl bg-emerald-500 font-bold text-[var(--ds-accent-ink)] disabled:opacity-40" data-testid="move-confirm">
        Mudar para {city}
      </button>
    </Sheet>
  );
}
