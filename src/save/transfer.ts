/** Exportar/importar save como arquivo JSON (backup ou troca de aparelho), com validação e migração (Etapa 6). */
import type { GameState } from '../engine';
import { CURRENT_VERSION, SaveMigrationError, migrate } from './migrations';

export const SAVE_FORMAT = 'vida-de-lutador';

export interface ExportedSave {
  format: typeof SAVE_FORMAT;
  exportedAt: string;
  version: number;
  state: GameState;
}

export function exportSave(state: GameState, exportedAt: string): string {
  const file: ExportedSave = { format: SAVE_FORMAT, exportedAt, version: state.version, state };
  return JSON.stringify(file);
}

/** Nome sugerido para o arquivo exportado. */
export function exportFileName(state: GameState, date: string): string {
  const slug = state.character.name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLowerCase();
  return `vida-de-lutador-${slug}-${date.slice(0, 10)}.json`;
}

export type ImportResult = { ok: true; state: GameState } | { ok: false; error: string };

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Checagem estrutural mínima depois da migração (campos obrigatórios e tipos). */
export function validateSaveShape(s: unknown): string[] {
  const errors: string[] = [];
  if (!isObj(s)) return ['o save não é um objeto'];
  const need: [string, (v: unknown) => boolean][] = [
    ['version', (v) => v === CURRENT_VERSION],
    ['seed', (v) => typeof v === 'string'],
    ['rngState', (v) => Number.isInteger(v)],
    ['year', (v) => Number.isInteger(v)],
    ['money', (v) => Number.isInteger(v)],
    ['alive', (v) => typeof v === 'boolean'],
    ['character', isObj],
    ['yearUses', isObj],
    ['college', isObj],
    ['flags', isObj],
    ['education', isObj],
    ['fighter', isObj],
    ['world', isObj],
    ['relationships', isObj],
    ['economy', isObj],
    ['health', isObj],
    ['dynasty', isObj],
    ['feats', isObj],
    ['log', Array.isArray],
    ['pendingEvents', Array.isArray],
    ['scheduledEvents', Array.isArray],
    ['firedEvents', Array.isArray],
  ];
  for (const [k, ok] of need) if (!ok(s[k])) errors.push(`campo "${k}" ausente ou inválido`);
  const c = s.character;
  if (isObj(c)) {
    if (typeof c.name !== 'string' || !c.name) errors.push('personagem sem nome');
    if (!Number.isInteger(c.age) || (c.age as number) < 0 || (c.age as number) > 130) errors.push('idade inválida');
    if (!isObj(c.stats)) errors.push('atributos ausentes');
  }
  const e = s.economy;
  if (isObj(e) && isObj(e.ledger)) {
    const entries = (e.ledger.entries ?? []) as { amount: number }[];
    const sum = Array.isArray(entries) ? entries.reduce((t, x) => t + (Number(x?.amount) || 0), 0) : NaN;
    if (typeof s.money === 'number' && typeof e.ledger.opening === 'number' && s.money - e.ledger.opening !== sum) errors.push('extrato não fecha com o saldo');
  } else errors.push('extrato ausente');
  return errors;
}

/** Lê um arquivo exportado (ou um GameState cru), migra para a versão atual e valida. */
export function importSave(text: string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'O arquivo não é um JSON válido.' };
  }
  let raw: unknown = data;
  if (isObj(data) && 'format' in data) {
    if (data.format !== SAVE_FORMAT) return { ok: false, error: 'Este arquivo não é um save do Vida de Lutador.' };
    raw = data.state;
  }
  if (!isObj(raw) || typeof raw.version !== 'number') return { ok: false, error: 'Save inválido: falta o campo "version".' };
  let state: GameState;
  try {
    state = migrate(structuredClone(raw));
  } catch (err) {
    if (err instanceof SaveMigrationError) return { ok: false, error: err.message.includes('mais novo') ? 'Este save é de uma versão mais nova do jogo. Atualize o app.' : `Não foi possível converter o save: ${err.message}` };
    return { ok: false, error: 'O save está corrompido e não pôde ser convertido.' };
  }
  const problems = validateSaveShape(state);
  if (problems.length) return { ok: false, error: `Save inválido: ${problems.slice(0, 3).join('; ')}.` };
  return { ok: true, state };
}
