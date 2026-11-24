/**
 * "Passar tempo com todos" (release 0.0.3): botão no topo do grupo Amigos e a folha com a escolha da atividade,
 * quem vai e quem não pode ir. Tudo vem da engine (`groupActivities`, `groupAvailability`, `groupBlockReason`).
 */
import { useState } from 'react';
import { Users } from 'lucide-react';
import { GAME_CONTENT } from '../../content';
import { GROUP_PAYING_AGE, groupActivities, groupAvailability, groupBlockReason, relationsOf } from '../../engine';
import type { GameState, GroupBlockReason, Person } from '../../engine';
import { BottomSheet, ListGroup, ListItem } from '../design/components';
import { useGameStore } from '../store';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export const GROUP_REASON: Record<GroupBlockReason, string> = {
  busy: 'Agora não dá: resolva o que está pendente',
  unknown: 'Atividade indisponível',
  'too-young': 'Você ainda é novo(a) demais para isso',
  age: 'Não combina mais com a sua idade',
  'no-friends': 'Nenhum amigo pode ir agora',
  'no-money': 'Dinheiro insuficiente',
  'no-sessions': 'Sem sessões de treino neste ano',
};

const firstName = (p: Person) => p.name.split(' ')[0] ?? p.name;
const ao = (p: Person) => (p.sex === 'M' ? 'o' : 'a');
function absentWhy(p: Person, reason: 'ocupado' | 'viajando' | 'brigado'): string {
  return reason === 'ocupado' ? `ocupad${ao(p)}` : reason === 'viajando' ? 'viajando' : `brigad${ao(p)} com você`;
}

/** Motivo do botão principal (null = pode abrir a folha). */
export function groupButtonReason(game: GameState): string | null {
  const acts = groupActivities(game, GAME_CONTENT);
  if (!acts.length) return 'Ainda não há saídas em grupo para a sua idade';
  if (groupBlockReason(game, acts[0]!.id, GAME_CONTENT) === 'busy') return GROUP_REASON.busy;
  if (groupAvailability(game, GAME_CONTENT).present.length > 0) return null;
  return relationsOf(game, ['amigo', 'colega_treino']).length ? GROUP_REASON['no-friends'] : 'Você ainda não tem amigos';
}

function GroupSheet({ game, onClose }: { game: GameState; onClose: () => void }) {
  const hangOut = useGameStore((s) => s.hangOutAll);
  const acts = groupActivities(game, GAME_CONTENT);
  const { present, absent } = groupAvailability(game, GAME_CONTENT);
  const kidFree = game.character.age < GROUP_PAYING_AGE; // criança não paga (só muda o rótulo)
  return (
    <BottomSheet title="Passar tempo com todos" onClose={onClose} testId="group-sheet">
      <div className="flex flex-col gap-4 pb-2">
        <section className="text-sm" data-testid="group-present">
          <h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-[var(--ds-text-muted)]">Vão com você ({present.length})</h3>
          {present.length ? (
            <ul className="flex flex-wrap gap-1.5 px-1">
              {present.map((p) => (
                <li key={p.id} className="rounded-full bg-[var(--ds-surface-2)] px-2.5 py-1">
                  {p.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-1 text-[var(--ds-text-muted)]">Ninguém pode ir agora.</p>
          )}
        </section>
        {absent.length > 0 && (
          <section className="text-sm" data-testid="group-absent">
            <h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-[var(--ds-text-muted)]">Não podem ir</h3>
            <ul className="flex flex-col gap-1 px-1 text-[var(--ds-text-muted)]">
              {absent.map(({ person, reason }) => (
                <li key={person.id}>
                  <span className="text-[var(--ds-text)]">{firstName(person)}</span> ({absentWhy(person, reason)})
                </li>
              ))}
            </ul>
          </section>
        )}
        <ListGroup title="O que fazer">
          {acts.map((a) => {
            const reason = groupBlockReason(game, a.id, GAME_CONTENT);
            const cost = a.cost === 0 || kidFree ? 'grátis' : brl.format(a.cost);
            return (
              <ListItem
                key={a.id}
                emoji={a.emoji}
                title={a.label}
                subtitle={a.training ? 'conta como treino' : undefined}
                right={cost}
                disabled={reason !== null}
                reason={reason ? GROUP_REASON[reason] : undefined}
                chevron={false}
                testId={`group-activity-${a.id}`}
                onClick={() => {
                  hangOut(a.id);
                  onClose();
                }}
              />
            );
          })}
        </ListGroup>
      </div>
    </BottomSheet>
  );
}

export default function GroupHangout({ game }: { game: GameState }) {
  const [open, setOpen] = useState(false);
  const reason = groupButtonReason(game);
  return (
    <>
      <ListItem icon={Users} title="Passar tempo com todos" subtitle="Sair com a turma" disabled={reason !== null} reason={reason ?? undefined} onClick={() => setOpen(true)} testId="group-hangout" />
      {open && <GroupSheet game={game} onClose={() => setOpen(false)} />}
    </>
  );
}
