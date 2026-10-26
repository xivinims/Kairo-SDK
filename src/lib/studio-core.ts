export type StudioStageId =
  | "ingest"
  | "extract"
  | "translate"
  | "review"
  | "dub"
  | "sync"
  | "package"
  | "release";

export interface StudioStage {
  id: StudioStageId;
  label: string;
  status: "bloqueado" | "pronto" | "em-andamento" | "concluido";
  completed: number;
  total: number;
  notes?: string;
}

export interface ProductionProject {
  id: string;
  gameTitle: string;
  gameId: string;
  targetLocale: "pt-BR";
  sourceLocale: string;
  createdAt: string;
  sourceMode: "local-install" | "exported-files";
  stages: StudioStage[];
  stats: {
    strings: number;
    translated: number;
    reviewed: number;
    voiceCues: number;
    dubbed: number;
    scenes: number;
    qaErrors: number;
    qaWarnings: number;
  };
}

const STAGES: Array<[StudioStageId, string]> = [
  ["ingest", "Importar"],
  ["extract", "Extrair"],
  ["translate", "Traduzir"],
  ["review", "Revisar"],
  ["dub", "Dublar"],
  ["sync", "Sincronizar"],
  ["package", "Empacotar"],
  ["release", "Publicar"],
];

export function createProductionProject(gameId: string, gameTitle: string): ProductionProject {
  return {
    id: `${gameId}-ptbr`,
    gameTitle,
    gameId,
    targetLocale: "pt-BR",
    sourceLocale: "en",
    createdAt: new Date().toISOString(),
    sourceMode: "local-install",
    stages: STAGES.map(([id, label], index) => ({
      id,
      label,
      status: index === 0 ? "pronto" : "bloqueado",
      completed: 0,
      total: 0,
    })),
    stats: {
      strings: 0,
      translated: 0,
      reviewed: 0,
      voiceCues: 0,
      dubbed: 0,
      scenes: 0,
      qaErrors: 0,
      qaWarnings: 0,
    },
  };
}

export function stageProgress(stage: StudioStage) {
  if (stage.status === "concluido") return 100;
  if (!stage.total) return 0;
  return Math.max(0, Math.min(100, Math.round((stage.completed / stage.total) * 100)));
}

export function overallProgress(project: ProductionProject) {
  const values = project.stages.map(stageProgress);
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function nextAction(project: ProductionProject) {
  const active = project.stages.find((stage) => stage.status === "em-andamento" || stage.status === "pronto");
  if (!active) return "Projeto concluído";
  const map: Record<StudioStageId, string> = {
    ingest: "Selecionar a instalação local ou os arquivos exportados pela ferramenta oficial.",
    extract: "Extrair strings, cenas e referências de áudio para o manifesto do Kairo.",
    translate: "Processar os próximos lotes usando memória de tradução e glossário.",
    review: "Revisar termos de lore, placeholders e naturalidade do PT-BR.",
    dub: "Produzir vozes PT-BR por personagem usando vozes autorizadas.",
    sync: "Ajustar duração, lipsync e timing de cenas/legendas.",
    package: "Gerar o pacote de mod sem incluir arquivos proprietários do jogo base.",
    release: "Executar QA final, créditos, licença e metadados de publicação.",
  };
  return map[active.id];
}

export function productionHealth(project: ProductionProject) {
  const { qaErrors, qaWarnings } = project.stats;
  if (qaErrors > 0) return { label: "Bloqueado por QA", score: 20 };
  if (qaWarnings > 25) return { label: "Precisa revisão", score: 55 };
  const progress = overallProgress(project);
  return { label: progress >= 90 ? "Quase pronto" : progress >= 40 ? "Em produção" : "Preparação", score: Math.max(65, progress) };
}
