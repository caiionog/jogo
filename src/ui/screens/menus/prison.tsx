/** Prisão (release 0.0.2): banner da tela principal e as ações do ano que substituem as Atividades. */
import type { GameState, PrisonAction } from '../../../engine';
import { PRISON_TRAIN_LIMIT, prisonActionBlock, yearsLeft } from '../../../engine';
import { ListGroup, ListItem } from '../../design/components';
import { useGameStore } from '../../store';

export function PrisonBanner({ game }: { game: GameState }) {
  const p = game.prison;
  if (!p) return null;
  const left = yearsLeft(p);
  return (
    <div className="border-b border-[var(--ds-border)] bg-[var(--ds-surface-2)] px-3 py-2 text-center text-sm font-semibold" role="status" data-testid="prison-banner">
      🔒 {game.character.sex === 'M' ? 'Preso' : 'Presa'} — regime {p.regime}, {left <= 0 ? 'saindo em breve' : `falta${left === 1 ? '' : 'm'} ${left} ${left === 1 ? 'ano' : 'anos'}`}
      <span className="block text-xs font-normal text-[var(--ds-text-muted)]">{p.facility}</span>
    </div>
  );
}

const ACTIONS: { id: PrisonAction; emoji: string; title: string; sub: string }[] = [
  { id: 'trabalhar', emoji: '🔧', title: 'Trabalhar', sub: 'Uma vez por ano · desconta da pena' },
  { id: 'estudar', emoji: '📚', title: 'Estudar', sub: 'Supletivo ou curso a distância · desconta da pena' },
  { id: 'treinar', emoji: '💪', title: 'Treinar no pátio', sub: `Até ${PRISON_TRAIN_LIMIT} vezes por ano · Capacidade atlética` },
  { id: 'conversar', emoji: '🗣️', title: 'Conversar com detentos', sub: 'Conhecer gente (para o bem ou para o mal)' },
  { id: 'visita', emoji: '👪', title: 'Receber visita', sub: 'Depende de quem ainda gosta de você' },
  { id: 'quieto', emoji: '🤐', title: 'Ficar fora de confusão', sub: 'Bom comportamento ajuda a progredir de regime' },
];

export function PrisaoScreen({ game }: { game: GameState }) {
  const act = useGameStore((s) => s.prisonAction);
  return (
    <>
      <PrisonBanner game={game} />
      <ListGroup title="Ações na prisão">
        {ACTIONS.map((a) => {
          const r = prisonActionBlock(game, a.id);
          return <ListItem key={a.id} emoji={a.emoji} title={a.title} subtitle={a.sub} disabled={!!r} reason={r === 'done' ? 'Já feito este ano' : 'Resolva o acontecimento pendente'} onClick={() => act(a.id)} chevron={false} testId={`prison-${a.id}`} />;
        })}
      </ListGroup>
    </>
  );
}
