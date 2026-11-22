/** Atividades (tudo que gasta energia), Relacionamentos, Saúde, Testamento e Perfil. */
import { BookOpen, Car, Dumbbell, Heart, HeartPulse, MapPin, PartyPopper, ScrollText } from 'lucide-react';
import { useState } from 'react';
import { GAME_CONTENT as C } from '../../../content';
import type { GameState, TrainingKind } from '../../../engine';
import { CNH_COST, TRAINING_COST, TRAINING_MIN_AGE, actionBlockReason, cnhBlockReason, coachAssessment, meetBlockReason, trainingBlockReason } from '../../../engine';
import { ListGroup, ListItem } from '../../design/components';
import { useNav } from '../../nav';
import { useGameStore } from '../../store';
import { ACTION_REASON } from './occupation';
import HealthPanel from '../../components/HealthPanel';
import RelationshipsPanel from '../../components/RelationshipsPanel';
import { FamilyTree } from '../../components/MetaScreens';
import MoveSheet from '../../components/MoveSheet';
import { WillSection } from '../../components/FinancePanel';
import { money } from '../../components/ecoUi';

const TRAIN: { kind: TrainingKind; title: string; sub: string; emoji: string }[] = [
  { kind: 'jiujitsu', title: 'Treinar jiu-jitsu', sub: 'Chão, quedas e finalizações', emoji: '🥋' },
  { kind: 'trocacao', title: 'Treinar trocação', sub: 'Socos, chutes e defesa em pé', emoji: '🥊' },
  { kind: 'fisico', title: 'Treinar físico', sub: 'Sobe a Capacidade atlética', emoji: '🏃' },
  { kind: 'sparring', title: 'Sparring', sub: 'Um pouco de tudo — risco de lesão', emoji: '🤼' },
];
const TRAIN_REASON: Record<string, string> = { 'no-energy': 'Energia insuficiente', busy: 'Resolva o acontecimento pendente', injured: 'Lesionado(a): sparring vetado', retired: 'Aposentado(a)', dead: '—' };
const MEET_REASON: Record<string, string> = { 'too-young': 'Disponível a partir dos 14 anos', 'app-adult': 'Disponível a partir dos 18 anos', taken: 'Você já está com alguém', 'no-energy': 'Energia insuficiente', busy: 'Resolva o acontecimento pendente', dead: '—' };
const CNH_REASON: Record<string, string> = { age: 'Disponível a partir dos 18 anos', has: 'Você já tem CNH', 'no-money': `Custa ${money.format(CNH_COST)}`, busy: 'Resolva o acontecimento pendente', 'no-energy': 'Energia insuficiente' };

export function AtividadesScreen({ game }: { game: GameState }) {
  const nav = useNav();
  const [move, setMove] = useState(false);
  const getCnh = useGameStore((s) => s.getDriversLicense);
  const age = game.character.age;
  const cnh = cnhBlockReason(game);
  return (
    <>
      <ListItem icon={Dumbbell} title="Treino" subtitle="Jiu-jitsu, trocação, físico e sparring" disabled={age < 4} reason="Disponível a partir dos 4 anos" onClick={() => nav.push('treino')} testId="act-treino" />
      <ListItem icon={BookOpen} title="Estudo" subtitle="Estudar e se preparar para as provas" disabled={age < 5} reason="Disponível a partir dos 5 anos" onClick={() => nav.push('estudo')} testId="act-estudo" />
      <ListItem icon={HeartPulse} title="Saúde" subtitle="Check-up, médico, dieta, lesões" onClick={() => nav.push('saude')} testId="act-saude" />
      <ListItem icon={PartyPopper} title="Lazer" subtitle="Sair, festa, viagem" onClick={() => nav.push('lazer')} testId="act-lazer" />
      <ListItem icon={Heart} title="Amor" subtitle="Conhecer alguém, encontros" disabled={age < 14} reason="Disponível a partir dos 14 anos" onClick={() => nav.push('amor')} testId="act-amor" />
      <ListItem icon={MapPin} title="Mudar de cidade" subtitle={`Hoje: ${game.character.city} – ${game.character.uf}`} disabled={age < 18} reason="Disponível a partir dos 18 anos" onClick={() => setMove(true)} testId="act-mudar" />
      <ListItem icon={ScrollText} title="Testamento" subtitle="Quem fica com o quê" disabled={age < 18} reason="Disponível a partir dos 18 anos" onClick={() => nav.push('testamento')} />
      <ListItem icon={Car} title="Tirar a CNH" subtitle={`${money.format(CNH_COST)} · ⚡1 · pode reprovar`} disabled={!!cnh} reason={cnh ? CNH_REASON[cnh] : undefined} onClick={getCnh} chevron={false} testId="act-cnh" />
      {move && <MoveSheet onClose={() => setMove(false)} />}
    </>
  );
}

export function TreinoScreen({ game }: { game: GameState }) {
  const train = useGameStore((s) => s.train);
  const gym = C.fighting.gyms.find((g) => g.id === game.fighter.gymId);
  return (
    <>
      {TRAIN.map((t) => {
        const r = trainingBlockReason(game, t.kind);
        return (
          <ListItem
            key={t.kind}
            emoji={t.emoji}
            title={t.title}
            subtitle={`⚡${TRAINING_COST[t.kind]} · ${t.sub}`}
            disabled={!!r}
            reason={r === 'too-young' ? `Disponível a partir dos ${TRAINING_MIN_AGE[t.kind]} anos` : r ? TRAIN_REASON[r] : undefined}
            onClick={() => train(t.kind)}
            chevron={false}
            testId={`train-${t.kind}`}
          />
        );
      })}
      <p className="text-sm text-[var(--ds-text-muted)]">{gym ? `Treinando na ${gym.name}.` : 'Sem academia, o treino rende bem menos. Matricule-se em Ocupação → Carreiras → Carreira de lutador.'}</p>
      {game.character.age >= 6 && (
        <p className="text-sm" data-testid="coach-words">
          Treinador: geral <b>{coachAssessment(game)}</b> · chão <b>{coachAssessment(game, 'jiujitsu')}</b> · em pé <b>{coachAssessment(game, 'trocacao')}</b>
        </p>
      )}
    </>
  );
}

function ActionsList({ game, ids }: { game: GameState; ids: string[] }) {
  const doAction = useGameStore((s) => s.doAction);
  return (
    <>
      {ids.map((id) => {
        const a = C.actions.find((x) => x.id === id);
        if (!a) return null;
        const r = actionBlockReason(game, a);
        const reason = r === 'too-young' ? `Disponível a partir dos ${a.minAge} anos` : r ? ACTION_REASON[r] : undefined;
        return <ListItem key={a.id} emoji={a.emoji} title={a.label} subtitle={`⚡${a.energyCost} · ${a.description}`} disabled={!!r} reason={reason} onClick={() => doAction(a.id)} chevron={false} testId={`action-${a.id}`} />;
      })}
    </>
  );
}

export function EstudoScreen({ game }: { game: GameState }) {
  return <ActionsList game={game} ids={['study', 'study_exams']} />;
}

export function LazerScreen({ game }: { game: GameState }) {
  return <ActionsList game={game} ids={['socialize', 'go_out', 'party', 'travel', 'make_friends', 'skip_class']} />;
}

export function AmorScreen({ game }: { game: GameState }) {
  const meet = useGameStore((s) => s.meet);
  const nav = useNav();
  return (
    <>
      {(['social', 'app'] as const).map((m) => {
        const r = meetBlockReason(game, m);
        return <ListItem key={m} emoji={m === 'social' ? '💘' : '📱'} title={m === 'social' ? 'Conhecer alguém' : 'App de namoro'} subtitle="⚡1" disabled={!!r} reason={r ? MEET_REASON[r] : undefined} onClick={() => meet(m)} chevron={false} testId={`meet-${m}`} />;
      })}
      <ListItem emoji="❤️" title="Encontros e relações" subtitle="Abra uma pessoa em Relacionamentos para convidar para sair" onClick={() => nav.open('relacoes')} />
    </>
  );
}

export function SaudeScreen({ game }: { game: GameState }) {
  return <HealthPanel game={game} />;
}

export function TestamentoScreen({ game }: { game: GameState }) {
  return <WillSection game={game} />;
}

export function RelacoesScreen({ game }: { game: GameState }) {
  return (
    <>
      <RelationshipsPanel game={game} />
      {(game.dynasty.generation > 1 || game.relationships.relations.some((r) => r.type === 'filho')) && (
        <ListGroup title="Árvore da família">
          <FamilyTree game={game} />
        </ListGroup>
      )}
    </>
  );
}
