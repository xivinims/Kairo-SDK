import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildSkillInstructions, detectKairoSkills, type KairoSkillId } from "./kairo-skills";
import type { KairoAgentResult, KairoContentLevel, KairoMessage } from "./kairo-agent";

const ProviderSchema = z.enum(["gemini", "openai"]);
const KeySchema = z.string().trim().min(10).max(300);

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(20000),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(32),
  contentLevel: z.enum(["safe", "mature"]).default("safe"),
  disabledSkills: z.array(z.string()).max(40).default([]),
  provider: ProviderSchema,
  apiKey: KeySchema,
  model: z.string().trim().min(1).max(120),
  pcTools: z.boolean().default(false),
});

const BLOCKED_PATTERNS = [/child\s+sexual/i, /minor\s+sexual/i, /sexual\s+exploitation/i, /incest/i, /bestiality/i, /forced\s+sex/i, /\brape\b/i];

const PC_TOOLS_PROMPT = [
  "Você pode usar o computador do usuário SOMENTE emitindo um bloco assim (um por vez, sem texto depois dele):",
  '```kairo-tool\n{"tool":"list_directory","path":"/caminho"}\n```',
  "Ferramentas: list_directory{path}, read_file{path}, write_file{path,content}, run_command{command,args,cwd}.",
  "run_command aceita apenas ls, pwd e git (status, diff, log, show, branch --list, ls-files). Acesso restrito às pastas Documents e Projects.",
  "O usuário aprova cada ação e pode negar. Após o resultado, continue a tarefa ou responda. Nunca finja ter executado algo.",
].join("\n");

function buildSystemPrompt(latest: string, level: KairoContentLevel, disabled: string[], pcTools: boolean) {
  const skills = detectKairoSkills(latest, disabled);
  return [
    "Você é Kairo, o agente de IA do Kairo App: geral, técnico e criativo.",
    "Responda em português brasileiro quando o usuário falar português; acompanhe o idioma do usuário.",
    "Vá direto ao ponto, sem preâmbulos vazios e sem fingir que executou ações que não executou.",
    "Para programação, entregue soluções completas em blocos de código com a linguagem indicada. Para pesquisa, diferencie fatos de informações a verificar.",
    "Não invente fontes, links, arquivos, resultados de ferramentas ou ações no computador.",
    `Nível de conteúdo: ${level}. Não produza conteúdo sexual envolvendo menores, exploração sexual, coerção sexual ou bestialidade.`,
    `Skills ativas: ${skills.join(", ")}.`,
    buildSkillInstructions(latest, disabled),
    pcTools ? PC_TOOLS_PROMPT : "Você não tem acesso ao computador do usuário nesta sessão.",
  ].join("\n");
}

function httpError(status: number) {
  if (status === 401 || status === 403) return "invalid-key";
  if (status === 429) return "rate-limit";
  return `http-${status}`;
}

async function callGemini(d: z.infer<typeof RequestSchema>, system: string) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(d.model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": d.apiKey },
    signal: AbortSignal.timeout(60000),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: d.messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      ...(d.model.startsWith("gemini") ? { tools: [{ googleSearch: {} }] } : {}),
      generationConfig: { maxOutputTokens: 4096, temperature: 0.7, topP: 0.95 },
    }),
  });
  if (!res.ok) throw new Error(httpError(res.status));
  const body = (await res.json()) as { candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string }> } }> };
  const c = body.candidates?.[0];
  if (c?.finishReason === "SAFETY") return "Não posso atender a esse pedido dessa forma. Posso ajudar com uma versão segura da solicitação.";
  return c?.content?.parts?.map((p) => p.text ?? "").join("").trim() ?? "";
}

async function callOpenAI(d: z.infer<typeof RequestSchema>, system: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${d.apiKey}` },
    signal: AbortSignal.timeout(60000),
    body: JSON.stringify({ model: d.model, max_completion_tokens: 4096, messages: [{ role: "system", content: system }, ...d.messages] }),
  });
  if (!res.ok) throw new Error(httpError(res.status));
  const body = (await res.json()) as { choices?: Array<{ message?: { content?: string | null } }> };
  return body.choices?.[0]?.message?.content?.trim() ?? "";
}

export const askKairoServer = createServerFn({ method: "POST" })
  .inputValidator(RequestSchema)
  .handler(async ({ data }): Promise<KairoAgentResult> => {
    const latest = data.messages[data.messages.length - 1]?.content ?? "";
    const skills: KairoSkillId[] = detectKairoSkills(latest, data.disabledSkills);
    if (BLOCKED_PATTERNS.some((p) => p.test(latest))) return { ok: false, skills, error: "Solicitação bloqueada por segurança." };
    try {
      const system = buildSystemPrompt(latest, data.contentLevel, data.disabledSkills, data.pcTools);
      const answer = data.provider === "gemini" ? await callGemini(data, system) : await callOpenAI(data, system);
      if (!answer) return { ok: false, skills, error: "O modelo não retornou resposta. Tente outro modelo." };
      return { ok: true, answer, skills };
    } catch (error) {
      const m = error instanceof Error ? error.message : "";
      const text = m === "invalid-key" ? "API key inválida ou sem permissão." : m === "rate-limit" ? "Limite da sua API atingido. Tente em instantes." : "Não foi possível executar o Kairo agora.";
      return { ok: false, skills, error: text };
    }
  });

export const listKairoModels = createServerFn({ method: "POST" })
  .inputValidator(z.object({ provider: ProviderSchema, apiKey: KeySchema }))
  .handler(async ({ data }): Promise<{ ok: boolean; models: string[]; error?: string }> => {
    try {
      if (data.provider === "gemini") {
        const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=100", { headers: { "x-goog-api-key": data.apiKey }, signal: AbortSignal.timeout(20000) });
        if (!res.ok) throw new Error(httpError(res.status));
        const body = (await res.json()) as { models?: Array<{ name: string; supportedGenerationMethods?: string[] }> };
        const models = (body.models ?? []).filter((m) => m.supportedGenerationMethods?.includes("generateContent")).map((m) => m.name.replace(/^models\//, "")).sort();
        return { ok: models.length > 0, models, error: models.length ? undefined : "Nenhum modelo disponível para esta chave." };
      }
      const res = await fetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${data.apiKey}` }, signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(httpError(res.status));
      const body = (await res.json()) as { data?: Array<{ id: string }> };
      const models = (body.data ?? []).map((m) => m.id).filter((id) => /^(gpt|o\d|chatgpt)/.test(id) && !/embed|whisper|tts|image|audio|realtime|moderation|transcribe|search|instruct/.test(id)).sort();
      return { ok: models.length > 0, models, error: models.length ? undefined : "Nenhum modelo de chat disponível para esta chave." };
    } catch (error) {
      const m = error instanceof Error ? error.message : "";
      return { ok: false, models: [], error: m === "invalid-key" ? "API key inválida ou sem permissão." : "Não foi possível carregar os modelos." };
    }
  });

export type { KairoMessage };
