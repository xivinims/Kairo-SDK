import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUp, Bot, Paperclip, User } from "lucide-react";
import { askKairoAgent, type KairoMessage } from "@/lib/kairo-agent";
import { detectKairoSkills } from "@/lib/kairo-skills";
import { Markdown } from "./markdown";
import { KairoSidebar, KairoWelcome, type KairoRecentChat } from "./kairo-home";

// Recent-chat titles are placeholder until chat persistence lands; the
// grouping (Hoje / Ontem / 7 dias) mirrors how the sidebar will read
// real history once conversations are saved.
const PLACEHOLDER_RECENT: KairoRecentChat[] = [];

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

    try {
      const result = await askKairoAgent({ data: { messages: nextMessages, contentLevel } });
      if (result.ok && result.answer) {
        setMessages((current) => [...current, { role: "assistant", content: result.answer! }]);
      } else {
        setError(result.error ?? "O Kairo não conseguiu responder agora.");
      }
    } catch {
      setError("Não foi possível conectar ao Kairo Agent agora.");
    } finally {
      setSending(false);
    }
  }

  function newChat() {
    setMessages([]);
    setDraft("");
    setError("");
  }

  return (
    <div className="flex h-dvh min-h-0 w-full bg-[#09090b] text-white">
      <KairoSidebar recent={PLACEHOLDER_RECENT} onNewChat={newChat} active={messages.length ? "chat" : "home"} />

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-8 sm:px-6">
            {messages.length === 0 ? (
              <KairoWelcome onPickPrompt={(prompt) => setDraft(prompt)} />
            ) : (
              <div className="flex flex-col gap-6 pb-8">
                {messages.map((message, index) => (
                  <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    {message.role === "assistant" && (
                      <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-sky-400 text-white shadow-[0_0_18px_-4px_rgba(168,85,247,0.55)]">
                        <Bot className="size-4" />
                      </div>
                    )}
                    <div
                      className={
                        message.role === "user"
                          ? "max-w-[82%] rounded-[24px] border border-white/10 bg-white/[0.06] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl"
                          : "min-w-0 max-w-[88%] pt-1"
                      }
                    >
                      {message.role === "user" ? (
                        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
                      ) : (
                        <Markdown text={message.content} className="text-[15px] leading-7 text-white/85" />
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/10">
                        <User className="size-4 text-white/55" />
                      </div>
                    )}
                  </div>
                ))}
                {sending && (
                  <div className="flex items-center gap-3 text-sm text-white/45">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-sky-400/20 ring-1 ring-white/10">
                      <img src="/kairo-thinking.png" alt="Kairo pensando" className="size-5 opacity-90" />
                    </div>
                    <span>Kairo está pensando…</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        <div className="mx-auto w-full max-w-3xl px-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-6">
          {error && <div className="mb-2 rounded-2xl bg-red-400/10 px-3 py-2 text-xs text-red-200">{error}</div>}
          <form onSubmit={send} className="rounded-[28px] bg-white/[0.07] p-2 shadow-2xl backdrop-blur-2xl">
            <textarea
              value={draft}
              disabled={sending}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={2}
              placeholder="Pergunte qualquer coisa ao Kairo…"
              className="w-full resize-none bg-transparent px-3 py-2 text-[15px] outline-none placeholder:text-white/30"
            />
            <div className="flex items-center justify-between gap-2 px-1 pb-1">
              <div className="flex items-center gap-2 text-white/40">
                <button type="button" className="flex size-7 items-center justify-center rounded-full hover:bg-white/10 hover:text-white/70" aria-label="Anexar conteúdo">
                  <Paperclip className="size-3.5" />
                </button>
                <select
                  value={contentLevel}
                  onChange={(e) => setContentLevel(e.target.value as "safe" | "mature")}
                  className="rounded-full bg-transparent px-2 py-1 text-[10px] text-white/40 outline-none"
                >
                  <option value="safe" className="bg-zinc-900">Seguro</option>
                  <option value="mature" className="bg-zinc-900">Maduro</option>
                </select>
                <span className="hidden text-[10px] text-white/25 sm:inline">{skills.join(" · ")}</span>
              </div>
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-sky-400 text-white shadow-[0_0_14px_-4px_rgba(168,85,247,0.6)] transition disabled:bg-white/10 disabled:bg-none disabled:text-white/25 disabled:shadow-none"
                aria-label="Enviar"
              >
                <ArrowUp className="size-4" />
              </button>
            </div>
          </form>
          <p className="mt-2 text-center text-[10px] text-white/20">Kairo pode cometer erros. Verifique informações importantes.</p>
        </div>
      </div>
    </div>
  );
}
