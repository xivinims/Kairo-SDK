export type GameGenre = "Arcade" | "Romance" | "Narrativa" | "Terror leve" | "Puzzle";
export type SizeClass = "Leve" | "Médio" | "Pesado";

export interface GameEntry {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  genre: GameGenre[];
  sizeClass: SizeClass;
  installSize: string;
  accent: string;
  cover: string;
  status: "jogável" | "demo" | "localização";
}

export const GAMES: GameEntry[] = [
  {
    id: "coracoes-em-orbita",
    title: "Corações em Órbita",
    subtitle: "Uma visual novel de escolhas",
    description: "Uma história original de amizade, confiança e um possível romance em uma estação orbital brasileira.",
    genre: ["Romance", "Narrativa"],
    sizeClass: "Médio",
    installSize: "32 MB",
    accent: "#ff7aa8",
    cover: "✦",
    status: "jogável",
  },
  {
    id: "neon-runner-br",
    title: "Neon Runner BR",
    subtitle: "Arcade de reflexo rápido",
    description: "Desvie, acelere e tente sobreviver o máximo possível em uma pista neon gerada em tempo real.",
    genre: ["Arcade"],
    sizeClass: "Leve",
    installSize: "6 MB",
    accent: "#62f3ff",
    cover: "◈",
    status: "jogável",
  },
  {
    id: "cidade-sem-nome",
    title: "A Cidade Sem Nome",
    subtitle: "Mistério narrativo",
    description: "Explore uma cidade vazia e reconstrua sua história por pistas, mensagens e decisões.",
    genre: ["Narrativa", "Puzzle"],
    sizeClass: "Médio",
    installSize: "18 MB",
    accent: "#c7ff68",
    cover: "⌂",
    status: "jogável",
  },
  {
    id: "projeto-atlas",
    title: "Projeto Atlas",
    subtitle: "Perfil para jogos grandes",
    description: "Modelo de projeto para localização de jogos pesados em blocos, sem carregar todo o texto de uma vez.",
    genre: ["Narrativa"],
    sizeClass: "Pesado",
    installSize: "50+ GB suportados por pacotes",
    accent: "#b6a3ff",
    cover: "◎",
    status: "localização",
  },
];

export interface LocalizationRow {
  id: string;
  source: string;
  ptBR: string;
  context?: string;
  lockedTokens?: string[];
  reviewed?: boolean;
}

export interface LocalizationProject {
  name: string;
  sourceLocale: string;
  targetLocale: "pt-BR";
  rows: LocalizationRow[];
  glossary: Record<string, string>;
}

const TOKEN_PATTERNS = [
  /\{[^{}]+\}/g,
  /%\w+/g,
  /\\[A-Za-z]+\[[^\]]*\]/g,
  /<[^<>]+>/g,
  /\$\{[^{}]+\}/g,
];

export function extractLockedTokens(text: string): string[] {
  const found = new Set<string>();
  for (const pattern of TOKEN_PATTERNS) {
    for (const match of text.matchAll(pattern)) found.add(match[0]);
  }
  return [...found];
}

export function validateTranslation(source: string, translated: string) {
  const expected = extractLockedTokens(source);
  const missing = expected.filter((token) => !translated.includes(token));
  return {
    ok: missing.length === 0,
    missing,
    expected,
  };
}

export function chunkRows<T>(rows: T[], chunkSize = 200): T[][] {
  const safe = Math.max(1, Math.min(2000, Math.floor(chunkSize)));
  const chunks: T[][] = [];
  for (let i = 0; i < rows.length; i += safe) chunks.push(rows.slice(i, i + safe));
  return chunks;
}

export function parseJsonStrings(input: string): LocalizationRow[] {
  const parsed = JSON.parse(input) as unknown;
  const rows: LocalizationRow[] = [];
  let n = 0;

  const visit = (value: unknown, path: string) => {
    if (typeof value === "string") {
      rows.push({
        id: path || `text-${++n}`,
        source: value,
        ptBR: "",
        context: path,
        lockedTokens: extractLockedTokens(value),
      });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }
    if (value && typeof value === "object") {
      Object.entries(value as Record<string, unknown>).forEach(([key, item]) =>
        visit(item, path ? `${path}.${key}` : key),
      );
    }
  };

  visit(parsed, "");
  return rows;
}

export function exportTranslationPack(project: LocalizationProject) {
  const payload = {
    format: "kairo-localization-pack",
    version: 1,
    sourceLocale: project.sourceLocale,
    targetLocale: project.targetLocale,
    project: project.name,
    generatedAt: new Date().toISOString(),
    glossary: project.glossary,
    strings: project.rows.map((row) => ({
      id: row.id,
      source: row.source,
      translation: row.ptBR,
      context: row.context,
      reviewed: !!row.reviewed,
    })),
  };
  return JSON.stringify(payload, null, 2);
}

export const SAMPLE_LOCALIZATION: LocalizationProject = {
  name: "Demo de localização",
  sourceLocale: "en-US",
  targetLocale: "pt-BR",
  glossary: {
    Save: "Salvar",
    Load: "Carregar",
    Continue: "Continuar",
    Settings: "Configurações",
  },
  rows: [
    { id: "menu.play", source: "Continue", ptBR: "Continuar", reviewed: true },
    { id: "menu.settings", source: "Settings", ptBR: "Configurações", reviewed: true },
    {
      id: "dialogue.greeting",
      source: "Welcome back, {player}. You have %count% messages.",
      ptBR: "Que bom ver você de volta, {player}. Você tem %count% mensagens.",
      lockedTokens: ["{player}", "%count%"],
    },
  ],
};
