export type KairoSkillId =
  | "story"
  | "rpg"
  | "character"
  | "worldbuilding"
  | "code"
  | "research"
  | "web"
  | "video"
  | "image"
  | "design"
  | "files"
  | "memory"
  | "general";

export interface KairoSkillModule {
  id: KairoSkillId;
  label: string;
  description: string;
  triggers: RegExp;
  prompt: string;
}

export const KAIRO_SKILL_MODULES: KairoSkillModule[] = [
  { id: "story", label: "Histórias", description: "Narrativas e roteiros", triggers: /hist[oó]ria|conto|roteiro|narrativa|enredo/i, prompt: "Preserve tom, personagens, continuidade e ritmo narrativo." },
  { id: "rpg", label: "RPG", description: "Mestre, regras e campanhas", triggers: /rpg|mestre|campanha|npc|aventura|ficha/i, prompt: "Mantenha estado da campanha, regras, consequências e escolhas do jogador." },
  { id: "character", label: "Personagens", description: "Personas e arcos", triggers: /personagem|avatar|persona|biografia|personalidade/i, prompt: "Crie personagens coerentes, com objetivos, limites e evolução." },
  { id: "worldbuilding", label: "Mundos", description: "Lore e ambientação", triggers: /mundo|lore|universo|geografia|facção|fantasia/i, prompt: "Construa relações consistentes entre história, lugares, regras e culturas." },
  { id: "code", label: "Código", description: "Programação e revisão", triggers: /c[oó]digo|programa|api|script|typescript|javascript|python|react|html|css/i, prompt: "Entregue código completo, seguro, tipado quando possível e separado por arquivo." },
  { id: "research", label: "Pesquisa", description: "Busca e síntese", triggers: /pesquis|buscar|not[ií]cia|atual|refer[eê]ncia|fonte/i, prompt: "Separe fatos, inferências e fontes. Não invente links ou dados atuais." },
  { id: "web", label: "Web", description: "Páginas e links", triggers: /site|p[aá]gina|landing|website|url|link/i, prompt: "Quando criar um site, entregue estrutura de arquivos e um artefato HTML visualizável." },
  { id: "video", label: "Vídeo", description: "Referências em vídeo", triggers: /youtube|v[ií]deo|vimeo|tutorial|assistir/i, prompt: "Inclua links de vídeo reais somente quando fornecidos ou encontrados por busca." },
  { id: "image", label: "Imagens", description: "Imagens e referências", triggers: /imagem|foto|png|jpg|visual|ilustra/i, prompt: "Descreva ou organize imagens sem alegar ter criado um arquivo se não houver ferramenta." },
  { id: "design", label: "Design", description: "UI e liquid glass", triggers: /design|interface|ui|ux|glass|liquid|layout/i, prompt: "Use hierarquia visual, acessibilidade, responsividade e componentes reutilizáveis." },
  { id: "files", label: "Arquivos", description: "Artefatos e biblioteca", triggers: /arquivo|documento|artefato|download|salvar|biblioteca/i, prompt: "Separe arquivos por nome, linguagem, tipo MIME e relação com a conversa." },
  { id: "memory", label: "Memória", description: "Contexto persistente", triggers: /lembre|mem[oó]ria|prefer[eê]ncia|contexto|hist[oó]rico/i, prompt: "Use somente memórias relevantes e não invente dados pessoais." },
];

export function loadKairoSkills(message: string): KairoSkillModule[] {
  const loaded = KAIRO_SKILL_MODULES.filter((skill) => skill.triggers.test(message));
  return loaded.length > 0 ? loaded : [
    { id: "general", label: "Kairo", description: "Assistente geral", triggers: /.*/i, prompt: "Responda diretamente e peça esclarecimentos apenas quando necessário." },
  ];
}

export function buildSkillInstructions(message: string) {
  return loadKairoSkills(message).map((skill) => `[${skill.label}] ${skill.prompt}`).join("\n");
}
