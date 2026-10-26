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


export interface EngineProfile {
  id: "generic-json" | "rpg-maker" | "renpy" | "godot" | "unity";
  name: string;
  confidence: "alta" | "média" | "baixa";
  description: string;
}

export function detectEngineProfiles(fileNames: string[]): EngineProfile[] {
  const files = fileNames.map((name) => name.toLowerCase());
  const found: EngineProfile[] = [];

  const add = (profile: EngineProfile) => {
    if (!found.some((item) => item.id === profile.id)) found.push(profile);
  };

  if (files.some((f) => /(^|\/)(data\/)?(system|actors|items|skills|map\d+)\.json$/.test(f))) {
    add({
      id: "rpg-maker",
      name: "RPG Maker MV/MZ",
      confidence: "alta",
      description: "Arquivos JSON de banco de dados e mapas podem ser tratados em blocos.",
    });
  }
  if (files.some((f) => f.endsWith(".rpy") || f.includes("renpy"))) {
    add({
      id: "renpy",
      name: "Ren'Py",
      confidence: "média",
      description: "Scripts de visual novel. Diálogos e labels exigem preservação cuidadosa de sintaxe.",
    });
  }
  if (files.some((f) => f.endsWith(".tscn") || f.endsWith(".tres") || f.endsWith(".translation"))) {
    add({
      id: "godot",
      name: "Godot",
      confidence: "média",
      description: "Recursos textuais e tabelas de tradução do Godot.",
    });
  }
  if (files.some((f) => f.includes("stringtable") || f.includes("localization") || f.endsWith(".resx"))) {
    add({
      id: "unity",
      name: "Unity / String Tables",
      confidence: "baixa",
      description: "Perfil genérico para tabelas e recursos de localização exportáveis.",
    });
  }
  if (files.some((f) => f.endsWith(".json"))) {
    add({
      id: "generic-json",
      name: "JSON genérico",
      confidence: "alta",
      description: "Percorre objetos e arrays profundamente e substitui somente strings traduzidas.",
    });
  }

  return found;
}

export function buildLocalizedJson(input: string, rows: LocalizationRow[]) {
  const parsed = JSON.parse(input) as unknown;
  const translations = new Map(
    rows
      .filter((row) => row.ptBR.trim() && validateTranslation(row.source, row.ptBR).ok)
      .map((row) => [row.id, row.ptBR] as const),
  );

  const visit = (value: unknown, path: string): unknown => {
    if (typeof value === "string") return translations.get(path) ?? value;
    if (Array.isArray(value)) return value.map((item, index) => visit(item, `${path}[${index}]`));
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, item]) => [
          key,
          visit(item, path ? `${path}.${key}` : key),
        ]),
      );
    }
    return value;
  };

  return JSON.stringify(visit(parsed, ""), null, 2);
}

export function localizationProgress(rows: LocalizationRow[]) {
  const total = rows.length;
  const translated = rows.filter((row) => row.ptBR.trim()).length;
  const valid = rows.filter((row) => row.ptBR.trim() && validateTranslation(row.source, row.ptBR).ok).length;
  return {
    total,
    translated,
    valid,
    percent: total ? Math.round((valid / total) * 100) : 0,
  };
}


export interface VoiceCandidate {
  id: string;
  title: string;
  engine: string;
  language: string;
  voiceActing: string;
  license: string;
  notes: string;
  sourceUrl: string;
}

export const VOICE_LOCALIZATION_CANDIDATES: VoiceCandidate[] = [
  {
    id: "epic-of-inanna",
    title: "The Epic of Inanna",
    engine: "Visual novel",
    language: "Inglês",
    voiceActing: "Total",
    license: "CC BY-SA 4.0",
    notes: "Projeto grande, ideal para testar localização e dublagem por capítulos.",
    sourceUrl: "https://strategicthinking.itch.io/the-epic-of-inanna",
  },
  {
    id: "quantangled",
    title: "Quantangled",
    engine: "Unity",
    language: "Inglês",
    voiceActing: "Personagem narrativo",
    license: "Código MIT · Assets CC BY 4.0",
    notes: "Projeto curto e bom para validar substituição de voz e sincronização.",
    sourceUrl: "https://victorghys.itch.io/quantangled",
  },
  {
    id: "time-at-the-office",
    title: "Time at the Office",
    engine: "Godot",
    language: "Inglês",
    voiceActing: "Vários personagens",
    license: "Código MIT · Assets CC BY 4.0",
    notes: "Bom candidato para pipeline Godot e dublagem cena a cena.",
    sourceUrl: "https://flooferland.itch.io/time-at-the-office",
  },
  {
    id: "radio-truth",
    title: "Radio Truth",
    engine: "Godot",
    language: "Inglês",
    voiceActing: "Foco em áudio",
    license: "Código GPLv2 · Assets CC BY 4.0",
    notes: "Especialmente útil para testar um jogo em que áudio é parte central da experiência.",
    sourceUrl: "https://nrgs.itch.io/radio-truth",
  },
];

export type DubVoiceStyle = "clara" | "suave" | "grave" | "energética" | "neutra";

export interface DubbingCue {
  id: string;
  scene: string;
  character: string;
  sourceText: string;
  ptBR: string;
  voice: DubVoiceStyle;
  sourceAudio?: string;
  targetAudio?: string;
  durationMs?: number;
  notes?: string;
}

export interface DubbingProject {
  name: string;
  targetLocale: "pt-BR";
  cues: DubbingCue[];
}

export function parseDubbingJson(input: string): DubbingProject {
  const raw = JSON.parse(input) as {
    name?: string;
    cues?: Array<Record<string, unknown>>;
  };
  const cues = Array.isArray(raw.cues) ? raw.cues.map((cue, index) => ({
    id: String(cue.id ?? `cue-${index + 1}`),
    scene: String(cue.scene ?? "Cena"),
    character: String(cue.character ?? "Narrador"),
    sourceText: String(cue.sourceText ?? cue.text ?? ""),
    ptBR: String(cue.ptBR ?? ""),
    voice: (["clara","suave","grave","energética","neutra"].includes(String(cue.voice)) ? String(cue.voice) : "neutra") as DubVoiceStyle,
    sourceAudio: cue.sourceAudio ? String(cue.sourceAudio) : undefined,
    targetAudio: cue.targetAudio ? String(cue.targetAudio) : undefined,
    durationMs: typeof cue.durationMs === "number" ? cue.durationMs : undefined,
    notes: cue.notes ? String(cue.notes) : undefined,
  })) : [];
  return { name: raw.name ?? "Projeto de dublagem", targetLocale: "pt-BR", cues };
}

export function exportDubbingManifest(project: DubbingProject) {
  return JSON.stringify({
    format: "kairo-dubbing-manifest",
    version: 1,
    targetLocale: "pt-BR",
    project: project.name,
    generatedAt: new Date().toISOString(),
    cues: project.cues.map((cue) => ({
      ...cue,
      ready: Boolean(cue.ptBR.trim()),
    })),
  }, null, 2);
}

export const SAMPLE_DUBBING: DubbingProject = {
  name: "Demo de dublagem PT-BR",
  targetLocale: "pt-BR",
  cues: [
    {
      id: "intro-001",
      scene: "Abertura",
      character: "Nara",
      sourceText: "You made it. I thought the storm would delay you.",
      ptBR: "Você chegou. Achei que a tempestade fosse atrasar você.",
      voice: "suave",
    },
    {
      id: "intro-002",
      scene: "Abertura",
      character: "Narrador",
      sourceText: "The station crossed the night in silence.",
      ptBR: "A estação atravessou a noite em silêncio.",
      voice: "grave",
    },
  ],
};


export interface AaaLocalizationProfile {
  id: string;
  title: string;
  ratingNote: string;
  officialTool: string;
  toolUrl: string;
  voiceSupport: string;
  localizationSupport: string;
  localInstallRequired: boolean;
  exportMode: string;
  priority: number;
}

export const AAA_LOCALIZATION_PROFILES: AaaLocalizationProfile[] = [
  {
    id: "witcher-3",
    title: "The Witcher 3: Wild Hunt",
    ratingNote: "Conteúdo maduro por violência, linguagem e temas adultos.",
    officialTool: "The Witcher 3 REDkit",
    toolUrl: "https://www.thewitcher.com/us/pt-br/redkit",
    voiceSupport: "Scene Editor, áudio original disponível no REDkit e fluxo de sincronização labial.",
    localizationSupport: "Cenas, diálogos, interface e conteúdo de quests podem ser trabalhados como mod.",
    localInstallRequired: true,
    exportMode: "Mod PT-BR separado, sem incluir o jogo base.",
    priority: 1,
  },
  {
    id: "fallout-4",
    title: "Fallout 4",
    ratingNote: "Conteúdo maduro por violência, linguagem e temas pesados.",
    officialTool: "Creation Kit",
    toolUrl: "https://fallout.bethesda.net/",
    voiceSupport: "Suporte a arquivos WAV/FUZ e LipGen no Creation Kit.",
    localizationSupport: "Creation Kit com exportação de localização.",
    localInstallRequired: true,
    exportMode: "Plugin/arquivos de mod PT-BR referenciando a instalação local.",
    priority: 2,
  },
  {
    id: "cyberpunk-2077",
    title: "Cyberpunk 2077",
    ratingNote: "Conteúdo maduro por violência, linguagem e temas adultos.",
    officialTool: "REDmod",
    toolUrl: "https://www.cyberpunk.net/pt-br/modding-support",
    voiceSupport: "REDmod suporta sons personalizados, animações e scripts.",
    localizationSupport: "Pipeline de mod com assets e scripts personalizados.",
    localInstallRequired: true,
    exportMode: "Pacote REDmod separado para a cópia instalada do jogo.",
    priority: 3,
  },
  {
    id: "skyrim-se",
    title: "The Elder Scrolls V: Skyrim Special Edition",
    ratingNote: "Conteúdo maduro por violência e temas de fantasia.",
    officialTool: "Creation Kit / Creations",
    toolUrl: "https://elderscrolls.bethesda.net/",
    voiceSupport: "Ecossistema de Creation Kit e mods com diálogos/áudio.",
    localizationSupport: "Strings e plugins podem ser localizados por mod.",
    localInstallRequired: true,
    exportMode: "Plugin e assets PT-BR separados da instalação base.",
    priority: 4,
  },
  {
    id: "starfield",
    title: "Starfield",
    ratingNote: "Conteúdo maduro por violência, linguagem e temas de ficção científica.",
    officialTool: "Starfield Creation Kit",
    toolUrl: "https://help.bethesda.net/app/answers/detail/a_id/65849/~/where-do-i-get-the-creation-kit-for-starfield",
    voiceSupport: "Ecossistema Creation Kit com mods de voz e lipsync já publicados pela comunidade.",
    localizationSupport: "Strings, plugins, assets e pacotes de localização podem ser distribuídos como Creation.",
    localInstallRequired: true,
    exportMode: "Creation/mod PT-BR separado usando a instalação local.",
    priority: 4,
  },
  {
    id: "bannerlord",
    title: "Mount & Blade II: Bannerlord",
    ratingNote: "Conteúdo maduro por violência medieval e guerra.",
    officialTool: "Bannerlord Modding Tools",
    toolUrl: "https://moddocs.bannerlord.com/",
    voiceSupport: "Ferramentas oficiais abrangem módulos, assets, cenas e áudio.",
    localizationSupport: "Módulos podem sobrescrever dados nativos sem copiar os arquivos originais.",
    localInstallRequired: true,
    exportMode: "Módulo PT-BR separado e empacotado como mod.",
    priority: 5,
  },
  {
    id: "baldurs-gate-3",
    title: "Baldur's Gate 3",
    ratingNote: "Conteúdo maduro por violência, linguagem e temas adultos.",
    officialTool: "Baldur's Gate 3 Toolkit",
    toolUrl: "https://baldursgate3.game/",
    voiceSupport: "Perfil experimental para cenas/diálogos, dependendo das limitações do Toolkit.",
    localizationSupport: "Toolkit oficial para criação e distribuição de mods.",
    localInstallRequired: true,
    exportMode: "Mod separado usando a instalação local.",
    priority: 7,
  },
];

export function buildAaaProjectTemplate(profile: AaaLocalizationProfile) {
  return {
    format: "kairo-aaa-localization-project",
    version: 1,
    gameId: profile.id,
    gameTitle: profile.title,
    targetLocale: "pt-BR",
    requiresLocalInstall: profile.localInstallRequired,
    officialTool: profile.officialTool,
    exportMode: profile.exportMode,
    text: {
      status: "aguardando-importacao-local",
      sourceLocale: "en",
      chunks: [],
    },
    dubbing: {
      status: "aguardando-roteiro-local",
      characters: [],
      cues: [],
    },
    scenes: {
      status: "aguardando-mapeamento",
      entries: [],
    },
  };
}
