export type KairoSkillId =
  | "story" | "rpg" | "character" | "worldbuilding" | "code" | "debug" | "research"
  | "web" | "video" | "image" | "design" | "files" | "memory" | "automation"
  | "documents" | "data" | "translation" | "summarize" | "planning" | "writing"
  | "learning" | "business" | "math" | "general";

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
  ["character", "Personagens", "Personas, perfis e arcos", /personagem|avatar|persona|biografia|personalidade/i, "Crie personagens coerentes com objetivos e evolução."],
  ["worldbuilding", "Mundos", "Lore e ambientação", /mundo|lore|universo|geografia|fac[cç][aã]o|fantasia/i, "Conecte história, lugares, regras e culturas."],
  ["code", "Código", "Programação e revisão", /c[oó]digo|programa|api|script|typescript|javascript|python|react|html|css|node/i, "Entregue código completo, seguro e organizado por arquivo, em blocos com a linguagem indicada."],
  ["debug", "Depurar", "Erros, bugs e logs", /erro|bug|falha|debug|stack ?trace|exception|n[aã]o funciona|crash/i, "Identifique a causa provável, explique por quê e dê a correção mínima, depois como testar."],
  ["research", "Pesquisa", "Busca e síntese", /pesquis|buscar|not[ií]cia|atual|refer[eê]ncia|fonte|dados/i, "Diferencie fatos, inferências e fontes."],
  ["web", "Web", "Sites e páginas", /\bsite\b|p[aá]gina|landing|website|\burl\b|\blink\b/i, "Priorize estrutura, acessibilidade e responsividade."],
  ["video", "Vídeo", "Vídeos e referências", /youtube|v[ií]deo|vimeo|tutorial|assistir/i, "Não invente vídeos ou links."],
  ["image", "Imagens", "Imagens e referências visuais", /imagem|foto|png|jpg|visual|ilustra/i, "Descreva ou organize referências sem inventar arquivos."],
  ["design", "Design", "UI, UX e interfaces", /design|interface|\bui\b|\bux\b|glass|liquid|layout/i, "Use hierarquia visual, acessibilidade e componentes reutilizáveis."],
  ["files", "Arquivos", "Artefatos e documentos", /arquivo|artefato|download|salvar|biblioteca/i, "Nomeie arquivos claramente e preserve relações entre eles."],
  ["memory", "Memória", "Contexto e preferências", /lembre|mem[oó]ria|prefer[eê]ncia|contexto|hist[oó]rico/i, "Use somente contexto realmente disponível."],
  ["automation", "Automação", "Workflows e tarefas", /automat|workflow|fluxo|rotina|agend|todo dia|toda semana/i, "Descreva etapas, sugira o horário/recorrência e confirme ações destrutivas."],
  ["documents", "Documentos", "Relatórios e documentos", /documento|relat[oó]rio|pdf|curr[ií]culo|contrato/i, "Organize em seções claras e formato adequado."],
  ["data", "Dados", "Tabelas e análise", /planilha|csv|tabela|gr[aá]fico|an[aá]lise de dados/i, "Explique premissas e limitações."],
  ["translation", "Tradução", "Idiomas e localização", /traduz|tradu[cç][aã]o|ingl[eê]s|espanhol|localiza/i, "Preserve intenção, tom e formatação."],
  ["summarize", "Resumo", "Síntese e extração", /resum|s[ií]ntese|pontos principais/i, "Separe fatos, decisões, pendências e próximos passos."],
  ["planning", "Planejamento", "Metas, planos e cronogramas", /planej|plano|cronograma|meta|priorid|organiz/i, "Quebre em etapas com prazos realistas, dependências e o primeiro passo concreto."],
  ["writing", "Escrita", "E-mails, posts e textos", /e-?mail|carta|redij|reescrev|post|legenda|copy/i, "Adapte tom e público; entregue versão pronta para usar e, se útil, uma alternativa."],
  ["learning", "Estudo", "Explicações e exercícios", /explique|ensine|estud|aprend|prova|exerc[ií]cio|quiz/i, "Explique do simples ao complexo, com exemplo e um pequeno exercício de verificação."],
  ["business", "Negócios", "Marketing, vendas e produto", /neg[oó]cio|empresa|marketing|vendas|startup|cliente|pre[cç]o/i, "Seja prático: hipóteses, métricas, riscos e próximos experimentos."],
  ["math", "Matemática", "Cálculos e fórmulas", /calcul|equa[cç]|matem|f[oó]rmula|porcentagem|juros/i, "Mostre os passos, confira o resultado e informe unidades."],
];

export const KAIRO_SKILLS: KairoSkillModule[] = definitions.map(
  ([id, label, description, triggers, prompt]) => ({ id, label, description, triggers, prompt }),
);

export function detectKairoSkills(message: string, disabled: string[] = []): KairoSkillId[] {
  const detected = KAIRO_SKILLS.filter((s) => !disabled.includes(s.id) && s.triggers.test(message)).map((s) => s.id);
  return detected.length ? detected : ["general"];
}

export function buildSkillInstructions(message: string, disabled: string[] = []): string {
  const detected = detectKairoSkills(message, disabled);
  if (detected[0] === "general") return "[Kairo] Responda diretamente e com contexto.";
  return KAIRO_SKILLS.filter((s) => detected.includes(s.id)).map((s) => `[${s.label}] ${s.prompt}`).join("\n");
}
