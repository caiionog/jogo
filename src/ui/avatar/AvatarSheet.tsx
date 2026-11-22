/** Tela cheia do avatar: busto 3D para girar + guarda-roupa (roupas, cores, barba, peças de luxo). */
import { useMemo } from 'react';
import { GAME_CONTENT } from '../../content';
import { FACIAL_HAIR, FACIAL_HAIR_LABEL, buyOutfitBlock, deriveAvatar, outfitFitsAge, wardrobeOptions } from '../../engine';
import Sheet from '../components/Sheet';
import { money } from '../components/ecoUi';
import { useGameStore } from '../store';
import AvatarStage from './AvatarStage';

const BLOCK: Record<string, string> = { 'no-money': 'sem dinheiro', 'too-young': '16+', busy: 'agora não', owned: 'comprada' };

export default function AvatarSheet({ onClose }: { onClose: () => void }) {
  const game = useGameStore((s) => s.game);
  const enabled = useGameStore((s) => s.meta.settings.avatar3d !== false);
  const selectOutfit = useGameStore((s) => s.selectOutfit);
  const buyOutfit = useGameStore((s) => s.buyOutfit);
  const setFacialHair = useGameStore((s) => s.setFacialHair);
  const desc = useMemo(() => (game ? deriveAvatar(game, GAME_CONTENT) : null), [game]);
  if (!game || !desc) return null;
  const options = wardrobeOptions(game, GAME_CONTENT);
  const current = game.wardrobe.outfit;
  const chosen = options.find((o) => o.id === current.id);
  const luxury = GAME_CONTENT.outfits.filter((o) => o.context === 'luxo' && !game.wardrobe.unlocked.includes(o.id) && outfitFitsAge(o, game.character.age));
  const auto = desc.outfit.id !== current.id;
  return (
    <Sheet title="Seu visual" onClose={onClose} full testId="avatar-sheet">
      <AvatarStage d={desc} orbit enabled={enabled} className="mx-auto h-[42dvh] w-full max-w-sm touch-none" label={`Busto de ${game.character.name}`} />
      <p className="text-center text-xs text-slate-500">Arraste para girar · pinça para aproximar</p>
      <div className="mt-2 flex-1 overflow-y-auto pb-2">
        {auto && <p className="mb-2 rounded-lg bg-slate-800 p-2 text-xs text-slate-300">Agora você está de {GAME_CONTENT.outfits.find((o) => o.id === desc.outfit.id)?.name.toLowerCase()} (automático pela fase da vida). A escolha abaixo vale fora da escola.</p>}
        <h3 className="mb-1 text-sm font-semibold text-slate-300">Roupas</h3>
        <div className="grid grid-cols-3 gap-2" data-testid="wardrobe">
          {options.map((o) => (
            <button
              key={o.id}
              onClick={() => selectOutfit(o.id, o.id === current.id ? current.color : 0)}
              aria-pressed={o.id === current.id}
              className={`min-h-11 rounded-xl border px-2 py-2 text-xs ${o.id === current.id ? 'border-emerald-500 bg-emerald-500/15 text-emerald-200' : 'border-slate-700 bg-slate-950'}`}
            >
              {o.name}
            </button>
          ))}
        </div>
        {chosen && chosen.colors.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Cor">
            {chosen.colors.map((c, i) => (
              <button key={c} role="radio" aria-checked={i === current.color} aria-label={`Cor ${i + 1}`} onClick={() => selectOutfit(chosen.id, i)} className={`h-11 w-11 rounded-full border-2 ${i === current.color ? 'border-emerald-400' : 'border-slate-700'}`} style={{ background: c }} />
            ))}
          </div>
        )}
        {game.character.age >= 16 && game.character.sex === 'M' && (
          <>
            <h3 className="mb-1 mt-4 text-sm font-semibold text-slate-300">Barba</h3>
            <div className="grid grid-cols-4 gap-2">
              {FACIAL_HAIR.map((f) => (
                <button key={f} onClick={() => setFacialHair(f)} aria-pressed={game.wardrobe.facialHair === f} className={`min-h-11 rounded-xl border px-1 text-xs ${game.wardrobe.facialHair === f ? 'border-emerald-500 bg-emerald-500/15' : 'border-slate-700 bg-slate-950'}`}>
                  {FACIAL_HAIR_LABEL[f]}
                </button>
              ))}
            </div>
          </>
        )}
        {luxury.length > 0 && (
          <>
            <h3 className="mb-1 mt-4 text-sm font-semibold text-slate-300">Grifes (luxo)</h3>
            <ul className="flex flex-col gap-2">
              {luxury.map((o) => {
                const block = buyOutfitBlock(game, GAME_CONTENT, o.id);
                return (
                  <li key={o.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-950 p-2 text-sm">
                    <span>
                      {o.name}
                      <span className="block text-xs text-slate-400">{money.format(o.price ?? 0)}</span>
                    </span>
                    <button disabled={!!block} onClick={() => buyOutfit(o.id)} className="min-h-11 rounded-xl border border-amber-600 bg-amber-500/10 px-3 text-xs text-amber-200 disabled:opacity-40">
                      {block ? BLOCK[block] ?? 'indisponível' : 'Comprar'}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </Sheet>
  );
}
