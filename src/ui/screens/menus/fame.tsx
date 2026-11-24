/**
 * Fama e redes sociais (release 0.0.4, fase 5): barra de fama, seguidores, postar e comerciais. Só lê a engine.
 */
import { GAME_CONTENT as C } from '../../../content';
import type { GameState, PostKind } from '../../../engine';
import { commercialBlockReason, commercialFee, fameLabel, fameOf, followersOf, postBlockReason, usesThisYear } from '../../../engine';
import { ListGroup, ListItem } from '../../design/components';
import { money } from '../../components/ecoUi';
import { useGameStore } from '../../store';

const POSTS: { kind: PostKind; emoji: string; title: string; sub: string }[] = [
  { kind: 'foto', emoji: '📸', title: 'Postar uma foto', sub: 'Seguro, rende pouco' },
  { kind: 'treino', emoji: '🥊', title: 'Postar um vídeo de treino', sub: 'Rende mais para quem luta' },
  { kind: 'opiniao', emoji: '🗣️', title: 'Dar opinião sobre o assunto do momento', sub: 'Rende mais, mas pode virar polêmica' },
];
const COMMERCIAL_REASON: Record<string, string> = {
  busy: 'Resolva o acontecimento pendente',
  prison: 'Indisponível na prisão',
  'too-young': 'A partir dos 16 anos',
  fame: `Precisa de fama ${C.fame.commercialMinFame}+`,
  done: 'Você já gravou um comercial este ano',
};

export function FamaScreen({ game }: { game: GameState }) {
  const postOn = useGameStore((s) => s.postOnSocial);
  const commercial = useGameStore((s) => s.doCommercial);
  const fame = fameOf(game);
  const pr = postBlockReason(game);
  const cr = commercialBlockReason(game, C);
  const posts = usesThisYear(game, 'redes:post');
  return (
    <>
      <div className="rounded-[var(--ds-radius)] bg-[var(--ds-surface)] p-3" data-testid="fame-card">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold">Fama</span>
          <span className="tabular-nums">{fame}/100</span>
        </div>
        <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-[var(--ds-surface-2)]" role="meter" aria-valuenow={fame} aria-valuemin={0} aria-valuemax={100} aria-label="Fama">
          <div className="h-full rounded-full bg-[var(--ds-accent)]" style={{ width: `${fame}%` }} />
        </div>
        <p className="mt-2 text-sm">{fameLabel(fame, game.character.sex)} · {followersOf(fame).toLocaleString('pt-BR')} seguidores</p>
        <p className="text-xs text-[var(--ds-text-muted)]">A fama cai devagar quando nada a sustenta. Lutar, aparecer e postar ajudam.</p>
      </div>
      <ListGroup title="Redes sociais">
        {POSTS.map((p) => (
          <ListItem key={p.kind} emoji={p.emoji} title={p.title} subtitle={posts ? `${p.sub} · ${posts} post(s) este ano, cada um rende menos` : p.sub} disabled={!!pr} reason={pr === 'too-young' ? 'A partir dos 13 anos' : pr === 'prison' ? 'Indisponível na prisão' : 'Resolva o acontecimento pendente'} onClick={() => postOn(p.kind)} chevron={false} testId={`post-${p.kind}`} />
        ))}
      </ListGroup>
      <ListGroup title="Comerciais">
        <ListItem emoji="🎬" title="Gravar um comercial" subtitle={`Cachê de ${money.format(commercialFee(fame))} · uma vez por ano`} disabled={!!cr} reason={cr ? COMMERCIAL_REASON[cr] : undefined} onClick={commercial} chevron={false} testId="do-commercial" />
      </ListGroup>
    </>
  );
}
