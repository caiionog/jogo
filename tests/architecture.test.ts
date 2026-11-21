import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

const engineRoot = resolve(__dirname, '../src/engine');
const engineFiles = files(engineRoot).filter((f) => /\.tsx?$/.test(f));

describe('regras de arquitetura da engine', () => {
  it.each(engineFiles)('%s não importa React/UI/conteúdo nem usa Math.random', (file) => {
    const src = readFileSync(file, 'utf8');
    expect(file.endsWith('.tsx')).toBe(false);
    expect(src).not.toMatch(/from ['"]react/);
    // todo import relativo precisa continuar dentro de src/engine
    for (const m of src.matchAll(/from ['"](\.[^'"]+)['"]/g)) {
      expect(resolve(dirname(file), m[1]!).startsWith(engineRoot)).toBe(true);
    }
    // imports de pacotes: nenhum (engine é TS puro)
    expect(src).not.toMatch(/from ['"][^.'"][^'"]*['"]/);
    expect(src).not.toMatch(/Math\.random/);
    expect(src).not.toMatch(/\b(window|document|localStorage)\./);
  });
});
