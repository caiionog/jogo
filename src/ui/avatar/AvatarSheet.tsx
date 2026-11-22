/** Perfil: avatar de corpo inteiro em pixel art, detalhes e guarda-roupa por camada (com cores e grifes). */
import { useMemo, useState } from 'react';
import { GAME_CONTENT } from '../../content';
import type { OutfitLayer } from '../../engine';
import { FACIAL_HAIR, FACIAL_HAIR_LABEL, HAIR_STYLES, HAIR_STYLE_LABEL, LIFE_STAGE_LABEL, buyOutfitBlock, deriveAvatar, lifeStage, outfitFitsAge, wardrobeOptions } from '../../engine';
import Sheet from '../components/Sheet';
import { money } from '../components/ecoUi';
import { useGameStore } from '../store';
import PixelAvatar from './PixelAvatar';

const LAYERS: { id: OutfitLayer; label: string }[] = [
  { id: 'cima', label: 'Parte de cima' },
  { id: 'inteira', label: 'Vestido e macacão' },
  { id: 'baixo', label: 'Parte de baixo' },
  { id: 'calcado', label: 'Calçado' },
  { id: 'agasalho', label: 'Agasalho' },
  { id: 'acessorio', label: 'Acessório' },
];
const BLOCK: Record<string, string> = { 'no-money': 'Dinheiro insuficiente', 'too-young': 'A partir dos 16 anos', busy: 'Agora não', owned: 'Comprada' };

export default function AvatarSheet({ onClose }: { onClose: () => void }) {
  const game = useGameStore((s) => s.game);
  const st = useGameStore();
  const [layer, setLayer] = useState<OutfitLayer>('cima');
  const desc = useMemo(() => (game ? deriveAvatar(game, GAME_CONTENT) : null), [game]);
  if (!game || !desc) return null;
  const c = game.character;
  const worn = game.wardrobe.worn ?? {};
  const options = wardrobeOptions(game, GAME_CONTENT, layer);
  const current = worn[layer];
  const chosen = options.find((o) => o.id === current?.id);
  const locked = GAME_CONTENT.outfits.filter((o) => o.layer === layer && !game.wardrobe.unlocked.includes(o.id) && (o.context === 'luxo' || o.context === 'dia'));
  const auto = (game.education.current && c.age >= 6 && c.age <= 17) || c.age <= 2;
  return (
    <Sheet title="Perfil" onClose={onClose} full testId="avatar-sheet">
      <div className="flex items-end gap-4">
        <div className="rounded-2xl bg-[var(--ds-avatar-bg)] p-2">
          <PixelAvatar d={desc} scale={4} animate label={`Avatar de ${c.name}`} />
        </div>
        <dl className="flex-1 text-sm">
          <dt className="font-semibold">{c.name}</dt>
          <dd className="text-[var(--ds-text-muted)]">{c.age} anos · {LIFE_STAGE_LABEL[lifeStage(c.age)]}</dd>
          <dd className="text-[var(--ds-text-muted)]">{c.city} – {c.uf}</dd>
          <dd className="text-[var(--ds-text-muted)]">{c.heightCm} cm · {c.weightKg} kg</dd>
          <dd className="text-[var(--ds-text-muted)]">Corpo: {desc.build === 'acima' ? 'acima do peso' : desc.build}</dd>
        </dl>
      </div>
      {auto && <p className="mt-3 rounded-lg bg-[var(--ds-surface-2)] p-2 text-xs">{c.age <= 2 ? 'Bebê usa body.' : 'Em dia de escola você vai de uniforme; o resto do guarda-roupa vale normalmente.'}</p>}
      <h3 className="mb-1 mt-4 text-sm font-semibold">Guarda-roupa</h3>
      <div className="mb-2 flex gap-1 overflow-x-auto" role="tablist" aria-label="Camadas">
        {LAYERS.map((l) => (
          <button key={l.id} role="tab" aria-selected={layer === l.id} onClick={() => setLayer(l.id)} className={`min-h-9 shrink-0 rounded-full border px-3 text-xs ${layer === l.id ? 'border-[var(--ds-accent)] text-[var(--ds-accent)]' : 'border-[var(--ds-border)]'}`}>
            {l.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2" data-testid="wardrobe">
        {(layer === 'agasalho' || layer === 'acessorio') && (
          <button onClick={() => st.removeOutfit(layer)} aria-pressed={!current} className={`min-h-11 rounded-xl border px-2 text-xs ${!current ? 'border-[var(--ds-accent)] text-[var(--ds-accent)]' : 'border-[var(--ds-border)]'}`}>
            Nenhum
          </button>
        )}
        {options.map((o) => (
          <button key={o.id} onClick={() => st.selectOutfit(o.id, o.id === current?.id ? current.color : 0)} aria-pressed={o.id === current?.id} className={`min-h-11 rounded-xl border px-2 text-xs ${o.id === current?.id ? 'border-[var(--ds-accent)] text-[var(--ds-accent)]' : 'border-[var(--ds-border)]'}`}>
            {o.name}
          </button>
        ))}
      </div>
      {chosen && chosen.colors.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Cor">
          {chosen.colors.map((col, i) => (
            <button key={col} role="radio" aria-checked={i === current?.color} aria-label={`Cor ${i + 1}`} onClick={() => st.selectOutfit(chosen.id, i)} className={`h-11 w-11 rounded-full border-2 ${i === current?.color ? 'border-[var(--ds-accent)]' : 'border-[var(--ds-border)]'}`} style={{ background: col }} />
          ))}
        </div>
      )}
      {locked.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {locked.map((o) => {
            const b = buyOutfitBlock(game, GAME_CONTENT, o.id);
            const young = !outfitFitsAge(o, c.age);
            return (
              <li key={o.id} className="flex items-center justify-between gap-2 rounded-xl bg-[var(--ds-surface-2)] p-2 text-sm">
                <span>
                  🔒 {o.name}
                  <span className="block text-xs text-[var(--ds-text-muted)]">{young ? `A partir dos ${o.minAge} anos` : o.price ? money.format(o.price) : 'Bloqueada'}</span>
                </span>
                {o.price ? (
                  <button disabled={!!b || young} onClick={() => st.buyOutfit(o.id)} className="min-h-11 rounded-xl border border-[var(--ds-warning)] px-3 text-xs disabled:opacity-40">
                    {b ? BLOCK[b] ?? 'Indisponível' : 'Comprar'}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <h3 className="mb-1 mt-4 text-sm font-semibold">Cabelo</h3>
      <div className="grid grid-cols-3 gap-2">
        {HAIR_STYLES.map((h) => (
          <button key={h} onClick={() => st.setHairStyle(h)} aria-pressed={desc.hair.style === h} className={`min-h-11 rounded-xl border px-1 text-xs ${desc.hair.style === h ? 'border-[var(--ds-accent)] text-[var(--ds-accent)]' : 'border-[var(--ds-border)]'}`}>
            {HAIR_STYLE_LABEL[h]}
          </button>
        ))}
      </div>
      {c.age >= 16 && (
        <>
          <h3 className="mb-1 mt-4 text-sm font-semibold">Barba</h3>
          <div className="grid grid-cols-3 gap-2">
            {FACIAL_HAIR.map((f) => (
              <button key={f} onClick={() => st.setFacialHair(f)} aria-pressed={game.wardrobe.facialHair === f} className={`min-h-11 rounded-xl border px-1 text-xs ${game.wardrobe.facialHair === f ? 'border-[var(--ds-accent)] text-[var(--ds-accent)]' : 'border-[var(--ds-border)]'}`}>
                {FACIAL_HAIR_LABEL[f]}
              </button>
            ))}
          </div>
        </>
      )}
    </Sheet>
  );
}
