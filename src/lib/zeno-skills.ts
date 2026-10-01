export type ZenoSkillId =
  | "general"
  | "planning"
  | "code"
  | "terminal"
  | "github"
  | "google"
  | "research"
  | "web"
  | "files"
  | "memory"
  | "automation"
  | "documents"
  | "data"
  | "design"
  | "image"
  | "translation"
  | "summarize"
  | "math"
  | "project";

export interface ZenoSkillModule {
  id: ZenoSkillId;
  label: string;
  description: string;
  triggers: RegExp;
  prompt: string;
}

const definitions: Array<[ZenoSkillId, string, string, RegExp, string]> = [
  ["planning", "Planejamento", "Quebra tarefas grandes em etapas verificáveis", /planej|etapas|passos|roadmap|estrat[eé]gia|organiza/i, "Divida tarefas complexas em etapas pequenas, verifique dependências e conclua cada etapa antes de seguir."],
  ["code", "Código", "Criação, revisão e depuração de software", /c[oó]digo|programa|api|script|typescript|javascript|python|react|html|css|node|bug|erro/i, "Entregue soluções completas por arquivo, preserve o contexto do projeto e valide premissas antes de alterar código."],
  ["terminal", "Terminal", "Comandos locais no aplicativo desktop", /terminal|comando|shell|git status|git diff|listar arquivo|pwd|ls/i, "No desktop, use a ferramenta de terminal quando ela estiver disponível. Nunca diga que executou um comando sem receber o resultado da ferramenta."],
  ["github", "GitHub", "Leitura de repositórios conectados", /github|reposit[oó]rio|repo|pull request|commit|branch/i, "Use o conector GitHub quando o usuário pedir dados do próprio repositório. Leia primeiro, depois responda; não invente arquivos nem commits."],
  ["google", "Google", "Pesquisa e arquivos do Google conectados", /google|drive|docs|documentos do google|workspace/i, "Use o conector Google somente quando conectado. Não afirme acesso a arquivos que não foram retornados pela ferramenta."],
  ["research", "Pesquisa", "Pesquisa atual com fontes", /pesquis|buscar|not[ií]cia|atual|refer[eê]ncia|fonte|hoje|agora/i, "Quando a informação puder ter mudado, use pesquisa web e diferencie fatos encontrados de inferências."],
  ["web", "Web", "Sites, páginas e conteúdo online", /site|p[aá]gina|website|url|link|web/i, "Analise páginas com foco no pedido do usuário e preserve URLs reais retornadas pelas ferramentas."],
  ["files", "Arquivos", "Leitura e organização de arquivos", /arquivo|anexo|pasta|documento|biblioteca|salvar|ler arquivo/i, "Use ferramentas de arquivo quando disponíveis e mantenha claro qual conteúdo veio de qual arquivo."],
  ["memory", "Memória", "Contexto e preferências persistentes", /lembre|mem[oó]ria|prefer[eê]ncia|contexto|hist[oó]rico/i, "Use apenas memória realmente fornecida pelo produto; não finja lembrar algo ausente."],
  ["automation", "Automação", "Rotinas e fluxos com ferramentas", /automat|workflow|rotina|agend|monitor|todo dia|toda semana/i, "Explique o que será automatizado, preserve permissões e confirme ações externas destrutivas."],
  ["documents", "Documentos", "Relatórios, textos e sínteses", /relat[oó]rio|pdf|curr[ií]culo|contrato|documento/i, "Organize o resultado em uma estrutura adequada ao documento e preserve fatos e fontes."],
  ["data", "Dados", "Tabelas, métricas e análise", /planilha|csv|tabela|gr[aá]fico|dados|estat[ií]stica/i, "Explique premissas, unidades e limitações. Não fabrique números ausentes."],
  ["design", "Design", "UI, UX e sistemas de interface", /design|interface|ui|ux|layout|componente|visual/i, "Priorize hierarquia, legibilidade, acessibilidade, responsividade e consistência."],
  ["image", "Imagem", "Análise e trabalho visual", /imagem|foto|png|jpg|ilustra|visual/i, "Descreva somente o que está disponível e nunca invente detalhes invisíveis."],
  ["translation", "Tradução", "Tradução e localização", /traduz|tradu[cç][aã]o|ingl[eê]s|espanhol|idioma|localiza/i, "Preserve intenção, tom, nomes próprios e formatação relevante."],
  ["summarize", "Resumo", "Síntese e extração", /resum|resuma|s[ií]ntese|pontos principais|principais pontos/i, "Separe fatos, decisões, pendências e próximos passos quando isso ajudar."],
  ["math", "Cálculo", "Cálculos e raciocínio quantitativo", /calcule|c[aá]lculo|equação|porcentagem|m[eé]dia|soma|multiplica/i, "Mostre a resposta com unidades e verifique o resultado."],
  ["project", "Projeto", "Trabalho contínuo em projetos", /projeto|app|aplicativo|produto|sdk|deploy|arquitetura/i, "Mantenha continuidade entre arquivos, decisões técnicas, riscos e próximos passos."],
];

export const ZENO_SKILLS: ZenoSkillModule[] = definitions.map(
  ([id, label, description, triggers, prompt]) => ({ id, label, description, triggers, prompt }),
);

export function detectZenoSkills(message: string): ZenoSkillId[] {
  const detected = ZENO_SKILLS.filter((skill) => skill.triggers.test(message)).map((skill) => skill.id);
  return detected.length ? [...new Set(detected)] : ["general"];
}

export function loadZenoSkills(message: string): ZenoSkillModule[] {
  const detected = detectZenoSkills(message);
  if (detected[0] === "general") {
    return [{
      id: "general",
      label: "Geral",
      description: "Assistente geral",
      triggers: /.*/i,
      prompt: "Responda de forma direta, útil e proporcional ao pedido.",
    }];
  }
  return ZENO_SKILLS.filter((skill) => detected.includes(skill.id));
}

export function buildSkillInstructions(message: string): string {
  return loadZenoSkills(message)
    .map((skill) => `[${skill.label}] ${skill.prompt}`)
    .join("\n");
}
