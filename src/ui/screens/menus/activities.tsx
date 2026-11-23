/** Atividades (treino com limite oculto; o resto sem limite, com retorno decrescente), Relacionamentos, Saúde, Testamento e Perfil. */
import { BookOpen, Car, Dumbbell, Heart, HeartPulse, MapPin, PartyPopper, Plane, ScrollText, Trophy } from 'lucide-react';
import { useState } from 'react';
import { GAME_CONTENT as C } from '../../../content';
import type { GameState, TrainingKind } from '../../../engine';
import { CNH_COST, TRAINING_MIN_AGE, actionBlockReason, actionUseKey, cnhBlockReason, coachAssessment, meetBlockReason, trainingBlockReason, usesThisYear } from '../../../engine';
import { gymModalitiesText } from '../../text/fight';
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

/** Lista de treinos (release 0.0.1): as modalidades do conteúdo, o físico e o sparring. */
const TRAIN: { kind: TrainingKind; title: string; sub: string; emoji: string }[] = [
  ...C.fighting.modalities.map((m) => ({ kind: m.id, title: `Treinar ${m.label.toLowerCase()}`, sub: m.sub, emoji: m.emoji })),
  { kind: 'fisico', title: 'Treino físico', sub: 'Sobe a Capacidade atlética', emoji: '🏃' },
  { kind: 'sparring', title: 'Sparring', sub: 'Um pouco de tudo — risco de lesão', emoji: '🤼' },
];
const TRAIN_REASON: Record<string, string> = { 'no-gym': 'Precisa de uma academia (Carreira de Luta)', 'not-offered': 'Sua academia não oferece esta modalidade', busy: 'Resolva o acontecimento pendente', injured: 'Lesionado(a): sparring vetado', retired: 'Aposentado(a)', dead: '—' };
const MEET_REASON: Record<string, string> = { 'too-young': 'Disponível a partir dos 14 anos', 'app-adult': 'Disponível a partir dos 18 anos', taken: 'Você já está com alguém', busy: 'Resolva o acontecimento pendente', dead: '—' };
const CNH_REASON: Record<string, string> = { age: 'Disponível a partir dos 18 anos', has: 'Você já tem CNH', 'no-money': `Custa ${money.format(CNH_COST)}`, busy: 'Resolva o acontecimento pendente', tried: 'Você já tentou este ano' };

export function AtividadesScreen({ game }: { game: GameState }) {
  const nav = useNav();
  const [move, setMove] = useState(false);
  const getCnh = useGameStore((s) => s.getDriversLicense);
  const age = game.character.age;
  const cnh = cnhBlockReason(game);
  return (
    <>
      <ListItem icon={Dumbbell} title="Treino" subtitle="Jiu-jitsu, trocação, físico e sparring" disabled={age < 4} reason="Disponível a partir dos 4 anos" onClick={() => nav.push('treino')} testId="act-treino" />
      <ListItem icon={Trophy} title="Clube esportivo" subtitle={game.sportsClub ? 'Treinar no seu clube' : 'Futebol, natação, vôlei, judô…'} disabled={age < 6} reason="A partir dos 6 anos" onClick={() => nav.push('clube')} testId="act-clube" />
      <ListItem icon={Plane} title="Intercâmbio de artes marciais" subtitle="Um ano treinando no exterior" disabled={age < 16} reason="A partir dos 16 anos" onClick={() => nav.push('intercambio')} testId="act-intercambio" />
      <ListItem icon={BookOpen} title="Estudo" subtitle="Estudar e se preparar para as provas" disabled={age < 5} reason="Disponível a partir dos 5 anos" onClick={() => nav.push('estudo')} testId="act-estudo" />
      <ListItem icon={HeartPulse} title="Saúde" subtitle="Check-up, médico, dieta, lesões" onClick={() => nav.push('saude')} testId="act-saude" />
      <ListItem icon={PartyPopper} title="Lazer" subtitle="Sair, festa, viagem" onClick={() => nav.push('lazer')} testId="act-lazer" />
      <ListItem icon={Heart} title="Amor" subtitle="Conhecer alguém, encontros" disabled={age < 14} reason="Disponível a partir dos 14 anos" onClick={() => nav.push('amor')} testId="act-amor" />
      <ListItem icon={MapPin} title="Mudar de cidade" subtitle={`Hoje: ${game.character.city} – ${game.character.uf}`} disabled={age < 18} reason="Disponível a partir dos 18 anos" onClick={() => setMove(true)} testId="act-mudar" />
      <ListItem icon={ScrollText} title="Testamento" subtitle="Quem fica com o quê" disabled={age < 18} reason="Disponível a partir dos 18 anos" onClick={() => nav.push('testamento')} />
      <ListItem icon={Car} title="Tirar a CNH" subtitle={`${money.format(CNH_COST)} · uma tentativa por ano · pode reprovar`} disabled={!!cnh} reason={cnh ? CNH_REASON[cnh] : undefined} onClick={getCnh} chevron={false} testId="act-cnh" />
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
        const r = trainingBlockReason(game, t.kind, C);
        return (
          <ListItem
            key={t.kind}
            emoji={t.emoji}
            title={t.title}
            subtitle={t.sub}
            disabled={!!r}
            reason={r === 'too-young' ? `Disponível a partir dos ${TRAINING_MIN_AGE[t.kind]} anos` : r ? TRAIN_REASON[r] : undefined}
            onClick={() => train(t.kind)}
            chevron={false}
            testId={`train-${t.kind}`}
          />
        );
      })}
      <p className="text-sm text-[var(--ds-text-muted)]">{gym ? `Treinando na ${gym.name} (${gymModalitiesText(gym)}).` : 'Sem academia, só dá para fazer o treino físico. Escolha uma academia em Ocupação → Carreira de luta.'}</p>
      {game.character.age >= 6 && (
        <p className="text-sm" data-testid="coach-words">
          Treinador: geral <b>{coachAssessment(game)}</b> · agarre <b>{coachAssessment(game, 'grappling')}</b> · em pé <b>{coachAssessment(game, 'trocacao')}</b>
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
        const n = usesThisYear(game, actionUseKey(a.id));
        const sub = n > 0 ? `Feito ${n}× este ano · rende menos · ${a.description}` : a.description;
        return <ListItem key={a.id} emoji={a.emoji} title={a.label} subtitle={sub} disabled={!!r} reason={reason} onClick={() => doAction(a.id)} chevron={false} testId={`action-${a.id}`} />;
      })}
    </>
  );
}

export function EstudoScreen({ game }: { game: GameState }) {
  return <ActionsList game={game} ids={['study', 'study_exams']} />;
}

export function LazerScreen({ game }: { game: GameState }) {
  const nav = useNav();
  return (
    <>
      <ListItem emoji="🌙" title="Sair à noite" subtitle={game.character.age >= 18 ? 'Bar, festa, show, balada…' : 'Festa de amigos, matinê, lanchonete'} disabled={game.character.age < 10} reason="A partir dos 10 anos" onClick={() => nav.push('noite')} testId="act-noite" />
      <ActionsList game={game} ids={['socialize', 'go_out', 'party', 'travel', 'make_friends', 'skip_class']} />
    </>
  );
}

export function AmorScreen({ game }: { game: GameState }) {
  const meet = useGameStore((s) => s.meet);
  const nav = useNav();
  return (
    <>
      {(['social', 'app'] as const).map((m) => {
        const r = meetBlockReason(game, m);
        return <ListItem key={m} emoji={m === 'social' ? '💘' : '📱'} title={m === 'social' ? 'Conhecer alguém' : 'App de namoro'} subtitle={usesThisYear(game, 'conhecer') > 0 ? 'Tentar de novo no mesmo ano rende menos' : 'Conhecer gente nova'} disabled={!!r} reason={r ? MEET_REASON[r] : undefined} onClick={() => meet(m)} chevron={false} testId={`meet-${m}`} />;
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
