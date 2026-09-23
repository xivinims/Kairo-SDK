import { askKairoServer, listKairoModels } from "./kairo-server";
import type { KairoAgentResult, KairoContentLevel, KairoMessage } from "./kairo-agent";

export type Provider = "gemini" | "openai";
export interface KairoConfig { provider: Provider; apiKey: string; model: string; pcAccess: boolean }

const KEY = "kairo:config";
export { listKairoModels };

export function loadConfig(): KairoConfig | null {
  try { const raw = localStorage.getItem(KEY); return raw ? (JSON.parse(raw) as KairoConfig) : null; } catch { return null; }
}
export function saveConfig(cfg: KairoConfig) {
  try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch { /* ignore */ }
}
export function clearConfig() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
export const isDesktop = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const TOOL_RE = /```kairo-tool\s*([\s\S]*?)```/;

/** Executa uma ferramenta local via Tauri, sempre pedindo consentimento antes. */
async function runTool(call: Record<string, unknown>): Promise<string> {
  const tool = String(call.tool);
  const path = String(call.path ?? "");
  let cmd: string;
  let args: Record<string, unknown>;
  let label: string;
  switch (tool) {
    case "list_directory": cmd = "list_directory"; args = { path }; label = `listar a pasta ${path}`; break;
    case "read_file": cmd = "read_file"; args = { path }; label = `ler o arquivo ${path}`; break;
    case "write_file": cmd = "write_file"; args = { path, content: String(call.content ?? "") }; label = `GRAVAR o arquivo ${path}`; break;
    case "run_command": {
      const list = Array.isArray(call.args) ? call.args.map(String) : [];
      cmd = "run_allowed_command"; args = { command: String(call.command ?? ""), args: list, cwd: String(call.cwd ?? "") };
      label = `executar "${String(call.command)} ${list.join(" ")}" em ${String(call.cwd)}`; break;
    }
    default: return "Ferramenta desconhecida.";
  }
  if (!window.confirm(`O Kairo quer ${label}.\n\nPermitir?`)) return "O usuário NEGOU esta ação.";
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const out = await invoke(cmd, args);
    return (typeof out === "string" ? out : JSON.stringify(out)).slice(0, 6000) || "(sem saída)";
  } catch (e) {
    return `Erro: ${String(e)}`;
  }
}

export async function askKairoAgent({ data }: { data: { messages: KairoMessage[]; contentLevel: KairoContentLevel; disabledSkills: string[] } }): Promise<KairoAgentResult> {
  const cfg = loadConfig();
  if (!cfg) return { ok: false, skills: [], error: "Configure sua API key primeiro." };
  const pc = cfg.pcAccess && isDesktop();
  let messages = data.messages;
  for (let step = 0; step < 6; step++) {
    const r = await askKairoServer({ data: { messages: messages.slice(-30), contentLevel: data.contentLevel, disabledSkills: data.disabledSkills, provider: cfg.provider, apiKey: cfg.apiKey, model: cfg.model, pcTools: pc } });
    if (!pc || !r.ok || !r.answer) return r;
    const m = TOOL_RE.exec(r.answer);
    if (!m) return r;
    let out: string;
    try { out = await runTool(JSON.parse(m[1]) as Record<string, unknown>); } catch { out = "Bloco de ferramenta inválido."; }
    messages = [...messages, { role: "assistant", content: r.answer }, { role: "user", content: `Resultado da ferramenta:\n${out}` }];
  }
  return { ok: false, skills: [], error: "O Kairo atingiu o limite de passos nesta tarefa." };
}
