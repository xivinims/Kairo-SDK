import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUp, Bot, Globe2, Paperclip, Plus, Settings2, Sparkles, User } from "lucide-react";
import { askKairoAgent, type KairoMessage } from "@/lib/kairo-agent";
import { detectKairoSkills } from "@/lib/kairo-skills";
import { Markdown } from "./markdown";

export function KairoAgentApp() {
  const [messages, setMessages] = useState<KairoMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [contentLevel, setContentLevel] = useState<"safe" | "mature">("safe");
  const skills = useMemo(() => detectKairoSkills(draft), [draft]);

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setSending(true);
    const result = await askKairoAgent({ data: { messages: nextMessages, contentLevel } });
    if (result.ok && result.answer) {
      setMessages((current) => [...current, { role: "assistant", content: result.answer! }]);
    } else {
      setError(result.error ?? "O Kairo não conseguiu responder agora.");
    }
    setSending(false);
  }

  function newChat() {
    setMessages([]);
    setDraft("");
    setError("");
  }

  return (
    <div className="flex h-dvh min-h-0 w-full flex-col bg-[#09090b] text-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] px-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-xl bg-white text-black"><Sparkles className="size-4" /></div>
          <div><p className="text-sm font-semibold tracking-tight">Kairo</p><p className="text-[10px] text-white/35">Agent</p></div>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={newChat} className="flex size-9 items-center justify-center rounded-full text-white/55 hover:bg-white/10 hover:text-white" aria-label="Novo chat"><Plus className="size-4" /></button>
          <button type="button" className="flex size-9 items-center justify-center rounded-full text-white/55 hover:bg-white/10 hover:text-white" aria-label="Configurações"><Settings2 className="size-4" /></button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-8 sm:px-6">
          {messages.length === 0 ? (
            <div className="m-auto w-full max-w-2xl py-16 text-center">
              <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-[20px] bg-white text-black shadow-2xl"><Sparkles className="size-6" /></div>
              <h1 className="text-3xl font-semibold tracking-tight">Como posso ajudar?</h1>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/40">Kairo Agent para criação, código, pesquisa, arquivos, design e tarefas complexas.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 pb-8">
              {messages.map((message, index) => (
                <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "assistant" && <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-black"><Bot className="size-4" /></div>}
                  <div className={message.role === "user" ? "max-w-[82%] rounded-[24px] bg-white/[0.09] px-4 py-3" : "min-w-0 max-w-[88%] pt-1"}>
                    {message.role === "user" ? <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p> : <Markdown text={message.content} className="text-[15px] leading-7 text-white/85" />}
                  </div>
                  {message.role === "user" && <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/10"><User className="size-4 text-white/55" /></div>}
                </div>
              ))}
              {sending && <div className="flex items-center gap-3 text-sm text-white/45"><div className="flex size-8 items-center justify-center rounded-xl bg-white text-black"><Bot className="size-4" /></div><span>Kairo está trabalhando…</span></div>}
            </div>
          )}
        </div>
      </main>

      <div className="mx-auto w-full max-w-3xl px-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-6">
        {error && <div className="mb-2 rounded-2xl bg-red-400/10 px-3 py-2 text-xs text-red-200">{error}</div>}
        <form onSubmit={send} className="rounded-[28px] bg-white/[0.07] p-2 shadow-2xl backdrop-blur-2xl">
          <textarea value={draft} disabled={sending} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} rows={2} placeholder="Pergunte qualquer coisa ao Kairo…" className="w-full resize-none bg-transparent px-3 py-2 text-[15px] outline-none placeholder:text-white/30" />
          <div className="flex items-center justify-between gap-2 px-1 pb-1">
            <div className="flex items-center gap-1">
              <button type="button" className="flex size-9 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white" aria-label="Adicionar arquivo"><Paperclip className="size-4" /></button>
              <button type="button" className="flex size-9 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white" aria-label="Pesquisa web"><Globe2 className="size-4" /></button>
              <select value={contentLevel} onChange={(e) => setContentLevel(e.target.value as "safe" | "mature")} className="rounded-full bg-transparent px-2 py-1 text-[10px] text-white/40 outline-none"><option value="safe" className="bg-zinc-900">Seguro</option><option value="mature" className="bg-zinc-900">Maduro</option></select>
              <span className="hidden text-[10px] text-white/25 sm:inline">{skills.join(" · ")}</span>
            </div>
            <button type="submit" disabled={!draft.trim() || sending} className="flex size-9 items-center justify-center rounded-full bg-white text-black disabled:bg-white/10 disabled:text-white/25" aria-label="Enviar"><ArrowUp className="size-4" /></button>
          </div>
        </form>
        <p className="mt-2 text-center text-[10px] text-white/20">Kairo pode cometer erros. Verifique informações importantes.</p>
      </div>
    </div>
  );
}
