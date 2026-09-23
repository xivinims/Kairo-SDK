import { useEffect, useState } from "react";
import { KeyRound, Loader2, Monitor, Settings, Sparkles } from "lucide-react";
import { KairoAgentApp } from "./kairo-agent-app";
import { isDesktop, listKairoModels, loadConfig, saveConfig, type KairoConfig, type Provider } from "@/lib/kairo-client";
import { cn } from "@/lib/utils";

function Setup({ initial, onDone, onCancel }: { initial: KairoConfig | null; onDone: (c: KairoConfig) => void; onCancel?: () => void }) {
  const [provider, setProvider] = useState<Provider>(initial?.provider ?? "gemini");
  const [apiKey, setApiKey] = useState(initial?.apiKey ?? "");
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState(initial?.model ?? "");
  const [pc, setPc] = useState(initial?.pcAccess ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [desktop, setDesktop] = useState(false);
  useEffect(() => setDesktop(isDesktop()), []);

  async function load() {
    setLoading(true); setError(""); setModels([]);
    try {
      const r = await listKairoModels({ data: { provider, apiKey: apiKey.trim() } });
      if (r.ok) { setModels(r.models); setModel(r.models.includes(model) ? model : r.models[0] ?? ""); }
      else setError(r.error ?? "Não foi possível carregar os modelos.");
    } catch { setError("Não foi possível carregar os modelos."); }
    finally { setLoading(false); }
  }

  const field = "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-violet-400/60";
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#09090b] p-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl">
        <div className="mb-5 flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-2xl bg-violet-500"><Sparkles className="size-5" /></div><div><h1 className="text-lg font-semibold">Kairo App</h1><p className="text-xs text-white/40">Conecte sua API para o Kairo responder</p></div></div>

        <div className="mb-3 grid grid-cols-2 gap-2">
          {([["gemini", "Google Gemini"], ["openai", "OpenAI"]] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => { setProvider(id); setModels([]); setModel(""); }} className={cn("press rounded-xl border px-3 py-2 text-sm", provider === id ? "border-violet-400/50 bg-violet-500/15" : "border-white/10 text-white/50")}>{label}</button>
          ))}
        </div>

        <div className="relative"><KeyRound className="absolute left-3 top-3 size-4 text-white/30" /><input type="password" autoComplete="off" className={cn(field, "pl-9")} placeholder="Cole sua API key" value={apiKey} onChange={(e) => { setApiKey(e.target.value); setModels([]); }} /></div>
        <button type="button" disabled={apiKey.trim().length < 10 || loading} onClick={() => void load()} className="press mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm disabled:opacity-40">{loading && <Loader2 className="size-4 animate-spin" />}Carregar modelos</button>
        {error && <p className="mt-2 rounded-xl bg-red-400/10 px-3 py-2 text-xs text-red-200">{error}</p>}

        {models.length > 0 && (
          <div className="mt-4">
            <p className="mb-1.5 text-xs text-white/40">{models.length} modelos disponíveis — escolha um</p>
            <select className={field} value={model} onChange={(e) => setModel(e.target.value)}>{models.map((m) => <option key={m} value={m} className="bg-zinc-900">{m}</option>)}</select>
            <label className={cn("mt-3 flex items-start gap-3 rounded-xl border border-white/10 p-3 text-xs", !desktop && "opacity-50")}>
              <input type="checkbox" className="mt-0.5" disabled={!desktop} checked={pc && desktop} onChange={(e) => setPc(e.target.checked)} />
              <span><span className="flex items-center gap-1.5 text-sm text-white"><Monitor className="size-4" />Permitir acesso ao meu computador</span><span className="mt-1 block text-white/45">{desktop ? "O Kairo só acessa Documents e Projects e pede sua aprovação a cada ação." : "Disponível apenas no app desktop (Tauri)."}</span></span>
            </label>
            <button type="button" disabled={!model} onClick={() => onDone({ provider, apiKey: apiKey.trim(), model, pcAccess: pc && desktop })} className="press mt-4 w-full rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-medium disabled:opacity-40">Começar a usar o Kairo</button>
          </div>
        )}
        {onCancel && <button type="button" onClick={onCancel} className="mt-3 w-full text-xs text-white/40 hover:text-white">Cancelar</button>}
        <p className="mt-4 text-center text-[10px] leading-relaxed text-white/30">Sua chave fica salva apenas neste dispositivo e é enviada ao servidor só para falar com o provedor escolhido.</p>
      </div>
    </div>
  );
}

export function KairoGate() {
  const [cfg, setCfg] = useState<KairoConfig | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  useEffect(() => setCfg(loadConfig()), []);

  if (cfg === undefined) return <div className="h-dvh bg-[#09090b]" />;
  if (!cfg || editing) return <Setup initial={cfg} onDone={(c) => { saveConfig(c); setCfg(c); setEditing(false); }} onCancel={cfg ? () => setEditing(false) : undefined} />;
  return (
    <>
      <KairoAgentApp />
      <button type="button" onClick={() => setEditing(true)} className="press fixed right-3 top-3 z-50 flex max-w-[60vw] items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[11px] text-white/70 backdrop-blur hover:text-white"><Settings className="size-3.5 shrink-0" /><span className="truncate">{cfg.model}{cfg.pcAccess ? " · PC" : ""}</span></button>
    </>
  );
}
