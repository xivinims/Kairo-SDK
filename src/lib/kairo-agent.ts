import { createServerFn } from "@tanstack/react-start";
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

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(20000),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(32),
  contentLevel: z.enum(["safe", "mature"]).default("safe"),
  disabledSkills: z.array(z.string()).max(40).default([]),
});

const BLOCKED_PATTERNS = [
  /child\s+sexual/i,
  /minor\s+sexual/i,
  /sexual\s+exploitation/i,
  /incest/i,
  /bestiality/i,
  /forced\s+sex/i,
  /\brape\b/i,
];

function validateMessages(messages: KairoMessage[]) {
  const latest = messages[messages.length - 1]?.content ?? "";
  if (!latest.trim()) return "Mensagem vazia.";
  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(latest))) return "Solicitação bloqueada por segurança.";
  return null;
}

function buildSystemPrompt(latest: string, contentLevel: KairoContentLevel, disabled: string[]) {
  const skills = detectKairoSkills(latest, disabled);
  return [
    "Você é Kairo, o agente de IA do Kairo App: geral, técnico e criativo.",
    "Responda em português brasileiro quando o usuário falar português; acompanhe o idioma do usuário.",
    "Vá direto ao ponto, sem preâmbulos vazios e sem fingir que executou ações que não executou.",
    "Para programação, entregue soluções completas em blocos de código com a linguagem indicada. Para pesquisa, diferencie fatos de informações a verificar.",
    "Em tarefas complexas, organize o trabalho e faça uma checagem final de consistência, sem expor raciocínio interno privado.",
    "Não invente fontes, links, arquivos, resultados de ferramentas ou ações no computador.",
    `Nível de conteúdo: ${contentLevel}. Não produza conteúdo sexual envolvendo menores, exploração sexual, coerção sexual ou bestialidade.`,
    `Skills ativas: ${skills.join(", ")}.`,
    buildSkillInstructions(latest, disabled),
  ].join("\n");
}

async function generateWithGemini(messages: KairoMessage[], contentLevel: KairoContentLevel, disabled: string[]) {
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
        systemInstruction: { parts: [{ text: buildSystemPrompt(latest, contentLevel, disabled) }] },
        contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
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

  const answer = candidate?.content?.parts?.map((p) => p.text ?? "").join("").trim() ?? "";
  if (!answer) throw new Error("empty");

  const sources = (candidate?.groundingMetadata?.groundingChunks ?? [])
    .map((c) => (c.web?.uri && c.web.title ? `[${c.web.title}](${c.web.uri})` : null))
    .filter((v): v is string => Boolean(v));

  if (sources.length && /(pesquis|not[ií]cia|atual|fonte|hoje|agora)/i.test(latest)) {
    const unique = [...new Set(sources)].slice(0, 5);
    return `${answer}\n\n**Fontes**\n${unique.map((s) => `- ${s}`).join("\n")}`;
  }
  return answer;
}

export const askKairoAgent = createServerFn({ method: "POST" })
  .inputValidator(RequestSchema)
  .handler(async ({ data }): Promise<KairoAgentResult> => {
    const latest = data.messages[data.messages.length - 1]?.content ?? "";
    const skills = detectKairoSkills(latest, data.disabledSkills);
    const validation = validateMessages(data.messages);
    if (validation) return { ok: false, skills, error: validation };

    try {
      return { ok: true, answer: await generateWithGemini(data.messages, data.contentLevel, data.disabledSkills), skills };
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      return {
        ok: false,
        skills,
        error: message === "missing-key"
          ? "GEMINI_API_KEY não está configurada no ambiente do servidor."
          : "Não foi possível executar o Kairo agora.",
      };
    }
  });
