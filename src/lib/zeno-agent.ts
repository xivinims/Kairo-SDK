import { createServerFn } from "@tanstack/react-start";
import { invoke } from "@tauri-apps/api/core";
import { z } from "zod";
import { buildSkillInstructions, detectZenoSkills, type ZenoSkillId } from "./zeno-skills";
import {
  executeZenoTool,
  ZENO_TOOL_DECLARATIONS,
  type ZenoConnectorTokens,
  type ZenoToolEvent,
} from "./zeno-tools";

export type ZenoContentLevel = "safe" | "mature";

export interface ZenoMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ZenoAgentResult {
  ok: boolean;
  answer?: string;
  skills: ZenoSkillId[];
  tools: ZenoToolEvent[];
  error?: string;
}

interface ZenoRequestData {
  messages: ZenoMessage[];
  contentLevel: ZenoContentLevel;
  apiKey?: string;
  model?: string;
  connectors?: ZenoConnectorTokens;
}

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(30000),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(48),
  contentLevel: z.enum(["safe", "mature"]).default("safe"),
  apiKey: z.string().trim().min(10).max(500).optional(),
  model: z.string().trim().regex(/^gemini-[a-zA-Z0-9._-]+$/).default("gemini-2.5-flash"),
  connectors: z.object({
    github: z.string().max(5000).optional(),
    google: z.string().max(5000).optional(),
  }).optional(),
});

const BLOCKED_PATTERNS = [
  /child\s+sexual/i,
  /minor\s+sexual/i,
  /sexual\s+exploitation/i,
  /forced\s+sex/i,
  /rape/i,
];

function validateMessages(messages: ZenoMessage[]) {
  const latest = messages[messages.length - 1]?.content ?? "";
  if (!latest.trim()) return "Mensagem vazia.";
  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(latest))) {
    return "Solicitação bloqueada por segurança.";
  }
  return null;
}

function buildSystemPrompt(latestMessage: string, contentLevel: ZenoContentLevel) {
  const skills = detectZenoSkills(latestMessage);
  return [
    "Você é Zeno, um agente de IA geral, técnico e criativo.",
    "Acompanhe o idioma do usuário; use português brasileiro quando ele falar português.",
    "Seja direto, útil e preciso. Não encha a resposta com apresentação sobre você mesmo.",
    "Você possui skills e ferramentas. Use ferramentas quando elas forem necessárias para obter dados reais.",
    "Nunca diga que executou um comando, abriu um arquivo, acessou GitHub, Drive ou pesquisou algo sem um resultado de ferramenta correspondente.",
    "Quando um conector necessário não estiver disponível, diga exatamente qual conector precisa ser ativado.",
    "Para tarefas complexas, faça planejamento interno e verificação final sem revelar raciocínio privado.",
    "Para programação, preserve a arquitetura existente e entregue mudanças concretas e verificáveis.",
    "Para pesquisa atual, use a pesquisa web nativa quando disponível e cite as fontes retornadas.",
    "A ferramenta de terminal local existe apenas no aplicativo desktop e só aceita comandos permitidos dentro de pastas autorizadas.",
    `Nível de conteúdo: ${contentLevel}.`,
    `Skills ativas: ${skills.join(", ")}.`,
    buildSkillInstructions(latestMessage),
  ].join("\n");
}

type GeminiPart = {
  text?: string;
  functionCall?: { name?: string; args?: Record<string, unknown> };
};

type GeminiCandidate = {
  finishReason?: string;
  content?: { role?: string; parts?: GeminiPart[] };
  groundingMetadata?: {
    groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
  };
};

async function callGemini(params: {
  apiKey: string;
  model: string;
  systemInstruction: string;
  contents: unknown[];
}) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(params.model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": params.apiKey,
      },
      signal: AbortSignal.timeout(60000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: params.systemInstruction }] },
        contents: params.contents,
        tools: [
          { googleSearch: {} },
          { functionDeclarations: ZENO_TOOL_DECLARATIONS },
        ],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.65,
          topP: 0.95,
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`gemini-${response.status}:${detail.slice(0, 180)}`);
  }
  return response.json() as Promise<{ candidates?: GeminiCandidate[] }>;
}

function appendGrounding(answer: string, candidate: GeminiCandidate, latest: string) {
  const sources = (candidate.groundingMetadata?.groundingChunks ?? [])
    .map((chunk) => chunk.web?.uri && chunk.web.title ? `[${chunk.web.title}](${chunk.web.uri})` : null)
    .filter((value): value is string => Boolean(value));

  if (!sources.length || !/(pesquis|not[ií]cia|atual|fonte|hoje|agora|web)/i.test(latest)) return answer;
  const unique = [...new Set(sources)].slice(0, 6);
  return `${answer}\n\n**Fontes**\n${unique.map((source) => `- ${source}`).join("\n")}`;
}

async function generateWithGemini(
  messages: ZenoMessage[],
  contentLevel: ZenoContentLevel,
  apiKey: string,
  model: string,
  connectors: ZenoConnectorTokens,
) {
  const latest = messages[messages.length - 1]?.content ?? "";
  const systemInstruction = buildSystemPrompt(latest, contentLevel);
  const contents: unknown[] = messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
  const toolEvents: ZenoToolEvent[] = [];

  for (let iteration = 0; iteration < 6; iteration += 1) {
    const body = await callGemini({ apiKey, model, systemInstruction, contents });
    const candidate = body.candidates?.[0];

    if (!candidate) throw new Error("empty");
    if (candidate.finishReason === "SAFETY") {
      return {
        answer: "Não posso atender a esse pedido dessa forma. Posso ajudar com uma versão segura da solicitação.",
        toolEvents,
      };
    }

    const parts = candidate.content?.parts ?? [];
    const calls = parts
      .map((part) => part.functionCall)
      .filter((call): call is NonNullable<GeminiPart["functionCall"]> => Boolean(call?.name));

    if (!calls.length) {
      const answer = parts.map((part) => part.text ?? "").join("").trim();
      if (!answer) throw new Error("empty");
      return { answer: appendGrounding(answer, candidate, latest), toolEvents };
    }

    contents.push(candidate.content ?? { role: "model", parts });
    const responseParts = [];

    for (const call of calls) {
      const name = call.name!;
      const execution = await executeZenoTool(name, call.args ?? {}, connectors);
      toolEvents.push(execution.event);
      responseParts.push({
        functionResponse: {
          name,
          response: execution.response,
        },
      });
    }

    contents.push({ role: "user", parts: responseParts });
  }

  throw new Error("tool-loop-limit");
}

const askZenoAgentServer = createServerFn({ method: "POST" })
  .validator(RequestSchema)
  .handler(async ({ data }): Promise<ZenoAgentResult> => {
    const latest = data.messages[data.messages.length - 1]?.content ?? "";
    const skills = detectZenoSkills(latest);
    const validation = validateMessages(data.messages);
    if (validation) return { ok: false, skills, tools: [], error: validation };

    const apiKey = data.apiKey?.trim() || process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return {
        ok: false,
        skills,
        tools: [],
        error: "Adicione sua API key do Gemini nas configurações do Zeno.",
      };
    }

    try {
      const result = await generateWithGemini(
        data.messages,
        data.contentLevel,
        apiKey,
        data.model,
        data.connectors ?? {},
      );
      return { ok: true, answer: result.answer, skills, tools: result.toolEvents };
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      return {
        ok: false,
        skills,
        tools: [],
        error: message.startsWith("gemini-401") || message.startsWith("gemini-403")
          ? "A API key do Gemini foi recusada. Confira a chave e o projeto."
          : message.startsWith("gemini-429")
            ? "O Gemini atingiu o limite da sua chave agora."
            : "Não foi possível executar o Zeno agora.",
      };
    }
  });

export async function askZenoAgent(input: { data: ZenoRequestData }): Promise<ZenoAgentResult> {
  const latest = input.data.messages[input.data.messages.length - 1]?.content ?? "";
  const skills = detectZenoSkills(latest);

  if (import.meta.env.MODE === "desktop") {
    const validation = validateMessages(input.data.messages);
    if (validation) return { ok: false, skills, tools: [], error: validation };

    try {
      return await invoke<ZenoAgentResult>("ask_zeno", {
        request: {
          messages: input.data.messages,
          contentLevel: input.data.contentLevel,
          apiKey: input.data.apiKey,
          model: input.data.model ?? "gemini-2.5-flash",
          systemInstruction: buildSystemPrompt(latest, input.data.contentLevel),
          skills,
        },
      });
    } catch (error) {
      return {
        ok: false,
        skills,
        tools: [],
        error: error instanceof Error ? error.message : "Não foi possível executar o Zeno no desktop.",
      };
    }
  }

  return askZenoAgentServer(input);
}

export function getZenoCapabilities() {
  return {
    modelProvider: "Gemini",
    byok: true,
    nativeWebSearch: true,
    skills: true,
    githubConnector: true,
    googleDriveConnector: true,
    desktopTerminal: true,
  } as const;
}
