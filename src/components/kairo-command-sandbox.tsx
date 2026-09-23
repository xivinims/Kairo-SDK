import { Terminal, X, RotateCcw, ShieldCheck } from "lucide-react";
import { useState } from "react";

const COMMANDS: Record<string, string> = {
  help: "Comandos seguros: help, echo <texto>, pwd, whoami, limits, clear",
  pwd: "/kairo/sandbox",
  whoami: "kairo-agent (sandboxed)",
  limits: "Execução simulada: sem acesso ao sistema, rede, arquivos privados ou shell real.",
};

function runCommand(input: string) {
  const command = input.trim();
  if (!command) return "Digite um comando. Use `help` para ver os comandos seguros.";
  const [name, ...args] = command.split(/\s+/);
  if (name === "echo") return args.join(" ") || "";
  if (name === "clear") return "__CLEAR__";
  return COMMANDS[name] ?? `Comando não permitido: ${name}. O Kairo não executa shell real.`;
}

export function KairoCommandSandbox() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("limits");
  const [output, setOutput] = useState("Pronto para simular um comando seguro.");

  function execute() {
    const next = runCommand(input);
    setOutput(next === "__CLEAR__" ? "" : next);
  }

  return (
    <div className="mx-auto mb-2 w-full max-w-2xl rounded-2xl border border-white/10 bg-white/[0.045] p-2.5 text-white/80 shadow-lg backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-200"><Terminal className="size-3.5" /></div>
        <div className="min-w-0 flex-1"><p className="text-[11px] font-medium">Sandbox do Kairo</p><p className="truncate text-[10px] text-white/40">teste seguro de limites, sem executar shell real</p></div>
        <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-full px-2.5 py-1 text-[10px] text-white/55 hover:bg-white/10 hover:text-white">{open ? "fechar" : "testar"}</button>
      </div>
      {open ? (
        <div className="mt-2.5 space-y-2 border-t border-white/10 pt-2.5">
          <div className="flex gap-1.5">
            <input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") execute(); }} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-mono text-[11px] text-white outline-none focus:border-cyan-200/40" aria-label="Comando seguro" />
            <button type="button" onClick={execute} className="rounded-xl bg-white px-3 text-[11px] font-medium text-black">rodar</button>
            <button type="button" onClick={() => { setInput(""); setOutput(""); }} className="rounded-xl border border-white/10 px-2 text-white/50 hover:text-white" aria-label="Limpar sandbox"><X className="size-3.5" /></button>
          </div>
          <pre className="min-h-8 whitespace-pre-wrap rounded-xl bg-black/25 p-2.5 font-mono text-[10px] leading-relaxed text-emerald-100/80">{output || "—"}</pre>
          <div className="flex items-center gap-1.5 text-[10px] text-white/40"><ShieldCheck className="size-3.5 text-emerald-300/70" /> Apenas comandos allowlisted; nenhum processo do dispositivo é iniciado.</div>
        </div>
      ) : null}
    </div>
  );
}
