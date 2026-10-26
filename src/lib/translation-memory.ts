export interface TranslationMemoryEntry {
  source: string;
  target: string;
  context?: string;
  gameId?: string;
  updatedAt?: string;
}

export interface TranslationMemoryMatch extends TranslationMemoryEntry {
  score: number;
  exact: boolean;
}

export interface GlossaryTerm {
  source: string;
  target: string;
  caseSensitive?: boolean;
  note?: string;
}

export function normalizeMemoryText(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\{[^{}]+\}|%\w+|<[^<>]+>|\\[A-Za-z]+\[[^\]]*\]/g, " __TOKEN__ ")
    .replace(/[^\p{L}\p{N}_]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trigrams(value: string) {
  const padded = `  ${normalizeMemoryText(value)}  `;
  const set = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) set.add(padded.slice(i, i + 3));
  return set;
}

export function similarity(a: string, b: string) {
  const left = trigrams(a);
  const right = trigrams(b);
  if (!left.size && !right.size) return 1;
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const item of left) if (right.has(item)) shared++;
  return shared / (left.size + right.size - shared);
}

export function findMemoryMatches(
  source: string,
  memory: TranslationMemoryEntry[],
  limit = 5,
  minimumScore = 0.58,
): TranslationMemoryMatch[] {
  const normalized = normalizeMemoryText(source);
  return memory
    .map((entry) => {
      const entryNormalized = normalizeMemoryText(entry.source);
      const exact = normalized === entryNormalized;
      return {
        ...entry,
        exact,
        score: exact ? 1 : similarity(source, entry.source),
      };
    })
    .filter((entry) => entry.score >= minimumScore && entry.target.trim())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function buildMemory(
  rows: Array<{ source: string; ptBR: string; context?: string }>,
  gameId?: string,
): TranslationMemoryEntry[] {
  const seen = new Set<string>();
  const entries: TranslationMemoryEntry[] = [];
  for (const row of rows) {
    if (!row.source.trim() || !row.ptBR.trim()) continue;
    const key = normalizeMemoryText(row.source);
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({
      source: row.source,
      target: row.ptBR,
      context: row.context,
      gameId,
      updatedAt: new Date().toISOString(),
    });
  }
  return entries;
}

export function glossaryIssues(source: string, target: string, glossary: GlossaryTerm[]) {
  const issues: string[] = [];
  for (const term of glossary) {
    const sourceHaystack = term.caseSensitive ? source : source.toLowerCase();
    const sourceNeedle = term.caseSensitive ? term.source : term.source.toLowerCase();
    if (!sourceHaystack.includes(sourceNeedle)) continue;
    const targetHaystack = term.caseSensitive ? target : target.toLowerCase();
    const targetNeedle = term.caseSensitive ? term.target : term.target.toLowerCase();
    if (!targetHaystack.includes(targetNeedle)) {
      issues.push(`${term.source} → ${term.target}`);
    }
  }
  return issues;
}

export function mergeMemories(...memories: TranslationMemoryEntry[][]) {
  const map = new Map<string, TranslationMemoryEntry>();
  for (const memory of memories) {
    for (const entry of memory) {
      const key = normalizeMemoryText(entry.source);
      if (!key) continue;
      const current = map.get(key);
      if (!current || (!current.target && entry.target)) map.set(key, entry);
    }
  }
  return [...map.values()];
}
