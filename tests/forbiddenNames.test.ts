/**
 * Nomes proibidos (release 0.0.2): todo o conteúdo e a UI são fictícios. Falha se aparecer nome ou sigla de facção
 * ou unidade policial real, ou "Polícia Militar"/"Polícia Civil" ao lado de um estado ou sigla de UF.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';

const LONG = ['Primeiro Comando da Capital', 'Comando Vermelho', 'Terceiro Comando Puro', 'Amigos dos Amigos', 'Família do Norte', 'Bonde do Maluco', 'Guardiões do Estado', 'Sindicato do Crime'];
const ACRONYMS = ['PCC', 'CV', 'TCP', 'ADA', 'FDN', 'BDM', 'GDE', 'BOPE', 'ROTA', 'GATE', 'COE', 'CORE', 'TIGRE', 'GOE', 'COT', 'Choque'];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
  });
}

const SOURCES = [...files('src/content'), ...files('src/ui')].map((p) => ({ p, text: readFileSync(p, 'utf8') }));
const UFS = GAME_CONTENT.geo.ufs.map((u) => ({ sigla: u.sigla, nome: u.nome }));

/** Primeiro texto que bate com o padrão (arquivo e trecho), para a mensagem de erro. */
function hit(re: RegExp): string | null {
  for (const { p, text } of SOURCES) {
    const m = re.exec(text);
    if (m) return `${p}: …${text.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30)}…`;
  }
  return null;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

describe('nomes proibidos', () => {
  it('nenhum nome longo de facção real (sem diferenciar maiúsculas)', () => {
    for (const n of LONG) expect(hit(new RegExp(esc(n), 'i')), n).toBeNull();
  });

  it('nenhuma sigla de facção ou unidade real (palavra inteira, maiúsculas)', () => {
    for (const a of ACRONYMS) expect(hit(new RegExp(`(?<![\\p{L}\\d_])${a}(?![\\p{L}\\d_])`, 'u')), a).toBeNull();
  });

  const states = UFS.flatMap((u) => [esc(u.nome), u.sigla]).join('|');
  const police = 'Pol[ií]cia (?:Militar|Civil)';
  const near = `(?:\\S+\\s+){0,3}?`;
  const after = new RegExp(`${police}\\s+${near}(?<![\\p{L}])(?:${states})(?![\\p{L}])`, 'u');
  const before = new RegExp(`(?<![\\p{L}])(?:${states})(?![\\p{L}])[\\s:,–-]+${near}${police}`, 'u');
  const acr = /(?<![A-Za-z])(?:PM|PCE?)[A-Z]{2}(?![A-Za-z])/;

  it('"Polícia Militar"/"Polícia Civil" nunca ao lado de estado ou sigla de UF', () => {
    expect(hit(after)).toBeNull();
    expect(hit(before)).toBeNull();
    expect(hit(acr)).toBeNull();
    // sanidade
    expect(after.test('a Polícia Militar do estado de São Paulo')).toBe(true);
    expect(before.test('BA: Polícia Civil')).toBe(true);
    expect(acr.test('a PMSP')).toBe(true);
    expect(after.test('Polícia Militar e Polícia Civil')).toBe(false);
  });

  it('o próprio teste pega os casos (sanidade)', () => {
    expect(/(?<![\p{L}\d_])BOPE(?![\p{L}\d_])/u.test('o BOPE chegou')).toBe(true);
    expect(/(?<![\p{L}\d_])COT(?![\p{L}\d_])/u.test('COTA')).toBe(false);
  });
});
