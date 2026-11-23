/**
 * Criação de personagem (Etapa 7) em 3 passos: nome/sexo → UF/cidade → aparência, com prévia 3D ao vivo
 * ("ver como bebê/criança/adulto/idoso"). Os sorteios usam funções da engine com uma seed criada aqui.
 */
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { GAME_CONTENT } from '../../content';
import { NAMES } from '../../content/names';
import type { Appearance, PartnerPreference, Race, Sex } from '../../engine';
import {
  EYE_COLORS, EYE_COLOR_LABEL, EYE_RGB, EYE_SHAPES, EYE_SHAPE_LABEL, FACE_SHAPES, FACE_SHAPE_LABEL, FACIAL_HAIR, FACIAL_HAIR_LABEL,
  HAIR_STYLES, HAIR_STYLE_LABEL, HAIR_TYPES, HAIR_TYPE_LABEL, RACES, RACE_LABEL, createRng, genesForRace, hairRgb, pickBirthplace, pickFirstName, previewAvatar,
  randomAppearance, rgbHex, seedToState, skinRgb, ufOrDefault,
} from '../../engine';
import PixelAvatar from '../avatar/PixelAvatar';
import { AdultToggle, PreferencePicker } from '../components/SettingsSheet';
import MenuHost from '../components/MenuHost';
import { useGameStore } from '../store';

/** Seed nova a cada sorteio (a engine nunca usa fontes não determinísticas; a UI cria a seed). */
let counter = 0;
const freshRng = () => createRng(seedToState(`${Date.now()}:${performance.now()}:${++counter}`));

const PREVIEW_AGES = [
  ['Bebê', 1],
  ['Criança', 8],
  ['Adolescente', 15],
  ['Adulto', 28],
  ['Idoso', 72],
] as const;
/** Amostras da rampa de pele (tom contínuo do gene). */
const SKIN_SWATCHES = [0.02, 0.12, 0.22, 0.32, 0.42, 0.52, 0.62, 0.72, 0.82, 0.92, 1];
const THIRDS = [
  ['Fino', 0.15],
  ['Médio', 0.5],
  ['Largo', 0.85],
] as const;

function Choice<T extends string>({ value, options, labels, onChange, cols = 3, swatch }: { value: T; options: readonly T[]; labels: Record<T, string>; onChange: (v: T) => void; cols?: number; swatch?: (v: T) => string }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} role="radiogroup">
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(o)} className={`flex min-h-11 items-center justify-center gap-1 rounded-xl border px-1 text-xs ${value === o ? 'border-emerald-500 bg-emerald-500/15 text-emerald-200' : 'border-slate-700 bg-slate-900'}`}>
          {swatch && <span className="inline-block h-3 w-3 rounded-full border border-slate-600" style={{ background: swatch(o) }} />}
          {labels[o]}
        </button>
      ))}
    </div>
  );
}

function Slider({ label, value, onChange, gradient, testId }: { label: string; value: number; onChange: (v: number) => void; gradient?: string; testId?: string }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-300">
      {label}
      <input data-testid={testId} type="range" min={0} max={1} step={0.01} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-11 w-full accent-emerald-500" style={gradient ? { background: gradient, borderRadius: 999, height: 14, margin: '14px 0' } : undefined} />
    </label>
  );
}

function Field({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

const SKIN_GRADIENT = (undertone: number) => `linear-gradient(to right, ${[0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => rgbHex(skinRgb(t, undertone))).join(', ')})`;
const HAIR_GRADIENT = `linear-gradient(to right, ${[0, 0.25, 0.5, 0.75, 1].map((t) => rgbHex(hairRgb(t, false, 0))).join(', ')})`;

export default function NewLife() {
  const startLife = useGameStore((s) => s.startLife);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [surnames, setSurnames] = useState('');
  const [sex, setSex] = useState<Sex>('M');
  const [preference, setPreference] = useState<PartnerPreference>('any');
  const [adultContent, setAdultContent] = useState(false);
  const [place, setPlace] = useState(() => pickBirthplace(freshRng(), GAME_CONTENT.geo));
  const [look, setLook] = useState<Appearance>(() => randomAppearance(freshRng(), ufOrDefault(GAME_CONTENT.geo, place.uf), 'M'));
  const [previewAge, setPreviewAge] = useState<number>(28);
  const ufd = ufOrDefault(GAME_CONTENT.geo, place.uf);
  const regiao = ufd.regiao;

  const desc = useMemo(() => previewAvatar(look, sex, previewAge, GAME_CONTENT, { facialHair: sex === 'M' ? look.facialHair : 'nenhuma' }), [look, sex, previewAge]);
  const genes = look.genes;
  const setGene = <K extends keyof Appearance['genes']>(k: K, v: Appearance['genes'][K]) => setLook((l) => ({ ...l, genes: { ...l.genes, [k]: v } }));

  const randomName = () => {
    const rng = freshRng();
    setName(pickFirstName(rng, NAMES, sex, 2000, regiao));
    setSurnames(`${rng.pick(NAMES.surnames)} ${rng.pick(NAMES.surnames)}`);
  };
  const randomPlace = () => {
    const p = pickBirthplace(freshRng(), GAME_CONTENT.geo);
    setPlace(p);
    setLook(randomAppearance(freshRng(), ufOrDefault(GAME_CONTENT.geo, p.uf), sex));
  };
  const randomLook = () => setLook(randomAppearance(freshRng(), ufd, sex));
  const changeRace = (race: Race) => setLook((l) => ({ ...l, race, genes: genesForRace(freshRng(), race) }));
  const randomAll = () => {
    const s: Sex = freshRng().chance(0.5) ? 'M' : 'F';
    setSex(s);
    const p = pickBirthplace(freshRng(), GAME_CONTENT.geo);
    setPlace(p);
    const rng = freshRng();
    const u = ufOrDefault(GAME_CONTENT.geo, p.uf);
    setName(pickFirstName(rng, NAMES, s, 2000, u.regiao));
    setSurnames(`${rng.pick(NAMES.surnames)} ${rng.pick(NAMES.surnames)}`);
    setLook(randomAppearance(freshRng(), u, s));
  };

  const start = () => {
    if (!name.trim()) return;
    const sn = surnames.split(/\s+/).map((x) => x.trim()).filter(Boolean);
    startLife(name.trim(), sex, { preference, adultContent, surnames: sn.length ? sn : undefined, uf: place.uf, city: place.city, appearance: sex === 'F' ? { ...look, facialHair: 'nenhuma' } : look });
  };

  const pill = (n: number, label: string) => (
    <li key={n} className={`flex-1 rounded-full py-1 text-center text-xs ${step === n ? 'bg-emerald-500 text-slate-950' : step > n ? 'bg-emerald-900 text-emerald-200' : 'bg-slate-800 text-slate-400'}`}>
      {n}. {label}
    </li>
  );

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pb-28 pt-6" data-testid="new-life">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vida Real</h1>
          <p className="text-sm text-slate-400">Uma vida inteira: escola, trabalho, esporte, amor e legado.</p>
        </div>
        <button type="button" onClick={randomAll} className="min-h-11 rounded-xl border border-slate-700 px-3 text-sm" data-testid="random-all">
          🎲 Aleatório
        </button>
      </div>
      <ol className="flex gap-2">{[pill(1, 'Nome'), pill(2, 'Lugar'), pill(3, 'Aparência')]}</ol>

      {/* prévia (um só canvas ao vivo) */}
      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 p-2">
        <div className="flex h-[136px] w-[72px] shrink-0 items-end justify-center rounded-xl bg-[var(--ds-avatar-bg)] p-1" data-testid="creation-preview">
          <PixelAvatar d={desc} scale={2} animate label="Prévia do personagem" />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <p className="text-sm font-semibold">{name.trim() ? `${name.trim()} ${surnames.trim()}` : 'Seu personagem'}</p>
          <p className="text-xs text-slate-400">{place.city} – {place.uf} · {RACE_LABEL[look.race]}</p>
          <div className="grid grid-cols-3 gap-1" role="radiogroup" aria-label="Ver como">
            {PREVIEW_AGES.map(([label, age]) => (
              <button key={age} type="button" role="radio" aria-checked={previewAge === age} onClick={() => setPreviewAge(age)} className={`min-h-9 rounded-lg border text-xs ${previewAge === age ? 'border-emerald-500 bg-emerald-500/15 text-emerald-200' : 'border-slate-700'}`} data-testid={`preview-${age}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {step === 1 && (
        <>
          <Field title="Nome" action={<button type="button" onClick={randomName} className="text-xs text-emerald-300 underline">sortear</button>}>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder="Ex.: João" aria-label="Nome" className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-lg outline-none focus:border-emerald-500" />
            <input value={surnames} onChange={(e) => setSurnames(e.target.value)} maxLength={40} placeholder="Sobrenome(s): da mãe e do pai — ex.: Souza Lima" aria-label="Sobrenomes" className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500" />
            <p className="text-xs text-slate-500">Com dois sobrenomes, o primeiro é o da mãe e o último, o do pai. Vazio: sorteados.</p>
          </Field>
          <Field title="Sexo">
            <div className="grid grid-cols-2 gap-3">
              {(['M', 'F'] as const).map((v) => (
                <button key={v} type="button" onClick={() => setSex(v)} aria-pressed={sex === v} className={`rounded-xl border px-4 py-3 text-lg ${sex === v ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300' : 'border-slate-700 bg-slate-900'}`}>
                  {v === 'M' ? '♂ Masculino' : '♀ Feminino'}
                </button>
              ))}
            </div>
          </Field>
          <Field title="Interesse amoroso">
            <PreferencePicker value={preference} onChange={setPreference} />
          </Field>
          <AdultToggle id="adult-new" value={adultContent} onChange={setAdultContent} />
        </>
      )}

      {step === 2 && (
        <>
          <Field title="Onde você nasce" action={<button type="button" onClick={randomPlace} className="text-xs text-emerald-300 underline" data-testid="random-place">sortear pela população</button>}>
            <label className="flex flex-col gap-1 text-sm">
              Estado
              <select data-testid="uf-select" value={place.uf} onChange={(e) => { const u = ufOrDefault(GAME_CONTENT.geo, e.target.value); setPlace({ uf: u.sigla, city: u.capital }); setLook(randomAppearance(freshRng(), u, sex)); }} className="min-h-12 rounded-xl border border-slate-700 bg-slate-900 px-3">
                {GAME_CONTENT.geo.ufs.map((u) => (
                  <option key={u.sigla} value={u.sigla}>{u.nome} ({u.sigla})</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Cidade
              <select data-testid="city-select" value={place.city} onChange={(e) => setPlace({ uf: place.uf, city: e.target.value })} className="min-h-12 rounded-xl border border-slate-700 bg-slate-900 px-3">
                {ufd.cities.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}{c.name === ufd.capital ? ' (capital)' : ''}</option>
                ))}
              </select>
            </label>
            <p className="text-xs text-slate-500">O sorteio segue a população de cada estado e cidade (IBGE, Censo 2022). Ao trocar de estado, a aparência é sorteada de novo pela composição de cor ou raça do estado — e você pode mudar tudo no próximo passo.</p>
          </Field>
        </>
      )}

      {step === 3 && (
        <>
          <Field title="Cor ou raça (IBGE)" action={<button type="button" onClick={randomLook} className="text-xs text-emerald-300 underline" data-testid="random-look">sortear aparência</button>}>
            <Choice value={look.race} options={RACES} labels={RACE_LABEL} onChange={changeRace} />
            <p className="text-xs text-slate-500">Só aparência: cor ou raça nunca muda atributos, chances, salários nem eventos.</p>
          </Field>
          <Field title="Pele">
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Tom de pele">
              {SKIN_SWATCHES.map((t) => (
                <button key={t} type="button" role="radio" aria-checked={Math.abs(genes.skinTone - t) < 0.05} aria-label={`Tom ${Math.round(t * 10) + 1}`} onClick={() => setGene('skinTone', t)} className={`h-9 w-9 rounded-lg border-2 ${Math.abs(genes.skinTone - t) < 0.05 ? 'border-[var(--ds-accent)]' : 'border-transparent'}`} style={{ background: rgbHex(skinRgb(t, genes.undertone)) }} />
              ))}
            </div>
            <Slider testId="skin-slider" label="Ajuste fino do tom" value={genes.skinTone} onChange={(v) => setGene('skinTone', v)} gradient={SKIN_GRADIENT(genes.undertone)} />
            <Slider label="Subtom (frio ↔ quente)" value={(genes.undertone + 1) / 2} onChange={(v) => setGene('undertone', v * 2 - 1)} />
          </Field>
          <Field title="Cabelo">
            <Choice value={genes.hairType} options={HAIR_TYPES} labels={HAIR_TYPE_LABEL} onChange={(v) => setGene('hairType', v)} cols={4} />
            <Choice value={desc.hair.style} options={HAIR_STYLES} labels={HAIR_STYLE_LABEL} onChange={(v) => setLook((l) => ({ ...l, hairStyle: v }))} cols={3} />
            <Slider label="Cor (preto → loiro)" value={genes.hairColor} onChange={(v) => setGene('hairColor', v)} gradient={HAIR_GRADIENT} />
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" checked={genes.red} onChange={(e) => setGene('red', e.target.checked)} className="h-5 w-5 accent-emerald-500" /> Ruivo
            </label>
          </Field>
          <Field title="Olhos">
            <Choice value={genes.eyeColor} options={EYE_COLORS} labels={EYE_COLOR_LABEL} onChange={(v) => setGene('eyeColor', v)} swatch={(v) => rgbHex(EYE_RGB[v])} />
            <Choice value={genes.eyeShape} options={EYE_SHAPES} labels={EYE_SHAPE_LABEL} onChange={(v) => setGene('eyeShape', v)} cols={2} />
          </Field>
          <Field title="Rosto">
            <Choice value={genes.faceShape} options={FACE_SHAPES} labels={FACE_SHAPE_LABEL} onChange={(v) => setGene('faceShape', v)} />
            <p className="text-xs text-[var(--ds-text-muted)]">Nariz</p>
            <div className="grid grid-cols-3 gap-2">
              {THIRDS.map(([l, v]) => (
                <button key={l} type="button" aria-pressed={Math.abs(genes.noseWidth - v) < 0.17} onClick={() => setGene('noseWidth', v)} className={`min-h-11 rounded-xl border text-xs ${Math.abs(genes.noseWidth - v) < 0.17 ? 'border-[var(--ds-accent)] text-[var(--ds-accent)]' : 'border-[var(--ds-border)]'}`}>{l}</button>
              ))}
            </div>
            <p className="text-xs text-[var(--ds-text-muted)]">Lábios</p>
            <div className="grid grid-cols-3 gap-2">
              {THIRDS.map(([l, v]) => (
                <button key={l} type="button" aria-pressed={Math.abs(genes.lipVolume - v) < 0.17} onClick={() => setGene('lipVolume', v)} className={`min-h-11 rounded-xl border text-xs ${Math.abs(genes.lipVolume - v) < 0.17 ? 'border-[var(--ds-accent)] text-[var(--ds-accent)]' : 'border-[var(--ds-border)]'}`}>{l === 'Fino' ? 'Finos' : l === 'Médio' ? 'Médios' : 'Cheios'}</button>
              ))}
            </div>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" checked={(genes.freckles ?? 0) > 0} onChange={(e) => setGene('freckles', e.target.checked ? 0.6 : 0)} className="h-5 w-5 accent-emerald-500" /> Sardas
            </label>
          </Field>
          {sex === 'M' && (
            <Field title="Barba (quando adulto)">
              <Choice value={look.facialHair} options={FACIAL_HAIR} labels={FACIAL_HAIR_LABEL} onChange={(v) => setLook((l) => ({ ...l, facialHair: v }))} cols={4} />
            </Field>
          )}
          <p className="text-xs text-slate-500">Seus pais e irmãos serão gerados coerentes com esta aparência.</p>
        </>
      )}

      <MenuHost className="min-h-11 rounded-xl border border-slate-700 text-sm text-slate-300" label="☰ Vidas salvas, conquistas e backup" />

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-md gap-2 border-t border-slate-800 bg-slate-950/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        {step > 1 && (
          <button type="button" onClick={() => setStep(step - 1)} className="min-h-12 flex-1 rounded-xl border border-slate-700">
            Voltar
          </button>
        )}
        {step < 3 ? (
          <button type="button" disabled={step === 1 && !name.trim()} onClick={() => setStep(step + 1)} className="min-h-12 flex-[2] rounded-xl bg-emerald-500 font-bold text-slate-950 disabled:opacity-40" data-testid="next-step">
            Continuar
          </button>
        ) : (
          <button type="button" disabled={!name.trim()} onClick={start} className="min-h-12 flex-[2] rounded-xl bg-emerald-500 font-bold text-slate-950 disabled:opacity-40" data-testid="start-life">
            Começar vida
          </button>
        )}
      </div>
    </div>
  );
}
