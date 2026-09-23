export type KairoContentLevel = "safe" | "mature" | "adult";

export type KairoSkill =
  | "story"
  | "rpg"
  | "character"
  | "worldbuilding"
  | "code"
  | "research"
  | "general";

export interface KairoAgentRequest {
  message: string;
  ageVerified?: boolean;
  contentLevel?: KairoContentLevel;
  allowAdultThemes?: boolean;
  allowExplicitSexualContent?: boolean;
  apiKey?: string;
  sessionId?: string;
  context?: string;
}

export interface KairoAgentResult {
  ok: boolean;
  answer?: string;
  skills: KairoSkill[];
  plan: string[];
  verification: string;
  safety: string;
  sessionId?: string;
  error?: string;
}

export interface KairoSkillDefinition {
  name: KairoSkill;
  description: string;
  category: "creative" | "game" | "technical" | "research" | "general";
}

export const KAIRO_SKILLS: Record<KairoSkill, KairoSkillDefinition> = {
  story: {
    name: "story",
    description: "Cria histórias, narrativas, enredos e cenas detalhadas.",
    category: "creative",
  },
  rpg: {
    name: "rpg",
    description: "Atua como mestre de RPG com personagens, desafios e cenas interativas.",
    category: "game",
  },
  character: {
    name: "character",
    description: "Cria perfis, personalidades, arcos e evolução de personagens.",
    category: "creative",
  },
  worldbuilding: {
    name: "worldbuilding",
    description: "Constrói universos, regras, lore, ambientes e geografia.",
    category: "creative",
  },
  code: {
    name: "code",
    description: "Gera, lê e corrige códigos e implementações técnicas.",
    category: "technical",
  },
  research: {
    name: "research",
    description: "Busca, organiza e resume informações relevantes em contexto.",
    category: "research",
  },
  general: {
    name: "general",
    description: "Respostas gerais, apoio direto e execução multimodal de tarefas.",
    category: "general",
  },
};

const BLOCKED_PATTERNS = [
  "child sexual",
  "sex with minors",
  "minor sexual",
  "underage sexual",
  "nonconsensual sex",
  "sexual exploitation",
  "incest",
  "bestiality",
  "forced sex",
  "rape",
];

const SAFE_KEYWORDS = [
  "historia",
  "história",
  "story",
  "rpg",
  "mestre",
  "campanha",
  "personagem",
  "npc",
  "mundo",
  "lore",
  "fantasia",
  "aventura",
  "roteiro",
  "codigo",
  "código",
  "programa",
  "api",
  "script",
  "pesquisa",
  "buscar",
  "informação",
  "dados",
];

function normalizeText(value: string) {
  return value.trim();
}

function detectSkills(message: string): KairoSkill[] {
  const text = message.toLowerCase();
  const detected: KairoSkill[] = [];

  if (/(historia|história|story|enredo|narrativa|roteiro)/.test(text)) {
    detected.push("story");
  }

  if (/(rpg|mestre|campanha|npc|aventura|duelo|personagem)/.test(text)) {
    detected.push("rpg");
  }

  if (/(personagem|avatar|perfil|caracter|arco|biografia)/.test(text)) {
    detected.push("character");
  }

  if (/(mundo|lore|universo|regras|geografia|fantasia|campanha)/.test(text)) {
    detected.push("worldbuilding");
  }

  if (/(codigo|código|api|script|typescript|python|javascript|node|react|programa)/.test(text)) {
    detected.push("code");
  }

  if (/(pesquisa|buscar|informação|dados|estudo|investig|pesquisas|notícia|noticia)/.test(text)) {
    detected.push("research");
  }

  if (detected.length === 0) {
    return ["general"];
  }

  const unique: KairoSkill[] = [];
  for (const skill of detected) {
    if (!unique.includes(skill)) unique.push(skill);
  }
  return unique;
}

function buildPlan(skills: KairoSkill[], message: string) {
  const normalized = normalizeText(message);

  return [
    "Entender a intenção principal do usuário e o nível de conteúdo solicitado.",
    `Selecionar as skills relevantes: ${skills.join(", ") || "general"}.`,
    "Criar uma resposta rica, coerente e adaptada ao tom do usuário.",
    "Verificar se o resultado atende ao objetivo, ao contexto e às regras de segurança.",
    normalized.length > 220
      ? "Manter consistência narrativa, identidade do personagem e contexto longo."
      : "Responder com clareza, fluidez e profundidade sem lambança excessiva.",
  ];
}

export function validateKairoRequest(request: KairoAgentRequest): { ok: true } | { ok: false; error: string } {
  const message = normalizeText(request.message ?? "");

  if (!message) {
    return { ok: false, error: "Mensagem vazia." };
  }

  if (request.ageVerified !== true && (request.contentLevel === "mature" || request.contentLevel === "adult")) {
    return { ok: false, error: "Idade não confirmada para conteúdo adulto ou maduro." };
  }

  if (!request.allowAdultThemes && request.contentLevel === "adult") {
    return { ok: false, error: "Temas adultos estão desabilitados neste ambiente." };
  }

  if (!request.allowExplicitSexualContent && request.allowAdultThemes && request.contentLevel === "adult") {
    return { ok: false, error: "Conteúdo sexual explícito não está permitido aqui." };
  }

  const lowered = message.toLowerCase();
  if (BLOCKED_PATTERNS.some((pattern) => lowered.includes(pattern))) {
    return { ok: false, error: "Solicitação bloqueada por política de conteúdo e segurança." };
  }

  return { ok: true };
}

function buildExecutionPrompt(request: KairoAgentRequest, skills: KairoSkill[]) {
  const levelLabel = request.contentLevel ?? "mature";
  const core = [
    "Você é o Kairo Pro, um agente criativo e estratégico.",
    "Responda em português brasileiro, com naturalidade, profundidade e personalidade.",
    "Seu papel é ajudar com criação, RPG, narrativas, personagens, mundos, pesquisa e programação.",
    `Skill principal: ${skills.join(", ") || "general"}.`,
    `Nível de conteúdo: ${levelLabel}.`,
    "Nunca gere conteúdo ilegal, exploração, violência sexual, abuso sexual, menores envolvidos em sexo, coerção ou abuso.",
    "Se a solicitação chegar perto de um limite de segurança, reduza, reescreva ou recuse com elegância.",
    "No conteúdo adulto permitido, mantenha foco em ficção consensual, intensidade emocional e fantasia sem desrespeito.",
    "Se for história ou RPG, mantenha consistência de personagem, cenário, humor e conflito.",
    "Se for código, entregue soluções úteis, tipadas e sem placeholders vazios.",
    "Use a memória contextual do usuário quando ela estiver no contexto da conversa.",
  ];

  const contextBlock = request.context?.trim()
    ? `Contexto do usuário:\n${request.context.trim()}\n\n`
    : "";

  return `${core.join("\n")}\n\n${contextBlock}Mensagem do usuário:\n${normalizeText(request.message)}`;
}

function buildVerificationPrompt(request: KairoAgentRequest, answer: string, skills: KairoSkill[]) {
  const skillNames = skills.join(", ");
  return [
    "Você é o verificador do Kairo Pro.",
    "Avalie se a resposta atende ao pedido do usuário, ao contexto e às regras de segurança.",
    "Confirme: clareza, coesão, realismo, consistência, valor prático e ausência de conteúdo proibido.",
    `Skills esperadas: ${skillNames}.`,
    "Se a resposta falhar em qualquer critério, reformule em um texto melhor e mais seguro.",
    "Retorne apenas um resumo da validação em 3 a 6 frases, sem explicações excessivas.",
    "\nResposta original:\n",
    answer,
  ].join("\n");
}

async function generateWithGemini(apiKey: string, prompt: string): Promise<string> {
  const key = apiKey.trim();
  if (!key) {
    throw new Error("missing-key");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: prompt }],
      },
      contents: [{
        parts: [{ text: "Atue de forma rica, precisa e alinhada ao objetivo e às regras de segurança." }],
      }],
      generationConfig: {
        maxOutputTokens: 2200,
        temperature: 0.9,
        topP: 0.95,
      },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`gemini ${response.status}`);
  }

  const payload = await response.json() as {
    candidates?: {
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }[];
  };

  const text = payload.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("empty");
  }

  return text;
}

export async function askKairoAgent(request: KairoAgentRequest): Promise<KairoAgentResult> {
  const validation = validateKairoRequest(request);
  if (!validation.ok) {
    return {
      ok: false,
      skills: ["general"],
      plan: ["Não foi possível iniciar a execução por segurança."],
      verification: validation.error,
      safety: validation.error,
      sessionId: request.sessionId,
      error: validation.error,
    };
  }

  const skills = detectSkills(request.message);
  const plan = buildPlan(skills, request.message);

  const apiKey = request.apiKey?.trim() || (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY ?? "" : "");
  if (!apiKey) {
    return {
      ok: false,
      skills,
      plan,
      verification: "Chave da Gemini não encontrada.",
      safety: "Falta de credencial de acesso ao modelo.",
      sessionId: request.sessionId,
      error: "missing-key",
    };
  }

  const executionPrompt = buildExecutionPrompt(request, skills);

  try {
    const answer = await generateWithGemini(apiKey, executionPrompt);
    const verified = await generateWithGemini(
      apiKey,
      buildVerificationPrompt(request, answer, skills),
    );

    return {
      ok: true,
      answer,
      skills,
      plan,
      verification: verified,
      safety: "Aprovado após validação de contexto, segurança e coerência.",
      sessionId: request.sessionId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "network";
    return {
      ok: false,
      skills,
      plan,
      verification: "Falha ao executar o agente e verificar o resultado.",
      safety: "Erro operacional durante geração ou validação.",
      sessionId: request.sessionId,
      error: message,
    };
  }
}

export function detectKairoSkills(message: string): KairoSkill[] {
  return detectSkills(message);
}

export function getKairoSkillDescriptions(): Array<KairoSkillDefinition> {
  return Object.values(KAIRO_SKILLS);
}

export function getKairoSkillByName(name: KairoSkill): KairoSkillDefinition | undefined {
  return KAIRO_SKILLS[name];
}

export function isAdultContentAllowed(request: KairoAgentRequest): boolean {
  return Boolean(request.allowAdultThemes || request.contentLevel === "adult") && Boolean(request.ageVerified);
}

export const KAIRO_SAFETY_HINT = "Conteúdo adulto permitido apenas com maioridade confirmada, sem exploração, menores, coerção ou material ilegal.";

export const KAIRO_DEFAULT_TEXT = `Você é o Kairo Pro. Use suas skills para criar histórias, RPGs, personagens, mundos e apoio técnico com raciocínio em duas etapas: primeiro planejar, depois validar.`;

export const KAIRO_ANCHOR = "Kairo Agent Core";

export const SAFE_CONTENT_PROMPT = "Responder com segurança, clareza e criatividade, evitando qualquer conteúdo proibido ou abusivo.";

export const KAIRO_HEALTH_CHECK = {
  status: "online",
  name: "Kairo Pro",
  model: "gemini-2.5-flash",
  policies: [
    "idade obrigatória para conteúdo adulto",
    "bloqueio de abuso sexual e menores",
    "validação final com verificador",
    "skills ativas por contexto",
  ],
};

export function matchesAdultRequest(message: string) {
  const q = message.toLowerCase();
  return /(adult|mature|18\+|maior de idade|rpg adulto|história adulta|historia adulta|sensual|erótico|erotico)/i.test(q);
}

export function hasAllowedSafeTopic(message: string) {
  const q = message.toLowerCase();
  return SAFE_KEYWORDS.some((keyword) => q.includes(keyword));
}

export function getKairoSafetySummary(request: KairoAgentRequest) {
  return {
    contentLevel: request.contentLevel ?? "mature",
    ageVerified: Boolean(request.ageVerified),
    adultAllowed: Boolean(request.allowAdultThemes),
    explicitAllowed: Boolean(request.allowExplicitSexualContent),
    protected: true,
  };
}
