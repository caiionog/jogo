/** Subagents do projeto (release 0.0.3): cada arquivo em .claude/agents/ tem frontmatter válido. */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const DIR = '.claude/agents';
const KNOWN_TOOLS = new Set(['Read', 'Edit', 'Write', 'Bash', 'Grep', 'Glob']);
const EXPECTED = ['avatar-artist', 'content-writer', 'engine-dev', 'reviewer', 'test-runner', 'ui-dev'];

function frontmatter(text: string): Record<string, string> {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!m) throw new Error('sem frontmatter');
  const out: Record<string, string> = {};
  for (const line of m[1]!.split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
}

describe('subagents', () => {
  const files = readdirSync(DIR).filter((f) => f.endsWith('.md'));

  it('os seis agentes pedidos existem', () => {
    expect(files.map((f) => f.replace(/\.md$/, '')).sort()).toEqual(EXPECTED);
  });

  it.each(files)('%s: name, description, tools mínimas e model', (f) => {
    const text = readFileSync(join(DIR, f), 'utf8');
    const fm = frontmatter(text);
    expect(fm.name).toBe(f.replace(/\.md$/, ''));
    expect(fm.description!.length).toBeGreaterThan(40);
    const tools = fm.tools!.split(',').map((t) => t.trim());
    expect(tools.length).toBeGreaterThan(0);
    for (const t of tools) expect(KNOWN_TOOLS.has(t), t).toBe(true);
    expect(['sonnet', 'haiku', 'opus']).toContain(fm.model);
    // corpo aponta para as regras do CLAUDE.md
    expect(text).toContain('CLAUDE.md');
  });

  it('quem só verifica não edita', () => {
    for (const f of ['reviewer.md', 'test-runner.md']) {
      const tools = frontmatter(readFileSync(join(DIR, f), 'utf8')).tools!;
      expect(tools).not.toMatch(/Edit|Write/);
    }
  });
});
