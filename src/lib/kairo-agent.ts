import { createServerFn } from "@tanstack/react-start";
import { invoke } from "@tauri-apps/api/core";
import { z } from "zod";
import { buildSkillInstructions, detectKairoSkills, type KairoSkillId } from "./kairo-skills";

export type KairoContentLevel = "safe" | "mature";

export interface KairoMessage {
  role: "user" | "assistant";
  content: string;
}

export interface KairoAgentResult {
  ok: boolean;
  answer?: string;
  skills: KairoSkillId[];
  error?: string;
}

interface KairoRequestData {
  messages: KairoMessage[];
  contentLevel: KairoContentLevel;
}

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(20000),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(32),
  contentLevel: z.enum(["safe", "mature"]).default("safe"),
});

const BLOCKED_PATTERNS = [
  /child\s+sexual/i,
  /minor\s+sexual/i,
  /sexual\s+exploitation/i,
  /incest/i,
  /bestiality/i,
  /forced\s+sex/i,
  /rape/i,
];

function validateMessages(messages: KairoMessage[]) {
  const latest = messages[messages.length - 1]?.content ?? "";
  if (!latest.trim()) return "Mensagem vazia.";
  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(latest))) {
    return "Solicitação bloqueada por segurança.";
  }
  return null;
}

function buildSystemPrompt(latestMessage: string, contentLevel: KairoContentLevel) {
  const skills = detectKairoSkills(latestMessage);
  return [
    "Você é Kairo Agent, um agente de IA geral, técnico e criativo.",
    "Responda em português brasileiro quando o usuário falar português; acompanhe o idioma usado pelo usuário.",
    "Vá direto ao ponto, sem preâmbulos vazios e sem fingir que executou ações que não executou.",
    "Para programação, entregue soluções completas e práticas. Para pesquisa, diferencie fatos conhecidos de informações que precisam de verificação.",
    "Quando houver uma tarefa complexa, organize mentalmente o trabalho antes de responder e faça uma checagem final de consistência. Não exponha raciocínio interno privado.",
    "Não invente fontes, links, arquivos, resultados de ferramentas ou ações no computador.",
    `Nível de conteúdo: ${contentLevel}. Não produza conteúdo sexual envolvendo menores, exploração sexual, coerção sexual ou bestialidade.`,
    `Skills ativas: ${skills.join(", ")}.`,
    buildSkillInstructions(latestMessage),
  ].join("\n");
}

async function generateWithGemini(messages: KairoMessage[], contentLevel: KairoContentLevel) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("missing-key");

  const latest = messages[messages.length - 1]?.content ?? "";
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(45000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemPrompt(latest, contentLevel) }] },
        contents: messages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
        tools: [{ googleSearch: {} }],
        generationConfig: { maxOutputTokens: 4096, temperature: 0.7, topP: 0.95 },
      }),
    },
  );

  if (!response.ok) throw new Error(`gemini-${response.status}`);

  const body = (await response.json()) as {
    candidates?: Array<{
      finishReason?: string;
      content?: { parts?: Array<{ text?: string }> };
      groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> };
    }>;
  };
  const candidate = body.candidates?.[0];
  if (candidate?.finishReason === "SAFETY") {
    return "Não posso atender a esse pedido dessa forma. Posso ajudar com uma versão segura da solicitação.";
  }

  const answer = candidate?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
  if (!answer) throw new Error("empty");

  const sources = (candidate.groundingMetadata?.groundingChunks ?? [])
    .map((chunk) => chunk.web?.uri && chunk.web.title ? `[${chunk.web.title}](${chunk.web.uri})` : null)
    .filter((value): value is string => Boolean(value));

  if (sources.length && /(pesquis|not[ií]cia|atual|fonte|hoje|agora)/i.test(latest)) {
    const unique = [...new Set(sources)].slice(0, 5);
    return `${answer}\n\n**Fontes**\n${unique.map((source) => `- ${source}`).join("\n")}`;
  }
  return answer;
}

const askKairoAgentServer = createServerFn({ method: "POST" })
  .validator(RequestSchema)
  .handler(async ({ data }): Promise<KairoAgentResult> => {
    const latest = data.messages[data.messages.length - 1]?.content ?? "";
    const skills = detectKairoSkills(latest);
    const validation = validateMessages(data.messages);
    if (validation) return { ok: false, skills, error: validation };

    try {
      return { ok: true, answer: await generateWithGemini(data.messages, data.contentLevel), skills };
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      return {
        ok: false,
        skills,
        error: message === "missing-key"
          ? "GEMINI_API_KEY não está configurada no ambiente do servidor."
          : "Não foi possível executar o Kairo Agent agora.",
      };
    }
  });

export async function askKairoAgent(input: { data: KairoRequestData }): Promise<KairoAgentResult> {
  const latest = input.data.messages[input.data.messages.length - 1]?.content ?? "";
  const skills = detectKairoSkills(latest);

  if (import.meta.env.MODE === "desktop") {
    const validation = validateMessages(input.data.messages);
    if (validation) return { ok: false, skills, error: validation };

    try {
      return await invoke<KairoAgentResult>("ask_kairo", {
        request: {
          messages: input.data.messages,
          contentLevel: input.data.contentLevel,
          systemInstruction: buildSystemPrompt(latest, input.data.contentLevel),
        },
      });
    } catch {
      return {
        ok: false,
        skills,
        error: "Não foi possível executar o Kairo Agent no aplicativo desktop agora.",
      };
    }
  }

  return askKairoAgentServer(input);
}

export function getKairoSafetySummary() {
  return { protected: true, model: "gemini-2.5-flash", nativeWebSearch: true, apiKeyClientExposure: false } as const;
}
