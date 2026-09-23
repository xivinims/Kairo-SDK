export type KairoSkillId =
  | "story" | "rpg" | "character" | "worldbuilding" | "code" | "research"
  | "web" | "video" | "image" | "design" | "files" | "memory"
  | "automation" | "documents" | "data" | "translation" | "summarize" | "general";

export interface KairoSkillModule {
  id: KairoSkillId;
  label: string;
  description: string;
  triggers: RegExp;
  prompt: string;
}

const definitions: Array<[KairoSkillId, string, string, RegExp, string]> = [
  ["story", "Histórias", "Narrativas, cenas e roteiros", /hist[oó]ria|conto|roteiro|narrativa|enredo/i, "Preserve tom, personagens, continuidade e ritmo."],
  ["rpg", "RPG", "Mestre, regras e campanhas", /rpg|mestre|campanha|npc|aventura|ficha|duelo/i, "Mantenha estado, regras, consequências e escolhas."],
  ["character", "Personagens", "Personas, perfis e arcos", /personagem|avatar|persona|biografia|personalidade|caracter/i, "Crie personagens coerentes com objetivos e evolução."],
  ["worldbuilding", "Mundos", "Lore e ambientação", /mundo|lore|universo|geografia|fac[cç][aã]o|fantasia/i, "Conecte história, lugares, regras e culturas."],
  ["code", "Código", "Programação e revisão", /c[oó]digo|programa|api|script|typescript|javascript|python|react|html|css|node/i, "Entregue código completo, seguro e organizado por arquivo."],
  ["research", "Pesquisa", "Busca e síntese", /pesquis|buscar|not[ií]cia|atual|refer[eê]ncia|fonte|dados/i, "Diferencie fatos, inferências e fontes."],
  ["web", "Web", "Sites e páginas", /site|p[aá]gina|landing|website|url|link/i, "Priorize estrutura, acessibilidade e responsividade."],
  ["video", "Vídeo", "Vídeos e referências", /youtube|v[ií]deo|vimeo|tutorial|assistir/i, "Não invente vídeos ou links."],
  ["image", "Imagens", "Imagens e referências visuais", /imagem|foto|png|jpg|visual|ilustra/i, "Descreva ou organize referências sem inventar arquivos."],
  ["design", "Design", "UI, UX e interfaces", /design|interface|ui|ux|glass|liquid|layout/i, "Use hierarquia visual, acessibilidade e componentes reutilizáveis."],
  ["files", "Arquivos", "Artefatos e documentos", /arquivo|documento|artefato|download|salvar|biblioteca/i, "Nomeie arquivos claramente e preserve relações entre eles."],
  ["memory", "Memória", "Contexto e preferências", /lembre|mem[oó]ria|prefer[eê]ncia|contexto|hist[oó]rico/i, "Use somente contexto realmente disponível."],
  ["automation", "Automação", "Workflows e tarefas", /automat|workflow|fluxo|rotina|agend/i, "Descreva etapas e confirme ações externas destrutivas."],
  ["documents", "Documentos", "Relatórios e documentos", /documento|relat[oó]rio|pdf|curr[ií]culo|contrato/i, "Organize em seções claras e formato adequado."],
  ["data", "Dados", "Tabelas e análise", /planilha|csv|tabela|gr[aá]fico|an[aá]lise de dados/i, "Explique premissas e limitações."],
  ["translation", "Tradução", "Idiomas e localização", /traduz|tradu[cç][aã]o|ingl[eê]s|espanhol|localiza/i, "Preserve intenção, tom e formatação."],
  ["summarize", "Resumo", "Síntese e extração", /resum|resuma|s[ií]ntese|pontos principais/i, "Separe fatos, decisões, pendências e próximos passos."],
];

export const KAIRO_SKILLS: KairoSkillModule[] = definitions.map(
  ([id, label, description, triggers, prompt]) => ({ id, label, description, triggers, prompt }),
);

export function detectKairoSkills(message: string): KairoSkillId[] {
  const detected = KAIRO_SKILLS.filter((skill) => skill.triggers.test(message)).map((skill) => skill.id);
  return detected.length ? detected : ["general"];
}

export function loadKairoSkills(message: string): KairoSkillModule[] {
  const detected = detectKairoSkills(message);
  if (detected[0] === "general") {
    return [{ id: "general", label: "Kairo", description: "Assistente geral", triggers: /.*/i, prompt: "Responda diretamente e com contexto." }];
  }
  return KAIRO_SKILLS.filter((skill) => detected.includes(skill.id));
}

export function buildSkillInstructions(message: string): string {
  return loadKairoSkills(message).map((skill) => `[${skill.label}] ${skill.prompt}`).join("\n");
}
